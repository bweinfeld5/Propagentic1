"use strict";
/**
 * Firebase Cloud Function to send notifications when a contractor is assigned to a ticket
 * This function sends emails and optional push notifications to the assigned contractor
 */
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
exports.notifyAssignedContractor = void 0;
// Import Firebase Functions v2
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const messaging_1 = require("firebase-admin/messaging"); // Import specific messaging function
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Cloud Function that triggers when a maintenance ticket is updated with an assigned contractor
 */
exports.notifyAssignedContractor = (0, firestore_1.onDocumentUpdated)({
    document: "tickets/{ticketId}",
    region: "us-central1",
}, async (event) => {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        if (!event.data) {
            logger.info("Event data missing, skipping.");
            return;
        }
        const beforeData = event.data.before.data();
        const afterData = event.data.after.data();
        // Check if a contractor was just assigned or data is missing
        if (!afterData || !beforeData || !afterData.assignedTo ||
            (beforeData.assignedTo === afterData.assignedTo &&
                beforeData.status === afterData.status)) {
            // No new assignment happened or data missing
            return;
        }
        // Verify the status is 'assigned'
        if (afterData.status !== "assigned") {
            logger.info(`Ticket ${event.params.ticketId} assigned but status is not 'assigned'. ` +
                `Current status: ${afterData.status}`);
            return;
        }
        logger.info(`Contractor ${afterData.assignedTo} assigned to ticket ${event.params.ticketId}`);
        // Get the contractor user data
        const contractorSnapshot = await admin.firestore()
            .collection('users')
            .doc(afterData.assignedTo)
            .get();
        if (!contractorSnapshot.exists) {
            throw new Error(`Contractor user ${afterData.assignedTo} not found`);
        }
        const contractorData = contractorSnapshot.data();
        if (!contractorData) {
            throw new Error(`Contractor user data missing for ${afterData.assignedTo}`);
        }
        // Get property details
        if (!afterData.propertyId) { // Check if propertyId exists
            throw new Error(`Property ID missing on ticket ${event.params.ticketId}`);
        }
        const propertySnapshot = await admin.firestore()
            .collection('properties')
            .doc(afterData.propertyId)
            .get();
        if (!propertySnapshot.exists) {
            throw new Error(`Property ${afterData.propertyId} not found`);
        }
        const propertyData = propertySnapshot.data();
        if (!propertyData) {
            throw new Error(`Property data missing for ${afterData.propertyId}`);
        }
        // Prepare notification data
        const notificationDetails = {
            ticketId: event.params.ticketId,
            propertyName: (_a = propertyData.propertyName) !== null && _a !== void 0 ? _a : 'Unknown Property',
            propertyAddress: propertyData.address ? `${propertyData.address.street}, ${propertyData.address.city}, ${propertyData.address.state} ${propertyData.address.zip}` : 'Address unavailable',
            unitNumber: (_b = afterData.unitNumber) !== null && _b !== void 0 ? _b : 'N/A',
            category: (_c = afterData.category) !== null && _c !== void 0 ? _c : 'Uncategorized',
            urgency: (_d = afterData.urgency) !== null && _d !== void 0 ? _d : 'N/A',
            description: (_e = afterData.description) !== null && _e !== void 0 ? _e : 'No description',
            assignedAt: new Date().toISOString(),
            propertyId: afterData.propertyId // Include propertyId for potential deep linking
        };
        // Add to contractor's notifications subcollection (assuming notifications are per-user)
        await admin.firestore()
            .collection('users').doc(afterData.assignedTo).collection('notifications')
            .add({
            // userId: afterData.assignedTo, // Redundant if it's a subcollection of the user
            // userRole: 'contractor', // Might not be needed if collection is specific
            type: 'assignment',
            data: notificationDetails,
            read: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Check if we should send an email notification
        if (contractorData.email) {
            await sendEmailNotification(contractorData.email, (_h = (_g = (_f = contractorData.name) !== null && _f !== void 0 ? _f : contractorData.displayName) !== null && _g !== void 0 ? _g : contractorData.firstName) !== null && _h !== void 0 ? _h : 'Contractor', // Use available name fields
            notificationDetails);
        }
        // Check if we need to send a push notification
        await sendPushNotification(afterData.assignedTo, notificationDetails);
        logger.info(`Successfully notified contractor ${afterData.assignedTo} about assignment`);
    }
    catch (error) {
        logger.error("Error notifying assigned contractor:", (error === null || error === void 0 ? void 0 : error.message) || error);
    }
});
/**
 * Send an email notification to the assigned contractor
 */
async function sendEmailNotification(email, name, data) {
    try {
        logger.info(`Attempting to send email to ${email} for ${name} about ticket ${data.ticketId}`);
        // Using Firebase Extensions for email
        await admin.firestore().collection('mail').add({
            to: email,
            message: {
                subject: `New Maintenance Assignment: ${data.category} at ${data.propertyName}`,
                text: `Hello ${name},\n\nYou have been assigned a new maintenance request:\n\n` +
                    `Property: ${data.propertyName}\n` +
                    `Address: ${data.propertyAddress}\n` +
                    `Unit: ${data.unitNumber}\n` +
                    `Category: ${data.category}\n` +
                    `Urgency: ${data.urgency}\n\n` +
                    `Description: ${data.description}\n\n` +
                    `Please log in to the Propagentic app to view details and respond.\n\n` +
                    `Thank you,\nThe Propagentic Team`,
                // Optional: Add HTML content
                // html: `<strong>Hello ${name},</strong><br>You have been assigned...`,
            }
        });
        logger.info(`Email queued successfully for ${email}`);
    }
    catch (error) {
        logger.error(`Error sending email notification to ${email}:`, (error === null || error === void 0 ? void 0 : error.message) || error);
        // Don't rethrow, just log the error for email sending
    }
}
/**
 * Send a push notification to the assigned contractor
 */
async function sendPushNotification(contractorId, data) {
    try {
        // Check if the user has registered FCM tokens
        const tokensSnapshot = await admin.firestore()
            .collection('fcmTokens') // Assuming a top-level collection for tokens
            .where('userId', '==', contractorId)
            .get();
        if (tokensSnapshot.empty) {
            logger.info(`No FCM tokens found for contractor ${contractorId}`);
            return;
        }
        // Get all valid tokens for the user
        const tokens = [];
        tokensSnapshot.forEach(doc => {
            const tokenData = doc.data();
            if (tokenData === null || tokenData === void 0 ? void 0 : tokenData.token) { // Check if token exists
                tokens.push(tokenData.token);
            }
        });
        if (tokens.length === 0) {
            logger.info(`No valid tokens extracted for contractor ${contractorId}`);
            return;
        }
        // Craft notification message payload for sendMulticast
        const messagePayload = {
            notification: {
                title: `New Assignment: ${data.category}`,
                body: `You've been assigned to a ${data.urgency} ${data.category} task at ${data.propertyName}`,
            },
            data: {
                ticketId: data.ticketId,
                type: 'new_assignment',
                propertyId: data.propertyId,
                createdAt: data.assignedAt,
            },
            tokens: tokens,
        };
        logger.info(`Attempting to send push notifications to ${tokens.length} devices for contractor ${contractorId}`);
        // Use getMessaging() from firebase-admin/messaging
        const response = await (0, messaging_1.getMessaging)().sendEachForMulticast(messagePayload);
        logger.info(`Push notification response: ${response.successCount} successful, ${response.failureCount} failed.`);
        // Clean up invalid tokens
        if (response.failureCount > 0) {
            const tokensToDelete = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error;
                    logger.warn(`Failed to send notification to token: ${tokens[idx]}`, error === null || error === void 0 ? void 0 : error.message);
                    // Check for specific error codes indicating an invalid or unregistered token
                    if (error && (error.code === 'messaging/invalid-registration-token' ||
                        error.code === 'messaging/registration-token-not-registered' ||
                        error.code === 'messaging/invalid-argument')) { // Add other relevant codes
                        // Find the document reference for the invalid token and schedule deletion
                        const invalidTokenDoc = tokensSnapshot.docs[idx]; // Assuming order is preserved
                        if (invalidTokenDoc) {
                            tokensToDelete.push(invalidTokenDoc.ref.delete());
                            logger.info(`Scheduled deletion for invalid token: ${tokens[idx]}`);
                        }
                    }
                }
            });
            await Promise.all(tokensToDelete); // Wait for deletions to complete
            logger.info(`Cleaned up ${tokensToDelete.length} invalid tokens.`);
        }
    }
    catch (error) {
        logger.error(`Error sending push notification to contractor ${contractorId}:`, (error === null || error === void 0 ? void 0 : error.message) || error);
        // Don't rethrow, just log the error
    }
}
//# sourceMappingURL=notifyAssignedContractor.js.map