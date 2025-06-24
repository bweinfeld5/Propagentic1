const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBSKukQSHDU8WVvqiINbqC34cKL6mYNrAE",
  authDomain: "propagentic.firebaseapp.com",
  projectId: "propagentic",
  storageBucket: "propagentic.firebasestorage.app",
  messagingSenderId: "121286300748",
  appId: "1:121286300748:web:b8de3e1b5bbf2e1fb7be33",
  measurementId: "G-FXPBMB5XH7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testSupporterEmail() {
  console.log('\n🔥 Firebase initialized successfully');
  console.log('🧪 Testing supporter role email functionality...');

  try {
    // Test supporter email template
    const emailContent = getSupporterEmailTemplate('Test User');
    const emailData = {
      to: 'weinba23@wfu.edu',
      message: {
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.html
      },
      // Additional metadata
      userName: 'Test User',
      userRole: 'supporter',
      source: 'supporter_test',
      createdAt: serverTimestamp()
    };

    console.log('📧 Queueing supporter email...');
    const emailRef = await addDoc(collection(db, 'mail'), emailData);
    console.log('✅ SUCCESS: Supporter email queued! Document ID:', emailRef.id);

    return true;
  } catch (error) {
    console.error('❌ ERROR: Supporter email test failed:', error.message);
    return false;
  }
}

// Supporter email template function
function getSupporterEmailTemplate(userName) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>🌟 Thank you for supporting PropAgentic!</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f1eb;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white;">
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to the Future!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">Your support means everything to us</p>
        </div>
        
        <!-- Main Content -->
        <div style="padding: 40px 30px;">
          <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${userName}! 👋</h2>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
            Thank you for joining the PropAgentic pre-launch waitlist! As a supporter, you're among the first to experience the next generation of property management technology.
          </p>
          
          <div style="background: #fef3c7; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #f59e0b;">
            <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">What's coming your way:</h3>
            <ul style="color: #92400e; margin: 0; padding-left: 20px;">
              <li style="margin-bottom: 8px;">Exclusive updates on our development progress</li>
              <li style="margin-bottom: 8px;">Early access to beta features and testing</li>
              <li style="margin-bottom: 8px;">Direct input on product features and roadmap</li>
              <li style="margin-bottom: 8px;">Special recognition in our community</li>
            </ul>
          </div>
          
          <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
            We'll keep you updated on our journey and invite you to be part of our story.
          </p>
          
          <div style="text-align: center; margin: 35px 0;">
            <div style="background: #f97316; color: white; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: bold;">
              🌟 VIP Supporter Status
            </div>
          </div>
        </div>
        
        <!-- Footer -->
        <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">
            © ${new Date().getFullYear()} PropAgentic. All rights reserved.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    Welcome to PropAgentic Pre-Launch!
    
    Hello ${userName}!
    
    Thank you for joining the PropAgentic pre-launch waitlist! As a supporter, you're among the first to experience the next generation of property management technology.
    
    What's coming your way:
    • Exclusive updates on our development progress
    • Early access to beta features and testing
    • Direct input on product features and roadmap
    • Special recognition in our community
    
    We'll keep you updated on our journey and invite you to be part of our story.
    
    Best regards,
    The PropAgentic Team
  `;

  return {
    subject: "🌟 Thank you for supporting PropAgentic!",
    html: html,
    text: text
  };
}

// Run the test
testSupporterEmail()
  .then((success) => {
    if (success) {
      console.log('\n🎉 Supporter email test completed successfully!');
    } else {
      console.log('\n❌ Supporter email test failed');
    }
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  }); 