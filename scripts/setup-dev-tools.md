# Development Tools Setup

## React DevTools Installation

The console warning about React DevTools can be resolved by installing the browser extension:

### Chrome/Edge
1. Visit: https://chrome.google.com/webstore/detail/react-developer-tools/fmkadmapgofadopljbjfkapdkoienihi
2. Click "Add to Chrome/Edge"
3. Restart your browser

### Firefox
1. Visit: https://addons.mozilla.org/en-US/firefox/addon/react-devtools/
2. Click "Add to Firefox"
3. Restart your browser

### Safari
1. Visit: https://apps.apple.com/us/app/react-developer-tools/id1476374905
2. Install from Mac App Store
3. Enable in Safari Extensions preferences

## Console Messages Explained

### Fast Refresh Messages
```
[Fast Refresh] rebuilding
[Fast Refresh] done in 179ms
```

These are **normal development messages** indicating:
- Next.js is detecting code changes
- Hot Module Replacement (HMR) is working correctly
- Components are being updated without full page reload

**When to be concerned:**
- If you see "Fast Refresh had to perform a full reload due to a runtime error"
- If rebuild times are consistently > 5 seconds
- If Fast Refresh stops working entirely

### Authentication Status
✅ **Fixed**: `/api/auth/me` now returns 200 with valid user data
✅ **Fixed**: JWT token verification working with dev tokens
✅ **Fixed**: Middleware properly validates both Supabase and dev tokens

## Development Workflow

1. **Login**: Use `POST /api/dev/login` to get authenticated session
2. **Verify**: Check `GET /api/auth/me` returns 200 with user data
3. **Dashboard**: Navigate to `/dashboard-v2` for full functionality
4. **SSE**: Real-time events should stream without 401 errors

## Troubleshooting

### If you see 401 errors:
1. Clear browser cookies
2. Run: `curl -X POST http://localhost:3005/api/dev/login -H 'content-type: application/json' -d '{}'`
3. Verify: `curl -b cookies.txt http://localhost:3005/api/auth/me`

### If Fast Refresh is slow:
1. Check for circular imports
2. Reduce bundle size by code splitting
3. Use React.memo() for expensive components
