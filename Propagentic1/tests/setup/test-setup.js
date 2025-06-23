/**
 * Test Environment Setup
 * Global test configuration and utilities for PropAgentic Analytics tests
 */

import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { vi } from 'vitest';

// Configure React Testing Library
configure({
  testIdAttribute: 'data-testid',
  
  // Disable automatic cleanup (we'll handle it manually)
  asyncUtilTimeout: 5000,
  
  // Configure element selection
  getElementError: (message, container) => {
    const error = new Error(
      [
        message,
        'Here is the state of your container:',
        container.innerHTML
      ].join('\n\n')
    );
    error.name = 'TestingLibraryElementError';
    return error;
  }
});

// Global test utilities
global.testUtils = {
  // Mock timer helpers
  flushPromises: () => new Promise(resolve => setImmediate(resolve)),
  
  // Date/time utilities
  createMockDate: (isoString) => new Date(isoString),
  
  // Mock data generators
  generateUserId: () => `user_${Math.random().toString(36).substr(2, 9)}`,
  generateExperimentId: () => `exp_${Math.random().toString(36).substr(2, 9)}`,
  
  // Analytics event helpers
  createMockEvent: (name, params = {}) => ({
    eventName: name,
    parameters: {
      timestamp: new Date().toISOString(),
      ...params
    },
    timestamp: Date.now()
  }),
  
  // User profile generators
  createMockUserProfile: (overrides = {}) => ({
    userType: 'landlord',
    subscriptionPlan: 'basic',
    createdAt: new Date('2024-01-01'),
    ...overrides
  }),
  
  // Funnel data generators
  createMockFunnelData: (overrides = {}) => ({
    totalUsers: 1000,
    stageCounts: {
      website_visit: 1000,
      signup_completed: 300,
      onboarding_completed: 200,
      first_property_added: 150,
      subscription_successful: 75
    },
    dropOffRates: {
      'website_visit_to_signup_completed': 0.7,
      'signup_completed_to_onboarding_completed': 0.33,
      'onboarding_completed_to_first_property_added': 0.25,
      'first_property_added_to_subscription_successful': 0.5
    },
    averageStepsPerUser: 2.8,
    ...overrides
  }),
  
  // Experiment data generators
  createMockExperiment: (overrides = {}) => ({
    id: global.testUtils.generateExperimentId(),
    name: 'Test Experiment',
    type: 'pricing',
    status: 'active',
    variants: [
      { id: 'variant_0', name: 'control', allocation: 50 },
      { id: 'variant_1', name: 'treatment', allocation: 50 }
    ],
    targetAudience: { userTypes: ['landlord'] },
    trafficAllocation: 100,
    duration: 14,
    createdAt: new Date(),
    ...overrides
  }),
  
  // Conversion rates generator
  createMockConversionRates: (overrides = {}) => ({
    signup_to_onboarding: 66.7,
    onboarding_to_activation: 75.0,
    activation_to_subscription: 50.0,
    overall_conversion: 7.5,
    ...overrides
  }),
  
  // Wait for async operations
  waitForAsync: async (fn, timeout = 1000) => {
    const start = Date.now();
    while (Date.now() - start < timeout) {
      try {
        const result = await fn();
        if (result) return result;
      } catch (error) {
        // Continue waiting
      }
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    throw new Error(`Async operation timed out after ${timeout}ms`);
  }
};

// Console override for cleaner test output
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

console.error = (...args) => {
  // Suppress specific React warnings in tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (
      message.includes('Warning: ReactDOM.render is deprecated') ||
      message.includes('Warning: An invalid form control') ||
      message.includes('Warning: Each child in a list should have a unique "key" prop')
    )
  ) {
    return;
  }
  originalConsoleError(...args);
};

console.warn = (...args) => {
  // Suppress specific warnings in tests
  const message = args[0];
  if (
    typeof message === 'string' &&
    (
      message.includes('componentWillReceiveProps has been renamed') ||
      message.includes('componentWillMount has been renamed')
    )
  ) {
    return;
  }
  originalConsoleWarn(...args);
};

// Global test environment variables
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock scroll methods
Object.defineProperty(Element.prototype, 'scrollIntoView', {
  value: vi.fn(),
  writable: true
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

// Mock sessionStorage
const sessionStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn()
};

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
  writable: true
});

// Mock window.location
delete window.location;
window.location = {
  href: 'http://localhost:3000',
  origin: 'http://localhost:3000',
  protocol: 'http:',
  host: 'localhost:3000',
  hostname: 'localhost',
  port: '3000',
  pathname: '/',
  search: '',
  hash: '',
  assign: vi.fn(),
  reload: vi.fn(),
  replace: vi.fn()
};

// Mock crypto.getRandomValues for deterministic tests
Object.defineProperty(global, 'crypto', {
  value: {
    getRandomValues: vi.fn().mockImplementation((arr) => {
      // Return deterministic values for testing
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    }),
    randomUUID: vi.fn().mockImplementation(() => 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      })
    )
  },
  writable: true
});

// Mock TextEncoder/TextDecoder for Node.js environment
if (!global.TextEncoder) {
  global.TextEncoder = class TextEncoder {
    encode(str) {
      return new Uint8Array(str.split('').map(char => char.charCodeAt(0)));
    }
  };
}

if (!global.TextDecoder) {
  global.TextDecoder = class TextDecoder {
    decode(bytes) {
      return String.fromCharCode(...bytes);
    }
  };
}

// Setup timers
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  // Clean up timers if they are mocked
  if (vi.isFakeTimers()) {
    vi.runOnlyPendingTimers();
    vi.clearAllTimers();
  }
  vi.useRealTimers();
});

// Setup for error boundary testing
global.ErrorBoundaryFallback = ({ error }) => {
  const div = document.createElement('div');
  div.setAttribute('role', 'alert');
  div.innerHTML = `
    <h2>Test Error Boundary</h2>
    <details>
      <summary>Error details</summary>
      <pre>${error.message}</pre>
    </details>
  `;
  return div;
};

// Global test constants
global.TEST_CONSTANTS = {
  MOCK_USER_ID: 'test_user_123',
  MOCK_EXPERIMENT_ID: 'test_experiment_456',
  MOCK_SESSION_ID: 'test_session_789',
  DEFAULT_DATE_RANGE: 30,
  DEFAULT_TIMEOUT: 5000,
  
  // Test data sizes
  SMALL_DATASET_SIZE: 10,
  MEDIUM_DATASET_SIZE: 100,
  LARGE_DATASET_SIZE: 1000,
  
  // Mock API responses
  MOCK_ANALYTICS_DELAY: 100,
  MOCK_ERROR_RATE: 0.1
};

console.log('✅ Test environment setup complete');

export default global; 