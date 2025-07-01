const axios = require('axios');

// Firebase Functions Emulator Base URL
const FUNCTIONS_BASE_URL = 'http://127.0.0.1:5001/propagentic/us-central1';

// Test configuration
const TEST_CONFIG = {
  timeout: 30000, // 30 seconds timeout for each test
  retries: 2,
  verbose: true
};

// Test data
const TEST_DATA = {
  landlordEmail: 'test-landlord@propagenticai.com',
  tenantEmail: 'test-tenant@propagenticai.com',
  contractorEmail: 'test-contractor@propagenticai.com',
  propertyId: 'test-property-123',
  inviteCode: 'TEST-' + Date.now()
};

class FunctionTester {
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
      
      if (error.response?.data) {
        this.log(`   Response Data: ${JSON.stringify(error.response.data, null, 2)}`);
      }
      
      throw error;
    }
  }

  async makeRequest(method, endpoint, data = null, headers = {}) {
    const url = `${FUNCTIONS_BASE_URL}/${endpoint}`;
    
    const config = {
      method,
      url,
      timeout: TEST_CONFIG.timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    this.log(`📡 ${method.toUpperCase()} ${url}`);
    if (data) {
      this.log(`   Payload: ${JSON.stringify(data, null, 2)}`);
    }
    
    const response = await axios(config);
    return response.data;
  }

  // Test Functions
  async testPing() {
    return await this.makeRequest('GET', 'ping');
  }

  async testTestPing() {
    return await this.makeRequest('GET', 'testPing');
  }

  async testSimpleTest() {
    return await this.makeRequest('GET', 'simpleTest');
  }

  async testGetAllTenants() {
    // This requires authentication, so we'll test with mock data
    const mockAuthHeader = {
      'Authorization': 'Bearer mock-token',
      'X-Test-User-Id': 'test-landlord-123',
      'X-Test-User-Role': 'landlord'
    };
    
    return await this.makeRequest('POST', 'getAllTenants', {}, mockAuthHeader);
  }

  async testSearchTenants() {
    const mockAuthHeader = {
      'Authorization': 'Bearer mock-token',
      'X-Test-User-Id': 'test-landlord-123',
      'X-Test-User-Role': 'landlord'
    };
    
    const searchData = {
      searchTerm: 'test',
      limit: 10
    };
    
    return await this.makeRequest('POST', 'searchTenants', searchData, mockAuthHeader);
  }

  async testSendPropertyInvite() {
    const inviteData = {
      propertyId: TEST_DATA.propertyId,
      tenantEmail: TEST_DATA.tenantEmail,
      landlordEmail: TEST_DATA.landlordEmail,
      propertyName: 'Test Property',
      message: 'Welcome to our test property!'
    };
    
    return await this.makeRequest('POST', 'sendPropertyInvite', inviteData);
  }

  async testAcceptPropertyInvite() {
    const acceptData = {
      inviteCode: TEST_DATA.inviteCode,
      tenantId: 'test-tenant-123'
    };
    
    return await this.makeRequest('POST', 'acceptPropertyInvite', acceptData);
  }

  async testRejectPropertyInvite() {
    const rejectData = {
      inviteCode: TEST_DATA.inviteCode,
      tenantId: 'test-tenant-123',
      reason: 'Testing rejection flow'
    };
    
    return await this.makeRequest('POST', 'rejectPropertyInvite', rejectData);
  }

  async testAddContractorToRolodex() {
    const contractorData = {
      landlordId: 'test-landlord-123',
      contractorEmail: TEST_DATA.contractorEmail,
      contractorName: 'Test Contractor',
      specialty: 'Plumbing',
      phone: '(555) 123-4567'
    };
    
    return await this.makeRequest('POST', 'addContractorToRolodex', contractorData);
  }

  async testSendGridTest() {
    const emailData = {
      to: 'ben@propagenticai.com',
      subject: 'Function Test Email',
      message: 'This is a test email from the functions test suite'
    };
    
    return await this.makeRequest('POST', 'testSendGrid', emailData);
  }

  async testSendPropertyInvitationEmailManual() {
    const emailData = {
      tenantEmail: TEST_DATA.tenantEmail,
      landlordEmail: TEST_DATA.landlordEmail,
      propertyName: 'Test Property',
      inviteCode: TEST_DATA.inviteCode,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    return await this.makeRequest('POST', 'sendPropertyInvitationEmailManual', emailData);
  }

  async testPingTestStandalone() {
    return await this.makeRequest('GET', 'pingTest');
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting Firebase Functions Test Suite');
    this.log(`📍 Testing functions at: ${FUNCTIONS_BASE_URL}`);
    this.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms per test\n`);

    const tests = [
      // Basic ping tests
      { name: 'Basic Ping', fn: () => this.testPing() },
      { name: 'Test Ping', fn: () => this.testTestPing() },
      { name: 'Simple Test', fn: () => this.testSimpleTest() },
      { name: 'Standalone Ping Test', fn: () => this.testPingTestStandalone() },
      
      // Tenant service tests
      { name: 'Get All Tenants', fn: () => this.testGetAllTenants() },
      { name: 'Search Tenants', fn: () => this.testSearchTenants() },
      
      // Property invitation tests
      { name: 'Send Property Invite', fn: () => this.testSendPropertyInvite() },
      { name: 'Accept Property Invite', fn: () => this.testAcceptPropertyInvite() },
      { name: 'Reject Property Invite', fn: () => this.testRejectPropertyInvite() },
      
      // Contractor tests
      { name: 'Add Contractor to Rolodex', fn: () => this.testAddContractorToRolodex() },
      
      // Email tests
      { name: 'SendGrid Email Test', fn: () => this.testSendGridTest() },
      { name: 'Manual Property Invitation Email', fn: () => this.testSendPropertyInvitationEmailManual() }
    ];

    let passed = 0;
    let failed = 0;

    for (const test of tests) {
      try {
        await this.runTest(test.name, test.fn);
        passed++;
      } catch (error) {
        failed++;
        // Continue with other tests even if one fails
      }
      
      // Small delay between tests to avoid overwhelming the server
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    this.printSummary(passed, failed);
  }

  printSummary(passed, failed) {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📍 Functions URL: ${FUNCTIONS_BASE_URL}`);
    
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
    } else {
      console.log(`\n⚠️  ${failed} test(s) failed. Check the errors above.`);
    }
    
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  const tester = new FunctionTester();
  
  try {
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Test suite execution failed:', error.message);
    process.exit(1);
  }
}

// Export for programmatic use
module.exports = { FunctionTester, TEST_CONFIG, TEST_DATA };

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 