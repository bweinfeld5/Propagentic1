/**
 * Test Runner for PropAgentic Analytics
 * Orchestrates comprehensive test execution with multiple modes and reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const config = {
  // Test execution modes
  modes: {
    all: {
      name: 'Complete Test Suite',
      description: 'All analytics tests with full coverage analysis',
      files: 'tests/analytics/**/*.test.{js,jsx}',
      timeout: '30s',
      coverage: true
    },
    unit: {
      name: 'Unit Tests',
      description: 'Individual component and service tests',
      files: 'tests/analytics/{firebase-analytics,conversion-tracking,ab-testing}.test.js',
      timeout: '10s',
      coverage: true
    },
    integration: {
      name: 'Integration Tests', 
      description: 'Service integration and manager tests',
      files: 'tests/analytics/analytics-manager.test.js',
      timeout: '15s',
      coverage: true
    },
    component: {
      name: 'Component Tests',
      description: 'React component rendering and interaction tests',
      files: 'tests/analytics/analytics-dashboard.test.jsx',
      timeout: '15s',
      coverage: false
    },
    services: {
      name: 'Service Tests',
      description: 'Core analytics service functionality tests',
      files: 'tests/analytics/{firebase-analytics,conversion-tracking,ab-testing}.test.js',
      timeout: '10s', 
      coverage: true
    },
    quick: {
      name: 'Quick Validation',
      description: 'Fast smoke tests for development workflow',
      files: 'tests/analytics/{firebase-analytics,conversion-tracking}.test.js',
      timeout: '5s',
      coverage: false
    }
  },

  // Coverage thresholds
  coverage: {
    thresholds: {
      functions: 85,
      lines: 85,
      statements: 85,
      branches: 80
    },
    componentThresholds: {
      functions: 75,
      lines: 75,
      statements: 75,
      branches: 70
    }
  },

  // Reporting configuration
  reporting: {
    outputDir: 'test-reports',
    formats: ['json', 'html', 'text'],
    includeTimestamps: true,
    generateSummary: true
  }
};

// Utility functions
const log = (message, type = 'info') => {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📋',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    start: '🚀',
    finish: '🏁'
  }[type] || 'ℹ️';
  
  console.log(`${prefix} [${timestamp}] ${message}`);
};

const execCommand = (command, options = {}) => {
  try {
    log(`Executing: ${command}`, 'start');
    const result = execSync(command, {
      stdio: 'pipe',
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024, // 10MB buffer
      ...options
    });
    return { success: true, output: result };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      output: error.stdout || '',
      stderr: error.stderr || ''
    };
  }
};

const ensureDirectory = (dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`, 'info');
  }
};

// Main test runner function
const runTests = async (mode = 'quick') => {
  log('Starting PropAgentic Analytics Test Suite', 'start');
  
  const testMode = config.modes[mode];
  if (!testMode) {
    log(`Unknown test mode: ${mode}`, 'error');
    process.exit(1);
  }

  // Setup directories
  ensureDirectory(config.reporting.outputDir);
  
  log(`\n🧪 Running ${testMode.name}...`, 'start');
  log(`📝 ${testMode.description}`, 'info');
  
  const startTime = Date.now();
  
  // Build Vitest command
  const commandParts = [
    'npx vitest run',
    '--config tests/vitest.config.js',
    '--reporter=verbose'
  ];

  if (testMode.coverage) {
    commandParts.push(
      '--coverage.enabled=true',
      '--coverage.reporter=text',
      '--coverage.reporter=json',
      '--coverage.reporter=html',
      `--coverage.reportsDirectory=${path.resolve('coverage')}`
    );
  }

  commandParts.push(testMode.files);
  
  const command = commandParts.join(' ');
  
  const result = execCommand(command);
  const duration = Date.now() - startTime;
  
  if (result.success) {
    log(`✅ ${testMode.name} completed successfully (${(duration / 1000).toFixed(1)}s)`, 'success');
  } else {
    log(`❌ ${testMode.name} failed (${(duration / 1000).toFixed(1)}s)`, 'error');
    if (result.error) {
      log(`Error: ${result.error}`, 'error');
    }
  }

  // Generate simple report
  log('\n📊 Generating test report...', 'info');
  
  const report = {
    timestamp: new Date().toISOString(),
    mode: testMode.name,
    success: result.success,
    duration,
    output: result.output,
    error: result.error
  };

  // Save report
  const reportPath = path.join(config.reporting.outputDir, 'test-results.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  log('\n📋 Test Summary:', 'info');
  log(`Total Suites: ${result.success ? 1 : 0}`, 'info');
  log(`Passed: ${result.success ? 1 : 0}`, result.success ? 'success' : 'info');
  log(`Failed: ${result.success ? 0 : 1}`, result.success ? 'info' : 'error');
  log(`Duration: ${(duration / 1000).toFixed(1)}s`, 'info');
  log(`Success Rate: ${result.success ? '100.0' : '0.0'}%`, 'info');
  log(`\n📄 Reports generated in: ${config.reporting.outputDir}`, 'info');
  log('🏁 Test execution completed', 'finish');
  
  // Exit with appropriate code
  process.exit(result.success ? 0 : 1);
};

// CLI interface
const args = process.argv.slice(2);
const command = args[0] || 'quick';

if (command === 'help' || command === '--help' || command === '-h') {
  console.log(`
PropAgentic Analytics Test Runner

Usage: node tests/run-tests.js [command]

Commands:
  all          Run all test suites
  unit         Run unit tests only
  integration  Run integration tests only
  component    Run component tests only
  services     Run service tests only
  quick        Run quick validation tests (default)
  help         Show this help message

Examples:
  node tests/run-tests.js all
  node tests/run-tests.js unit
  node tests/run-tests.js quick

Reports are generated in: ${config.reporting.outputDir}
  `);
  process.exit(0);
}

runTests(command); 