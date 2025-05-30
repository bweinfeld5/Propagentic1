import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

// Initialize nodemailer transporter.
// IMPORTANT: Replace with your actual email service configuration.
// It's recommended to store sensitive info in Firebase Functions config.
// Example using Gmail (less secure, for testing only, requires "less secure app access"):
// const mailTransport = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: functions.config().gmail?.email || 'YOUR_GMAIL_EMAIL',
//     pass: functions.config().gmail?.password || 'YOUR_GMAIL_PASSWORD',
//   },
// });

// Initialize admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

// Example using a generic SMTP provider (replace with your provider's details)
const mailTransport = nodemailer.createTransport({
  host: functions.config().smtp?.host || 'YOUR_SMTP_HOST',
  port: parseInt(functions.config().smtp?.port || '587', 10), // common ports: 587 (TLS), 465 (SSL)
  secure: (functions.config().smtp?.secure === 'true') || false, // true for 465, false for other ports
  auth: {
    user: functions.config().smtp?.user || 'YOUR_SMTP_USER',
    pass: functions.config().smtp?.pass || 'YOUR_SMTP_PASSWORD',
  },
});

const APP_NAME = 'PropAgentic';
const YOUR_APP_DOMAIN = functions.config().app?.domain || 'https://your-propagentic-app.com'; // Configure your app domain

export const sendInviteEmail = functions.firestore
  .document('invites/{inviteId}')
  .onCreate(async (snap, context) => {
    const inviteData = snap.data();
    const inviteId = snap.id;

    console.log(`Processing new invite: ${inviteId}`, { config: functions.config().smtp });

    if (!inviteData) {
      console.error('No data associated with the event');
      return;
    }

    const tenantEmail = inviteData.tenantEmail;
    const propertyName = inviteData.propertyName || 'their new property';
    const landlordName = inviteData.landlordName || 'The Property Manager';

    if (!tenantEmail) {
      console.error('Tenant email is missing from invite data:', inviteId);
      // Update the invite status to reflect the error
      await admin.firestore().collection('invites').doc(inviteId).update({ 
        emailSentStatus: 'failed', 
        emailError: 'Missing tenant email',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      return;
    }

    // Generate an invite code or link. Using inviteId as the code here.
    // You might want to generate a more complex, short-lived code in a real app.
    const inviteLink = `${YOUR_APP_DOMAIN}/accept-invite?code=${inviteId}`;

    const mailOptions = {
      from: `"${APP_NAME}" <${functions.config().email?.from || 'noreply@your-propagentic-app.com'}>`, // Configure your "from" email
      to: tenantEmail,
      subject: `You're Invited to Join ${propertyName} on ${APP_NAME}!`,
      html: `
        <p>Hello,</p>
        <p>${landlordName} has invited you to join ${propertyName} on ${APP_NAME}.</p>
        <p>Please click the link below to accept your invitation and set up your account:</p>
        <p><a href="${inviteLink}">${inviteLink}</a></p>
        <p>If you were not expecting this invitation, you can safely ignore this email.</p>
        <p>Thanks,</p>
        <p>The ${APP_NAME} Team</p>
      `,
    };

    console.log(`Attempting to send email to ${tenantEmail}`, mailOptions);

    try {
      // Mark as processing
      await admin.firestore().collection('invites').doc(inviteId).update({ 
        emailSentStatus: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      // Send the email
      const info = await mailTransport.sendMail(mailOptions);
      console.log('Invitation email sent to:', tenantEmail, 'for invite ID:', inviteId, 'Response:', info.response);
      
      // Update the invite document with success status
      await admin.firestore().collection('invites').doc(inviteId).update({ 
        emailSentStatus: 'sent', 
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

    } catch (error) {
      console.error('There was an error sending the email for invite ID:', inviteId, error);
      
      // Update the invite document with failure status
      await admin.firestore().collection('invites').doc(inviteId).update({ 
        emailSentStatus: 'failed', 
        emailError: (error as Error).message,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
  }); 