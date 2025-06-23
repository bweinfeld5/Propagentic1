import * as functions from 'firebase-functions';
import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

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
 * Send property invitation email using Firebase Extension
 */
const sendPropertyInvitationEmailViaExtension = async (
  tenantEmail: string,
  tenantName: string,
  landlordEmail: string,
  propertyName: string,
  propertyAddress: string,
  appDomain: string
): Promise<string | null> => {
  try {
    const loginUrl = `${appDomain}/login`;
    const dashboardUrl = `${appDomain}/tenant/dashboard`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4F46E5; margin: 0; padding: 0;">PropAgentic</h1>
          <p style="color: #64748b; font-size: 16px; margin-top: 5px;">Property Management, Simplified</p>
        </div>
        
        <div style="background-color: white; padding: 20px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
          <h2 style="color: #333; font-size: 20px; margin-top: 0;">Property Invitation</h2>
          
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            Hello ${tenantName},
          </p>
          
          <p style="font-size: 16px; line-height: 1.5; color: #555;">
            ${landlordEmail} has invited you to join 
            <strong>${propertyName}</strong>${propertyAddress ? ` (${propertyAddress})` : ''} on PropAgentic.
          </p>
          
          <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: bold; color: #333;">🏠 Property Details:</p>
            <p style="margin: 5px 0; color: #4F46E5; font-weight: bold;">${propertyName}</p>
            ${propertyAddress ? `<p style="margin: 5px 0; color: #64748b; font-size: 14px;">${propertyAddress}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${dashboardUrl}" 
               style="background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">
               View Dashboard
            </a>
          </div>
          
          <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
            You can access your tenant dashboard at any time by logging into 
            <a href="${loginUrl}" style="color: #4F46E5; text-decoration: none;">${appDomain}</a>
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
            <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">What's Next?</h3>
            <ul style="color: #555; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
              <li>Log into your PropAgentic account</li>
              <li>Check your tenant dashboard for the property invitation</li>
              <li>Accept the invitation to get full access to property features</li>
              <li>Submit maintenance requests, view property info, and communicate with your landlord</li>
            </ul>
          </div>
        </div>
        
        <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #64748b; font-size: 12px;">
          <p>This is an automated message from PropAgentic. Please do not reply to this email.</p>
          <p>If you have questions, please contact your property manager: ${landlordEmail}</p>
          <p>&copy; ${new Date().getFullYear()} PropAgentic. All rights reserved.</p>
        </div>
      </div>
    `;

    const textContent = `
PropAgentic Property Invitation

Hello ${tenantName},

${landlordEmail} has invited you to join ${propertyName}${propertyAddress ? ` (${propertyAddress})` : ''} on PropAgentic.

What's Next?
1. Log into your PropAgentic account at ${loginUrl}
2. Check your tenant dashboard for the property invitation
3. Accept the invitation to get full access to property features
4. Submit maintenance requests, view property info, and communicate with your landlord

Visit your dashboard: ${dashboardUrl}

This is an automated message from PropAgentic. If you have questions, please contact your property manager: ${landlordEmail}

© ${new Date().getFullYear()} PropAgentic. All rights reserved.
    `;

    // Use Firebase Extension for email sending
    const emailData = {
      to: tenantEmail,
      subject: `Property Invitation: ${propertyName}`,
      html: htmlContent,
      text: textContent,
      metadata: {
        type: 'property_invitation',
        tenantEmail: tenantEmail,
        landlordEmail: landlordEmail,
        propertyName: propertyName,
        source: 'propertyInvitationNotifications'
      }
    };

    // Add to mail collection for Firebase Extension to process
    const mailDoc = await admin.firestore().collection('mail').add(emailData);
    
    logger.info(`Property invitation email queued successfully via Firebase Extension`, {
      mailDocId: mailDoc.id,
      tenantEmail,
      propertyName
    });

    return mailDoc.id;
  } catch (error: any) {
    logger.error('Error sending property invitation email via Firebase Extension:', error);
    throw error;
  }
};

/**
 * Firestore trigger: Send email notification when property invitation is created for existing users
 */
export const sendPropertyInvitationEmail = functions.firestore
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
    } catch (error) {
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
          propertyName = propertyData?.name || propertyData?.nickname || propertyData?.title || 'a property';
          
          // Construct address
          if (propertyData?.address) {
            if (typeof propertyData.address === 'string') {
              propertyAddress = propertyData.address;
            } else {
              const { street, city, state, zip } = propertyData.address;
              propertyAddress = [street, city, state, zip].filter(Boolean).join(', ');
            }
          } else {
            // Fallback to individual fields
            const parts = [
              propertyData?.street || propertyData?.streetAddress,
              propertyData?.city,
              propertyData?.state,
              propertyData?.zipCode || propertyData?.zip
            ].filter(Boolean);
            propertyAddress = parts.join(', ');
          }
        }
      } catch (error) {
        logger.warn(`Could not fetch property details for ${invitationData.propertyId}:`, error);
      }
    }

    // Send the property invitation email
    const landlordEmail = invitationData.landlordEmail || 'property manager';
    const tenantEmail = invitationData.tenantEmail;
    const tenantName = invitationData.tenantName || tenantEmail.split('@')[0];

    try {
      logger.info(`Sending property invitation email to existing user: ${tenantEmail}`);
      
      // Use Firebase Extension instead of direct SendGrid
      const mailDocId = await sendPropertyInvitationEmailViaExtension(
        tenantEmail,
        tenantName,
        landlordEmail,
        propertyName,
        propertyAddress,
        getAppDomain()
      );

      if (mailDocId) {
        // Update document with success status
        await snap.ref.update({
          emailDeliveredAt: admin.firestore.FieldValue.serverTimestamp(),
          mailDocId: mailDocId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Property invitation email queued successfully via Firebase Extension`, {
          tenantEmail,
          invitationId,
          mailDocId
        });
      } else {
        throw new Error('Firebase Extension email queueing failed');
      }
    } catch (error: any) {
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
 */
export const sendPropertyInvitationEmailManual = onCall(async (request: CallableRequest<{ invitationId: string }>) => {
  // Verify authentication
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Verify user is a landlord
  const userDoc = await admin.firestore()
    .collection('users')
    .doc(request.auth.uid)
    .get();
  
  const userData = userDoc.data();
  if (!userData || (userData.userType !== 'landlord' && userData.role !== 'landlord')) {
    throw new HttpsError('permission-denied', 'Only landlords can send property invitations');
  }

  const { invitationId } = request.data;
  
  if (!invitationId) {
    throw new HttpsError('invalid-argument', 'Invitation ID is required');
  }

  try {
    // Get the invitation data
    const invitationDoc = await admin.firestore()
      .collection('propertyInvitations')
      .doc(invitationId)
      .get();

    if (!invitationDoc.exists) {
      throw new HttpsError('not-found', 'Invitation not found');
    }

    const invitationData = invitationDoc.data();
    
    // Verify the landlord owns this invitation
    if (invitationData?.landlordId !== request.auth.uid) {
      throw new HttpsError('permission-denied', 'You can only send your own invitations');
    }

    // Force send email by creating a new mail document
    try {
      const tenantName = invitationData.tenantName || invitationData.tenantEmail.split('@')[0];
      const propertyName = invitationData.propertyName || 'your property';
      const propertyAddress = invitationData.propertyAddress || '';
      
      const mailDocId = await sendPropertyInvitationEmailViaExtension(
        invitationData.tenantEmail,
        tenantName,
        invitationData.landlordEmail,
        propertyName,
        propertyAddress,
        getAppDomain()
      );

      // Update invitation with manual send status
      await invitationDoc.ref.update({
        manualEmailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        manualEmailDocId: mailDocId,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Manual property invitation email sent successfully`, {
        invitationId,
        mailDocId,
        tenantEmail: invitationData.tenantEmail
      });
      
      return { 
        success: true, 
        message: 'Email sent successfully via Firebase Extension',
        mailDocId: mailDocId
      };
    } catch (error: any) {
      logger.error('Error in manual email sending:', error);
      throw new HttpsError('internal', `Failed to send email: ${error.message}`);
    }
  } catch (error: any) {
    logger.error('Error in manual property invitation email:', error);
    throw new HttpsError('internal', error.message || 'Failed to process email request');
  }
}); 