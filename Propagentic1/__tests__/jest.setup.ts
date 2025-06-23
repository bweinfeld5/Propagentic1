import { initializeTestEnvironment } from "@firebase/testing";

declare global {
  namespace NodeJS {
    interface Global {
      testEnv: any;
    }
  }
}

// Mock Firebase Auth
jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  onAuthStateChanged: jest.fn(() => jest.fn()),
  signInWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(() => Promise.resolve()),
  signOut: jest.fn(() => Promise.resolve()),
}));

// Mock Firebase Functions
jest.mock('firebase/functions', () => ({
  getFunctions: jest.fn(() => ({})),
  httpsCallable: jest.fn(() => jest.fn(() => Promise.resolve({ data: {} }))),
}));

beforeAll(async () => {
  // Initialize the Firebase testing environment
  try {
    const testEnv = await initializeTestEnvironment({
      projectId: "propagentic-dev",
      firestore: {
        host: "localhost",
        port: 8080
      }
    });
    
    global.testEnv = testEnv;
    console.log("Firebase testing environment initialized");
  } catch (error) {
    console.error("Failed to initialize Firebase testing environment:", error);
  }
});

afterAll(async () => {
  if (global.testEnv) {
    await global.testEnv.cleanup();
    console.log("Firebase testing environment cleaned up");
  }
}); 