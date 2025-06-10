/**
 * Data Persistence Test Suite
 * Tests the complete user journey from registration to property persistence across sessions
 */

import { auth, db } from '../firebase/config';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc,
  serverTimestamp 
} from 'firebase/firestore';
import dataService from '../services/dataService';

class DataPersistenceTest {
  constructor() {
    this.testResults = [];
    this.testUser = null;
    this.testProperties = [];
    this.startTime = Date.now();
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      type,
      message,
      elapsed: Date.now() - this.startTime
    };
    
    console.log(`[${timestamp}] [${type.toUpperCase()}] ${message}`);
    this.testResults.push(logEntry);
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async generateTestEmail() {
    const timestamp = Date.now();
    return `test-landlord-${timestamp}@example.com`;
  }

  async cleanup() {
    this.log('Starting cleanup process...');
    
    try {
      // Delete test properties
      for (const property of this.testProperties) {
        try {
          await deleteDoc(doc(db, 'properties', property.id));
          this.log(`Deleted test property: ${property.id}`);
        } catch (error) {
          this.log(`Failed to delete property ${property.id}: ${error.message}`, 'warn');
        }
      }

      // Delete test user document
      if (this.testUser) {
        try {
          await deleteDoc(doc(db, 'users', this.testUser.uid));
          this.log(`Deleted test user document: ${this.testUser.uid}`);
        } catch (error) {
          this.log(`Failed to delete user document: ${error.message}`, 'warn');
        }
      }

      // Sign out
      try {
        await signOut(auth);
        this.log('Signed out successfully');
      } catch (error) {
        this.log(`Failed to sign out: ${error.message}`, 'warn');
      }

    } catch (error) {
      this.log(`Cleanup error: ${error.message}`, 'error');
    }
  }

  async testUserRegistration() {
    this.log('=== TEST 1: User Registration & Document Creation ===');
    
    try {
      const testEmail = await this.generateTestEmail();
      const testPassword = 'TestPassword123!';
      
      this.log(`Creating test user with email: ${testEmail}`);
      
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
      this.testUser = userCredential.user;
      
      this.log(`✅ Firebase Auth user created with UID: ${this.testUser.uid}`);
      
      // Create user document in Firestore
      const userData = {
        email: testEmail,
        userType: 'landlord',
        role: 'landlord',
        firstName: 'Test',
        lastName: 'Landlord',
        createdAt: serverTimestamp(),
        uid: this.testUser.uid,
        onboardingComplete: true
      };
      
      await setDoc(doc(db, 'users', this.testUser.uid), userData);
      this.log('✅ User document created in Firestore');
      
      // Verify user document exists
      const userDoc = await getDoc(doc(db, 'users', this.testUser.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        this.log(`✅ User document verified with userType: ${data.userType}`);
        return { success: true, userData: data };
      } else {
        throw new Error('User document not found after creation');
      }
      
    } catch (error) {
      this.log(`❌ User registration failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testPropertyCreation() {
    this.log('=== TEST 2: Property Creation ===');
    
    try {
      // Configure dataService
      dataService.configure({
        isDemoMode: false,
        currentUser: this.testUser,
        userType: 'landlord'
      });
      
      // Create test property
      const propertyData = {
        name: 'Test Property',
        streetAddress: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        propertyType: 'apartment',
        units: 1,
        occupiedUnits: 1,
        monthlyRent: 1500,
        status: 'active'
      };
      
      this.log('Creating test property...');
      const createdProperty = await dataService.createProperty(propertyData);
      this.testProperties.push(createdProperty);
      
      this.log(`✅ Property created with ID: ${createdProperty.id}`);
      
      // Verify property in Firestore
      const propertyDoc = await getDoc(doc(db, 'properties', createdProperty.id));
      if (propertyDoc.exists()) {
        const data = propertyDoc.data();
        this.log(`✅ Property verified in Firestore with landlordId: ${data.landlordId}`);
        
        if (data.landlordId === this.testUser.uid) {
          this.log('✅ LandlordId correctly matches authenticated user');
          return { success: true, property: data };
        } else {
          throw new Error(`LandlordId mismatch: expected ${this.testUser.uid}, got ${data.landlordId}`);
        }
      } else {
        throw new Error('Property document not found after creation');
      }
      
    } catch (error) {
      this.log(`❌ Property creation failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testPropertyRetrieval() {
    this.log('=== TEST 3: Property Retrieval ===');
    
    try {
      // Test direct query
      const q = query(
        collection(db, 'properties'),
        where('landlordId', '==', this.testUser.uid)
      );
      
      const snapshot = await getDocs(q);
      const properties = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      this.log(`✅ Direct query returned ${properties.length} properties`);
      
      if (properties.length === this.testProperties.length) {
        this.log('✅ Property count matches expected');
        return { success: true, properties };
      } else {
        throw new Error(`Property count mismatch: expected ${this.testProperties.length}, got ${properties.length}`);
      }
      
    } catch (error) {
      this.log(`❌ Property retrieval failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testLogoutLoginCycle() {
    this.log('=== TEST 4: Logout/Login Cycle ===');
    
    try {
      const testEmail = this.testUser.email;
      const testPassword = 'TestPassword123!';
      
      // Sign out
      this.log('Signing out user...');
      await signOut(auth);
      this.log('✅ User signed out successfully');
      
      // Wait a moment to simulate real-world delay
      await this.sleep(1000);
      
      // Sign back in
      this.log('Signing user back in...');
      const userCredential = await signInWithEmailAndPassword(auth, testEmail, testPassword);
      this.testUser = userCredential.user;
      this.log(`✅ User signed in successfully with UID: ${this.testUser.uid}`);
      
      return { success: true };
      
    } catch (error) {
      this.log(`❌ Logout/Login cycle failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testDataPersistenceAfterLogin() {
    this.log('=== TEST 5: Data Persistence After Re-login ===');
    
    try {
      // Configure dataService again
      dataService.configure({
        isDemoMode: false,
        currentUser: this.testUser,
        userType: 'landlord'
      });
      
      // Test properties subscription (simulates dashboard loading)
      this.log('Testing property subscription...');
      
      return new Promise((resolve) => {
        const unsubscribe = dataService.subscribeToProperties(
          (properties) => {
            this.log(`✅ Subscription returned ${properties.length} properties`);
            
            if (properties.length === this.testProperties.length) {
              this.log('✅ All properties persisted after re-login');
              unsubscribe();
              resolve({ success: true, properties });
            } else {
              this.log(`❌ Property count mismatch after re-login: expected ${this.testProperties.length}, got ${properties.length}`, 'error');
              unsubscribe();
              resolve({ success: false, error: 'Property count mismatch after re-login' });
            }
          },
          (error) => {
            this.log(`❌ Properties subscription failed: ${error.message}`, 'error');
            unsubscribe();
            resolve({ success: false, error: error.message });
          }
        );
        
        // Timeout after 10 seconds
        setTimeout(() => {
          this.log('❌ Properties subscription timed out', 'error');
          unsubscribe();
          resolve({ success: false, error: 'Subscription timeout' });
        }, 10000);
      });
      
    } catch (error) {
      this.log(`❌ Data persistence test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async testUserDataIsolation() {
    this.log('=== TEST 6: User Data Isolation ===');
    
    try {
      // Create a second test user
      const testEmail2 = await this.generateTestEmail();
      const testPassword2 = 'TestPassword456!';
      
      const userCredential2 = await createUserWithEmailAndPassword(auth, testEmail2, testPassword2);
      const testUser2 = userCredential2.user;
      
      this.log(`Created second test user: ${testUser2.uid}`);
      
      // Create user document for second user
      await setDoc(doc(db, 'users', testUser2.uid), {
        email: testEmail2,
        userType: 'landlord',
        role: 'landlord',
        firstName: 'Second',
        lastName: 'Landlord',
        createdAt: serverTimestamp(),
        uid: testUser2.uid,
        onboardingComplete: true
      });
      
      // Configure dataService for second user
      dataService.configure({
        isDemoMode: false,
        currentUser: testUser2,
        userType: 'landlord'
      });
      
      // Try to access first user's properties
      const q = query(
        collection(db, 'properties'),
        where('landlordId', '==', testUser2.uid)
      );
      
      const snapshot = await getDocs(q);
      const properties = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      if (properties.length === 0) {
        this.log('✅ User data isolation verified - second user sees no properties');
        
        // Cleanup second user
        await deleteDoc(doc(db, 'users', testUser2.uid));
        await signOut(auth);
        
        // Sign back in as original user
        await signInWithEmailAndPassword(auth, this.testUser.email, 'TestPassword123!');
        
        return { success: true };
      } else {
        throw new Error(`Data isolation failed - second user can see ${properties.length} properties`);
      }
      
    } catch (error) {
      this.log(`❌ User data isolation test failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Data Persistence Test Suite');
    this.log('=====================================');
    
    const results = {};
    
    try {
      // Test 1: User Registration
      results.registration = await this.testUserRegistration();
      if (!results.registration.success) {
        throw new Error('Registration test failed - stopping test suite');
      }
      
      await this.sleep(1000);
      
      // Test 2: Property Creation
      results.propertyCreation = await this.testPropertyCreation();
      if (!results.propertyCreation.success) {
        throw new Error('Property creation test failed - stopping test suite');
      }
      
      await this.sleep(1000);
      
      // Test 3: Property Retrieval
      results.propertyRetrieval = await this.testPropertyRetrieval();
      if (!results.propertyRetrieval.success) {
        throw new Error('Property retrieval test failed - stopping test suite');
      }
      
      await this.sleep(1000);
      
      // Test 4: Logout/Login Cycle
      results.logoutLogin = await this.testLogoutLoginCycle();
      if (!results.logoutLogin.success) {
        throw new Error('Logout/Login cycle test failed - stopping test suite');
      }
      
      await this.sleep(1000);
      
      // Test 5: Data Persistence After Login
      results.dataPersistence = await this.testDataPersistenceAfterLogin();
      if (!results.dataPersistence.success) {
        throw new Error('Data persistence test failed - stopping test suite');
      }
      
      await this.sleep(1000);
      
      // Test 6: User Data Isolation
      results.dataIsolation = await this.testUserDataIsolation();
      
      // Generate summary
      this.log('=====================================');
      this.log('🎉 TEST SUITE COMPLETED');
      this.log('=====================================');
      
      const passedTests = Object.values(results).filter(r => r.success).length;
      const totalTests = Object.keys(results).length;
      
      this.log(`✅ PASSED: ${passedTests}/${totalTests} tests`);
      
      if (passedTests === totalTests) {
        this.log('🎊 ALL TESTS PASSED! Data persistence fix is working correctly!');
      } else {
        this.log('⚠️  Some tests failed. Check logs for details.');
      }
      
      this.log(`⏱️  Total execution time: ${Date.now() - this.startTime}ms`);
      
      return {
        success: passedTests === totalTests,
        results,
        summary: {
          passed: passedTests,
          total: totalTests,
          executionTime: Date.now() - this.startTime
        }
      };
      
    } catch (error) {
      this.log(`💥 Test suite failed: ${error.message}`, 'error');
      return {
        success: false,
        error: error.message,
        results
      };
    } finally {
      // Always cleanup
      await this.cleanup();
    }
  }

  getTestResults() {
    return this.testResults;
  }
}

// Export for use in other files
export default DataPersistenceTest;

// Allow running from command line or browser console
if (typeof window !== 'undefined') {
  window.DataPersistenceTest = DataPersistenceTest;
} 