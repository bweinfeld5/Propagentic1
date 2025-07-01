#!/usr/bin/env node

/**
 * Script to check and fix admin user profile data
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, getDoc, setDoc, collection, query, where, getDocs } = require('firebase/firestore');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyASqNnCHAhCiQUm3_8XnCz7Kcjj8fZ5Y-c",
  authDomain: "propagentic.firebaseapp.com",
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com",
  projectId: "propagentic",
  storageBucket: "propagentic.appspot.com",
  messagingSenderId: "1047878139430",
  appId: "1:1047878139430:web:2f7b4b2c1d8e3f4a5b6c7d"
};

async function checkAdminUser() {
  try {
    console.log('🔍 Checking admin user profile...');
    
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    
    // Look for user by email first
    console.log('📧 Searching for admin users by email...');
    
    const usersCollection = collection(db, 'users');
    const adminEmailQuery = query(usersCollection, where('email', '==', 'admin@propagenticai.com'));
    const adminQuerySnapshot = await getDocs(adminEmailQuery);
    
    if (adminQuerySnapshot.empty) {
      console.log('❌ No user found with email admin@propagenticai.com');
      console.log('🔍 Let me search for any admin role users...');
      
      const adminRoleQuery = query(usersCollection, where('role', '==', 'admin'));
      const adminRoleSnapshot = await getDocs(adminRoleQuery);
      
      if (adminRoleSnapshot.empty) {
        console.log('❌ No users found with admin role');
        return;
      } else {
        console.log('✅ Found admin role users:');
        adminRoleSnapshot.forEach(doc => {
          const data = doc.data();
          console.log(`  - UID: ${doc.id}`);
          console.log(`  - Email: ${data.email}`);
          console.log(`  - Role: ${data.role}`);
          console.log(`  - UserType: ${data.userType}`);
        });
      }
    } else {
      console.log('✅ Found admin@propagenticai.com user:');
      
      adminQuerySnapshot.forEach(async (userDoc) => {
        const uid = userDoc.id;
        const userData = userDoc.data();
        
        console.log(`📋 Current profile for ${userData.email}:`);
        console.log(`  - UID: ${uid}`);
        console.log(`  - Email: ${userData.email}`);
        console.log(`  - Role: ${userData.role || 'MISSING'}`);
        console.log(`  - UserType: ${userData.userType || 'MISSING'}`);
        console.log(`  - OnboardingComplete: ${userData.onboardingComplete}`);
        console.log(`  - Display Name: ${userData.displayName || 'MISSING'}`);
        
        // Check if admin role is properly set
        const isAdmin = userData.role === 'admin' || userData.role === 'super_admin' || 
                       userData.userType === 'admin' || userData.userType === 'super_admin';
        
        console.log(`🔐 Admin Status: ${isAdmin ? '✅ IS ADMIN' : '❌ NOT ADMIN'}`);
        
        if (!isAdmin) {
          console.log('🔧 Fixing admin role...');
          
          const adminProfile = {
            ...userData,
            role: 'admin',
            userType: 'admin',
            displayName: 'PropAgentic Admin',
            onboardingComplete: true,
            permissions: [
              'read_users',
              'write_users',
              'read_properties',
              'read_audit_logs',
              'manage_roles'
            ],
            isActive: true,
            updatedAt: new Date().toISOString()
          };
          
          const userDocRef = doc(db, 'users', uid);
          await setDoc(userDocRef, adminProfile, { merge: true });
          
          console.log('✅ Updated user profile with admin role');
          console.log('🔄 Please log out and log back in to see changes');
        } else {
          console.log('✅ User already has admin role - no fixes needed');
        }
      });
    }
    
  } catch (error) {
    console.error('❌ Error checking admin user:', error);
  }
}

// Run the check
checkAdminUser(); 