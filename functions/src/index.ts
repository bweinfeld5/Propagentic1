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

// Import inviteCode functions
import * as inviteCodeFunctions from './inviteCode';

// Export invite code functions
export const generateInviteCode = inviteCodeFunctions.generateInviteCode;
export const validateInviteCode = inviteCodeFunctions.validateInviteCode;
export const redeemInviteCode = inviteCodeFunctions.redeemInviteCode;

// Import and export email invite function
import { sendInviteEmail } from './invites';
export { sendInviteEmail };

// Import and export notification trigger functions  
import { createNotificationOnInvite } from './inviteTriggers';
export { createNotificationOnInvite };

console.log("✅ Essential functions loaded (ping, invite code, email invites, notifications).");
