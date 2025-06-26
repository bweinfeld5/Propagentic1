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

// Import and export user relationship functions (property invites)
import { 
  sendPropertyInvite, 
  acceptPropertyInvite, 
  rejectPropertyInvite,
  addContractorToRolodex 
} from './userRelationships';

export { 
  sendPropertyInvite, 
  acceptPropertyInvite, 
  rejectPropertyInvite,
  addContractorToRolodex 
};

// Import and export AI classification function
import { classifyMaintenanceRequest } from './classifyMaintenanceRequest';
export { classifyMaintenanceRequest };

// Import and export email invite function
import { sendInviteEmail } from './invites';
export { sendInviteEmail };

// Import and export notification trigger functions  
import { createNotificationOnInvite } from './inviteTriggers';
export { createNotificationOnInvite };

// Import and export SendGrid email functions
import { sendEmail } from './sendgridEmailService';
export { sendEmail };

// Import and export test functions
import { testSendGrid, testPing } from './testSendGrid';
import { simpleTest } from './simpleTest';
export { testSendGrid, testPing, simpleTest };

// Import and export invite code generation function (landlord functionality)
const inviteCodeModule = require('./inviteCode.js');
export const generateInviteCode = inviteCodeModule.generateInviteCode;

// Import and export tenant invite acceptance function (HTTP function with CORS)
import { acceptTenantInvite } from './acceptTenantInvite';
export { acceptTenantInvite };

// Import and export tenant removal function
import { removeTenantFromLandlord } from './removeTenantFromLandlord';
export { removeTenantFromLandlord };

console.log("✅ Essential functions loaded (ping, property invites, AI classification, email invites, notifications, SendGrid, tests, invite code generation, tenant invite acceptance).");
