/**
 * SendGrid Email Debugging Script
 * 
 * This script tests the Firebase Extension email functionality 
 * and provides detailed debugging information for SendGrid failures.
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    // Try to load service account from default locations
    const serviceAccountPath = path.join(__dirname, '../propagentic-firebase-adminsdk-fbsvc-c20b027723.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized with service account');
  } catch (error) {
    // Fallback to default credentials (for Cloud Functions environment)
    admin.initializeApp();
    console.log('✅ Firebase Admin initialized with default credentials');
  }
}

const db = admin.firestore();

/**
 * Test email formats supported by Firebase Extension
 */
async function testEmailFormats() {
  console.log('\n🧪 Testing different email document formats...\n');
  
  const baseEmail = 'tenant@propagenticai.com'; // Use your test email
  const testResults = [];
  
  // Format 1: Direct fields (recommended for Firebase Extension)
  try {
    console.log('📧 Testing Format 1: Direct fields...');
    const emailData1 = {
      to: baseEmail,
      subject: '🧪 SendGrid Test 1: Direct Fields Format',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4F46E5;">🧪 SendGrid Debug Test 1</h2>
          <p><strong>Format:</strong> Direct fields (recommended)</p>
          <p><strong>Test ID:</strong> FORMAT_1_${Date.now()}</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 15px 0;">
            <h3>📋 Test Details:</h3>
            <ul>
              <li>Document structure: Direct fields</li>
              <li>Subject, html, text at root level</li>
              <li>No message wrapper</li>
            </ul>
          </div>
          <p>If you receive this, Format 1 is working! ✅</p>
        </div>
      `,
      text: `SendGrid Debug Test 1 - Direct Fields Format. Test ID: FORMAT_1_${Date.now()}. Timestamp: ${new Date().toISOString()}. If you receive this, Format 1 is working!`,
      metadata: {
        testFormat: 'direct_fields',
        testId: `FORMAT_1_${Date.now()}`,
        source: 'debug_script'
      }
    };
    
    const docRef1 = await db.collection('mail').add(emailData1);
    console.log(`✅ Format 1 queued: ${docRef1.id}`);
    testResults.push({ format: 'direct_fields', docId: docRef1.id, status: 'queued' });
    
    // Wait a moment between tests
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.log(`❌ Format 1 failed: ${error.message}`);
    testResults.push({ format: 'direct_fields', error: error.message, status: 'failed' });
  }
  
  // Format 2: Message wrapper format (some docs suggest this)
  try {
    console.log('📧 Testing Format 2: Message wrapper...');
    const emailData2 = {
      to: baseEmail,
      message: {
        subject: '🧪 SendGrid Test 2: Message Wrapper Format',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #059669;">🧪 SendGrid Debug Test 2</h2>
            <p><strong>Format:</strong> Message wrapper</p>
            <p><strong>Test ID:</strong> FORMAT_2_${Date.now()}</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3>📋 Test Details:</h3>
              <ul>
                <li>Document structure: Message wrapper</li>
                <li>Subject, html, text inside message object</li>
                <li>Used in some legacy implementations</li>
              </ul>
            </div>
            <p>If you receive this, Format 2 is working! ✅</p>
          </div>
        `,
        text: `SendGrid Debug Test 2 - Message Wrapper Format. Test ID: FORMAT_2_${Date.now()}. Timestamp: ${new Date().toISOString()}. If you receive this, Format 2 is working!`
      },
      metadata: {
        testFormat: 'message_wrapper',
        testId: `FORMAT_2_${Date.now()}`,
        source: 'debug_script'
      }
    };
    
    const docRef2 = await db.collection('mail').add(emailData2);
    console.log(`✅ Format 2 queued: ${docRef2.id}`);
    testResults.push({ format: 'message_wrapper', docId: docRef2.id, status: 'queued' });
    
  } catch (error) {
    console.log(`❌ Format 2 failed: ${error.message}`);
    testResults.push({ format: 'message_wrapper', error: error.message, status: 'failed' });
  }
  
  return testResults;
}

/**
 * Monitor email delivery status
 */
async function monitorEmailDelivery(testResults, maxWaitTime = 60000) {
  console.log('\n📊 Monitoring email delivery status...\n');
  
  const startTime = Date.now();
  const checkInterval = 5000; // Check every 5 seconds
  
  while (Date.now() - startTime < maxWaitTime) {
    let allProcessed = true;
    
    for (const test of testResults) {
      if (test.status === 'queued' && test.docId) {
        try {
          const doc = await db.collection('mail').doc(test.docId).get();
          const data = doc.data();
          
          if (data.delivery) {
            test.status = 'processed';
            test.delivery = data.delivery;
            
            console.log(`📧 ${test.format} (${test.docId}):`);
            console.log(`   State: ${data.delivery.state || 'unknown'}`);
            console.log(`   Info: ${JSON.stringify(data.delivery.info || {})}`);
            
            if (data.delivery.error) {
              console.log(`   ❌ Error: ${data.delivery.error}`);
            }
            
            if (data.delivery.state === 'SUCCESS') {
              console.log(`   ✅ SUCCESS: Email sent successfully!`);
            } else if (data.delivery.state === 'ERROR') {
              console.log(`   ❌ FAILED: Email delivery failed`);
            }
          } else {
            allProcessed = false;
          }
        } catch (error) {
          console.log(`   ❌ Error checking ${test.format}: ${error.message}`);
          test.status = 'error';
          test.error = error.message;
        }
      }
    }
    
    if (allProcessed) {
      console.log('\n✅ All emails processed!');
      break;
    }
    
    console.log(`⏳ Waiting... (${Math.round((Date.now() - startTime) / 1000)}s elapsed)`);
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
  
  return testResults;
}

/**
 * Analyze SendGrid configuration
 */
async function analyzeSendGridConfig() {
  console.log('\n🔍 Analyzing SendGrid Configuration...\n');
  
  try {
    // Check if we can read mail collection
    const mailQuery = await db.collection('mail').limit(1).get();
    console.log('✅ Mail collection accessible');
    
    // Check recent failed emails
    const recentFails = await db.collection('mail')
      .where('delivery.state', '==', 'ERROR')
      .orderBy('delivery.timestamp', 'desc')
      .limit(5)
      .get();
    
    if (!recentFails.empty) {
      console.log('\n❌ Recent failed emails:');
      recentFails.forEach(doc => {
        const data = doc.data();
        console.log(`   📧 ${doc.id}: ${data.delivery?.error || 'Unknown error'}`);
        console.log(`      To: ${data.to}, Subject: ${data.subject || data.message?.subject}`);
      });
    } else {
      console.log('✅ No recent email failures found');
    }
    
    // Check recent successful emails
    const recentSuccess = await db.collection('mail')
      .where('delivery.state', '==', 'SUCCESS')
      .orderBy('delivery.timestamp', 'desc')
      .limit(3)
      .get();
    
    if (!recentSuccess.empty) {
      console.log('\n✅ Recent successful emails:');
      recentSuccess.forEach(doc => {
        const data = doc.data();
        console.log(`   📧 ${doc.id}: SUCCESS`);
        console.log(`      To: ${data.to}, Subject: ${data.subject || data.message?.subject}`);
      });
    } else {
      console.log('⚠️  No recent successful emails found');
    }
    
  } catch (error) {
    console.log(`❌ Error analyzing config: ${error.message}`);
  }
}

/**
 * Generate detailed report
 */
function generateReport(testResults) {
  console.log('\n📋 SENDGRID DEBUG REPORT');
  console.log('==========================\n');
  
  testResults.forEach(test => {
    console.log(`📧 Format: ${test.format}`);
    console.log(`   Status: ${test.status}`);
    
    if (test.delivery) {
      console.log(`   Delivery State: ${test.delivery.state}`);
      if (test.delivery.error) {
        console.log(`   Error: ${test.delivery.error}`);
      }
      if (test.delivery.info) {
        console.log(`   Info: ${JSON.stringify(test.delivery.info)}`);
      }
    }
    
    if (test.error) {
      console.log(`   Error: ${test.error}`);
    }
    
    console.log();
  });
  
  // Recommendations
  console.log('🎯 RECOMMENDATIONS:');
  console.log('==================\n');
  
  const successfulFormats = testResults.filter(t => t.delivery?.state === 'SUCCESS');
  const failedFormats = testResults.filter(t => t.delivery?.state === 'ERROR' || t.error);
  
  if (successfulFormats.length > 0) {
    console.log('✅ Working formats:');
    successfulFormats.forEach(t => console.log(`   - ${t.format}`));
  }
  
  if (failedFormats.length > 0) {
    console.log('\n❌ Failed formats:');
    failedFormats.forEach(t => {
      console.log(`   - ${t.format}: ${t.delivery?.error || t.error}`);
    });
  }
  
  if (failedFormats.length === testResults.length) {
    console.log('\n🚨 ALL FORMATS FAILED - CHECK:');
    console.log('   1. SendGrid API key configuration');
    console.log('   2. Domain authentication in SendGrid');
    console.log('   3. Firebase Extension logs');
    console.log('   4. SendGrid account status/limits');
  }
}

/**
 * Main debugging function
 */
async function main() {
  console.log('🚀 Starting SendGrid Email Debug...\n');
  
  try {
    // Step 1: Analyze current config
    await analyzeSendGridConfig();
    
    // Step 2: Test different formats
    const testResults = await testEmailFormats();
    
    // Step 3: Monitor delivery
    const finalResults = await monitorEmailDelivery(testResults);
    
    // Step 4: Generate report
    generateReport(finalResults);
    
    console.log('\n🏁 Debug complete! Check your email and Firebase logs.');
    
  } catch (error) {
    console.error('❌ Debug script failed:', error);
  }
  
  process.exit(0);
}

// Run the debug script
if (require.main === module) {
  main();
}

module.exports = {
  testEmailFormats,
  monitorEmailDelivery,
  analyzeSendGridConfig
}; 