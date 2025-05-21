"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotificationOnInvite = void 0;
const firestore_1 = require("firebase-functions/v2/firestore"); // Import v2 trigger
const admin = __importStar(require("firebase-admin"));
// Ensure admin is initialized (it should be from index.ts, but belt-and-suspenders)
if (!admin.apps.length) {
    admin.initializeApp();
}
const adminDb = admin.firestore();
/**
 * Triggered when a new document is created in the 'invites' collection using Functions v2.
 * Checks if the invite is for a tenant and creates a notification for them.
 */
// Use onDocumentCreated trigger from v2
exports.createNotificationOnInvite = (0, firestore_1.onDocumentCreated)('invites/{inviteId}', async (event) => {
    const { inviteId } = event.params; // Access params from event
    console.log(`--- Function Start: createNotificationOnInvite (Invite ID: ${inviteId}) ---`);
    const snapshot = event.data; // Access snapshot from event.data
    if (!snapshot) {
        console.log(`Invite ${inviteId}: No data associated with the event (deletion event?). Skipping.`);
        return null;
    }
    const inviteData = snapshot.data(); // Get data from the snapshot
    // 1. Validate Invite Data
    if (!inviteData) {
        console.error(`Invite ${inviteId}: No data found in snapshot (this shouldn't happen for onCreate?).`);
        return null;
    }
    // Check if it's a pending invite
    if (inviteData.status !== 'pending') {
        console.log(`Invite ${inviteId}: Status is '${inviteData.status}', not 'pending'. Skipping notification.`);
        return null;
    }
    const tenantEmail = inviteData.tenantEmail;
    const landlordName = inviteData.landlordName || 'Your Landlord';
    const propertyName = inviteData.propertyName || 'a property';
    const propertyId = inviteData.propertyId;
    if (!tenantEmail) {
        console.error(`Invite ${inviteId}: Missing tenantEmail.`);
        // Optional: Update invite status to 'error_missing_email'?
        // await snapshot.ref.update({ status: 'error_missing_email', errorDetails: 'Tenant email missing.' });
        return null;
    }
    console.log(`Invite ${inviteId}: Processing for tenantEmail: ${tenantEmail}`);
    // 2. Find Tenant User ID by Email
    let tenantUid;
    try {
        const usersRef = adminDb.collection('users');
        const userQuery = usersRef.where('email', '==', tenantEmail).limit(1);
        const userSnapshot = await userQuery.get();
        if (userSnapshot.empty) {
            console.warn(`Invite ${inviteId}: No user found with email ${tenantEmail}. Notification not created.`);
            // Optional: Update invite status to 'error_user_not_found'?
            // await snapshot.ref.update({ status: 'error_user_not_found', errorDetails: 'Tenant email not registered.'});
            return null;
        }
        tenantUid = userSnapshot.docs[0].id;
        console.log(`Invite ${inviteId}: Found user UID ${tenantUid} for email ${tenantEmail}`);
    }
    catch (error) {
        console.error(`Invite ${inviteId}: Error querying users collection for email ${tenantEmail}:`, error);
        // Optional: Update invite status to 'error_finding_user'?
        return null; // Exit on error during user lookup
    }
    // 3. Construct Notification Payload
    const notificationData = {
        recipientUid: tenantUid,
        type: "property_invite",
        title: "Property Invitation",
        message: `${landlordName} invited you to join ${propertyName}.`,
        status: "unread",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        relatedData: {
            inviteId: inviteId, // Use the ID from context params
            propertyId: propertyId || null,
            propertyName: propertyName,
            landlordName: landlordName,
        }
    };
    console.log(`Invite ${inviteId}: Prepared notification data for user ${tenantUid}:`, notificationData);
    // 4. Write Notification Document
    try {
        const notificationRef = adminDb.collection('users').doc(tenantUid).collection('notifications');
        // Add the notification document
        await notificationRef.add(notificationData);
        console.log(`Invite ${inviteId}: Notification created successfully for user ${tenantUid}.`);
        return null; // Successful execution
    }
    catch (error) {
        // Log error but don't prevent function completion, as invite itself was created
        console.error(`Invite ${inviteId}: CRITICAL ERROR - Failed to write notification for user ${tenantUid}:`, error);
        // Optional: Update invite status to 'error_notification_failed'?
        // await snapshot.ref.update({ status: 'error_notification_failed', errorDetails: 'Failed to create notification document.' });
        return null; // Exit on error during notification write
    }
    console.log(`--- Function End: createNotificationOnInvite (Invite ID: ${inviteId}) ---`);
});
//# sourceMappingURL=inviteTriggers.js.map