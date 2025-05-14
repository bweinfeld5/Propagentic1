/**
 * Test script for Propagentic User Relationship API endpoints
 * 
 * This script demonstrates how to call and test the tenant invitation
 * and contractor rolodex API endpoints.
 * 
 * Usage:
 * 1. Make sure you have Firebase Admin SDK credentials (service-account-key.json)
 * 2. Run: node test-user-relationships.js
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin SDK with service account
const serviceAccount = require('../service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Test data
const testLandlord = {
  uid: `test-landlord-${uuidv4().substring(0, 8)}`,
  email: 'testlandlord@example.com',
  name: 'Test Landlord',
  role: 'landlord',
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

const testTenant = {
  uid: `test-tenant-${uuidv4().substring(0, 8)}`,
  email: 'testtenant@example.com',
  name: 'Test Tenant',
  role: 'tenant',
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

const testContractor = {
  uid: `test-contractor-${uuidv4().substring(0, 8)}`,
  email: 'testcontractor@example.com',
  name: 'Test Contractor',
  role: 'contractor',
  contractorSkills: ['plumbing', 'electrical', 'general'],
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

const testProperty = {
  propertyName: 'Test Property',
  address: {
    street: '123 Test Street',
    city: 'Testville',
    state: 'TS',
    zip: '12345'
  },
  landlordId: '', // Will be set later
  unitList: ['101', '102', '103'],
  tenantIds: [],
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

// Tracking variables for test
let propertyId = '';
let tenantInvitationId = '';
let contractorInvitationId = '';

/**
 * Set up test data for user relationship tests
 */
async function setupTestData() {
  try {
    console.log('\n=== Setting up test data ===');
    
    // Create test landlord
    console.log(`Creating test landlord: ${testLandlord.uid}`);
    await db.collection('users').doc(testLandlord.uid).set(testLandlord);
    
    // Create landlord profile
    await db.collection('landlordProfiles').doc(testLandlord.uid).set({
      landlordId: testLandlord.uid,
      userId: testLandlord.uid,
      properties: [],
      contractors: [],
      invitesSent: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create test tenant
    console.log(`Creating test tenant: ${testTenant.uid}`);
    await db.collection('users').doc(testTenant.uid).set(testTenant);
    
    // Create test contractor
    console.log(`Creating test contractor: ${testContractor.uid}`);
    await db.collection('users').doc(testContractor.uid).set(testContractor);
    
    // Create property for the landlord
    testProperty.landlordId = testLandlord.uid;
    console.log('Creating test property');
    const propertyRef = await db.collection('properties').add(testProperty);
    propertyId = propertyRef.id;
    
    // Update landlord profile with property
    await db.collection('landlordProfiles').doc(testLandlord.uid).update({
      properties: admin.firestore.FieldValue.arrayUnion(propertyId)
    });
    
    console.log('Test data setup complete!');
    console.log(`Landlord ID: ${testLandlord.uid}`);
    console.log(`Tenant ID: ${testTenant.uid}`);
    console.log(`Contractor ID: ${testContractor.uid}`);
    console.log(`Property ID: ${propertyId}`);
    
    return true;
  } catch (error) {
    console.error('Error setting up test data:', error);
    return false;
  }
}

/**
 * Simulate sending a tenant invitation
 */
async function testSendTenantInvitation() {
  try {
    console.log('\n=== Testing sendTenantInvitation ===');
    
    // Simulate the function call
    const invitationData = {
      type: 'tenant',
      email: testTenant.email,
      propertyId: propertyId,
      landlordId: testLandlord.uid,
      unitNumber: '101',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      )
    };
    
    const invitationRef = await db.collection('invitations').add(invitationData);
    tenantInvitationId = invitationRef.id;
    
    // Update landlord profile with invitation
    await db.collection('landlordProfiles').doc(testLandlord.uid).update({
      invitesSent: admin.firestore.FieldValue.arrayUnion(tenantInvitationId)
    });
    
    console.log(`Tenant invitation created with ID: ${tenantInvitationId}`);
    
    return true;
  } catch (error) {
    console.error('Error testing sendTenantInvitation:', error);
    return false;
  }
}

/**
 * Simulate accepting a tenant invitation
 */
async function testAcceptTenantInvitation() {
  try {
    console.log('\n=== Testing acceptTenantInvitation ===');
    
    // Get the invitation
    const invitationSnapshot = await db.collection('invitations').doc(tenantInvitationId).get();
    
    if (!invitationSnapshot.exists) {
      console.error('Invitation not found');
      return false;
    }
    
    const invitation = invitationSnapshot.data();
    
    // Update invitation status
    await db.collection('invitations').doc(tenantInvitationId).update({
      status: 'accepted',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      tenantId: testTenant.uid
    });
    
    // Add tenant to property
    await db.collection('properties').doc(invitation.propertyId).update({
      tenantIds: admin.firestore.FieldValue.arrayUnion(testTenant.uid)
    });
    
    // Create tenant-property mapping
    await db.collection('tenantProperties').add({
      tenantId: testTenant.uid,
      propertyId: invitation.propertyId,
      unitNumber: invitation.unitNumber,
      landlordId: invitation.landlordId,
      moveInDate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create tenant profile if it doesn't exist
    const tenantProfileRef = db.collection('tenantProfiles').doc(testTenant.uid);
    const tenantProfileSnapshot = await tenantProfileRef.get();
    
    if (tenantProfileSnapshot.exists) {
      await tenantProfileRef.update({
        properties: admin.firestore.FieldValue.arrayUnion(invitation.propertyId)
      });
    } else {
      await tenantProfileRef.set({
        tenantId: testTenant.uid,
        properties: [invitation.propertyId],
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`Tenant invitation ${tenantInvitationId} accepted by tenant ${testTenant.uid}`);
    
    return true;
  } catch (error) {
    console.error('Error testing acceptTenantInvitation:', error);
    return false;
  }
}

/**
 * Test adding a contractor to rolodex
 */
async function testAddContractorToRolodex() {
  try {
    console.log('\n=== Testing addContractorToRolodex ===');
    
    // Create contractor invitation
    const invitationData = {
      type: 'contractor',
      email: testContractor.email,
      landlordId: testLandlord.uid,
      status: 'pending',
      message: 'Would you like to join my contractor network?',
      contractorId: testContractor.uid,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
        new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      )
    };
    
    const invitationRef = await db.collection('invitations').add(invitationData);
    contractorInvitationId = invitationRef.id;
    
    // Update landlord profile with invitation
    await db.collection('landlordProfiles').doc(testLandlord.uid).update({
      invitesSent: admin.firestore.FieldValue.arrayUnion(contractorInvitationId)
    });
    
    // Add notification for contractor
    await db.collection('notifications').add({
      userId: testContractor.uid,
      userRole: 'contractor',
      type: 'invitation',
      read: false,
      data: {
        invitationId: contractorInvitationId,
        landlordId: testLandlord.uid,
        message: invitationData.message
      },
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Contractor invitation created with ID: ${contractorInvitationId}`);
    
    return true;
  } catch (error) {
    console.error('Error testing addContractorToRolodex:', error);
    return false;
  }
}

/**
 * Test accepting a contractor invitation
 */
async function testAcceptContractorInvitation() {
  try {
    console.log('\n=== Testing acceptContractorInvitation ===');
    
    // Get the invitation
    const invitationSnapshot = await db.collection('invitations').doc(contractorInvitationId).get();
    
    if (!invitationSnapshot.exists) {
      console.error('Invitation not found');
      return false;
    }
    
    const invitation = invitationSnapshot.data();
    
    // Update invitation status
    await db.collection('invitations').doc(contractorInvitationId).update({
      status: 'accepted',
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      contractorId: testContractor.uid
    });
    
    // Add contractor to landlord's rolodex
    await db.collection('landlordProfiles').doc(invitation.landlordId).update({
      contractors: admin.firestore.FieldValue.arrayUnion(testContractor.uid)
    });
    
    // Add landlord to contractor's linked accounts
    await db.collection('users').doc(testContractor.uid).update({
      linkedTo: admin.firestore.FieldValue.arrayUnion(invitation.landlordId)
    });
    
    // Create or update contractor profile
    const contractorProfileRef = db.collection('contractorProfiles').doc(testContractor.uid);
    const contractorProfileSnapshot = await contractorProfileRef.get();
    
    if (contractorProfileSnapshot.exists) {
      await contractorProfileRef.update({
        landlords: admin.firestore.FieldValue.arrayUnion(invitation.landlordId)
      });
    } else {
      await contractorProfileRef.set({
        contractorId: testContractor.uid,
        userId: testContractor.uid,
        skills: ['plumbing', 'electrical', 'general'],
        landlords: [invitation.landlordId],
        availability: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    console.log(`Contractor invitation ${contractorInvitationId} accepted by contractor ${testContractor.uid}`);
    
    return true;
  } catch (error) {
    console.error('Error testing acceptContractorInvitation:', error);
    return false;
  }
}

/**
 * Test getting contractor rolodex
 */
async function testGetContractorRolodex() {
  try {
    console.log('\n=== Testing getContractorRolodex ===');
    
    // Get landlord profile
    const landlordProfileSnapshot = await db.collection('landlordProfiles')
      .doc(testLandlord.uid)
      .get();
    
    if (!landlordProfileSnapshot.exists) {
      console.error('Landlord profile not found');
      return false;
    }
    
    const landlordProfile = landlordProfileSnapshot.data();
    
    // Get contractor profiles
    const contractors = [];
    if (landlordProfile.contractors && landlordProfile.contractors.length > 0) {
      // Get contractor user data
      const contractorsSnapshot = await db.collection('users')
        .where(admin.firestore.FieldPath.documentId(), 'in', landlordProfile.contractors)
        .get();
      
      // Get additional profile data
      for (const doc of contractorsSnapshot.docs) {
        const contractorProfileSnapshot = await db.collection('contractorProfiles')
          .doc(doc.id)
          .get();
        
        let profileData = {};
        if (contractorProfileSnapshot.exists) {
          profileData = contractorProfileSnapshot.data();
        }
        
        contractors.push({
          id: doc.id,
          ...doc.data(),
          profile: profileData
        });
      }
    }
    
    console.log(`Found ${contractors.length} contractors in rolodex:`);
    contractors.forEach((contractor, index) => {
      console.log(`${index + 1}. ${contractor.name} (${contractor.email})`);
    });
    
    return true;
  } catch (error) {
    console.error('Error testing getContractorRolodex:', error);
    return false;
  }
}

/**
 * Test removing a contractor from rolodex
 */
async function testRemoveContractorFromRolodex() {
  try {
    console.log('\n=== Testing removeContractorFromRolodex ===');
    
    // Remove contractor from landlord's rolodex
    await db.collection('landlordProfiles').doc(testLandlord.uid).update({
      contractors: admin.firestore.FieldValue.arrayRemove(testContractor.uid)
    });
    
    // Remove landlord from contractor's linked accounts
    await db.collection('users').doc(testContractor.uid).update({
      linkedTo: admin.firestore.FieldValue.arrayRemove(testLandlord.uid)
    });
    
    // Update contractor profile
    await db.collection('contractorProfiles').doc(testContractor.uid).update({
      landlords: admin.firestore.FieldValue.arrayRemove(testLandlord.uid)
    });
    
    console.log(`Contractor ${testContractor.uid} removed from rolodex of landlord ${testLandlord.uid}`);
    
    return true;
  } catch (error) {
    console.error('Error testing removeContractorFromRolodex:', error);
    return false;
  }
}

/**
 * Cleanup test data
 */
async function cleanupTestData() {
  try {
    console.log('\n=== Cleaning up test data ===');
    
    // Delete invitations
    if (tenantInvitationId) {
      await db.collection('invitations').doc(tenantInvitationId).delete();
    }
    if (contractorInvitationId) {
      await db.collection('invitations').doc(contractorInvitationId).delete();
    }
    
    // Delete tenantProperties mapping
    const tenantPropertiesSnapshot = await db.collection('tenantProperties')
      .where('tenantId', '==', testTenant.uid)
      .where('propertyId', '==', propertyId)
      .get();
    
    tenantPropertiesSnapshot.forEach(async (doc) => {
      await doc.ref.delete();
    });
    
    // Delete notifications
    const notificationsSnapshot = await db.collection('notifications')
      .where('userId', '==', testContractor.uid)
      .get();
    
    notificationsSnapshot.forEach(async (doc) => {
      await doc.ref.delete();
    });
    
    // Delete profiles
    await db.collection('landlordProfiles').doc(testLandlord.uid).delete();
    await db.collection('tenantProfiles').doc(testTenant.uid).delete();
    await db.collection('contractorProfiles').doc(testContractor.uid).delete();
    
    // Delete property
    await db.collection('properties').doc(propertyId).delete();
    
    // Delete users
    await db.collection('users').doc(testLandlord.uid).delete();
    await db.collection('users').doc(testTenant.uid).delete();
    await db.collection('users').doc(testContractor.uid).delete();
    
    console.log('Test data cleanup complete');
    
    return true;
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    return false;
  }
}

/**
 * Run all tests in sequence
 */
async function runTests() {
  try {
    // Setup test data
    await setupTestData();
    
    // Run tenant invitation tests
    await testSendTenantInvitation();
    await testAcceptTenantInvitation();
    
    // Run contractor rolodex tests
    await testAddContractorToRolodex();
    await testAcceptContractorInvitation();
    await testGetContractorRolodex();
    await testRemoveContractorFromRolodex();
    
    // Cleanup test data
    if (process.env.KEEP_TEST_DATA !== 'true') {
      await cleanupTestData();
    } else {
      console.log('\nSkipping test data cleanup. Test data will remain in the database.');
    }
    
    console.log('\n=== All tests completed successfully! ===');
  } catch (error) {
    console.error('Test execution failed:', error);
  } finally {
    process.exit(0);
  }
}

// Run the tests
runTests(); 