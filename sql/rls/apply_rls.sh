#!/bin/bash

# Script to apply RLS policies to Supabase database
# Usage: ./apply_rls.sh [supabase_project_id]

set -e

PROJECT_ID=${1:-"rsyngqfzbwlzawrtvunt"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Applying RLS policies to Supabase project: $PROJECT_ID"

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
    
    echo "Executing $filename..."
    
    # Read the SQL file content
    local sql_content=$(cat "$file")
    
    # Execute via Supabase Management API
    curl -X POST \
        "https://api.supabase.com/v1/projects/$PROJECT_ID/database/query" \
        -H "Authorization: Bearer $SUPABASE_ACCESS_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{\"query\": $(echo "$sql_content" | jq -Rs .)}" \
        --fail --silent --show-error
    
    echo "✓ $filename executed successfully"
}

# Apply RLS policies in order
echo "Step 1: Enabling RLS on tables..."
execute_sql_file "$SCRIPT_DIR/01_enable_rls.sql"

echo "Step 2: Creating company-scoped policies..."
execute_sql_file "$SCRIPT_DIR/02_company_policies.sql"

echo "Step 3: Creating indirect relationship policies..."
execute_sql_file "$SCRIPT_DIR/03_indirect_policies.sql"

echo ""
echo "✅ All RLS policies applied successfully!"
echo ""
echo "To test the policies, run:"
echo "  ./test_rls.sh $PROJECT_ID"
echo ""
echo "To verify in your application:"
echo "  1. Ensure your JWT tokens include 'company_id' in claims"
echo "  2. Test that users only see data from their company"
echo "  3. Verify service role can access all data"
