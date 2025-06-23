// Admin script to test email sending using Firebase Admin SDK
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(__dirname, '../../propagentic-firebase-adminsdk-fbsvc-c20b027723.json');
const serviceAccount = require(serviceAccountPath);

// Initialize the app with admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

/**
 * Creates a test email directly in the 'mail' collection using admin privileges
 */
async function sendAdminTestEmail() {
  try {
    console.log('Using Firebase Admin SDK to send test email...');
    
    // Get the recipient email from command line or use a default
    const recipient = process.argv[2] || 'bweinfeld15@gmail.com';
    console.log(`Will send test email to: ${recipient}`);
    
    // Create test email document with admin privileges (bypassing security rules)
    const testEmail = {
      to: recipient,
      subject: 'Test Email from PropAgentic Admin CLI',
      text: 'This is a plain text test email sent via the Firebase Admin SDK.',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #176B5D;">PropAgentic Email Test (Admin SDK)</h2>
          <p>This is a test email sent directly from the Admin SDK, bypassing all security rules.</p>
          <p>If you're seeing this, the email sending system is working properly!</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    // Add to Firestore 'mail' collection with admin privileges
    const mailRef = db.collection('mail');
    const docRef = await mailRef.add(testEmail);
    
    console.log('Test email document created successfully with admin credentials!');
    console.log('Document ID:', docRef.id);
    console.log('Email should be sent to:', testEmail.to);
    console.log('Check your inbox and Firebase Function logs.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test function
sendAdminTestEmail()
  .then(() => {
    console.log('Test completed.');
    // Need to explicitly exit because admin SDK keeps connections open
    process.exit(0);
  })
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  }); 