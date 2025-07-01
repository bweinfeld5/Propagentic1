const admin = require('firebase-admin');
const { getFirestore } = require('firebase-admin/firestore');

// Initialize Firebase Admin (you'll need to set GOOGLE_APPLICATION_CREDENTIALS)
// Or provide the path to your service account key
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

async function fixAdminUser() {
  try {
    console.log(`🔍 Checking admin user: ${ADMIN_EMAIL}`);
    
    // Step 1: Get the user from Firebase Auth
    let userRecord;
    try {
      userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
      console.log(`✅ Found user in Firebase Auth: ${userRecord.uid}`);
      console.log(`   Email: ${userRecord.email}`);
      console.log(`   Custom Claims:`, userRecord.customClaims || 'None');
    } catch (authError) {
      console.error(`❌ User not found in Firebase Auth: ${authError.message}`);
      return;
    }

    // Step 2: Check Firestore user document
    const userDocRef = db.collection('users').doc(userRecord.uid);
    const userDoc = await userDocRef.get();
    
    if (!userDoc.exists) {
      console.log(`❌ No Firestore document found for user ${userRecord.uid}`);
      console.log(`📝 Creating admin user document...`);
      
      // Create the admin user document
      const adminData = {
        uid: userRecord.uid,
        email: userRecord.email,
        role: 'super_admin',
        userType: 'super_admin',
        onboardingComplete: true,
        emailVerified: true,
        firstName: 'Admin',
        lastName: 'User',
        displayName: 'Admin User',
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        isActive: true,
        permissions: {
          canManageUsers: true,
          canManageProperties: true,
          canManageSystem: true,
          canViewAnalytics: true
        }
      };
      
      await userDocRef.set(adminData);
      console.log(`✅ Created admin user document in Firestore`);
    } else {
      console.log(`✅ Found Firestore document for user ${userRecord.uid}`);
      const userData = userDoc.data();
      console.log(`   Current role: ${userData.role || 'Not set'}`);
      console.log(`   Current userType: ${userData.userType || 'Not set'}`);
      console.log(`   Onboarding complete: ${userData.onboardingComplete || false}`);
      
      // Check if the user needs to be fixed
      const needsUpdate = 
        userData.role !== 'super_admin' || 
        userData.userType !== 'super_admin' || 
        !userData.onboardingComplete;
      
      if (needsUpdate) {
        console.log(`📝 Updating admin user document...`);
        
        const updates = {
          role: 'super_admin',
          userType: 'super_admin',
          onboardingComplete: true,
          emailVerified: true,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
          isActive: true,
          permissions: {
            canManageUsers: true,
            canManageProperties: true,
            canManageSystem: true,
            canViewAnalytics: true
          }
        };
        
        await userDocRef.update(updates);
        console.log(`✅ Updated admin user document in Firestore`);
      } else {
        console.log(`✅ Admin user document is already correct`);
      }
    }

    // Step 3: Set custom claims in Firebase Auth
    const currentClaims = userRecord.customClaims || {};
    if (currentClaims.role !== 'super_admin' || currentClaims.userType !== 'super_admin') {
      console.log(`📝 Setting custom claims in Firebase Auth...`);
      
      await admin.auth().setCustomUserClaims(userRecord.uid, {
        role: 'super_admin',
        userType: 'super_admin',
        admin: true
      });
      
      console.log(`✅ Set custom claims in Firebase Auth`);
    } else {
      console.log(`✅ Custom claims are already correct`);
    }

    console.log(`\n🎉 Admin user setup complete!`);
    console.log(`\nTo test:`);
    console.log(`1. Log out of the application if currently logged in`);
    console.log(`2. Log in with: ${ADMIN_EMAIL}`);
    console.log(`3. Check the browser console for the debug output`);
    console.log(`4. You should be redirected to /admin/dashboard`);
    
  } catch (error) {
    console.error('❌ Error fixing admin user:', error);
  } finally {
    process.exit(0);
  }
}

// Run the fix
fixAdminUser(); 