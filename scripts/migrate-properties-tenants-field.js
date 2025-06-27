#!/usr/bin/env node

/**
 * Migration Script: Add tenants field to properties collection
 * 
 * This script populates the new tenants[] field in properties collection
 * by analyzing existing landlordProfiles.acceptedTenantDetails data.
 * 
 * Usage: node scripts/migrate-properties-tenants-field.js [--dry-run]
 */

const { initializeApp, applicationDefault, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin
console.log('🔧 Initializing Firebase Admin...');
let db;

// Try to use service account file first, then fall back to application default
const serviceAccountPath = path.join(__dirname, '..', 'firebase-service-account.json');

try {
  let app;
  
  if (fs.existsSync(serviceAccountPath)) {
    console.log('   📄 Using service account file...');
    const serviceAccount = require(serviceAccountPath);
    app = initializeApp({
      credential: cert(serviceAccount),
      projectId: 'propagentic'
    });
  } else {
    console.log('   🔑 Trying application default credentials...');
    app = initializeApp({
      credential: applicationDefault(),
      projectId: 'propagentic'
    });
  }
  
  db = getFirestore(app);
  console.log('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin:', error.message);
  console.log('\n💡 To fix this, you have two options:');
  console.log('');
  console.log('Option 1 (Recommended): Download Service Account');
  console.log('   1. Go to: https://console.firebase.google.com/project/propagentic/settings/serviceaccounts/adminsdk');
  console.log('   2. Click "Generate new private key"');
  console.log('   3. Save the file as "firebase-service-account.json" in your project root');
  console.log('   4. Run this script again');
  console.log('');
  console.log('Option 2: Set up Application Default Credentials');
  console.log('   1. Install Google Cloud SDK: https://cloud.google.com/sdk/docs/install');
  console.log('   2. Run: gcloud auth application-default login');
  console.log('   3. Run this script again');
  process.exit(1);
}

// Command line arguments
const isDryRun = process.argv.includes('--dry-run');

/**
 * Main migration function
 */
async function migratePropertiesTenantsField() {
  try {
    console.log('🔄 Starting properties tenants field migration...');
    console.log(`📋 Mode: ${isDryRun ? 'DRY RUN (no changes will be made)' : 'LIVE MIGRATION'}`);
    console.log('='.repeat(60));
    
    // Statistics tracking
    let stats = {
      landlordProfilesProcessed: 0,
      propertiesFound: 0,
      propertiesUpdated: 0,
      propertiesSkipped: 0,
      tenantsProcessed: 0,
      errors: []
    };

    // Get all landlord profiles with accepted tenants
    console.log('📊 Fetching landlord profiles...');
    const landlordProfilesSnapshot = await db.collection('landlordProfiles').get();
    console.log(`📊 Found ${landlordProfilesSnapshot.docs.length} landlord profiles`);

    // Process each landlord profile
    for (const landlordDoc of landlordProfilesSnapshot.docs) {
      const landlordId = landlordDoc.id;
      const landlordData = landlordDoc.data();
      const acceptedTenantDetails = landlordData.acceptedTenantDetails || [];
      
      stats.landlordProfilesProcessed++;
      console.log(`\n👤 Processing landlord: ${landlordId} (${acceptedTenantDetails.length} tenants)`);
      
      if (acceptedTenantDetails.length === 0) {
        console.log('   ⏭️  No accepted tenants, skipping...');
        continue;
      }
      
      // Group tenants by property
      const propertyTenants = {};
      
      for (const tenantDetail of acceptedTenantDetails) {
        const propertyId = tenantDetail.propertyId;
        const tenantId = tenantDetail.tenantId;
        
        if (!propertyId || !tenantId) {
          console.log(`   ⚠️  Invalid tenant detail: missing propertyId or tenantId`);
          stats.errors.push(`Invalid tenant detail for landlord ${landlordId}`);
          continue;
        }
        
        if (!propertyTenants[propertyId]) {
          propertyTenants[propertyId] = [];
        }
        
        if (!propertyTenants[propertyId].includes(tenantId)) {
          propertyTenants[propertyId].push(tenantId);
          stats.tenantsProcessed++;
        }
      }
      
      console.log(`   🏠 Found ${Object.keys(propertyTenants).length} properties with tenants`);
      
      // Update each property with its tenants
      for (const [propertyId, tenantIds] of Object.entries(propertyTenants)) {
        try {
          const propertyRef = db.collection('properties').doc(propertyId);
          const propertyDoc = await propertyRef.get();
          
          stats.propertiesFound++;
          
          if (!propertyDoc.exists) {
            console.log(`   ❌ Property ${propertyId} not found, skipping...`);
            stats.propertiesSkipped++;
            stats.errors.push(`Property ${propertyId} not found`);
            continue;
          }
          
          const propertyData = propertyDoc.data();
          const existingTenants = propertyData.tenants || [];
          
          // Check if tenants field already exists and has data
          if (existingTenants.length > 0) {
            console.log(`   ⏭️  Property ${propertyId} already has ${existingTenants.length} tenants, skipping...`);
            stats.propertiesSkipped++;
            continue;
          }
          
          if (isDryRun) {
            console.log(`   🔍 [DRY RUN] Would update property ${propertyId} with ${tenantIds.length} tenants: [${tenantIds.join(', ')}]`);
          } else {
                         await propertyRef.update({
               tenants: tenantIds,
               updatedAt: FieldValue.serverTimestamp()
             });
            
            console.log(`   ✅ Updated property ${propertyId} with ${tenantIds.length} tenants: [${tenantIds.join(', ')}]`);
          }
          
          stats.propertiesUpdated++;
          
        } catch (error) {
          console.error(`   ❌ Error updating property ${propertyId}:`, error.message);
          stats.errors.push(`Error updating property ${propertyId}: ${error.message}`);
        }
      }
    }
    
    // Display final statistics
    console.log('\n' + '='.repeat(60));
    console.log('🎉 Migration completed!');
    console.log('📊 Final Statistics:');
    console.log(`   Landlord profiles processed: ${stats.landlordProfilesProcessed}`);
    console.log(`   Properties found: ${stats.propertiesFound}`);
    console.log(`   Properties updated: ${stats.propertiesUpdated}`);
    console.log(`   Properties skipped: ${stats.propertiesSkipped}`);
    console.log(`   Tenants processed: ${stats.tenantsProcessed}`);
    console.log(`   Errors encountered: ${stats.errors.length}`);
    
    if (stats.errors.length > 0) {
      console.log('\n❌ Errors encountered:');
      stats.errors.forEach((error, index) => {
        console.log(`   ${index + 1}. ${error}`);
      });
    }
    
    if (isDryRun) {
      console.log('\n💡 This was a dry run. No changes were made to the database.');
      console.log('💡 Run without --dry-run flag to apply the changes.');
    } else {
      console.log('\n✅ Migration applied successfully to the database.');
    }
    
    // Success rate
    const successRate = stats.propertiesFound > 0 ? 
      ((stats.propertiesUpdated / stats.propertiesFound) * 100).toFixed(1) : 0;
    console.log(`📈 Success rate: ${successRate}% (${stats.propertiesUpdated}/${stats.propertiesFound})`);
    
    return stats;
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  }
}

/**
 * Validation function to check current state
 */
async function validateCurrentState() {
  try {
    console.log('🔍 Validating current database state...');
    
    // Check how many properties already have tenants field
    const propertiesSnapshot = await db.collection('properties').get();
    let propertiesWithTenantsField = 0;
    let propertiesWithTenantsData = 0;
    
    for (const propertyDoc of propertiesSnapshot.docs) {
      const data = propertyDoc.data();
      if (data.hasOwnProperty('tenants')) {
        propertiesWithTenantsField++;
        if (data.tenants && data.tenants.length > 0) {
          propertiesWithTenantsData++;
        }
      }
    }
    
    console.log(`📊 Properties total: ${propertiesSnapshot.docs.length}`);
    console.log(`📊 Properties with tenants field: ${propertiesWithTenantsField}`);
    console.log(`📊 Properties with tenant data: ${propertiesWithTenantsData}`);
    
    // Check landlord profiles for potential data
    const landlordProfilesSnapshot = await db.collection('landlordProfiles').get();
    let totalTenantDetails = 0;
    
    for (const landlordDoc of landlordProfilesSnapshot.docs) {
      const data = landlordDoc.data();
      if (data.acceptedTenantDetails) {
        totalTenantDetails += data.acceptedTenantDetails.length;
      }
    }
    
    console.log(`📊 Total tenant details in landlord profiles: ${totalTenantDetails}`);
    
    if (totalTenantDetails === 0) {
      console.log('⚠️  No tenant data found in landlord profiles. Migration may not be needed.');
    } else if (propertiesWithTenantsData >= totalTenantDetails * 0.9) {
      console.log('✅ Most properties already have tenant data. Migration may already be complete.');
    } else {
      console.log('🚀 Migration is recommended to populate missing tenant data.');
    }
    
  } catch (error) {
    console.error('❌ Error validating current state:', error);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🔥 PropAgentic Properties Tenants Field Migration');
  console.log('='.repeat(60));
  
  try {
    // Validate current state first
    await validateCurrentState();
    
    console.log('\n' + '='.repeat(60));
    
    // Run migration
    const stats = await migratePropertiesTenantsField();
    
    // Exit with appropriate code
    const hasErrors = stats.errors.length > 0;
    process.exit(hasErrors ? 1 : 0);
    
  } catch (error) {
    console.error('❌ Script execution failed:', error);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  migratePropertiesTenantsField,
  validateCurrentState
}; 