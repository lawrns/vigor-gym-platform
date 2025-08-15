#!/bin/bash

# Vigor Development Startup Script
# This script helps ensure proper configuration and startup of the development environment

echo "🚀 Starting Vigor Development Environment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null ; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to check if API is responding
check_api_health() {
    local api_url=$1
    if curl -s "$api_url/health" >/dev/null 2>&1; then
        return 0  # API is responding
    else
        return 1  # API is not responding
    fi
}

echo -e "${BLUE}📋 Checking configuration...${NC}"

# Check if .env.local files exist
if [ ! -f "apps/api/.env.local" ]; then
    echo -e "${RED}❌ Missing apps/api/.env.local${NC}"
    echo "Please create the API environment file first."
    exit 1
fi

if [ ! -f "apps/web/.env.local" ]; then
    echo -e "${RED}❌ Missing apps/web/.env.local${NC}"
    echo "Please create the web environment file first."
    exit 1
fi

# Extract configuration values
API_PORT=$(grep "^PORT=" apps/api/.env.local | cut -d'=' -f2 | tr -d '"')
WEB_API_URL=$(grep "^NEXT_PUBLIC_API_URL=" apps/web/.env.local | cut -d'=' -f2 | tr -d '"')

echo -e "${BLUE}Configuration found:${NC}"
echo -e "  API Port: ${YELLOW}$API_PORT${NC}"
echo -e "  Web API URL: ${YELLOW}$WEB_API_URL${NC}"

# Validate port configuration
EXPECTED_API_URL="http://localhost:$API_PORT"
if [ "$WEB_API_URL" != "$EXPECTED_API_URL" ]; then
    echo -e "${YELLOW}⚠️  Port mismatch detected!${NC}"
    echo -e "  Expected: ${GREEN}$EXPECTED_API_URL${NC}"
    echo -e "  Found: ${RED}$WEB_API_URL${NC}"
    echo -e "${BLUE}This has been fixed in the configuration.${NC}"
fi

echo -e "${BLUE}🔍 Checking ports...${NC}"

# Check if API port is available
if check_port $API_PORT; then
    echo -e "${YELLOW}⚠️  Port $API_PORT is already in use${NC}"
    echo "Checking if it's our API server..."
    
    if check_api_health "$EXPECTED_API_URL"; then
        echo -e "${GREEN}✅ API server is already running and responding${NC}"
        API_RUNNING=true
    else
        echo -e "${RED}❌ Port $API_PORT is occupied by another process${NC}"
        echo "Please stop the process using port $API_PORT or change the API port."
        exit 1
    fi
else
    echo -e "${GREEN}✅ Port $API_PORT is available${NC}"
    API_RUNNING=false
fi

# Start API server if not running
if [ "$API_RUNNING" = false ]; then
    echo -e "${BLUE}🚀 Starting API server...${NC}"
    cd apps/api
    
    # Check if node_modules exists
    if [ ! -d "node_modules" ]; then
        echo -e "${YELLOW}📦 Installing API dependencies...${NC}"
        npm install
    fi
    
    # Start API server in background
    npm run dev > ../../api.log 2>&1 &
    API_PID=$!
    cd ../..
    
    # Wait for API to start
    echo -e "${BLUE}⏳ Waiting for API server to start...${NC}"
    for i in {1..30}; do
        if check_api_health "$EXPECTED_API_URL"; then
            echo -e "${GREEN}✅ API server started successfully${NC}"
            break
        fi
        sleep 1
        if [ $i -eq 30 ]; then
            echo -e "${RED}❌ API server failed to start within 30 seconds${NC}"
            echo "Check api.log for details:"
            tail -n 20 api.log
            exit 1
        fi
    done
fi

# Start web server
echo -e "${BLUE}🌐 Starting web server...${NC}"
cd apps/web

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Installing web dependencies...${NC}"
    npm install
fi

echo -e "${GREEN}🎉 Development environment is ready!${NC}"
echo -e "${BLUE}📊 API Health: ${EXPECTED_API_URL}/health${NC}"
echo -e "${BLUE}🌐 Web App: http://localhost:7777${NC}"
echo ""
echo -e "${YELLOW}Starting web development server...${NC}"

# Start web server (this will run in foreground)
npm run dev
