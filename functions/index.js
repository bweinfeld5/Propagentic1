/**
 * Firebase Functions - Main Index
 * Automatically generated to reconcile missing functions
 */

// Load environment variables from .env file
require('dotenv').config();

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}

console.log('Loading all functions...');

// Export acceptPropertyInvite function
const acceptPropertyInviteFunc = require('./functions/acceptPropertyInvite');
Object.assign(exports, acceptPropertyInviteFunc);

// Export addContractorToRolodex function
const addContractorToRolodexFunc = require('./functions/addContractorToRolodex');
Object.assign(exports, addContractorToRolodexFunc);

// Export classifyMaintenanceRequest function
const classifyMaintenanceRequestFunc = require('./functions/classifyMaintenanceRequest');
Object.assign(exports, classifyMaintenanceRequestFunc);

// Export cleanupOldNotifications function
const cleanupOldNotificationsFunc = require('./functions/cleanupOldNotifications');
Object.assign(exports, cleanupOldNotificationsFunc);

// Export matchContractorToTicket function
const matchContractorToTicketFunc = require('./functions/matchContractorToTicket');
Object.assign(exports, matchContractorToTicketFunc);

// Export notifyAssignedContractor function
const notifyAssignedContractorFunc = require('./functions/notifyAssignedContractor');
Object.assign(exports, notifyAssignedContractorFunc);

// Export notifyNewMaintenanceRequest function
const notifyNewMaintenanceRequestFunc = require('./functions/notifyNewMaintenanceRequest');
Object.assign(exports, notifyNewMaintenanceRequestFunc);

// Export notifyTicketStatusChange function
const notifyTicketStatusChangeFunc = require('./functions/notifyTicketStatusChange');
Object.assign(exports, notifyTicketStatusChangeFunc);

// Export ping function
const pingFunc = require('./functions/ping');
Object.assign(exports, pingFunc);

// Export rejectPropertyInvite function
const rejectPropertyInviteFunc = require('./functions/rejectPropertyInvite');
Object.assign(exports, rejectPropertyInviteFunc);

// Export sendPropertyInvite function
const sendPropertyInviteFunc = require('./functions/sendPropertyInvite');
Object.assign(exports, sendPropertyInviteFunc);

// Export sendTenantInvitation function
const sendTenantInvitationFunc = require('./functions/sendTenantInvitation');
Object.assign(exports, sendTenantInvitationFunc);

console.log('All functions loaded successfully.');