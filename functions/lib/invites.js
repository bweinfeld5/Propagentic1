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
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendInviteEmail = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
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
const APP_DOMAIN = ((_a = functions.config().app) === null || _a === void 0 ? void 0 : _a.domain) || 'http://localhost:3000';
// This function will now generate a code and update the document
exports.sendInviteEmail = functions.firestore
    .onDocumentCreated('invites/{inviteId}', async (event) => {
    const snap = event.data;
    if (!snap) {
        console.log('No data associated with the event');
        return;
    }
    const inviteData = snap.data();
    const { inviteId } = event.params;
    if (!inviteData || !inviteData.tenantEmail) {
        console.error('Invalid invite data or missing email:', inviteData);
        return;
    }
    // 1. Generate a unique invite code
    const inviteCode = generateInviteCode();
    // 2. Update the document with the code and other details
    try {
        await snap.ref.update({
            code: inviteCode,
            status: 'sent', // Update status to 'sent'
            emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`Invite ${inviteId} updated with code ${inviteCode}.`);
    }
    catch (error) {
        console.error(`Error updating invite ${inviteId} with code:`, error);
        return; // Stop if we can't save the code
    }
    // 3. Send the invitation email via Firebase Extension
    const inviteLink = `${APP_DOMAIN}/invite?code=${inviteCode}`;
    const landlordName = inviteData.landlordName || 'A property manager';
    const propertyName = inviteData.propertyName || 'a property';
    const tenantEmail = inviteData.tenantEmail;
    // Create email document for Firebase Extension
    const emailData = {
        to: tenantEmail,
        message: {
            subject: `You're Invited to Join ${propertyName} on PropAgentic`,
            html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #4F46E5; margin: 0; padding: 0;">PropAgentic</h1>
              <p style="color: #64748b; font-size: 16px; margin-top: 5px;">Property Management, Simplified</p>
            </div>
            
            <div style="background-color: white; padding: 20px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
              <h2 style="color: #333; font-size: 20px; margin-top: 0;">You've Been Invited!</h2>
              
              <p style="font-size: 16px; line-height: 1.5; color: #555;">
                ${landlordName} has invited you to join 
                <strong>${propertyName}</strong> on PropAgentic.
              </p>
              
              <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-weight: bold; color: #333;">Your Invitation Code:</p>
                <p style="font-size: 24px; letter-spacing: 2px; color: #4F46E5; margin: 10px 0; font-weight: bold; font-family: monospace;">${inviteCode}</p>
                <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">This code is valid for 7 days</p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteLink}" 
                   style="background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">
                   Accept Invitation
                </a>
              </div>
              
              <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
                If the button doesn't work, you can also manually enter your invitation code after signing up at 
                <a href="${APP_DOMAIN}" style="color: #4F46E5; text-decoration: none;">${APP_DOMAIN}</a>
              </p>
            </div>
            
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #64748b; font-size: 12px;">
              <p>This is an automated message from PropAgentic. Please do not reply to this email.</p>
              <p>&copy; ${new Date().getFullYear()} PropAgentic. All rights reserved.</p>
            </div>
          </div>
        `,
            text: `You've been invited to join ${propertyName} on PropAgentic by ${landlordName}. Your invitation code is: ${inviteCode}. Visit ${inviteLink} to accept the invitation.`
        }
    };
    try {
        // Add email to the mail collection for Firebase Extension to process
        const db = admin.firestore();
        await db.collection('mail').add(emailData);
        console.log('Invitation email queued via Firebase Extension for:', tenantEmail, 'with invite ID:', inviteId);
    }
    catch (error) {
        console.error('Error queuing email via Firebase Extension:', error);
        // Update the document to reflect the email failure
        await snap.ref.update({
            status: 'failed',
            error: 'Failed to queue email.',
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }
});
//# sourceMappingURL=invites.js.map