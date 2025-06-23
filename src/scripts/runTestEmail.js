// Node.js script to test email sending using Firebase
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Firebase configuration - Must match your project's config
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
 */
async function sendTestEmail() {
  try {
    // First authenticate
    console.log('Authenticating with Firebase...');
    
    // Replace with your admin/test user credentials
    // This user should have permissions to write to the 'mail' collection
    const email = 'bweinfeld15@gmail.com'; // REPLACE WITH YOUR EMAIL
    const password = prompt('Enter your password: '); // Will prompt for password securely
    
    await signInWithEmailAndPassword(auth, email, password);
    console.log('Authentication successful!');
    
    console.log('Creating email document...');
    
    // Email testing data
    const testEmail = {
      to: 'bweinfeld15@gmail.com', // Your test recipient email
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

// Helper function to securely prompt for password
function prompt(message) {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(message, answer => {
      rl.close();
      resolve(answer);
    });
  });
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