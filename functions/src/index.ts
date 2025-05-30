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
  return { message: "pong" };
});

// Essential Stripe Functions Only
export {
    createStripeAccountLink,
    getStripeAccountStatus
} from './stripe/simple';

console.log("✅ Essential functions loaded (ping + Stripe).");
