#!/usr/bin/env node

/**
 * Simple script to add a test landlord profile using Firebase CLI
 * Run with: firebase use propgentic-d1af3 && node scripts/add-test-landlord-via-firebase.js
 */

const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

/**
 * Generate test landlord profile data
 */
function generateTestLandlordData() {
  const timestamp = new Date().toISOString();
  const testId = `test-landlord-${Date.now()}`;
  
  return {
    uid: testId,
    landlordId: testId,
    userId: testId,
    displayName: 'Test Landlord McProperty',
    email: `${testId}@propagentic-test.com`,
    phoneNumber: '+1 (555) 123-4567',
    businessName: 'PropAgentic Test Properties LLC',
    acceptedTenants: [],
    properties: ['test-property-1', 'test-property-2'],
    invitesSent: ['invite-123', 'invite-456'],
    contractors: ['contractor-1', 'contractor-2'],
    acceptedTenantDetails: [
      {
        tenantId: 'tenant-001',
        propertyId: 'test-property-1',
        inviteId: 'invite-123',
        inviteCode: 'ABC12345',
        unitNumber: 'Unit 101',
        acceptedAt: timestamp,
        status: 'active'
      }
    ],
    totalInvitesSent: 5,
    totalInvitesAccepted: 1,
    inviteAcceptanceRate: 20,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

/**
 * Create the profile using Firebase CLI
 */
async function createTestLandlordProfile() {
  try {
    console.log('🏠 Creating test landlord profile via Firebase CLI...');
    
    const landlordData = generateTestLandlordData();
    
    // Write data to a temporary file
    const fs = require('fs');
    const tempFile = '/tmp/test-landlord-profile.json';
    
    fs.writeFileSync(tempFile, JSON.stringify(landlordData, null, 2));
    
    console.log(`📄 Generated test data for: ${landlordData.displayName}`);
    console.log(`📧 Email: ${landlordData.email}`);
    console.log(`🆔 ID: ${landlordData.uid}`);
    
    // Use Firebase CLI to add the document
    const command = `firebase firestore:write "landlordProfiles/${landlordData.uid}" ${tempFile}`;
    
    console.log('🚀 Executing Firebase command...');
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.error('❌ Error:', stderr);
      return null;
    }
    
    console.log('✅ Success:', stdout);
    
    // Clean up temp file
    fs.unlinkSync(tempFile);
    
    console.log('🎉 Test landlord profile created successfully!');
    console.log('💡 You can view it in Firebase Console:');
    console.log(`   Firestore > landlordProfiles > ${landlordData.uid}`);
    
    return landlordData.uid;
    
  } catch (error) {
    console.error('❌ Error creating test landlord profile:', error.message);
    return null;
  }
}

/**
 * Verify the profile was created
 */
async function verifyProfile(landlordId) {
  try {
    console.log('\n🔍 Verifying profile creation...');
    
    const command = `firebase firestore:read "landlordProfiles/${landlordId}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr) {
      console.error('❌ Verification failed:', stderr);
      return false;
    }
    
    const data = JSON.parse(stdout);
    console.log('✅ Profile verified! Data preview:');
    console.log(`  - UID: ${data.uid}`);
    console.log(`  - Display Name: ${data.displayName}`);
    console.log(`  - Email: ${data.email}`);
    console.log(`  - Business: ${data.businessName}`);
    console.log(`  - Properties: ${data.properties.length}`);
    console.log(`  - Accepted Tenants: ${data.acceptedTenants.length}`);
    console.log(`  - Invites Sent: ${data.invitesSent.length}`);
    console.log(`  - Total Invites Sent: ${data.totalInvitesSent}`);
    console.log(`  - Total Invites Accepted: ${data.totalInvitesAccepted}`);
    console.log(`  - Acceptance Rate: ${data.inviteAcceptanceRate}%`);
    
    return true;
    
  } catch (error) {
    console.error('❌ Error verifying profile:', error.message);
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    console.log('🚀 Starting landlord profile creation test...\n');
    
    // Set the Firebase project
    console.log('🔧 Setting Firebase project...');
    await execAsync('firebase use propagentic');
    console.log('✅ Firebase project set to propagentic');
    
    // Create the profile
    const landlordId = await createTestLandlordProfile();
    
    if (!landlordId) {
      console.error('💥 Failed to create landlord profile');
      process.exit(1);
    }
    
    // Wait a moment for the write to propagate
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Verify the profile
    const verified = await verifyProfile(landlordId);
    
    if (verified) {
      console.log('\n🎉 Test completed successfully!');
      console.log('📊 Next steps:');
      console.log('1. Check the Firebase Console to see the profile');
      console.log('2. Test the landlord dashboard to see if it displays correctly');
      console.log('3. Test the acceptTenantInvite function to verify it updates the profile');
    } else {
      console.error('\n💥 Test failed - profile could not be verified');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { 
  generateTestLandlordData, 
  createTestLandlordProfile, 
  verifyProfile 
}; 