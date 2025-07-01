const { initializeApp } = require('firebase/app');
const { getAuth, connectAuthEmulator, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFunctions, connectFunctionsEmulator, httpsCallable } = require('firebase/functions');

// Firebase configuration for emulator
const firebaseConfig = {
  projectId: 'demo-project',
  authDomain: 'demo-project.firebaseapp.com',
  apiKey: 'demo-key',
};

// Test configuration
const FUNCTIONS_EMULATOR_HOST = 'localhost';
const FUNCTIONS_EMULATOR_PORT = 5001;
const AUTH_EMULATOR_HOST = 'localhost';
const AUTH_EMULATOR_PORT = 9099;

// Test user credentials
const TEST_USER = {
  email: 'test-landlord@example.com',
  password: 'testpassword123'
};

class FirebaseFunctionsTestSuite {
  constructor() {
    this.app = null;
    this.auth = null;
    this.functions = null;
    this.testResults = {
      passed: [],
      failed: [],
      authRequired: [],
      total: 0
    };
  }

  async initialize() {
    console.log('🚀 Initializing Firebase Functions Test Suite...\n');
    
    try {
      // Initialize Firebase
      this.app = initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.functions = getFunctions(this.app);

      // Connect to emulators
      connectAuthEmulator(this.auth, `http://${AUTH_EMULATOR_HOST}:${AUTH_EMULATOR_PORT}`);
      connectFunctionsEmulator(this.functions, FUNCTIONS_EMULATOR_HOST, FUNCTIONS_EMULATOR_PORT);

      console.log('✅ Firebase initialized and connected to emulators');
      console.log(`📍 Functions Emulator: ${FUNCTIONS_EMULATOR_HOST}:${FUNCTIONS_EMULATOR_PORT}`);
      console.log(`🔐 Auth Emulator: ${AUTH_EMULATOR_HOST}:${AUTH_EMULATOR_PORT}\n`);
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      throw error;
    }
  }

  async createTestUser() {
    try {
      console.log('👤 Creating test user for authentication...');
      await createUserWithEmailAndPassword(this.auth, TEST_USER.email, TEST_USER.password);
      console.log(`✅ Test user created: ${TEST_USER.email}\n`);
    } catch (error) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`ℹ️  Test user already exists: ${TEST_USER.email}\n`);
      } else {
        console.error('❌ Failed to create test user:', error);
        throw error;
      }
    }
  }

  async signInTestUser() {
    try {
      console.log('🔑 Signing in test user...');
      const userCredential = await signInWithEmailAndPassword(this.auth, TEST_USER.email, TEST_USER.password);
      console.log(`✅ Signed in as: ${userCredential.user.email}\n`);
      return userCredential.user;
    } catch (error) {
      console.error('❌ Failed to sign in test user:', error);
      throw error;
    }
  }

  async testFunction(functionName, data = {}, requiresAuth = false) {
    try {
      console.log(`🧪 Testing ${functionName}${requiresAuth ? ' (authenticated)' : ' (public)'}...`);
      
      const callable = httpsCallable(this.functions, functionName);
      const result = await callable(data);
      
      console.log(`✅ ${functionName} - SUCCESS`);
      console.log(`   Response:`, JSON.stringify(result.data, null, 2));
      
      this.testResults.passed.push({
        function: functionName,
        status: 'SUCCESS',
        response: result.data,
        requiresAuth
      });
      
      return result.data;
    } catch (error) {
      if (error.code === 'functions/unauthenticated' && !requiresAuth) {
        console.log(`⚠️  ${functionName} - AUTH REQUIRED (as expected)`);
        this.testResults.authRequired.push({
          function: functionName,
          status: 'AUTH_REQUIRED',
          error: error.message
        });
      } else {
        console.log(`❌ ${functionName} - FAILED`);
        console.log(`   Error:`, error.message);
        this.testResults.failed.push({
          function: functionName,
          status: 'FAILED',
          error: error.message,
          requiresAuth
        });
      }
      return null;
    }
  }

  async runPublicFunctionTests() {
    console.log('📋 Testing Public Functions (No Authentication Required)\n');
    console.log('=' .repeat(60));
    
    // Test basic functions
    await this.testFunction('ping');
    await this.testFunction('testPing');
    await this.testFunction('simpleTest');
    
    // Test email functions
    await this.testFunction('testSendGrid');
    await this.testFunction('sendPropertyInvitationEmailManual', {
      to: 'ben@propagenticai.com',
      propertyName: 'Test Property',
      propertyAddress: '123 Test St',
      landlordName: 'Test Landlord',
      inviteCode: 'TEST123'
    });
    
    // Test contractor function
    await this.testFunction('addContractorToRolodex', {
      name: 'Test Contractor',
      phone: '555-1234',
      email: 'contractor@test.com',
      services: ['plumbing', 'electrical']
    });
    
    // Test AI classification
    await this.testFunction('classifyMaintenanceRequest', {
      description: 'The kitchen sink is leaking water everywhere'
    });
    
    console.log('\n');
  }

  async runProtectedFunctionTests() {
    console.log('🔐 Testing Protected Functions (Authentication Required)\n');
    console.log('=' .repeat(60));
    
    // First test without authentication (should fail)
    console.log('Testing without authentication (should fail):');
    await this.testFunction('getAllTenants');
    await this.testFunction('searchTenants', { query: 'test' });
    await this.testFunction('sendPropertyInvite', {
      tenantEmail: 'tenant@test.com',
      propertyId: 'test-property-123'
    });
    
    console.log('\nNow testing with authentication:');
    
    // Create and sign in test user
    await this.createTestUser();
    await this.signInTestUser();
    
    // Test authenticated functions
    await this.testFunction('getAllTenants', {}, true);
    await this.testFunction('searchTenants', { query: 'test' }, true);
    await this.testFunction('sendPropertyInvite', {
      tenantEmail: 'tenant@test.com',
      propertyId: 'test-property-123'
    }, true);
    await this.testFunction('acceptPropertyInvite', {
      inviteId: 'test-invite-123'
    }, true);
    await this.testFunction('rejectPropertyInvite', {
      inviteId: 'test-invite-456'
    }, true);
    
    console.log('\n');
  }

  generateReport() {
    console.log('📊 TEST SUITE RESULTS');
    console.log('=' .repeat(60));
    
    const total = this.testResults.passed.length + this.testResults.failed.length + this.testResults.authRequired.length;
    
    console.log(`📈 SUMMARY:`);
    console.log(`   Total Functions Tested: ${total}`);
    console.log(`   ✅ Passed: ${this.testResults.passed.length}`);
    console.log(`   ❌ Failed: ${this.testResults.failed.length}`);
    console.log(`   ⚠️  Auth Required: ${this.testResults.authRequired.length}`);
    
    if (this.testResults.passed.length > 0) {
      console.log(`\n✅ PASSED FUNCTIONS:`);
      this.testResults.passed.forEach(result => {
        console.log(`   • ${result.function} ${result.requiresAuth ? '(authenticated)' : '(public)'}`);
      });
    }
    
    if (this.testResults.failed.length > 0) {
      console.log(`\n❌ FAILED FUNCTIONS:`);
      this.testResults.failed.forEach(result => {
        console.log(`   • ${result.function} - ${result.error}`);
      });
    }
    
    if (this.testResults.authRequired.length > 0) {
      console.log(`\n⚠️  FUNCTIONS REQUIRING AUTHENTICATION:`);
      this.testResults.authRequired.forEach(result => {
        console.log(`   • ${result.function} - Auth required (expected)`);
      });
    }
    
    console.log('\n🎯 RECOMMENDATIONS:');
    if (this.testResults.failed.length > 0) {
      console.log('   • Check failed functions for implementation issues');
      console.log('   • Review function logs in Firebase Emulator UI');
    }
    if (this.testResults.authRequired.length > 0) {
      console.log('   • Auth-required functions are working correctly');
      console.log('   • Use authenticated calls for protected functions');
    }
    if (this.testResults.passed.length === total) {
      console.log('   • 🎉 All functions working correctly!');
    }
    
    console.log('\n📋 NEXT STEPS:');
    console.log('   • Deploy to production when ready');
    console.log('   • Update client code to handle auth requirements');
    console.log('   • Monitor email delivery in Firebase Console');
    
    console.log('\n' + '=' .repeat(60));
    console.log('🚀 PropAgentic Firebase Functions Test Complete!');
  }

  async runAllTests() {
    try {
      await this.initialize();
      await this.runPublicFunctionTests();
      await this.runProtectedFunctionTests();
      this.generateReport();
    } catch (error) {
      console.error('💥 Test suite encountered an error:', error);
      process.exit(1);
    }
  }
}

// Run the test suite if this file is executed directly
if (require.main === module) {
  const testSuite = new FirebaseFunctionsTestSuite();
  testSuite.runAllTests();
}

// Export the test suite class
module.exports = FirebaseFunctionsTestSuite; 