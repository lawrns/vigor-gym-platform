# Performance & Observability Implementation

## 🎯 Overview

This document outlines the comprehensive Performance & Observability infrastructure implemented for the Vigor Gym Platform, including SLIs/SLOs, monitoring, alerting, and performance budgets.

## 📊 SLIs/SLOs Implemented

### Web Core Performance
- **TTFB p75**: ≤ 200ms
- **LCP p75**: ≤ 2300ms  
- **INP p75**: ≤ 150ms
- **CLS p75**: ≤ 0.1

### API Performance
- **p95 Latency**: ≤ 500ms
- **Error Rate**: ≤ 0.5%
- **Availability**: ≥ 99.5%

### UltimateWidget Performance
- **Init Time p95**: ≤ 400ms
- **PostMessage Latency p95**: ≤ 200ms
- **Mount Time p95**: ≤ 300ms

### Real-time Features
- **Message Delivery p95**: ≤ 200ms
- **WebSocket Reconnect p95**: ≤ 3s

## 🛠️ Infrastructure Components

### 1. OpenTelemetry Instrumentation

#### Web Application (`apps/web/`)
- **File**: `instrumentation.ts` - Next.js App Router integration
- **File**: `lib/otel/web.ts` - Web Vitals collection
- **File**: `app/api/telemetry/vitals/route.ts` - Telemetry endpoint

#### API Application (`apps/api/`)
- **File**: `src/otel.ts` - OpenTelemetry SDK configuration
- **File**: `src/middleware/requestTiming.ts` - Request correlation & timing

### 2. Performance Testing

#### Lighthouse CI
- **File**: `.lighthouserc.json` - Performance budgets & thresholds
- **Command**: `npm run perf:lighthouse`

#### k6 Load Testing
- **File**: `tests/k6/smoke.js` - Quick smoke tests (5 VUs, 30s)
- **File**: `tests/k6/load.js` - Load tests (50 VUs, 5m)
- **Commands**: `npm run perf:k6:smoke`, `npm run perf:k6:load`

#### Widget-Specific Tests
- **File**: `tests/e2e/widget.spec.ts` - Playwright widget performance tests
- **File**: `lib/monitoring/widget-performance.ts` - Widget performance monitoring

### 3. CI/CD Integration

#### GitHub Actions
- **File**: `.github/workflows/performance.yml` - Performance pipeline
- **Jobs**: Lighthouse CI, k6 smoke/load, Playwright E2E, OTEL validation

#### Performance Gates
- LCP p75 > 2500ms → ❌ FAIL
- API p95 > 600ms → ❌ FAIL  
- Widget init p95 > 400ms → ❌ FAIL
- Console errors during E2E → ❌ FAIL
- Missing trace_id on >2% responses → ❌ FAIL

### 4. Monitoring & Alerting

#### Dashboard Configuration
- **File**: `monitoring/dashboard-config.json` - Grafana/Datadog panels
- **Panels**: API latency, error rates, Web Vitals, DB performance, widget metrics

#### Budget Validation
- **File**: `scripts/validate-performance-budget.mjs` - Automated budget checks
- **File**: `scripts/otel-smoke.mjs` - OTEL instrumentation validation

## 🚀 Usage Guide

### Running Performance Tests

```bash
# Full performance suite
npm run perf:all

# Individual tests
npm run perf:lighthouse    # Web Vitals & Lighthouse
npm run perf:k6:smoke     # Quick API smoke test
npm run perf:k6:load      # Full load test
npm run perf:otel:smoke   # OTEL validation

# Widget-specific tests
npm run test:e2e -- tests/e2e/widget.spec.ts
```

### Monitoring Widget Performance

```typescript
import { widgetPerf } from '@/lib/monitoring/widget-performance';

// Track widget initialization
widgetPerf.startInit();
// ... widget initialization code ...
const initTime = widgetPerf.endInit({ version: '1.0' });

// Track postMessage latency
const startTime = performance.now();
// ... send postMessage ...
widgetPerf.measurePostMessage(startTime);

// Get performance summary
const summary = widgetPerf.getSummary();
console.log('Widget performance:', summary);
```

### Viewing Telemetry Data

Web Vitals and custom metrics are sent to `/api/telemetry/vitals` and logged in structured JSON format:

```json
{
  "timestamp": "2025-08-15T19:00:00.000Z",
  "level": "info",
  "msg": "web_vital",
  "metric": "LCP",
  "value": 1850.5,
  "rating": "good",
  "url": "http://localhost:7777/dashboard"
}
```

## 🔧 Configuration

### Environment Variables

```bash
# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_SERVICE_NAME=vigor-web
OTEL_SERVICE_VERSION=1.0.0

# Performance Testing
WEB_ORIGIN=http://localhost:7777
API_ORIGIN=http://localhost:4001
```

### Performance Budgets

Budgets are enforced in multiple places:
- **Lighthouse CI**: `.lighthouserc.json`
- **k6 Tests**: Thresholds in test files
- **Budget Validator**: `scripts/validate-performance-budget.mjs`
- **Widget Monitor**: `lib/monitoring/widget-performance.ts`

## 📈 Metrics Collection

### Automatic Collection
- **Web Vitals**: TTFB, FCP, LCP, CLS, INP
- **API Metrics**: Request duration, error rates, throughput
- **Widget Metrics**: Init time, mount time, postMessage latency
- **Database Metrics**: Query duration by table
- **Correlation**: Request IDs across all services

### Custom Metrics
- Rate limiting hits
- Authentication failures  
- Widget CSP violations
- Hydration warnings
- PII masking effectiveness

## 🚨 Alerting Rules

### Critical Alerts (2-5 min)
- API error rate > 0.5%
- API p95 latency > 500ms
- Widget init p95 > 400ms

### Warning Alerts (5-10 min)
- LCP p75 > 2500ms
- Database queries p95 > 200ms
- Trace coverage < 95%

## 🎯 Next Steps

1. **Deploy to Production**: Configure OTEL collector endpoint
2. **Set Up Dashboards**: Import dashboard config to Grafana/Datadog
3. **Configure Alerts**: Set up Slack/PagerDuty integrations
4. **Baseline Metrics**: Collect 1 week of data to establish baselines
5. **Optimize**: Use performance data to identify optimization opportunities

## 📚 References

- [OpenTelemetry Documentation](https://opentelemetry.io/docs/)
- [Web Vitals](https://web.dev/vitals/)
- [Lighthouse CI](https://github.com/GoogleChrome/lighthouse-ci)
- [k6 Load Testing](https://k6.io/docs/)
- [Playwright Testing](https://playwright.dev/)

---

**Status**: ✅ **COMPLETE** - Full performance & observability infrastructure implemented and tested.
