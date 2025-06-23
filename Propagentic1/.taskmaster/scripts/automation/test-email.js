#!/usr/bin/env node

/**
 * SendGrid Email Test Script
 * Tests email sending with current configuration
 */

const sgMail = require('@sendgrid/mail');

// Get SendGrid API key from environment or Firebase config
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (!SENDGRID_API_KEY) {
  console.error('❌ SendGrid API key not found');
  process.exit(1);
}

sgMail.setApiKey(SENDGRID_API_KEY);

async function testEmail() {
  const msg = {
    to: 'bweinfeld15@gmail.com', // Change to your test email
    from: 'noreply@propagentic.com', // Must be verified in SendGrid
    subject: 'PropAgentic Email Test',
    text: 'This is a test email from PropAgentic to verify SendGrid integration.',
    html: '<strong>This is a test email from PropAgentic to verify SendGrid integration.</strong>',
  };

  try {
    console.log('🚀 Sending test email...');
    console.log(`From: ${msg.from}`);
    console.log(`To: ${msg.to}`);
    
    await sgMail.send(msg);
    console.log('✅ Test email sent successfully!');
    console.log('📧 Check your inbox for the test email.');
    return true;
  } catch (error) {
    console.error('❌ Error sending test email:');
    console.error(error.response ? error.response.body : error.message);
    
    if (error.response && error.response.body.errors) {
      error.response.body.errors.forEach(err => {
        console.error(`   - ${err.message}`);
      });
    }
    return false;
  }
}

if (require.main === module) {
  testEmail().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = testEmail;
