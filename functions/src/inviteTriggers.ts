import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore"; // Import v2 trigger
import * as admin from "firebase-admin";

// Ensure admin is initialized (it should be from index.ts, but belt-and-suspenders)
if (!admin.apps.length) {
  admin.initializeApp();
}
const adminDb = admin.firestore();

/**
 * Triggered when a new document is created in the 'invites' collection using Functions v2.
 * Checks if the invite is for a tenant and creates a notification for them.
 */
// Use onDocumentCreated trigger from v2
export const createNotificationOnInvite = onDocumentCreated('invites/{inviteId}',
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined, { inviteId: string }>) => {
    const { inviteId } = event.params; // Access params from event
    console.log(`--- Function Start: createNotificationOnInvite (Invite ID: ${inviteId}) ---`);

    const snapshot = event.data; // Access snapshot from event.data
    if (!snapshot) {
        console.log(`Invite ${inviteId}: No data associated with the event (deletion event?). Skipping.`);
        return null;
    }

    const inviteData = snapshot.data(); // Get data from the snapshot

    // 1. Validate Invite Data
    if (!inviteData) {
      console.error(`Invite ${inviteId}: No data found in snapshot (this shouldn't happen for onCreate?).`);
      return null;
    }

    // Check if it's a pending invite
    if (inviteData.status !== 'pending') {
       console.log(`Invite ${inviteId}: Status is '${inviteData.status}', not 'pending'. Skipping notification.`);
       return null;
    }

    const tenantEmail = inviteData.tenantEmail;
    const landlordName = inviteData.landlordName || 'Your Landlord';
    const propertyName = inviteData.propertyName || 'a property';
    const propertyId = inviteData.propertyId;

    if (!tenantEmail) {
      console.error(`Invite ${inviteId}: Missing tenantEmail.`);
      // Optional: Update invite status to 'error_missing_email'?
      // await snapshot.ref.update({ status: 'error_missing_email', errorDetails: 'Tenant email missing.' });
      return null;
    }
    console.log(`Invite ${inviteId}: Processing for tenantEmail: ${tenantEmail}`);

    // 2. Find Tenant User ID by Email
    let tenantUid: string;
    try {
      const usersRef = adminDb.collection('users');
      const userQuery = usersRef.where('email', '==', tenantEmail).limit(1);
      const userSnapshot = await userQuery.get();

      if (userSnapshot.empty) {
        console.warn(`Invite ${inviteId}: No user found with email ${tenantEmail}. Notification not created.`);
        // Optional: Update invite status to 'error_user_not_found'?
        // await snapshot.ref.update({ status: 'error_user_not_found', errorDetails: 'Tenant email not registered.'});
        return null;
      }
      
      tenantUid = userSnapshot.docs[0].id;
      console.log(`Invite ${inviteId}: Found user UID ${tenantUid} for email ${tenantEmail}`);

    } catch (error) {
      console.error(`Invite ${inviteId}: Error querying users collection for email ${tenantEmail}:`, error);
      // Optional: Update invite status to 'error_finding_user'?
      return null; // Exit on error during user lookup
    }

    // 3. Construct Notification Payload
    const notificationData = {
      recipientUid: tenantUid,
      type: "property_invite",
      title: "Property Invitation",
      message: `${landlordName} invited you to join ${propertyName}.`,
      status: "unread",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      relatedData: {
        inviteId: inviteId, // Use the ID from context params
        propertyId: propertyId || null,
        propertyName: propertyName,
        landlordName: landlordName,
      }
    };
    console.log(`Invite ${inviteId}: Prepared notification data for user ${tenantUid}:`, notificationData);

    // 4. Write Notification Document
    try {
       const notificationRef = adminDb.collection('users').doc(tenantUid).collection('notifications');
       // Add the notification document
       await notificationRef.add(notificationData); 
       console.log(`Invite ${inviteId}: Notification created successfully for user ${tenantUid}.`);
       return null; // Successful execution
     } catch (error) {
       // Log error but don't prevent function completion, as invite itself was created
       console.error(`Invite ${inviteId}: CRITICAL ERROR - Failed to write notification for user ${tenantUid}:`, error);
       // Optional: Update invite status to 'error_notification_failed'?
       // await snapshot.ref.update({ status: 'error_notification_failed', errorDetails: 'Failed to create notification document.' });
       return null; // Exit on error during notification write
     }
    
    console.log(`--- Function End: createNotificationOnInvite (Invite ID: ${inviteId}) ---`);
  }
);

/**
 * Enhanced trigger to also send emails for property invites in the 'invites' collection
 */
export const sendPropertyInviteEmail = onDocumentCreated('invites/{inviteId}',
  async (event: FirestoreEvent<QueryDocumentSnapshot | undefined, { inviteId: string }>) => {
    const { inviteId } = event.params;
    console.log(`🔧 Processing property invite email for ${inviteId}`);

    const snapshot = event.data;
    if (!snapshot) {
      console.warn(`No data for property invite ${inviteId}`);
      return;
    }

    const inviteData = snapshot.data();
    if (!inviteData) {
      console.error(`No invite data found for ${inviteId}`);
      return;
    }

    // Only send emails for pending invites with email addresses
    if (inviteData.status !== 'pending' || !inviteData.tenantEmail) {
      console.info(`Skipping email for invite ${inviteId} - not pending or no email`);
      return;
    }

    try {
      const tenantEmail = inviteData.tenantEmail;
      const landlordName = inviteData.landlordName || 'Property Owner';
      const propertyName = inviteData.propertyName || 'Property';
      const appDomain = process.env.APP_DOMAIN || 'https://propagentic.com';
      const loginUrl = `${appDomain}/login`;

      // Create email content for property invites (different from invite codes)
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="color: #4F46E5; margin: 0; padding: 0;">PropAgentic</h1>
            <p style="color: #64748b; font-size: 16px; margin-top: 5px;">Property Management, Simplified</p>
          </div>
          
          <div style="background-color: white; padding: 20px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
            <h2 style="color: #333; font-size: 20px; margin-top: 0;">Property Invitation</h2>
            
            <p style="font-size: 16px; line-height: 1.5; color: #555;">
              Hello,
            </p>
            
            <p style="font-size: 16px; line-height: 1.5; color: #555;">
              ${landlordName} has invited you to join 
              <strong>${propertyName}</strong> on PropAgentic.
            </p>
            
            <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; border-radius: 4px;">
              <p style="margin: 0; font-weight: bold; color: #333;">🏠 Property Details:</p>
              <p style="margin: 5px 0; color: #4F46E5; font-weight: bold;">${propertyName}</p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${loginUrl}" 
                 style="background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">
                 Log In to Accept
              </a>
            </div>
            
            <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
              You can log into your tenant dashboard at any time at 
              <a href="${loginUrl}" style="color: #4F46E5; text-decoration: none;">${appDomain}/login</a>
            </p>
          </div>
          
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #64748b; font-size: 12px;">
            <p>This is an automated message from PropAgentic. Please do not reply to this email.</p>
            <p>If you have questions, please contact your property manager: ${landlordName}</p>
            <p>&copy; ${new Date().getFullYear()} PropAgentic. All rights reserved.</p>
          </div>
        </div>
      `;

      const textContent = `
PropAgentic Property Invitation

Hello,

${landlordName} has invited you to join ${propertyName} on PropAgentic.

Please log into your account at ${loginUrl} to accept this invitation.

This is an automated message from PropAgentic. If you have questions, please contact your property manager: ${landlordName}

© ${new Date().getFullYear()} PropAgentic. All rights reserved.
      `;

      // Create mail document for Firebase extension
      const emailData = {
        to: tenantEmail,
        subject: `Property Invitation: ${propertyName}`,
        html: htmlContent,
        text: textContent,
        metadata: {
          type: 'property_invite_email',
          inviteId: inviteId,
          propertyId: inviteData.propertyId,
          landlordId: inviteData.landlordId,
          source: 'inviteTriggers'
        }
      };

      // Add to mail collection
      const mailDoc = await adminDb.collection('mail').add(emailData);
      
      // Update invite with email sending status
      await snapshot.ref.update({
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        emailSentStatus: 'sent',
        mailDocId: mailDoc.id,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      console.log(`✅ Email queued successfully for property invite ${inviteId}`, {
        tenantEmail,
        mailDocId: mailDoc.id
      });

    } catch (error: any) {
      console.error(`❌ Failed to send email for property invite ${inviteId}:`, error);
      
      // Update invite with error status
      await snapshot.ref.update({
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        error: `SendGrid email sending failed: ${error.message}`,
        emailSentStatus: 'failed',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }).catch((updateError) => {
        console.error(`Failed to update error status for invite ${inviteId}:`, updateError);
      });
    }
  }
); 