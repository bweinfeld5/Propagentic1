import * as functions from 'firebase-functions';
import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

// Lazy initialization for APP_DOMAIN
let APP_DOMAIN: string;
const getAppDomain = (): string => {
  if (!APP_DOMAIN) {
    try {
      APP_DOMAIN = process.env.APP_DOMAIN || 'https://propagentic.com';
    } catch (error) {
      logger.warn('Failed to get app domain from config, using default');
      APP_DOMAIN = 'https://propagentic.com';
    }
  }
  return APP_DOMAIN;
};

/**
 * Send property invitation email via Firebase Extension
 * Uses consistent format and enhanced error logging
 */
const sendPropertyInvitationEmailViaExtension = async (
  tenantEmail: string,
  tenantName: string,
  landlordEmail: string,
  propertyName: string,
  propertyAddress: string,
  appDomain: string
): Promise<string> => {
  try {
    const loginUrl = `${appDomain}/login`;
    const dashboardUrl = `${appDomain}/tenant/dashboard`;

    // Generate comprehensive email content
    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Invitation: ${propertyName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f8fafc;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
    <!-- Header -->
    <div style="background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 40px 20px; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">PropAgentic</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Property Invitation</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 20px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hello ${tenantName}!</h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        ${landlordEmail} has invited you to join <strong>${propertyName}</strong>${propertyAddress ? ` located at ${propertyAddress}` : ''} on PropAgentic.
      </p>
      
      <!-- What's Next Section -->
      <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">What's Next?</h3>
        <ol style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Log into your PropAgentic account at <a href="${loginUrl}" style="color: #4F46E5;">${loginUrl}</a></li>
          <li>Check your tenant dashboard for the property invitation</li>
          <li>Accept the invitation to get full access to property features</li>
          <li>Submit maintenance requests, view property info, and communicate with your landlord</li>
        </ol>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" 
           style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          Access Your Dashboard
        </a>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
        This is an automated message from PropAgentic. If you have questions, please contact your property manager: 
        <a href="mailto:${landlordEmail}" style="color: #4F46E5;">${landlordEmail}</a>
      </p>
    </div>
    
    <!-- Footer -->
    <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} PropAgentic. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
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

    // Use CONSISTENT Firebase Extension format (direct fields, no message wrapper)
    const emailData = {
      to: tenantEmail,
      subject: `Property Invitation: ${propertyName}`,
      html: htmlContent,
      text: textContent,
      // Add metadata for tracking and debugging
      metadata: {
        type: 'property_invitation',
        tenantEmail: tenantEmail,
        landlordEmail: landlordEmail,
        propertyName: propertyName,
        source: 'propertyInvitationNotifications',
        version: '2.0', // Version for tracking format updates
        timestamp: new Date().toISOString()
      }
    };

    logger.info('Attempting to queue property invitation email', {
      tenantEmail,
      propertyName,
      landlordEmail,
      emailFormat: 'direct_fields',
      dataStructure: Object.keys(emailData)
    });

    // Add to mail collection for Firebase Extension to process
    const mailDoc = await admin.firestore().collection('mail').add(emailData);
    
    logger.info(`Property invitation email queued successfully via Firebase Extension`, {
      mailDocId: mailDoc.id,
      tenantEmail,
      propertyName,
      subjectLength: emailData.subject.length,
      htmlLength: emailData.html.length,
      textLength: emailData.text.length
    });

    return mailDoc.id;
  } catch (error: any) {
    logger.error('Error sending property invitation email via Firebase Extension:', {
      error: error.message,
      errorCode: error.code,
      errorStack: error.stack,
      tenantEmail,
      propertyName,
      landlordEmail
    });
    throw error;
  }
};

/**
 * Firestore trigger: Send property invitation email when invitation document is created
 */
export const sendPropertyInvitationEmail =
  onDocumentCreated('propertyInvitations/{invitationId}', async (event) => {
    const snap = event.data;
    if (!snap) {
      logger.error('No data associated with the propertyInvitations event');
      return;
    }

    const invitationData = snap.data();
    const { invitationId } = event.params;

    logger.info('Property invitation created, processing email...', {
      invitationId,
      tenantEmail: invitationData?.tenantEmail,
      propertyId: invitationData?.propertyId
    });

    if (!invitationData || !invitationData.tenantEmail) {
      logger.error('Invalid invitation data or missing tenant email:', {
        invitationId,
        hasData: !!invitationData,
        tenantEmail: invitationData?.tenantEmail
      });
      return;
    }

    // Get property details
    let propertyName = invitationData.propertyName || 'your property';
    let propertyAddress = invitationData.propertyAddress || '';

    if (invitationData.propertyId) {
      try {
        const propertyDoc = await admin.firestore()
          .collection('properties')
          .doc(invitationData.propertyId)
          .get();

        if (propertyDoc.exists) {
          const propertyData = propertyDoc.data();
          propertyName = propertyData?.name || propertyName;
          propertyAddress = propertyData?.address || propertyAddress;
          
          logger.info('Property details fetched successfully', {
            propertyId: invitationData.propertyId,
            propertyName,
            hasAddress: !!propertyAddress
          });
        }
      } catch (error: any) {
        logger.warn(`Could not fetch property details for ${invitationData.propertyId}:`, {
          error: error.message,
          propertyId: invitationData.propertyId
        });
      }
    }

    // Send the property invitation email
    const landlordEmail = invitationData.landlordEmail || 'property manager';
    const tenantEmail = invitationData.tenantEmail;
    const tenantName = invitationData.tenantName || tenantEmail.split('@')[0];

    try {
      logger.info(`Sending property invitation email to: ${tenantEmail}`, {
        invitationId,
        tenantName,
        landlordEmail,
        propertyName
      });
      
      // Use Firebase Extension with consistent format
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
          emailStatus: 'queued', // Track email status
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        logger.info(`Property invitation email queued successfully`, {
          tenantEmail,
          invitationId,
          mailDocId,
          status: 'queued'
        });
      } else {
        throw new Error('Firebase Extension email queueing failed - no mailDocId returned');
      }
    } catch (error: any) {
      logger.error('Error sending property invitation email:', {
        error: error.message,
        errorCode: error.code,
        errorStack: error.stack,
        invitationId,
        tenantEmail,
        landlordEmail,
        propertyName
      });

      // Update the document to reflect the email failure
      await snap.ref.update({
        emailError: error.message || 'Failed to send email notification.',
        emailStatus: 'failed',
        emailFailedAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }
  });

/**
 * Callable function: Manually send property invitation email
 */
export const sendPropertyInvitationEmailManual = onCall(async (request: CallableRequest<{ invitationId: string }>) => {
  // Verify user is authenticated
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { invitationId } = request.data;
  
  if (!invitationId) {
    throw new HttpsError('invalid-argument', 'invitationId is required');
  }

  logger.info('Manual property invitation email requested', {
    invitationId,
    userId: request.auth.uid
  });

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
        manualEmailStatus: 'queued',
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      logger.info(`Manual property invitation email sent successfully`, {
        invitationId,
        mailDocId,
        tenantEmail: invitationData.tenantEmail,
        userId: request.auth.uid
      });
      
      return { 
        success: true, 
        message: 'Email sent successfully via Firebase Extension',
        mailDocId: mailDocId
      };
    } catch (error: any) {
      logger.error('Error in manual email sending:', {
        error: error.message,
        errorCode: error.code,
        invitationId,
        userId: request.auth.uid
      });
      throw new HttpsError('internal', `Failed to send email: ${error.message}`);
    }
  } catch (error: any) {
    if (error instanceof HttpsError) {
      throw error;
    }
    logger.error('Unexpected error in manual email sending:', {
      error: error.message,
      invitationId,
      userId: request.auth.uid
    });
    throw new HttpsError('internal', 'An unexpected error occurred');
  }
}); 