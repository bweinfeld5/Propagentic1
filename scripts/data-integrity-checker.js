#!/usr/bin/env node

/**
 * Data Integrity Checker for PropAgentic
 * Checks for mismatches between acceptedTenants and acceptedTenantDetails
 * Runs periodically to catch data synchronization issues
 */

const admin = require('firebase-admin');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'propagentic'
  });
}

const db = admin.firestore();

async function checkDataIntegrity() {
  console.log('🔍 PropAgentic Data Integrity Checker');
  console.log('====================================\n');

  try {
    // Get all landlord profiles
    const landlordProfilesSnapshot = await db.collection('landlordProfiles').get();
    
    if (landlordProfilesSnapshot.empty) {
      console.log('✅ No landlord profiles found - nothing to check');
      return { healthy: true, issues: [] };
    }

    const issues = [];
    let totalProfiles = 0;
    let healthyProfiles = 0;

    console.log(`📊 Checking ${landlordProfilesSnapshot.docs.length} landlord profiles...\n`);

    for (const doc of landlordProfilesSnapshot.docs) {
      totalProfiles++;
      const landlordId = doc.id;
      const data = doc.data();
      
      const acceptedTenants = data.acceptedTenants || [];
      const acceptedTenantDetails = data.acceptedTenantDetails || [];
      
      // Check for array length mismatch
      if (acceptedTenants.length !== acceptedTenantDetails.length) {
        const issue = {
          type: 'ARRAY_LENGTH_MISMATCH',
          landlordId,
          landlordEmail: data.email,
          acceptedTenantsCount: acceptedTenants.length,
          acceptedTenantDetailsCount: acceptedTenantDetails.length,
          missingFromDetails: acceptedTenants.filter(id => 
            !acceptedTenantDetails.some(record => record.tenantId === id)
          ),
          extraInDetails: acceptedTenantDetails.filter(record => 
            !acceptedTenants.includes(record.tenantId)
          )
        };
        
        issues.push(issue);
        console.log(`❌ MISMATCH FOUND:`);
        console.log(`   Landlord: ${landlordId} (${data.email || 'No email'})`);
        console.log(`   acceptedTenants: ${acceptedTenants.length} entries`);
        console.log(`   acceptedTenantDetails: ${acceptedTenantDetails.length} entries`);
        console.log(`   Missing from details: ${issue.missingFromDetails.length}`);
        console.log(`   Extra in details: ${issue.extraInDetails.length}\n`);
      } else {
        healthyProfiles++;
        console.log(`✅ ${landlordId}: Arrays synchronized (${acceptedTenants.length} entries)`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('📋 INTEGRITY CHECK SUMMARY');
    console.log('='.repeat(50));
    console.log(`Total Profiles Checked: ${totalProfiles}`);
    console.log(`Healthy Profiles: ${healthyProfiles}`);
    console.log(`Profiles with Issues: ${issues.length}`);
    console.log(`Overall Health: ${issues.length === 0 ? '✅ HEALTHY' : '❌ ISSUES FOUND'}`);

    if (issues.length > 0) {
      console.log('\n🔧 RECOMMENDED ACTIONS:');
      console.log('1. Review the missing tenant details above');
      console.log('2. Check if recent invite acceptances failed to update properly');
      console.log('3. Redeploy Cloud Functions to ensure latest code is live');
      console.log('4. Consider running the repair script');
    }

    return {
      healthy: issues.length === 0,
      totalProfiles,
      healthyProfiles,
      issues
    };

  } catch (error) {
    console.error('❌ Error during integrity check:', error);
    return {
      healthy: false,
      error: error.message
    };
  }
}

// Export for use by other scripts
module.exports = { checkDataIntegrity };

// Run if called directly
if (require.main === module) {
  checkDataIntegrity()
    .then((result) => {
      if (result.healthy) {
        console.log('\n🎉 Data integrity check passed!');
        process.exit(0);
      } else {
        console.log('\n⚠️  Data integrity issues found. See details above.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n💥 Integrity check failed:', error);
      process.exit(1);
    });
} 