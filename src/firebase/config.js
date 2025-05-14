// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, connectAuthEmulator } from "firebase/auth";
import { 
  getFirestore, 
  connectFirestoreEmulator, 
  initializeFirestore,
  CACHE_SIZE_UNLIMITED,
  persistentLocalCache,
  persistentMultipleTabManager
} from "firebase/firestore";
import { getStorage, connectStorageEmulator } from "firebase/storage";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";
import { getAnalytics, isSupported } from "firebase/analytics";

// Firebase configuration object (Merged from firebaseConfig.js)
// TODO: Use environment variables in production
const firebaseConfig = {
  apiKey: "AIzaSyDcsJWLoVoC_kPORoVJA_-mG3LIWfbU-rw",
  authDomain: "propagentic.firebaseapp.com",
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com",
  projectId: "propagentic",
  storageBucket: "propagentic.firebasestorage.app",
  messagingSenderId: "121286300748",
  appId: "1:121286300748:web:0c69ea6ff643c8f75110e9",
  measurementId: "G-7DTWZQH28H"
};

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Initialize Firebase - This ensures firebase.initializeApp() is only called once
let app;
try {
  app = initializeApp(firebaseConfig);
  console.log("Firebase initialized successfully");
} catch (error) {
  if (error.code === 'app/duplicate-app') {
    console.log("Firebase app already exists, retrieving existing instance");
    app = initializeApp(firebaseConfig, "secondary");
  } else {
    console.error("Firebase initialization error:", error);
    throw error;
  }
}

// Initialize services with modern cache settings
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    cacheSizeBytes: CACHE_SIZE_UNLIMITED,
    tabManager: persistentMultipleTabManager()
  })
});

console.log("Multi-tab offline persistence enabled");

const auth = getAuth(app);
const storage = getStorage(app);
const functions = getFunctions(app);

// DEBUG: Monitor auth state changes
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log('[DEBUG] Auth state changed: User signed in', user.uid);
  } else {
    console.log('[DEBUG] Auth state changed: User signed out');
  }
});

// Initialize Analytics conditionally (it may not be available in all environments)
let analytics = null;
isSupported().then(supported => {
  if (supported) {
    analytics = getAnalytics(app);
  }
}).catch(e => console.error("Analytics error:", e));

// Use emulators for local development
if (process.env.NODE_ENV === 'development') {
  try {
    // Uncomment these lines to use Firebase emulators
    // connectFunctionsEmulator(functions, "localhost", 5001);
    // connectFirestoreEmulator(db, 'localhost', 8080);
    // connectAuthEmulator(auth, "http://localhost:9099");
    // connectStorageEmulator(storage, "localhost", 9199);
    console.log("[DEBUG] Firebase emulator connections configured");
  } catch (error) {
    console.error("[DEBUG] Error connecting to Firebase emulators:", error);
  }
}

// Export all Firebase services
export { app, auth, db, storage, functions, analytics };

// Helper for using callable functions
export const callFunction = async (name, data) => {
  const { httpsCallable } = await import('firebase/functions');
  const func = httpsCallable(functions, name);
  try {
    const result = await func(data);
    return result.data;
  } catch (error) {
    console.error(`Error calling function ${name}:`, error);
    throw error;
  }
};

export default app; 