# Demo Codes Fix Guide

## Issue Summary
Demo codes (DEMO2024, FAMILY01, etc.) are not validating correctly. The validation returns "Invalid invite code" even though the code logic appears correct.

## Root Cause
The `getDemoProperties` function is defined and exported in `inviteCodeService.ts`, but the development server hasn't picked up the changes. This is a common issue with webpack hot module replacement.

## Immediate Fix

### Step 1: Stop All Running Servers
```bash
# Kill all node processes on ports 3000, 3001, 3002
lsof -ti:3000 | xargs kill -9
lsof -ti:3001 | xargs kill -9
lsof -ti:3002 | xargs kill -9
```

### Step 2: Clear Node Modules Cache (Optional but recommended)
```bash
rm -rf node_modules/.cache
```

### Step 3: Restart Development Server
```bash
npm run start:fix
```

### Step 4: Test Demo Codes
1. Navigate to http://localhost:3000/demo-showcase
2. Click "Try Demo" or register as a new tenant
3. Complete onboarding
4. Click "I have an invite code"
5. Enter any demo code: DEMO2024, FAMILY01, STUDENT1, LOFT2024, or BUDGET99
6. Click "Validate Code"

## What We Fixed

1. **Added `getDemoProperties` export** in `inviteCodeService.ts`
2. **Added debug logging** to track demo property loading
3. **Verified the validation logic** checks demo codes before Firestore

## Expected Console Output After Fix
```
🔍 Starting invite code validation for: DEMO2024
🔍 Normalized code: DEMO2024
🔍 Demo properties loaded: ['DEMO2024', 'FAMILY01', 'STUDENT1', 'LOFT2024', 'BUDGET99', 'TEST1234']
🔍 Demo property for code DEMO2024: {id: 'demo-luxury-highrise', name: 'Skyline Towers - Unit 2401', ...}
✅ Using demo code: DEMO2024
```

## If Still Not Working

### 1. Check for TypeScript Errors
```bash
npm run build
```

### 2. Verify File Changes
Check that `src/services/inviteCodeService.ts` contains:
- `export const getDemoProperties = () => { ... }` (around line 510)
- Debug logging in `validateInviteCode` function

### 3. Force Rebuild
```bash
rm -rf node_modules/.cache
rm -rf build
npm run start:fix
```

### 4. Check Browser Console
Look for any JavaScript errors or failed network requests

## Alternative Testing Method

If the development server continues to have issues, you can test with the production build:

```bash
npm run build
serve -s build -l 3003
```

Then navigate to http://localhost:3003

## Code Verification

The demo code validation happens in this order:
1. User enters code (e.g., "DEMO2024")
2. Code is normalized to uppercase
3. `getDemoProperties()` is called to get all demo properties
4. Code is checked against demo properties BEFORE any Firestore calls
5. If found, returns success with demo property details
6. If not found, continues to check Firestore

This ensures demo codes work even without Firestore access or permissions. 