const admin = require('firebase-admin');
const { getAuth } = require('firebase-admin/auth');
const { getFunctions, httpsCallable } = require('firebase-admin/functions');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'propagentic'
  });
}

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds timeout for each test
  verbose: true,
  emulatorUrl: 'http://127.0.0.1:5001'
};

// Test data
const TEST_DATA = {
  landlordEmail: 'justin@propagenticai.com', // Use existing authenticated user
  tenantEmail: 'ben@propagenticai.com',
  contractorEmail: 'test-contractor@propagenticai.com',
  propertyId: 'test-property-123',
  inviteCode: 'TEST-' + Date.now()
};

class CallableFunctionTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
    
    // Initialize functions with emulator
    process.env.FIREBASE_AUTH_EMULATOR_HOST = '127.0.0.1:9099';
    process.env.FUNCTIONS_EMULATOR = '127.0.0.1:5001';
    
    this.functions = getFunctions();
  }

  log(message) {
    if (TEST_CONFIG.verbose) {
      console.log(`[${new Date().toISOString()}] ${message}`);
    }
  }

  async runTest(testName, testFunction) {
    this.log(`\n🧪 Testing: ${testName}`);
    const testStart = Date.now();
    
    try {
      const result = await testFunction();
      const duration = Date.now() - testStart;
      
      this.results.push({
        name: testName,
        status: 'PASSED',
        duration,
        result
      });
      
      this.log(`✅ ${testName} - PASSED (${duration}ms)`);
      if (result && typeof result === 'object') {
        this.log(`   Response: ${JSON.stringify(result, null, 2)}`);
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - testStart;
      
      this.results.push({
        name: testName,
        status: 'FAILED',
        duration,
        error: error.message
      });
      
      this.log(`❌ ${testName} - FAILED (${duration}ms)`);
      this.log(`   Error: ${error.message}`);
      
      if (error.details) {
        this.log(`   Details: ${JSON.stringify(error.details, null, 2)}`);
      }
      
      // Don't throw error, continue with other tests
      return null;
    }
  }

  async callFunction(functionName, data = {}) {
    try {
      const callable = httpsCallable(this.functions, functionName);
      this.log(`📞 Calling function: ${functionName}`);
      if (Object.keys(data).length > 0) {
        this.log(`   Data: ${JSON.stringify(data, null, 2)}`);
      }
      
      const result = await callable(data);
      return result.data;
    } catch (error) {
      this.log(`❌ Function call failed: ${error.message}`);
      throw error;
    }
  }

  // Test Functions for v2 onCall functions
  async testPing() {
    return await this.callFunction('ping');
  }

  async testTestPing() {
    return await this.callFunction('testPing');
  }

  async testSimpleTest() {
    return await this.callFunction('simpleTest');
  }

  async testGetAllTenants() {
    // This function requires authentication - we'll test without auth first to see the error
    return await this.callFunction('getAllTenants', {});
  }

  async testSearchTenants() {
    const searchData = {
      query: 'test',
      limit: 10
    };
    
    return await this.callFunction('searchTenants', searchData);
  }

  async testSendPropertyInvite() {
    const inviteData = {
      propertyId: TEST_DATA.propertyId,
      tenantEmail: TEST_DATA.tenantEmail,
      landlordEmail: TEST_DATA.landlordEmail,
      propertyName: 'Test Property',
      message: 'Welcome to our test property!'
    };
    
    return await this.callFunction('sendPropertyInvite', inviteData);
  }

  async testAcceptPropertyInvite() {
    const acceptData = {
      inviteCode: TEST_DATA.inviteCode,
      tenantId: 'test-tenant-123'
    };
    
    return await this.callFunction('acceptPropertyInvite', acceptData);
  }

  async testRejectPropertyInvite() {
    const rejectData = {
      inviteCode: TEST_DATA.inviteCode,
      tenantId: 'test-tenant-123',
      reason: 'Testing rejection flow'
    };
    
    return await this.callFunction('rejectPropertyInvite', rejectData);
  }

  async testAddContractorToRolodex() {
    const contractorData = {
      landlordId: 'test-landlord-123',
      contractorEmail: TEST_DATA.contractorEmail,
      contractorName: 'Test Contractor',
      specialty: 'Plumbing',
      phone: '(555) 123-4567'
    };
    
    return await this.callFunction('addContractorToRolodex', contractorData);
  }

  async testSendGridTest() {
    const emailData = {
      email: 'ben@propagenticai.com'  // Note: function expects 'email' field
    };
    
    return await this.callFunction('testSendGrid', emailData);
  }

  async testSendPropertyInvitationEmailManual() {
    const emailData = {
      tenantEmail: TEST_DATA.tenantEmail,
      landlordEmail: TEST_DATA.landlordEmail,
      propertyName: 'Test Property',
      inviteCode: TEST_DATA.inviteCode,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    return await this.callFunction('sendPropertyInvitationEmailManual', emailData);
  }

  async testClassifyMaintenanceRequest() {
    const requestData = {
      description: 'The kitchen sink is leaking and the water pressure is very low',
      propertyType: 'apartment',
      urgency: 'medium'
    };
    
    return await this.callFunction('classifyMaintenanceRequest', requestData);
  }

  async testSendInviteEmail() {
    const inviteData = {
      recipientEmail: TEST_DATA.tenantEmail,
      inviteCode: TEST_DATA.inviteCode,
      senderName: 'Test Landlord'
    };
    
    return await this.callFunction('sendInviteEmail', inviteData);
  }

  async testSendEmail() {
    const emailData = {
      to: 'ben@propagenticai.com',
      subject: 'Test Email from Functions Suite',
      text: 'This is a test email from the callable functions test suite',
      html: '<h1>Test Email</h1><p>This is a test email from the callable functions test suite</p>'
    };
    
    return await this.callFunction('sendEmail', emailData);
  }

  async testSendPropertyInviteEmail() {
    const emailData = {
      tenantEmail: TEST_DATA.tenantEmail,
      inviteCode: TEST_DATA.inviteCode,
      landlordName: 'Test Landlord',
      propertyAddress: '123 Test St',
      appUrl: 'https://propagentic.com'
    };
    
    return await this.callFunction('sendPropertyInviteEmail', emailData);
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting Firebase Callable Functions Test Suite');
    this.log(`📍 Testing functions via Firebase Admin SDK`);
    this.log(`🔥 Functions Emulator: ${TEST_CONFIG.emulatorUrl}`);
    this.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms per test\n`);

    const tests = [
      // Basic ping tests (should work without auth)
      { name: 'Basic Ping', fn: () => this.testPing() },
      { name: 'Test Ping', fn: () => this.testTestPing() },
      { name: 'Simple Test', fn: () => this.testSimpleTest() },
      
      // Email tests (some may work without auth depending on implementation)
      { name: 'SendGrid Email Test', fn: () => this.testSendGridTest() },
      { name: 'Send Email', fn: () => this.testSendEmail() },
      { name: 'Send Property Invite Email', fn: () => this.testSendPropertyInviteEmail() },
      { name: 'Send Invite Email', fn: () => this.testSendInviteEmail() },
      
      // AI/ML tests
      { name: 'Classify Maintenance Request', fn: () => this.testClassifyMaintenanceRequest() },
      
      // Auth-required tests (will likely fail with proper auth errors)
      { name: 'Get All Tenants', fn: () => this.testGetAllTenants() },
      { name: 'Search Tenants', fn: () => this.testSearchTenants() },
      
      // Property invitation tests
      { name: 'Send Property Invite', fn: () => this.testSendPropertyInvite() },
      { name: 'Accept Property Invite', fn: () => this.testAcceptPropertyInvite() },
      { name: 'Reject Property Invite', fn: () => this.testRejectPropertyInvite() },
      
      // Contractor tests
      { name: 'Add Contractor to Rolodex', fn: () => this.testAddContractorToRolodex() },
      
      // Email notification tests
      { name: 'Manual Property Invitation Email', fn: () => this.testSendPropertyInvitationEmailManual() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      const result = await this.runTest(test.name, test.fn);
      if (result !== null) {
        passed++;
      } else {
        failed++;
      }
      
      // Small delay between tests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.printSummary(passed, failed);
    return { passed, failed, total: tests.length };
  }

  printSummary(passed, failed) {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 CALLABLE FUNCTIONS TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`🔥 Functions Emulator: ${TEST_CONFIG.emulatorUrl}`);
    
    if (this.results.length > 0) {
      console.log('\n📋 DETAILED RESULTS:');
      console.log('-'.repeat(80));
      
      this.results.forEach((result, index) => {
        const status = result.status === 'PASSED' ? '✅' : '❌';
        console.log(`${(index + 1).toString().padStart(2)}. ${status} ${result.name} (${result.duration}ms)`);
        
        if (result.status === 'FAILED' && result.error) {
          console.log(`     Error: ${result.error}`);
        }
      });
    }
    
    if (failed === 0) {
      console.log('\n🎉 All tests passed!');
    } else if (passed > 0) {
      console.log(`\n🎯 ${passed} test(s) passed, ${failed} failed. Check errors above for details.`);
    } else {
      console.log(`\n⚠️  All ${failed} test(s) failed. Functions may not be running or may require authentication.`);
    }
    
    console.log('\n💡 NOTE: Some functions require authentication and may fail with "unauthenticated" errors.');
    console.log('💡 This is expected behavior for secure functions like getAllTenants and searchTenants.');
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  const tester = new CallableFunctionTester();
  
  try {
    const results = await tester.runAllTests();
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite execution failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { CallableFunctionTester, TEST_CONFIG, TEST_DATA };

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 