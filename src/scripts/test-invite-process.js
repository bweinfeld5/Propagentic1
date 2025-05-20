// Test script for simulating the tenant invitation process
const admin = require('firebase-admin');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

// Load service account key with corrected path
const serviceAccountPath = path.join(__dirname, '../../propagentic-firebase-adminsdk-fbsvc-c20b027723.json');
const serviceAccount = require(serviceAccountPath);

// Initialize the app with admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

/**
 * Test script to execute the full invitation process
 * 1. Create a landlord (if needed)
 * 2. Create a property (if needed)
 * 3. Create an invitation
 * 4. Send an email
 * 5. Accept the invitation (simulate tenant)
 */
async function testInviteProcess() {
  try {
    console.log('============================================');
    console.log('TENANT INVITATION PROCESS TESTING SCRIPT');
    console.log('============================================');
    
    // Configuration - CHANGE THESE VALUES AS NEEDED
    const testLandlordEmail = 'landlord@example.com';
    const testTenantEmail = 'tenant@example.com'; // The email to receive the invitation
    const testPropertyName = 'Test Property';
    const testPropertyAddress = '123 Test Street, Testville';
    
    // Step 1: Ensure a test landlord exists
    console.log('\n1. Ensuring test landlord exists...');
    const landlordId = await ensureTestLandlordExists(testLandlordEmail);
    console.log(`✅ Using landlord with ID: ${landlordId}`);
    
    // Step 2: Ensure a test property exists
    console.log('\n2. Ensuring test property exists...');
    const propertyId = await ensureTestPropertyExists(landlordId, testPropertyName, testPropertyAddress);
    console.log(`✅ Using property with ID: ${propertyId}`);
    
    // Step 3: Create an invitation
    console.log('\n3. Creating tenant invitation...');
    const inviteId = await createInvitation(landlordId, propertyId, testPropertyName, testTenantEmail);
    console.log(`✅ Created invitation with ID: ${inviteId}`);
    
    // Step 4: Send an email via the mail collection
    console.log('\n4. Sending invitation email...');
    await sendInvitationEmail(inviteId, landlordId, propertyId, testPropertyName, testTenantEmail);
    console.log(`✅ Email document added to mail collection`);
    
    // Step 5: Simulate tenant accepting the invitation
    console.log('\n5. Simulating tenant accepting invitation...');
    const tenantId = await simulateTenantAcceptingInvitation(inviteId, testTenantEmail);
    console.log(`✅ Invitation accepted by tenant with ID: ${tenantId}`);
    
    console.log('\n============================================');
    console.log('🎉 TENANT INVITATION PROCESS COMPLETED SUCCESSFULLY');
    console.log('============================================');
    
  } catch (error) {
    console.error('❌ Error in tenant invitation process:', error);
  } finally {
    // Explicitly exit when done since admin SDK keeps connections open
    process.exit(0);
  }
}

/**
 * Ensure a test landlord exists in the database
 */
async function ensureTestLandlordExists(email) {
  // Check if user with email already exists
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).limit(1).get();
  
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  
  // Create a new landlord user
  const landlordId = uuidv4();
  await db.collection('users').doc(landlordId).set({
    email: email,
    userType: 'landlord',
    role: 'landlord',
    displayName: 'Test Landlord',
    firstName: 'Test',
    lastName: 'Landlord',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    onboardingComplete: true
  });
  
  console.log(`Created new landlord user: ${email}`);
  return landlordId;
}

/**
 * Ensure a test property exists in the database
 */
async function ensureTestPropertyExists(landlordId, propertyName, address) {
  // Check if property already exists for this landlord
  const propertiesRef = db.collection('properties');
  const snapshot = await propertiesRef.where('landlordId', '==', landlordId)
                                     .where('name', '==', propertyName)
                                     .limit(1).get();
  
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  
  // Create a new property
  const propertyData = {
    name: propertyName,
    address: address,
    landlordId: landlordId,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    isOccupied: false,
    numberOfUnits: 1
  };
  
  const propertyRef = await db.collection('properties').add(propertyData);
  console.log(`Created new property: ${propertyName}`);
  return propertyRef.id;
}

/**
 * Create an invitation in the invites collection
 */
async function createInvitation(landlordId, propertyId, propertyName, tenantEmail) {
  // Create expiration date (7 days from now)
  const now = admin.firestore.Timestamp.now();
  const expiresAt = new admin.firestore.Timestamp(
    now.seconds + 7 * 24 * 60 * 60,
    now.nanoseconds
  );
  
  // Create invitation document
  const inviteData = {
    tenantEmail: tenantEmail.toLowerCase(),
    propertyId: propertyId,
    landlordId: landlordId,
    propertyName: propertyName,
    landlordName: 'Test Landlord',
    status: 'pending',
    emailSentStatus: 'pending',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    expiresAt: expiresAt
  };
  
  const inviteRef = await db.collection('invites').add(inviteData);
  return inviteRef.id;
}

/**
 * Send an invitation email by adding a document to the mail collection
 */
async function sendInvitationEmail(inviteId, landlordId, propertyId, propertyName, tenantEmail) {
  // Create mail document as per the Firebase Extension format
  const mailData = {
    to: tenantEmail,
    message: {
      subject: 'You have been invited to PropAgentic',
      text: `You have been invited to join ${propertyName} on PropAgentic. Click the link to accept: https://propagentic.com/invite/${inviteId}`,
      html: `
        <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #176B5D;">PropAgentic Invitation</h2>
          <p>Hello,</p>
          <p>You've been invited to join <strong>${propertyName}</strong> on PropAgentic.</p>
          <p><a href="https://propagentic.com/invite/${inviteId}" style="display: inline-block; background-color: #176B5D; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Accept Invitation</a></p>
          <p>This invitation will expire in 7 days.</p>
          <p>If you have any questions, please contact your property manager.</p>
        </div>
      `
    }
  };
  
  // Add to mail collection
  const mailRef = await db.collection('mail').add(mailData);
  
  // Update the invite with emailSentStatus
  await db.collection('invites').doc(inviteId).update({
    emailSentStatus: 'sent',
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  return mailRef.id;
}

/**
 * Simulate a tenant accepting the invitation
 */
async function simulateTenantAcceptingInvitation(inviteId, tenantEmail) {
  // First, ensure tenant user exists
  const tenantId = await ensureTenantUserExists(tenantEmail);
  
  // Get the invitation
  const inviteRef = db.collection('invites').doc(inviteId);
  const invite = await inviteRef.get();
  
  if (!invite.exists) {
    throw new Error(`Invitation with ID ${inviteId} not found`);
  }
  
  const inviteData = invite.data();
  
  // Update invitation status
  await inviteRef.update({
    status: 'accepted',
    tenantId: tenantId,
    acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Update tenant user profile with property association
  await db.collection('users').doc(tenantId).update({
    propertyId: inviteData.propertyId,
    landlordId: inviteData.landlordId,
    joinDate: admin.firestore.FieldValue.serverTimestamp()
  });
  
  // Optionally, mark property as occupied
  await db.collection('properties').doc(inviteData.propertyId).update({
    isOccupied: true,
    tenantId: tenantId
  });
  
  return tenantId;
}

/**
 * Ensure a test tenant user exists
 */
async function ensureTenantUserExists(email) {
  // Check if user with email already exists
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).limit(1).get();
  
  if (!snapshot.empty) {
    return snapshot.docs[0].id;
  }
  
  // Create a new tenant user
  const tenantId = uuidv4();
  await db.collection('users').doc(tenantId).set({
    email: email,
    userType: 'tenant',
    role: 'tenant',
    displayName: 'Test Tenant',
    firstName: 'Test',
    lastName: 'Tenant',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    onboardingComplete: true
  });
  
  console.log(`Created new tenant user: ${email}`);
  return tenantId;
}

// Run the test
testInviteProcess(); 