// Debug login script for a specific user
// Run with: node debug-login.js user@example.com

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, where, getDocs, doc, updateDoc } = require('firebase/firestore');
const { getAuth, signInWithEmailAndPassword } = require('firebase/auth');

// Updated Firebase configuration to match src/firebase/config.js
const firebaseConfig = {
  apiKey: "AIzaSyDcsJWLoVoC_kPORoVJA_-mG3LIWfbU-rw",
  authDomain: "propagentic.firebaseapp.com",
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com",
  projectId: "propagentic",
  storageBucket: "propagentic.firebasestorage.app",
  messagingSenderId: "121286300748",
  appId: "1:121286300748:web:0c69ea6ff643c8f75110e9",
  measurementId: "G-7DTWZQH28H"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

async function debugLoginFlow(email, password) {
  console.log(`Simulating login flow for: ${email}`);
  
  try {
    // Step 1: Try to authenticate
    console.log('1. Authenticating with Firebase Auth...');
    const userCredential = await signInWithEmailAndPassword(auth, email, password || 'testpassword');
    const user = userCredential.user;
    console.log('✅ Authentication successful:', user.uid);
    
    // Step 2: Fetch user profile from Firestore
    console.log('2. Fetching user profile from Firestore...');
    const userDocRef = doc(db, 'users', user.uid);
    
    try {
      // Check if document exists by querying
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        console.log('❌ No Firestore document found for this user! This is a serious problem.');
        console.log('FIX: Create a document in the users collection with this user ID and email.');
        return;
      }
      
      if (querySnapshot.size > 1) {
        console.log('⚠️ Warning: Multiple user documents found with this email. Check for duplicates.');
      }
      
      // Check the actual user document
      const userDocSnapshot = querySnapshot.docs[0];
      const userData = userDocSnapshot.data();
      
      console.log('User document data:', userData);
      
      // Check for critical fields
      console.log('\n3. Checking for critical fields:');
      const checks = [
        { field: 'userType', value: userData.userType, fix: userData.role || 'tenant' },
        { field: 'role', value: userData.role, fix: userData.userType || 'tenant' },
        { field: 'onboardingComplete', value: userData.onboardingComplete, fix: true },
        { field: 'email', value: userData.email, fix: email }
      ];
      
      const updates = {};
      let needsUpdate = false;
      
      checks.forEach(check => {
        if (check.value === undefined) {
          console.log(`❌ Missing field: ${check.field}`);
          updates[check.field] = check.fix;
          needsUpdate = true;
        } else {
          console.log(`✅ Field found: ${check.field} = ${check.value}`);
        }
      });
      
      // Verify role and userType match
      if (userData.userType && userData.role && userData.userType !== userData.role) {
        console.log(`⚠️ Warning: userType (${userData.userType}) and role (${userData.role}) don't match`);
        console.log('This could cause issues with role-based navigation');
      }
      
      // Check if updates are needed
      if (needsUpdate) {
        console.log('\n4. Fixing missing fields:', updates);
        await updateDoc(doc(db, 'users', userDocSnapshot.id), updates);
        console.log('✅ Document updated successfully');
      } else {
        console.log('\n4. No updates needed - document looks good!');
      }
      
      // Final verdict
      console.log('\n5. Login flow simulation results:');
      if (userData.userType || userData.role) {
        const userRole = userData.userType || userData.role;
        console.log(`✅ User should be redirected to /${userRole}/dashboard`);
      } else if (needsUpdate) {
        console.log('✅ Fixed missing fields. Retry login.');
      } else {
        console.log('❌ No user type/role found. This would cause redirection to default dashboard.');
      }
      
    } catch (firestoreError) {
      console.error('Error fetching user profile:', firestoreError);
    }
    
  } catch (authError) {
    console.error('❌ Authentication failed:', authError.code);
    console.log('This could be an invalid email/password or the user may not exist.');
  }
}

// Get email from command line argument
const email = process.argv[2];
const password = process.argv[3]; // Optional

if (!email) {
  console.log('Please provide an email address:');
  console.log('node debug-login.js user@example.com [password]');
} else {
  debugLoginFlow(email, password).catch(console.error);
} 