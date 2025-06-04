// Test script to verify waitlist functionality after Firestore rules fix
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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

/**
 * Test the exact same data structure that PreLaunchPage sends
 */
async function testWaitlistWithExactData() {
  try {
    console.log('🧪 Testing waitlist with exact PreLaunchPage data structure...');

    const testEmail = 'test-user-' + Date.now() + '@example.com';
    const testRole = 'landlord';

    console.log(`📧 Testing with email: ${testEmail}, role: ${testRole}`);

    // Test 1: Waitlist - exact same structure as PreLaunchPage
    console.log('📝 Testing waitlist with exact data structure...');
    const waitlistData = {
      email: testEmail,
      role: testRole,
      timestamp: new Date().toISOString(),
      source: 'pre_launch_page',
      userId: null, // This was causing the issue
      subscribed_to_newsletter: true,
      marketing_consent: true,
      ip_address: 'localhost',
      user_agent: navigator.userAgent.substring(0, 200),
      createdAt: serverTimestamp()
    };

    const waitlistRef = await addDoc(collection(db, 'waitlist'), waitlistData);
    console.log('✅ Waitlist entry created with ID:', waitlistRef.id);

    // Test 2: Email - exact same structure as PreLaunchPage
    console.log('📬 Testing email with exact data structure...');
    const emailData = {
      to: testEmail,
      message: {
        subject: '🏠 Test: You\'re on the PropAgentic Pre-Launch List!',
        text: `Test email for ${testRole} role.`,
        html: `<h1>Test Email</h1><p>This is a test email for ${testRole} role.</p>`
      },
      userRole: testRole,
      source: 'waitlist_signup',
      createdAt: serverTimestamp()
    };

    const emailRef = await addDoc(collection(db, 'mail'), emailData);
    console.log('✅ Email queued with ID:', emailRef.id);

    // Test 3: Newsletter - exact same structure as PreLaunchPage
    console.log('📰 Testing newsletter with exact data structure...');
    const newsletterData = {
      email: testEmail,
      role: testRole,
      source: 'pre_launch',
      subscribedAt: serverTimestamp(),
      status: 'active',
      preferences: {
        marketing: true,
        product_updates: true,
        newsletters: true
      }
    };

    const newsletterRef = await addDoc(collection(db, 'newsletter_subscribers'), newsletterData);
    console.log('✅ Newsletter subscription created with ID:', newsletterRef.id);

    console.log('🎉 ALL TESTS PASSED! Waitlist functionality is working correctly.');
    console.log('📧 Check Firebase Console and your email for results.');

    return {
      success: true,
      results: {
        waitlistId: waitlistRef.id,
        emailId: emailRef.id,
        newsletterId: newsletterRef.id
      }
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message,
      stack: error.stack
    });
    
    return {
      success: false,
      error: {
        code: error.code,
        message: error.message
      }
    };
  }
}

// Run the test
testWaitlistWithExactData()
  .then(result => {
    if (result.success) {
      console.log('🏆 Test completed successfully!');
      console.log('Results:', result.results);
    } else {
      console.log('💥 Test failed with error:', result.error);
    }
  })
  .catch(err => {
    console.error('🚨 Unexpected error:', err);
  }); 