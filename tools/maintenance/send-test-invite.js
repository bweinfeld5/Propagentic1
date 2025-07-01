/**
 * Send Test Invitation Script
 * 
 * This script creates a real invitation and sends it via email to test the full flow.
 * It uses the existing invitation service and Firebase Functions.
 */

const admin = require('firebase-admin');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp, Timestamp } = require('firebase/firestore');

// Initialize Firebase Admin (for server-side operations)
const serviceAccount = require('../firebaseServiceAccountKey.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

// Firebase client config (for client-side operations)
const firebaseConfig = {
  apiKey: "AIzaSyBJqQOhJhJJJhJJJhJJJhJJJhJJJhJJJhJ", // This will be replaced by actual config
  authDomain: "propagentic-ai.firebaseapp.com",
  projectId: "propagentic-ai",
  storageBucket: "propagentic-ai.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefghijklmnop"
};

// Initialize Firebase client
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Send a test invitation to bweinfeld15@gmail.com
 */
async function sendTestInvitation() {
  try {
    console.log('🚀 Starting test invitation process...');
    
    // Test data - replace with actual values from your system
    const testInviteData = {
      propertyId: 'test-property-001', // You'll need to use a real property ID
      tenantEmail: 'bweinfeld15@gmail.com',
      propertyName: 'Test Property - 123 Main St',
      landlordName: 'Ben Weinfeld (Test)',
      landlordId: 'test-landlord-001' // You'll need to use a real landlord ID
    };
    
    console.log('📝 Creating invitation with data:', testInviteData);
    
    // Set expiration date (7 days from now)
    const now = Timestamp.now();
    const expiresAt = new Timestamp(
      now.seconds + 7 * 24 * 60 * 60,
      now.nanoseconds
    );

    // Create the invitation document
    const inviteRef = await addDoc(collection(db, 'invites'), {
      ...testInviteData,
      tenantEmail: testInviteData.tenantEmail.toLowerCase(),
      status: 'pending',
      createdAt: serverTimestamp(),
      expiresAt,
      emailSentStatus: 'pending'
    });
    
    console.log('✅ Invitation created successfully!');
    console.log('📧 Invitation ID:', inviteRef.id);
    console.log('📬 Email will be sent to:', testInviteData.tenantEmail);
    console.log('🏠 Property:', testInviteData.propertyName);
    console.log('👤 From:', testInviteData.landlordName);
    
    console.log('\n⏳ The Firebase Function should now automatically:');
    console.log('   1. Generate an invitation code');
    console.log('   2. Send the email via SendGrid');
    console.log('   3. Update the invitation status');
    
    console.log('\n📱 Check the Firebase Console logs to see the email sending process.');
    console.log('📧 Check bweinfeld15@gmail.com for the invitation email.');
    
    return inviteRef.id;
    
  } catch (error) {
    console.error('❌ Error sending test invitation:', error);
    throw error;
  }
}

/**
 * Check the status of an invitation
 */
async function checkInvitationStatus(inviteId) {
  try {
    const adminDb = admin.firestore();
    const inviteDoc = await adminDb.collection('invites').doc(inviteId).get();
    
    if (!inviteDoc.exists) {
      console.log('❌ Invitation not found');
      return null;
    }
    
    const data = inviteDoc.data();
    console.log('\n📊 Invitation Status:');
    console.log('   ID:', inviteId);
    console.log('   Status:', data.status);
    console.log('   Email Status:', data.emailSentStatus);
    console.log('   Code:', data.code || 'Not generated yet');
    console.log('   Created:', data.createdAt?.toDate?.() || data.createdAt);
    console.log('   Email Sent:', data.emailSentAt?.toDate?.() || data.emailSentAt || 'Not sent yet');
    
    return data;
  } catch (error) {
    console.error('❌ Error checking invitation status:', error);
    throw error;
  }
}

// Main execution
async function main() {
  try {
    const inviteId = await sendTestInvitation();
    
    // Wait a few seconds then check status
    console.log('\n⏳ Waiting 5 seconds to check status...');
    setTimeout(async () => {
      await checkInvitationStatus(inviteId);
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { sendTestInvitation, checkInvitationStatus }; 