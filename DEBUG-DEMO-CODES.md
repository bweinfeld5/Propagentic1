# Demo Code Debugging Guide

## Issue: Demo codes not working

### 1. Check Browser Console

Open your browser's developer console (F12) and look for:

1. **Navigate to**: `http://localhost:3001/demo-showcase`
2. **Check for errors** in the console
3. **Try entering a demo code** (e.g., DEMO2024) and watch for console logs

### 2. Expected Console Logs

When entering a demo code, you should see:
```
🔍 validateInviteCode called with: DEMO2024
🔍 Normalized code: DEMO2024
✅ Using demo code: DEMO2024
```

### 3. Common Issues & Solutions

#### Issue 1: getDemoProperties is not a function
**Solution**: We just fixed this by exporting the function. Restart your dev server:
```bash
# Kill the current server (Ctrl+C)
# Restart it
PORT=3001 npm start
```

#### Issue 2: Demo codes not recognized
**Check these locations**:

1. **src/services/inviteCodeService.ts** (lines 73-75):
```typescript
const demoProperties = getDemoProperties();
const demoProperty = demoProperties[normalizedCode as keyof typeof demoProperties];
```

2. **Demo properties definition** (lines 520+):
```typescript
export const getDemoProperties = () => {
  return {
    'DEMO2024': { ... },
    'FAMILY01': { ... },
    // etc.
  };
};
```

#### Issue 3: Component not using the service correctly
**Check**: `src/components/tenant/TenantInviteForm.tsx`
- Should call `validateInviteCode` from inviteCodeService
- Should handle demo code validation results

### 4. Quick Test Steps

1. **Open Browser Console**
2. **Go to**: `http://localhost:3001/register`
3. **Register as a new tenant**
4. **During onboarding**, enter code: `DEMO2024`
5. **Watch console** for validation logs

### 5. Manual Test in Console

Open browser console and run:
```javascript
// Test if the service is available
console.log('Testing demo codes...');

// If you're on the tenant dashboard or invite form page:
// Check if validateInviteCode is being called
```

### 6. Check Network Tab

1. Open Network tab in DevTools
2. Enter a demo code
3. Look for any failed requests
4. Demo codes should NOT make any network requests

### 7. Verify File Changes

Make sure these files have been updated:
- ✅ `src/services/inviteCodeService.ts` - getDemoProperties exported
- ✅ `src/services/demoDataService.js` - Created with demo data
- ✅ `src/pages/DemoShowcase.jsx` - Demo showcase page
- ✅ `src/App.jsx` - Route added for /demo-showcase

### 8. Test Flow

The correct flow for demo codes:
1. User enters code (e.g., DEMO2024)
2. `validateInviteCode` is called
3. Code is normalized to uppercase
4. `getDemoProperties()` is called
5. Demo property is found and returned
6. No Firestore calls are made
7. Success message shown

### 9. If Still Not Working

1. **Clear browser cache**
2. **Hard refresh** (Ctrl+Shift+R or Cmd+Shift+R)
3. **Check for TypeScript errors**: `npm run build`
4. **Restart dev server**
5. **Check browser console** for specific error messages

### 10. Debug Code to Add

Add this to `src/components/tenant/TenantInviteForm.tsx` (line 70):
```typescript
console.log('🔍 Starting invite code validation for:', inviteCode.trim());
console.log('🔍 Current user:', currentUser?.uid, currentUser?.email);
```

And in `src/services/inviteCodeService.ts` (line 73):
```typescript
console.log('🔍 Demo properties loaded:', Object.keys(demoProperties));
console.log('🔍 Looking for code:', normalizedCode);
console.log('🔍 Code exists in demo?', normalizedCode in demoProperties);
```

## Next Steps

1. **Restart your development server** to pick up the export change
2. **Open browser console** before testing
3. **Try code DEMO2024** and watch for console logs
4. **Share any error messages** you see

The demo codes should work without any backend calls. If you're seeing network errors or Firestore permission errors when using demo codes, that indicates the demo code logic isn't being reached. 