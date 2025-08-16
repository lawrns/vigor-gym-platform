/**
 * k6 Smoke Test
 * 
 * Quick validation that core endpoints are responding correctly.
 * Runs with low load to catch basic regressions.
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  vus: 5,                    // 5 virtual users
  duration: '30s',           // Run for 30 seconds
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
    errors: ['rate<0.01'],            // Custom error rate under 1%
  },
};

// Environment configuration
const WEB_ORIGIN = __ENV.WEB_ORIGIN || 'http://localhost:7777';
const API_ORIGIN = __ENV.API_ORIGIN || 'http://localhost:4001';

export default function () {
  const requestId = `smoke-${__VU}-${__ITER}`;
  
  // Test 1: Homepage load
  let response = http.get(`${WEB_ORIGIN}/`, {
    headers: {
      'x-request-id': requestId,
      'User-Agent': 'k6-smoke-test/1.0',
    },
  });
  
  const homePageOk = check(response, {
    'homepage status is 200': (r) => r.status === 200,
    'homepage contains Vigor': (r) => r.body.includes('Vigor'),
    'homepage loads under 2s': (r) => r.timings.duration < 2000,
  });
  
  errorRate.add(!homePageOk);
  responseTime.add(response.timings.duration);
  
  sleep(0.5);
  
  // Test 2: API health check
  response = http.get(`${API_ORIGIN}/health`, {
    headers: {
      'x-request-id': requestId,
    },
  });
  
  const apiHealthOk = check(response, {
    'api health status is 200': (r) => r.status === 200,
    'api health response is json': (r) => r.headers['Content-Type']?.includes('application/json'),
    'api health loads under 500ms': (r) => r.timings.duration < 500,
  });
  
  errorRate.add(!apiHealthOk);
  responseTime.add(response.timings.duration);
  
  sleep(0.5);
  
  // Test 3: Guest auth check (should return 401)
  response = http.get(`${WEB_ORIGIN}/auth/me`, {
    headers: {
      'x-request-id': requestId,
    },
  });
  
  const guestAuthOk = check(response, {
    'guest auth returns 401': (r) => r.status === 401,
    'guest auth has json response': (r) => r.headers['Content-Type']?.includes('application/json'),
    'guest auth loads under 200ms': (r) => r.timings.duration < 200,
  });
  
  errorRate.add(!guestAuthOk);
  responseTime.add(response.timings.duration);
  
  sleep(1);
}

export function handleSummary(data) {
  return {
    'smoke-test-results.json': JSON.stringify(data, null, 2),
    stdout: `
🔥 k6 Smoke Test Results
========================
Duration: ${data.metrics.iteration_duration.avg.toFixed(2)}ms avg
Requests: ${data.metrics.http_reqs.count} total
Errors: ${data.metrics.http_req_failed.rate * 100}% rate
Response Time: p95=${data.metrics.http_req_duration['p(95)'].toFixed(2)}ms

${data.metrics.http_req_failed.rate > 0.01 ? '❌ ERROR RATE TOO HIGH' : '✅ Error rate OK'}
${data.metrics.http_req_duration['p(95)'] > 500 ? '❌ RESPONSE TIME TOO SLOW' : '✅ Response time OK'}
`,
  };
}
