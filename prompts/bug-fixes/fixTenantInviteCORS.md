# Task: Fix CORS Error in `acceptTenantInvite` Firebase Function ✅ COMPLETED

## ✅ Problem
The Cloud Function `acceptTenantInvite` is failing due to a **CORS policy error** when accessed from the frontend (`http://localhost:3000`):

> No 'Access-Control-Allow-Origin' header is present on the requested resource

This means that when the browser sends a **preflight OPTIONS request**, the Cloud Function does **not respond with the correct CORS headers**, so the browser **blocks the request entirely**.

## 🔧 Solution
You need to properly apply the `cors` middleware using the `cors` NPM package (already installed).

## ✅ What to Do

Update the `acceptTenantInvite` Firebase function to use `cors` middleware correctly.

## 🔄 Correct Implementation Example

Update your function in `functions/src/index.ts` or the relevant file:

```ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as corsLib from "cors";

admin.initializeApp();

const cors = corsLib({ origin: true }); // Allow all origins during development

export const acceptTenantInvite = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { inviteCode } = req.body;

      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null;

      if (!token) {
        return res.status(401).send("Unauthorized: Missing token.");
      }

      const decodedToken = await admin.auth().verifyIdToken(token);
      const uid = decodedToken.uid;

      // TODO: Fetch invite from Firestore, validate code, get propertyId, and update tenantProfile...

      return res.status(200).send("Invite accepted.");
    } catch (err) {
      console.error("Error accepting invite:", err);
      return res.status(500).send("Internal Server Error");
    }
  });
});
```

## 🧪 Testing

From your frontend, make sure you're calling the function like this:

```ts
await fetch("https://us-central1-propagentic.cloudfunctions.net/acceptTenantInvite", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${firebaseUserToken}`,
  },
  body: JSON.stringify({ inviteCode }),
});
```

## 📝 Notes

- The `cors(req, res, ...)` wrapper must be **inside** the function to allow Firebase to handle preflight requests properly.
- Do **not** call this function directly with `onCall()` unless you migrate the function to a callable function (`functions.https.onCall`) and use the Firebase SDK on the frontend.

## 🚀 Final Step

After updating the function, redeploy it:

```bash
firebase deploy --only functions
```

This will resolve the CORS error and allow your frontend to access the backend endpoint.

---

## ✅ IMPLEMENTATION COMPLETED

**What was done:**
1. ✅ Created new TypeScript version of `acceptTenantInvite` in `functions/src/acceptTenantInvite.ts`
2. ✅ Converted from `functions.https.onCall` (callable) to `functions.https.onRequest` (HTTP) with CORS middleware
3. ✅ Added proper CORS handling using `cors` package with `{ origin: true }`
4. ✅ Updated authentication to use Bearer token verification instead of context.auth
5. ✅ Updated response format to return JSON with proper HTTP status codes
6. ✅ Updated main index files to export the new TypeScript version
7. ✅ Successfully deployed to Firebase - Function URL: https://us-central1-propagentic.cloudfunctions.net/acceptTenantInvite
8. ✅ Removed old JavaScript version

**Frontend Integration:**
The frontend should now call the function using:
```ts
await fetch("https://us-central1-propagentic.cloudfunctions.net/acceptTenantInvite", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${firebaseUserToken}`,
  },
  body: JSON.stringify({ inviteCode }),
});
```

**Status:** CORS error is now resolved. The function properly handles preflight OPTIONS requests and responds with appropriate CORS headers.

## ✅ FRONTEND UPDATES COMPLETED

**Additional frontend changes made to fix the "FirebaseError: invalid-argument" error:**

1. ✅ **Added `acceptTenantInvite` function to `inviteService.ts`**
   - New service function that makes HTTP requests to the Cloud Function
   - Handles authentication with Bearer tokens
   - Provides proper error handling and response formatting

2. ✅ **Updated all frontend components** that were using the old callable function:
   - `src/components/auth/InviteCodeWall.tsx`
   - `src/components/auth/InviteCodeModal.tsx` 
   - `src/components/tenant/TenantInviteModal.tsx`
   - Replaced `httpsCallable(functions, 'acceptTenantInvite')` with `inviteService.acceptTenantInvite()`

3. ✅ **Simplified error handling** to use the HTTP response format instead of Firebase callable error codes

**Root Cause of Original Error:**
The "FirebaseError: invalid-argument" was happening because the frontend components were still trying to call `acceptTenantInvite` as a Firebase callable function (using `httpsCallable`) when it had been converted to an HTTP function. The callable function format expects different parameters and response structures than HTTP functions.

**Final Status:** Both CORS and invalid-argument errors are now resolved. The system uses HTTP requests with proper CORS headers and Bearer token authentication.

## ✅ ADDITIONAL FIX: 400 Bad Request Error

**Issue Found:**
After fixing the CORS and callable function issues, users were still getting a 400 Bad Request error with the message "Invalid invite code format. Code must be 8 digits" even when entering valid 8-character codes.

**Root Cause:**
The Cloud Function had two validation bugs:
1. **Wrong regex pattern**: Used `/^\d{8}$/` (digits only) instead of `/^[A-Z0-9]{8}$/` (alphanumeric)
2. **Wrong database field**: Queried `'code'` field instead of `'shortCode'` field

**Fix Applied:**
1. ✅ **Updated validation regex** from `/^\d{8}$/` to `/^[A-Z0-9]{8}$/` to accept alphanumeric codes
2. ✅ **Fixed database query** from `where('code', '==', inviteCode)` to `where('shortCode', '==', normalizedInviteCode)`
3. ✅ **Added code normalization** to ensure codes are trimmed and uppercase
4. ✅ **Updated error message** to clarify "8 alphanumeric characters" instead of "8 digits"
5. ✅ **Redeployed function** with fixes

**Function URL (Updated):** https://accepttenantinvite-onvl6ehh6a-uc.a.run.app

**Final Status:** All issues resolved - CORS, invalid-argument, and 400 Bad Request errors are fixed!
