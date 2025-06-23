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
      to: email, // Send to the same email used for authentication
      subject: 'Test Email from PropAgentic CLI',
      text: 'This is a plain text test email sent from the PropAgentic CLI tool.',
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #176B5D;">PropAgentic Email Test</h2>
          <p>This is a test email sent from the PropAgentic CLI tool.</p>
          <p>If you're seeing this, the email sending system is working properly!</p>
          <p>Timestamp: ${new Date().toLocaleString()}</p>
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