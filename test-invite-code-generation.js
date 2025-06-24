#!/usr/bin/env node

/**
 * Comprehensive Test Script for Invite Code Generation
 * Tests the complete flow from frontend to Firebase Functions
 */

const https = require('https');
const http = require('http');

// Test configuration
const CONFIG = {
  // Production Firebase Function URL
  PRODUCTION_URL: 'https://us-central1-propagentic.cloudfunctions.net/generateInviteCode',
  
  // Local Firebase Function URL (for emulator testing)
  LOCAL_URL: 'http://127.0.0.1:5001/propagentic/us-central1/generateInviteCode',
  
  // Test Firebase credentials (replace with actual test token)
  TEST_TOKEN: 'your-test-firebase-id-token-here',
  
  // Test data
  TEST_DATA: {
    propertyId: 'test-property-123',
    unitId: 'unit-101',
    email: 'test@example.com',
    expirationDays: 7
  }
};

console.log('🧪 Starting Invite Code Generation Test Suite\n');

// Helper function to make HTTP requests
function makeRequest(url, options, postData) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const req = protocol.request(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const result = {
            statusCode: res.statusCode,
            headers: res.headers,
            body: data,
            parsed: null
          };
          
          // Try to parse JSON response
          try {
            result.parsed = JSON.parse(data);
          } catch (e) {
            // Not JSON, keep as string
          }
          
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    if (postData) {
      req.write(postData);
    }
    
    req.end();
  });
}

// Test 1: Check if Firebase Function is accessible
async function testFunctionAccessibility() {
  console.log('🔍 Test 1: Function Accessibility');
  
  try {
    // Test OPTIONS request (CORS preflight)
    const optionsResult = await makeRequest(CONFIG.PRODUCTION_URL, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://propagentic.web.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });
    
    console.log('✅ OPTIONS Request Status:', optionsResult.statusCode);
    console.log('   CORS Headers:', {
      'Access-Control-Allow-Origin': optionsResult.headers['access-control-allow-origin'],
      'Access-Control-Allow-Methods': optionsResult.headers['access-control-allow-methods'],
      'Access-Control-Allow-Headers': optionsResult.headers['access-control-allow-headers']
    });
    
    return optionsResult.statusCode === 204;
  } catch (error) {
    console.log('❌ Function Accessibility Error:', error.message);
    return false;
  }
}

// Test 2: Test without authentication (should fail with 401)
async function testWithoutAuth() {
  console.log('\n🔍 Test 2: Request Without Authentication');
  
  try {
    const result = await makeRequest(CONFIG.PRODUCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'https://propagentic.web.app'
      }
    }, JSON.stringify(CONFIG.TEST_DATA));
    
    console.log('✅ Status Code:', result.statusCode);
    console.log('   Response:', result.parsed || result.body);
    
    return result.statusCode === 401;
  } catch (error) {
    console.log('❌ Test Without Auth Error:', error.message);
    return false;
  }
}

// Test 3: Test with invalid token format
async function testWithInvalidToken() {
  console.log('\n🔍 Test 3: Request With Invalid Token Format');
  
  try {
    const result = await makeRequest(CONFIG.PRODUCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid-token-format',
        'Origin': 'https://propagentic.web.app'
      }
    }, JSON.stringify(CONFIG.TEST_DATA));
    
    console.log('✅ Status Code:', result.statusCode);
    console.log('   Response:', result.parsed || result.body);
    
    return result.statusCode === 401;
  } catch (error) {
    console.log('❌ Test With Invalid Token Error:', error.message);
    return false;
  }
}

// Test 4: Test with missing required fields
async function testWithMissingFields() {
  console.log('\n🔍 Test 4: Request With Missing Required Fields');
  
  try {
    const incompleteData = {
      // Missing propertyId
      unitId: 'unit-101',
      email: 'test@example.com'
    };
    
    const result = await makeRequest(CONFIG.PRODUCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token-for-missing-field-test',
        'Origin': 'https://propagentic.web.app'
      }
    }, JSON.stringify(incompleteData));
    
    console.log('✅ Status Code:', result.statusCode);
    console.log('   Response:', result.parsed || result.body);
    
    return result.statusCode === 400;
  } catch (error) {
    console.log('❌ Test With Missing Fields Error:', error.message);
    return false;
  }
}

// Test 5: Test local Firebase Functions emulator (if running)
async function testLocalEmulator() {
  console.log('\n🔍 Test 5: Local Firebase Functions Emulator');
  
  try {
    const result = await makeRequest(CONFIG.LOCAL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer dummy-token-for-emulator-test',
        'Origin': 'http://localhost:3000'
      }
    }, JSON.stringify(CONFIG.TEST_DATA));
    
    console.log('✅ Local Emulator Status:', result.statusCode);
    console.log('   Response:', result.parsed || result.body);
    
    return true;
  } catch (error) {
    console.log('❌ Local Emulator Not Running or Error:', error.message);
    return false;
  }
}

// Test 6: Validate Firebase Token Format
function testTokenFormat() {
  console.log('\n🔍 Test 6: Firebase Token Format Validation');
  
  if (CONFIG.TEST_TOKEN === 'your-test-firebase-id-token-here') {
    console.log('❌ Please replace TEST_TOKEN with a real Firebase ID token');
    console.log('   You can get one from:');
    console.log('   - Browser DevTools → Application → Storage → Firebase Auth');
    console.log('   - Or run: firebase auth:print-access-token');
    return false;
  }
  
  // Basic JWT format check (3 parts separated by dots)
  const parts = CONFIG.TEST_TOKEN.split('.');
  if (parts.length !== 3) {
    console.log('❌ Invalid JWT format - should have 3 parts separated by dots');
    return false;
  }
  
  try {
    // Try to decode the header (first part)
    const header = JSON.parse(Buffer.from(parts[0], 'base64').toString());
    console.log('✅ Token header decoded:', { alg: header.alg, typ: header.typ });
    
    // Try to decode the payload (second part)
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
    console.log('✅ Token payload info:', {
      iss: payload.iss,
      aud: payload.aud,
      exp: new Date(payload.exp * 1000).toISOString(),
      uid: payload.uid || 'Not present'
    });
    
    return true;
  } catch (error) {
    console.log('❌ Token decode error:', error.message);
    return false;
  }
}

// Test 7: Check Firebase Functions logs
async function checkFunctionLogs() {
  console.log('\n🔍 Test 7: Firebase Functions Logs Check');
  console.log('💡 To check Firebase Functions logs:');
  console.log('');
  console.log('   Run: firebase functions:log --only generateInviteCode');
  console.log('   Or: firebase functions:log --limit 50');
  console.log('');
  console.log('   Look for errors like:');
  console.log('   - Token verification failures');
  console.log('   - Missing property errors');
  console.log('   - Database permission errors');
}

// Test 8: Check Firestore permissions
async function checkFirestorePermissions() {
  console.log('\n🔍 Test 8: Firestore Permissions Analysis');
  console.log('');
  console.log('   Based on your error logs, you have permission issues:');
  console.log('   - "Missing or insufficient permissions"');
  console.log('   - Missing index for notifications collection');
  console.log('');
  console.log('   Required Firestore indexes:');
  console.log('   - notifications: userId, createdAt, __name__');
  console.log('');
  console.log('   To fix:');
  console.log('   1. Visit: https://console.firebase.google.com/project/propagentic/firestore/indexes');
  console.log('   2. Add composite index for notifications collection');
  console.log('   3. Check firestore.rules for proper permissions');
  console.log('');
  console.log('   Missing index URL from your logs:');
  console.log('   https://console.firebase.google.com/v1/r/project/propagentic/firestore/indexes?create_composite=ClFwcm9qZWN0cy9wcm9wYWdlbnRpYy9kYXRhYmFzZXMvKGRlZmF1bHQpL2NvbGxlY3Rpb25Hcm91cHMvbm90aWZpY2F0aW9ucy9pbmRleGVzL18QARoKCgZ1c2VySWQQARoNCgljcmVhdGVkQXQQAhoMCghfX25hbWVfXxAC');
}

// Test 9: Common issues analysis
async function analyzeCommonIssues() {
  console.log('\n🔍 Test 9: Common Issues Analysis');
  console.log('');
  console.log('   Based on your "invalid-argument" error, check:');
  console.log('');
  console.log('   ❌ Possible causes:');
  console.log('   1. Missing propertyId in request data');
  console.log('   2. Property doesn\'t exist in Firestore');
  console.log('   3. User doesn\'t have access to the property');
  console.log('   4. Invalid Firebase ID token');
  console.log('   5. User role is not "landlord" or "admin"');
  console.log('');
  console.log('   ✅ Solutions:');
  console.log('   1. Ensure propertyId is included in request');
  console.log('   2. Verify property exists in Firestore');
  console.log('   3. Check user has ownerId or landlordId matching');
  console.log('   4. Use valid Firebase ID token');
  console.log('   5. Ensure user role is set correctly');
}

// Main test runner
async function runAllTests() {
  console.log('🚀 PropAgentic Invite Code Generation Test Suite');
  console.log('='.repeat(50));
  
  const results = [];
  
  // Run accessibility test
  results.push(await testFunctionAccessibility());
  
  // Run authentication tests
  results.push(await testWithoutAuth());
  results.push(await testWithInvalidToken());
  
  // Run data validation tests
  results.push(await testWithMissingFields());
  
  // Run token validation
  results.push(testTokenFormat());
  
  // Run local emulator test
  results.push(await testLocalEmulator());
  
  // Check Firebase Functions logs
  await checkFunctionLogs();
  
  // Check Firestore permissions
  await checkFirestorePermissions();
  
  // Analyze common issues
  await analyzeCommonIssues();
  
  // Summary
  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(30));
  
  const passed = results.filter(r => r === true).length;
  const total = results.length;
  
  console.log(`✅ Tests Passed: ${passed}/${total}`);
  
  console.log('\n🔧 Immediate Actions to Fix "invalid-argument" Error:');
  console.log('');
  console.log('1. 🔑 Get a real Firebase ID token:');
  console.log('   - Login to https://propagentic.web.app');
  console.log('   - Open DevTools → Application → Local Storage');
  console.log('   - Look for Firebase Auth token');
  console.log('   - Replace TEST_TOKEN in this script');
  console.log('');
  console.log('2. 🏠 Ensure you have a property:');
  console.log('   - Create a property in the app first');
  console.log('   - Note the property ID');
  console.log('   - Use that property ID in the test');
  console.log('');
  console.log('3. 🎯 Add missing Firestore index:');
  console.log('   - Click the index URL shown above');
  console.log('   - This will fix notification permission errors');
  console.log('');
  console.log('4. 📋 Check Firebase Functions logs:');
  console.log('   - Run: firebase functions:log --only generateInviteCode');
  console.log('   - Look for detailed error messages');
  console.log('');
  console.log('5. 🧪 Test locally first:');
  console.log('   - Run: firebase emulators:start');
  console.log('   - Test with local functions');
  
  console.log('\n🎯 Next Steps:');
  console.log('1. Fix the Firestore index by clicking the URL above');
  console.log('2. Get a real Firebase ID token and update this test');
  console.log('3. Re-run this test with: node test-invite-code-generation.js');
  console.log('4. Check Firebase Functions logs for detailed errors');
  console.log('5. Test QR code generation from the actual app');
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  runAllTests,
  CONFIG
};
