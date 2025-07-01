#!/usr/bin/env node

/**
 * Email Verification Sync Script
 * 
 * Fixes discrepancies between Firebase Auth and Firestore email verification status.
 * This can happen during onboarding when Firestore gets updated but Auth doesn't sync.
 */

const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
let app, auth, db;

try {
  // Try to use the temporary service account key
  const serviceAccount = require('../service-account-key.json');
  
  app = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://propagentic-default-rtdb.firebaseio.com"
  });
  
  auth = getAuth();
  db = getFirestore();
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin');
  console.error('Please ensure you have the service account key available');
  console.error('Run this script after setting up the service account key');
  process.exit(1);
}

async function fixEmailVerificationSync() {
  console.log('🔧 Starting email verification sync...\n');
  
  const results = {
    processed: 0,
    fixed: 0,
    errors: 0,
    details: []
  };

  try {
    // Get all users from Firestore
    console.log('📊 Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    
    console.log(`Found ${usersSnapshot.size} users in Firestore\n`);
    
    for (const doc of usersSnapshot.docs) {
      const userData = doc.data();
      const uid = doc.id;
      results.processed++;
      
      try {
        // Get the corresponding Auth record
        const authUser = await auth.getUser(uid);
        
        // Check for discrepancy
        const firestoreVerified = userData.emailVerified === true;
        const authVerified = authUser.emailVerified === true;
        
        console.log(`👤 Checking ${userData.email || 'Unknown email'} (${uid.substring(0, 8)}...)`);
        console.log(`   Firestore verified: ${firestoreVerified}`);
        console.log(`   Auth verified: ${authVerified}`);
        
        if (firestoreVerified && !authVerified) {
          console.log(`   🔧 FIXING: Updating Auth to match Firestore (verified=true)`);
          
          // Update Firebase Auth to match Firestore
          await auth.updateUser(uid, {
            emailVerified: true
          });
          
          results.fixed++;
          results.details.push({
            uid,
            email: userData.email,
            action: 'Updated Auth emailVerified to true',
            before: { auth: authVerified, firestore: firestoreVerified },
            after: { auth: true, firestore: firestoreVerified }
          });
          
          console.log(`   ✅ Fixed: Auth emailVerified updated to true\n`);
          
        } else if (!firestoreVerified && authVerified) {
          console.log(`   🔧 FIXING: Updating Firestore to match Auth (verified=true)`);
          
          // Update Firestore to match Auth
          await db.collection('users').doc(uid).update({
            emailVerified: true
          });
          
          results.fixed++;
          results.details.push({
            uid,
            email: userData.email,
            action: 'Updated Firestore emailVerified to true',
            before: { auth: authVerified, firestore: firestoreVerified },
            after: { auth: authVerified, firestore: true }
          });
          
          console.log(`   ✅ Fixed: Firestore emailVerified updated to true\n`);
          
        } else if (firestoreVerified === authVerified) {
          console.log(`   ✅ Already in sync (both ${firestoreVerified})\n`);
        } else {
          console.log(`   ⚠️  Both false - no action needed\n`);
        }
        
      } catch (error) {
        console.error(`   ❌ Error processing user ${uid}:`, error.message);
        results.errors++;
        results.details.push({
          uid,
          email: userData.email,
          action: 'Error',
          error: error.message
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Error during sync:', error);
    results.error = error.message;
  }
  
  // Generate report
  console.log('\n📋 EMAIL VERIFICATION SYNC REPORT');
  console.log('=====================================');
  console.log(`Total users processed: ${results.processed}`);
  console.log(`Users fixed: ${results.fixed}`);
  console.log(`Errors encountered: ${results.errors}`);
  
  if (results.fixed > 0) {
    console.log('\n🔧 USERS FIXED:');
    results.details
      .filter(detail => detail.action.includes('Updated'))
      .forEach(detail => {
        console.log(`  • ${detail.email}: ${detail.action}`);
      });
  }
  
  if (results.errors > 0) {
    console.log('\n❌ ERRORS:');
    results.details
      .filter(detail => detail.action === 'Error')
      .forEach(detail => {
        console.log(`  • ${detail.email}: ${detail.error}`);
      });
  }
  
  // Save detailed results
  const fs = require('fs');
  fs.writeFileSync(
    'email-verification-sync-results.json',
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n📁 Detailed results saved to: email-verification-sync-results.json');
  
  return results;
}

// Specific function to fix Charlie Gallagher
async function fixCharlieGallagher() {
  console.log('🎯 Fixing Charlie Gallagher specifically...\n');
  
  const charlieUID = 'SnWJapdP82VWCMicgVhbxHYPmo23';
  const charlieEmail = 'charlie@propagenticai.com';
  
  try {
    // Get Charlie's Auth record
    const authUser = await auth.getUser(charlieUID);
    console.log(`Charlie's Auth emailVerified: ${authUser.emailVerified}`);
    
    // Get Charlie's Firestore record
    const firestoreDoc = await db.collection('users').doc(charlieUID).get();
    const firestoreData = firestoreDoc.data();
    console.log(`Charlie's Firestore emailVerified: ${firestoreData?.emailVerified}`);
    
    if (firestoreData?.emailVerified && !authUser.emailVerified) {
      console.log('🔧 Updating Charlie\'s Auth emailVerified to true...');
      
      await auth.updateUser(charlieUID, {
        emailVerified: true
      });
      
      console.log('✅ Charlie\'s email verification fixed!');
      return { success: true, action: 'Updated Auth emailVerified to true' };
    } else {
      console.log('✅ Charlie\'s email verification is already in sync or both false');
      return { success: true, action: 'Already in sync' };
    }
    
  } catch (error) {
    console.error('❌ Error fixing Charlie:', error);
    return { success: false, error: error.message };
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--charlie-only')) {
    await fixCharlieGallagher();
  } else {
    await fixEmailVerificationSync();
  }
  
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { fixEmailVerificationSync, fixCharlieGallagher }; 