/**
 * Global setup for PropAgentic Enhanced Security Tests
 * Initializes test environment and security services
 */

async function globalSetup(config) {
  console.log('🔧 Setting up PropAgentic Enhanced Security Test Environment...');
  
  // Initialize test database/environment
  process.env.NODE_ENV = 'test';
  process.env.REACT_APP_ENVIRONMENT = 'test';
  
  // Set security test configurations
  process.env.REACT_APP_ENABLE_SECURITY_TESTS = 'true';
  process.env.REACT_APP_SECURITY_TEST_MODE = 'true';
  
  // Mock external services for testing
  process.env.REACT_APP_MOCK_SERVICES = 'true';
  
  console.log('✅ Security test environment initialized');
  console.log('📊 Test configuration:', {
    baseURL: config.use.baseURL,
    workers: config.workers,
    retries: config.retries
  });
  
  return {
    teardown: async () => {
      console.log('🧹 Cleaning up test environment...');
    }
  };
}

module.exports = globalSetup; 