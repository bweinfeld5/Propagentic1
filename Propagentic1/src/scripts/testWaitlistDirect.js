// Simple test script for the waitlist functionality (to be run in browser console)
// Copy and paste this into your browser console at http://localhost:3012

console.log('🧪 Testing anonymous waitlist signup...');

// Test data
const testEmail = 'test-user@example.com';
const testRole = 'landlord';

// Create test waitlist entry directly
const testWaitlistSignup = async () => {
  try {
    console.log(`📧 Testing waitlist signup for: ${testEmail} as ${testRole}`);

    // Import Firebase functions
    const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
    const { db } = await import('../firebase/config');

    // Create waitlist entry
    const waitlistData = {
      email: testEmail,
      role: testRole,
      timestamp: new Date().toISOString(),
      source: 'test_console',
      subscribed_to_newsletter: true,
      marketing_consent: true,
      test: true,
      createdAt: serverTimestamp()
    };

    console.log('📝 Adding to waitlist...');
    const waitlistRef = await addDoc(collection(db, 'waitlist'), waitlistData);
    console.log('✅ Waitlist signup successful! Document ID:', waitlistRef.id);

    // Create email entry
    const emailData = {
      to: testEmail,
      subject: '🏠 Test: You\'re on the PropAgentic Pre-Launch List!',
      text: `Test email for ${testRole} role.`,
      html: `<h1>Test Email</h1><p>This is a test email for ${testRole} role.</p>`,
      template: 'test_pre_launch',
      userRole: testRole,
      source: 'test_console',
      test: true,
      createdAt: serverTimestamp()
    };

    console.log('📬 Queueing test email...');
    const emailRef = await addDoc(collection(db, 'mail'), emailData);
    console.log('✅ Email queued successfully! Document ID:', emailRef.id);

    console.log('🎉 All tests passed! Waitlist functionality is working.');
    
    return {
      success: true,
      waitlistId: waitlistRef.id,
      emailId: emailRef.id
    };

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error('Error details:', {
      code: error.code,
      message: error.message
    });
    return {
      success: false,
      error: error.message
    };
  }
};

// Instructions
console.log('📋 To test the waitlist functionality:');
console.log('1. Visit http://localhost:3012 in your browser');
console.log('2. Open browser console (F12)');
console.log('3. Copy and paste this script');
console.log('4. Run: testWaitlistSignup()');
console.log('');
console.log('Or test the UI directly by filling out the form on the page!');

// Export for browser console use
window.testWaitlistSignup = testWaitlistSignup; 