# Testing Strategy Documentation

## Overview
This document outlines the comprehensive testing strategy for the Propagentic application, covering unit tests, integration tests, end-to-end tests, and Firebase-specific testing patterns.

## Testing Philosophy

### 1. Testing Pyramid
```
           /\
          /  \
         / E2E \      <- Few, High-value scenarios
        /______\
       /        \
      / Integration \ <- API contracts, service integration
     /______________\
    /                \
   /   Unit Tests     \  <- Many, Fast, Isolated
  /____________________\
```

### 2. Testing Principles
- **Fast Feedback**: Unit tests run in < 5 seconds
- **Reliable**: Tests should not be flaky
- **Maintainable**: Tests should be easy to update as code changes
- **Valuable**: Each test should prevent real bugs

## Test Setup & Configuration

### 1. Testing Stack
```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "firebase-functions-test": "^3.1.0",
    "@firebase/rules-unit-testing": "^3.0.1",
    "cypress": "^12.17.3",
    "msw": "^1.3.0"
  }
}
```

### 2. Jest Configuration
**File**: `jest.config.js`

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy'
  },
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/index.js',
    '!src/reportWebVitals.js',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/src/**/*.{spec,test}.{js,jsx,ts,tsx}'
  ]
};
```

### 3. Test Setup File
**File**: `src/setupTests.js`

```javascript
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Mock Firebase
jest.mock('./firebase/config', () => ({
  db: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: jest.fn()
  },
  storage: {}
}));

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
  useLocation: () => ({ pathname: '/' })
}));

// Mock context providers
jest.mock('./context/AuthContext', () => ({
  useAuth: () => ({
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
    isLoading: false,
    fetchUserProfile: jest.fn()
  })
}));

// Start MSW server
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Global test utilities
global.renderWithProviders = (ui, options = {}) => {
  const { preloadedState = {}, ...renderOptions } = options;
  
  const Wrapper = ({ children }) => (
    <BrowserRouter>
      <AuthContextProvider>
        <ConnectionContextProvider>
          {children}
        </ConnectionContextProvider>
      </AuthContextProvider>
    </BrowserRouter>
  );
  
  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
```

## Unit Testing Patterns

### 1. Component Testing

**File**: `src/components/ui/__tests__/Button.test.jsx`

```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Button from '../Button';

describe('Button Component', () => {
  test('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  test('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await user.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies variant styles correctly', () => {
    render(<Button variant="primary">Primary Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
  });

  test('is disabled when loading', () => {
    render(<Button loading>Loading Button</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  test('shows loading spinner when loading', () => {
    render(<Button loading>Loading Button</Button>);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });
});
```

### 2. Hook Testing

**File**: `src/hooks/__tests__/useServiceCall.test.js`

```javascript
import { renderHook, act } from '@testing-library/react';
import { useServiceCall } from '../useServiceCall';

describe('useServiceCall Hook', () => {
  test('should handle successful service call', async () => {
    const mockService = jest.fn().mockResolvedValue({
      success: true,
      data: { id: 1, name: 'Test' }
    });

    const { result } = renderHook(() => useServiceCall());

    await act(async () => {
      await result.current.execute(mockService);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toEqual({ id: 1, name: 'Test' });
  });

  test('should handle service call error', async () => {
    const mockService = jest.fn().mockResolvedValue({
      success: false,
      error: 'Service error'
    });

    const { result } = renderHook(() => useServiceCall());

    await act(async () => {
      await result.current.execute(mockService);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Service error');
    expect(result.current.data).toBeNull();
  });

  test('should handle network error', async () => {
    const mockService = jest.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useServiceCall());

    await act(async () => {
      await result.current.execute(mockService);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('Network error occurred');
    expect(result.current.data).toBeNull();
  });
});
```

### 3. Service Testing with Firebase Mocks

**File**: `src/services/firestore/__tests__/contractorService.test.ts`

```javascript
import { ContractorService } from '../contractorService';
import { 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  collection,
  query,
  getDocs 
} from 'firebase/firestore';

// Mock Firebase
jest.mock('firebase/firestore');

const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;

describe('ContractorService', () => {
  let contractorService: ContractorService;

  beforeEach(() => {
    contractorService = new ContractorService();
    jest.clearAllMocks();
  });

  describe('createProfile', () => {
    test('should create contractor profile successfully', async () => {
      mockSetDoc.mockResolvedValue(undefined);
      
      const profileData = {
        skills: ['plumbing'],
        serviceArea: 'Test City'
      };

      const result = await contractorService.createProfile('test-id', profileData);

      expect(result.success).toBe(true);
      expect(mockSetDoc).toHaveBeenCalledWith(
        expect.any(Object),
        expect.objectContaining({
          contractorId: 'test-id',
          userId: 'test-id',
          skills: ['plumbing'],
          serviceArea: 'Test City'
        })
      );
    });

    test('should handle creation error', async () => {
      mockSetDoc.mockRejectedValue(new Error('Permission denied'));

      const result = await contractorService.createProfile('test-id', {});

      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });
  });

  describe('getProfile', () => {
    test('should return profile when found', async () => {
      const mockProfile = {
        contractorId: 'test-id',
        skills: ['plumbing'],
        availability: true
      };

      mockGetDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockProfile
      } as any);

      const result = await contractorService.getProfile('test-id');

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile);
    });

    test('should return error when profile not found', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      } as any);

      const result = await contractorService.getProfile('test-id');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('searchProfiles', () => {
    test('should return search results', async () => {
      const mockProfiles = [
        { id: '1', data: () => ({ skills: ['plumbing'] }) },
        { id: '2', data: () => ({ skills: ['electrical'] }) }
      ];

      mockGetDocs.mockResolvedValue({
        docs: mockProfiles
      } as any);

      const searchParams = { skills: ['plumbing'] };
      const result = await contractorService.searchProfiles(searchParams);

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
    });
  });
});
```

## Integration Testing

### 1. Component Integration Tests

**File**: `src/components/contractor/__tests__/ContractorDashboard.integration.test.jsx`

```javascript
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ContractorDashboard from '../ContractorDashboard';
import { server } from '../../../mocks/server';
import { rest } from 'msw';

// Mock the services
const mockContractorService = {
  getProfile: jest.fn(),
  getAssignedJobs: jest.fn(),
  getAvailableJobs: jest.fn()
};

jest.mock('../../../services', () => ({
  contractorService: mockContractorService
}));

describe('ContractorDashboard Integration', () => {
  beforeEach(() => {
    mockContractorService.getProfile.mockResolvedValue({
      success: true,
      data: {
        contractorId: 'test-id',
        displayName: 'Test Contractor',
        skills: ['plumbing'],
        rating: 4.5,
        jobsCompleted: 25
      }
    });

    mockContractorService.getAssignedJobs.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'job-1',
          title: 'Fix leaky faucet',
          status: 'assigned',
          property: { name: 'Test Property' }
        }
      ]
    });

    mockContractorService.getAvailableJobs.mockResolvedValue({
      success: true,
      data: [
        {
          id: 'job-2',
          title: 'Repair electrical outlet',
          status: 'pending_assignment',
          property: { name: 'Another Property' }
        }
      ]
    });
  });

  test('should load and display contractor dashboard data', async () => {
    renderWithProviders(<ContractorDashboard />);

    // Wait for profile to load
    await waitFor(() => {
      expect(screen.getByText('Test Contractor')).toBeInTheDocument();
    });

    // Check dashboard elements
    expect(screen.getByText('Rating: 4.5')).toBeInTheDocument();
    expect(screen.getByText('Jobs Completed: 25')).toBeInTheDocument();

    // Check assigned jobs section
    expect(screen.getByText('Assigned Jobs')).toBeInTheDocument();
    expect(screen.getByText('Fix leaky faucet')).toBeInTheDocument();

    // Check available jobs section
    expect(screen.getByText('Available Jobs')).toBeInTheDocument();
    expect(screen.getByText('Repair electrical outlet')).toBeInTheDocument();
  });

  test('should handle job acceptance flow', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ContractorDashboard />);

    // Wait for available jobs to load
    await waitFor(() => {
      expect(screen.getByText('Repair electrical outlet')).toBeInTheDocument();
    });

    // Click accept job button
    const acceptButton = screen.getByTestId('accept-job-job-2');
    await user.click(acceptButton);

    // Verify acceptance was called
    await waitFor(() => {
      expect(mockContractorService.acceptJob).toHaveBeenCalledWith('job-2');
    });
  });

  test('should handle service errors gracefully', async () => {
    mockContractorService.getProfile.mockResolvedValue({
      success: false,
      error: 'Profile not found'
    });

    renderWithProviders(<ContractorDashboard />);

    await waitFor(() => {
      expect(screen.getByText(/Profile not found/)).toBeInTheDocument();
    });
  });
});
```

### 2. API Integration Tests

**File**: `src/__tests__/integration/contractorAPI.integration.test.js`

```javascript
import { contractorService } from '../../services';
import { setupTestFirestore, cleanupTestFirestore } from '../../testUtils/firebase';

describe('Contractor API Integration', () => {
  beforeAll(async () => {
    await setupTestFirestore();
  });

  afterAll(async () => {
    await cleanupTestFirestore();
  });

  beforeEach(async () => {
    // Clear test data before each test
    await cleanupTestData();
  });

  test('complete contractor onboarding flow', async () => {
    // 1. Create contractor profile
    const profileData = {
      displayName: 'Test Contractor',
      skills: ['plumbing', 'electrical'],
      serviceArea: 'Test City',
      hourlyRate: 75
    };

    const createResult = await contractorService.createProfile('test-contractor', profileData);
    expect(createResult.success).toBe(true);

    // 2. Retrieve profile
    const getResult = await contractorService.getProfile('test-contractor');
    expect(getResult.success).toBe(true);
    expect(getResult.data.displayName).toBe('Test Contractor');

    // 3. Update availability
    const updateResult = await contractorService.updateProfile('test-contractor', {
      availability: false
    });
    expect(updateResult.success).toBe(true);

    // 4. Verify update
    const updatedResult = await contractorService.getProfile('test-contractor');
    expect(updatedResult.data.availability).toBe(false);

    // 5. Search for contractor
    const searchResult = await contractorService.searchProfiles({
      skills: ['plumbing']
    });
    expect(searchResult.success).toBe(true);
    expect(searchResult.data.some(c => c.contractorId === 'test-contractor')).toBe(true);
  });

  test('job assignment and completion flow', async () => {
    // Setup: Create contractor and job
    await contractorService.createProfile('test-contractor', {
      skills: ['plumbing'],
      availability: true
    });

    await maintenanceService.createJob({
      title: 'Fix leaky faucet',
      category: 'plumbing',
      status: 'pending_assignment'
    });

    // 1. Assign job to contractor
    const assignResult = await maintenanceService.assignJob('test-job', 'test-contractor');
    expect(assignResult.success).toBe(true);

    // 2. Contractor accepts job
    const acceptResult = await contractorService.acceptJob('test-job');
    expect(acceptResult.success).toBe(true);

    // 3. Update job status to in progress
    const progressResult = await maintenanceService.updateJobStatus('test-job', 'in_progress');
    expect(progressResult.success).toBe(true);

    // 4. Complete job
    const completeResult = await maintenanceService.completeJob('test-job', {
      notes: 'Faucet repaired successfully',
      partsUsed: ['O-ring', 'Washer']
    });
    expect(completeResult.success).toBe(true);

    // 5. Verify contractor stats updated
    const contractorResult = await contractorService.getProfile('test-contractor');
    expect(contractorResult.data.jobsCompleted).toBe(1);
  });
});
```

## Firebase-Specific Testing

### 1. Firestore Rules Testing

**File**: `firestore-rules.test.js`

```javascript
import { 
  initializeTestEnvironment,
  assertFails,
  assertSucceeds
} from '@firebase/rules-unit-testing';

describe('Firestore Security Rules', () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: 'test-project',
      firestore: {
        rules: fs.readFileSync('firestore.rules', 'utf8')
      }
    });
  });

  afterAll(async () => {
    await testEnv.cleanup();
  });

  afterEach(async () => {
    await testEnv.clearFirestore();
  });

  describe('Contractor Profiles', () => {
    test('should allow contractors to read their own profile', async () => {
      const contractor = testEnv.authenticatedContext('contractor-1');
      const contractorRef = contractor.firestore()
        .collection('contractorProfiles')
        .doc('contractor-1');

      await assertSucceeds(contractorRef.get());
    });

    test('should prevent contractors from reading other profiles', async () => {
      const contractor = testEnv.authenticatedContext('contractor-1');
      const otherContractorRef = contractor.firestore()
        .collection('contractorProfiles')
        .doc('contractor-2');

      await assertFails(otherContractorRef.get());
    });

    test('should allow landlords to read contractor profiles', async () => {
      const landlord = testEnv.authenticatedContext('landlord-1', {
        userType: 'landlord'
      });
      const contractorRef = landlord.firestore()
        .collection('contractorProfiles')
        .doc('contractor-1');

      await assertSucceeds(contractorRef.get());
    });

    test('should only allow contractors to update their own profile', async () => {
      const contractor = testEnv.authenticatedContext('contractor-1');
      const contractorRef = contractor.firestore()
        .collection('contractorProfiles')
        .doc('contractor-1');

      await assertSucceeds(contractorRef.update({
        availability: false
      }));

      const otherContractorRef = contractor.firestore()
        .collection('contractorProfiles')
        .doc('contractor-2');

      await assertFails(otherContractorRef.update({
        availability: false
      }));
    });
  });

  describe('Maintenance Tickets', () => {
    test('should allow contractors to view assigned tickets', async () => {
      const contractor = testEnv.authenticatedContext('contractor-1');
      
      // Create a ticket assigned to this contractor
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore()
          .collection('tickets')
          .doc('ticket-1')
          .set({
            contractorId: 'contractor-1',
            status: 'assigned'
          });
      });

      const ticketRef = contractor.firestore()
        .collection('tickets')
        .doc('ticket-1');

      await assertSucceeds(ticketRef.get());
    });

    test('should prevent contractors from viewing unassigned tickets they cannot accept', async () => {
      const contractor = testEnv.authenticatedContext('contractor-1');
      
      await testEnv.withSecurityRulesDisabled(async (context) => {
        await context.firestore()
          .collection('tickets')
          .doc('ticket-1')
          .set({
            status: 'pending_assignment',
            category: 'electrical' // Contractor doesn't have this skill
          });

        await context.firestore()
          .collection('contractorProfiles')
          .doc('contractor-1')
          .set({
            skills: ['plumbing'] // Different skill
          });
      });

      const ticketRef = contractor.firestore()
        .collection('tickets')
        .doc('ticket-1');

      await assertFails(ticketRef.get());
    });
  });
});
```

### 2. Cloud Functions Testing

**File**: `functions/test/inviteCode.test.js`

```javascript
const test = require('firebase-functions-test')();
const admin = require('firebase-admin');

// Mock Firebase Admin
test.mockConfig({
  sendgrid: {
    api_key: 'test-key'
  }
});

// Import functions after mocking
const { generateInviteCodeHttp } = require('../src/inviteCode');

describe('generateInviteCodeHttp', () => {
  let req, res;

  beforeEach(() => {
    req = {
      method: 'POST',
      headers: {
        authorization: 'Bearer mock-token'
      },
      body: {
        propertyId: 'test-property',
        landlordId: 'test-landlord',
        options: {
          email: 'test@example.com',
          expirationDays: 7
        }
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn()
    };

    // Mock Firestore
    jest.spyOn(admin.firestore(), 'collection').mockReturnValue({
      add: jest.fn().mockResolvedValue({
        id: 'generated-id'
      })
    });

    // Mock Auth
    jest.spyOn(admin.auth(), 'verifyIdToken').mockResolvedValue({
      uid: 'test-landlord'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('should generate invite code successfully', async () => {
    await generateInviteCodeHttp(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: true,
        inviteCode: expect.stringMatching(/^[A-Z0-9]{8}$/)
      })
    );
  });

  test('should require authentication', async () => {
    req.headers.authorization = null;

    await generateInviteCodeHttp(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Unauthorized'
    });
  });

  test('should validate required fields', async () => {
    req.body.propertyId = null;

    await generateInviteCodeHttp(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        error: expect.stringContaining('propertyId')
      })
    );
  });
});
```

## End-to-End Testing

### 1. Cypress Configuration

**File**: `cypress.config.js`

```javascript
const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    screenshotOnRunFailure: true,
    supportFile: 'cypress/support/e2e.js',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    env: {
      FIREBASE_PROJECT_ID: 'propagentic-test',
      TEST_USER_EMAIL: 'test-contractor@example.com',
      TEST_USER_PASSWORD: 'testpassword123'
    }
  }
});
```

### 2. Cypress Commands

**File**: `cypress/support/commands.js`

```javascript
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

Cypress.Commands.add('loginAsContractor', (email, password) => {
  email = email || Cypress.env('TEST_USER_EMAIL');
  password = password || Cypress.env('TEST_USER_PASSWORD');

  cy.visit('/login');
  cy.get('[data-testid="email-input"]').type(email);
  cy.get('[data-testid="password-input"]').type(password);
  cy.get('[data-testid="login-button"]').click();
  
  // Wait for redirect to dashboard
  cy.url().should('include', '/contractor/dashboard');
});

Cypress.Commands.add('createTestJob', (jobData = {}) => {
  const defaultJob = {
    title: 'Test Maintenance Job',
    description: 'Test job for E2E testing',
    category: 'plumbing',
    priority: 'medium',
    ...jobData
  };

  cy.request({
    method: 'POST',
    url: '/api/test/create-job',
    body: defaultJob
  }).then((response) => {
    expect(response.status).to.eq(201);
    return cy.wrap(response.body.jobId);
  });
});

Cypress.Commands.add('cleanupTestData', () => {
  cy.request('DELETE', '/api/test/cleanup');
});
```

### 3. E2E Test Examples

**File**: `cypress/e2e/contractor-onboarding.cy.js`

```javascript
describe('Contractor Onboarding Flow', () => {
  beforeEach(() => {
    cy.cleanupTestData();
  });

  it('should complete contractor onboarding successfully', () => {
    // Start registration
    cy.visit('/register');
    cy.get('[data-testid="user-type-contractor"]').click();
    
    // Fill registration form
    cy.get('[data-testid="email-input"]').type('newcontractor@example.com');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="confirm-password-input"]').type('password123');
    cy.get('[data-testid="register-button"]').click();

    // Complete onboarding
    cy.url().should('include', '/onboarding');
    
    cy.get('[data-testid="first-name"]').type('John');
    cy.get('[data-testid="last-name"]').type('Doe');
    cy.get('[data-testid="phone-number"]').type('555-0123');
    cy.get('[data-testid="service-types"]').select(['plumbing', 'electrical']);
    cy.get('[data-testid="service-area"]').type('Test City');
    cy.get('[data-testid="years-experience"]').select('5-10');
    cy.get('[data-testid="hourly-rate"]').type('75');
    
    // Submit onboarding
    cy.get('[data-testid="submit-onboarding"]').click();
    
    // Verify redirect to dashboard
    cy.url().should('include', '/contractor/dashboard');
    cy.get('[data-testid="contractor-name"]').should('contain', 'John Doe');
    cy.get('[data-testid="contractor-skills"]').should('contain', 'plumbing');
  });

  it('should validate required fields', () => {
    cy.visit('/onboarding');
    
    // Try to submit without required fields
    cy.get('[data-testid="submit-onboarding"]').click();
    
    // Check for validation errors
    cy.get('[data-testid="first-name-error"]').should('be.visible');
    cy.get('[data-testid="last-name-error"]').should('be.visible');
    cy.get('[data-testid="service-types-error"]').should('be.visible');
  });
});
```

**File**: `cypress/e2e/job-management.cy.js`

```javascript
describe('Job Management', () => {
  beforeEach(() => {
    cy.cleanupTestData();
    cy.loginAsContractor();
  });

  it('should allow contractor to view and accept available jobs', () => {
    // Create a test job
    cy.createTestJob({
      title: 'Fix Leaky Faucet',
      category: 'plumbing',
      priority: 'high'
    }).then((jobId) => {
      // Refresh dashboard to see new job
      cy.visit('/contractor/dashboard');
      
      // Check available jobs section
      cy.get('[data-testid="available-jobs"]').should('be.visible');
      cy.get('[data-testid="job-card"]').should('contain', 'Fix Leaky Faucet');
      cy.get('[data-testid="job-priority"]').should('contain', 'High');
      
      // Accept the job
      cy.get(`[data-testid="accept-job-${jobId}"]`).click();
      
      // Confirm acceptance
      cy.get('[data-testid="confirm-accept"]').click();
      
      // Verify job moved to assigned jobs
      cy.get('[data-testid="assigned-jobs"]').should('contain', 'Fix Leaky Faucet');
      cy.get('[data-testid="available-jobs"]').should('not.contain', 'Fix Leaky Faucet');
    });
  });

  it('should allow contractor to update job status', () => {
    cy.createTestJob().then((jobId) => {
      // Accept the job first
      cy.get(`[data-testid="accept-job-${jobId}"]`).click();
      cy.get('[data-testid="confirm-accept"]').click();
      
      // Start work on the job
      cy.get(`[data-testid="start-job-${jobId}"]`).click();
      cy.get('[data-testid="job-status"]').should('contain', 'In Progress');
      
      // Complete the job
      cy.get(`[data-testid="complete-job-${jobId}"]`).click();
      cy.get('[data-testid="completion-notes"]').type('Job completed successfully');
      cy.get('[data-testid="submit-completion"]').click();
      
      // Verify completion
      cy.get('[data-testid="job-status"]').should('contain', 'Completed');
      cy.get('[data-testid="contractor-stats"]').should('contain', 'Jobs Completed: 1');
    });
  });
});
```

## Performance Testing

### 1. Load Testing with Artillery

**File**: `performance/load-test.yml`

```yaml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
      name: Warm up
    - duration: 120
      arrivalRate: 50
      name: Load test
  payload:
    - path: './test-users.csv'
      fields:
        - email
        - password

scenarios:
  - name: 'Contractor Dashboard Load'
    weight: 70
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: '{{ email }}'
            password: '{{ password }}'
        capture:
          - json: '$.token'
            as: 'authToken'
      - get:
          url: '/api/contractor/dashboard'
          headers:
            Authorization: 'Bearer {{ authToken }}'
      - think: 5
      - get:
          url: '/api/contractor/jobs/available'
          headers:
            Authorization: 'Bearer {{ authToken }}'

  - name: 'Job Search and Filter'
    weight: 30
    flow:
      - post:
          url: '/api/auth/login'
          json:
            email: '{{ email }}'
            password: '{{ password }}'
        capture:
          - json: '$.token'
            as: 'authToken'
      - get:
          url: '/api/jobs/search?category=plumbing&availability=true'
          headers:
            Authorization: 'Bearer {{ authToken }}'
```

### 2. Performance Monitoring

**File**: `src/utils/performanceMonitor.js`

```javascript
export class PerformanceMonitor {
  static measureComponentRender(componentName) {
    return (WrappedComponent) => {
      return function MeasuredComponent(props) {
        useEffect(() => {
          const startTime = performance.now();
          
          return () => {
            const endTime = performance.now();
            const renderTime = endTime - startTime;
            
            if (renderTime > 16) { // Longer than one frame
              console.warn(`${componentName} render took ${renderTime}ms`);
            }
            
            // Send to analytics
            analytics.track('component_render_time', {
              component: componentName,
              renderTime: renderTime
            });
          };
        });

        return <WrappedComponent {...props} />;
      };
    };
  }

  static measureServiceCall(serviceName, operation) {
    return async (...args) => {
      const startTime = performance.now();
      
      try {
        const result = await operation(...args);
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        analytics.track('service_call_duration', {
          service: serviceName,
          operation: operation.name,
          duration: duration,
          success: true
        });
        
        return result;
      } catch (error) {
        const endTime = performance.now();
        const duration = endTime - startTime;
        
        analytics.track('service_call_duration', {
          service: serviceName,
          operation: operation.name,
          duration: duration,
          success: false,
          error: error.message
        });
        
        throw error;
      }
    };
  }
}
```

## Test Data Management

### 1. Test Data Factory

**File**: `src/testUtils/factories.js`

```javascript
import { faker } from '@faker-js/faker';

export const ContractorFactory = {
  build: (overrides = {}) => ({
    contractorId: faker.string.uuid(),
    userId: faker.string.uuid(),
    displayName: faker.person.fullName(),
    email: faker.internet.email(),
    phoneNumber: faker.phone.number(),
    companyName: faker.company.name(),
    skills: faker.helpers.arrayElements(['plumbing', 'electrical', 'hvac', 'carpentry'], 2),
    serviceArea: faker.location.city(),
    hourlyRate: faker.number.int({ min: 25, max: 150 }),
    yearsExperience: faker.helpers.arrayElement(['0-2', '3-5', '5-10', '10+']),
    availability: faker.datatype.boolean(),
    rating: faker.number.float({ min: 1, max: 5, precision: 0.1 }),
    reviewCount: faker.number.int({ min: 0, max: 100 }),
    jobsCompleted: faker.number.int({ min: 0, max: 500 }),
    jobsInProgress: faker.number.int({ min: 0, max: 5 }),
    preferredProperties: [],
    affiliatedLandlords: [],
    verificationStatus: {
      identity: faker.helpers.arrayElement(['pending', 'verified', 'rejected']),
      insurance: faker.helpers.arrayElement(['pending', 'verified', 'rejected']),
      license: faker.helpers.arrayElement(['pending', 'verified', 'rejected']),
      w9: faker.helpers.arrayElement(['pending', 'verified', 'rejected']),
      background: faker.helpers.arrayElement(['pending', 'verified', 'rejected'])
    },
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    lastActiveAt: faker.date.recent(),
    ...overrides
  }),

  buildList: (count, overrides = {}) => {
    return Array.from({ length: count }, () => ContractorFactory.build(overrides));
  }
};

export const MaintenanceJobFactory = {
  build: (overrides = {}) => ({
    id: faker.string.uuid(),
    title: faker.helpers.arrayElement([
      'Fix leaky faucet',
      'Repair electrical outlet',
      'Replace air filter',
      'Paint bedroom walls'
    ]),
    description: faker.lorem.paragraph(),
    category: faker.helpers.arrayElement(['plumbing', 'electrical', 'hvac', 'general']),
    priority: faker.helpers.arrayElement(['low', 'medium', 'high', 'emergency']),
    status: faker.helpers.arrayElement(['pending_assignment', 'assigned', 'in_progress', 'completed']),
    propertyId: faker.string.uuid(),
    propertyName: faker.location.streetAddress(),
    landlordId: faker.string.uuid(),
    contractorId: null,
    estimatedDuration: faker.number.int({ min: 1, max: 8 }),
    maxBudget: faker.number.int({ min: 50, max: 500 }),
    urgencyLevel: faker.helpers.arrayElement(['routine', 'urgent', 'emergency']),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    scheduledDate: faker.date.future(),
    ...overrides
  }),

  buildList: (count, overrides = {}) => {
    return Array.from({ length: count }, () => MaintenanceJobFactory.build(overrides));
  }
};
```

### 2. Test Database Setup

**File**: `src/testUtils/firebase.js`

```javascript
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getAuth, connectAuthEmulator } from 'firebase/auth';

const testConfig = {
  apiKey: 'test-api-key',
  authDomain: 'test-project.firebaseapp.com',
  projectId: 'test-project',
  storageBucket: 'test-project.appspot.com',
  messagingSenderId: '123456789',
  appId: 'test-app-id'
};

let testApp;
let testDb;
let testAuth;

export const setupTestFirestore = async () => {
  if (!testApp) {
    testApp = initializeApp(testConfig, 'test-app');
    testDb = getFirestore(testApp);
    testAuth = getAuth(testApp);

    // Connect to emulators
    if (process.env.NODE_ENV === 'test') {
      connectFirestoreEmulator(testDb, 'localhost', 8080);
      connectAuthEmulator(testAuth, 'http://localhost:9099');
    }
  }

  return { testDb, testAuth };
};

export const cleanupTestFirestore = async () => {
  // Clear all test data
  if (testDb) {
    // Delete all collections and documents
    const collections = ['users', 'contractorProfiles', 'tickets', 'properties'];
    
    for (const collectionName of collections) {
      const snapshot = await getDocs(collection(testDb, collectionName));
      const batch = writeBatch(testDb);
      
      snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
    }
  }
};

export const seedTestData = async (data) => {
  const { testDb } = await setupTestFirestore();
  
  for (const [collectionName, documents] of Object.entries(data)) {
    for (const [docId, docData] of Object.entries(documents)) {
      await setDoc(doc(testDb, collectionName, docId), docData);
    }
  }
};
```

## Continuous Integration

### 1. GitHub Actions Workflow

**File**: `.github/workflows/test.yml`

```yaml
name: Test Suite

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run unit tests
      run: npm run test:unit -- --coverage --watchAll=false
    
    - name: Upload coverage reports
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info

  integration-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Start Firebase Emulators
      run: |
        npm install -g firebase-tools
        firebase emulators:start --only firestore,auth &
        sleep 10
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        FIREBASE_PROJECT_ID: test-project

  e2e-tests:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Start application
      run: |
        npm start &
        npx wait-on http://localhost:3000
    
    - name: Run Cypress tests
      uses: cypress-io/github-action@v6
      with:
        browser: chrome
        record: true
      env:
        CYPRESS_RECORD_KEY: ${{ secrets.CYPRESS_RECORD_KEY }}
```

## Quality Gates

### 1. Coverage Requirements
- **Unit Tests**: 80% minimum coverage
- **Integration Tests**: 70% minimum coverage
- **Critical Paths**: 95% minimum coverage

### 2. Performance Budgets
- **Component Render Time**: < 16ms average
- **Service Call Time**: < 2s for standard operations
- **Page Load Time**: < 3s for initial load

### 3. Test Quality Metrics
- **Test Reliability**: < 1% flaky test rate
- **Test Speed**: Unit tests < 30s total
- **Test Maintenance**: Tests should not require updates for minor feature changes

---

**Last Updated**: January 2025
**Next Review**: After implementing core testing infrastructure 