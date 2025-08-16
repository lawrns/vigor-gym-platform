# 🚀 Staging Deployment Guide

This guide covers the complete staging deployment process for the Vigor Gym Platform, including infrastructure setup, deployment procedures, and validation steps.

## 📋 Overview

The staging environment provides a production-like environment for validating all features before pilot gym deployment. It includes:

- **Complete application stack** (Web + API + Database)
- **Production-like infrastructure** (Docker, reverse proxy, SSL)
- **Comprehensive monitoring** (Metrics, logs, health checks)
- **Automated testing** (E2E tests, health validation)
- **Security hardening** (Headers, CSP, rate limiting)

## 🏗️ Infrastructure Components

### Core Services
- **Web Application** - Next.js SSR application
- **API Server** - Node.js/Express API with structured logging
- **Database** - Supabase PostgreSQL with migrations
- **Cache** - Redis for session and rate limiting
- **Reverse Proxy** - Traefik with SSL termination

### Monitoring Stack
- **Prometheus** - Metrics collection
- **Grafana** - Dashboards and visualization
- **Structured Logs** - Pino-based logging with PII masking
- **Health Checks** - Comprehensive service validation

## 🔧 Prerequisites

### Required Tools
```bash
# Node.js 18.17.0 or higher
node --version

# Docker and Docker Compose
docker --version
docker-compose --version

# Git
git --version
```

### Environment Setup
1. **Copy staging environment template**:
   ```bash
   cp .env.staging.example .env.staging
   ```

2. **Configure environment variables**:
   - Database connection (Supabase)
   - Stripe test keys
   - JWT secrets
   - Domain configuration
   - Monitoring credentials

3. **Set up DNS records**:
   - `staging.vigor-gym.com` → Web application
   - `api-staging.vigor-gym.com` → API server
   - `grafana-staging.vigor-gym.com` → Monitoring dashboard

## 🚀 Deployment Methods

### Method 1: Automated Deployment (Recommended)

**GitHub Actions Workflow**:
```bash
# Trigger deployment via push to staging branch
git push origin feat/p0w3-golive-payments-depth

# Or trigger manually
gh workflow run "Deploy to Staging"
```

**Local Deployment Script**:
```bash
# Run complete deployment process
npm run deploy:staging

# Or step by step
./scripts/deploy-staging.sh
```

### Method 2: Docker Compose

**Quick Start**:
```bash
# Build and start all services
npm run docker:staging

# Or manually
docker-compose -f docker-compose.staging.yml up -d
```

**Service Management**:
```bash
# View logs
docker-compose -f docker-compose.staging.yml logs -f

# Restart specific service
docker-compose -f docker-compose.staging.yml restart api

# Stop all services
docker-compose -f docker-compose.staging.yml down
```

### Method 3: Manual Deployment

**Build Applications**:
```bash
# Install dependencies
npm ci

# Build for staging
npm run build:staging

# Run database migrations
cd apps/api && npx prisma migrate deploy
```

**Start Services**:
```bash
# Start API server
cd apps/api && NODE_ENV=staging npm start

# Start web application
cd apps/web && NODE_ENV=staging npm start
```

## ✅ Validation Process

### 1. Health Checks
```bash
# Run comprehensive health validation
npm run health:staging

# Or manually
./scripts/staging-health-check.sh
```

**Health Check Coverage**:
- ✅ Basic connectivity (Web + API)
- ✅ Authentication flow
- ✅ Database connectivity
- ✅ Billing integration (Stripe)
- ✅ Observability features
- ✅ SSR dashboard performance
- ✅ Webhook endpoints
- ✅ Security headers

### 2. E2E Testing
```bash
# Run staging E2E test suite
npm run e2e:staging

# View test results
npm run e2e:staging:report
```

**Test Coverage**:
- 🧪 **Saved Cards** - SetupIntent flow, payment methods
- 🧪 **Observability** - Metrics dashboard, API endpoints
- 🧪 **SSR Dashboard** - Performance, client hydration
- 🧪 **Authentication** - Login, session management
- 🧪 **Billing** - Stripe integration, webhooks

### 3. Performance Validation
```bash
# Check dashboard load times
curl -w "@curl-format.txt" -o /dev/null -s "https://staging.vigor-gym.com/dashboard"

# API response times
curl -w "@curl-format.txt" -o /dev/null -s "https://api-staging.vigor-gym.com/v1/metrics/health"
```

**Performance Targets**:
- 📈 Dashboard LCP < 2.5s
- 📈 API P95 < 500ms
- 📈 Health checks < 1s

## 🔍 Monitoring & Observability

### Access Dashboards
- **Application**: https://staging.vigor-gym.com
- **API Health**: https://api-staging.vigor-gym.com/health
- **Metrics**: https://api-staging.vigor-gym.com/v1/metrics/health
- **Grafana**: https://grafana-staging.vigor-gym.com
- **Traefik**: https://traefik-staging.vigor-gym.com

### Key Metrics
```bash
# System health
curl https://api-staging.vigor-gym.com/v1/metrics/health

# Authentication metrics
curl -H "Authorization: Bearer $TOKEN" \
  https://api-staging.vigor-gym.com/v1/metrics/auth

# Billing metrics
curl -H "Authorization: Bearer $TOKEN" \
  https://api-staging.vigor-gym.com/v1/metrics/billing
```

### Log Analysis
```bash
# View application logs
docker-compose -f docker-compose.staging.yml logs api | grep ERROR

# Check structured logs
docker-compose -f docker-compose.staging.yml logs api | jq '.'
```

## 🔒 Security Validation

### Security Headers
```bash
# Check security headers
curl -I https://staging.vigor-gym.com

# Validate CSP
curl -H "Content-Security-Policy-Report-Only: default-src 'self'" \
  https://staging.vigor-gym.com
```

### SSL/TLS Validation
```bash
# Check SSL certificate
openssl s_client -connect staging.vigor-gym.com:443 -servername staging.vigor-gym.com

# Validate HSTS
curl -I https://staging.vigor-gym.com | grep -i strict-transport-security
```

## 🐛 Troubleshooting

### Common Issues

**1. Database Connection Errors**
```bash
# Check database connectivity
cd apps/api && npx prisma db pull

# Verify migrations
npx prisma migrate status
```

**2. Authentication Issues**
```bash
# Test login endpoint
curl -X POST https://api-staging.vigor-gym.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@testgym.mx","password":"TestPassword123!"}'
```

**3. Stripe Integration Issues**
```bash
# Test webhook endpoint
curl -X POST https://api-staging.vigor-gym.com/v1/billing/webhook/stripe \
  -H "Stripe-Signature: test" \
  -d '{"test": "webhook"}'
```

**4. Performance Issues**
```bash
# Check resource usage
docker stats

# Analyze bundle size
cd apps/web && ANALYZE=true npm run build
```

### Log Analysis
```bash
# Application errors
docker-compose logs api | grep -i error

# Authentication events
docker-compose logs api | grep -i "auth_failure\|login"

# Performance metrics
docker-compose logs api | grep -i "response_time"
```

## 📊 Quality Gates

Before considering staging deployment successful, ensure:

### ✅ Functional Requirements
- [ ] All core features working (auth, billing, dashboard)
- [ ] Saved cards flow complete (SetupIntent)
- [ ] Observability dashboard functional
- [ ] SSR dashboard performance optimal

### ✅ Performance Requirements
- [ ] Dashboard LCP < 2.5s median
- [ ] API P95 < 500ms for core endpoints
- [ ] E2E test pass rate > 95%

### ✅ Security Requirements
- [ ] All security headers present
- [ ] SSL/TLS properly configured
- [ ] Rate limiting functional
- [ ] PII masking in logs

### ✅ Reliability Requirements
- [ ] Health checks passing
- [ ] Zero unhandled errors in logs
- [ ] Webhook processing working
- [ ] Database migrations successful

## 🎯 Next Steps

After successful staging validation:

1. **Tag Release**: `git tag v0.3.0-rc1`
2. **Pilot Preparation**: Share staging credentials with pilot gyms
3. **Production Planning**: Prepare production deployment
4. **Monitoring Setup**: Configure production alerts
5. **Backup Strategy**: Implement production backup procedures

## 📞 Support

For deployment issues:
- **DevOps Team**: devops@vigor-gym.com
- **Slack Channel**: #staging-deployment
- **Documentation**: This guide and inline code comments
- **Health Dashboard**: https://grafana-staging.vigor-gym.com
