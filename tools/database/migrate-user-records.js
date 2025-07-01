// Run this script to fix user role consistency issues
const fs = require('fs');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc } = require('firebase/firestore');

// Your Firebase configuration from config.js
const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyA1j5o9uI3NFeufUuJOKR3-TQzQk-mh8JE",
  authDomain: "propagentic.firebaseapp.com",
  projectId: "propagentic",
  storageBucket: "propagentic.firebasestorage.app",
  messagingSenderId: "859812091492",
  appId: "1:859812091492:web:8e9e6c8fbfecbc8fa8f1e5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixUserRoles() {
  console.log('Starting user role consistency fix...');
  
  try {
    const usersRef = collection(db, 'users');
    const userDocs = await getDocs(usersRef);
    
    console.log(`Found ${userDocs.size} user records.`);
    
    let updatedCount = 0;
    let errorCount = 0;
    
    for (const userDoc of userDocs.docs) {
      const userData = userDoc.data();
      let needsUpdate = false;
      let updates = {};
      
      // Make sure both fields exist and are consistent
      if (userData.userType && !userData.role) {
        updates.role = userData.userType;
        needsUpdate = true;
        console.log(`User ${userDoc.id}: Adding missing role field (${userData.userType})`);
      } 
      else if (!userData.userType && userData.role) {
        updates.userType = userData.role;
        needsUpdate = true;
        console.log(`User ${userDoc.id}: Adding missing userType field (${userData.role})`);
      }
      else if (userData.userType && userData.role && userData.userType !== userData.role) {
        // If both exist but are different, prioritize role and make userType match
        updates.userType = userData.role;
        needsUpdate = true;
        console.log(`User ${userDoc.id}: Fixing inconsistent userType/role (${userData.userType} vs ${userData.role})`);
      }
      
      // Add onboardingComplete if missing
      if (userData.onboardingComplete === undefined) {
        updates.onboardingComplete = true;
        needsUpdate = true;
        console.log(`User ${userDoc.id}: Adding missing onboardingComplete field`);
      }
      
      if (needsUpdate) {
        try {
          await updateDoc(doc(db, 'users', userDoc.id), updates);
          updatedCount++;
          console.log(`✅ Updated user ${userDoc.id}`);
        } catch (err) {
          errorCount++;
          console.error(`❌ Error updating user ${userDoc.id}:`, err);
        }
      }
    }
    
    console.log(`\nCompleted with: ${updatedCount} users updated, ${errorCount} errors`);
    
  } catch (error) {
    console.error('Error in migration script:', error);
  }
}

// Run the function
fixUserRoles(); 