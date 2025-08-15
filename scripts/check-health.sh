#!/bin/bash

# Health check script for Vigor development environment
# This script verifies that all services are running correctly

set -e

echo "🔍 Vigor Development Environment Health Check"
echo "============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if API is running
echo -e "\n${BLUE}📡 Checking API Server...${NC}"
API_URL="http://localhost:4001"
if curl -s "$API_URL/health" > /dev/null; then
    echo -e "${GREEN}✅ API server is running on port 4001${NC}"
    
    # Test API endpoints
    echo -e "\n${BLUE}🧪 Testing API endpoints...${NC}"
    
    # Test public plans endpoint
    if curl -s "$API_URL/v1/plans/public" | grep -q "plans"; then
        echo -e "${GREEN}✅ Public plans endpoint working${NC}"
    else
        echo -e "${RED}❌ Public plans endpoint failed${NC}"
    fi
    
    # Test auth endpoint (should return 401)
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/auth/me" | grep -q "401"; then
        echo -e "${GREEN}✅ Auth protection working${NC}"
    else
        echo -e "${RED}❌ Auth protection not working${NC}"
    fi
    
else
    echo -e "${RED}❌ API server not responding on port 4001${NC}"
    echo -e "${YELLOW}   Try: cd apps/api && npm run dev${NC}"
fi

# Check if Web app is running
echo -e "\n${BLUE}🌐 Checking Web Application...${NC}"
WEB_URL="http://localhost:7777"
if curl -s "$WEB_URL" > /dev/null; then
    echo -e "${GREEN}✅ Web application is running on port 7777${NC}"
else
    echo -e "${RED}❌ Web application not responding on port 7777${NC}"
    echo -e "${YELLOW}   Try: cd apps/web && npm run dev${NC}"
fi

# Check environment configuration
echo -e "\n${BLUE}⚙️  Checking Environment Configuration...${NC}"

# Check API environment
if [ -f "apps/api/.env.local" ]; then
    echo -e "${GREEN}✅ API .env.local exists${NC}"
    
    # Check database URL
    if grep -q "DATABASE_URL" apps/api/.env.local; then
        echo -e "${GREEN}✅ Database URL configured${NC}"
    else
        echo -e "${RED}❌ Database URL missing${NC}"
    fi
    
    # Check JWT secret
    if grep -q "JWT_SECRET" apps/api/.env.local; then
        echo -e "${GREEN}✅ JWT secret configured${NC}"
    else
        echo -e "${RED}❌ JWT secret missing${NC}"
    fi
else
    echo -e "${RED}❌ API .env.local missing${NC}"
fi

# Check web environment
if [ -f "apps/web/.env.local" ]; then
    echo -e "${GREEN}✅ Web .env.local exists${NC}"
    
    # Check API URL
    API_URL_CONFIG=$(grep "NEXT_PUBLIC_API_URL" apps/web/.env.local | cut -d'=' -f2)
    if [ "$API_URL_CONFIG" = "http://localhost:4001" ]; then
        echo -e "${GREEN}✅ NEXT_PUBLIC_API_URL correctly set to http://localhost:4001${NC}"
    else
        echo -e "${RED}❌ NEXT_PUBLIC_API_URL is set to: $API_URL_CONFIG${NC}"
        echo -e "${YELLOW}   Should be: http://localhost:4001${NC}"
    fi
else
    echo -e "${RED}❌ Web .env.local missing${NC}"
fi

# Check database connection
echo -e "\n${BLUE}🗄️  Checking Database Connection...${NC}"
cd apps/api
if npm run db:generate > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Database connection working${NC}"
else
    echo -e "${RED}❌ Database connection failed${NC}"
    echo -e "${YELLOW}   Check DATABASE_URL in apps/api/.env.local${NC}"
fi
cd ../..

# Check for common issues
echo -e "\n${BLUE}🔧 Checking for Common Issues...${NC}"

# Check for port conflicts
if lsof -i :4001 > /dev/null 2>&1; then
    PROCESS=$(lsof -i :4001 | tail -n 1 | awk '{print $2}')
    echo -e "${YELLOW}⚠️  Port 4001 is in use by process $PROCESS${NC}"
else
    echo -e "${GREEN}✅ Port 4001 is available${NC}"
fi

if lsof -i :7777 > /dev/null 2>&1; then
    PROCESS=$(lsof -i :7777 | tail -n 1 | awk '{print $2}')
    echo -e "${YELLOW}⚠️  Port 7777 is in use by process $PROCESS${NC}"
else
    echo -e "${GREEN}✅ Port 7777 is available${NC}"
fi

# Check Node.js version
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js version: $NODE_VERSION${NC}"

# Summary
echo -e "\n${BLUE}📋 Summary${NC}"
echo "==========="
echo -e "API Server: ${API_URL}"
echo -e "Web App: ${WEB_URL}"
echo -e "Admin Login: admin@testgym.mx / TestPassword123!"
echo ""
echo -e "${YELLOW}💡 Quick Commands:${NC}"
echo -e "   Start API: cd apps/api && npm run dev"
echo -e "   Start Web: cd apps/web && npm run dev"
echo -e "   Run Tests: npm run test"
echo -e "   Database: cd apps/api && npm run db:studio"
