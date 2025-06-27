import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { db, auth } from '../../firebase/config';
import { collection, doc, getDoc, getDocs, addDoc } from 'firebase/firestore';

interface AuthTestResult {
  step: string;
  status: 'success' | 'error' | 'info';
  message: string;
  data?: any;
}

const FirebaseAuthTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [results, setResults] = useState<AuthTestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (step: string, status: 'success' | 'error' | 'info', message: string, data?: any) => {
    setResults(prev => [...prev, { step, status, message, data }]);
  };

  const runAuthTests = async () => {
    setIsRunning(true);
    setResults([]);

    // Test 1: Auth State
    addResult('Auth State', currentUser ? 'success' : 'error', 
      currentUser ? `Logged in as: ${currentUser.email}` : 'No user logged in', 
      { 
        uid: currentUser?.uid,
        email: currentUser?.email,
        emailVerified: currentUser?.emailVerified
      }
    );

    // Test 2: Firebase Config
    addResult('Firebase Config', 'info', 'Checking configuration', {
      authInitialized: !!auth,
      hasUser: !!currentUser,
      uid: currentUser?.uid || 'Not authenticated'
    });

    if (!currentUser) {
      addResult('Permissions Test', 'error', 'Cannot test permissions without authentication');
      setIsRunning(false);
      return;
    }

    // Test 3: Token Information
    try {
      const token = await currentUser.getIdToken();
      const tokenResult = await currentUser.getIdTokenResult();
      addResult('Token Check', 'success', 'Token retrieved successfully', {
        hasToken: !!token,
        claims: tokenResult.claims,
        expirationTime: tokenResult.expirationTime
      });
    } catch (error: any) {
      addResult('Token Check', 'error', `Token error: ${error.message}`);
    }

    // Test 4: Read Permission Test
    try {
      const testCollection = collection(db, 'invites');
      const snapshot = await getDocs(testCollection);
      addResult('Read Permission', 'success', `Successfully read invites collection (${snapshot.size} documents)`, {
        documentCount: snapshot.size,
        isEmpty: snapshot.empty
      });
    } catch (error: any) {
      addResult('Read Permission', 'error', `Read failed: ${error.message}`, {
        code: error.code,
        details: error.details
      });
    }

    // Test 5: Write Permission Test
    try {
      const testDoc = {
        test: true,
        userId: currentUser.uid,
        timestamp: new Date(),
        purpose: 'permission_test'
      };
      
      // Try to write to a test collection
      const testCollection = collection(db, 'test_permissions');
      await addDoc(testCollection, testDoc);
      addResult('Write Permission', 'success', 'Successfully wrote test document');
    } catch (error: any) {
      addResult('Write Permission', 'error', `Write failed: ${error.message}`, {
        code: error.code,
        details: error.details
      });
    }

    // Test 6: Specific Invite Document Test
    try {
      const inviteDocRef = doc(db, 'invites', '38LXEX7F');
      const inviteSnap = await getDoc(inviteDocRef);
      
      if (inviteSnap.exists()) {
        addResult('Specific Document', 'success', 'Found invite document 38LXEX7F', inviteSnap.data());
      } else {
        addResult('Specific Document', 'error', 'Invite document 38LXEX7F does not exist');
      }
    } catch (error: any) {
      addResult('Specific Document', 'error', `Document read failed: ${error.message}`, {
        code: error.code
      });
    }

    setIsRunning(false);
  };

  useEffect(() => {
    // Auto-run on component mount
    if (currentUser) {
      runAuthTests();
    }
  }, [currentUser]);

  return (
    <div className="fixed top-4 right-4 w-80 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="bg-red-600 text-white p-3 font-semibold">
        🔐 Firebase Auth & Permissions Test
      </div>
      
      <div className="p-4 space-y-3">
        <button
          onClick={runAuthTests}
          disabled={isRunning}
          className="w-full px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 disabled:opacity-50"
        >
          {isRunning ? 'Testing...' : 'Run Auth Tests'}
        </button>
        
        <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-2 rounded border-l-4 ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-400 text-green-800'
                  : result.status === 'error'
                  ? 'bg-red-50 border-red-400 text-red-800'
                  : 'bg-blue-50 border-blue-400 text-blue-800'
              }`}
            >
              <div className="font-semibold">{result.step}</div>
              <div>{result.message}</div>
              {result.data && (
                <details className="mt-1">
                  <summary className="cursor-pointer text-xs opacity-75">View Data</summary>
                  <pre className="text-xs mt-1 p-1 bg-gray-100 rounded overflow-x-auto">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </details>
              )}
            </div>
          ))}
          
          {results.length === 0 && !isRunning && (
            <div className="text-gray-500 text-center py-4">
              {currentUser ? 'Click "Run Auth Tests" to start' : 'Please log in first'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FirebaseAuthTest; 