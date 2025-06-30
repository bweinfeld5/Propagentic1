#!/usr/bin/env node

/**
 * Migration Script: Contractor Contracts from contractors to contractorProfiles
 * 
 * This script migrates the contracts structure (pending, ongoing, finished arrays)
 * from the contractors collection to the contractorProfiles collection.
 * 
 * Usage: node scripts/migrate-contractor-contracts.js
 */

const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin with proper configuration
const serviceAccountPath = path.join(__dirname, '../service-account-key.json');

// Try different authentication methods
if (fs.existsSync(serviceAccountPath)) {
  console.log('🔑 Using service account key for authentication...');
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id || 'propagentic' // Use project ID from service account
  });
} else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.log('🔑 Using GOOGLE_APPLICATION_CREDENTIALS environment variable...');
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'propagentic'
  });
} else {
  console.log('🔑 Using default credentials...');
  // Use default credentials with explicit project ID
  admin.initializeApp({
    projectId: process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT_ID || 'propagentic'
  });
}

const db = admin.firestore();

// Test Firebase connection
async function testFirebaseConnection() {
  try {
    console.log('🧪 Testing Firebase connection...');
    await db.collection('_test').limit(1).get();
    console.log('✅ Firebase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Firebase connection failed:', error.message);
    return false;
  }
}

async function migrateContractorContracts() {
  console.log('🚀 Starting contractor contracts migration...');
  console.log('📋 Migrating from: contractors collection');
  console.log('📋 Migrating to: contractorProfiles collection');
  console.log('');

  // Test Firebase connection first
  const connectionOk = await testFirebaseConnection();
  if (!connectionOk) {
    console.log('💡 Troubleshooting tips:');
    console.log('   1. Make sure service-account-key.json exists in the project root');
    console.log('   2. Verify the service account has Firestore permissions');
    console.log('   3. Check if you need to set GOOGLE_APPLICATION_CREDENTIALS');
    console.log('   4. Ensure you have the correct project ID');
    throw new Error('Firebase connection failed. Cannot proceed with migration.');
  }

  let migrationStats = {
    contractorsProcessed: 0,
    contractorProfilesUpdated: 0,
    contractorProfilesCreated: 0,
    contractsDataMigrated: 0,
    errors: 0,
    skipped: 0
  };

  try {
    // Step 1: Get all contractor documents that have contracts data
    console.log('🔍 Fetching contractors with contracts data...');
    const contractorsSnapshot = await db.collection('contractors').get();
    
    if (contractorsSnapshot.empty) {
      console.log('ℹ️  No contractors found in the contractors collection.');
      return;
    }

    console.log(`📊 Found ${contractorsSnapshot.size} contractor documents to process`);
    console.log('');

    // Step 2: Process each contractor
    for (const contractorDoc of contractorsSnapshot.docs) {
      const contractorId = contractorDoc.id;
      const contractorData = contractorDoc.data();
      
      migrationStats.contractorsProcessed++;
      
      console.log(`🔄 Processing contractor ${contractorId}...`);

      // Check if contractor has contracts data
      if (!contractorData.contracts) {
        console.log(`⏭️  Skipping contractor ${contractorId} - no contracts data found`);
        migrationStats.skipped++;
        continue;
      }

      const contractsData = contractorData.contracts;
      const hasContractData = 
        (contractsData.pending && contractsData.pending.length > 0) ||
        (contractsData.ongoing && contractsData.ongoing.length > 0) ||
        (contractsData.finished && contractsData.finished.length > 0);

      if (!hasContractData) {
        console.log(`⏭️  Skipping contractor ${contractorId} - contracts arrays are empty`);
        migrationStats.skipped++;
        continue;
      }

      try {
        // Step 3: Check if contractorProfile exists
        const contractorProfileRef = db.collection('contractorProfiles').doc(contractorId);
        const contractorProfileDoc = await contractorProfileRef.get();

        if (contractorProfileDoc.exists) {
          // Update existing profile
          const existingData = contractorProfileDoc.data();
          
          // Check if contracts already exist
          if (existingData.contracts) {
            console.log(`⚠️  Contractor profile ${contractorId} already has contracts data. Merging...`);
            
            // Merge the contracts arrays (avoiding duplicates)
            const mergedContracts = {
              pending: [...new Set([
                ...(existingData.contracts.pending || []),
                ...(contractsData.pending || [])
              ])],
              ongoing: [...new Set([
                ...(existingData.contracts.ongoing || []),
                ...(contractsData.ongoing || [])
              ])],
              finished: [...new Set([
                ...(existingData.contracts.finished || []),
                ...(contractsData.finished || [])
              ])]
            };

            await contractorProfileRef.update({
              contracts: mergedContracts,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              migratedFrom: 'contractors',
              migrationDate: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Updated contractor profile ${contractorId} with merged contracts`);
          } else {
            // Add contracts to existing profile
            await contractorProfileRef.update({
              contracts: contractsData,
              updatedAt: admin.firestore.FieldValue.serverTimestamp(),
              migratedFrom: 'contractors',
              migrationDate: admin.firestore.FieldValue.serverTimestamp()
            });

            console.log(`✅ Added contracts data to existing contractor profile ${contractorId}`);
          }
          
          migrationStats.contractorProfilesUpdated++;
        } else {
          // Create new contractor profile with contracts data
          const newProfileData = {
            contractorId: contractorId,
            userId: contractorId,
            contracts: contractsData,
            skills: contractorData.skills || [],
            serviceArea: contractorData.serviceArea || '',
            availability: contractorData.availability !== undefined ? contractorData.availability : true,
            preferredProperties: contractorData.preferredProperties || [],
            rating: contractorData.rating || contractorData.ratings?.overall || 0,
            jobsCompleted: contractorData.jobsCompleted || contractorData.statistics?.completedJobs || 0,
            companyName: contractorData.companyName || contractorData.name || null,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp(),
            migratedFrom: 'contractors',
            migrationDate: admin.firestore.FieldValue.serverTimestamp()
          };

          await contractorProfileRef.set(newProfileData);
          
          console.log(`✅ Created new contractor profile ${contractorId} with contracts data`);
          migrationStats.contractorProfilesCreated++;
        }

        migrationStats.contractsDataMigrated++;
        
        // Log the contracts being migrated
        console.log(`   📄 Contracts migrated:`, {
          pending: contractsData.pending?.length || 0,
          ongoing: contractsData.ongoing?.length || 0,
          finished: contractsData.finished?.length || 0
        });

      } catch (error) {
        console.error(`❌ Error processing contractor ${contractorId}:`, error.message);
        migrationStats.errors++;
      }

      console.log(''); // Empty line for readability
    }

    // Step 4: Summary
    console.log('🎉 Migration completed!');
    console.log('📊 Migration Statistics:');
    console.log(`   • Contractors processed: ${migrationStats.contractorsProcessed}`);
    console.log(`   • Contractor profiles updated: ${migrationStats.contractorProfilesUpdated}`);
    console.log(`   • Contractor profiles created: ${migrationStats.contractorProfilesCreated}`);
    console.log(`   • Contracts data migrated: ${migrationStats.contractsDataMigrated}`);
    console.log(`   • Skipped (no relevant data): ${migrationStats.skipped}`);
    console.log(`   • Errors: ${migrationStats.errors}`);
    
    if (migrationStats.errors === 0) {
      console.log('✅ Migration completed successfully with no errors!');
    } else {
      console.log('⚠️  Migration completed with some errors. Please review the logs above.');
    }

  } catch (error) {
    console.error('💥 Migration failed with error:', error);
    throw error;
  }
}

// Main execution
if (require.main === module) {
  migrateContractorContracts()
    .then(() => {
      console.log('🏁 Migration script finished');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = { migrateContractorContracts }; 