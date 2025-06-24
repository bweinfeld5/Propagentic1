import * as admin from "firebase-admin";
import { onCall } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  admin.initializeApp();
}

logger.info("🔥 Loading essential functions...");

// Basic Ping Function
export const ping = onCall(async () => {
  logger.info("Ping function invoked.");
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

// Import and export tenant service functions
import { getAllTenants, searchTenants } from './tenantService';
export { getAllTenants, searchTenants };

// Import and export property invitation notification functions
import { sendPropertyInvitationEmail, sendPropertyInvitationEmailManual } from './propertyInvitationNotifications';
export { sendPropertyInvitationEmail, sendPropertyInvitationEmailManual };

// Import and export invite code functions
import { generateInviteCodeHttp, validateInviteCode, redeemInviteCode } from './inviteCode';
export { generateInviteCodeHttp as generateInviteCode, validateInviteCode, redeemInviteCode };

logger.info("✅ Essential functions loaded (ping, property invites, AI classification, email invites, notifications, SendGrid, tenant service, property invitation notifications, invite codes, tests).");
