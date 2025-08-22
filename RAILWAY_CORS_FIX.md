# Railway CORS Configuration Fix

## Issue
The web app deployed on Netlify cannot connect to the Railway API due to CORS restrictions.

## Solution
Update Railway environment variables to allow Netlify domain:

### 1. Go to Railway Dashboard
1. Open your `vigor-gym-platform` project
2. Click on the API service
3. Go to "Variables" tab

### 2. Add/Update Environment Variables
```bash
CORS_ORIGIN=https://gogymx.netlify.app
NODE_ENV=production
```

### 3. Verify Current Variables
Ensure these are set:
```bash
DATABASE_URL=postgresql://postgres:...@db.rsyngqfzbwlzawrtvunt.supabase.co:5432/postgres
JWT_SECRET=gym_super_secure_jwt_secret_2025_production_key_xyz789
CORS_ORIGIN=https://gogymx.netlify.app
NODE_ENV=production
PORT=4001
```

### 4. Redeploy
After updating variables, Railway will automatically redeploy the API.

### 5. Test
Test the API health endpoint:
```bash
curl https://vigor-gym-platform-production.up.railway.app/health
```

Should return:
```json
{"status":"ok"}
```

## Expected Result
After this fix:
- ✅ Web app can authenticate users
- ✅ API calls work from Netlify to Railway
- ✅ No more CORS errors
- ✅ Login/registration functions properly
