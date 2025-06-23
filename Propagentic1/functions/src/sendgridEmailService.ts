// NOTE: Invitation email logic migrated to src/services/unifiedEmailService.ts
import sgMail from '@sendgrid/mail';
import * as functions from 'firebase-functions';
import * as logger from 'firebase-functions/logger';

// Lazy initialization - only initialize when needed
let sendGridInitialized = false;
let SENDGRID_API_KEY: string | undefined;

const initializeSendGrid = () => {
  if (sendGridInitialized) return;
  
  try {
    // Initialize SendGrid with API key from environment variables (Cloud Functions v2)
    // Fallback to functions.config() for backward compatibility during transition
    SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || 
      (functions.config().sendgrid && functions.config().sendgrid.api_key);

    if (SENDGRID_API_KEY) {
      sgMail.setApiKey(SENDGRID_API_KEY);
      logger.info('SendGrid initialized successfully');
    } else {
      logger.warn('SendGrid API key not found in environment variables or config. Email sending will fail.');
    }
  } catch (error: any) {
    logger.error('Failed to initialize SendGrid:', error.message);
  }
  
  sendGridInitialized = true;
};

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
  // Initialize SendGrid on first use
  initializeSendGrid();
  
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
// REMOVED: sendPropertyInviteEmail function migrated to unified service
