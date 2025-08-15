#!/usr/bin/env bash
set -euo pipefail

# Smoke test for Vigor API
API=${1:-http://localhost:4001}

echo "🔍 Running smoke tests against $API..."

# Test 1: Health check
echo "  ✓ Testing health endpoint..."
status=$(curl -s ${API}/health | jq -r .status 2>/dev/null || echo "failed")
if [ "$status" != "ok" ]; then
  echo "❌ Health check failed - expected 'ok', got '$status'"
  exit 1
fi

# Test 2: Public plans endpoint
echo "  ✓ Testing public plans endpoint..."
code=$(curl -s -o /dev/null -w "%{http_code}" ${API}/v1/plans/public)
if [ "$code" != "200" ]; then
  echo "❌ Public plans failed - expected 200, got $code"
  exit 1
fi

# Test 3: Auth endpoint returns 401 without credentials
echo "  ✓ Testing auth protection..."
code=$(curl -s -o /dev/null -w "%{http_code}" ${API}/auth/me)
if [ "$code" != "401" ]; then
  echo "❌ Auth protection failed - expected 401, got $code"
  exit 1
fi

echo "✅ All smoke tests passed!"
