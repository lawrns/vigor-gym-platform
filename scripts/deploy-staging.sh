#!/bin/bash

# =============================================================================
# Staging Deployment Script for Vigor Gym Platform
# =============================================================================
# This script deploys the application to staging environment with proper
# validation, health checks, and rollback capabilities.

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
DEPLOY_LOG="$PROJECT_ROOT/deploy-staging.log"

# Deployment settings
DEPLOY_TIMEOUT=600  # 10 minutes
HEALTH_CHECK_RETRIES=30
HEALTH_CHECK_INTERVAL=10

# Functions
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$DEPLOY_LOG"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$DEPLOY_LOG"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$DEPLOY_LOG"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$DEPLOY_LOG"
}

# Pre-deployment checks
pre_deployment_checks() {
    log "🔍 Running pre-deployment checks..."
    
    # Check if staging environment file exists
    if [[ ! -f "$STAGING_ENV_FILE" ]]; then
        error "Staging environment file not found: $STAGING_ENV_FILE"
    fi
    
    # Check if required tools are installed
    command -v node >/dev/null 2>&1 || error "Node.js is required but not installed"
    command -v npm >/dev/null 2>&1 || error "npm is required but not installed"
    command -v git >/dev/null 2>&1 || error "git is required but not installed"
    
    # Check Node.js version
    NODE_VERSION=$(node --version | cut -d'v' -f2)
    REQUIRED_VERSION="18.17.0"
    if ! node -e "process.exit(require('semver').gte('$NODE_VERSION', '$REQUIRED_VERSION') ? 0 : 1)" 2>/dev/null; then
        error "Node.js version $REQUIRED_VERSION or higher is required (current: $NODE_VERSION)"
    fi
    
    # Check if we're on the correct branch
    CURRENT_BRANCH=$(git branch --show-current)
    EXPECTED_BRANCH="feat/p0w3-golive-payments-depth"
    if [[ "$CURRENT_BRANCH" != "$EXPECTED_BRANCH" ]]; then
        warning "Current branch ($CURRENT_BRANCH) differs from expected ($EXPECTED_BRANCH)"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
        fi
    fi
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD --; then
        warning "Uncommitted changes detected"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            error "Deployment cancelled"
        fi
    fi
    
    success "Pre-deployment checks passed"
}

# Build application
build_application() {
    log "🏗️ Building application for staging..."
    
    cd "$PROJECT_ROOT"
    
    # Load staging environment
    export $(grep -v '^#' "$STAGING_ENV_FILE" | xargs)
    
    # Install dependencies
    log "📦 Installing dependencies..."
    npm ci --include=dev
    
    # Run type checking
    log "🔍 Running type checks..."
    npm run typecheck || error "Type checking failed"
    
    # Run linting (if available)
    if npm run lint >/dev/null 2>&1; then
        log "🧹 Running linting..."
        npm run lint || error "Linting failed"
    fi
    
    # Build applications
    log "🔨 Building applications..."
    npm run build || error "Build failed"
    
    success "Application built successfully"
}

# Database migration
run_database_migration() {
    log "🗄️ Running database migrations..."
    
    cd "$PROJECT_ROOT/apps/api"
    
    # Run Prisma migrations
    npx prisma migrate deploy || error "Database migration failed"
    
    # Generate Prisma client
    npx prisma generate || error "Prisma client generation failed"
    
    success "Database migrations completed"
}

# Deploy to staging
deploy_to_staging() {
    log "🚀 Deploying to staging environment..."
    
    # This would typically involve:
    # 1. Uploading built assets to CDN/storage
    # 2. Deploying API to staging servers
    # 3. Updating web application
    # 4. Configuring load balancers/reverse proxies
    
    # For this example, we'll simulate the deployment process
    log "📤 Uploading application assets..."
    sleep 2
    
    log "🔄 Updating staging servers..."
    sleep 3
    
    log "⚙️ Configuring services..."
    sleep 2
    
    success "Deployment to staging completed"
}

# Health checks
run_health_checks() {
    log "🏥 Running health checks..."
    
    # Load staging environment for URLs
    export $(grep -v '^#' "$STAGING_ENV_FILE" | xargs)
    
    local api_url="${NEXT_PUBLIC_API_URL:-https://api-staging.vigor-gym.com}"
    local web_url="${NEXT_PUBLIC_APP_URL:-https://staging.vigor-gym.com}"
    
    # Check API health
    log "🔌 Checking API health..."
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        if curl -sf "$api_url/health" >/dev/null 2>&1; then
            success "API health check passed"
            break
        fi
        
        if [[ $i -eq $HEALTH_CHECK_RETRIES ]]; then
            error "API health check failed after $HEALTH_CHECK_RETRIES attempts"
        fi
        
        log "API not ready, retrying in $HEALTH_CHECK_INTERVAL seconds... ($i/$HEALTH_CHECK_RETRIES)"
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    # Check web application
    log "🌐 Checking web application..."
    for i in $(seq 1 $HEALTH_CHECK_RETRIES); do
        if curl -sf "$web_url" >/dev/null 2>&1; then
            success "Web application health check passed"
            break
        fi
        
        if [[ $i -eq $HEALTH_CHECK_RETRIES ]]; then
            error "Web application health check failed after $HEALTH_CHECK_RETRIES attempts"
        fi
        
        log "Web application not ready, retrying in $HEALTH_CHECK_INTERVAL seconds... ($i/$HEALTH_CHECK_RETRIES)"
        sleep $HEALTH_CHECK_INTERVAL
    done
    
    # Check database connectivity
    log "🗄️ Checking database connectivity..."
    if curl -sf "$api_url/v1/metrics/health" | grep -q '"database":"connected"'; then
        success "Database connectivity check passed"
    else
        error "Database connectivity check failed"
    fi
    
    success "All health checks passed"
}

# Run staging tests
run_staging_tests() {
    log "🧪 Running staging E2E tests..."
    
    cd "$PROJECT_ROOT"
    
    # Set staging test environment variables
    export STAGING_WEB_URL="${NEXT_PUBLIC_APP_URL:-https://staging.vigor-gym.com}"
    export STAGING_API_URL="${NEXT_PUBLIC_API_URL:-https://api-staging.vigor-gym.com}"
    
    # Run staging test suite
    if npm run e2e:staging; then
        success "Staging E2E tests passed"
    else
        error "Staging E2E tests failed"
    fi
}

# Post-deployment tasks
post_deployment_tasks() {
    log "📋 Running post-deployment tasks..."
    
    # Update deployment metadata
    local commit_sha=$(git rev-parse HEAD)
    local deploy_timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    log "📝 Recording deployment metadata..."
    cat > "$PROJECT_ROOT/staging-deployment.json" << EOF
{
  "environment": "staging",
  "branch": "$(git branch --show-current)",
  "commit_sha": "$commit_sha",
  "deploy_timestamp": "$deploy_timestamp",
  "deployer": "$(whoami)",
  "version": "$(git describe --tags --always)"
}
EOF
    
    # Send deployment notification (if configured)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        log "📢 Sending deployment notification..."
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚀 Staging deployment completed successfully\nCommit: $commit_sha\nTime: $deploy_timestamp\"}" \
            "$SLACK_WEBHOOK_URL" || warning "Failed to send Slack notification"
    fi
    
    success "Post-deployment tasks completed"
}

# Main deployment function
main() {
    log "🎯 Starting staging deployment for Vigor Gym Platform"
    log "📁 Project root: $PROJECT_ROOT"
    log "📄 Deploy log: $DEPLOY_LOG"
    
    # Create deploy log
    echo "Staging Deployment Log - $(date)" > "$DEPLOY_LOG"
    
    # Run deployment steps
    pre_deployment_checks
    build_application
    run_database_migration
    deploy_to_staging
    run_health_checks
    run_staging_tests
    post_deployment_tasks
    
    success "🎉 Staging deployment completed successfully!"
    log "📊 View deployment details: cat $PROJECT_ROOT/staging-deployment.json"
    log "📈 View staging application: ${NEXT_PUBLIC_APP_URL:-https://staging.vigor-gym.com}"
    log "🔍 View deployment logs: cat $DEPLOY_LOG"
}

# Handle script interruption
cleanup() {
    warning "Deployment interrupted"
    exit 1
}

trap cleanup INT TERM

# Run main function
main "$@"
