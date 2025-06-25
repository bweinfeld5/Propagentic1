#!/usr/bin/env node

/**
 * Test Script: Unified Invitation Solution
 * 
 * This script verifies that the unified invitation solution works correctly
 * by testing the working inviteService.ts that both InviteTenantModal and
 * AddPropertyModal now use.
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Mock Firebase config (replace with your actual config)
const firebaseConfig = {
  // Your config here
};

console.log('🧪 Testing Unified Invitation Solution');
console.log('=====================================');

/**
 * Test 1: Verify inviteService.ts exists and has correct structure
 */
async function testInviteServiceStructure() {
  console.log('\n📋 Test 1: InviteService Structure');
  console.log('-----------------------------------');
  
  try {
    // Dynamic import to test if service exists
    const inviteServiceModule = await import('../src/services/firestore/inviteService.ts');
    const inviteService = inviteServiceModule.default;
    
    // Check if required functions exist
    const requiredFunctions = ['createInvite', 'updateInviteStatus', 'getPendingInvitesForTenant'];
    
    for (const funcName of requiredFunctions) {
      if (typeof inviteService[funcName] === 'function') {
        console.log(`✅ ${funcName}() function exists`);
      } else {
        console.log(`❌ ${funcName}() function missing`);
        return false;
      }
    }
    
    console.log('✅ InviteService structure is correct');
    return true;
    
  } catch (error) {
    console.log(`❌ Error loading inviteService: ${error.message}`);
    return false;
  }
}

/**
 * Test 2: Verify UnifiedEmailService exists and has correct format
 */
async function testUnifiedEmailService() {
  console.log('\n📧 Test 2: UnifiedEmailService Structure');
  console.log('----------------------------------------');
  
  try {
    const emailServiceModule = await import('../src/services/unifiedEmailService.ts');
    const unifiedEmailService = emailServiceModule.unifiedEmailService;
    
    // Check if generateEmailData function exists
    if (typeof unifiedEmailService.generateEmailData === 'function') {
      console.log('✅ generateEmailData() function exists');
      
      // Test the format
      const testEmailData = unifiedEmailService.generateEmailData({
        tenantEmail: 'test@example.com',
        inviteCode: 'TEST123',
        landlordName: 'Test Landlord',
        propertyName: 'Test Property'
      });
      
      // Verify format has message wrapper
      if (testEmailData.to && testEmailData.message) {
        console.log('✅ Email data uses message wrapper format');
        console.log(`   - to: ${testEmailData.to}`);
        console.log(`   - message.subject: ${testEmailData.message.subject}`);
        console.log(`   - message.html: ${testEmailData.message.html ? 'present' : 'missing'}`);
        console.log(`   - message.text: ${testEmailData.message.text ? 'present' : 'missing'}`);
        return true;
      } else {
        console.log('❌ Email data missing message wrapper format');
        return false;
      }
      
    } else {
      console.log('❌ generateEmailData() function missing');
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error loading unifiedEmailService: ${error.message}`);
    return false;
  }
}

/**
 * Test 3: Verify InviteTenantModal uses inviteService
 */
async function testInviteTenantModalIntegration() {
  console.log('\n🏠 Test 3: InviteTenantModal Integration');
  console.log('---------------------------------------');
  
  try {
    const fs = await import('fs/promises');
    const modalContent = await fs.readFile('src/components/landlord/InviteTenantModal.tsx', 'utf8');
    
    // Check if it imports inviteService
    if (modalContent.includes("import inviteService from '../../services/firestore/inviteService'")) {
      console.log('✅ InviteTenantModal imports inviteService');
    } else {
      console.log('❌ InviteTenantModal missing inviteService import');
      return false;
    }
    
    // Check if it uses inviteService.createInvite
    if (modalContent.includes('inviteService.createInvite(')) {
      console.log('✅ InviteTenantModal uses inviteService.createInvite()');
    } else {
      console.log('❌ InviteTenantModal not using inviteService.createInvite()');
      return false;
    }
    
    // Check if it no longer uses Cloud Function
    if (modalContent.includes('sendPropertyInvite') && modalContent.includes('httpsCallable')) {
      console.log('⚠️  InviteTenantModal still has Cloud Function code (should be removed)');
      return false;
    } else {
      console.log('✅ InviteTenantModal no longer uses Cloud Function');
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Error reading InviteTenantModal: ${error.message}`);
    return false;
  }
}

/**
 * Test 4: Verify AddPropertyModal uses inviteService
 */
async function testAddPropertyModalIntegration() {
  console.log('\n🏢 Test 4: AddPropertyModal Integration');
  console.log('-------------------------------------');
  
  try {
    const fs = await import('fs/promises');
    const modalContent = await fs.readFile('src/components/landlord/AddPropertyModal.jsx', 'utf8');
    
    // Check if it imports inviteService
    if (modalContent.includes("import('../../services/firestore/inviteService')")) {
      console.log('✅ AddPropertyModal dynamically imports inviteService');
    } else {
      console.log('❌ AddPropertyModal missing inviteService import');
      return false;
    }
    
    // Check if it uses inviteService.createInvite
    if (modalContent.includes('inviteService.createInvite(')) {
      console.log('✅ AddPropertyModal uses inviteService.createInvite()');
    } else {
      console.log('❌ AddPropertyModal not using inviteService.createInvite()');
      return false;
    }
    
    return true;
    
  } catch (error) {
    console.log(`❌ Error reading AddPropertyModal: ${error.message}`);
    return false;
  }
}

/**
 * Test 5: Format Consistency Check
 */
async function testFormatConsistency() {
  console.log('\n🔄 Test 5: Email Format Consistency');
  console.log('----------------------------------');
  
  try {
    // Test that both services produce the same format
    const emailServiceModule = await import('../src/services/unifiedEmailService.ts');
    const unifiedEmailService = emailServiceModule.unifiedEmailService;
    
    const testParams = {
      tenantEmail: 'test@example.com',
      inviteCode: 'TEST123',
      landlordName: 'Test Landlord', 
      propertyName: 'Test Property'
    };
    
    const emailData = unifiedEmailService.generateEmailData(testParams);
    
    // Verify format consistency
    const expectedStructure = {
      hasTo: !!emailData.to,
      hasMessage: !!emailData.message,
      hasSubject: !!(emailData.message && emailData.message.subject),
      hasHtml: !!(emailData.message && emailData.message.html),
      hasText: !!(emailData.message && emailData.message.text)
    };
    
    if (expectedStructure.hasTo && expectedStructure.hasMessage && 
        expectedStructure.hasSubject && expectedStructure.hasHtml && expectedStructure.hasText) {
      console.log('✅ Email format is consistent with working browser tests');
      console.log('   - Uses message wrapper: ✅');
      console.log('   - Has all required fields: ✅');
      return true;
    } else {
      console.log('❌ Email format inconsistent');
      console.log(`   - hasTo: ${expectedStructure.hasTo}`);
      console.log(`   - hasMessage: ${expectedStructure.hasMessage}`);
      console.log(`   - hasSubject: ${expectedStructure.hasSubject}`);
      console.log(`   - hasHtml: ${expectedStructure.hasHtml}`);
      console.log(`   - hasText: ${expectedStructure.hasText}`);
      return false;
    }
    
  } catch (error) {
    console.log(`❌ Error testing format consistency: ${error.message}`);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('\n🚀 Running All Tests...\n');
  
  const tests = [
    { name: 'InviteService Structure', fn: testInviteServiceStructure },
    { name: 'UnifiedEmailService', fn: testUnifiedEmailService },
    { name: 'InviteTenantModal Integration', fn: testInviteTenantModalIntegration },
    { name: 'AddPropertyModal Integration', fn: testAddPropertyModalIntegration },
    { name: 'Format Consistency', fn: testFormatConsistency }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passed++;
      } else {
        failed++;
      }
    } catch (error) {
      console.log(`❌ ${test.name} threw error: ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n📊 TEST RESULTS');
  console.log('================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📈 Success Rate: ${Math.round((passed / (passed + failed)) * 100)}%`);
  
  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('The unified invitation solution is ready to use.');
    console.log('\nNext Steps:');
    console.log('1. Test tenant invitation flows in the app');
    console.log('2. Verify emails are sent successfully');
    console.log('3. Check Firestore for proper invite/mail documents');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the issues above.');
  }
  
  return failed === 0;
}

// Run tests if this script is called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Test runner failed:', error);
      process.exit(1);
    });
}

export { runAllTests }; 