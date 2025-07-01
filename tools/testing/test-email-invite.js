/**
 * Test Script for Email Invitation System
 * 
 * This script tests the creation of an invite and checks that the email
 * notification is processed. It's a validation tool for ensuring the
 * email configuration in Firebase Functions is working correctly.
 * 
 * Prerequisites:
 * 1. Firebase Functions config should be set up with SMTP details
 * 2. Firebase Admin SDK should be initialized
 * 
 * Usage:
 * node scripts/test-email-invite.js
 */

const admin = require('firebase-admin');
const serviceAccount = require('../firebaseServiceAccountKey.json');

// Initialize Firebase Admin with your service account
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Test creating an invite that should trigger an email
 */
const testEmailInvite = async () => {
  console.log('🔄 Starting email invite test...');
  
  try {
    // Generate a test email with timestamp to avoid conflicts
    const timestamp = Date.now();
    const testEmail = `test-tenant-${timestamp}@example.com`;
    
    // Mock data for a test invite
    const inviteData = {
      tenantEmail: testEmail,
      propertyId: 'test-property-id',
      propertyName: 'Test Property',
      landlordId: 'test-landlord-id',
      landlordName: 'Test Landlord',
      status: 'pending',
      emailSentStatus: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    };
    
    console.log(`📧 Creating test invite for email: ${testEmail}`);
    
    // Create the invite document
    const inviteRef = await db.collection('invites').add(inviteData);
    const inviteId = inviteRef.id;
    console.log(`✅ Test invite created with ID: ${inviteId}`);
    
    // Give Firebase Functions time to process the trigger
    console.log('⏳ Waiting for Firebase Function to process email (10 seconds)...');
    await new Promise(resolve => setTimeout(resolve, 10000));
    
    // Check the status of the invite
    const updatedInviteDoc = await db.collection('invites').doc(inviteId).get();
    if (!updatedInviteDoc.exists) {
      throw new Error('Invite document no longer exists. Something went wrong.');
    }
    
    const updatedInviteData = updatedInviteDoc.data();
    console.log(`📊 Current invite status: ${updatedInviteData.emailSentStatus}`);
    
    // Check if an invite code was generated
    if (updatedInviteData.inviteCode) {
      console.log(`🔑 Invite code generated: ${updatedInviteData.inviteCode}`);
      
      // Look up the invite code in the inviteCodes collection
      const inviteCodesQuery = await db.collection('inviteCodes')
        .where('code', '==', updatedInviteData.inviteCode)
        .limit(1)
        .get();
        
      if (!inviteCodesQuery.empty) {
        const inviteCodeDoc = inviteCodesQuery.docs[0];
        const inviteCodeData = inviteCodeDoc.data();
        
        console.log(`📋 Found matching invite code document (ID: ${inviteCodeDoc.id})`);
        console.log(`   - Status: ${inviteCodeData.status}`);
        console.log(`   - Email: ${inviteCodeData.email}`);
        console.log(`   - Expires: ${new Date(inviteCodeData.expiresAt.toMillis()).toLocaleString()}`);
      } else {
        console.warn('⚠️ No matching invite code document found in inviteCodes collection');
      }
    } else {
      console.warn('⚠️ No invite code was generated for this invite');
    }
    
    // Final status report
    if (updatedInviteData.emailSentStatus === 'sent') {
      console.log('✅ SUCCESS: Email was successfully sent!');
      console.log(`   - Sent at: ${updatedInviteData.emailSentAt?.toDate().toLocaleString() || 'Unknown'}`);
    } else if (updatedInviteData.emailSentStatus === 'processing') {
      console.log('⏳ Email is still processing. Check Firebase Functions logs for more details.');
    } else if (updatedInviteData.emailSentStatus === 'failed') {
      console.error('❌ ERROR: Email sending failed!');
      console.error(`   - Error: ${updatedInviteData.emailError || 'No error details provided'}`);
      console.log('   - Check Firebase Functions logs for more details.');
    } else {
      console.warn(`⚠️ Unexpected status: ${updatedInviteData.emailSentStatus}`);
      console.log('   - Check Firebase Functions logs for more details.');
    }
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Check your email service (or Mailtrap inbox) for the test email');
    console.log('2. Verify the email contains the correct property information');
    console.log('3. Verify the invite code in the email matches the one in Firestore');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
};

// Run the test
testEmailInvite()
  .then(() => console.log('🏁 Test completed'))
  .catch((error) => console.error('💥 Fatal error:', error))
  .finally(() => process.exit()); 