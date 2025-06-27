const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  getDoc, 
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
  runTransaction,
  serverTimestamp
} = require('firebase/firestore');
const { 
  getAuth, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  deleteUser,
  connectAuthEmulator 
} = require('firebase/auth');

// Load environment variables
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Test configuration
const TEST_CONFIG = {
  CONCURRENT_REGISTRATIONS: 5,
  USER_TYPE: 'contractor',
  TEST_EMAIL_PREFIX: 'race-test-',
  TEST_PASSWORD: 'TestPassword123!',
  CLEANUP_ON_SUCCESS: true
};

class RaceConditionTester {
  constructor() {
    this.testResults = [];
    this.cleanupTasks = [];
  }

  /**
   * Generate test email
   */
  generateTestEmail() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${TEST_CONFIG.TEST_EMAIL_PREFIX}${timestamp}-${random}@test.com`;
  }

  /**
   * Log test results
   */
  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️';
    console.log(`[${timestamp}] ${prefix} ${message}`);
  }

  /**
   * Test 1: Concurrent Profile Creation (simulates race conditions)
   */
  async testConcurrentProfileCreation() {
    this.log('=== TEST 1: Concurrent Profile Creation ===');
    
    const testPromises = [];
    const testEmails = [];
    
    // Create multiple concurrent registration attempts
    for (let i = 0; i < TEST_CONFIG.CONCURRENT_REGISTRATIONS; i++) {
      const email = this.generateTestEmail();
      testEmails.push(email);
      
      const testPromise = this.simulateRegistration(email, i);
      testPromises.push(testPromise);
    }
    
    try {
      // Run all registrations concurrently
      this.log(`Starting ${TEST_CONFIG.CONCURRENT_REGISTRATIONS} concurrent registrations...`);
      const results = await Promise.allSettled(testPromises);
      
      // Analyze results
      let successful = 0;
      let failed = 0;
      let duplicateProfiles = 0;
      
      for (let i = 0; i < results.length; i++) {
        const result = results[i];
        const email = testEmails[i];
        
        if (result.status === 'fulfilled') {
          successful++;
          this.log(`Registration ${i + 1} (${email}): SUCCESS`);
          
          // Verify profile integrity
          const profileCheck = await this.verifyProfileIntegrity(result.value.uid);
          if (!profileCheck.isValid) {
            this.log(`Profile integrity check failed for ${email}: ${profileCheck.error}`, 'error');
          }
          
        } else {
          failed++;
          this.log(`Registration ${i + 1} (${email}): FAILED - ${result.reason.message}`, 'error');
        }
      }
      
      this.log(`Concurrent registration results: ${successful} successful, ${failed} failed`);
      
      return {
        success: failed === 0,
        successful,
        failed,
        duplicateProfiles
      };
      
    } catch (error) {
      this.log(`Concurrent registration test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Simulate user registration with profile creation
   */
  async simulateRegistration(email, index) {
    try {
      this.log(`Registration ${index + 1}: Creating auth user for ${email}`);
      
      // Create Firebase Auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        TEST_CONFIG.TEST_PASSWORD
      );
      const user = userCredential.user;
      
      // Add to cleanup list
      this.cleanupTasks.push({
        type: 'auth_user',
        uid: user.uid,
        email: email
      });
      
      this.log(`Registration ${index + 1}: Auth user created (${user.uid})`);
      
      // Simulate profile creation using transaction (like ProfileCreationService)
      const profileData = await this.createProfileWithTransaction(
        user.uid, 
        TEST_CONFIG.USER_TYPE, 
        {
          email: email,
          firstName: `Test${index + 1}`,
          lastName: 'User',
          onboardingComplete: false
        }
      );
      
      this.log(`Registration ${index + 1}: Profile created successfully`);
      
      return {
        uid: user.uid,
        email: email,
        profileData
      };
      
    } catch (error) {
      this.log(`Registration ${index + 1} failed: ${error.message}`, 'error');
      throw error;
    }
  }

  /**
   * Create profile using transaction (simulates ProfileCreationService)
   */
  async createProfileWithTransaction(uid, userType, profileData) {
    return await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, 'users', uid);
      
      // Check if user already exists within transaction
      const existingUserDoc = await transaction.get(userDocRef);
      if (existingUserDoc.exists()) {
        this.log(`User ${uid} already exists, returning existing data`);
        return existingUserDoc.data();
      }

      // Prepare user data
      const timestamp = serverTimestamp();
      const userData = {
        uid,
        email: profileData.email,
        userType,
        role: userType,
        firstName: profileData.firstName || '',
        lastName: profileData.lastName || '',
        createdAt: timestamp,
        updatedAt: timestamp,
        onboardingComplete: profileData.onboardingComplete || false,
        emailVerified: profileData.emailVerified || false
      };

      // Create main user document
      transaction.set(userDocRef, userData);

      // Create contractor profile if contractor
      if (userType === 'contractor') {
        const contractorProfileRef = doc(db, 'contractorProfiles', uid);
        const contractorProfileData = {
          contractorId: uid,
          userId: uid,
          skills: [],
          serviceArea: '',
          availability: true,
          preferredProperties: [],
          rating: 0,
          jobsCompleted: 0,
          createdAt: timestamp,
          updatedAt: timestamp
        };
        
        transaction.set(contractorProfileRef, contractorProfileData);
        
        // Add to cleanup list
        this.cleanupTasks.push({
          type: 'firestore_doc',
          collection: 'contractorProfiles',
          docId: uid
        });
      }

      // Add to cleanup list
      this.cleanupTasks.push({
        type: 'firestore_doc',
        collection: 'users',
        docId: uid
      });

      return userData;
    });
  }

  /**
   * Verify profile integrity after creation
   */
  async verifyProfileIntegrity(uid) {
    try {
      // Check main user document
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        return { isValid: false, error: 'User document does not exist' };
      }

      const userData = userDoc.data();

      // Check required fields
      const requiredFields = ['uid', 'email', 'userType', 'role', 'createdAt'];
      for (const field of requiredFields) {
        if (!userData[field]) {
          return { isValid: false, error: `Missing required field: ${field}` };
        }
      }

      // Check userType and role consistency
      if (userData.userType !== userData.role) {
        return { isValid: false, error: 'userType and role mismatch' };
      }

      // Check contractor profile if contractor
      if (userData.userType === 'contractor') {
        const contractorDoc = await getDoc(doc(db, 'contractorProfiles', uid));
        if (!contractorDoc.exists()) {
          return { isValid: false, error: 'Contractor profile document missing' };
        }

        const contractorData = contractorDoc.data();
        if (contractorData.userId !== uid || contractorData.contractorId !== uid) {
          return { isValid: false, error: 'Contractor profile ID mismatch' };
        }
      }

      return { isValid: true };

    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Test 2: Rapid Sequential Profile Updates
   */
  async testRapidSequentialUpdates() {
    this.log('=== TEST 2: Rapid Sequential Profile Updates ===');
    
    try {
      // Create a test user first
      const email = this.generateTestEmail();
      const userCredential = await createUserWithEmailAndPassword(auth, email, TEST_CONFIG.TEST_PASSWORD);
      const user = userCredential.user;
      
      // Add to cleanup
      this.cleanupTasks.push({
        type: 'auth_user',
        uid: user.uid,
        email: email
      });

      // Create initial profile
      await this.createProfileWithTransaction(user.uid, 'contractor', {
        email: email,
        firstName: 'Test',
        lastName: 'User'
      });

      // Perform rapid sequential updates
      const updatePromises = [];
      for (let i = 0; i < 10; i++) {
        const updatePromise = runTransaction(db, async (transaction) => {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await transaction.get(userDocRef);
          
          if (userDoc.exists()) {
            transaction.update(userDocRef, {
              updateCount: (userDoc.data().updateCount || 0) + 1,
              lastUpdate: serverTimestamp(),
              updateIndex: i
            });
          }
        });
        
        updatePromises.push(updatePromise);
      }

      // Execute all updates concurrently
      await Promise.all(updatePromises);

      // Verify final state
      const finalUserDoc = await getDoc(doc(db, 'users', user.uid));
      const finalData = finalUserDoc.data();

      this.log(`Rapid updates completed. Final update count: ${finalData.updateCount}`);

      return {
        success: finalData.updateCount === 10,
        finalCount: finalData.updateCount
      };

    } catch (error) {
      this.log(`Rapid sequential updates test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Test 3: Profile Recovery and Repair
   */
  async testProfileRecovery() {
    this.log('=== TEST 3: Profile Recovery and Repair ===');
    
    try {
      // Create a test user with intentionally corrupted profile
      const email = this.generateTestEmail();
      const userCredential = await createUserWithEmailAndPassword(auth, email, TEST_CONFIG.TEST_PASSWORD);
      const user = userCredential.user;
      
      // Add to cleanup
      this.cleanupTasks.push({
        type: 'auth_user',
        uid: user.uid,
        email: email
      });

      // Create corrupted profile (missing required fields)
      const userDocRef = doc(db, 'users', user.uid);
      await runTransaction(db, async (transaction) => {
        const corruptedData = {
          uid: user.uid,
          email: email,
          // Missing userType and role (corruption)
          createdAt: serverTimestamp(),
          corrupted: true
        };
        
        transaction.set(userDocRef, corruptedData);
      });

      this.cleanupTasks.push({
        type: 'firestore_doc',
        collection: 'users',
        docId: user.uid
      });

      this.log('Created corrupted profile');

      // Test repair functionality
      const repairResult = await this.repairProfile(user.uid, 'contractor');
      
      // Verify repair worked
      const repairedDoc = await getDoc(userDocRef);
      const repairedData = repairedDoc.data();

      this.log(`Profile repair completed. Repair applied: ${repairResult.repairsApplied}`);

      return {
        success: repairedData.userType === 'contractor' && repairedData.role === 'contractor',
        repairsApplied: repairResult.repairsApplied,
        repairedData
      };

    } catch (error) {
      this.log(`Profile recovery test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  /**
   * Repair profile (simulates ProfileCreationService.repairProfile)
   */
  async repairProfile(uid, userType) {
    return await runTransaction(db, async (transaction) => {
      const userDocRef = doc(db, 'users', uid);
      const userDoc = await transaction.get(userDocRef);

      if (!userDoc.exists()) {
        throw new Error('User profile not found for repair');
      }

      const userData = userDoc.data();
      const updates = {};
      let needsUpdate = false;

      // Ensure userType and role consistency
      if (!userData.userType && userData.role) {
        updates.userType = userData.role;
        needsUpdate = true;
      } else if (!userData.role && userData.userType) {
        updates.role = userData.userType;
        needsUpdate = true;
      } else if (!userData.userType && !userData.role) {
        updates.userType = userType;
        updates.role = userType;
        needsUpdate = true;
      }

      // Add missing timestamps
      if (!userData.createdAt) {
        updates.createdAt = serverTimestamp();
        needsUpdate = true;
      }

      if (!userData.updatedAt) {
        updates.updatedAt = serverTimestamp();
        needsUpdate = true;
      }

      // Add missing onboardingComplete field
      if (userData.onboardingComplete === undefined) {
        updates.onboardingComplete = false;
        needsUpdate = true;
      }

      if (needsUpdate) {
        transaction.update(userDocRef, updates);
        this.log(`Applied repairs: ${JSON.stringify(updates)}`);
      }

      return {
        success: true,
        repairsApplied: needsUpdate,
        repairs: updates
      };
    });
  }

  /**
   * Cleanup test data
   */
  async cleanup() {
    this.log('=== CLEANUP ===');
    
    for (const task of this.cleanupTasks) {
      try {
        if (task.type === 'auth_user') {
          // Sign in user first to delete
          await signInWithEmailAndPassword(auth, task.email, TEST_CONFIG.TEST_PASSWORD);
          if (auth.currentUser) {
            await deleteUser(auth.currentUser);
            this.log(`Deleted auth user: ${task.email}`);
          }
        } else if (task.type === 'firestore_doc') {
          await deleteDoc(doc(db, task.collection, task.docId));
          this.log(`Deleted document: ${task.collection}/${task.docId}`);
        }
      } catch (error) {
        this.log(`Cleanup failed for ${task.type}: ${error.message}`, 'error');
      }
    }
    
    this.log('Cleanup completed');
  }

  /**
   * Run all tests
   */
  async runAllTests() {
    this.log('🧪 Starting Race Condition Tests for H1');
    this.log('='.repeat(50));

    const results = {
      concurrentCreation: null,
      rapidUpdates: null,
      profileRecovery: null,
      overall: false
    };

    try {
      // Test 1: Concurrent Profile Creation
      results.concurrentCreation = await this.testConcurrentProfileCreation();
      
      // Test 2: Rapid Sequential Updates
      results.rapidUpdates = await this.testRapidSequentialUpdates();
      
      // Test 3: Profile Recovery
      results.profileRecovery = await this.testProfileRecovery();

      // Overall result
      results.overall = results.concurrentCreation.success && 
                       results.rapidUpdates.success && 
                       results.profileRecovery.success;

      // Summary
      this.log('='.repeat(50));
      this.log('📊 TEST SUMMARY');
      this.log(`Concurrent Creation: ${results.concurrentCreation.success ? '✅ PASS' : '❌ FAIL'}`);
      this.log(`Rapid Updates: ${results.rapidUpdates.success ? '✅ PASS' : '❌ FAIL'}`);
      this.log(`Profile Recovery: ${results.profileRecovery.success ? '✅ PASS' : '❌ FAIL'}`);
      this.log(`Overall H1 Status: ${results.overall ? '✅ PASS - Race conditions handled correctly' : '❌ FAIL - Race conditions detected'}`);

    } catch (error) {
      this.log(`Test suite failed: ${error.message}`, 'error');
      results.overall = false;
    } finally {
      // Cleanup if requested
      if (TEST_CONFIG.CLEANUP_ON_SUCCESS && results.overall) {
        await this.cleanup();
      }
    }

    return results;
  }
}

// Main execution
async function main() {
  const tester = new RaceConditionTester();
  
  try {
    const results = await tester.runAllTests();
    process.exit(results.overall ? 0 : 1);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = { RaceConditionTester }; 