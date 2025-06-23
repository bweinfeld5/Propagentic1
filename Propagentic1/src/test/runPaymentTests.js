// Phase 1.4 Payment System Test Runner
// Executes comprehensive tests for escrow, disputes, and payment flows

import PaymentSystemTester from './paymentSystemTests.jsx';

// Configure test environment
process.env.NODE_ENV = 'test';

class TestRunner {
  constructor() {
    this.tester = new PaymentSystemTester();
    this.startTime = Date.now();
  }

  async run() {
    console.log('🔬 Phase 1.4 Payment System Test Suite');
    console.log('=====================================\n');
    
    console.log('📋 Test Configuration:');
    console.log(`• Environment: ${process.env.NODE_ENV}`);
    console.log(`• Test Mode: Simulated (no real Stripe/Firebase calls)`);
    console.log(`• Started: ${new Date().toLocaleString()}\n`);

    try {
      // Run the comprehensive test suite
      await this.tester.runAllTests();
      
      const endTime = Date.now();
      const duration = ((endTime - this.startTime) / 1000).toFixed(2);
      
      console.log(`\n⏱️ Total test duration: ${duration} seconds`);
      
      // Return test results for external processing
      return this.tester.testResults;
      
    } catch (error) {
      console.error('❌ Test runner failed:', error);
      throw error;
    }
  }

  // Quick test for specific components
  async runQuickTest(component) {
    console.log(`🚀 Running Quick Test: ${component}\n`);
    
    switch (component.toLowerCase()) {
      case 'escrow':
        await this.tester.testEscrowWorkflow();
        await this.tester.testMilestoneReleases();
        break;
      case 'dispute':
        await this.tester.testDisputeCreation();
        await this.tester.testDisputeResolution();
        break;
      case 'payment':
        await this.tester.testStripeIntegration();
        await this.tester.testPaymentMethods();
        break;
      case 'security':
        await this.tester.testSecurityValidation();
        await this.tester.testErrorScenarios();
        break;
      default:
        console.log('❌ Unknown component. Available: escrow, dispute, payment, security');
        return;
    }
    
    // Generate focused report
    const componentResults = this.tester.testResults.filter(r => 
      r.test.toLowerCase().includes(component.toLowerCase())
    );
    
    const passed = componentResults.filter(r => r.success).length;
    const total = componentResults.length;
    
    console.log(`\n📊 ${component.toUpperCase()} Test Results: ${passed}/${total} passed`);
    
    return componentResults;
  }
}

// CLI interface
if (require.main === module) {
  const runner = new TestRunner();
  
  // Check for command line arguments
  const args = process.argv.slice(2);
  
  if (args.length > 0) {
    const command = args[0];
    
    if (command === 'quick' && args[1]) {
      // Run quick test for specific component
      runner.runQuickTest(args[1])
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
    } else {
      console.log('Usage: node runPaymentTests.js [quick <component>]');
      console.log('Components: escrow, dispute, payment, security');
      process.exit(1);
    }
  } else {
    // Run full test suite
    runner.run()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  }
}

export default TestRunner; 