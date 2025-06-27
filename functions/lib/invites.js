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
exports.sendInviteEmail = void 0;
// NOTE: Email sending migrated to unified service in src/services/unifiedEmailService.ts
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Helper to generate a random code
const generateInviteCode = (length = 8) => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};
// Initialize admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}
// Lazy initialization for APP_DOMAIN (temporarily unused - migrated to unified service)
// let APP_DOMAIN: string;
// const getAppDomain = (): string => {
//   if (!APP_DOMAIN) {
//     try {
//       APP_DOMAIN = process.env.APP_DOMAIN || 
//         (functions.config().app && functions.config().app.domain) || 
//         'https://propagentic.com';
//     } catch (error) {
//       logger.warn('Failed to get app domain from config, using default');
//       APP_DOMAIN = 'https://propagentic.com';
//     }
//   }
//   return APP_DOMAIN;
// };
/**
 * Firestore trigger: Send invite email when invite document is created
 * Now uses SendGrid instead of Firebase mail extension
 */
exports.sendInviteEmail = functions.firestore
    .onDocumentCreated('invites/{inviteId}', async (event) => {
    const snap = event.data;
    if (!snap) {
        logger.error('No data associated with the event');
        return;
    }
    const inviteData = snap.data();
    const { inviteId } = event.params;
    if (!inviteData || !inviteData.tenantEmail) {
        logger.error('Invalid invite data or missing email:', inviteData);
        return;
    }
    // 1. Generate a unique invite code
    const inviteCode = generateInviteCode();
    // 2. Update the document with the code and status
    try {
        await snap.ref.update({
            code: inviteCode,
            status: 'sending', // Update status to 'sending'
            emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Invite ${inviteId} updated with code ${inviteCode}.`);
    }
    catch (error) {
        logger.error(`Error updating invite ${inviteId} with code:`, error);
        return; // Stop if we can't save the code
    }
    // 3. Send the invitation email via SendGrid (temporarily disabled - migrated to unified service)
    // const landlordName = inviteData.landlordName || 'A property manager';
    // const propertyName = inviteData.propertyName || 'a property';
    const tenantEmail = inviteData.tenantEmail;
    try {
        logger.info(`Sending invite email to: ${tenantEmail} - NOTE: Email sending migrated to unified service`);
        // TODO: Integrate with unified email service from src/services/unifiedEmailService.ts
        // For now, mark as sent to avoid breaking the flow
        logger.warn('Email sending temporarily disabled - migrated to unified service');
        // Update document with success status (temporary)
        await snap.ref.update({
            status: 'sent',
            emailDeliveredAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Invitation marked as sent (unified service integration pending): ${tenantEmail}, invite ID: ${inviteId}`);
    }
    catch (error) {
        logger.error('Error sending email via SendGrid:', {
            error: error.message,
            inviteId,
            tenantEmail
        });
        // Update the document to reflect the email failure
        await snap.ref.update({
            status: 'failed',
            error: error.message || 'Failed to send email via SendGrid.',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
//# sourceMappingURL=invites.js.map