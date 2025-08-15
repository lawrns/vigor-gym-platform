#!/bin/bash

# Health Check Script for Vigor Development Environment

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Vigor Health Check${NC}"
echo "=========================="

# Extract API port from config
if [ -f "apps/api/.env.local" ]; then
    API_PORT=$(grep "^PORT=" apps/api/.env.local | cut -d'=' -f2 | tr -d '"')
    API_URL="http://localhost:$API_PORT"
else
    echo -e "${RED}❌ API configuration file not found${NC}"
    exit 1
fi

# Extract web API URL from config
if [ -f "apps/web/.env.local" ]; then
    WEB_API_URL=$(grep "^NEXT_PUBLIC_API_URL=" apps/web/.env.local | cut -d'=' -f2 | tr -d '"')
else
    echo -e "${RED}❌ Web configuration file not found${NC}"
    exit 1
fi

echo -e "${BLUE}Configuration:${NC}"
echo -e "  API Port: ${YELLOW}$API_PORT${NC}"
echo -e "  Web API URL: ${YELLOW}$WEB_API_URL${NC}"

# Check port configuration alignment
if [ "$WEB_API_URL" = "$API_URL" ]; then
    echo -e "${GREEN}✅ Port configuration is aligned${NC}"
else
    echo -e "${RED}❌ Port configuration mismatch${NC}"
    echo -e "  Expected: ${GREEN}$API_URL${NC}"
    echo -e "  Found: ${RED}$WEB_API_URL${NC}"
fi

echo ""

# Check if API port is in use
echo -e "${BLUE}Port Status:${NC}"
if lsof -Pi :$API_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Port $API_PORT is in use${NC}"
    
    # Check if API is responding
    echo -e "${BLUE}API Health:${NC}"
    if curl -s "$API_URL/health" >/dev/null 2>&1; then
        HEALTH_RESPONSE=$(curl -s "$API_URL/health")
        echo -e "${GREEN}✅ API is responding${NC}"
        echo -e "  Response: ${YELLOW}$HEALTH_RESPONSE${NC}"
    else
        echo -e "${RED}❌ API is not responding to health checks${NC}"
    fi
else
    echo -e "${RED}❌ Port $API_PORT is not in use${NC}"
    echo -e "${YELLOW}💡 Run './dev-start.sh' to start the development environment${NC}"
fi

echo ""

# Check web server (if running)
echo -e "${BLUE}Web Server Status:${NC}"
if lsof -Pi :7777 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Web server is running on port 7777${NC}"
else
    echo -e "${YELLOW}⚠️  Web server is not running on port 7777${NC}"
fi

echo ""
echo -e "${BLUE}Quick Actions:${NC}"
echo -e "  Start development: ${YELLOW}./dev-start.sh${NC}"
echo -e "  Check API health: ${YELLOW}curl $API_URL/health${NC}"
echo -e "  View API logs: ${YELLOW}tail -f api.log${NC}"
