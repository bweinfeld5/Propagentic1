import * as sgMail from '@sendgrid/mail';
import * as functions from 'firebase-functions';
import * as logger from 'firebase-functions/logger';

// Initialize SendGrid with API key from environment
const SENDGRID_API_KEY = functions.config().sendgrid?.api_key || process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
  sgMail.setApiKey(SENDGRID_API_KEY);
} else {
  logger.warn('SendGrid API key not found. Email sending will fail.');
}

interface EmailData {
  to: string;
  from?: string;
  subject: string;
  html: string;
  text?: string;
}

/**
 * Send email using SendGrid
 * @param emailData - Email configuration object
 * @returns Promise<boolean> - Success status
 */
export const sendEmail = async (emailData: EmailData): Promise<boolean> => {
  if (!SENDGRID_API_KEY) {
    logger.error('SendGrid API key not configured');
    return false;
  }

  try {
    const msg = {
      to: emailData.to,
      from: emailData.from || 'noreply@propagentic.com', // Your verified sender
      subject: emailData.subject,
      text: emailData.text || '',
      html: emailData.html,
    };

    logger.info(`Sending email via SendGrid to: ${emailData.to}`);
    
    const [response] = await sgMail.send(msg);
    
    logger.info(`Email sent successfully via SendGrid`, {
      to: emailData.to,
      statusCode: response.statusCode,
      messageId: response.headers['x-message-id']
    });

    return true;
  } catch (error: any) {
    logger.error('Failed to send email via SendGrid', {
      error: error.message,
      code: error.code,
      response: error.response?.body
    });
    return false;
  }
};

/**
 * Send property invitation email using SendGrid
 * @param tenantEmail - Recipient email address
 * @param inviteCode - Unique invitation code
 * @param landlordName - Name of the landlord
 * @param propertyName - Name of the property
 * @param appDomain - Application domain for links
 * @returns Promise<boolean> - Success status
 */
export const sendPropertyInviteEmail = async (
  tenantEmail: string,
  inviteCode: string,
  landlordName: string,
  propertyName: string,
  appDomain: string = 'https://propagentic.com'
): Promise<boolean> => {
  const inviteLink = `${appDomain}/invite?code=${inviteCode}`;
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px; background-color: #f9f9f9;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #4F46E5; margin: 0; padding: 0;">PropAgentic</h1>
        <p style="color: #64748b; font-size: 16px; margin-top: 5px;">Property Management, Simplified</p>
      </div>
      
      <div style="background-color: white; padding: 20px; border-radius: 6px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);">
        <h2 style="color: #333; font-size: 20px; margin-top: 0;">You've Been Invited!</h2>
        
        <p style="font-size: 16px; line-height: 1.5; color: #555;">
          ${landlordName} has invited you to join 
          <strong>${propertyName}</strong> on PropAgentic.
        </p>
        
        <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 15px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 0; font-weight: bold; color: #333;">Your Invitation Code:</p>
          <p style="font-size: 24px; letter-spacing: 2px; color: #4F46E5; margin: 10px 0; font-weight: bold; font-family: monospace;">${inviteCode}</p>
          <p style="margin: 5px 0 0; font-size: 14px; color: #64748b;">This code is valid for 7 days</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteLink}" 
             style="background-color: #4F46E5; color: white; padding: 12px 24px; border-radius: 4px; text-decoration: none; font-weight: bold; display: inline-block;">
             Accept Invitation
          </a>
        </div>
        
        <p style="font-size: 14px; color: #64748b; line-height: 1.5;">
          If the button doesn't work, you can also manually enter your invitation code after signing up at 
          <a href="${appDomain}" style="color: #4F46E5; text-decoration: none;">${appDomain}</a>
        </p>
        
        <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <h3 style="color: #333; font-size: 16px; margin-bottom: 10px;">What's Next?</h3>
          <ul style="color: #555; font-size: 14px; line-height: 1.6; margin: 0; padding-left: 20px;">
            <li>Click the button above or visit PropAgentic and enter your invite code</li>
            <li>Create your tenant account (or sign in if you already have one)</li>
            <li>Complete your profile to get started</li>
            <li>Submit maintenance requests, view property info, and communicate with your landlord</li>
          </ul>
        </div>
      </div>
      
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #64748b; font-size: 12px;">
        <p>This is an automated message from PropAgentic. Please do not reply to this email.</p>
        <p>If you have questions, please contact your landlord: ${landlordName}</p>
        <p>&copy; ${new Date().getFullYear()} PropAgentic. All rights reserved.</p>
      </div>
    </div>
  `;

  const textContent = `
You've been invited to join ${propertyName} on PropAgentic by ${landlordName}. 

Your invitation code is: ${inviteCode}

Visit ${inviteLink} to accept the invitation.

What's Next?
1. Click the link above or visit PropAgentic and enter your invite code
2. Create your tenant account (or sign in if you already have one)  
3. Complete your profile to get started
4. Submit maintenance requests, view property info, and communicate with your landlord

This code is valid for 7 days.

This is an automated message from PropAgentic. If you have questions, please contact your landlord: ${landlordName}

© ${new Date().getFullYear()} PropAgentic. All rights reserved.
  `;

  return await sendEmail({
    to: tenantEmail,
    subject: `You're Invited to Join ${propertyName} on PropAgentic`,
    html: htmlContent,
    text: textContent
  });
};
