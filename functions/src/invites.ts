import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { sendPropertyInviteEmail } from './sendgridEmailService';

// Helper to generate a random code
const generateInviteCode = (length = 8): string => {
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

// Lazy initialization for APP_DOMAIN
let APP_DOMAIN: string;
const getAppDomain = (): string => {
  if (!APP_DOMAIN) {
    try {
      APP_DOMAIN = process.env.APP_DOMAIN || 
        (functions.config().app && functions.config().app.domain) || 
        'https://propagentic.com';
    } catch (error) {
      logger.warn('Failed to get app domain from config, using default');
      APP_DOMAIN = 'https://propagentic.com';
    }
  }
  return APP_DOMAIN;
};

/**
 * Firestore trigger: Send invite email when invite document is created
 * Now uses SendGrid instead of Firebase mail extension
 */
export const sendInviteEmail = functions.firestore
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
    } catch (error) {
      logger.error(`Error updating invite ${inviteId} with code:`, error);
      return; // Stop if we can't save the code
    }

    // 3. Send the invitation email via SendGrid
    const landlordName = inviteData.landlordName || 'A property manager';
    const propertyName = inviteData.propertyName || 'a property';
    const tenantEmail = inviteData.tenantEmail;

    try {
      logger.info(`Sending invite email via SendGrid to: ${tenantEmail}`);
      
      const emailSent = await sendPropertyInviteEmail(
        tenantEmail,
        inviteCode,
        landlordName,
        propertyName,
        getAppDomain()
      );

      if (emailSent) {
        // Update document with success status
        await snap.ref.update({
          status: 'sent',
          emailDeliveredAt: admin.firestore.FieldValue.serverTimestamp(),
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Invitation email sent successfully via SendGrid to: ${tenantEmail}, invite ID: ${inviteId}`);
      } else {
        throw new Error('SendGrid email sending failed');
      }
    } catch (error: any) {
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