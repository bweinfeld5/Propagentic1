const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const { getAuth, signInAnonymously } = require('firebase/auth');

// Firebase configuration - using your existing config
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
 * Test the waitlist signup and email functionality
 */
async function testWaitlistEmail() {
  try {
    console.log('🧪 Testing waitlist email functionality...');

    // Use a test email - replace with your email for testing
    const testEmail = 'bweinfeld15@gmail.com';
    const testRole = 'landlord';

    console.log(`📧 Testing with email: ${testEmail}, role: ${testRole}`);

    // Sign in anonymously to get auth context
    console.log('🔐 Signing in anonymously...');
    await signInAnonymously(auth);
    console.log('✅ Anonymous sign-in successful');

    // Test 1: Add to waitlist
    console.log('📝 Adding to waitlist...');
    const waitlistData = {
      email: testEmail,
      role: testRole,
      timestamp: new Date().toISOString(),
      source: 'test_script',
      subscribed_to_newsletter: true,
      marketing_consent: true,
      test: true // Mark as test data
    };

    const waitlistRef = await addDoc(collection(db, 'waitlist'), waitlistData);
    console.log('✅ Waitlist entry created with ID:', waitlistRef.id);

    // Test 2: Queue email
    console.log('📬 Queueing pre-launch email...');
    const emailContent = {
      to: testEmail,
      subject: '🏠 Test: You\'re on the PropAgentic Pre-Launch List!',
      text: `Test email for ${testRole} role. This confirms the email system is working.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f97316;">🧪 PropAgentic Email Test</h2>
          <p>This is a test email to verify the waitlist email functionality is working.</p>
          <p><strong>Role:</strong> ${testRole}</p>
          <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
          <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #92400e;">
              ✅ If you're seeing this email, the system is working correctly!
            </p>
          </div>
          <p style="font-size: 12px; color: #666;">
            This is a test email from the PropAgentic development environment.
          </p>
        </div>
      `,
      template: 'test_pre_launch',
      userRole: testRole,
      source: 'test_script',
      test: true
    };

    const emailRef = await addDoc(collection(db, 'mail'), emailContent);
    console.log('✅ Email queued with ID:', emailRef.id);

    console.log('🎉 Test completed successfully!');
    console.log('📧 Check your email inbox and Firebase Console for results.');
    console.log('🔍 Monitor Firebase Functions logs for email processing status.');
    console.log('🌐 You can also visit Firebase Console at:');
    console.log('   - Firestore: https://console.firebase.google.com/project/propagentic/firestore');
    console.log('   - Functions: https://console.firebase.google.com/project/propagentic/functions');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

// Run the test
console.log('🚀 Starting waitlist email test...');
testWaitlistEmail()
  .then(() => {
    console.log('✅ Test script completed');
    setTimeout(() => process.exit(0), 2000); // Give time for async operations
  })
  .catch(error => {
    console.error('💥 Test script failed:', error);
    process.exit(1);
  }); 