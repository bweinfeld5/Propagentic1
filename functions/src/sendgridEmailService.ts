import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import sgMail from '@sendgrid/mail';

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp();
}

// Initialize SendGrid
const sendGridConfig = functions.config().sendgrid;
const apiKey = sendGridConfig?.api_key;

if (!apiKey) {
  console.error('SendGrid API key not found in Firebase config');
} else {
  sgMail.setApiKey(apiKey);
  console.log('SendGrid initialized successfully');
}

// Core email sending function
export const sendEmail = async (to: string, subject: string, htmlContent: string, textContent?: string) => {
  try {
    if (!apiKey) {
      throw new Error('SendGrid API key not configured');
    }

    const msg = {
      to,
      from: 'ben@propagenticai.com', // Updated to use verified sender
      subject,
      text: textContent || '',
      html: htmlContent,
    };

    const result = await sgMail.send(msg);
    console.log('Email sent successfully', { to, subject, messageId: result[0].headers['x-message-id'] });
    return result;
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
};

// Function triggered when a new invite is created (using v1 syntax)
export const sendGridPropertyInvite = functions.firestore
  .onDocumentCreated('invites/{inviteId}', async (event) => {
    try {
      const snap = event.data;
      if (!snap) {
        console.log('No data associated with the event');
        return;
      }

      const inviteData = snap.data();
      const { inviteId } = event.params;

      if (!inviteData) {
        console.error('No invite data found');
        return;
      }

      console.log('Processing invite email', { inviteId, inviteData });

      // Get property and landlord details
      const propertyRef = admin.firestore().doc(`properties/${inviteData.propertyId}`);
      const landlordRef = admin.firestore().doc(`users/${inviteData.landlordId}`);
      
      const [propertyDoc, landlordDoc] = await Promise.all([
        propertyRef.get(),
        landlordRef.get()
      ]);

      const propertyData = propertyDoc.data();
      const landlordData = landlordDoc.data();

      if (!propertyData || !landlordData) {
        console.error('Property or landlord data not found', { 
          propertyFound: !!propertyData, 
          landlordFound: !!landlordData 
        });
        return;
      }

      // Create beautiful HTML email
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Property Invitation - PropAgentic</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header with PropAgentic Branding -->
            <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; text-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                PropAgentic
              </h1>
              <p style="color: #ffffff; margin: 8px 0 0 0; font-size: 16px; opacity: 0.9;">
                Property Management Made Simple
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0; font-size: 24px; font-weight: 600;">
                You're Invited to Join a Property!
              </h2>
              
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin: 0 0 25px 0;">
                <strong>${landlordData.firstName} ${landlordData.lastName}</strong> has invited you to join their property on PropAgentic.
              </p>
              
              <!-- Property Details Card -->
              <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 25px; margin: 25px 0;">
                <h3 style="color: #1f2937; margin: 0 0 15px 0; font-size: 18px; font-weight: 600;">
                  Property Details
                </h3>
                <div style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                  <p style="margin: 8px 0;"><strong>Address:</strong> ${propertyData.address}</p>
                  <p style="margin: 8px 0;"><strong>Landlord:</strong> ${landlordData.firstName} ${landlordData.lastName}</p>
                  <p style="margin: 8px 0;"><strong>Email:</strong> ${landlordData.email}</p>
                  ${inviteData.message ? `<p style="margin: 15px 0 8px 0;"><strong>Message:</strong></p><p style="margin: 0; font-style: italic;">"${inviteData.message}"</p>` : ''}
                </div>
              </div>
              
              <!-- Call to Action Button -->
              <div style="text-align: center; margin: 35px 0;">
                <a href="https://propagentic.com/invite/${inviteId}" 
                   style="display: inline-block; background: linear-gradient(135deg, #ff6b35 0%, #f7931e 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 12px rgba(255, 107, 53, 0.3); transition: all 0.3s ease;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; line-height: 1.6; margin: 25px 0 0 0; text-align: center;">
                This invitation will expire in 7 days. If you have any questions, please contact your landlord directly.
              </p>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 25px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 12px; margin: 0; line-height: 1.5;">
                This email was sent by PropAgentic on behalf of ${landlordData.firstName} ${landlordData.lastName}.<br>
                © 2024 PropAgentic. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const textContent = `
Property Invitation - PropAgentic

Hi there!

${landlordData.firstName} ${landlordData.lastName} has invited you to join their property on PropAgentic.

Property Details:
- Address: ${propertyData.address}
- Landlord: ${landlordData.firstName} ${landlordData.lastName}
- Email: ${landlordData.email}

${inviteData.message ? `Message: "${inviteData.message}"` : ''}

To accept this invitation, please visit: https://propagentic.com/invite/${inviteId}

This invitation will expire in 7 days.

Best regards,
The PropAgentic Team
      `;

      await sendEmail(
        inviteData.email,
        `Property Invitation from ${landlordData.firstName} ${landlordData.lastName}`,
        htmlContent,
        textContent
      );

      console.log('Invite email sent successfully', { inviteId, email: inviteData.email });

    } catch (error) {
      console.error('Error sending invite email:', error);
    }
  }); 