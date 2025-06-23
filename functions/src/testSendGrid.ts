import * as functions from 'firebase-functions';
import * as logger from 'firebase-functions/logger';
import { sendEmail } from './sendgridEmailService';

/**
 * Test function to verify SendGrid integration
 */
export const testSendGrid = functions.https.onCall(async (data: any) => {
  const testEmail = data.email;
  
  if (!testEmail) {
    throw new functions.https.HttpsError(
      'invalid-argument', 
      'Email address is required for testing.'
    );
  }

  logger.info(`Testing SendGrid with email: ${testEmail}`);

  try {
    // Test 1: Basic email sending
    const basicEmailResult = await sendEmail({
      to: testEmail,
      subject: 'PropAgentic SendGrid Test - Basic Email',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">SendGrid Test Successful! ✅</h1>
          <p>This is a test email from PropAgentic's SendGrid integration.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Test Type:</strong> Basic Email</p>
          <p>If you received this email, SendGrid is properly configured and working!</p>
        </div>
      `,
      text: `SendGrid Test Successful! This is a test email from PropAgentic's SendGrid integration. Timestamp: ${new Date().toISOString()}`
    });

    // Test 2: Property invite email (temporarily disabled - migrated to unified service)
    logger.info('Property invite email test skipped - migrated to unified service');
    const inviteEmailResult = true; // Placeholder

    const results = {
      success: true,
      basicEmail: basicEmailResult,
      inviteEmail: inviteEmailResult,
      timestamp: new Date().toISOString(),
      testEmail: testEmail,
      note: 'Property invite email test skipped - migrated to unified service'
    };

    logger.info('SendGrid test completed successfully', results);

    return {
      success: true,
      message: `Test emails sent successfully to ${testEmail}`,
      results: results
    };

  } catch (error: any) {
    logger.error('SendGrid test failed:', error);
    
    throw new functions.https.HttpsError(
      'internal',
      `SendGrid test failed: ${error.message}`,
      { error: error.message, timestamp: new Date().toISOString() }
    );
  }
});

/**
 * Simple ping function to test if functions are deployed
 */
export const testPing = functions.https.onCall(async () => {
  return { 
    message: "pong", 
    timestamp: new Date().toISOString(),
    sendGridConfigured: !!(process.env.SENDGRID_API_KEY || 
      (functions.config().sendgrid && functions.config().sendgrid.api_key))
  };
});