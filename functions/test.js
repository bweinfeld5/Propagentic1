// Test file for email sending using the SMTP configuration
const nodemailer = require('nodemailer');

// Create SMTP transport using the config from firebase functions:config:get
const mailTransport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true, // for port 465
  auth: {
    user: 'ben@propagenticai.com',
    pass: 'xtpkloozzdcetzen', // This is an app password, not a regular password
  },
});

// Send a test email
async function sendTestEmail() {
  try {
    console.log('Attempting to send test email directly via SMTP...');
    
    // Create mail options
    const mailOptions = {
      from: '"PropAgentic System" <ben@propagenticai.com>',
      to: 'bweinfeld15@gmail.com', // YOUR TEST EMAIL
      subject: 'SMTP Test Email - Direct from Functions',
      text: 'This is a test email sent directly via SMTP from Firebase Functions.',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #176B5D;">PropAgentic Email Test (Direct SMTP)</h2>
          <p>This is a test email sent directly using nodemailer with SMTP.</p>
          <p>If you're seeing this, the SMTP configuration is working correctly!</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      `,
    };
    
    // Send email
    const info = await mailTransport.sendMail(mailOptions);
    
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    return info;
    
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Execute the test
sendTestEmail()
  .then(result => {
    console.log('Test completed successfully!');
    process.exit(0);
  })
  .catch(error => {
    console.error('Test failed:', error);
    process.exit(1);
  }); 