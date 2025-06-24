const axios = require('axios');

// Firebase Functions Emulator configuration
const EMULATOR_CONFIG = {
  host: '127.0.0.1',
  port: 5001,
  projectId: 'propagentic',
  region: 'us-central1'
};

const BASE_URL = `http://${EMULATOR_CONFIG.host}:${EMULATOR_CONFIG.port}/${EMULATOR_CONFIG.projectId}/${EMULATOR_CONFIG.region}`;

// Test configuration
const TEST_CONFIG = {
  timeout: 30000,
  verbose: true
};

// Test data
const TEST_DATA = {
  landlordEmail: 'justin@propagenticai.com',
  tenantEmail: 'ben@propagenticai.com',
  contractorEmail: 'test-contractor@propagenticai.com',
  propertyId: 'test-property-123',
  inviteCode: 'TEST-' + Date.now()
};

class SimpleFunctionTester {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
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
        // Truncate large responses
        const resultStr = JSON.stringify(result, null, 2);
        if (resultStr.length > 500) {
          this.log(`   Response: ${resultStr.substring(0, 500)}...`);
        } else {
          this.log(`   Response: ${resultStr}`);
        }
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
      
      if (error.response?.data) {
        this.log(`   Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      
      return null;
    }
  }

  async callFunction(functionName, data = {}) {
    const url = `${BASE_URL}/${functionName}`;
    
    this.log(`📞 Calling function: ${functionName}`);
    if (Object.keys(data).length > 0) {
      this.log(`   Data: ${JSON.stringify(data, null, 2)}`);
    }
    
    try {
      // For Firebase Functions v2 callable functions, we need to send data in the request body
      // with the correct content type
      const response = await axios.post(url, {
        data: data
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: TEST_CONFIG.timeout
      });
      
      return response.data;
    } catch (error) {
      if (error.response) {
        // Check if it's an expected authentication error
        if (error.response.status === 401 || 
            (error.response.data && error.response.data.error && 
             error.response.data.error.status === 'UNAUTHENTICATED')) {
          this.log(`🔒 Authentication required (expected for secure functions)`);
          throw new Error(`Authentication required: ${error.response.data.error.message}`);
        }
      }
      
      this.log(`❌ Function call failed: ${error.message}`);
      throw error;
    }
  }

  // Test Functions
  async testPing() {
    return await this.callFunction('ping');
  }

  async testTestPing() {
    return await this.callFunction('testPing');
  }

  async testSimpleTest() {
    return await this.callFunction('simpleTest');
  }

  async testSendGridTest() {
    const emailData = {
      email: 'ben@propagenticai.com'
    };
    
    return await this.callFunction('testSendGrid', emailData);
  }

  async testGetAllTenants() {
    // This will fail with authentication error (expected)
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
      subject: 'Test Email from Simple Functions Suite',
      text: 'This is a test email from the simple functions test suite',
      html: '<h1>Test Email</h1><p>This is a test email from the simple functions test suite</p>'
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

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting Simple Firebase Functions Test Suite');
    this.log(`📍 Testing functions at: ${BASE_URL}`);
    this.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms per test\n`);

    const tests = [
      // Basic ping tests (should work without auth)
      { name: 'Basic Ping', fn: () => this.testPing(), expectAuth: false },
      { name: 'Test Ping', fn: () => this.testTestPing(), expectAuth: false },
      { name: 'Simple Test', fn: () => this.testSimpleTest(), expectAuth: false },
      
      // Email tests (may require auth depending on implementation)
      { name: 'SendGrid Email Test', fn: () => this.testSendGridTest(), expectAuth: false },
      { name: 'Send Email', fn: () => this.testSendEmail(), expectAuth: false },
      { name: 'Send Property Invite Email', fn: () => this.testSendPropertyInviteEmail(), expectAuth: false },
      { name: 'Send Invite Email', fn: () => this.testSendInviteEmail(), expectAuth: false },
      { name: 'Manual Property Invitation Email', fn: () => this.testSendPropertyInvitationEmailManual(), expectAuth: false },
      
      // AI/ML tests
      { name: 'Classify Maintenance Request', fn: () => this.testClassifyMaintenanceRequest(), expectAuth: false },
      
      // Auth-required tests (will fail with proper auth errors)
      { name: 'Get All Tenants', fn: () => this.testGetAllTenants(), expectAuth: true },
      { name: 'Search Tenants', fn: () => this.testSearchTenants(), expectAuth: true },
      
      // Property invitation tests (may require auth)
      { name: 'Send Property Invite', fn: () => this.testSendPropertyInvite(), expectAuth: true },
      { name: 'Accept Property Invite', fn: () => this.testAcceptPropertyInvite(), expectAuth: true },
      { name: 'Reject Property Invite', fn: () => this.testRejectPropertyInvite(), expectAuth: true },
      
      // Contractor tests (may require auth)
      { name: 'Add Contractor to Rolodex', fn: () => this.testAddContractorToRolodex(), expectAuth: true }
    ];

    let passed = 0;
    let failed = 0;
    let authRequired = 0;

    for (const test of tests) {
      const result = await this.runTest(test.name, test.fn);
      if (result !== null) {
        passed++;
      } else {
        // Check if it's an expected auth failure
        const lastResult = this.results[this.results.length - 1];
        if (test.expectAuth && lastResult.error.includes('Authentication required')) {
          authRequired++;
          this.log(`   🔒 Expected authentication failure for secure function`);
        } else {
          failed++;
        }
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    this.printSummary(passed, failed, authRequired);
    return { passed, failed, authRequired, total: tests.length };
  }

  printSummary(passed, failed, authRequired) {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 SIMPLE FUNCTIONS TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🔒 Auth Required: ${authRequired}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📍 Functions URL: ${BASE_URL}`);
    
    if (this.results.length > 0) {
      console.log('\n📋 DETAILED RESULTS:');
      console.log('-'.repeat(80));
      
      this.results.forEach((result, index) => {
        const status = result.status === 'PASSED' ? '✅' : 
                      result.error && result.error.includes('Authentication required') ? '🔒' : '❌';
        console.log(`${(index + 1).toString().padStart(2)}. ${status} ${result.name} (${result.duration}ms)`);
        
        if (result.status === 'FAILED' && result.error) {
          if (result.error.includes('Authentication required')) {
            console.log(`     Expected: Authentication required for secure function`);
          } else {
            console.log(`     Error: ${result.error}`);
          }
        }
      });
    }
    
    const workingFunctions = passed;
    const totalTests = passed + failed + authRequired;
    
    if (workingFunctions > 0) {
      console.log(`\n🎉 ${workingFunctions} functions are working correctly!`);
    }
    if (authRequired > 0) {
      console.log(`🔒 ${authRequired} functions require authentication (expected for secure functions)`);
    }
    if (failed > 0) {
      console.log(`⚠️  ${failed} functions have unexpected errors`);
    }
    
    console.log('\n💡 NOTE: Functions requiring authentication will show 🔒 (this is expected security behavior)');
    console.log('💡 To test authenticated functions, you would need to set up proper Firebase Auth tokens');
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  const tester = new SimpleFunctionTester();
  
  try {
    const results = await tester.runAllTests();
    // Exit with success if we have working functions, even if some require auth
    process.exit(results.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('❌ Test suite execution failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { SimpleFunctionTester, TEST_CONFIG, TEST_DATA, EMULATOR_CONFIG };

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 