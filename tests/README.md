# PropAgentic Analytics Testing Suite

Comprehensive testing infrastructure for PropAgentic's Phase 3.1 User Analytics implementation.

## 📋 Overview

This testing suite provides complete coverage for all analytics services, components, and integrations including:

- **Firebase Analytics Service** - Custom event tracking and user analytics
- **Conversion Tracking Service** - Funnel analytics and conversion optimization  
- **A/B Testing Framework** - Experiment management and statistical analysis
- **Analytics Manager** - Unified service coordination and event batching
- **Analytics Dashboard** - React component for data visualization

## 🏗️ Test Architecture

### Test Types
- **Unit Tests** - Individual service methods and component functions
- **Integration Tests** - Service coordination and data flow
- **Component Tests** - React UI components and interactions
- **End-to-End Tests** - Complete user journey validation

### Test Structure
```
tests/
├── analytics/
│   ├── firebase-analytics.test.js       # Firebase Analytics service tests
│   ├── conversion-tracking.test.js      # Conversion funnel tests
│   ├── ab-testing.test.js              # A/B testing framework tests
│   ├── analytics-manager.test.js       # Integration tests
│   └── analytics-dashboard.test.jsx    # React component tests
├── setup/
│   ├── test-setup.js                   # Global test configuration
│   └── mock-setup.js                   # Firebase and external mocks
├── vitest.config.js                    # Test configuration
├── run-tests.js                        # Test runner script
└── README.md                           # This documentation
```

## 🚀 Getting Started

### Prerequisites
```bash
# Install dependencies
npm install

# Required testing packages
npm install -D vitest @vitest/ui @testing-library/react @testing-library/jest-dom
npm install -D @testing-library/user-event jsdom
```

### Quick Start
```bash
# Run all tests
npm run test:analytics

# Run specific test suite
npm run test:analytics:unit
npm run test:analytics:integration
npm run test:analytics:component

# Run with coverage
npm run test:analytics:coverage

# Run in watch mode
npm run test:analytics:watch
```

## 🧪 Running Tests

### Command Line Interface
```bash
# Using the test runner script
node tests/run-tests.js [command]

# Available commands:
node tests/run-tests.js all          # Run all test suites (default)
node tests/run-tests.js unit         # Unit tests only
node tests/run-tests.js integration  # Integration tests only
node tests/run-tests.js component    # Component tests only
node tests/run-tests.js services     # Core service tests only
node tests/run-tests.js quick        # Fast subset (unit + services)
node tests/run-tests.js help         # Show help message
```

### Direct Vitest Commands
```bash
# Run specific test files
npx vitest tests/analytics/firebase-analytics.test.js
npx vitest tests/analytics/conversion-tracking.test.js
npx vitest tests/analytics/ab-testing.test.js

# Run with specific patterns
npx vitest tests/analytics/ --reporter=verbose
npx vitest "tests/**/*.test.js" --coverage

# Watch mode for development
npx vitest tests/analytics/ --watch
```

### Package.json Scripts
Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "test:analytics": "node tests/run-tests.js all",
    "test:analytics:unit": "node tests/run-tests.js unit",
    "test:analytics:integration": "node tests/run-tests.js integration",
    "test:analytics:component": "node tests/run-tests.js component",
    "test:analytics:services": "node tests/run-tests.js services",
    "test:analytics:quick": "node tests/run-tests.js quick",
    "test:analytics:coverage": "npx vitest run --coverage tests/analytics/",
    "test:analytics:watch": "npx vitest tests/analytics/ --watch",
    "test:analytics:ui": "npx vitest --ui tests/analytics/"
  }
}
```

## �� Test Coverage

### Coverage Targets
- **Analytics Services**: 85% coverage (lines, functions, branches, statements)
- **React Components**: 75% coverage
- **Overall Project**: 80% coverage

### Coverage Reports
```bash
# Generate coverage reports
npm run test:analytics:coverage

# View coverage reports
open coverage/index.html                    # HTML report
cat coverage/coverage-summary.json         # JSON summary
```

### Coverage Configuration
Coverage thresholds are configured in `tests/vitest.config.js`:

```javascript
coverage: {
  thresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    },
    'src/services/analytics/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85
    }
  }
}
```

## 🔧 Test Configuration

### Vitest Configuration
The test environment is configured in `tests/vitest.config.js`:

- **Environment**: jsdom for React component testing
- **Globals**: Enabled for describe/it/expect without imports
- **Mocking**: Comprehensive Firebase and browser API mocks
- **Coverage**: V8 provider with detailed reporting
- **Parallelization**: Multi-threaded execution for speed

### Mock Setup
Comprehensive mocking is provided for:

- **Firebase Services** (Analytics, Firestore, Auth)
- **Browser APIs** (localStorage, crypto, performance)
- **External Dependencies** (audit logger, privacy services)
- **React Testing Library** setup and utilities

## 📋 Test Suites Detail

### Firebase Analytics Tests
**File**: `tests/analytics/firebase-analytics.test.js`

Tests for custom event tracking, user context management, and analytics configuration:

```javascript
describe('Firebase Analytics Service', () => {
  // Initialization and configuration
  // Event tracking and batching
  // User context and properties
  // Privacy compliance
  // Error handling and resilience
});
```

**Key Test Areas**:
- Service initialization with privacy consent
- Custom event tracking and parameters
- User property management and context
- Event batching and performance optimization
- Privacy-compliant data collection
- Error handling and service resilience

### Conversion Tracking Tests
**File**: `tests/analytics/conversion-tracking.test.js`

Tests for funnel analytics, conversion optimization, and user journey tracking:

```javascript
describe('Conversion Tracking Service', () => {
  // Funnel stage tracking
  // Conversion rate calculation
  // ARPU and revenue analytics
  // User journey analysis
  // Cohort analysis
});
```

**Key Test Areas**:
- Multi-stage funnel tracking (signup → onboarding → activation → subscription)
- Real-time conversion rate calculation
- ARPU, MRR, and LTV analytics
- User journey and behavior analysis
- Cohort segmentation and analysis
- Drop-off identification and optimization

### A/B Testing Tests
**File**: `tests/analytics/ab-testing.test.js`

Tests for experiment management, user assignment, and statistical analysis:

```javascript
describe('A/B Testing Framework', () => {
  // Experiment creation and management
  // User assignment and variant selection
  // Statistical significance calculation
  // Feature flags and pricing variants
  // Results analysis and reporting
});
```

**Key Test Areas**:
- Experiment lifecycle management (create → start → stop → analyze)
- Deterministic user assignment to variants
- Statistical significance testing (95% confidence)
- Feature flag implementation and checks
- Pricing variant testing and optimization
- Results calculation and statistical analysis

### Analytics Manager Tests
**File**: `tests/analytics/analytics-manager.test.js`

Integration tests for service coordination, event batching, and unified functionality:

```javascript
describe('Analytics Manager', () => {
  // Service initialization and coordination
  // Event batching and performance
  // User context management
  // Dashboard data aggregation
  // Privacy compliance integration
});
```

**Key Test Areas**:
- Multi-service initialization and health monitoring
- Event batching and automatic flushing
- Unified user context across services
- Dashboard data aggregation from multiple sources
- Privacy-compliant data handling
- Service failure resilience and fallbacks

### Analytics Dashboard Tests
**File**: `tests/analytics/analytics-dashboard.test.jsx`

React component tests for UI functionality, data visualization, and user interactions:

```javascript
describe('Analytics Dashboard', () => {
  // Component rendering and loading states
  // Tab navigation and content display
  // Data visualization and formatting
  // User interactions and state management
  // Error handling and retry mechanisms
});
```

**Key Test Areas**:
- Component mounting and loading state handling
- Tab navigation between Overview, Funnel, Experiments, etc.
- Data visualization and number formatting
- Interactive elements (date range, refresh, filters)
- Error states and retry functionality
- Responsive design and accessibility

## 🛠️ Writing New Tests

### Test Structure Template
```javascript
/**
 * Service/Component Tests
 * Description of what is being tested
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { serviceOrComponent } from '../path/to/service';

// Mock dependencies
vi.mock('../path/to/dependency', () => ({
  dependency: {
    method: vi.fn()
  }
}));

describe('Service/Component Name', () => {
  beforeEach(() => {
    // Reset mocks and state
    vi.clearAllMocks();
  });

  describe('Feature Group', () => {
    it('should do something specific', async () => {
      // Arrange
      const testData = { key: 'value' };
      
      // Act
      const result = await serviceOrComponent.method(testData);
      
      // Assert
      expect(result).toEqual(expectedResult);
      expect(mockDependency.method).toHaveBeenCalledWith(testData);
    });
  });
});
```

### Best Practices
1. **Use descriptive test names** that explain the expected behavior
2. **Follow AAA pattern** (Arrange, Act, Assert) for clear test structure
3. **Mock external dependencies** to isolate units under test
4. **Test error conditions** and edge cases thoroughly
5. **Use factory functions** for creating test data consistently
6. **Group related tests** in describe blocks with clear hierarchies

### Mock Utilities
Global test utilities are available in `global.testUtils`:

```javascript
// Data generators
const userId = global.testUtils.generateUserId();
const experiment = global.testUtils.createMockExperiment();
const funnelData = global.testUtils.createMockFunnelData();

// Event helpers
const event = global.testUtils.createMockEvent('test_event', { param: 'value' });

// Async utilities
await global.testUtils.waitForAsync(() => condition);
```

## 📈 Continuous Integration

### GitHub Actions Setup
Add this workflow to `.github/workflows/analytics-tests.yml`:

```yaml
name: Analytics Tests

on:
  push:
    paths:
      - 'src/services/analytics/**'
      - 'src/components/analytics/**'
      - 'tests/analytics/**'
  pull_request:
    paths:
      - 'src/services/analytics/**'
      - 'src/components/analytics/**'
      - 'tests/analytics/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - run: npm ci
      - run: npm run test:analytics:coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          directory: ./coverage
```

### Pre-commit Hooks
Add to `.husky/pre-commit`:

```bash
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Run analytics tests on relevant changes
if git diff --cached --name-only | grep -E "(src/services/analytics|src/components/analytics|tests/analytics)"; then
  npm run test:analytics:quick
fi
```

## 🐛 Debugging Tests

### Common Issues and Solutions

**1. Firebase Mock Issues**
```javascript
// Ensure Firebase mocks are properly configured
import { resetAllFirebaseMocks } from '../setup/mock-setup.js';

beforeEach(() => {
  resetAllFirebaseMocks();
});
```

**2. Async Test Problems**
```javascript
// Use waitFor for async operations
import { waitFor } from '@testing-library/react';

await waitFor(() => {
  expect(screen.getByText('Expected Text')).toBeInTheDocument();
});
```

**3. Date/Time Issues**
```javascript
// Use mock dates for consistency
beforeEach(() => {
  global.setMockDate('2024-01-01T00:00:00.000Z');
});

afterEach(() => {
  global.resetMockDate();
});
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=true npm run test:analytics

# Run specific test in debug mode
npx vitest tests/analytics/firebase-analytics.test.js --reporter=verbose
```

## 📚 Additional Resources

### Documentation Links
- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)

### Related Files
- `src/services/analytics/` - Analytics service implementations
- `src/components/analytics/` - Analytics React components
- `PHASE-3.1-USER-ANALYTICS.md` - Implementation documentation

### Support
For questions about the testing suite:
1. Check this README first
2. Review existing test examples
3. Consult the implementation documentation
4. Create an issue with [TEST] prefix for bug reports

---

**Test Coverage Goal**: 85%+ for analytics services  
**Test Execution Time**: < 30 seconds for full suite  
**Maintenance**: Update tests when services change  
**Review**: All new analytics features require corresponding tests 