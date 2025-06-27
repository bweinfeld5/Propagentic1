import React, { useState } from 'react';
import inviteService from '../../services/firestore/inviteService';
import { db } from '../../firebase/config';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';

interface TestResult {
  step: string;
  status: 'pending' | 'success' | 'error';
  message: string;
  data?: any;
}

const InviteCodeValidationTest: React.FC = () => {
  const [testCodes] = useState(['62523174', '38LXEX7F']);
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (step: string, status: 'pending' | 'success' | 'error', message: string, data?: any) => {
    setResults(prev => [...prev, { step, status, message, data }]);
  };

  const runComprehensiveTest = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Test 1: Firebase Connection
      addResult('Firebase Connection', 'pending', 'Testing Firestore connection...');
      try {
        const testDoc = await getDoc(doc(db, 'invites', 'test-connection'));
        addResult('Firebase Connection', 'success', 'Firestore connection successful');
      } catch (error: any) {
        addResult('Firebase Connection', 'error', `Firestore connection failed: ${error.message}`);
        return;
      }

      // Test 2: Direct Database Query
      addResult('Database Query', 'pending', 'Querying invites collection...');
      try {
        const invitesRef = collection(db, 'invites');
        const allInvites = await getDocs(invitesRef);
        addResult('Database Query', 'success', `Found ${allInvites.size} invites in database`, {
          totalInvites: allInvites.size,
          inviteIds: allInvites.docs.map(doc => doc.id)
        });
      } catch (error: any) {
        addResult('Database Query', 'error', `Database query failed: ${error.message}`);
        return;
      }

      // Test 3: Check specific invite documents
      for (const code of testCodes) {
        addResult(`Direct Document Check (${code})`, 'pending', `Checking if ${code} exists as document ID...`);
        try {
          const docRef = doc(db, 'invites', code);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const data = docSnap.data();
            addResult(`Direct Document Check (${code})`, 'success', `Document exists with ID: ${code}`, data);
          } else {
            addResult(`Direct Document Check (${code})`, 'error', `No document found with ID: ${code}`);
          }
        } catch (error: any) {
          addResult(`Direct Document Check (${code})`, 'error', `Error checking document: ${error.message}`);
        }

        // Test 4: Check shortCode field
        addResult(`ShortCode Query (${code})`, 'pending', `Searching for shortCode field: ${code}...`);
        try {
          const invitesRef = collection(db, 'invites');
          const q = query(invitesRef, where('shortCode', '==', code.toUpperCase()));
          const querySnapshot = await getDocs(q);
          
          if (!querySnapshot.empty) {
            const docs = querySnapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
            addResult(`ShortCode Query (${code})`, 'success', `Found ${docs.length} documents with shortCode: ${code}`, docs);
          } else {
            addResult(`ShortCode Query (${code})`, 'error', `No documents found with shortCode: ${code}`);
          }
        } catch (error: any) {
          addResult(`ShortCode Query (${code})`, 'error', `ShortCode query failed: ${error.message}`);
        }

        // Test 5: Test resolveShortCode function
        addResult(`Resolve Function (${code})`, 'pending', `Testing resolveShortCode function...`);
        try {
          const resolvedId = await inviteService.resolveShortCode(code);
          if (resolvedId) {
            addResult(`Resolve Function (${code})`, 'success', `Resolved to document ID: ${resolvedId}`, { resolvedId });
          } else {
            addResult(`Resolve Function (${code})`, 'error', `resolveShortCode returned null for: ${code}`);
          }
        } catch (error: any) {
          addResult(`Resolve Function (${code})`, 'error', `resolveShortCode failed: ${error.message}`);
        }

        // Test 6: Full validation
        addResult(`Full Validation (${code})`, 'pending', `Testing full validateInviteCode function...`);
        try {
          const validationResult = await inviteService.validateInviteCode(code);
          addResult(`Full Validation (${code})`, validationResult.isValid ? 'success' : 'error', 
            validationResult.message || 'Unknown validation result', validationResult);
        } catch (error: any) {
          addResult(`Full Validation (${code})`, 'error', `Validation failed: ${error.message}`);
        }
      }

      // Test 7: Service imports check
      addResult('Service Check', 'pending', 'Checking service imports...');
      try {
        const serviceCheck = {
          hasValidateInviteCode: typeof inviteService.validateInviteCode === 'function',
          hasResolveShortCode: typeof inviteService.resolveShortCode === 'function',
          serviceKeys: Object.keys(inviteService)
        };
        addResult('Service Check', 'success', 'Service functions available', serviceCheck);
      } catch (error: any) {
        addResult('Service Check', 'error', `Service check failed: ${error.message}`);
      }

      // Test 8: Check for all invites with status 'sent'
      addResult('Status Filter', 'pending', 'Checking invites with status "sent"...');
      try {
        const invitesRef = collection(db, 'invites');
        const q = query(invitesRef, where('status', '==', 'sent'));
        const querySnapshot = await getDocs(q);
        
        const sentInvites = querySnapshot.docs.map(doc => ({ 
          id: doc.id, 
          shortCode: doc.data().shortCode,
          status: doc.data().status,
          tenantEmail: doc.data().tenantEmail,
          propertyName: doc.data().propertyName
        }));
        
        addResult('Status Filter', 'success', `Found ${sentInvites.length} invites with status "sent"`, sentInvites);
      } catch (error: any) {
        addResult('Status Filter', 'error', `Status filter failed: ${error.message}`);
      }

    } catch (error: any) {
      addResult('Test Suite', 'error', `Test suite failed: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white border border-gray-300 rounded-lg shadow-lg z-50 overflow-hidden">
      <div className="bg-blue-600 text-white p-3 font-semibold">
        🔍 Invite Code Validation Debug Tool
      </div>
      
      <div className="p-4 space-y-3">
        <div className="text-sm text-gray-600">
          Testing codes: {testCodes.join(', ')}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={runComprehensiveTest}
            disabled={isRunning}
            className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600 disabled:opacity-50"
          >
            {isRunning ? 'Running...' : 'Run Tests'}
          </button>
          <button
            onClick={clearResults}
            className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
          >
            Clear
          </button>
        </div>
        
        <div className="max-h-64 overflow-y-auto space-y-2 text-xs">
          {results.map((result, index) => (
            <div
              key={index}
              className={`p-2 rounded border-l-4 ${
                result.status === 'success'
                  ? 'bg-green-50 border-green-400 text-green-800'
                  : result.status === 'error'
                  ? 'bg-red-50 border-red-400 text-red-800'
                  : 'bg-yellow-50 border-yellow-400 text-yellow-800'
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
          
          {results.length === 0 && (
            <div className="text-gray-500 text-center py-4">
              Click "Run Tests" to start debugging
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InviteCodeValidationTest; 