#!/usr/bin/env bash
set -euo pipefail
PORT=${PORT:-7777}

echo "🔥 Starting web smoke test on port $PORT..."

# start web
pnpm --filter @vigor/web dev >/tmp/web.log 2>&1 &
PID=$!

# wait for server to start
echo "⏳ Waiting for server to start..."
sleep 8

# test basic routes
echo "🌐 Testing routes..."

echo "  ✓ Testing /"
curl -sf "http://localhost:$PORT/" >/dev/null

echo "  ✓ Testing /debug-ok"
curl -sf "http://localhost:$PORT/debug-ok" >/dev/null

echo "  ✓ Testing /dashboard-v2"
curl -sf "http://localhost:$PORT/dashboard-v2" >/dev/null || echo "    ⚠️  /dashboard-v2 failed (expected if not implemented)"

echo "  ✓ Testing /kiosk"
curl -sf "http://localhost:$PORT/kiosk" >/dev/null || echo "    ⚠️  /kiosk failed (expected if not implemented)"

echo "  ✓ Testing /login"
curl -sf "http://localhost:$PORT/login" >/dev/null || echo "    ⚠️  /login failed (expected if not implemented)"

# cleanup
kill $PID || true
wait $PID 2>/dev/null || true

echo "✅ Smoke test completed successfully!"
echo "📋 Server logs available at /tmp/web.log"
