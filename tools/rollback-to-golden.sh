#!/usr/bin/env bash
set -euo pipefail

echo "🔄 Rolling back to golden baseline..."

# Reset to golden tag
git reset --hard web-golden-21a1944

# Clean install
pnpm install

# Test the rollback
echo "🧪 Testing rollback..."
PORT=7777 ./tools/smoke-web.sh

echo "✅ Rollback completed successfully!"
echo "🌟 You're back to the golden baseline (commit 21a1944)"
