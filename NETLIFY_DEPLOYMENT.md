# Netlify Deployment Guide

## 🚀 Deploy GoGym Web App to Netlify

### Prerequisites
- ✅ API deployed on Railway (stable)
- ✅ Public Railway URL (get from Railway dashboard)
- ✅ Netlify account

### Step 1: Prepare Environment Variables

Create a `.env.local` file in `apps/web/`:

```bash
# Replace with your actual Railway public URL
NEXT_PUBLIC_API_URL=https://vigor-gym-platform-production-xxxx.up.railway.app

# Generate a secure secret for NextAuth
NEXTAUTH_SECRET=your-super-secure-secret-here

# Will be set after Netlify deployment
NEXTAUTH_URL=https://your-netlify-domain.netlify.app
```

### Step 2: Update API CORS Configuration

Update Railway environment variables to allow Netlify domain:

```bash
# In Railway dashboard, add environment variable:
CORS_ORIGIN=https://your-netlify-domain.netlify.app
```

### Step 3: Deploy to Netlify

#### Option A: Netlify CLI (Recommended)
```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Navigate to web app
cd apps/web

# Build the application
npm run build

# Deploy to Netlify
netlify deploy --prod --dir=.next

# Set environment variables in Netlify dashboard
```

#### Option B: Git Integration
1. Push code to GitHub (already done)
2. Connect repository to Netlify
3. Set build settings:
   - **Build command**: `cd apps/web && npm run build`
   - **Publish directory**: `apps/web/.next`
   - **Base directory**: `apps/web`

### Step 4: Configure Netlify Environment Variables

In Netlify dashboard → Site settings → Environment variables:

```
NEXT_PUBLIC_API_URL=https://your-railway-url.railway.app
NEXTAUTH_SECRET=your-secure-secret
NEXTAUTH_URL=https://your-netlify-domain.netlify.app
```

### Step 5: Update Railway CORS

After getting Netlify URL, update Railway environment:
```
CORS_ORIGIN=https://your-netlify-domain.netlify.app
```

### Step 6: Test End-to-End

1. ✅ Visit Netlify URL
2. ✅ Test user registration
3. ✅ Test login
4. ✅ Test onboarding flow
5. ✅ Test dashboard functionality

### Troubleshooting

**CORS Issues:**
- Ensure CORS_ORIGIN is set correctly in Railway
- Check browser network tab for CORS errors

**API Connection Issues:**
- Verify NEXT_PUBLIC_API_URL is correct
- Test API URL directly in browser

**Build Issues:**
- Check Netlify build logs
- Ensure all dependencies are installed

### Expected Timeline
- **Setup**: 30 minutes
- **Deployment**: 15 minutes  
- **Testing**: 30 minutes
- **Total**: ~1.5 hours

### Success Criteria
- ✅ Web app loads on Netlify
- ✅ User can register/login
- ✅ API calls work correctly
- ✅ Dashboard displays data
- ✅ Onboarding flow completes
