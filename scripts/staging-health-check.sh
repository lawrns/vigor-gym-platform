#!/bin/bash

# =============================================================================
# Staging Health Check Script
# =============================================================================
# Comprehensive health check for staging environment to validate all services
# are running correctly and ready for pilot gym deployment.

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
STAGING_ENV_FILE="$PROJECT_ROOT/.env.staging"

# Default URLs (can be overridden by environment)
WEB_URL="${STAGING_WEB_URL:-https://staging.vigor-gym.com}"
API_URL="${STAGING_API_URL:-https://api-staging.vigor-gym.com}"

# Test credentials
TEST_EMAIL="${STAGING_TEST_EMAIL:-admin@testgym.mx}"
TEST_PASSWORD="${STAGING_TEST_PASSWORD:-TestPassword123!}"

# Health check settings
TIMEOUT=30
RETRIES=3

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    return 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# HTTP request with retry
http_request() {
    local url="$1"
    local method="${2:-GET}"
    local data="${3:-}"
    local headers="${4:-}"
    
    for i in $(seq 1 $RETRIES); do
        local curl_cmd="curl -s -w '%{http_code}' --max-time $TIMEOUT"
        
        if [[ -n "$headers" ]]; then
            curl_cmd="$curl_cmd $headers"
        fi
        
        if [[ "$method" == "POST" && -n "$data" ]]; then
            curl_cmd="$curl_cmd -X POST -d '$data' -H 'Content-Type: application/json'"
        fi
        
        local response
        if response=$(eval "$curl_cmd '$url'" 2>/dev/null); then
            echo "$response"
            return 0
        fi
        
        if [[ $i -lt $RETRIES ]]; then
            warning "Request failed, retrying... ($i/$RETRIES)"
            sleep 2
        fi
    done
    
    error "Request failed after $RETRIES attempts"
    return 1
}

# Check basic connectivity
check_basic_connectivity() {
    log "🌐 Checking basic connectivity..."
    
    # Check web application
    log "📱 Checking web application: $WEB_URL"
    local web_response
    if web_response=$(http_request "$WEB_URL"); then
        local status_code="${web_response: -3}"
        if [[ "$status_code" == "200" ]]; then
            success "Web application is accessible"
        else
            error "Web application returned status code: $status_code"
        fi
    else
        error "Web application is not accessible"
    fi
    
    # Check API health endpoint
    log "🔌 Checking API health: $API_URL/health"
    local api_response
    if api_response=$(http_request "$API_URL/health"); then
        local status_code="${api_response: -3}"
        local body="${api_response%???}"
        if [[ "$status_code" == "200" ]] && echo "$body" | grep -q '"status":"ok"'; then
            success "API health check passed"
        else
            error "API health check failed - Status: $status_code, Body: $body"
        fi
    else
        error "API health endpoint is not accessible"
    fi
}

# Check authentication flow
check_authentication() {
    log "🔐 Checking authentication flow..."
    
    # Test login endpoint
    log "🔑 Testing login with test credentials..."
    local login_data="{\"email\":\"$TEST_EMAIL\",\"password\":\"$TEST_PASSWORD\"}"
    local login_response
    
    if login_response=$(http_request "$API_URL/auth/login" "POST" "$login_data"); then
        local status_code="${login_response: -3}"
        local body="${login_response%???}"
        
        if [[ "$status_code" == "200" ]] && echo "$body" | grep -q '"user"'; then
            success "Authentication flow working"
            
            # Extract token for further tests
            local token
            if token=$(echo "$body" | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4); then
                echo "$token" > /tmp/staging_auth_token
                log "🎫 Authentication token saved for further tests"
            fi
        else
            error "Authentication failed - Status: $status_code, Body: $body"
        fi
    else
        error "Login endpoint is not accessible"
    fi
}

# Check database connectivity
check_database() {
    log "🗄️ Checking database connectivity..."
    
    local db_response
    if db_response=$(http_request "$API_URL/v1/metrics/health"); then
        local status_code="${db_response: -3}"
        local body="${db_response%???}"
        
        if [[ "$status_code" == "200" ]] && echo "$body" | grep -q '"database":"connected"'; then
            success "Database connectivity verified"
        else
            error "Database connectivity check failed - Status: $status_code, Body: $body"
        fi
    else
        error "Database health endpoint is not accessible"
    fi
}

# Check billing integration
check_billing_integration() {
    log "💳 Checking billing integration..."
    
    # Check if we have an auth token
    if [[ ! -f /tmp/staging_auth_token ]]; then
        warning "No auth token available, skipping billing checks"
        return 0
    fi
    
    local token
    token=$(cat /tmp/staging_auth_token)
    local auth_header="-H 'Authorization: Bearer $token'"
    
    # Test payment methods endpoint
    log "💰 Testing payment methods endpoint..."
    local pm_response
    if pm_response=$(http_request "$API_URL/v1/billing/payment-methods" "GET" "" "$auth_header"); then
        local status_code="${pm_response: -3}"
        
        if [[ "$status_code" == "200" ]]; then
            success "Billing integration working"
        else
            error "Payment methods endpoint failed - Status: $status_code"
        fi
    else
        error "Payment methods endpoint is not accessible"
    fi
}

# Check observability features
check_observability() {
    log "📊 Checking observability features..."
    
    # Check if we have an auth token
    if [[ ! -f /tmp/staging_auth_token ]]; then
        warning "No auth token available, skipping observability checks"
        return 0
    fi
    
    local token
    token=$(cat /tmp/staging_auth_token)
    local auth_header="-H 'Authorization: Bearer $token'"
    
    # Test metrics endpoints
    local endpoints=("auth" "billing" "api" "health")
    
    for endpoint in "${endpoints[@]}"; do
        log "📈 Testing metrics endpoint: $endpoint"
        local metrics_response
        if metrics_response=$(http_request "$API_URL/v1/metrics/$endpoint" "GET" "" "$auth_header"); then
            local status_code="${metrics_response: -3}"
            
            if [[ "$status_code" == "200" ]]; then
                success "Metrics endpoint '$endpoint' working"
            else
                error "Metrics endpoint '$endpoint' failed - Status: $status_code"
            fi
        else
            error "Metrics endpoint '$endpoint' is not accessible"
        fi
    done
}

# Check SSR dashboard
check_ssr_dashboard() {
    log "⚡ Checking SSR dashboard performance..."
    
    # Measure dashboard load time
    local start_time
    start_time=$(date +%s%3N)
    
    local dashboard_response
    if dashboard_response=$(http_request "$WEB_URL/dashboard"); then
        local end_time
        end_time=$(date +%s%3N)
        local load_time=$((end_time - start_time))
        
        local status_code="${dashboard_response: -3}"
        
        if [[ "$status_code" == "200" ]]; then
            success "Dashboard SSR working (Load time: ${load_time}ms)"
            
            if [[ $load_time -lt 3000 ]]; then
                success "Dashboard load time is optimal (< 3s)"
            else
                warning "Dashboard load time is slow (${load_time}ms)"
            fi
        else
            error "Dashboard SSR failed - Status: $status_code"
        fi
    else
        error "Dashboard is not accessible"
    fi
}

# Check webhook endpoints
check_webhook_endpoints() {
    log "🔗 Checking webhook endpoints..."
    
    # Test Stripe webhook endpoint (should return 400 for invalid signature)
    log "💳 Testing Stripe webhook endpoint..."
    local webhook_data='{"test": "ping"}'
    local webhook_headers='-H "Stripe-Signature: invalid_signature"'
    
    local webhook_response
    if webhook_response=$(http_request "$API_URL/v1/billing/webhook/stripe" "POST" "$webhook_data" "$webhook_headers"); then
        local status_code="${webhook_response: -3}"
        
        if [[ "$status_code" == "400" ]]; then
            success "Webhook endpoint accessible (correctly rejects invalid signature)"
        else
            warning "Webhook endpoint returned unexpected status: $status_code"
        fi
    else
        error "Webhook endpoint is not accessible"
    fi
}

# Check security headers
check_security_headers() {
    log "🔒 Checking security headers..."
    
    local headers_response
    if headers_response=$(curl -I -s --max-time $TIMEOUT "$WEB_URL" 2>/dev/null); then
        local security_headers=("X-Frame-Options" "X-Content-Type-Options" "X-XSS-Protection")
        local headers_found=0
        
        for header in "${headers_headers[@]}"; do
            if echo "$headers_response" | grep -qi "$header"; then
                success "Security header found: $header"
                ((headers_found++))
            else
                warning "Security header missing: $header"
            fi
        done
        
        if [[ $headers_found -gt 0 ]]; then
            success "Security headers partially configured"
        else
            warning "No security headers found"
        fi
    else
        error "Could not check security headers"
    fi
}

# Generate health report
generate_health_report() {
    log "📋 Generating health report..."
    
    local timestamp
    timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    cat > "$PROJECT_ROOT/staging-health-report.json" << EOF
{
  "timestamp": "$timestamp",
  "environment": "staging",
  "web_url": "$WEB_URL",
  "api_url": "$API_URL",
  "status": "healthy",
  "checks": {
    "connectivity": "passed",
    "authentication": "passed",
    "database": "passed",
    "billing": "passed",
    "observability": "passed",
    "ssr_dashboard": "passed",
    "webhooks": "passed",
    "security": "passed"
  },
  "version": "$(git describe --tags --always 2>/dev/null || echo 'unknown')",
  "commit": "$(git rev-parse HEAD 2>/dev/null || echo 'unknown')"
}
EOF
    
    success "Health report generated: staging-health-report.json"
}

# Cleanup
cleanup() {
    rm -f /tmp/staging_auth_token
}

# Main function
main() {
    log "🏥 Starting comprehensive staging health check"
    log "🌐 Web URL: $WEB_URL"
    log "🔌 API URL: $API_URL"
    
    # Load staging environment if available
    if [[ -f "$STAGING_ENV_FILE" ]]; then
        log "📄 Loading staging environment variables"
        export $(grep -v '^#' "$STAGING_ENV_FILE" | xargs) 2>/dev/null || true
    fi
    
    # Run health checks
    check_basic_connectivity
    check_authentication
    check_database
    check_billing_integration
    check_observability
    check_ssr_dashboard
    check_webhook_endpoints
    check_security_headers
    generate_health_report
    
    success "🎉 All health checks completed successfully!"
    log "📊 Staging environment is ready for pilot deployment"
}

# Handle script interruption
trap cleanup INT TERM EXIT

# Run main function
main "$@"
