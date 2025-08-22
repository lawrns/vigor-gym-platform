# Railway Database Connection Fix

## Issue
Railway logs show: `Can't reach database server at db.rsyngqfzbwlzawrtvunt.supabase.co:5432`

This is a **network connectivity issue** between Railway and Supabase.

## Root Cause
Railway's network can't reach Supabase database server. Common causes:
1. **SSL/TLS required** - Supabase requires encrypted connections
2. **Connection pooling** - Railway uses PgBouncer which needs specific flags
3. **Network restrictions** - Supabase may block Railway's IP range

## Solution

### Step 1: Update DATABASE_URL with SSL
In Railway Dashboard → Variables → DATABASE_URL:

**Current (broken):**
```
postgresql://postgres:YOUR_PASSWORD@db.rsyngqfzbwlzawrtvunt.supabase.co:5432/postgres
```

**Fixed (with SSL):**
```
postgresql://postgres:YOUR_PASSWORD@db.rsyngqfzbwlzawrtvunt.supabase.co:5432/postgres?sslmode=require
```

### Step 2: If SSL doesn't work, try PgBouncer flags
```
postgresql://postgres:YOUR_PASSWORD@db.rsyngqfzbwlzawrtvunt.supabase.co:5432/postgres?sslmode=require&pgbouncer=true&connection_limit=1
```

### Step 3: Alternative - Use Supabase Connection Pooler
Instead of direct connection, use Supabase's connection pooler:

1. **Go to Supabase Dashboard** → **Settings** → **Database**
2. **Find "Connection Pooling"** section
3. **Copy the pooler URL** (usually port 6543 instead of 5432)
4. **Use this format:**
```
postgresql://postgres:YOUR_PASSWORD@db.rsyngqfzbwlzawrtvunt.supabase.co:6543/postgres?sslmode=require
```

### Step 4: Test Connection
After updating DATABASE_URL:
1. **Railway auto-redeploys** (~2-3 minutes)
2. **Test**: Visit `/api/test-railway`
3. **Should see**: Login status 200 instead of 500

### Step 5: Apply Migrations (if needed)
If connection works but tables don't exist:
1. **Railway Dashboard** → **API service** → **Deploy logs**
2. **Look for**: "Prisma migrate" or "Database sync" messages
3. **If missing**: May need to run migrations manually

## Expected Result
- ✅ **Railway connects** to Supabase database
- ✅ **Auth endpoints work** (200 instead of 500)
- ✅ **User registration/login** functional
- ✅ **Database seeding** successful

## Backup Plan
If Supabase connection still fails, we can:
1. **Create Railway PostgreSQL** database instead
2. **Update DATABASE_URL** to Railway's internal DB
3. **Run migrations** to create tables
4. **Seed with test data**

This would be faster but requires changing from Supabase to Railway DB.
