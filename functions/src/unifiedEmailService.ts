import * as admin from 'firebase-admin';
import * as logger from 'firebase-functions/logger';

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Unified Email Service
 * 
 * This service uses the WORKING browser test logic for all email sending.
 * It directly writes to the 'mail' collection which triggers SendGrid successfully.
 */

/**
 * Get app domain helper
 */
const getAppDomain = (): string => {
  return process.env.APP_DOMAIN || 'https://propagentic.com';
};

/**
 * Generate invite code
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
 * UNIFIED EMAIL SENDER - Uses EXACT SAME FORMAT as working inviteService.ts
 * 
 * This function uses the EXACT same format as the working frontend inviteService:
 * - Message wrapper format: {to, message: {subject, html, text}}
 * - Same as unifiedEmailService.generateEmailData() on frontend
 * - Proven to work with SendGrid Firebase Extension
 */
export const sendEmailViaUnifiedService = async (emailData: {
  to: string;
  subject: string;
  html: string;
  text: string;
  metadata?: any;
}): Promise<string> => {
  try {
    // Use the EXACT same format as working frontend inviteService.ts
    const mailData = {
      to: emailData.to,
      message: {
        subject: emailData.subject,
        html: emailData.html,
        text: emailData.text,
        // Add preheader for better email client support (like frontend)
        headers: {
          'X-Preheader': `You've been invited to join PropAgentic`
        }
      },
      // Add metadata for tracking (not inside message wrapper)
      metadata: {
        sentAt: new Date().toISOString(),
        source: 'unifiedEmailService',
        version: '2.0',
        format: 'message_wrapper',
        ...emailData.metadata
      }
    };

    // Add to 'mail' collection - this triggers SendGrid immediately
    const mailDoc = await admin.firestore().collection('mail').add(mailData);
    
    logger.info('✅ Email queued successfully via unified service (message wrapper format)', {
      mailDocId: mailDoc.id,
      to: emailData.to,
      subject: emailData.subject,
      format: 'message_wrapper',
      source: 'unifiedEmailService'
    });
    
    return mailDoc.id;
    
  } catch (error: any) {
    logger.error('❌ Error sending email via unified service:', {
      error: error.message,
      to: emailData.to,
      subject: emailData.subject
    });
    throw error;
  }
};

/**
 * PROPERTY INVITATION EMAIL - Using unified service
 */
export const sendPropertyInvitationEmailUnified = async (inviteData: {
  tenantEmail: string;
  landlordName: string;
  propertyName: string;
  propertyAddress?: string;
  inviteCode?: string;
}): Promise<{ mailDocId: string; inviteCode: string }> => {
  
  const inviteCode = inviteData.inviteCode || generateInviteCode();
  const tenantName = inviteData.tenantEmail.split('@')[0];
  const inviteUrl = `${getAppDomain()}/invite?code=${inviteCode}`;
  
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Property Invitation: ${inviteData.propertyName}</title>
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
        <strong>${inviteData.landlordName}</strong> has invited you to join <strong>${inviteData.propertyName}</strong> on PropAgentic.
      </p>
      
      ${inviteData.propertyAddress ? `
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="color: #374151; margin: 0 0 10px 0; font-size: 16px;">🏠 Property Details</h3>
        <p style="color: #6b7280; margin: 0; font-size: 14px;">${inviteData.propertyAddress}</p>
      </div>
      ` : ''}
      
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
        <strong>${inviteData.landlordName}</strong>
      </p>
      
      <div style="background-color: #fff8dc; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #8b5a00; font-size: 14px;">
          <strong>📧 Email Method:</strong> Unified Service (Using proven working logic)
        </p>
      </div>
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

${inviteData.landlordName} has invited you to join ${inviteData.propertyName} on PropAgentic.

Your Invitation Code: ${inviteCode}

Visit ${inviteUrl} to accept the invitation.

What's Next?
1. Click the link above or visit PropAgentic
2. Enter your invitation code: ${inviteCode}
3. Create your tenant account or sign in
4. Start submitting maintenance requests and communicating with your landlord

This code is valid for 7 days.

This is an automated message from PropAgentic. If you have questions, please contact: ${inviteData.landlordName}

© ${new Date().getFullYear()} PropAgentic. All rights reserved.
  `;

  const emailData = {
    to: inviteData.tenantEmail,
    subject: `You're Invited to Join ${inviteData.propertyName} on PropAgentic`,
    html: htmlContent,
    text: textContent,
    metadata: {
      type: 'property_invitation',
      propertyName: inviteData.propertyName,
      landlordName: inviteData.landlordName,
      inviteCode: inviteCode,
      source: 'unifiedPropertyInvitation'
    }
  };

  const mailDocId = await sendEmailViaUnifiedService(emailData);
  
  logger.info('✅ Property invitation email sent via unified service', {
    tenantEmail: inviteData.tenantEmail,
    propertyName: inviteData.propertyName,
    inviteCode,
    mailDocId
  });

  return { mailDocId, inviteCode };
};

/**
 * TEST EMAIL - Using unified service
 */
export const sendTestEmailUnified = async (testEmail: string): Promise<string> => {
  const emailData = {
    to: testEmail,
    subject: '✅ Unified Email Service Test - PropAgentic',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h1 style="color: #059669;">✅ Unified Email Service Working!</h1>
        <p>This email was sent using the <strong>unified email service</strong> that uses the proven working logic:</p>
        <ul>
          <li><strong>Collection:</strong> mail</li>
          <li><strong>Format:</strong> Direct fields (same as browser tests)</li>
          <li><strong>Method:</strong> Unified service</li>
        </ul>
        <p>Timestamp: ${new Date().toISOString()}</p>
        <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #166534;"><strong>🎉 This proves the unified approach works!</strong></p>
        </div>
      </div>
    `,
    text: `Unified Email Service Test - This email was sent using the unified email service. Collection: mail, Format: Direct fields. Timestamp: ${new Date().toISOString()}`
  };

  return await sendEmailViaUnifiedService(emailData);
}; 