#!/usr/bin/env node

/**
 * Fix missing tenant details using Firebase Tools
 * This approach uses the firebase-tools package for easier authentication
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function fixMissingTenantDetails() {
  console.log('🔧 Fixing Missing Tenant Details for tenant@propagenticai.com');
  console.log('================================================================\n');

  try {
    // Step 1: Find the tenant user ID
    console.log('1️⃣  Finding tenant user...');
    const tenantCmd = `firebase firestore:get users --where 'email==tenant@propagenticai.com' --format json`;
    const { stdout: tenantOutput } = await execAsync(tenantCmd);
    
    if (!tenantOutput.trim()) {
      console.log('❌ No tenant user found with email tenant@propagenticai.com');
      return;
    }
    
    const tenantData = JSON.parse(tenantOutput);
    if (tenantData.length === 0) {
      console.log('❌ No tenant user found with email tenant@propagenticai.com');
      return;
    }
    
    const tenantDoc = tenantData[0];
    const tenantUid = tenantDoc.id || tenantDoc._path?.segments?.[1];
    console.log(`✅ Found tenant: ${tenantUid} (${tenantDoc.data.email})`);

    // Step 2: Find the landlord user ID
    console.log('\n2️⃣  Finding landlord user...');
    const landlordCmd = `firebase firestore:get users --where 'email==owner@propagenticai.com' --format json`;
    const { stdout: landlordOutput } = await execAsync(landlordCmd);
    
    if (!landlordOutput.trim()) {
      console.log('❌ No landlord user found with email owner@propagenticai.com');
      return;
    }
    
    const landlordData = JSON.parse(landlordOutput);
    if (landlordData.length === 0) {
      console.log('❌ No landlord user found with email owner@propagenticai.com');
      return;
    }
    
    const landlordDoc = landlordData[0];
    const landlordUid = landlordDoc.id || landlordDoc._path?.segments?.[1];
    console.log(`✅ Found landlord: ${landlordUid}`);

    // Step 3: Get landlord profile
    console.log('\n3️⃣  Checking landlord profile...');
    const profileCmd = `firebase firestore:get landlordProfiles/${landlordUid} --format json`;
    const { stdout: profileOutput } = await execAsync(profileCmd);
    
    if (!profileOutput.trim()) {
      console.log('❌ No landlord profile found');
      return;
    }
    
    const profileData = JSON.parse(profileOutput);
    const acceptedTenants = profileData.data.acceptedTenants || [];
    const acceptedTenantDetails = profileData.data.acceptedTenantDetails || [];
    
    console.log(`Current state:`);
    console.log(`  Accepted Tenants: ${acceptedTenants.length}`);
    console.log(`  Accepted Tenant Details: ${acceptedTenantDetails.length}`);

    // Check if tenant is in acceptedTenants but missing from acceptedTenantDetails
    const tenantInAccepted = acceptedTenants.includes(tenantUid);
    const tenantInDetails = acceptedTenantDetails.some(record => record.tenantId === tenantUid);
    
    console.log(`\n  Tenant in acceptedTenants: ${tenantInAccepted ? '✅' : '❌'}`);
    console.log(`  Tenant in acceptedTenantDetails: ${tenantInDetails ? '✅' : '❌'}`);

    if (tenantInDetails) {
      console.log('\n✅ Tenant already has details record - no fix needed!');
      return;
    }

    if (!tenantInAccepted) {
      console.log('\n❌ Tenant not in acceptedTenants array - this needs investigation');
      return;
    }

    // Step 4: Find the invite for this tenant
    console.log('\n4️⃣  Looking for invite data...');
    const inviteCmd = `firebase firestore:get invites --where 'tenantEmail==tenant@propagenticai.com' --format json`;
    
    let inviteData = null;
    let inviteId = null;
    
    try {
      const { stdout: inviteOutput } = await execAsync(inviteCmd);
      if (inviteOutput.trim()) {
        const invites = JSON.parse(inviteOutput);
        if (invites.length > 0) {
          const inviteDoc = invites[0];
          inviteData = inviteDoc.data;
          inviteId = inviteDoc.id || inviteDoc._path?.segments?.[1];
          console.log(`✅ Found invite: ${inviteId}`);
          console.log(`   Status: ${inviteData.status}`);
          console.log(`   Short Code: ${inviteData.shortCode || 'N/A'}`);
          console.log(`   Property ID: ${inviteData.propertyId}`);
        }
      }
    } catch (error) {
      console.log('⚠️  No invite found or error accessing invites');
    }

    // Step 5: Prepare the fix
    console.log('\n5️⃣  Preparing the fix...');
    const acceptedTenantRecord = {
      tenantId: tenantUid,
      propertyId: tenantDoc.data.propertyId || inviteData?.propertyId || '',
      inviteId: inviteId || '',
      inviteCode: inviteData?.shortCode || '',
      tenantEmail: 'tenant@propagenticai.com',
      unitNumber: inviteData?.unitNumber || null,
      acceptedAt: new Date().toISOString(),
      inviteType: 'manual-fix'
    };

    console.log('🔧 Will add this accepted tenant record:');
    console.log(JSON.stringify(acceptedTenantRecord, null, 2));
    
    console.log('\n6️⃣  Applying the fix...');
    console.log('⚠️  Note: This would require a more complex update operation.');
    console.log('💡 Recommendation: Use the Cloud Functions deployment to fix this automatically.');
    console.log('   The acceptTenantInvite function should handle this properly when deployed.');
    
    console.log('\n🎯 Next Steps:');
    console.log('1. Redeploy the Cloud Functions to ensure latest code is live');
    console.log('2. Test the tenant invite acceptance flow');
    console.log('3. Or manually add the tenant details via Firebase Console');
    
  } catch (error) {
    console.error('❌ Error during fix attempt:', error.message);
    console.log('\n💡 Try using Firebase Console instead:');
    console.log('1. Go to Firestore in Firebase Console');
    console.log('2. Navigate to landlordProfiles collection');
    console.log('3. Find the landlord document');
    console.log('4. Add the missing tenant to acceptedTenantDetails array');
  }
}

fixMissingTenantDetails()
  .then(() => {
    console.log('\n✅ Analysis complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }); 