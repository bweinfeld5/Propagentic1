/**
 * Test Unified Invite Flow
 * 
 * This script tests both the working browser test email logic 
 * and the real invitation flow to identify the differences.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  try {
    const serviceAccount = require('../propagentic-firebase-adminsdk-fbsvc-c20b027723.json');
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'propagentic'
    });
    console.log('✅ Firebase Admin initialized with service account');
  } catch (error) {
    admin.initializeApp({
      projectId: 'propagentic'
    });
    console.log('✅ Firebase Admin initialized with default credentials');
  }
}

const db = admin.firestore();

/**
 * Test 1: Working Browser Test Logic (direct mail collection)
 */
async function testWorkingBrowserLogic() {
  console.log('\n🧪 Testing: Working Browser Test Logic (Direct Mail)...\n');
  
  try {
    const emailData = {
      to: 'test@propagenticai.com', // Replace with your test email
      subject: '✅ Working Browser Test - Unified Flow',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #059669;">✅ Working Browser Test Logic</h1>
          <p>This email was sent using the <strong>working browser test logic</strong> that successfully sends emails:</p>
          <ul>
            <li><strong>Collection:</strong> mail</li>
            <li><strong>Format:</strong> Direct fields (to, subject, html, text)</li>
            <li><strong>Trigger:</strong> Firebase Extension processes immediately</li>
          </ul>
          <p>Timestamp: ${new Date().toISOString()}</p>
          <div style="background: #f0fdf4; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #166534;"><strong>✅ This logic works consistently!</strong></p>
          </div>
        </div>
      `,
      text: `Working Browser Test Logic - This email was sent using the working browser test logic. Collection: mail, Format: Direct fields. Timestamp: ${new Date().toISOString()}`
    };
    
    // Use the EXACT same logic as the working browser test
    const mailDoc = await db.collection('mail').add(emailData);
    
    console.log('✅ Working logic: Email queued successfully!');
    console.log(`   Mail Document ID: ${mailDoc.id}`);
    console.log(`   Collection: mail`);
    console.log(`   Format: Direct fields`);
    console.log(`   Recipient: ${emailData.to}`);
    
    return { success: true, mailDocId: mailDoc.id, method: 'direct_mail' };
    
  } catch (error) {
    console.error('❌ Working logic failed:', error.message);
    return { success: false, error: error.message, method: 'direct_mail' };
  }
}

/**
 * Test 2: Real Invitation Flow (invites collection trigger)
 */
async function testRealInvitationFlow() {
  console.log('\n🧪 Testing: Real Invitation Flow (Invites Collection)...\n');
  
  try {
    // Create invite data exactly as the real flow does
    const inviteData = {
      landlordId: 'test-landlord-123',
      landlordName: 'Test Landlord',
      propertyId: 'test-property-456',
      propertyName: 'Test Property - 123 Main St',
      tenantEmail: 'test@propagenticai.com', // Replace with your test email
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    console.log('📝 Creating invite document with data:');
    console.log(`   Landlord: ${inviteData.landlordName}`);
    console.log(`   Property: ${inviteData.propertyName}`);
    console.log(`   Tenant: ${inviteData.tenantEmail}`);
    console.log(`   Status: ${inviteData.status}`);
    
    // Create invite document (this should trigger sendPropertyInviteEmail)
    const inviteDoc = await db.collection('invites').add(inviteData);
    
    console.log('✅ Real flow: Invite document created!');
    console.log(`   Invite Document ID: ${inviteDoc.id}`);
    console.log(`   Collection: invites`);
    console.log(`   Expected trigger: sendPropertyInviteEmail`);
    
    // Wait for the trigger to process
    console.log('\n⏳ Waiting for email trigger function to process...');
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
    
    // Check if the invite was updated with email status
    const updatedInvite = await inviteDoc.get();
    const updatedData = updatedInvite.data();
    
    console.log('\n📊 Email trigger results:');
    console.log(`   Email Status: ${updatedData.emailStatus || 'not_set'}`);
    console.log(`   Status: ${updatedData.status || 'pending'}`);
    console.log(`   Code: ${updatedData.code || 'not_generated'}`);
    console.log(`   Mail Doc ID: ${updatedData.mailDocId || 'not_created'}`);
    
    if (updatedData.emailError) {
      console.log(`   ❌ Email Error: ${updatedData.emailError}`);
    }
    
    if (updatedData.mailDocId) {
      // Check the mail document created by the trigger
      try {
        const mailDoc = await db.collection('mail').doc(updatedData.mailDocId).get();
        const mailData = mailDoc.data();
        
        console.log('\n📬 Mail document created by trigger:');
        console.log(`   To: ${mailData.to}`);
        console.log(`   Subject: ${mailData.subject}`);
        console.log(`   Delivery State: ${mailData.delivery?.state || 'processing'}`);
        console.log(`   Delivery Error: ${mailData.delivery?.error || 'none'}`);
      } catch (mailError) {
        console.log(`   ❌ Could not fetch mail document: ${mailError.message}`);
      }
    }
    
    const success = updatedData.emailStatus === 'sent' || updatedData.status === 'sent';
    return { 
      success,
      inviteDocId: inviteDoc.id,
      emailStatus: updatedData.emailStatus,
      mailDocId: updatedData.mailDocId,
      method: 'trigger_based' 
    };
    
  } catch (error) {
    console.error('❌ Real flow failed:', error.message);
    return { success: false, error: error.message, method: 'trigger_based' };
  }
}

/**
 * Test 3: Unified Logic (use working logic for real invitations)
 */
async function testUnifiedLogic() {
  console.log('\n🧪 Testing: Unified Logic (Real Data + Working Method)...\n');
  
  try {
    // Use real invitation data but send via working method
    const realInviteData = {
      landlordName: 'Test Landlord',
      propertyName: 'Test Property - 123 Main St',
      tenantEmail: 'test@propagenticai.com',
      inviteCode: 'TEST123X'
    };
    
    const unifiedEmailData = {
      to: realInviteData.tenantEmail,
      subject: `You're Invited to Join ${realInviteData.propertyName} on PropAgentic`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">🎉 PropAgentic Invitation</h1>
          <h2>Hello!</h2>
          <p>${realInviteData.landlordName} has invited you to join <strong>${realInviteData.propertyName}</strong> on PropAgentic.</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
            <h3>Your Invitation Code</h3>
            <div style="background: #4F46E5; color: white; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 3px;">
              ${realInviteData.inviteCode}
            </div>
          </div>
          
          <p><strong>🔗 This email uses:</strong></p>
          <ul>
            <li>✅ Real invitation data (landlord, property, tenant)</li>
            <li>✅ Working browser test method (direct mail collection)</li>
            <li>✅ Same format as successful emails</li>
          </ul>
          
          <p>Timestamp: ${new Date().toISOString()}</p>
          <p><em>This is the unified approach that should work for all real invitations!</em></p>
        </div>
      `,
      text: `PropAgentic Property Invitation - ${realInviteData.landlordName} has invited you to join ${realInviteData.propertyName}. Your invitation code: ${realInviteData.inviteCode}. Timestamp: ${new Date().toISOString()}`
    };
    
    // Use the working method (direct mail collection) with real data
    const mailDoc = await db.collection('mail').add(unifiedEmailData);
    
    console.log('✅ Unified logic: Email queued successfully!');
    console.log(`   Mail Document ID: ${mailDoc.id}`);
    console.log(`   Method: Working browser test logic`);
    console.log(`   Data: Real invitation details`);
    console.log(`   Recipient: ${unifiedEmailData.to}`);
    
    return { success: true, mailDocId: mailDoc.id, method: 'unified' };
    
  } catch (error) {
    console.error('❌ Unified logic failed:', error.message);
    return { success: false, error: error.message, method: 'unified' };
  }
}

/**
 * Main test runner
 */
async function runUnifiedInviteTests() {
  console.log('🚀 Starting Unified Invite Flow Tests...\n');
  console.log('This will test and compare:');
  console.log('1. ✅ Working browser test logic (direct mail)');
  console.log('2. 🤔 Real invitation flow (invites collection trigger)');
  console.log('3. 🎯 Unified approach (real data + working method)');
  
  const results = {
    browserTest: await testWorkingBrowserLogic(),
    realFlow: await testRealInvitationFlow(),
    unifiedLogic: await testUnifiedLogic()
  };
  
  console.log('\n📋 TEST RESULTS SUMMARY');
  console.log('========================\n');
  
  Object.entries(results).forEach(([testName, result]) => {
    const status = result.success ? '✅ SUCCESS' : '❌ FAILED';
    console.log(`${testName} (${result.method}): ${status}`);
    
    if (result.success) {
      if (result.mailDocId) {
        console.log(`   📧 Mail Document: ${result.mailDocId}`);
      }
      if (result.inviteDocId) {
        console.log(`   📝 Invite Document: ${result.inviteDocId}`);
      }
    } else {
      console.log(`   ❌ Error: ${result.error}`);
    }
  });
  
  const workingMethods = Object.values(results).filter(r => r.success);
  const failedMethods = Object.values(results).filter(r => !r.success);
  
  console.log(`\n🎯 Summary: ${workingMethods.length}/3 methods working`);
  
  if (results.browserTest.success && !results.realFlow.success) {
    console.log('\n💡 SOLUTION IDENTIFIED:');
    console.log('   ✅ Browser test logic works (direct mail collection)');
    console.log('   ❌ Real flow has issues (invite collection trigger)');
    console.log('   🎯 Use unified approach: Real data + Working method');
    console.log('\n🔧 Next Steps:');
    console.log('   1. Update real invitation flow to use direct mail collection');
    console.log('   2. Ensure sendPropertyInvite creates mail documents directly');
    console.log('   3. Deploy and test the unified solution');
  } else if (results.realFlow.success) {
    console.log('\n🎉 All methods working! Email triggers are functioning correctly.');
  } else {
    console.log('\n⚠️  Multiple issues detected. Check logs above for details.');
  }
  
  console.log('\n📧 Check your email for test messages!');
  process.exit(0);
}

// Run tests if called directly
if (require.main === module) {
  runUnifiedInviteTests().catch(console.error);
}

module.exports = {
  testWorkingBrowserLogic,
  testRealInvitationFlow,
  testUnifiedLogic,
  runUnifiedInviteTests
}; 