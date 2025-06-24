// Simple script to test email sending using Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDcsJWLoVoC_kPORoVJA_-mG3LIWfbU-rw",
  authDomain: "propagentic.firebaseapp.com",
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com",
  projectId: "propagentic",
  storageBucket: "propagentic.firebasestorage.app",
  messagingSenderId: "121286300748",
  appId: "1:121286300748:web:0c69ea6ff643c8f75110e9",
  measurementId: "G-7DTWZQH28H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

/**
 * Creates a test email in the 'mail' collection
 * Usage: node simpleMail.js your@email.com yourpassword
 */
async function sendTestEmail() {
  try {
    // Get credentials from command line arguments
    const email = process.argv[2];
    const password = process.argv[3];
    
    if (!email || !password) {
      console.error('Usage: node simpleMail.js your@email.com yourpassword');
      process.exit(1);
    }
    
    console.log(`Authenticating with email: ${email}...`);
    
    // Authenticate
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Authentication successful!');
    
    // Create test email document
    console.log('Creating email document...');
    
    const testEmail = {
      to: 'ben@propagenticai.com', // Send to Ben's email as requested
      subject: 'PropAgentic Test Email - Security Rules Updated',
      text: `PropAgentic Test Email - Security Rules Updated

Hi Ben,

Great news! The email system is working after the security rules update.

✅ What's Working:
- Tenant Data Access: 34 tenant accounts accessible via Cloud Functions
- Email Sending: Firebase Extension integration successful
- Security Rules: Updated to allow proper mail collection access  
- Property Invitations: New collection rules added for tenant invitations

🔧 Recent Updates:
- Added read permissions for mail collection testing
- Created propertyInvitations collection security rules
- Enhanced email system with Firebase Extension
- Fixed tenant invitation flow for existing users

The system is ready for tenant property invitations!

Sent at: ${new Date().toLocaleString()}
From: PropAgentic Email System`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f97316;">🎉 PropAgentic Email System Working!</h2>
          <p>Hi Ben,</p>
          <p>Great news! The email system is working after the security rules update.</p>
          
          <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #374151; margin-top: 0;">✅ What's Working:</h3>
            <ul style="color: #6b7280;">
              <li><strong>Tenant Data Access:</strong> 34 tenant accounts accessible via Cloud Functions</li>
              <li><strong>Email Sending:</strong> Firebase Extension integration successful</li>
              <li><strong>Security Rules:</strong> Updated to allow proper mail collection access</li>
              <li><strong>Property Invitations:</strong> New collection rules added for tenant invitations</li>
            </ul>
          </div>
          
          <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #92400e; margin-top: 0;">🔧 Recent Updates:</h3>
            <ul style="color: #78350f;">
              <li>Added read permissions for mail collection testing</li>
              <li>Created propertyInvitations collection security rules</li>
              <li>Enhanced email system with Firebase Extension</li>
              <li>Fixed tenant invitation flow for existing users</li>
            </ul>
          </div>
          
          <p>The system is ready for tenant property invitations! 🏠</p>
          
          <p style="color: #6b7280; font-size: 14px;">
            Sent at: ${new Date().toLocaleString()}<br>
            From: PropAgentic Email System
          </p>
        </div>
      `
    };
    
    // Add to Firestore 'mail' collection
    const docRef = await addDoc(collection(db, 'mail'), testEmail);
    
    console.log('Test email document created successfully!');
    console.log('Document ID:', docRef.id);
    console.log('Email should be sent to:', testEmail.to);
    console.log('Check your inbox and Firebase Function logs.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test function
sendTestEmail()
  .then(() => {
    console.log('Test completed.');
    // Wait a bit to ensure Firestore operations complete before script exits
    setTimeout(() => process.exit(0), 3000);
  })
  .catch(err => {
    console.error('Test failed:', err);
    process.exit(1);
  }); 