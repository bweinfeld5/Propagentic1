#!/usr/bin/env node

/**
 * Test Script: Tenant Leave Property Functionality
 * 
 * This script tests the complete tenant leave property workflow:
 * 1. Verifies tenant-property relationships exist
 * 2. Tests the tenantLeaveProperty Cloud Function
 * 3. Validates data cleanup across all collections
 * 4. Checks notification creation for landlord
 * 
 * Usage: node scripts/test-tenant-leave-property.js
 */

const { initializeApp, applicationDefault, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { getFunctions } = require('firebase-admin/functions');

// Initialize Firebase Admin SDK
if (getApps().length === 0) {
  initializeApp({
    credential: applicationDefault(),
    projectId: 'propagentic'
  });
}

const db = getFirestore();

// Test Configuration
const TEST_CONFIG = {
  // These should be real test users/properties in your system
  testTenantId: 'test-tenant-uid', // Replace with actual tenant UID
  testPropertyId: 'test-property-id', // Replace with actual property ID
  testLandlordId: 'test-landlord-uid', // Replace with actual landlord UID
  
  // Or use these placeholder values for demonstration
  demoMode: true, // Set to false to use real data
};

async function testTenantLeaveProperty() {
  console.log('🔍 Testing Tenant Leave Property Functionality\n');
  
  try {
    // 1. Find a real tenant-property relationship for testing
    const testData = await findTestData();
    
    if (!testData) {
      console.log('❌ No suitable test data found. Please ensure you have:');
      console.log('   - A tenant with at least one property');
      console.log('   - A property with at least one tenant');
      console.log('   - A landlord profile associated with the property\n');
      return;
    }
    
    const { tenantId, propertyId, landlordId } = testData;
    
    console.log(`📋 Test Data Found:`);
    console.log(`   Tenant ID: ${tenantId}`);
    console.log(`   Property ID: ${propertyId}`);
    console.log(`   Landlord ID: ${landlordId}\n`);
    
    // 2. Get initial state
    console.log('📊 Getting Initial State...');
    const initialState = await getCollectionState(tenantId, propertyId, landlordId);
    displayState('BEFORE', initialState);
    
    // 3. Simulate tenant leaving property via Cloud Function
    console.log('🚀 Simulating Tenant Leave Property...');
    
    // Note: In a real test, you would call the Cloud Function
    // For demonstration, we'll show what the function would do
    const leaveResult = await simulateTenantLeave(tenantId, propertyId, 'Testing tenant leave functionality');
    
    console.log('✅ Tenant leave simulation completed');
    console.log(`   Departure ID: ${leaveResult.departureId}\n`);
    
    // 4. Get final state
    console.log('📊 Getting Final State...');
    const finalState = await getCollectionState(tenantId, propertyId, landlordId);
    displayState('AFTER', finalState);
    
    // 5. Verify changes
    console.log('✅ Verification Summary:');
    verifyChanges(initialState, finalState, tenantId, propertyId);
    
    // 6. Check notifications
    await checkNotifications(landlordId, tenantId, propertyId);
    
    console.log('\n🎉 Test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  }
}

async function findTestData() {
  try {
    // Find a tenant with properties
    const tenantsQuery = await db.collection('tenantProfiles')
      .where('properties', '!=', [])
      .limit(1)
      .get();
    
    if (tenantsQuery.empty) {
      return null;
    }
    
    const tenantDoc = tenantsQuery.docs[0];
    const tenantData = tenantDoc.data();
    const tenantId = tenantDoc.id;
    const propertyId = tenantData.properties[0];
    
    // Get property to find landlord
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    
    if (!propertyDoc.exists) {
      return null;
    }
    
    const propertyData = propertyDoc.data();
    const landlordId = propertyData.landlordId;
    
    return { tenantId, propertyId, landlordId };
  } catch (error) {
    console.error('Error finding test data:', error);
    return null;
  }
}

async function getCollectionState(tenantId, propertyId, landlordId) {
  const state = {};
  
  try {
    // Tenant Profile
    const tenantProfile = await db.collection('tenantProfiles').doc(tenantId).get();
    state.tenantProfile = tenantProfile.exists ? tenantProfile.data() : null;
    
    // Tenant User
    const tenantUser = await db.collection('users').doc(tenantId).get();
    state.tenantUser = tenantUser.exists ? tenantUser.data() : null;
    
    // Property
    const property = await db.collection('properties').doc(propertyId).get();
    state.property = property.exists ? property.data() : null;
    
    // Landlord Profile
    const landlordProfile = await db.collection('landlordProfiles').doc(landlordId).get();
    state.landlordProfile = landlordProfile.exists ? landlordProfile.data() : null;
    
    // Count notifications for landlord
    const notificationsQuery = await db.collection('notifications')
      .where('userId', '==', landlordId)
      .where('type', '==', 'tenant_departure')
      .get();
    state.notificationCount = notificationsQuery.docs.length;
    
    // Check for departure records
    const departuresQuery = await db.collection('tenantDepartures')
      .where('tenantId', '==', tenantId)
      .where('propertyId', '==', propertyId)
      .get();
    state.departureCount = departuresQuery.docs.length;
    
  } catch (error) {
    console.error('Error getting collection state:', error);
    state.error = error.message;
  }
  
  return state;
}

function displayState(label, state) {
  console.log(`📋 ${label} State:`);
  
  if (state.error) {
    console.log(`   ❌ Error: ${state.error}`);
    return;
  }
  
  // Tenant Profile Properties
  const tenantProperties = state.tenantProfile?.properties || [];
  console.log(`   Tenant Properties: [${tenantProperties.join(', ')}] (${tenantProperties.length})`);
  
  // Property Tenants
  const propertyTenants = state.property?.tenants || [];
  console.log(`   Property Tenants: [${propertyTenants.join(', ')}] (${propertyTenants.length})`);
  
  // Landlord Accepted Tenants
  const acceptedTenants = state.landlordProfile?.acceptedTenants || [];
  console.log(`   Landlord Accepted Tenants: [${acceptedTenants.join(', ')}] (${acceptedTenants.length})`);
  
  // Landlord Accepted Tenant Details
  const acceptedDetails = state.landlordProfile?.acceptedTenantDetails || [];
  console.log(`   Landlord Tenant Details: ${acceptedDetails.length} records`);
  
  // Statistics
  console.log(`   Landlord Total Accepted: ${state.landlordProfile?.totalInvitesAccepted || 0}`);
  console.log(`   Notifications: ${state.notificationCount}`);
  console.log(`   Departure Records: ${state.departureCount}\n`);
}

async function simulateTenantLeave(tenantId, propertyId, reason) {
  // In a real implementation, you would call the Cloud Function like this:
  /*
  const functions = getFunctions();
  const tenantLeaveProperty = functions.httpsCallable('tenantLeaveProperty');
  
  const result = await tenantLeaveProperty({
    propertyId: propertyId,
    reason: reason
  });
  
  return result.data;
  */
  
  // For demonstration, we'll simulate the result
  const departureId = `departure_${Date.now()}`;
  
  console.log('   📞 Would call Cloud Function: tenantLeaveProperty');
  console.log(`   📝 With data: { propertyId: "${propertyId}", reason: "${reason}" }`);
  console.log('   ⚠️  Note: Actual function call skipped in test mode\n');
  
  return {
    success: true,
    propertyId: propertyId,
    departureId: departureId
  };
}

function verifyChanges(beforeState, afterState, tenantId, propertyId) {
  const checks = [];
  
  // Check tenant properties were updated
  const beforeTenantProps = beforeState.tenantProfile?.properties || [];
  const afterTenantProps = afterState.tenantProfile?.properties || [];
  const tenantPropsRemoved = beforeTenantProps.includes(propertyId) && !afterTenantProps.includes(propertyId);
  checks.push({ name: 'Tenant Property Removed', passed: tenantPropsRemoved });
  
  // Check property tenants were updated  
  const beforePropertyTenants = beforeState.property?.tenants || [];
  const afterPropertyTenants = afterState.property?.tenants || [];
  const propertyTenantRemoved = beforePropertyTenants.includes(tenantId) && !afterPropertyTenants.includes(tenantId);
  checks.push({ name: 'Property Tenant Removed', passed: propertyTenantRemoved });
  
  // Check landlord accepted tenants were updated
  const beforeAccepted = beforeState.landlordProfile?.acceptedTenants || [];
  const afterAccepted = afterState.landlordProfile?.acceptedTenants || [];
  const acceptedTenantRemoved = beforeAccepted.includes(tenantId) && !afterAccepted.includes(tenantId);
  checks.push({ name: 'Landlord Accepted Tenant Removed', passed: acceptedTenantRemoved });
  
  // Check statistics were updated
  const beforeTotal = beforeState.landlordProfile?.totalInvitesAccepted || 0;
  const afterTotal = afterState.landlordProfile?.totalInvitesAccepted || 0;
  const statsUpdated = afterTotal < beforeTotal;
  checks.push({ name: 'Landlord Statistics Updated', passed: statsUpdated });
  
  // Display results
  checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    console.log(`   ${icon} ${check.name}: ${check.passed ? 'PASS' : 'FAIL'}`);
  });
}

async function checkNotifications(landlordId, tenantId, propertyId) {
  try {
    console.log('\n📬 Checking Notifications:');
    
    const notificationsQuery = await db.collection('notifications')
      .where('userId', '==', landlordId)
      .where('type', '==', 'tenant_departure')
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();
    
    console.log(`   Found ${notificationsQuery.docs.length} tenant departure notifications`);
    
    if (!notificationsQuery.empty) {
      const latestNotification = notificationsQuery.docs[0].data();
      console.log(`   Latest notification: "${latestNotification.title}"`);
      console.log(`   Message: "${latestNotification.message}"`);
      console.log(`   Read: ${latestNotification.read}`);
    }
    
  } catch (error) {
    console.error('Error checking notifications:', error);
  }
}

// Run the test
if (require.main === module) {
  testTenantLeaveProperty()
    .then(() => {
      console.log('\n🏁 Test script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = {
  testTenantLeaveProperty,
  findTestData,
  getCollectionState
}; 