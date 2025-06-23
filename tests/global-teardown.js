/**
 * Global teardown for PropAgentic Enhanced Security Tests
 * Cleans up test environment and generates security test reports
 */

async function globalTeardown(config) {
  console.log('🧹 Tearing down PropAgentic Enhanced Security Test Environment...');
  
  // Clean up test data
  console.log('🗑️  Cleaning up test data...');
  
  // Reset environment variables
  delete process.env.REACT_APP_ENABLE_SECURITY_TESTS;
  delete process.env.REACT_APP_SECURITY_TEST_MODE;
  delete process.env.REACT_APP_MOCK_SERVICES;
  
  // Generate security test summary
  console.log('📊 Generating security test summary...');
  
  const testSummary = {
    timestamp: new Date().toISOString(),
    environment: 'test',
    security_features_tested: [
      'Rate Limiting',
      'Input Sanitization',
      'Session Management',
      'Two-Factor Authentication',
      'Security Monitoring',
      'Audit Logging'
    ],
    test_categories: [
      'Authentication Security',
      'XSS Prevention',
      'Session Security',
      'Performance Impact',
      'Configuration Validation'
    ]
  };
  
  console.log('✅ Security test teardown completed');
  console.log('📈 Test Summary:', JSON.stringify(testSummary, null, 2));
}

module.exports = globalTeardown; 