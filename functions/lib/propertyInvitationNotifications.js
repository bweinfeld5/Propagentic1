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
exports.sendPropertyInvitationEmailManual = exports.sendPropertyInvitationEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const https_1 = require("firebase-functions/v2/https");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
const sendgridEmailService_1 = require("./sendgridEmailService");
// Initialize admin if not already done
if (!admin.apps.length) {
    admin.initializeApp();
}
// Lazy initialization for APP_DOMAIN
let APP_DOMAIN;
const getAppDomain = () => {
    if (!APP_DOMAIN) {
        try {
            APP_DOMAIN = process.env.APP_DOMAIN ||
                (functions.config().app && functions.config().app.domain) ||
                'https://propagentic.com';
        }
        catch (error) {
            logger.warn('Failed to get app domain from config, using default');
            APP_DOMAIN = 'https://propagentic.com';
        }
    }
    return APP_DOMAIN;
};
/**
 * Firestore trigger: Send email notification when property invitation is created for existing users
 */
exports.sendPropertyInvitationEmail = functions.firestore
    .onDocumentCreated('propertyInvitations/{invitationId}', async (event) => {
    const snap = event.data;
    if (!snap) {
        logger.error('No data associated with the event');
        return;
    }
    const invitationData = snap.data();
    const { invitationId } = event.params;
    if (!invitationData || !invitationData.tenantEmail) {
        logger.error('Invalid invitation data or missing email:', invitationData);
        return;
    }
    // Only send emails for existing users (not for new invitations that use traditional invite codes)
    if (invitationData.type !== 'existing_user') {
        logger.info(`Skipping email for invitation ${invitationId} - not for existing user`);
        return;
    }
    // Update the document to show we're sending the email
    try {
        await snap.ref.update({
            emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Property invitation ${invitationId} marked as sending email.`);
    }
    catch (error) {
        logger.error(`Error updating property invitation ${invitationId}:`, error);
        return;
    }
    // Get property details for the email
    let propertyName = 'a property';
    let propertyAddress = '';
    if (invitationData.propertyId) {
        try {
            const propertyDoc = await admin.firestore()
                .collection('properties')
                .doc(invitationData.propertyId)
                .get();
            if (propertyDoc.exists) {
                const propertyData = propertyDoc.data();
                propertyName = (propertyData === null || propertyData === void 0 ? void 0 : propertyData.name) || (propertyData === null || propertyData === void 0 ? void 0 : propertyData.nickname) || (propertyData === null || propertyData === void 0 ? void 0 : propertyData.title) || 'a property';
                // Construct address
                if (propertyData === null || propertyData === void 0 ? void 0 : propertyData.address) {
                    if (typeof propertyData.address === 'string') {
                        propertyAddress = propertyData.address;
                    }
                    else {
                        const { street, city, state, zip } = propertyData.address;
                        propertyAddress = [street, city, state, zip].filter(Boolean).join(', ');
                    }
                }
                else {
                    // Fallback to individual fields
                    const parts = [
                        (propertyData === null || propertyData === void 0 ? void 0 : propertyData.street) || (propertyData === null || propertyData === void 0 ? void 0 : propertyData.streetAddress),
                        propertyData === null || propertyData === void 0 ? void 0 : propertyData.city,
                        propertyData === null || propertyData === void 0 ? void 0 : propertyData.state,
                        (propertyData === null || propertyData === void 0 ? void 0 : propertyData.zipCode) || (propertyData === null || propertyData === void 0 ? void 0 : propertyData.zip)
                    ].filter(Boolean);
                    propertyAddress = parts.join(', ');
                }
            }
        }
        catch (error) {
            logger.warn(`Could not fetch property details for ${invitationData.propertyId}:`, error);
        }
    }
    // Send the property invitation email
    const landlordEmail = invitationData.landlordEmail || 'property manager';
    const tenantEmail = invitationData.tenantEmail;
    try {
        logger.info(`Sending property invitation email to existing user: ${tenantEmail}`);
        // For now, we'll use the existing property invite email function
        // TODO: This should be updated to use a specific template for existing users
        // const emailData = {
        //   to: tenantEmail,
        //   templateId: 'd-your-template-id', // You'll need to create this template in SendGrid
        //   dynamicTemplateData: {
        //     tenantName: tenantName,
        //     landlordEmail: landlordEmail,
        //     propertyName: propertyName,
        //     propertyAddress: propertyAddress,
        //     loginUrl: `${getAppDomain()}/login`,
        //     dashboardUrl: `${getAppDomain()}/tenant/dashboard`,
        //     expirationDate: invitationData.expiresAt?.toDate?.()?.toLocaleDateString?.() || 'in 7 days',
        //     supportEmail: 'support@propagentic.com'
        //   }
        // };
        const emailSent = await (0, sendgridEmailService_1.sendPropertyInviteEmail)(tenantEmail, 'EXISTING-USER', // No invite code needed for existing users
        landlordEmail, `${propertyName} ${propertyAddress ? `(${propertyAddress})` : ''}`, getAppDomain());
        if (emailSent) {
            // Update document with success status
            await snap.ref.update({
                emailDeliveredAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            logger.info(`Property invitation email sent successfully to: ${tenantEmail}, invitation ID: ${invitationId}`);
        }
        else {
            throw new Error('SendGrid email sending failed');
        }
    }
    catch (error) {
        logger.error('Error sending property invitation email:', {
            error: error.message,
            invitationId,
            tenantEmail
        });
        // Update the document to reflect the email failure
        await snap.ref.update({
            emailError: error.message || 'Failed to send email notification.',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
/**
 * Manual function to send property invitation emails (can be called from frontend)
 * Note: This is currently a placeholder - manual email sending is handled automatically
 */
exports.sendPropertyInvitationEmailManual = (0, https_1.onCall)(async (request) => {
    // Verify authentication
    if (!request.auth) {
        throw new https_1.HttpsError('unauthenticated', 'User must be authenticated');
    }
    // Verify user is a landlord
    const userDoc = await admin.firestore()
        .collection('users')
        .doc(request.auth.uid)
        .get();
    const userData = userDoc.data();
    if (!userData || (userData.userType !== 'landlord' && userData.role !== 'landlord')) {
        throw new https_1.HttpsError('permission-denied', 'Only landlords can send property invitations');
    }
    const { invitationId } = request.data;
    if (!invitationId) {
        throw new https_1.HttpsError('invalid-argument', 'Invitation ID is required');
    }
    try {
        // Get the invitation data
        const invitationDoc = await admin.firestore()
            .collection('propertyInvitations')
            .doc(invitationId)
            .get();
        if (!invitationDoc.exists) {
            throw new https_1.HttpsError('not-found', 'Invitation not found');
        }
        const invitationData = invitationDoc.data();
        // Verify the landlord owns this invitation
        if ((invitationData === null || invitationData === void 0 ? void 0 : invitationData.landlordId) !== request.auth.uid) {
            throw new https_1.HttpsError('permission-denied', 'You can only send your own invitations');
        }
        // For now, emails are sent automatically via the Firestore trigger
        // This function can be expanded later for manual email resending
        logger.info(`Manual email request for invitation ${invitationId} (currently handled automatically)`);
        return { success: true, message: 'Email notification handled automatically' };
    }
    catch (error) {
        logger.error('Error in manual property invitation email:', error);
        throw new https_1.HttpsError('internal', error.message || 'Failed to process email request');
    }
});
//# sourceMappingURL=propertyInvitationNotifications.js.map