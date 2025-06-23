/**
 * Send Real Invitation Script
 * 
 * This script uses your current user data and property to send a real invitation
 * to bweinfeld15@gmail.com via the existing invitation system.
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
const serviceAccount = require('../service-account-key.json');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

/**
 * Get the current user's data and properties
 */
async function getCurrentUserData() {
  try {
    // Get the current user (from the test results, we know the UID)
    const currentUserUid = 'fKwBfNmwNmabc3ZEXgFgkqVglog2'; // From test results
    
    console.log('🔍 Fetching user data for:', currentUserUid);
    
    // Get user profile
    const userDoc = await db.collection('users').doc(currentUserUid).get();
    if (!userDoc.exists) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    console.log('👤 User found:', userData.email);
    
    // Get user's properties
    const propertiesQuery = await db.collection('properties')
      .where('landlordId', '==', currentUserUid)
      .limit(1)
      .get();
    
    if (propertiesQuery.empty) {
      throw new Error('No properties found for user');
    }
    
    const propertyDoc = propertiesQuery.docs[0];
    const propertyData = propertyDoc.data();
    
    console.log('🏠 Property found:', propertyData.name || propertyData.streetAddress);
    
    return {
      user: userData,
      userId: currentUserUid,
      property: propertyData,
      propertyId: propertyDoc.id
    };
    
  } catch (error) {
    console.error('❌ Error fetching user data:', error);
    throw error;
  }
}

/**
 * Send invitation using the real invitation service
 */
async function sendRealInvitation() {
  try {
    console.log('🚀 Starting real invitation process...');
    
    // Get current user data
    const { user, userId, property, propertyId } = await getCurrentUserData();
    
    // Prepare invitation data
    const inviteData = {
      propertyId: propertyId,
      tenantEmail: 'bweinfeld15@gmail.com',
      propertyName: property.name || property.streetAddress || 'Your Property',
      landlordName: user.name || user.firstName || user.email || 'Property Manager',
      landlordId: userId
    };
    
    console.log('📝 Creating invitation with data:');
    console.log('   Property:', inviteData.propertyName);
    console.log('   Landlord:', inviteData.landlordName);
    console.log('   Tenant Email:', inviteData.tenantEmail);
    
    // Set expiration date (7 days from now)
    const expiresAt = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    // Create the invitation document (this will trigger the email function)
    const inviteRef = await db.collection('invites').add({
      ...inviteData,
      tenantEmail: inviteData.tenantEmail.toLowerCase(),
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt,
      emailSentStatus: 'pending'
    });
    
    console.log('✅ Invitation created successfully!');
    console.log('📧 Invitation ID:', inviteRef.id);
    console.log('📬 Email will be sent to:', inviteData.tenantEmail);
    
    console.log('\n⏳ The Firebase Function should now automatically:');
    console.log('   1. Generate an invitation code');
    console.log('   2. Send the email via SendGrid');
    console.log('   3. Update the invitation status');
    
    return inviteRef.id;
    
  } catch (error) {
    console.error('❌ Error sending real invitation:', error);
    throw error;
  }
}

/**
 * Check the status of an invitation
 */
async function checkInvitationStatus(inviteId) {
  try {
    const inviteDoc = await db.collection('invites').doc(inviteId).get();
    
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

/**
 * Monitor invitation status for 30 seconds
 */
async function monitorInvitation(inviteId) {
  console.log('\n👀 Monitoring invitation status...');
  
  let attempts = 0;
  const maxAttempts = 6; // 30 seconds total (5 second intervals)
  
  const checkStatus = async () => {
    attempts++;
    console.log(`\n📊 Status Check #${attempts}:`);
    
    const status = await checkInvitationStatus(inviteId);
    
    if (status && status.emailSentStatus === 'sent') {
      console.log('🎉 EMAIL SENT SUCCESSFULLY!');
      console.log('📧 Check bweinfeld15@gmail.com for the invitation email.');
      return true;
    }
    
    if (attempts >= maxAttempts) {
      console.log('⏰ Monitoring timeout reached.');
      console.log('📱 Check Firebase Console logs for more details.');
      return false;
    }
    
    console.log('⏳ Still processing... checking again in 5 seconds');
    setTimeout(checkStatus, 5000);
  };
  
  setTimeout(checkStatus, 2000); // Start checking after 2 seconds
}

// Main execution
async function main() {
  try {
    const inviteId = await sendRealInvitation();
    await monitorInvitation(inviteId);
    
  } catch (error) {
    console.error('❌ Script failed:', error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { sendRealInvitation, checkInvitationStatus }; 