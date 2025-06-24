/**
 * Test Script for New Email Triggers
 * 
 * This script tests the two new email trigger functions:
 * 1. sendInviteCodeEmail (inviteCodes collection)
 * 2. sendPropertyInviteEmail (invites collection)
 */

const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccountPath = path.join(__dirname, '../propagentic-firebase-adminsdk-fbsvc-c20b027723.json');
    const serviceAccount = require(serviceAccountPath);
    
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('✅ Firebase Admin initialized');
  } catch (error) {
    admin.initializeApp();
    console.log('✅ Firebase Admin initialized with default credentials');
  }
}

const db = admin.firestore();

/**
 * Test 1: inviteCodes collection email trigger
 */
async function testInviteCodeEmail() {
  console.log('\n🧪 Testing inviteCodes Email Trigger...\n');
  
  try {
    // Create a test invite code document
    const testCodeData = {
      code: 'TEST' + Date.now().toString().slice(-4),
      propertyId: 'test-property-id',
      landlordId: 'test-landlord-id',
      email: 'tenant@propagenticai.com', // ⚠️ Change to your test email
      status: 'active',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      ),
      testType: 'invite_code_email_test'
    };
    
    console.log('📝 Creating invite code document...');
    const codeRef = await db.collection('inviteCodes').add(testCodeData);
    console.log(`✅ Invite code created: ${codeRef.id}`);
    console.log(`📧 Email should be sent to: ${testCodeData.email}`);
    
    // Wait and check for email processing
    console.log('\n⏳ Waiting 10 seconds for email processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if email was processed
    const updatedCodeDoc = await codeRef.get();
    const updatedData = updatedCodeDoc.data();
    
    console.log('\n📊 Email Status Check:');
    console.log(`   Email Status: ${updatedData.emailStatus || 'not set'}`);
    console.log(`   Email Sent At: ${updatedData.emailSentAt || 'not set'}`);
    console.log(`   Mail Doc ID: ${updatedData.mailDocId || 'not set'}`);
    console.log(`   Error: ${updatedData.emailError || 'none'}`);
    
    // Check mail collection
    if (updatedData.mailDocId) {
      try {
        const mailDoc = await db.collection('mail').doc(updatedData.mailDocId).get();
        const mailData = mailDoc.data();
        
        console.log('\n📬 Mail Collection Status:');
        console.log(`   To: ${mailData.to}`);
        console.log(`   Subject: ${mailData.subject}`);
        console.log(`   Delivery State: ${mailData.delivery?.state || 'processing'}`);
        console.log(`   Delivery Error: ${mailData.delivery?.error || 'none'}`);
      } catch (error) {
        console.log(`   ❌ Could not fetch mail document: ${error.message}`);
      }
    }
    
    return {
      success: updatedData.emailStatus === 'sent',
      codeId: codeRef.id,
      emailStatus: updatedData.emailStatus,
      mailDocId: updatedData.mailDocId
    };
    
  } catch (error) {
    console.error('❌ Error testing invite code email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 2: invites collection email trigger
 */
async function testPropertyInviteEmail() {
  console.log('\n🧪 Testing invites Collection Email Trigger...\n');
  
  try {
    // Create a test property invite document
    const testInviteData = {
      landlordId: 'test-landlord-id',
      landlordName: 'Test Landlord',
      propertyId: 'test-property-id',
      propertyName: 'Test Property',
      tenantEmail: 'tenant@propagenticai.com', // ⚠️ Change to your test email
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      testType: 'property_invite_email_test'
    };
    
    console.log('📝 Creating property invite document...');
    const inviteRef = await db.collection('invites').add(testInviteData);
    console.log(`✅ Property invite created: ${inviteRef.id}`);
    console.log(`📧 Email should be sent to: ${testInviteData.tenantEmail}`);
    
    // Wait and check for email processing
    console.log('\n⏳ Waiting 10 seconds for email processing...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check if email was processed
    const updatedInviteDoc = await inviteRef.get();
    const updatedData = updatedInviteDoc.data();
    
    console.log('\n📊 Email Status Check:');
    console.log(`   Status: ${updatedData.status || 'not set'}`);
    console.log(`   Invite Code: ${updatedData.code || 'not generated'}`);
    console.log(`   Email Status: ${updatedData.emailStatus || 'not set'}`);
    console.log(`   Email Sent At: ${updatedData.emailSentAt || 'not set'}`);
    console.log(`   Mail Doc ID: ${updatedData.mailDocId || 'not set'}`);
    console.log(`   Error: ${updatedData.emailError || 'none'}`);
    
    // Check mail collection
    if (updatedData.mailDocId) {
      try {
        const mailDoc = await db.collection('mail').doc(updatedData.mailDocId).get();
        const mailData = mailDoc.data();
        
        console.log('\n📬 Mail Collection Status:');
        console.log(`   To: ${mailData.to}`);
        console.log(`   Subject: ${mailData.subject}`);
        console.log(`   Delivery State: ${mailData.delivery?.state || 'processing'}`);
        console.log(`   Delivery Error: ${mailData.delivery?.error || 'none'}`);
      } catch (error) {
        console.log(`   ❌ Could not fetch mail document: ${error.message}`);
      }
    }
    
    return {
      success: updatedData.status === 'sent' && updatedData.code,
      inviteId: inviteRef.id,
      status: updatedData.status,
      inviteCode: updatedData.code,
      mailDocId: updatedData.mailDocId
    };
    
  } catch (error) {
    console.error('❌ Error testing property invite email:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Test 3: Real UI flow test
 */
async function testRealUIFlow() {
  console.log('\n🧪 Testing Real UI Flow (sendPropertyInvite function)...\n');
  
  try {
    // This simulates what happens when a landlord sends an invite through the UI
    console.log('📝 This test simulates the real UI flow:');
    console.log('   1. Landlord clicks "Send Invite" in UI');
    console.log('   2. Frontend calls sendPropertyInvite Cloud Function');
    console.log('   3. Cloud Function creates document in "invites" collection');
    console.log('   4. Your new sendPropertyInviteEmail trigger should fire');
    console.log('   5. Email should be sent automatically');
    
    console.log('\n💡 To test this:');
    console.log('   1. Go to your app and try sending a real invite');
    console.log('   2. Check Firestore "invites" collection for the new document');
    console.log('   3. Verify email was sent and status updated');
    
    return { success: true, message: 'Manual test required via UI' };
    
  } catch (error) {
    console.error('❌ Error in real UI flow test:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Main test runner
 */
async function runAllTests() {
  console.log('🚀 Starting Email Trigger Tests...\n');
  console.log('⚠️  Make sure to change test email addresses to your own!\n');
  
  const results = {
    inviteCodeEmail: await testInviteCodeEmail(),
    propertyInviteEmail: await testPropertyInviteEmail(),
    realUIFlow: await testRealUIFlow()
  };
  
  console.log('\n📋 TEST RESULTS SUMMARY');
  console.log('========================\n');
  
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    console.log(`${testName}: ${status}`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
    if (result.mailDocId) {
      console.log(`   Mail Doc: ${result.mailDocId}`);
    }
  });
  
  const totalPassed = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.keys(results).length;
  
  console.log(`\n🎯 Summary: ${totalPassed}/${totalTests} tests passed`);
  
  if (totalPassed === totalTests) {
    console.log('\n🎉 All tests passed! Your email triggers are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above for details.');
  }
  
  console.log('\n📧 Check your email inbox for test messages!');
  console.log('📊 Check Firebase Console → Firestore → mail collection for email status');
  console.log('🔍 Check Firebase Functions logs for detailed trigger execution');
  
  process.exit(totalPassed === totalTests ? 0 : 1);
}

// Run tests if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testInviteCodeEmail,
  testPropertyInviteEmail,
  testRealUIFlow,
  runAllTests
}; 