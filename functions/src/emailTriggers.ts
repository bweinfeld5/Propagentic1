import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';
import { onDocumentCreated } from 'firebase-functions/v2/firestore';

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Generate invite code (helper function)
 */
const generateInviteCode = (length = 8): string => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Get app domain helper
 */
const getAppDomain = (): string => {
  return process.env.APP_DOMAIN || 'https://propagentic.com';
};

/**
 * Send email via Firebase Extension (consistent format)
 */
const sendEmailViaExtension = async (emailData: {
  to: string;
  subject: string;
  html: string;
  text: string;
  metadata?: any;
}): Promise<string> => {
  try {
    const mailDoc = await admin.firestore().collection('mail').add(emailData);
    logger.info('Email queued successfully via Firebase Extension', {
      mailDocId: mailDoc.id,
      to: emailData.to,
      subject: emailData.subject
    });
    return mailDoc.id;
  } catch (error: any) {
    logger.error('Error queueing email via Firebase Extension:', {
      error: error.message,
      to: emailData.to,
      subject: emailData.subject
    });
    throw error;
  }
};

/**
 * TRIGGER 1: Send email when invite code is created in inviteCodes collection
 */
export const sendInviteCodeEmail = onDocumentCreated('inviteCodes/{codeId}', async (event) => {
  const snap = event.data;
  if (!snap) {
    logger.error('No data associated with inviteCodes event');
    return;
  }

  const codeData = snap.data();
  const { codeId } = event.params;

  logger.info('Invite code created, processing email...', {
    codeId,
    email: codeData?.email,
    propertyId: codeData?.propertyId
  });

  // Only send email if email field is provided
  if (!codeData?.email) {
    logger.info('No email provided for invite code, skipping email', { codeId });
    return;
  }

  try {
    // Get property details
    let propertyName = 'Your Property';
    let landlordName = 'Property Manager';

    if (codeData.propertyId) {
      try {
        const propertyDoc = await admin.firestore()
          .collection('properties')
          .doc(codeData.propertyId)
          .get();

        if (propertyDoc.exists) {
          const propertyData = propertyDoc.data();
          propertyName = propertyData?.name || propertyName;
        }
      } catch (error: any) {
        logger.warn('Could not fetch property details:', error.message);
      }
    }

    if (codeData.landlordId) {
      try {
        const landlordDoc = await admin.firestore()
          .collection('users')
          .doc(codeData.landlordId)
          .get();

        if (landlordDoc.exists) {
          const landlordData = landlordDoc.data();
          landlordName = landlordData?.displayName || landlordData?.firstName || landlordName;
        }
      } catch (error: any) {
        logger.warn('Could not fetch landlord details:', error.message);
      }
    }

    // Generate email content
    const inviteUrl = `${getAppDomain()}/invite?code=${codeData.code}`;
    const tenantName = codeData.email.split('@')[0];

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Invitation Code: ${propertyName}</title>
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
        ${landlordName} has invited you to join <strong>${propertyName}</strong> on PropAgentic.
      </p>
      
      <!-- Invite Code Section -->
      <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Your Invitation Code</h3>
        <div style="background-color: #4F46E5; color: white; padding: 15px 25px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">
          ${codeData.code}
        </div>
        <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px;">Valid for 7 days</p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" 
           style="background-color: #4F46E5; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          Accept Invitation
        </a>
      </div>
      
      <div style="background-color: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 16px;">What's Next?</h3>
        <ol style="color: #6b7280; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Click the button above or visit PropAgentic</li>
          <li>Enter your invitation code: <strong>${codeData.code}</strong></li>
          <li>Create your tenant account or sign in</li>
          <li>Start submitting maintenance requests and communicating with your landlord</li>
        </ol>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
        This is an automated message from PropAgentic. If you have questions, please contact your property manager: 
        <strong>${landlordName}</strong>
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

${landlordName} has invited you to join ${propertyName} on PropAgentic.

Your Invitation Code: ${codeData.code}

Visit ${inviteUrl} to accept the invitation.

What's Next?
1. Click the link above or visit PropAgentic
2. Enter your invitation code: ${codeData.code}
3. Create your tenant account or sign in
4. Start submitting maintenance requests and communicating with your landlord

This code is valid for 7 days.

This is an automated message from PropAgentic. If you have questions, please contact your property manager: ${landlordName}

© ${new Date().getFullYear()} PropAgentic. All rights reserved.
    `;

    const emailData = {
      to: codeData.email,
      subject: `Property Invitation Code: ${propertyName}`,
      html: htmlContent,
      text: textContent,
      metadata: {
        type: 'invite_code',
        codeId,
        propertyId: codeData.propertyId,
        landlordId: codeData.landlordId,
        source: 'inviteCodeEmail',
        version: '1.0'
      }
    };

    const mailDocId = await sendEmailViaExtension(emailData);

    // Update invite code with email status
    await snap.ref.update({
      emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      emailStatus: 'sent',
      mailDocId: mailDocId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Invite code email sent successfully', {
      codeId,
      email: codeData.email,
      mailDocId
    });

  } catch (error: any) {
    logger.error('Error sending invite code email:', {
      error: error.message,
      codeId,
      email: codeData?.email
    });

    await snap.ref.update({
      emailError: error.message || 'Failed to send email',
      emailStatus: 'failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
});

/**
 * TRIGGER 2: Send email when invite is created in invites collection
 */
export const sendPropertyInviteEmail = onDocumentCreated('invites/{inviteId}', async (event) => {
  const snap = event.data;
  if (!snap) {
    logger.error('No data associated with invites event');
    return;
  }

  const inviteData = snap.data();
  const { inviteId } = event.params;

  logger.info('Property invite created, processing email...', {
    inviteId,
    tenantEmail: inviteData?.tenantEmail,
    propertyId: inviteData?.propertyId
  });

  if (!inviteData || !inviteData.tenantEmail) {
    logger.error('Invalid invite data or missing tenant email:', {
      inviteId,
      hasData: !!inviteData,
      tenantEmail: inviteData?.tenantEmail
    });
    return;
  }

  try {
    // Generate unique invite code
    const inviteCode = generateInviteCode();

    // Update invite with code and status
    await snap.ref.update({
      code: inviteCode,
      status: 'sending',
      emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Get property and landlord details
    const landlordName = inviteData.landlordName || 'Property Manager';
    const propertyName = inviteData.propertyName || 'Your Property';
    const tenantName = inviteData.tenantEmail.split('@')[0];
    const inviteUrl = `${getAppDomain()}/invite?code=${inviteCode}`;

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
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">You've Been Invited!</p>
    </div>
    
    <!-- Content -->
    <div style="padding: 40px 20px;">
      <h2 style="color: #1f2937; margin: 0 0 20px 0;">Hello ${tenantName}!</h2>
      
      <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0;">
        ${landlordName} has invited you to join <strong>${propertyName}</strong> on PropAgentic.
      </p>
      
      <!-- Invite Code Section -->
      <div style="background-color: #f3f4f6; padding: 25px; border-radius: 8px; margin: 30px 0; text-align: center;">
        <h3 style="color: #374151; margin: 0 0 15px 0; font-size: 18px;">Your Invitation Code</h3>
        <div style="background-color: #059669; color: white; padding: 15px 25px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px; font-family: monospace;">
          ${inviteCode}
        </div>
        <p style="color: #6b7280; margin: 15px 0 0 0; font-size: 14px;">Valid for 7 days</p>
      </div>
      
      <!-- CTA Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${inviteUrl}" 
           style="background-color: #059669; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
          Accept Invitation
        </a>
      </div>
      
      <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">What's Next?</h3>
        <ol style="color: #15803d; margin: 0; padding-left: 20px; line-height: 1.8;">
          <li>Click the button above or visit PropAgentic</li>
          <li>Enter your invitation code: <strong>${inviteCode}</strong></li>
          <li>Create your tenant account or sign in</li>
          <li>Start submitting maintenance requests and communicating with your landlord</li>
        </ol>
      </div>
      
      <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 20px 0 0 0;">
        This is an automated message from PropAgentic. If you have questions, please contact: 
        <strong>${landlordName}</strong>
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

${landlordName} has invited you to join ${propertyName} on PropAgentic.

Your Invitation Code: ${inviteCode}

Visit ${inviteUrl} to accept the invitation.

What's Next?
1. Click the link above or visit PropAgentic
2. Enter your invitation code: ${inviteCode}
3. Create your tenant account or sign in
4. Start submitting maintenance requests and communicating with your landlord

This code is valid for 7 days.

This is an automated message from PropAgentic. If you have questions, please contact: ${landlordName}

© ${new Date().getFullYear()} PropAgentic. All rights reserved.
    `;

    const emailData = {
      to: inviteData.tenantEmail,
      subject: `You're Invited to Join ${propertyName} on PropAgentic`,
      html: htmlContent,
      text: textContent,
      metadata: {
        type: 'property_invite',
        inviteId,
        propertyId: inviteData.propertyId,
        landlordId: inviteData.landlordId,
        source: 'propertyInviteEmail',
        version: '1.0'
      }
    };

    const mailDocId = await sendEmailViaExtension(emailData);

    // Update invite with successful status
    await snap.ref.update({
      status: 'sent',
      emailDeliveredAt: admin.firestore.FieldValue.serverTimestamp(),
      emailStatus: 'sent',
      mailDocId: mailDocId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    logger.info('Property invite email sent successfully', {
      inviteId,
      tenantEmail: inviteData.tenantEmail,
      mailDocId,
      inviteCode
    });

  } catch (error: any) {
    logger.error('Error sending property invite email:', {
      error: error.message,
      inviteId,
      tenantEmail: inviteData?.tenantEmail
    });

    await snap.ref.update({
      status: 'failed',
      emailError: error.message || 'Failed to send email',
      emailStatus: 'failed',
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  }
}); 