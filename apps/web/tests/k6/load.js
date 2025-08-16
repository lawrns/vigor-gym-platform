/**
 * k6 Load Test
 * 
 * Simulates realistic user load on critical application flows.
 * Tests authentication, dashboard access, and widget performance.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const authLatency = new Trend('auth_latency');
const dashboardLatency = new Trend('dashboard_latency');
const widgetLatency = new Trend('widget_latency');
const authFailures = new Counter('auth_failures');

// Load test configuration
export const options = {
  stages: [
    { duration: '1m', target: 10 },   // Ramp up to 10 users
    { duration: '3m', target: 50 },   // Stay at 50 users for 3 minutes
    { duration: '1m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<600'],     // 95% under 600ms (SLO: 500ms + buffer)
    http_req_failed: ['rate<0.005'],      // Error rate under 0.5% (SLO)
    auth_latency: ['p(95)<300'],          // Auth should be fast
    dashboard_latency: ['p(95)<800'],     // Dashboard can be slower
    widget_latency: ['p(95)<400'],        // Widget init under 400ms (SLO)
    errors: ['rate<0.005'],
  },
};

// Environment configuration
const WEB_ORIGIN = __ENV.WEB_ORIGIN || 'http://localhost:7777';
const API_ORIGIN = __ENV.API_ORIGIN || 'http://localhost:4001';

// Test user credentials
const TEST_USERS = [
  { email: 'admin@testgym.mx', password: 'TestPassword123!' },
  { email: 'user1@testgym.mx', password: 'TestPassword123!' },
  { email: 'user2@testgym.mx', password: 'TestPassword123!' },
];

export default function () {
  const requestId = `load-${__VU}-${__ITER}`;
  const user = TEST_USERS[__VU % TEST_USERS.length];
  
  // Simulate user session
  userSession(requestId, user);
  
  // Think time between sessions
  sleep(Math.random() * 3 + 1); // 1-4 seconds
}

function userSession(requestId, user) {
  const jar = http.cookieJar();
  const headers = {
    'x-request-id': requestId,
    'User-Agent': 'k6-load-test/1.0',
  };

  // Step 1: Visit homepage
  let response = http.get(`${WEB_ORIGIN}/`, { headers });
  check(response, {
    'homepage loads': (r) => r.status === 200,
  });
  
  sleep(0.5);

  // Step 2: Login
  const loginStart = Date.now();
  response = http.post(`${WEB_ORIGIN}/auth/login`, 
    JSON.stringify({
      email: user.email,
      password: user.password,
    }), 
    {
      headers: {
        ...headers,
        'Content-Type': 'application/json',
      },
      jar,
    }
  );
  
  const loginSuccess = check(response, {
    'login succeeds': (r) => r.status === 200,
    'login returns user data': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.user && data.user.email === user.email;
      } catch {
        return false;
      }
    },
  });
  
  if (!loginSuccess) {
    authFailures.add(1);
    return; // Skip rest of session if login fails
  }
  
  authLatency.add(Date.now() - loginStart);
  sleep(0.5);

  // Step 3: Access dashboard
  const dashboardStart = Date.now();
  response = http.get(`${WEB_ORIGIN}/dashboard`, { 
    headers,
    jar,
  });
  
  const dashboardOk = check(response, {
    'dashboard loads': (r) => r.status === 200 || r.status === 302, // May redirect
    'dashboard has content': (r) => r.body.length > 1000,
  });
  
  if (dashboardOk) {
    dashboardLatency.add(Date.now() - dashboardStart);
  }
  
  sleep(1);

  // Step 4: Test widget performance (if available)
  const widgetStart = Date.now();
  response = http.get(`${WEB_ORIGIN}/api/widget/config`, {
    headers,
    jar,
  });
  
  const widgetOk = check(response, {
    'widget config loads': (r) => r.status === 200 || r.status === 404, // May not exist yet
  });
  
  if (response.status === 200) {
    widgetLatency.add(Date.now() - widgetStart);
  }
  
  sleep(0.5);

  // Step 5: Check auth status
  response = http.get(`${WEB_ORIGIN}/auth/me`, {
    headers,
    jar,
  });
  
  check(response, {
    'auth check succeeds': (r) => r.status === 200,
    'auth returns user': (r) => {
      try {
        const data = JSON.parse(r.body);
        return data.user && data.user.email;
      } catch {
        return false;
      }
    },
  });

  // Step 6: Logout
  response = http.post(`${WEB_ORIGIN}/auth/logout`, null, {
    headers,
    jar,
  });
  
  check(response, {
    'logout succeeds': (r) => r.status === 200 || r.status === 302,
  });
}

export function handleSummary(data) {
  const summary = {
    duration: data.state.testRunDurationMs,
    requests: data.metrics.http_reqs.count,
    errorRate: data.metrics.http_req_failed.rate,
    p95Latency: data.metrics.http_req_duration['p(95)'],
    authP95: data.metrics.auth_latency ? data.metrics.auth_latency['p(95)'] : 0,
    dashboardP95: data.metrics.dashboard_latency ? data.metrics.dashboard_latency['p(95)'] : 0,
    widgetP95: data.metrics.widget_latency ? data.metrics.widget_latency['p(95)'] : 0,
    authFailures: data.metrics.auth_failures ? data.metrics.auth_failures.count : 0,
  };

  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.json': JSON.stringify(summary, null, 2),
    stdout: `
🚀 k6 Load Test Results
=======================
Duration: ${(summary.duration / 1000).toFixed(1)}s
Requests: ${summary.requests} total
Error Rate: ${(summary.errorRate * 100).toFixed(2)}%
Auth Failures: ${summary.authFailures}

Latency (p95):
- Overall: ${summary.p95Latency.toFixed(2)}ms
- Auth: ${summary.authP95.toFixed(2)}ms  
- Dashboard: ${summary.dashboardP95.toFixed(2)}ms
- Widget: ${summary.widgetP95.toFixed(2)}ms

SLO Status:
${summary.errorRate > 0.005 ? '❌ ERROR RATE VIOLATION' : '✅ Error rate OK'}
${summary.p95Latency > 600 ? '❌ LATENCY VIOLATION' : '✅ Latency OK'}
${summary.widgetP95 > 400 ? '❌ WIDGET PERFORMANCE VIOLATION' : '✅ Widget performance OK'}
`,
  };
}
