/**
 * Direct Email Test Script
 * 
 * This script directly adds an email to the mail collection to test
 * the Firebase Extension email sending functionality.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Send a test email directly via Firebase Extension
 */
async function sendDirectTestEmail() {
  try {
    console.log('🚀 Sending direct test email via Firebase Extension...');
    
    const emailData = {
      to: '410haulers@gmail.com',
      message: {
        subject: 'PropAgentic Test Email - Direct Send',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #4F46E5;">PropAgentic Test Email</h1>
            <p>This is a direct test of the Firebase Extension email functionality.</p>
            <p>If you receive this email, the SendGrid integration is working correctly!</p>
            <p>Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
        text: `PropAgentic Test Email - This is a direct test of the Firebase Extension email functionality. If you receive this email, the SendGrid integration is working correctly! Timestamp: ${new Date().toISOString()}`
      }
    };
    
    // Add email to the mail collection
    const mailRef = await db.collection('mail').add(emailData);
    
    console.log('✅ Test email queued successfully!');
    console.log('📧 Mail document ID:', mailRef.id);
    console.log('📬 Email sent to:', emailData.to);
    console.log('📱 Check Firebase Console logs for processing status');
    console.log('📧 Check 410haulers@gmail.com for the test email');
    
    return mailRef.id;
    
  } catch (error) {
    console.error('❌ Error sending direct test email:', error);
    throw error;
  }
}

/**
 * Check the status of a mail document
 */
async function checkMailStatus(mailId) {
  try {
    const mailDoc = await db.collection('mail').doc(mailId).get();
    
    if (!mailDoc.exists) {
      console.log('❌ Mail document not found');
      return null;
    }
    
    const data = mailDoc.data();
    console.log('\n📊 Mail Status:');
    console.log('   ID:', mailId);
    console.log('   To:', data.to);
    console.log('   Subject:', data.message?.subject);
    console.log('   Delivery Info:', data.delivery || 'Not processed yet');
    
    return data;
  } catch (error) {
    console.error('❌ Error checking mail status:', error);
    throw error;
  }
}

/**
 * Monitor mail status for 30 seconds
 */
async function monitorMail(mailId) {
  console.log('\n👀 Monitoring mail status...');
  
  let attempts = 0;
  const maxAttempts = 6; // 30 seconds total (5 second intervals)
  
  const checkStatus = async () => {
    attempts++;
    console.log(`\n📊 Status Check #${attempts}:`);
    
    const status = await checkMailStatus(mailId);
    
    if (status && status.delivery) {
      if (status.delivery.info) {
        console.log('🎉 EMAIL SENT SUCCESSFULLY!');
        console.log('📧 Check 410haulers@gmail.com for the test email.');
        return true;
      } else if (status.delivery.error) {
        console.log('❌ EMAIL FAILED TO SEND!');
        console.log('Error:', status.delivery.error);
        return false;
      }
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Monitoring timeout reached.');
      console.log('📱 Check Firebase Console logs for more details.');
      return false;
    }
    
    console.log('⏳ Still processing... checking again in 5 seconds');
    setTimeout(checkStatus, 5000);
  };
  
  setTimeout(checkStatus, 2000); // Start checking after 2 seconds
}

// Main execution
async function main() {
  try {
    const mailId = await sendDirectTestEmail();
    await monitorMail(mailId);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { sendDirectTestEmail, checkMailStatus }; 