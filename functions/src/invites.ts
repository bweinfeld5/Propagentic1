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

// Retrieve SMTP config from Firebase Functions Config
const getMailTransport = () => {
  // Remove unused variable
  let configSource = 'firebase';

  try {
    // Check if we have SMTP config in Firebase
    const host = functions.config().smtp?.host;
    const port = functions.config().smtp?.port;
    const user = functions.config().smtp?.user;
    const pass = functions.config().smtp?.pass;
    const secure = functions.config().smtp?.secure === 'true';

    // Log the config (without password) for debugging
    console.log(`Email config from ${configSource}:`, { 
      host, 
      port, 
      user: user ? '✓ Present' : '✗ Missing',
      secure 
    });

    if (!host || !port || !user || !pass) {
      throw new Error('Incomplete SMTP configuration');
    }

    return nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure,
      auth: {
        user,
        pass
      }
    });
  } catch (error) {
    console.warn('SMTP config error:', error);
    console.warn('Using backup SMTP configuration. !!! FOR DEVELOPMENT ONLY !!!');

    // Fallback to environment variables if config fails (for development only)
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.mailtrap.io', // Use MailTrap for development
      port: parseInt(process.env.SMTP_PORT || '2525', 10),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || 'YOUR_SMTP_USER',
        pass: process.env.SMTP_PASS || 'YOUR_SMTP_PASSWORD'
      }
    });
  }
};

const APP_NAME = 'PropAgentic';
const APP_DOMAIN = functions.config().app?.domain || 'https://your-propagentic-app.com';

// Fix the document function usage and add type annotations for parameters
export const sendInviteEmail = functions.firestore
  .onDocumentCreated('invites/{inviteId}', async (event) => {
    const snap = event.data;
    
    if (!snap) {
      console.log('No data associated with the event');
      return;
    }

    const inviteData = snap.data();
    const inviteId = snap.id;

    console.log(`Processing new invite: ${inviteId}`);

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

    try {
      // Mark as processing
      await admin.firestore().collection('invites').doc(inviteId).update({ 
        emailSentStatus: 'processing',
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Generate a unique 8-character invite code and store it
      const db = admin.firestore();
      
      // Generate a random 8-character code (same format as invite codes)
      const generateRandomCode = (length = 8): string => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Removing confusable chars
        let result = '';
        for (let i = 0; i < length; i++) {
          result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
      };
      
      // Create an invite code that will work with the existing system
      let code = generateRandomCode();
      let isUnique = false;
      
      // Ensure the code is unique
      while (!isUnique) {
        // Check if the code already exists
        const codeQuery = await db.collection('inviteCodes')
          .where('code', '==', code)
          .limit(1)
          .get();
        
        isUnique = codeQuery.empty;
        if (!isUnique) {
          code = generateRandomCode();
        }
      }
      
      console.log(`Generated unique invite code: ${code} for email: ${tenantEmail}`);
      
      // Store the invite code in Firestore with the same format as manual codes
      const now = admin.firestore.Timestamp.now();
      const expiresAt = new admin.firestore.Timestamp(
        now.seconds + (7 * 24 * 60 * 60), // Default to 7 days
        now.nanoseconds
      );
      
      // Create an invite code linked to this email invitation
      const inviteCodeData = {
        code: code,
        landlordId: inviteData.landlordId,
        propertyId: inviteData.propertyId,
        email: tenantEmail,  // Restrict to this email
        status: 'active',
        createdAt: now,
        expiresAt,
        propertyName: propertyName,
        inviteId: inviteId,  // Link back to the invite document
        source: 'email_invite'
      };
      
      // Add the code to the inviteCodes collection
      const inviteCodeRef = await db.collection('inviteCodes').add(inviteCodeData);
      console.log(`Created invite code document: ${inviteCodeRef.id}`);
      
      // Update the invite with the code reference
      await db.collection('invites').doc(inviteId).update({
        inviteCodeId: inviteCodeRef.id,
        inviteCode: code
      });

      // Generate an invite link with the code
      const inviteLink = `${APP_DOMAIN}/accept-invite?code=${code}`;

      // Initialize mail transport
      const mailTransport = getMailTransport();
      
      const mailOptions = {
        from: `"${APP_NAME}" <${functions.config().email?.from || 'noreply@propagentic.com'}>`,
        to: tenantEmail,
        subject: `You're Invited to Join ${propertyName} on ${APP_NAME}!`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h1 style="color: #FF6600;">PropAgentic</h1>
              <p style="font-size: 18px; color: #333;">Property Management Made Simple</p>
            </div>
            
            <div style="padding: 20px; background-color: #f9f9f9; border-radius: 5px; margin-bottom: 20px;">
              <h2 style="color: #333; margin-top: 0;">You've Been Invited!</h2>
              <p style="font-size: 16px; line-height: 1.5; color: #555;">
                ${landlordName} has invited you to join ${propertyName} on PropAgentic.
              </p>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <p style="font-weight: bold; font-size: 18px; margin-bottom: 10px;">Your Invitation Code:</p>
              <div style="background-color: #f0f0f0; padding: 12px; border-radius: 4px; letter-spacing: 2px; font-family: monospace; font-size: 24px; font-weight: bold; color: #333;">
                ${code}
              </div>
              <p style="font-size: 14px; color: #777; margin-top: 10px;">
                This code will expire in 7 days
              </p>
            </div>
            
            <div style="margin: 25px 0; text-align: center;">
              <a href="${inviteLink}" style="display: inline-block; background-color: #FF6600; color: white; text-decoration: none; padding: 12px 30px; border-radius: 5px; font-weight: bold; font-size: 16px;">
                Accept Invitation
              </a>
            </div>
            
            <p style="font-size: 14px; line-height: 1.5; color: #777;">
              If the button above doesn't work, you can also enter your code manually after logging in to PropAgentic.
            </p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #999; font-size: 12px;">
              <p>If you were not expecting this invitation, you can safely ignore this email.</p>
              <p>&copy; ${new Date().getFullYear()} PropAgentic. All rights reserved.</p>
            </div>
          </div>
        `,
      };

      console.log(`Attempting to send email to ${tenantEmail}`, {
        subject: mailOptions.subject,
        inviteLink
      });
      
      // Send the email
      const info = await mailTransport.sendMail(mailOptions);
      console.log('Invitation email sent to:', tenantEmail, 'for invite ID:', inviteId, 'Response:', info.response);
      
      // Update the invite document with success status
      await admin.firestore().collection('invites').doc(inviteId).update({ 
        emailSentStatus: 'sent', 
        emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        inviteCode: code  // Add the invite code for reference
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