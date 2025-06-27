import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import inviteService from '../services/firestore/inviteService';
import { unifiedInviteCodeService } from '../services/unifiedInviteCodeService';
import { auth } from '../firebase/config';
import Button from '../components/ui/Button';

interface TestResult {
  timestamp: string;
  code: string;
  step: string;
  success: boolean;
  data?: any;
  error?: string;
}

const InviteCodeBrowserTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [authToken, setAuthToken] = useState<string | null>(null);

  // Test codes from user's data
  const testCodes = [
    { code: '62523174', description: '8-digit code (working validation)' },
    { code: '38LXEX7F', description: '8-character code (failing validation)' },
    { code: '64251450', description: '8-digit code (from console log)' }
  ];

  useEffect(() => {
    // Get auth token for debugging
    const getAuthToken = async () => {
      if (currentUser) {
        try {
          const token = await currentUser.getIdToken();
          setAuthToken(token);
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      }
    };
    getAuthToken();
  }, [currentUser]);

  const addResult = (code: string, step: string, success: boolean, data?: any, error?: string) => {
    const result: TestResult = {
      timestamp: new Date().toISOString(),
      code,
      step,
      success,
      data,
      error
    };
    setTestResults(prev => [...prev, result]);
    console.log(`${success ? '✅' : '❌'} ${step} for ${code}:`, data || error);
  };

  const testAuthState = async (code: string) => {
    try {
      // Test Firebase Auth state
      const user = auth.currentUser;
      addResult(code, 'Firebase Auth Check', !!user, {
        uid: user?.uid,
        email: user?.email,
        emailVerified: user?.emailVerified
      });

      // Test auth token
      if (user) {
        const token = await user.getIdToken();
        addResult(code, 'Auth Token Generation', true, {
          tokenLength: token.length,
          tokenPreview: token.substring(0, 50) + '...'
        });
        
        // Verify token claims
        const tokenResult = await user.getIdTokenResult();
        addResult(code, 'Token Claims Check', true, {
          authTime: tokenResult.authTime,
          issuedAtTime: tokenResult.issuedAtTime,
          signInProvider: tokenResult.signInProvider
        });
      }
    } catch (error: any) {
      addResult(code, 'Auth State Check', false, null, error.message);
    }
  };

  const testValidation = async (code: string) => {
    try {
      console.log(`🔍 Testing validation for: ${code}`);
      const result = await inviteService.validateInviteCode(code);
      addResult(code, 'Validation', result.isValid, result, result.message);
      return result;
    } catch (error: any) {
      addResult(code, 'Validation', false, null, error.message);
      return null;
    }
  };

  const testRedemption = async (code: string) => {
    try {
      console.log(`🚀 Testing redemption for: ${code} - DISABLED`);
      
      if (!currentUser) {
        addResult(code, 'Redemption', false, null, 'No current user');
        return;
      }

      // TODO: Invite code redemption functionality is being rebuilt
      console.warn('Invite code redemption temporarily disabled - feature being rebuilt');
      addResult(code, 'Redemption', false, null, 'Redemption functionality temporarily disabled - being rebuilt');
      return null;

      /* ORIGINAL FUNCTIONALITY COMMENTED OUT - TO BE REBUILT
             const result = await unifiedInviteCodeService.redeemInviteCode(code, currentUser.uid);
      addResult(code, 'Redemption', result.success, result, result.message);
      return result;
      */
    } catch (error: any) {
      addResult(code, 'Redemption', false, null, error.message);
      return null;
    }
  };

  const testFirebaseFunction = async (code: string) => {
    try {
      console.log(`🔥 Testing Firebase Function directly for: ${code} - DISABLED`);
      
      if (!currentUser) {
        addResult(code, 'Firebase Function Test', false, null, 'No current user');
        return;
      }

      // TODO: Firebase redeemInviteCode function has been removed - feature being rebuilt
      console.warn('redeemInviteCode Firebase function removed - feature being rebuilt');
      addResult(code, 'Firebase Function Test', false, null, 'redeemInviteCode function removed from Firebase - being rebuilt');
      return;

      /* ORIGINAL FUNCTIONALITY COMMENTED OUT - TO BE REBUILT
      // Get fresh token
      const token = await currentUser.getIdToken(true);
      
      // Test the function directly
      const response = await fetch('https://us-central1-propagentic-ai.cloudfunctions.net/redeemInviteCode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          data: {
            inviteCode: code,
            tenantId: currentUser.uid
          }
        })
      });

      const responseData = await response.json();
      addResult(code, 'Firebase Function Direct Call', response.ok, responseData);
      */
      
    } catch (error: any) {
      addResult(code, 'Firebase Function Test', false, null, error.message);
    }
  };

  const runComprehensiveTest = async (code: string) => {
    console.log(`\n🧪 Starting comprehensive test for: ${code}`);
    
    // Step 1: Test authentication state
    await testAuthState(code);
    
    // Step 2: Test validation
    const validationResult = await testValidation(code);
    
    // Step 3: Test redemption (only if validation passed)
    if (validationResult?.isValid) {
      await testRedemption(code);
      await testFirebaseFunction(code);
    }
    
    console.log(`✅ Completed test for: ${code}\n`);
  };

  const runAllTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    console.log('🚀 Starting comprehensive invite code tests...');
    
    for (const testCode of testCodes) {
      await runComprehensiveTest(testCode.code);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    setIsRunning(false);
    console.log('✅ All tests completed!');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  const exportResults = () => {
    const dataStr = JSON.stringify(testResults, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `invite-code-test-results-${new Date().toISOString()}.json`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            🧪 Invite Code Browser Test Suite
          </h1>
          
          {/* Auth Status */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2">Authentication Status</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="font-medium">User:</span>{' '}
                <span className={currentUser ? 'text-green-600' : 'text-red-600'}>
                  {currentUser ? `✅ ${currentUser.email}` : '❌ Not logged in'}
                </span>
              </div>
              <div>
                <span className="font-medium">UID:</span>{' '}
                <span className="text-gray-600">{currentUser?.uid || 'N/A'}</span>
              </div>
              <div>
                <span className="font-medium">Token:</span>{' '}
                <span className={authToken ? 'text-green-600' : 'text-red-600'}>
                  {authToken ? '✅ Available' : '❌ Missing'}
                </span>
              </div>
            </div>
          </div>

          {/* Test Codes */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold mb-4">Test Cases</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {testCodes.map((testCode, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="font-mono text-lg font-bold text-blue-600">
                    {testCode.code}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {testCode.description}
                  </div>
                  <Button
                    onClick={() => runComprehensiveTest(testCode.code)}
                    disabled={isRunning}
                    className="mt-2 w-full"
                    size="sm"
                  >
                    Test This Code
                  </Button>
                </div>
              ))}
            </div>
          </div>

          {/* Controls */}
          <div className="flex gap-4 mb-6">
            <Button
              onClick={runAllTests}
              disabled={isRunning || !currentUser}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isRunning ? '🔄 Running Tests...' : '🚀 Run All Tests'}
            </Button>
            <Button
              onClick={clearResults}
              disabled={isRunning}
              variant="outline"
            >
              Clear Results
            </Button>
            <Button
              onClick={exportResults}
              disabled={testResults.length === 0}
              variant="outline"
            >
              Export Results
            </Button>
          </div>

          {!currentUser && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800">
                ⚠️ You must be logged in to run redemption tests. Please log in first.
              </p>
            </div>
          )}
        </div>

        {/* Results */}
        {testResults.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              📊 Test Results ({testResults.length})
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {testResults.map((result, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${
                    result.success
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                        {result.success ? '✅' : '❌'}
                      </span>
                      <span className="font-medium text-gray-900">
                        {result.step}
                      </span>
                      <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                        {result.code}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(result.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  
                  {result.error && (
                    <div className="text-red-700 text-sm mb-2">
                      <strong>Error:</strong> {result.error}
                    </div>
                  )}
                  
                  {result.data && (
                    <details className="text-sm">
                      <summary className="cursor-pointer text-gray-600 hover:text-gray-800">
                        View Data
                      </summary>
                      <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InviteCodeBrowserTest; 