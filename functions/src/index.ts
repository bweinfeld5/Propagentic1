import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

console.log("🔥 Loading essential functions...");

// Basic Ping Function
export const ping = functions.https.onCall(async () => {
  console.log("Ping function invoked.");
  return { message: "pong", timestamp: Date.now() };
});

console.log("✅ Essential functions loaded (ping only).");
