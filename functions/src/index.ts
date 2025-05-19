import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

console.log("🔥 Loading all functions...");

// --- Exporting Functions --- 

// Basic Ping Function (Using v1 for now)
export const ping = functions.https.onCall(async () => {
  console.log("Ping function invoked.");
  return { message: "pong" };
});

// AI Functions
export { classifyMaintenanceRequest } from './classifyMaintenanceRequest';

// Maintenance Ticket Functions
export { matchContractorToTicket } from './matchContractorToTicket';
export { notifyAssignedContractor } from './notifyAssignedContractor';

// User Relationship & Invitation Functions
export {
    sendPropertyInvite,
    addContractorToRolodex,
    acceptPropertyInvite,
    rejectPropertyInvite
} from './userRelationships';
export { sendInviteEmail } from './invites'; // Export the new invite email function

// Invite Code Functions
export { redeemInviteCode } from './inviteCode';

// Notification Trigger Functions
export {
    notifyNewMaintenanceRequest,
    notifyTicketStatusChange,
} from './notificationTriggers';
// TODO: Check if createNotificationOnInvite from inviteTriggers.ts is needed/used
// export { createNotificationOnInvite } from './inviteTriggers';

// Scheduled Cleanup Functions
// export { cleanupOldNotifications } from './cleanupNotifications'; // Commented out

console.log("✅ All functions loaded and exported (except cleanup).");
