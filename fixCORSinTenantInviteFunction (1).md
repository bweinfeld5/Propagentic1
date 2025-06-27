# Task: Fix CORS Issue in acceptTenantInvite Firebase Function

## 📌 Problem
The `acceptTenantInvite` Firebase Cloud Function is currently **failing due to a CORS policy error**. This happens when the frontend (running on `http://localhost:3000`) tries to POST directly to:

```
https://us-central1-propagentic.cloudfunctions.net/acceptTenantInvite
```

The browser blocks the response because **no CORS headers** are returned by the function.

## ✅ What Was Done
- The `cors` npm package has already been installed in the `functions` directory using:
  ```bash
  npm install cors
  ```

## ✅ What You Need to Do
1. **Import and apply the CORS middleware** to the `acceptTenantInvite` function.
2. Make sure the function:
   - Responds to all `OPTIONS` preflight requests
   - Returns `Access-Control-Allow-Origin` and other headers properly

## 🔧 Example Implementation (Update the Function)
Update the Firebase function like this:

```ts
import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as corsLib from "cors";

admin.initializeApp();

const cors = corsLib({ origin: true }); // allow all origins for now

export const acceptTenantInvite = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { inviteCode } = req.body;
      const uid = req.headers.authorization?.split("Bearer ")[1];

      // TODO: Implement the actual invite acceptance logic here

      return res.status(200).send("Invite accepted.");
    } catch (err) {
      console.error("Error accepting invite:", err);
      return res.status(500).send("Internal Server Error");
    }
  });
});
```

## 📌 Additional Notes
- Make sure any other future custom functions that are triggered via `fetch()` or frontend requests include similar CORS support.
- If you switch to using `onCall` Firebase Functions instead, you can avoid needing CORS handling.

## ✅ Final Step
After updating the code, **re-deploy the function** using:
```bash
firebase deploy --only functions
```

Once deployed, the frontend requests to `acceptTenantInvite` should succeed without CORS errors.
