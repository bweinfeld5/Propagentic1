import { onCall, HttpsError } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { sendEmail, sendPropertyInviteEmail } from "./sendgridEmailService";

/**
 * Test function to verify SendGrid integration
 * Call with: curl -X POST https://your-region-your-project.cloudfunctions.net/testSendGrid -H "Content-Type: application/json" -d '{"email":"test@example.com"}'
 */
export const testSendGrid = onCall(async (request) => {
  // Check authentication
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated', 
      'You must be authenticated to test email sending.'
    );
  }

  const testEmail = request.data.email || request.auth.token.email;
  
  if (!testEmail) {
    throw new HttpsError(
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

    // Test 2: Property invite email
    const inviteEmailResult = await sendPropertyInviteEmail(
      testEmail,
      'TEST123', // Test invite code
      'Test Landlord',
      'Test Property - 123 Main St',
      'https://propagentic.com'
    );

    const results = {
      success: true,
      basicEmail: basicEmailResult,
      inviteEmail: inviteEmailResult,
      timestamp: new Date().toISOString(),
      testEmail: testEmail
    };

    logger.info('SendGrid test completed successfully', results);

    return {
      success: true,
      message: `Test emails sent successfully to ${testEmail}`,
      results: results
    };

  } catch (error: any) {
    logger.error('SendGrid test failed:', error);
    
    throw new HttpsError(
      'internal',
      `SendGrid test failed: ${error.message}`,
      { error: error.message, timestamp: new Date().toISOString() }
    );
  }
});

/**
 * Simple ping function to test if functions are deployed
 */
export const testPing = onCall(async () => {
  return { 
    message: "pong", 
    timestamp: new Date().toISOString(),
    sendGridConfigured: !!process.env.SENDGRID_API_KEY
  };
});