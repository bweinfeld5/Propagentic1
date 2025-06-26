const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  const serviceAccount = require(path.join(__dirname, '../functions/src/config/serviceAccountKey.json'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: 'https://propgentic-default-rtdb.firebaseio.com/'
  });
}

const db = admin.firestore();

/**
 * Dry Run Migration Preview
 * Shows what would be migrated without making any changes
 */
async function previewMigration() {
  console.log('🔍 MIGRATION DRY RUN - NO CHANGES WILL BE MADE');
  console.log('================================================\n');
  
  try {
    // Step 1: Get all landlord users
    console.log('📋 Analyzing landlord users in users collection...');
    const usersSnapshot = await db.collection('users')
      .where('userType', '==', 'landlord')
      .get();
    
    console.log(`Found ${usersSnapshot.size} landlord users to analyze\n`);
    
    if (usersSnapshot.empty) {
      console.log('ℹ️ No landlord users found. Nothing to migrate.');
      return;
    }
    
    // Step 2: Check existing landlord profiles
    console.log('🔍 Checking existing landlordProfiles collection...');
    const existingProfilesSnapshot = await db.collection('landlordProfiles').get();
    console.log(`Found ${existingProfilesSnapshot.size} existing landlord profiles\n`);
    
    let wouldMigrate = 0;
    let wouldSkip = 0;
    let totalProperties = 0;
    let totalInvites = 0;
    let totalTenants = 0;
    
    console.log('📊 ANALYSIS RESULTS:');
    console.log('==================\n');
    
    // Step 3: Analyze each landlord
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const landlordId = userDoc.id;
      
      // Check if profile already exists
      const existingProfileDoc = await db.collection('landlordProfiles').doc(landlordId).get();
      
      if (existingProfileDoc.exists()) {
        console.log(`⏭️  SKIP: ${userData.name || userData.email || landlordId} (profile exists)`);
        wouldSkip++;
        continue;
      }
      
      wouldMigrate++;
      console.log(`\n📤 WOULD MIGRATE: ${userData.name || userData.email || landlordId}`);
      
      // Analyze properties
      const propertiesSnapshot = await db.collection('properties')
        .where('landlordId', '==', landlordId)
        .get();
      
      const propertyCount = propertiesSnapshot.docs.length;
      totalProperties += propertyCount;
      console.log(`   🏠 Properties: ${propertyCount}`);
      
      // Analyze invites
      const invitesSnapshot = await db.collection('invites')
        .where('landlordId', '==', landlordId)
        .get();
      
      const inviteCount = invitesSnapshot.docs.length;
      totalInvites += inviteCount;
      console.log(`   📧 Invites sent: ${inviteCount}`);
      
      // Analyze accepted tenants
      let acceptedTenantCount = 0;
      for (const propertyDoc of propertiesSnapshot.docs) {
        const propertyId = propertyDoc.id;
        const tenantProfilesSnapshot = await db.collection('tenantProfiles')
          .where('properties', 'array-contains', propertyId)
          .get();
        acceptedTenantCount += tenantProfilesSnapshot.size;
      }
      
      totalTenants += acceptedTenantCount;
      console.log(`   👥 Accepted tenants: ${acceptedTenantCount}`);
      
      // Calculate success rate
      const successRate = inviteCount > 0 ? (acceptedTenantCount / inviteCount) * 100 : 0;
      console.log(`   📈 Success rate: ${Math.round(successRate)}%`);
      
      // Show what profile would look like
      console.log(`   📋 Would create landlordProfile with:`);
      console.log(`      - Email: ${userData.email}`);
      console.log(`      - Business: ${userData.businessName || 'Not specified'}`);
      console.log(`      - Phone: ${userData.phoneNumber || 'Not specified'}`);
      console.log(`      - Arrays: acceptedTenants[${acceptedTenantCount}], properties[${propertyCount}], invitesSent[${inviteCount}]`);
    }
    
    console.log('\n🎯 MIGRATION SUMMARY:');
    console.log('====================');
    console.log(`📊 Total landlords found: ${usersSnapshot.size}`);
    console.log(`✅ Would migrate: ${wouldMigrate}`);
    console.log(`⏭️  Would skip (already exist): ${wouldSkip}`);
    console.log(`🏠 Total properties: ${totalProperties}`);
    console.log(`📧 Total invites: ${totalInvites}`);
    console.log(`👥 Total tenants: ${totalTenants}`);
    
    const overallSuccessRate = totalInvites > 0 ? (totalTenants / totalInvites) * 100 : 0;
    console.log(`📈 Overall success rate: ${Math.round(overallSuccessRate)}%`);
    
    console.log('\n💡 RECOMMENDATIONS:');
    console.log('===================');
    
    if (wouldMigrate > 0) {
      console.log(`✅ Migration recommended - ${wouldMigrate} profiles need to be created`);
      console.log(`📋 Command to run migration: node scripts/migrate-landlord-profiles.js`);
      console.log(`💾 Command to backup first: node scripts/backup-and-rollback-landlord-profiles.js backup`);
    } else {
      console.log(`ℹ️  No migration needed - all landlords already have profiles`);
    }
    
    if (wouldSkip > 0) {
      console.log(`ℹ️  ${wouldSkip} landlords already have profiles and will be skipped`);
    }
    
  } catch (error) {
    console.error('💥 Analysis failed:', error);
    throw error;
  }
}

/**
 * Check collection sizes
 */
async function checkCollectionSizes() {
  console.log('\n📊 CURRENT COLLECTION SIZES:');
  console.log('============================');
  
  try {
    const collections = [
      'users',
      'landlordProfiles', 
      'tenantProfiles',
      'contractorProfiles',
      'properties',
      'invites'
    ];
    
    for (const collectionName of collections) {
      const snapshot = await db.collection(collectionName).get();
      console.log(`${collectionName.padEnd(20)} : ${snapshot.size} documents`);
    }
    
  } catch (error) {
    console.error('Error checking collection sizes:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await checkCollectionSizes();
    await previewMigration();
    
    console.log('\n✅ Dry run completed successfully!');
    console.log('💡 Review the analysis above before running the actual migration.');
    
  } catch (error) {
    console.error('💥 Dry run failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log('🎯 Dry run finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Dry run failed:', error);
      process.exit(1);
    });
}

module.exports = { previewMigration, checkCollectionSizes }; 