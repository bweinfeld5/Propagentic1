const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin
try {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'propagentic' // Replace with your actual project ID
  });
} catch (error) {
  console.log('Admin already initialized or using different initialization method');
}

const db = getFirestore();

const ADMIN_EMAIL = 'admin@propagenticai.com';

async function checkAdminStatus() {
  try {
    console.log(`🔍 Checking admin user status: ${ADMIN_EMAIL}\n`);
    
    // Step 1: Check Firebase Auth
    console.log('=== FIREBASE AUTH STATUS ===');
    try {
      const userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log(`✅ User found in Firebase Auth`);
      console.log(`   UID: ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Email Verified: ${userRecord.emailVerified}`);
      console.log(`   Disabled: ${userRecord.disabled}`);
      console.log(`   Custom Claims:`, JSON.stringify(userRecord.customClaims || {}, null, 2));
      
      // Step 2: Check Firestore document
      console.log('\n=== FIRESTORE DOCUMENT STATUS ===');
      const userDocRef = db.collection('users').doc(userRecord.uid);
      const userDoc = await userDocRef.get();
      
      if (userDoc.exists) {
        console.log(`✅ User document found in Firestore`);
        const userData = userDoc.data();
        console.log(`   Role: ${userData.role || 'Not set'}`);
        console.log(`   UserType: ${userData.userType || 'Not set'}`);
        console.log(`   Onboarding Complete: ${userData.onboardingComplete || false}`);
        console.log(`   Email Verified: ${userData.emailVerified || false}`);
        console.log(`   Is Active: ${userData.isActive !== false ? 'true' : 'false'}`);
        console.log(`   Display Name: ${userData.displayName || 'Not set'}`);
        console.log(`   First Name: ${userData.firstName || 'Not set'}`);
        console.log(`   Last Name: ${userData.lastName || 'Not set'}`);
        
        if (userData.permissions) {
          console.log(`   Permissions:`, JSON.stringify(userData.permissions, null, 2));
        } else {
          console.log(`   Permissions: Not set`);
        }
        
        // Step 3: Analysis
        console.log('\n=== ANALYSIS ===');
        const isAuthAdmin = userRecord.customClaims && 
          (userRecord.customClaims.role === 'admin' || userRecord.customClaims.role === 'super_admin' ||
           userRecord.customClaims.userType === 'admin' || userRecord.customClaims.userType === 'super_admin' ||
           userRecord.customClaims.admin === true);
        
        const isFirestoreAdmin = userData.role === 'admin' || userData.role === 'super_admin' ||
                                userData.userType === 'admin' || userData.userType === 'super_admin';
        
        console.log(`Auth Admin Status: ${isAuthAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}`);
        console.log(`Firestore Admin Status: ${isFirestoreAdmin ? '✅ ADMIN' : '❌ NOT ADMIN'}`);
        console.log(`Onboarding Status: ${userData.onboardingComplete ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
        
        if (isAuthAdmin && isFirestoreAdmin && userData.onboardingComplete) {
          console.log('\n🎉 Admin user is properly configured!');
          console.log('   The user should be redirected to /admin/dashboard upon login.');
        } else {
          console.log('\n⚠️  Admin user needs fixing:');
          if (!isAuthAdmin) console.log('   - Custom claims in Firebase Auth need to be set');
          if (!isFirestoreAdmin) console.log('   - Role/userType in Firestore need to be set to admin/super_admin');
          if (!userData.onboardingComplete) console.log('   - onboardingComplete needs to be set to true');
          console.log('\n   Run: node scripts/fix-admin-user.js');
        }
        
      } else {
        console.log(`❌ No user document found in Firestore for UID: ${userRecord.uid}`);
        console.log('\n⚠️  Admin user needs a Firestore document created.');
        console.log('   Run: node scripts/fix-admin-user.js');
      }
      
    } catch (authError) {
      console.error(`❌ User not found in Firebase Auth: ${authError.message}`);
      console.log('\n⚠️  You need to create the admin user first.');
      console.log('   Either register through the app or create manually in Firebase Console.');
    }
    
  } catch (error) {
    console.error('❌ Error checking admin status:', error);
  } finally {
    process.exit(0);
  }
}

// Run the check
checkAdminStatus(); 