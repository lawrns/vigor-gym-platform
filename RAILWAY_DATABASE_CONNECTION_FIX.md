# Railway Database Connection Fix - IPv4 Compatibility

## Issue Identified
Railway logs show: `Can't reach database server at db.rsyngqfzbwlzawrtvunt.supabase.co:6543`

## Root Cause
Railway is on an IPv4-only network, but we were using Supabase's Transaction pooler (port 6543) which is "Not IPv4 compatible" according to Supabase dashboard.

## Solution
Switch to Supabase's Session pooler (Shared Pooler) which is IPv4 compatible.

## Correct DATABASE_URL for Railway

**OLD (IPv6 Transaction pooler - doesn't work on Railway):**
```
postgresql://postgres:Hennie%21%2112Hennie%21%2112@db.rsyngqfzbwlzawrtvunt.supabase.co:6543/postgres?sslmode=require&pgbouncer=true&connection_limit=1
```

**NEW (IPv4 Session pooler - works on Railway):**
```
postgresql://postgres.rsyngqfzbwlzawrtvunt:Hennie%21%2112Hennie%21%2112@aws-1-us-east-2.pooler.supabase.com:5432/postgres?sslmode=require
```

## Key Changes
1. **Host**: `aws-1-us-east-2.pooler.supabase.com` (IPv4 compatible)
2. **Username**: `postgres.rsyngqfzbwlzawrtvunt` (includes project ID)
3. **Port**: `5432` (session pooler port)
4. **Removed**: pgbouncer flags (not needed for session pooler)

## Expected Results
- ✅ Railway connects to Supabase database successfully
- ✅ Auth endpoints return 200/401 instead of 500
- ✅ PrismaClientInitializationError resolved
- ✅ User registration/login works

## Next Steps
1. Update DATABASE_URL in Railway dashboard
2. Wait for Railway redeploy (~2-3 minutes)
3. Test auth endpoints
4. Run database migrations if needed
5. Seed database with test data

## Verification Commands
```bash
# Test health (should work)
curl https://vigor-gym-platform-production.up.railway.app/health

# Test auth (should return 401 for bad creds, not 500)
curl -X POST https://vigor-gym-platform-production.up.railway.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"wrong"}'
```
