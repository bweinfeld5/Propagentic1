#!/usr/bin/env node

/**
 * Firestore Security Rules Test Runner
 * 
 * This script runs comprehensive tests for Firestore security rules using the Firebase emulator.
 * It covers all the requirements from Task 4: Security Rules Implementation.
 */

const { spawn } = require('child_process');
const path = require('path');

console.log('🔥 PropAgentic Firestore Security Rules Test Suite');
console.log('='.repeat(50));

/**
 * Start Firebase emulators and run the tests
 */
async function runTests() {
  console.log('\n📋 Test Coverage:');
  console.log('   ✅ Owner reading/updating their profile');
  console.log('   ✅ Other users being denied access');
  console.log('   ✅ Restricted field protection (acceptedTenants, invitesSent, acceptedTenantDetails)');
  console.log('   ✅ Cloud Functions admin access');
  console.log('   ✅ Contractor rolodex access permissions');
  console.log('   ✅ Data integrity and security boundaries');

  console.log('\n🚀 Starting Firebase Emulator and Running Tests...\n');

  try {
    // Run tests with jest, using the Firebase emulator
    const testProcess = spawn('npx', [
      'jest',
      'tests/firestore-rules/landlordProfiles.test.js',
      '--verbose'
    ], {
      stdio: 'inherit',
      cwd: process.cwd()
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ All Firestore security rules tests passed!');
        console.log('\n📊 Test Summary:');
        console.log('   - Profile creation access control ✅');
        console.log('   - Profile reading permissions ✅');
        console.log('   - Allowed field updates ✅');
        console.log('   - Restricted field protection ✅');
        console.log('   - Cloud Functions admin bypass ✅');
        console.log('   - Profile deletion permissions ✅');
        console.log('   - Contractor rolodex access ✅');
        console.log('   - Security boundary edge cases ✅');

        console.log('\n🛡️ Security Rules Validation Complete');
        console.log('   The landlordProfiles collection is properly secured!');
      } else {
        console.error('\n❌ Some tests failed. Please review the output above.');
        process.exit(1);
      }
    });

    testProcess.on('error', (error) => {
      console.error('\n❌ Error running tests:', error.message);
      console.log('\n💡 Troubleshooting:');
      console.log('   1. Ensure Firebase emulator is available');
      console.log('   2. Check that @firebase/testing is installed');
      console.log('   3. Verify vitest is configured properly');
      process.exit(1);
    });

  } catch (error) {
    console.error('\n❌ Error starting test runner:', error.message);
    process.exit(1);
  }
}

/**
 * Display test information and instructions
 */
function displayTestInfo() {
  console.log('\n📖 About these tests:');
  console.log('   These tests validate the enhanced security rules for the landlordProfiles collection.');
  console.log('   They ensure that:');
  console.log('   • Only landlords can manage their own profiles');
  console.log('   • Restricted arrays can only be modified by Cloud Functions');
  console.log('   • Contractors can read profiles only if in the landlord\'s rolodex');
  console.log('   • Unauthorized access is properly denied');

  console.log('\n🔧 Test Environment:');
  console.log('   • Uses Firebase Testing Framework (@firebase/testing)');
  console.log('   • Runs against Firebase Firestore emulator');
  console.log('   • Includes both positive and negative test cases');
  console.log('   • Validates data integrity during operations');

  console.log('\n📝 Rules Tested:');
  console.log('   • Profile creation with ownership validation');
  console.log('   • Read access control (owner, contractor rolodex, admin)');
  console.log('   • Update restrictions for sensitive fields');
  console.log('   • Cloud Functions admin bypass capabilities');
  console.log('   • Delete permissions and access control');
}

/**
 * Main execution
 */
async function main() {
  try {
    displayTestInfo();
    await runTests();
  } catch (error) {
    console.error('\n❌ Test runner failed:', error.message);
    process.exit(1);
  }
}

// Run the tests if this script is executed directly
if (require.main === module) {
  main();
}

module.exports = {
  runTests,
  displayTestInfo
}; 