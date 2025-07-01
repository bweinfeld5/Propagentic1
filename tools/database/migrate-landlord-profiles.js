#!/usr/bin/env node

/**
 * Enhanced Landlord Profiles Migration Script
 * 
 * This script creates UNIQUE landlord profiles following the tenant pattern:
 * - users collection: Basic user info (unchanged)
 * - landlordProfiles collection: Enhanced landlord-specific data (NEW unique profiles)
 * 
 * Unlike data copying, this creates proper relational architecture
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

/**
 * Create unique landlord profile following tenant pattern
 */
async function createUniqueLandlordProfile(landlordUser, existingData = {}) {
  const timestamp = FieldValue.serverTimestamp();
  
  // Get minimal reference data from user (not copy)
  const uid = landlordUser.uid;
  const email = landlordUser.email;
  const displayName = landlordUser.displayName || landlordUser.name || '';
  
  // Find all properties owned by this landlord
  const propertiesSnapshot = await db.collection('properties')
    .where('landlordId', '==', uid)
    .get();
  
  const propertyIds = propertiesSnapshot.docs.map(doc => doc.id);
  
  // Find all invites sent by this landlord
  const invitesSnapshot = await db.collection('invites')
    .where('landlordId', '==', uid)
    .get();
  
  const inviteIds = invitesSnapshot.docs.map(doc => doc.id);
  
  // Find accepted tenants through tenantProfiles
  const acceptedTenantDetails = [];
  const acceptedTenantIds = [];
  
  for (const propertyId of propertyIds) {
    const tenantProfilesSnapshot = await db.collection('tenantProfiles')
      .where('properties', 'array-contains', propertyId)
      .get();
    
    for (const tenantDoc of tenantProfilesSnapshot.docs) {
      const tenantData = tenantDoc.data();
      const tenantId = tenantDoc.id;
      
      if (!acceptedTenantIds.includes(tenantId)) {
        acceptedTenantIds.push(tenantId);
        
        // Find the specific invite that led to this acceptance
        const tenantInvites = invitesSnapshot.docs.filter(inviteDoc => {
          const inviteData = inviteDoc.data();
          return inviteData.propertyId === propertyId && 
                 (inviteData.tenantEmail === tenantData.email || 
                  inviteData.tenantId === tenantId);
        });
        
        if (tenantInvites.length > 0) {
          const invite = tenantInvites[0].data();
          
          acceptedTenantDetails.push({
            tenantId: tenantId,
            propertyId: propertyId,
            inviteId: tenantInvites[0].id,
            inviteCode: invite.shortCode || 'LEGACY',
            tenantEmail: tenantData.email || invite.tenantEmail || '',
            unitNumber: invite.unitNumber || null,
            acceptedAt: tenantData.createdAt || timestamp,
            inviteType: 'email'
          });
        }
      }
    }
  }
  
  // Calculate statistics
  const totalInvitesSent = inviteIds.length;
  const totalInvitesAccepted = acceptedTenantIds.length;
  const inviteAcceptanceRate = totalInvitesSent > 0 ? 
    Math.round((totalInvitesAccepted / totalInvitesSent) * 100) : 0;
  
  // Create UNIQUE landlord profile (not copied data)
  const landlordProfile = {
    // Identity (minimal reference to users collection)
    uid: uid,
    landlordId: uid,
    userId: uid,
    
    // Contact info (reference only, not duplication)
    displayName: displayName,
    email: email,
    phoneNumber: existingData.phoneNumber || '',
    businessName: existingData.businessName || '',
    
    // Core relationship arrays (UNIQUE to landlordProfiles)
    acceptedTenants: acceptedTenantIds,
    properties: propertyIds,
    invitesSent: inviteIds,
    contractors: [], // Will be populated later as contractors are added
    
    // Enhanced tracking (UNIQUE functionality)
    acceptedTenantDetails: acceptedTenantDetails,
    
    // Statistics (CALCULATED, not copied)
    totalInvitesSent: totalInvitesSent,
    totalInvitesAccepted: totalInvitesAccepted,
    inviteAcceptanceRate: inviteAcceptanceRate,
    
    // Timestamps
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  return landlordProfile;
}

/**
 * Main migration function
 */
async function migrateLandlordProfiles() {
  console.log('🚀 Starting Enhanced Landlord Profiles Migration...\n');
  
  try {
    // Step 1: Find all landlord users
    console.log('📋 Step 1: Finding landlord users...');
    const usersSnapshot = await db.collection('users')
      .where('userType', '==', 'landlord')
      .get();
    
    const landlordUsers = usersSnapshot.docs.map(doc => ({
      uid: doc.id,
      ...doc.data()
    }));
    
    console.log(`Found ${landlordUsers.length} landlord users\n`);
    
    if (landlordUsers.length === 0) {
      console.log('✅ No landlord users found to migrate.');
      return;
    }
    
    // Step 2: Create unique landlord profiles
    console.log('🏗️  Step 2: Creating unique landlord profiles...');
    
    const results = {
      created: 0,
      skipped: 0,
      errors: 0,
      profiles: []
    };
    
    for (const landlordUser of landlordUsers) {
      try {
        const uid = landlordUser.uid;
        console.log(`\n📝 Processing landlord: ${uid} (${landlordUser.email})`);
        
        // Check if profile already exists
        const existingProfileDoc = await db.collection('landlordProfiles').doc(uid).get();
        
        if (existingProfileDoc.exists) {
          console.log(`   ⏭️  Skipping - Profile already exists`);
          results.skipped++;
          continue;
        }
        
        // Create unique landlord profile
        const landlordProfile = await createUniqueLandlordProfile(landlordUser);
        
        // Save to Firestore
        await db.collection('landlordProfiles').doc(uid).set(landlordProfile);
        
        const summary = {
          uid: uid,
          email: landlordUser.email,
          properties: landlordProfile.properties.length,
          tenants: landlordProfile.acceptedTenants.length,
          invites: landlordProfile.totalInvitesSent,
          acceptanceRate: landlordProfile.inviteAcceptanceRate
        };
        
        results.profiles.push(summary);
        results.created++;
        
        console.log(`   ✅ Created unique profile:`);
        console.log(`      - Properties: ${summary.properties}`);
        console.log(`      - Accepted Tenants: ${summary.tenants}`);
        console.log(`      - Invites Sent: ${summary.invites}`);
        console.log(`      - Success Rate: ${summary.acceptanceRate}%`);
        
      } catch (error) {
        console.error(`   ❌ Error processing ${landlordUser.uid}:`, error.message);
        results.errors++;
      }
    }
    
    // Step 3: Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Profiles Created: ${results.created}`);
    console.log(`⏭️  Profiles Skipped: ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);
    console.log(`📁 Total Landlords: ${landlordUsers.length}`);
    
    if (results.profiles.length > 0) {
      console.log('\n📋 Created Profiles Summary:');
      console.log('-'.repeat(60));
      results.profiles.forEach(profile => {
        console.log(`${profile.email}:`);
        console.log(`  Properties: ${profile.properties} | Tenants: ${profile.tenants} | Rate: ${profile.acceptanceRate}%`);
      });
    }
    
    // Step 4: Verification
    console.log('\n🔍 Verification:');
    const finalProfilesSnapshot = await db.collection('landlordProfiles').get();
    console.log(`Total landlord profiles in collection: ${finalProfilesSnapshot.docs.length}`);
    
    if (results.created > 0) {
      console.log('\n✅ Migration completed successfully!');
      console.log('💡 Next steps:');
      console.log('   1. Test the landlord dashboard with migrated data');
      console.log('   2. Verify landlord profile service integration');
      console.log('   3. Test tenant acceptance flow with existing landlords');
    }
    
  } catch (error) {
    console.error('❌ Migration failed with error:', error);
    throw error;
  }
}

/**
 * Rollback function (if needed)
 */
async function rollbackMigration() {
  console.log('🔄 Rolling back landlord profiles migration...');
  
  const landlordProfilesSnapshot = await db.collection('landlordProfiles').get();
  const batch = db.batch();
  
  landlordProfilesSnapshot.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
  console.log(`✅ Deleted ${landlordProfilesSnapshot.docs.length} landlord profiles`);
}

// Command line interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--rollback')) {
    await rollbackMigration();
  } else if (args.includes('--help')) {
    console.log(`
Enhanced Landlord Profiles Migration Script

Usage:
  node scripts/migrate-landlord-profiles.js                    Run migration
  node scripts/migrate-landlord-profiles.js --rollback         Rollback migration
  node scripts/migrate-landlord-profiles.js --help             Show this help

Prerequisites:
  Either:
  - Service account file: firebase-service-account.json in project root
  - OR Google Cloud SDK: gcloud auth application-default login

This script creates UNIQUE landlord profiles following the tenant pattern:
- Creates enhanced landlord-specific data in landlordProfiles collection
- Maintains relational integrity with users collection
- Does NOT copy/duplicate user data
- Calculates relationships from existing property/tenant data
    `);
  } else {
    await migrateLandlordProfiles();
  }
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Script failed:', error);
    process.exit(1);
  });
}

module.exports = {
  migrateLandlordProfiles,
  rollbackMigration,
  createUniqueLandlordProfile
};
