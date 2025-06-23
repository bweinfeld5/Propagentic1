// Test file for adding a document to the mail collection for the firestore-send-email extension
const admin = require('firebase-admin');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(__dirname, '../propagentic-firebase-adminsdk-fbsvc-c20b027723.json');
const serviceAccount = require(serviceAccountPath);

// Initialize the app with admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

/**
 * Adds a test email document to the mail collection with correct format for the extension
 */
async function sendTestEmailViaExtension() {
  try {
    console.log('Creating a test email document for the firestore-send-email extension...');
    
    // Create properly formatted email document for the extension
    // Based on the extension's expected format
    const mailDoc = {
      to: 'bweinfeld15@gmail.com',
      // Do not use 'message' field as object, use direct fields
      subject: 'Test Email via Extension - Formatted Correctly',
      text: 'This is a plain text test email via the extension.',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #176B5D;">PropAgentic Email Test (Extension)</h2>
          <p>This is a test email sent via the Firestore Send Email extension.</p>
          <p>If you're seeing this, the extension is working correctly!</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
        </div>
      `
    };
    
    // Add to Firestore 'mail' collection
    const mailRef = db.collection('mail');
    const docRef = await mailRef.add(mailDoc);
    
    console.log('Test email document created with ID:', docRef.id);
    console.log('Email should be sent to:', mailDoc.to);
    console.log('Check your inbox and Firebase Function logs.');
    
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Execute the test
sendTestEmailViaExtension()
  .then(() => {
    console.log('Test completed. Check Firebase Functions logs for email processing.');
    // Need to explicitly exit because admin SDK keeps connections open
    setTimeout(() => process.exit(0), 3000);
  })
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  }); 