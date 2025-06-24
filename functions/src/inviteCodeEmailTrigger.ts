import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Ensure admin is initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

/**
 * Triggered when a new invite code is created in the 'inviteCodes' collection.
 * Sends an email invitation if the invite code has an associated email.
 */
export const sendInviteCodeEmail = onDocumentCreated('inviteCodes/{inviteId}',
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined, { inviteId: string }>) => {
    const { inviteId } = event.params;
    logger.info(`🔧 Processing invite code email for ${inviteId}`);

    const snapshot = event.data;
    if (!snapshot) {
      logger.warn(`No data for invite code ${inviteId}`);
      return;
    }

    const inviteData = snapshot.data();
    if (!inviteData) {
      logger.error(`No invite data found for ${inviteId}`);
      return;
    }

    // Only send emails if there's an email specified and status is active
    if (!inviteData.email || inviteData.status !== 'active') {
      logger.info(`Skipping email for invite ${inviteId} - no email specified or not active`);
      return;
    }

    try {
      // Get property details
      let propertyName = 'Property';
      
      if (inviteData.propertyId) {
        try {
          const propertyDoc = await admin.firestore()
            .collection('properties')
            .doc(inviteData.propertyId)
            .get();
          
          if (propertyDoc.exists) {
            const propertyData = propertyDoc.data();
            propertyName = propertyData?.name || propertyData?.nickname || propertyData?.title || 'Property';
          }
        } catch (error) {
          logger.warn(`Could not fetch property details for ${inviteData.propertyId}:`, error);
        }
      }

      // Get landlord details
      let landlordName = 'Property Owner';
      if (inviteData.landlordId) {
        try {
          const landlordDoc = await admin.firestore()
            .collection('users')
            .doc(inviteData.landlordId)
            .get();
          
          if (landlordDoc.exists) {
            const landlordData = landlordDoc.data();
            landlordName = landlordData?.displayName || landlordData?.firstName || landlordData?.name || 'Property Owner';
          }
        } catch (error) {
          logger.warn(`Could not fetch landlord details for ${inviteData.landlordId}:`, error);
        }
      }

      // Generate invite URL
      const appDomain = process.env.APP_DOMAIN || 'https://propagentic.com';
      const inviteUrl = `${appDomain}/invite-accept?code=${inviteData.code}`;

      // Create email content using the unified template structure
      const htmlContent = generateInviteEmailHtml({
        tenantEmail: inviteData.email,
        inviteCode: inviteData.code,
        landlordName,
        propertyName,
        unitInfo: inviteData.unitId ? `Unit ${inviteData.unitId}` : undefined,
        appDomain,
        inviteUrl
      });

      const textContent = generateInviteEmailText({
        tenantEmail: inviteData.email,
        inviteCode: inviteData.code,
        landlordName,
        propertyName,
        unitInfo: inviteData.unitId ? `Unit ${inviteData.unitId}` : undefined,
        appDomain,
        inviteUrl
      });

      // Create mail document for Firebase extension
      const emailData = {
        to: inviteData.email,
        subject: `You're Invited to Join ${propertyName} on PropAgentic`,
        html: htmlContent,
        text: textContent,
        metadata: {
          type: 'invite_code_email',
          inviteId: inviteId,
          inviteCode: inviteData.code,
          propertyId: inviteData.propertyId,
          landlordId: inviteData.landlordId,
          source: 'inviteCodeEmailTrigger'
        }
      };

      // Add to mail collection
      const mailDoc = await admin.firestore().collection('mail').add(emailData);
      
      // Update invite code with email sending status
      await snapshot.ref.update({
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        emailSentStatus: 'sent',
        mailDocId: mailDoc.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      logger.info(`✅ Email queued successfully for invite code ${inviteId}`, {
        inviteCode: inviteData.code,
        tenantEmail: inviteData.email,
        mailDocId: mailDoc.id
      });

    } catch (error: any) {
      logger.error(`❌ Failed to send email for invite code ${inviteId}:`, error);
      
      // Update invite code with error status
      await snapshot.ref.update({
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        error: `SendGrid email sending failed: ${error.message}`,
        status: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }).catch((updateError) => {
        logger.error(`Failed to update error status for invite ${inviteId}:`, updateError);
      });
    }
  }
);

/**
 * Generate HTML content for invitation email
 */
function generateInviteEmailHtml(params: {
  tenantEmail: string;
  inviteCode: string;
  landlordName: string;
  propertyName: string;
  unitInfo?: string;
  appDomain: string;
  inviteUrl: string;
}): string {
  const {
    tenantEmail,
    inviteCode,
    landlordName,
    propertyName,
    unitInfo,
    appDomain,
    inviteUrl
  } = params;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>You're Invited to Join ${propertyName} on PropAgentic</title>
  <meta name="description" content="${landlordName} has invited you to join ${propertyName}. Get started with easy rent payments and maintenance requests.">
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc;">
  <div style="font-family:Arial, Helvetica, sans-serif;max-width:600px;margin:0 auto;background-color:#ffffff;color:#1e293b">
    <div style="background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);padding:40px 30px;text-align:center;border-radius:12px 12px 0 0">
      <h1 style="color:#ffffff;margin:0 0 8px 0;font-size:32px;font-weight:700;letter-spacing:-0.5px">PropAgentic</h1>
      <p style="color:rgba(255, 255, 255, 0.9);margin:0;font-size:16px;font-weight:500">Property Management, Simplified</p>
    </div>
    
    <div style="padding:40px 30px">
      <h2 style="color:#1e293b;font-size:28px;margin:0 0 24px 0;font-weight:600;text-align:center">You've Been Invited! 🎉</h2>
      
      <p style="font-size:18px;line-height:1.6;color:#374151;margin:0 0 32px 0;text-align:center">
        <strong style="color:#4F46E5">${landlordName}</strong> has invited you to join 
        <strong style="color:#4F46E5">${propertyName}</strong>${unitInfo ? ` (${unitInfo})` : ''} 
        on PropAgentic, our AI-powered property management platform that makes renting easier for everyone.
      </p>
      
      <div style="background:linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%);border-left:4px solid #4F46E5;padding:24px;border-radius:12px;text-align:center;margin:32px 0;box-shadow:0 4px 12px rgba(79, 70, 229, 0.1)">
        <p style="margin:0 0 12px 0;font-weight:600;color:#1e293b;font-size:16px">Your Invitation Code</p>
        <p style="font-size:36px;letter-spacing:4px;color:#4F46E5;margin:16px 0;font-weight:bold;font-family:'Courier New', monospace">${inviteCode}</p>
        <p style="margin:12px 0 0 0;font-size:14px;color:#64748b;font-weight:500">⏰ This code is valid for 7 days</p>
      </div>
      
      <div style="text-align:center;margin:40px 0">
        <a href="${inviteUrl}" style="background:linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);color:#ffffff;padding:18px 36px;border-radius:12px;text-decoration:none;font-weight:600;font-size:18px;display:inline-block;box-shadow:0 8px 20px rgba(79, 70, 229, 0.3);transition:all 0.3s ease;letter-spacing:0.5px">🚀 Accept Invitation</a>
      </div>
      
      <div style="background-color:#f8fafc;padding:32px 24px;border-radius:12px;margin:32px 0;border:1px solid #e2e8f0">
        <h3 style="color:#1e293b;font-size:20px;margin:0 0 20px 0;font-weight:600;text-align:center">✨ What you'll get with PropAgentic:</h3>
        <div style="display:grid;gap:16px">
          <div style="display:flex;align-items:flex-start;gap:12px">
            <span style="font-size:18px;margin-top:2px">💳</span>
            <span style="color:#374151;font-size:15px;line-height:1.5;font-weight:500">Easy online rent payments with multiple payment options</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <span style="font-size:18px;margin-top:2px">🔧</span>
            <span style="color:#374151;font-size:15px;line-height:1.5;font-weight:500">Submit maintenance requests instantly with photo uploads</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <span style="font-size:18px;margin-top:2px">💬</span>
            <span style="color:#374151;font-size:15px;line-height:1.5;font-weight:500">Direct communication with your landlord and contractors</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <span style="font-size:18px;margin-top:2px">📄</span>
            <span style="color:#374151;font-size:15px;line-height:1.5;font-weight:500">Access important documents, leases, and notices 24/7</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <span style="font-size:18px;margin-top:2px">🤖</span>
            <span style="color:#374151;font-size:15px;line-height:1.5;font-weight:500">AI-powered assistance for faster issue resolution</span>
          </div>
          <div style="display:flex;align-items:flex-start;gap:12px">
            <span style="font-size:18px;margin-top:2px">📱</span>
            <span style="color:#374151;font-size:15px;line-height:1.5;font-weight:500">Mobile-friendly platform accessible anywhere</span>
          </div>
        </div>
      </div>
      
      <div style="border-top:2px solid #e5e7eb;padding-top:24px;margin:32px 0">
        <p style="font-size:14px;color:#6b7280;line-height:1.6;margin:0 0 16px 0;text-align:center">
          <strong style="color:#374151">Can't click the button?</strong><br/>
          You can also manually enter your invitation code after creating an account at 
          <a href="${appDomain}" style="color:#4F46E5;text-decoration:none;font-weight:600">${appDomain}</a>
        </p>
      </div>
      
      <div style="background-color:#fef3c7;border:1px solid #fbbf24;padding:20px;border-radius:8px;margin:24px 0">
        <p style="margin:0;font-size:14px;color:#92400e;line-height:1.6;text-align:center">
          <strong>Need help?</strong> Contact our support team at 
          <a href="mailto:support@propagentic.com" style="color:#92400e;text-decoration:none;font-weight:600">support@propagentic.com</a> 
          or visit our help center.
        </p>
      </div>
    </div>
    
    <div style="background-color:#f8fafc;padding:32px 30px;text-align:center;border-top:1px solid #e2e8f0;border-radius:0 0 12px 12px">
      <p style="margin:0 0 12px 0;font-size:12px;color:#64748b;line-height:1.5">This is an automated message from PropAgentic. Please do not reply to this email.</p>
      <p style="margin:0 0 12px 0;font-size:12px;color:#64748b">If you have questions, please contact your landlord: <strong>${landlordName}</strong></p>
      <div style="display:flex;justify-content:center;gap:20px;margin:16px 0 12px 0;flex-wrap:wrap">
        <a href="${appDomain}/privacy" style="color:#64748b;text-decoration:none;font-size:12px;font-weight:500">Privacy Policy</a>
        <a href="${appDomain}/unsubscribe?email=${encodeURIComponent(tenantEmail)}" style="color:#64748b;text-decoration:none;font-size:12px;font-weight:500">Unsubscribe</a>
        <a href="${appDomain}/help" style="color:#64748b;text-decoration:none;font-size:12px;font-weight:500">Help Center</a>
      </div>
      <p style="margin:0;font-size:12px;color:#9ca3af">© ${new Date().getFullYear()} PropAgentic. All rights reserved.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Generate plain text content for invitation email
 */
function generateInviteEmailText(params: {
  tenantEmail: string;
  inviteCode: string;
  landlordName: string;
  propertyName: string;
  unitInfo?: string;
  appDomain: string;
  inviteUrl: string;
}): string {
  const {
    tenantEmail,
    inviteCode,
    landlordName,
    propertyName,
    unitInfo,
    appDomain,
    inviteUrl
  } = params;

  const currentYear = new Date().getFullYear();

  return `
PROPAGENTIC - Property Management, Simplified

You've Been Invited!

${landlordName} has invited you to join ${propertyName}${unitInfo ? ` (${unitInfo})` : ''} on PropAgentic, our AI-powered property management platform that makes renting easier for everyone.

YOUR INVITATION CODE: ${inviteCode}
⏰ This code is valid for 7 days

ACCEPT INVITATION: ${inviteUrl}

What you'll get with PropAgentic:
• Easy online rent payments with multiple payment options
• Submit maintenance requests instantly with photo uploads  
• Direct communication with your landlord and contractors
• Access important documents, leases, and notices 24/7
• AI-powered assistance for faster issue resolution
• Mobile-friendly platform accessible anywhere

Can't click the link? You can also manually enter your invitation code after creating an account at ${appDomain}

Need help? Contact our support team at support@propagentic.com or visit our help center.

---
This is an automated message from PropAgentic. Please do not reply to this email.
If you have questions, please contact your landlord: ${landlordName}

Privacy Policy: ${appDomain}/privacy
Unsubscribe: ${appDomain}/unsubscribe?email=${encodeURIComponent(tenantEmail)}
Help Center: ${appDomain}/help

© ${currentYear} PropAgentic. All rights reserved.
  `.trim();
} 