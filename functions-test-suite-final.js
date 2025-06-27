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

class ComprehensiveFunctionTester {
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
        const resultStr = JSON.stringify(result, null, 2);
        if (resultStr.length > 800) {
          this.log(`   Response: ${resultStr.substring(0, 800)}...`);
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

  // Test Functions (Fixed based on previous results)
  async testPing() {
    return await this.callFunction('ping');
  }

  async testTestPing() {
    return await this.callFunction('testPing');
  }

  async testSimpleTest() {
    return await this.callFunction('simpleTest');
  }

  async testPingTest() {
    // This is the standalone pingTest function we saw in the list
    return await this.callFunction('pingTest');
  }

  async testSendGridTest() {
    // Fix: The function expects 'email' not as nested data
    return await this.callFunction('testSendGrid', { email: 'ben@propagenticai.com' });
  }

  async testGetAllTenants() {
    // Expected to fail with authentication error
    return await this.callFunction('getAllTenants', {});
  }

  async testSearchTenants() {
    // Expected to fail with authentication error
    const searchData = { query: 'test', limit: 10 };
    return await this.callFunction('searchTenants', searchData);
  }

  async testSendPropertyInvite() {
    // Expected to fail with authentication error
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
    // Expected to fail with authentication error
    const acceptData = {
      inviteCode: TEST_DATA.inviteCode,
      tenantId: 'test-tenant-123'
    };
    
    return await this.callFunction('acceptPropertyInvite', acceptData);
  }

  async testRejectPropertyInvite() {
    // Expected to fail with authentication error
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

  async testClassifyMaintenanceRequestV1() {
    // The actual function name has -0 suffix (version 1)
    const requestData = {
      description: 'The kitchen sink is leaking and the water pressure is very low',
      propertyType: 'apartment',
      urgency: 'medium'
    };
    
    return await this.callFunction('classifyMaintenanceRequest-0', requestData);
  }

  async testSendInviteEmailV1() {
    // The actual function name has -0 suffix (version 1)
    const inviteData = {
      recipientEmail: TEST_DATA.tenantEmail,
      inviteCode: TEST_DATA.inviteCode,
      senderName: 'Test Landlord'
    };
    
    return await this.callFunction('sendInviteEmail-0', inviteData);
  }

  async testSendPropertyInvitationEmailV1() {
    // The actual function name has -0 suffix (version 1)
    const emailData = {
      tenantEmail: TEST_DATA.tenantEmail,
      landlordEmail: TEST_DATA.landlordEmail,
      propertyName: 'Test Property',
      inviteCode: TEST_DATA.inviteCode,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    return await this.callFunction('sendPropertyInvitationEmail-0', emailData);
  }

  async testSendPropertyInvitationEmailManual() {
    // Expected to fail with authentication error
    const emailData = {
      tenantEmail: TEST_DATA.tenantEmail,
      landlordEmail: TEST_DATA.landlordEmail,
      propertyName: 'Test Property',
      inviteCode: TEST_DATA.inviteCode,
      expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };
    
    return await this.callFunction('sendPropertyInvitationEmailManual', emailData);
  }

  async testCreateNotificationOnInviteV1() {
    // The actual function name has -0 suffix (version 1)
    const notificationData = {
      inviteId: 'test-invite-123',
      tenantEmail: TEST_DATA.tenantEmail,
      landlordName: 'Test Landlord'
    };
    
    return await this.callFunction('createNotificationOnInvite-0', notificationData);
  }

  // Run all tests
  async runAllTests() {
    this.log('🚀 Starting Comprehensive Firebase Functions Test Suite');
    this.log(`📍 Testing functions at: ${BASE_URL}`);
    this.log(`⏱️  Timeout: ${TEST_CONFIG.timeout}ms per test\n`);

    const tests = [
      // ✅ Working Functions (from previous test)
      { name: 'Basic Ping', fn: () => this.testPing(), expectAuth: false, category: 'Core' },
      { name: 'Test Ping', fn: () => this.testTestPing(), expectAuth: false, category: 'Core' },
      { name: 'Simple Test', fn: () => this.testSimpleTest(), expectAuth: false, category: 'Core' },
      { name: 'Ping Test (Standalone)', fn: () => this.testPingTest(), expectAuth: false, category: 'Core' },
      { name: 'Add Contractor to Rolodex', fn: () => this.testAddContractorToRolodex(), expectAuth: false, category: 'Business Logic' },
      
      // 🔧 Fixed Function Calls
      { name: 'SendGrid Email Test (Fixed)', fn: () => this.testSendGridTest(), expectAuth: false, category: 'Email' },
      
      // 📧 Email Functions with Version Suffixes
      { name: 'Send Invite Email v1', fn: () => this.testSendInviteEmailV1(), expectAuth: false, category: 'Email' },
      { name: 'Send Property Invitation Email v1', fn: () => this.testSendPropertyInvitationEmailV1(), expectAuth: false, category: 'Email' },
      { name: 'Create Notification On Invite v1', fn: () => this.testCreateNotificationOnInviteV1(), expectAuth: false, category: 'Notifications' },
      
      // 🤖 AI/ML Functions with Version Suffixes  
      { name: 'Classify Maintenance Request v1', fn: () => this.testClassifyMaintenanceRequestV1(), expectAuth: false, category: 'AI/ML' },
      
      // 🔒 Auth-Required Functions (Expected to fail with authentication errors)
      { name: 'Get All Tenants', fn: () => this.testGetAllTenants(), expectAuth: true, category: 'Auth Required' },
      { name: 'Search Tenants', fn: () => this.testSearchTenants(), expectAuth: true, category: 'Auth Required' },
      { name: 'Send Property Invite', fn: () => this.testSendPropertyInvite(), expectAuth: true, category: 'Auth Required' },
      { name: 'Accept Property Invite', fn: () => this.testAcceptPropertyInvite(), expectAuth: true, category: 'Auth Required' },
      { name: 'Reject Property Invite', fn: () => this.testRejectPropertyInvite(), expectAuth: true, category: 'Auth Required' },
      { name: 'Manual Property Invitation Email', fn: () => this.testSendPropertyInvitationEmailManual(), expectAuth: true, category: 'Auth Required' }
    ];

    let passed = 0;
    let failed = 0;
    let authRequired = 0;
    
    const categoryStats = {};

    for (const test of tests) {
      const result = await this.runTest(test.name, test.fn);
      
      // Initialize category if not exists
      if (!categoryStats[test.category]) {
        categoryStats[test.category] = { passed: 0, failed: 0, authRequired: 0 };
      }
      
      if (result !== null) {
        passed++;
        categoryStats[test.category].passed++;
      } else {
        // Check if it's an expected auth failure
        const lastResult = this.results[this.results.length - 1];
        if (test.expectAuth && lastResult.error.includes('Authentication required')) {
          authRequired++;
          categoryStats[test.category].authRequired++;
          this.log(`   🔒 Expected authentication failure for secure function`);
        } else {
          failed++;
          categoryStats[test.category].failed++;
        }
      }
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    this.printSummary(passed, failed, authRequired, categoryStats);
    return { passed, failed, authRequired, total: tests.length, categoryStats };
  }

  printSummary(passed, failed, authRequired, categoryStats) {
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n' + '='.repeat(80));
    console.log('📊 COMPREHENSIVE FIREBASE FUNCTIONS TEST SUITE SUMMARY');
    console.log('='.repeat(80));
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`🔒 Auth Required: ${authRequired}`);
    console.log(`⏱️  Total Time: ${totalTime}ms`);
    console.log(`📍 Functions URL: ${BASE_URL}`);
    
    // Category breakdown
    console.log('\n📋 RESULTS BY CATEGORY:');
    console.log('-'.repeat(80));
    Object.entries(categoryStats).forEach(([category, stats]) => {
      const total = stats.passed + stats.failed + stats.authRequired;
      console.log(`${category}: ✅${stats.passed} ❌${stats.failed} 🔒${stats.authRequired} (Total: ${total})`);
    });
    
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
            console.log(`     Error: ${result.error.substring(0, 100)}${result.error.length > 100 ? '...' : ''}`);
          }
        }
      });
    }
    
    const workingFunctions = passed;
    const totalTests = passed + failed + authRequired;
    
    console.log('\n🎯 FINAL ANALYSIS:');
    console.log('-'.repeat(40));
    if (workingFunctions > 0) {
      console.log(`🎉 ${workingFunctions} functions are working correctly without authentication!`);
    }
    if (authRequired > 0) {
      console.log(`🔒 ${authRequired} functions require authentication (expected for secure functions)`);
    }
    if (failed > 0) {
      console.log(`⚠️  ${failed} functions have unexpected errors that need investigation`);
    }
    
    const successRate = Math.round(((workingFunctions + authRequired) / totalTests) * 100);
    console.log(`📈 Overall Success Rate: ${successRate}% (${workingFunctions + authRequired}/${totalTests} functions working as expected)`);
    
    console.log('\n💡 NOTES:');
    console.log('• Functions showing 🔒 are working correctly but require authentication');
    console.log('• This is expected security behavior for sensitive operations');
    console.log('• Functions with -0 suffix are Firebase Functions v1 (legacy)');
    console.log('• Functions without suffix are Firebase Functions v2 (modern)');
    console.log('='.repeat(80));
  }
}

// Main execution
async function main() {
  const tester = new ComprehensiveFunctionTester();
  
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
module.exports = { ComprehensiveFunctionTester, TEST_CONFIG, TEST_DATA, EMULATOR_CONFIG };

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
} 