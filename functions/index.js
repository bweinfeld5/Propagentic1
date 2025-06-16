/**
 * Firebase Functions - Main Index
 * This file exports the compiled TypeScript functions from the lib directory
 */

// Load environment variables from .env file
require('dotenv').config();

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}

console.log('Loading all functions...');

// Export functions from compiled TypeScript modules

// User Relationships functions (invite management) - CRITICAL FOR INVITE FLOW
try {
  const userRelationships = require('./lib/userRelationships');
  exports.sendPropertyInvite = userRelationships.sendPropertyInvite;
  exports.acceptPropertyInvite = userRelationships.acceptPropertyInvite;
  exports.rejectPropertyInvite = userRelationships.rejectPropertyInvite;
  exports.addContractorToRolodex = userRelationships.addContractorToRolodex;
  console.log('✅ Loaded userRelationships functions (property invites)');
} catch (error) {
  console.error('❌ Failed to load userRelationships functions:', error.message);
}

// Invite Code functions
try {
  const inviteCode = require('./lib/inviteCode');
  exports.generateInviteCode = inviteCode.generateInviteCode;
  exports.validateInviteCode = inviteCode.validateInviteCode;
  exports.redeemInviteCode = inviteCode.redeemInviteCode;
  console.log('✅ Loaded inviteCode functions');
} catch (error) {
  console.error('❌ Failed to load inviteCode functions:', error.message);
}

// Email invite function
try {
  const invites = require('./lib/invites');
  exports.sendInviteEmail = invites.sendInviteEmail;
  console.log('✅ Loaded email invite function');
} catch (error) {
  console.error('❌ Failed to load invites functions:', error.message);
}

// Notification trigger functions
try {
  const inviteTriggers = require('./lib/inviteTriggers');
  exports.createNotificationOnInvite = inviteTriggers.createNotificationOnInvite;
  console.log('✅ Loaded notification trigger functions');
} catch (error) {
  console.error('❌ Failed to load inviteTriggers functions:', error.message);
}

// Basic ping function
exports.ping = require('firebase-functions').https.onCall(async () => {
  console.log("Ping function invoked.");
  return { message: "pong", timestamp: Date.now() };
});

// Set custom claims for users (for Firestore rules)
exports.setUserClaims = require('firebase-functions').https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new require('firebase-functions').https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { uid, userType } = data;
  
  // Validate input
  if (!uid || !userType) {
    throw new require('firebase-functions').https.HttpsError(
      'invalid-argument',
      'Missing uid or userType'
    );
  }

  // Validate userType
  const validUserTypes = ['landlord', 'tenant', 'contractor', 'admin'];
  if (!validUserTypes.includes(userType)) {
    throw new require('firebase-functions').https.HttpsError(
      'invalid-argument',
      'Invalid userType'
    );
  }

  try {
    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, { userType });
    
    console.log(`Set custom claims for user ${uid}: userType=${userType}`);
    
    return { 
      success: true, 
      message: `Custom claims set for user ${uid}`,
      userType 
    };
  } catch (error) {
    console.error('Error setting custom claims:', error);
    throw new require('firebase-functions').https.HttpsError(
      'internal',
      'Failed to set custom claims'
    );
  }
});

// Legacy stub functions (keeping for backward compatibility if needed)
// These should NOT override the actual implementations above

// Export sendTenantInvitation function (stub)
try {
  const sendTenantInvitationFunc = require('./functions/sendTenantInvitation');
  if (!exports.sendTenantInvitation) {
    exports.sendTenantInvitation = sendTenantInvitationFunc.sendTenantInvitation;
  }
} catch (error) {
  console.warn('Could not load sendTenantInvitation stub:', error.message);
}

// Export classifyMaintenanceRequest function (stub)
try {
  const classifyMaintenanceRequestFunc = require('./functions/classifyMaintenanceRequest');
  if (!exports.classifyMaintenanceRequest) {
    exports.classifyMaintenanceRequest = classifyMaintenanceRequestFunc.classifyMaintenanceRequest;
  }
} catch (error) {
  console.warn('Could not load classifyMaintenanceRequest stub:', error.message);
}

// Export cleanupOldNotifications function (stub)
try {
  const cleanupOldNotificationsFunc = require('./functions/cleanupOldNotifications');
  if (!exports.cleanupOldNotifications) {
    exports.cleanupOldNotifications = cleanupOldNotificationsFunc.cleanupOldNotifications;
  }
} catch (error) {
  console.warn('Could not load cleanupOldNotifications stub:', error.message);
}

// Export matchContractorToTicket function (stub)
try {
  const matchContractorToTicketFunc = require('./functions/matchContractorToTicket');
  if (!exports.matchContractorToTicket) {
    exports.matchContractorToTicket = matchContractorToTicketFunc.matchContractorToTicket;
  }
} catch (error) {
  console.warn('Could not load matchContractorToTicket stub:', error.message);
}

// Export notifyAssignedContractor function (stub)
try {
  const notifyAssignedContractorFunc = require('./functions/notifyAssignedContractor');
  if (!exports.notifyAssignedContractor) {
    exports.notifyAssignedContractor = notifyAssignedContractorFunc.notifyAssignedContractor;
  }
} catch (error) {
  console.warn('Could not load notifyAssignedContractor stub:', error.message);
}

// Export notifyNewMaintenanceRequest function (stub)
try {
  const notifyNewMaintenanceRequestFunc = require('./functions/notifyNewMaintenanceRequest');
  if (!exports.notifyNewMaintenanceRequest) {
    exports.notifyNewMaintenanceRequest = notifyNewMaintenanceRequestFunc.notifyNewMaintenanceRequest;
  }
} catch (error) {
  console.warn('Could not load notifyNewMaintenanceRequest stub:', error.message);
}

// Export notifyTicketStatusChange function (stub)
try {
  const notifyTicketStatusChangeFunc = require('./functions/notifyTicketStatusChange');
  if (!exports.notifyTicketStatusChange) {
    exports.notifyTicketStatusChange = notifyTicketStatusChangeFunc.notifyTicketStatusChange;
  }
} catch (error) {
  console.warn('Could not load notifyTicketStatusChange stub:', error.message);
}

console.log('All functions loaded successfully.');
console.log('Available functions:', Object.keys(exports).join(', '));