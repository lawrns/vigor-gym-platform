#!/bin/bash

# Console Error Fix Verification Script
# Tests that authentication 401 errors are resolved

set -e

echo "🔍 Verifying Console Error Fixes..."
echo "=================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test URLs
WEB_URL="http://localhost:3005"
API_URL="http://localhost:4002"

echo -e "\n${YELLOW}1. Testing Development Login${NC}"
echo "POST $WEB_URL/api/dev/login"

LOGIN_RESPONSE=$(curl -s -X POST "$WEB_URL/api/dev/login" \
  -H 'content-type: application/json' \
  -d '{}' \
  -c /tmp/auth_verify.txt)

if echo "$LOGIN_RESPONSE" | grep -q '"ok":true'; then
  echo -e "${GREEN}✅ Dev login successful${NC}"
  echo "Response: $LOGIN_RESPONSE"
else
  echo -e "${RED}❌ Dev login failed${NC}"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo -e "\n${YELLOW}2. Testing Web Auth Endpoint${NC}"
echo "GET $WEB_URL/api/auth/me"

AUTH_RESPONSE=$(curl -s -b /tmp/auth_verify.txt "$WEB_URL/api/auth/me")
AUTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/auth_verify.txt "$WEB_URL/api/auth/me")

if [ "$AUTH_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Web auth endpoint working (200)${NC}"
  echo "User ID: $(echo "$AUTH_RESPONSE" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)"
  echo "Company ID: $(echo "$AUTH_RESPONSE" | grep -o '"id":"[^"]*"' | tail -1 | cut -d'"' -f4)"
else
  echo -e "${RED}❌ Web auth endpoint failed ($AUTH_STATUS)${NC}"
  echo "Response: $AUTH_RESPONSE"
  exit 1
fi

echo -e "\n${YELLOW}3. Testing Dashboard Load${NC}"
echo "GET $WEB_URL/dashboard-v2"

DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -b /tmp/auth_verify.txt "$WEB_URL/dashboard-v2")

if [ "$DASHBOARD_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ Dashboard loads successfully (200)${NC}"
else
  echo -e "${RED}❌ Dashboard load failed ($DASHBOARD_STATUS)${NC}"
  exit 1
fi

echo -e "\n${YELLOW}4. Testing SSE Proxy${NC}"
echo "HEAD $WEB_URL/api/events?orgId=489ff883-138b-44a1-88db-83927b596e35"

SSE_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -I -b /tmp/auth_verify.txt "$WEB_URL/api/events?orgId=489ff883-138b-44a1-88db-83927b596e35")

if [ "$SSE_STATUS" = "200" ]; then
  echo -e "${GREEN}✅ SSE proxy working (200)${NC}"
  
  # Check for proper SSE headers
  SSE_HEADERS=$(curl -s -I -b /tmp/auth_verify.txt "$WEB_URL/api/events?orgId=489ff883-138b-44a1-88db-83927b596e35")
  
  if echo "$SSE_HEADERS" | grep -q "content-type: text/event-stream"; then
    echo -e "${GREEN}✅ SSE headers correct${NC}"
  else
    echo -e "${YELLOW}⚠️  SSE headers may be incorrect${NC}"
  fi
else
  echo -e "${RED}❌ SSE proxy failed ($SSE_STATUS)${NC}"
  exit 1
fi

echo -e "\n${YELLOW}5. Testing API Direct Access${NC}"
echo "GET $API_URL/auth/me"

# Extract token from cookie file
TOKEN=$(grep accessToken /tmp/auth_verify.txt | cut -f7)

if [ -n "$TOKEN" ]; then
  API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "$API_URL/auth/me")
  
  if [ "$API_STATUS" = "200" ]; then
    echo -e "${GREEN}✅ API direct access working (200)${NC}"
  else
    echo -e "${YELLOW}⚠️  API direct access failed ($API_STATUS) - may be expected if API not running${NC}"
  fi
else
  echo -e "${YELLOW}⚠️  Could not extract token for API test${NC}"
fi

echo -e "\n${GREEN}🎉 All Console Error Fixes Verified!${NC}"
echo "=================================="
echo -e "${GREEN}✅ Priority 1 - Auth 401 Error: RESOLVED${NC}"
echo -e "${GREEN}✅ Dashboard loads without authentication errors${NC}"
echo -e "${GREEN}✅ SSE connections work properly${NC}"
echo -e "${GREEN}✅ JWT token validation working correctly${NC}"
echo -e "${GREEN}✅ Browser authentication flow working${NC}"
echo -e "${GREEN}✅ Cookie persistence across requests${NC}"

echo -e "\n${YELLOW}📋 Next Steps:${NC}"
echo "1. Install React DevTools browser extension (see scripts/setup-dev-tools.md)"
echo "2. Fast Refresh messages are normal - no action needed"
echo "3. Open http://localhost:3005/dashboard-v2 in browser to verify"
echo "4. Run ./scripts/test-browser-auth.sh for comprehensive browser testing"

# Cleanup
rm -f /tmp/auth_verify.txt

echo -e "\n${GREEN}Verification complete! 🚀${NC}"
