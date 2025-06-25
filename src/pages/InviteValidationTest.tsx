import React, { useState } from 'react';
import inviteService from '../services/firestore/inviteService';
import FirestoreDataInspector from '../components/debug/FirestoreDataInspector';
import { useAuth } from '../context/AuthContext.jsx';

const InviteValidationTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [testCode, setTestCode] = useState('62523174');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testValidation = async () => {
    if (!currentUser) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      console.log(`🧪 Testing invite code: ${testCode}`);
      console.log(`👤 Current user: ${currentUser.uid} (${currentUser.email})`);
      
      const validationResult = await inviteService.validateInviteCode(testCode);
      
      console.log('📋 Validation result:', validationResult);
      setResult(validationResult);
      
    } catch (err: any) {
      console.error('❌ Validation error:', err);
      setError(err.message || 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-2xl font-bold mb-6">🔍 Invite Code Validation Test</h1>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Invite Code:
              </label>
              <input
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter invite code"
              />
            </div>
            
            <button
              onClick={testValidation}
              disabled={loading || !currentUser}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Testing...' : 'Test Validation'}
            </button>
          </div>
          
          {!currentUser && (
            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 rounded">
              ⚠️ Please log in first to test invite validation
            </div>
          )}
          
          {error && (
            <div className="mt-4 p-3 bg-red-100 border border-red-400 rounded">
              <strong>Error:</strong> {error}
            </div>
          )}
          
          {result && (
            <div className="mt-4">
              <h3 className="text-lg font-semibold mb-2">📊 Validation Result:</h3>
              <div className={`p-4 rounded-md ${
                result.isValid ? 'bg-green-100 border border-green-400' : 'bg-red-100 border border-red-400'
              }`}>
                <div className="space-y-2">
                  <p><strong>Valid:</strong> {result.isValid ? '✅ Yes' : '❌ No'}</p>
                  <p><strong>Message:</strong> {result.message}</p>
                  
                  {result.inviteData && (
                    <div className="mt-3">
                      <p><strong>📋 Invite Data:</strong></p>
                      <pre className="mt-1 p-2 bg-gray-100 rounded text-sm overflow-auto">
                        {JSON.stringify(result.inviteData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="mt-6 p-4 bg-blue-50 rounded-md">
            <h4 className="font-semibold text-blue-900 mb-2">📝 Test Codes to Try:</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li><code className="bg-blue-200 px-1 rounded">62523174</code> - 8-digit shortCode</li>
              <li><code className="bg-blue-200 px-1 rounded">38LXEX7F</code> - 20-character document ID</li>
            </ul>
          </div>
        </div>
      </div>
      
      {/* Firestore Data Inspector */}
      <FirestoreDataInspector />
    </div>
  );
};

export default InviteValidationTest; 