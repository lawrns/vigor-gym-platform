#!/bin/bash

# Script to test RLS policies
# Usage: ./test_rls.sh [supabase_project_id]

set -e

PROJECT_ID=${1:-"rsyngqfzbwlzawrtvunt"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Testing RLS policies on Supabase project: $PROJECT_ID"

# Check if we have the required environment variables
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo "Error: SUPABASE_ACCESS_TOKEN environment variable is required"
    echo "Get your access token from: https://supabase.com/dashboard/account/tokens"
    exit 1
fi

# Function to execute SQL file
execute_sql_file() {
    local file=$1
    local filename=$(basename "$file")
    
    echo "Running RLS tests from $filename..."
    
    # Read the SQL file content
    local sql_content=$(cat "$file")
    
    # Execute via Supabase Management API
    local response=$(curl -X POST \
        "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
        -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$sql_content" | jq -Rs .)}" \
        --fail --silent --show-error)
    
    echo "Response: $response"
    echo "✓ $filename executed successfully"
}

# Run the test script
execute_sql_file "$SCRIPT_DIR/test_rls.sql"

echo ""
echo "✅ RLS tests completed!"
echo ""
echo "Check the output above for test results."
echo "Look for messages about member counts and RLS functionality."
