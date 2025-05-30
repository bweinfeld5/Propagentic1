/**
 * Mock Setup for External Services
 * Comprehensive mocking for Firebase and external dependencies
 */

import { vi } from 'vitest';

// Mock Firebase Analytics
const mockAnalytics = {
  app: 'mock-firebase-app'
};

vi.mock('firebase/analytics', () => ({
  getAnalytics: vi.fn(() => mockAnalytics),
  logEvent: vi.fn(),
  setUserProperties: vi.fn(),
  setUserId: vi.fn(),
  setCurrentScreen: vi.fn(),
  setAnalyticsCollectionEnabled: vi.fn(),
  isSupported: vi.fn(() => Promise.resolve(true))
}));

// Mock Firebase Firestore
const mockFirestore = {
  app: 'mock-firebase-app'
};

const mockDocumentReference = {
  id: 'mock-doc-id',
  path: 'mock/path',
  parent: null,
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  onSnapshot: vi.fn()
};

const mockCollectionReference = {
  id: 'mock-collection-id',
  path: 'mock-collection',
  parent: null,
  doc: vi.fn(() => mockDocumentReference),
  add: vi.fn(),
  get: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn()
};

const mockQuery = {
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  startAt: vi.fn(),
  startAfter: vi.fn(),
  endAt: vi.fn(),
  endBefore: vi.fn(),
  get: vi.fn(),
  onSnapshot: vi.fn()
};

const mockQuerySnapshot = {
  docs: [],
  empty: true,
  size: 0,
  forEach: vi.fn(),
  docChanges: vi.fn(() => []),
  metadata: {
    hasPendingWrites: false,
    fromCache: false
  }
};

const mockDocumentSnapshot = {
  id: 'mock-doc-id',
  exists: vi.fn(() => true),
  data: vi.fn(() => ({})),
  get: vi.fn(),
  ref: mockDocumentReference,
  metadata: {
    hasPendingWrites: false,
    fromCache: false
  }
};

const mockWriteBatch = {
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn(),
  commit: vi.fn(() => Promise.resolve())
};

const mockTransaction = {
  get: vi.fn(),
  set: vi.fn(),
  update: vi.fn(),
  delete: vi.fn()
};

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => mockFirestore),
  connectFirestoreEmulator: vi.fn(),
  
  // Document operations
  doc: vi.fn(() => mockDocumentReference),
  getDoc: vi.fn(() => Promise.resolve(mockDocumentSnapshot)),
  setDoc: vi.fn(() => Promise.resolve()),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  onSnapshot: vi.fn(),
  
  // Collection operations
  collection: vi.fn(() => mockCollectionReference),
  addDoc: vi.fn(() => Promise.resolve(mockDocumentReference)),
  getDocs: vi.fn(() => Promise.resolve(mockQuerySnapshot)),
  
  // Query operations
  query: vi.fn(() => mockQuery),
  where: vi.fn(() => mockQuery),
  orderBy: vi.fn(() => mockQuery),
  limit: vi.fn(() => mockQuery),
  startAt: vi.fn(() => mockQuery),
  startAfter: vi.fn(() => mockQuery),
  endAt: vi.fn(() => mockQuery),
  endBefore: vi.fn(() => mockQuery),
  
  // Batch operations
  writeBatch: vi.fn(() => mockWriteBatch),
  runTransaction: vi.fn(callback => Promise.resolve(callback(mockTransaction))),
  
  // Aggregation
  count: vi.fn(),
  getCountFromServer: vi.fn(),
  getAggregateFromServer: vi.fn(),
  
  // Timestamps
  serverTimestamp: vi.fn(() => ({ _type: 'serverTimestamp' })),
  Timestamp: {
    now: vi.fn(() => ({ seconds: Date.now() / 1000, nanoseconds: 0 })),
    fromDate: vi.fn(date => ({ seconds: date.getTime() / 1000, nanoseconds: 0 }))
  },
  
  // Field values
  FieldValue: {
    delete: vi.fn(() => ({ _type: 'delete' })),
    increment: vi.fn(n => ({ _type: 'increment', value: n })),
    arrayUnion: vi.fn((...elements) => ({ _type: 'arrayUnion', elements })),
    arrayRemove: vi.fn((...elements) => ({ _type: 'arrayRemove', elements }))
  }
}));

// Mock Firebase Auth
const mockUser = {
  uid: 'mock-user-uid',
  email: 'test@example.com',
  displayName: 'Test User',
  emailVerified: true,
  isAnonymous: false,
  providerData: [],
  getIdToken: vi.fn(() => Promise.resolve('mock-id-token')),
  getIdTokenResult: vi.fn(() => Promise.resolve({ token: 'mock-id-token' }))
};

const mockAuth = {
  currentUser: mockUser,
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockUser }))
};

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => mockAuth),
  connectAuthEmulator: vi.fn(),
  onAuthStateChanged: vi.fn(),
  signOut: vi.fn(() => Promise.resolve()),
  signInWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockUser })),
  createUserWithEmailAndPassword: vi.fn(() => Promise.resolve({ user: mockUser })),
  sendPasswordResetEmail: vi.fn(() => Promise.resolve()),
  updateProfile: vi.fn(() => Promise.resolve()),
  updateEmail: vi.fn(() => Promise.resolve()),
  updatePassword: vi.fn(() => Promise.resolve())
}));

// Mock Firebase Config
vi.mock('../../src/firebase/config', () => ({
  app: 'mock-firebase-app',
  db: mockFirestore,
  auth: mockAuth,
  analytics: mockAnalytics
}));

// Mock Firebase App
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({
    name: 'mock-app',
    options: {},
    automaticDataCollectionEnabled: false
  })),
  getApp: vi.fn(() => ({
    name: 'mock-app',
    options: {},
    automaticDataCollectionEnabled: false
  })),
  getApps: vi.fn(() => [])
}));

// Mock audit logger
vi.mock('../../src/services/security/auditLogger', () => ({
  auditLogger: {
    logEvent: vi.fn(() => Promise.resolve()),
    initialize: vi.fn(() => Promise.resolve({ success: true })),
    getEvents: vi.fn(() => Promise.resolve([])),
    exportLogs: vi.fn(() => Promise.resolve({})),
    clearOldLogs: vi.fn(() => Promise.resolve()),
    getStatus: vi.fn(() => ({ initialized: true, enabled: true }))
  }
}));

// Mock privacy services (if needed for analytics)
vi.mock('../../src/services/privacy/gdprService', () => ({
  gdprService: {
    checkConsent: vi.fn(() => Promise.resolve(true)),
    recordConsent: vi.fn(() => Promise.resolve()),
    exportUserData: vi.fn(() => Promise.resolve({})),
    deleteUserData: vi.fn(() => Promise.resolve())
  }
}));

// Mock encryption service
vi.mock('../../src/services/privacy/encryptionService', () => ({
  encryptionService: {
    encrypt: vi.fn(data => Promise.resolve(`encrypted:${data}`)),
    decrypt: vi.fn(data => Promise.resolve(data.replace('encrypted:', ''))),
    hash: vi.fn(data => Promise.resolve(`hash:${data}`))
  }
}));

// Mock browser APIs
Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      generateKey: vi.fn(),
      importKey: vi.fn(),
      exportKey: vi.fn(),
      encrypt: vi.fn(),
      decrypt: vi.fn(),
      sign: vi.fn(),
      verify: vi.fn(),
      digest: vi.fn()
    },
    getRandomValues: vi.fn((array) => {
      for (let i = 0; i < array.length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
      return array;
    }),
    randomUUID: vi.fn(() => 'mock-uuid-' + Math.random().toString(36).substr(2, 9))
  },
  writable: true
});

// Mock performance API
Object.defineProperty(window, 'performance', {
  value: {
    now: vi.fn(() => Date.now()),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByType: vi.fn(() => []),
    getEntriesByName: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn()
  },
  writable: true
});

// Mock navigation API
Object.defineProperty(window, 'navigator', {
  value: {
    userAgent: 'Mozilla/5.0 (Test Environment)',
    language: 'en-US',
    languages: ['en-US'],
    platform: 'Test',
    cookieEnabled: true,
    onLine: true,
    sendBeacon: vi.fn(() => true),
    share: vi.fn(() => Promise.resolve()),
    clipboard: {
      writeText: vi.fn(() => Promise.resolve()),
      readText: vi.fn(() => Promise.resolve(''))
    }
  },
  writable: true
});

// Mock Date for consistent testing
const originalDate = Date;
let mockDate = null;

global.setMockDate = (isoString) => {
  mockDate = new originalDate(isoString);
  global.Date = class extends originalDate {
    constructor(...args) {
      if (args.length === 0) {
        return mockDate;
      }
      return new originalDate(...args);
    }
    
    static now() {
      return mockDate ? mockDate.getTime() : originalDate.now();
    }
  };
  global.Date.now = () => mockDate ? mockDate.getTime() : originalDate.now();
};

global.resetMockDate = () => {
  mockDate = null;
  global.Date = originalDate;
};

// Mock Web APIs that might be used
global.fetch = vi.fn();
global.Headers = vi.fn();
global.Request = vi.fn();
global.Response = vi.fn();

// Mock setTimeout/setInterval for deterministic testing
global.mockTimers = {
  setTimeout: vi.fn(),
  setInterval: vi.fn(),
  clearTimeout: vi.fn(),
  clearInterval: vi.fn()
};

// Mock console for testing
global.mockConsole = {
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
  info: vi.fn(),
  debug: vi.fn()
};

// Export mock objects for use in tests
export {
  mockFirestore,
  mockAuth,
  mockAnalytics,
  mockDocumentReference,
  mockCollectionReference,
  mockQuery,
  mockQuerySnapshot,
  mockDocumentSnapshot,
  mockWriteBatch,
  mockTransaction,
  mockUser
};

// Helper functions for tests
export const createMockFirestoreData = (data = {}) => ({
  id: 'mock-id',
  exists: () => true,
  data: () => data,
  get: (field) => data[field],
  ref: mockDocumentReference
});

export const createMockQuerySnapshot = (docs = []) => ({
  docs: docs.map(doc => createMockFirestoreData(doc)),
  empty: docs.length === 0,
  size: docs.length,
  forEach: (callback) => docs.forEach((doc, index) => callback(createMockFirestoreData(doc), index)),
  docChanges: () => []
});

export const mockFirebaseError = (code, message) => {
  const error = new Error(message);
  error.code = code;
  return error;
};

export const resetAllFirebaseMocks = () => {
  // Reset all Firebase-related mocks
  Object.values(vi.getMockedSystemModules() || {}).forEach(module => {
    if (typeof module === 'object' && module !== null) {
      Object.values(module).forEach(fn => {
        if (typeof fn === 'function' && fn.mockReset) {
          fn.mockReset();
        }
      });
    }
  });
};

console.log('✅ Mock setup complete for Firebase and external services'); 