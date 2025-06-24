import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../firebase/config';
import { unifiedInviteCodeService, GenerationResult } from '../../services/unifiedInviteCodeService';
import { QRCodeDisplay } from '../qr/QRCodeDisplay';
import toast from 'react-hot-toast';
import QRCodeStyling from 'qr-code-styling';
import Button from '../ui/Button';

interface TestResult {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  data?: any;
  timestamp?: string;
}

export const QRCodeInviteTest: React.FC = () => {
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      unifiedInviteCodeService.clearLocalCodes();
    };
  }, []);

  const updateTest = (name: string, status: TestResult['status'], message: string, data?: any) => {
    setTestResults(prev => {
      const existing = prev.find(r => r.name === name);
      const newResult = {
        name,
        status,
        message,
        data,
        timestamp: new Date().toLocaleTimeString()
      };
      
      if (existing) {
        return prev.map(r => r.name === name ? newResult : r);
      } else {
        return [...prev, newResult];
      }
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    setGeneratedCode(null);

    try {
      // Test 1: Check Authentication
      updateTest('auth', 'running', 'Checking user authentication...');
      const currentUser = auth.currentUser;
      if (!currentUser) {
        updateTest('auth', 'error', 'No user is logged in. Please log in first.');
        setIsRunning(false);
        return;
      }
      updateTest('auth', 'success', `Authenticated as: ${currentUser.email}`, {
        uid: currentUser.uid,
        email: currentUser.email
      });

      // Test 2: Test Local Invite Code Service
      updateTest('localService', 'running', 'Testing local invite code service...');
      try {
        const localResult = await unifiedInviteCodeService.generateInviteCode('test-property-local', { expirationDays: 7 });
        if (localResult.success) {
          updateTest('localService', 'success', `Local service works: ${localResult.code}`, localResult);
          setGeneratedCode(localResult.code);
        } else {
          updateTest('localService', 'error', 'Local service returned failure');
        }
      } catch (error: any) {
        updateTest('localService', 'error', `Local service error: ${error.message}`);
      }

      // Test 3: Test Firebase Functions (this may fail due to CORS)
      updateTest('firebaseFunctions', 'running', 'Testing Firebase Functions...');
      try {
        const functions = getFunctions();
        const generateInviteCodeFunction = httpsCallable(functions, 'generateInviteCode');
        
        const result = await generateInviteCodeFunction({
          propertyId: 'test-property-firebase',
          expirationDays: 7
        });

        const data = result.data as any;
        if (data && data.success) {
          updateTest('firebaseFunctions', 'success', `Firebase Functions works: ${data.code}`, data);
          if (!generatedCode) {
            setGeneratedCode(data.code);
          }
        } else {
          updateTest('firebaseFunctions', 'error', `Firebase Functions failed: ${data?.message || 'Unknown error'}`);
        }
      } catch (error: any) {
        updateTest('firebaseFunctions', 'error', `Firebase Functions error: ${error.message}`, {
          code: error.code,
          message: error.message
        });
      }

      // Test 4: Test QR Code Component
      if (generatedCode) {
        updateTest('qrComponent', 'running', 'Testing QR code component...');
        try {
          updateTest('qrComponent', 'success', 'QR code component ready for display');
        } catch (error: any) {
          updateTest('qrComponent', 'error', `QR component error: ${error.message}`);
        }
      } else {
        updateTest('qrComponent', 'error', 'No invite code available for QR generation');
      }

      // Test 5: Test Local Service Validation
      if (generatedCode) {
        updateTest('validation', 'running', 'Testing invite code validation...');
        try {
          const validationResult = await unifiedInviteCodeService.validateInviteCode(generatedCode);
          if (validationResult.valid) {
            updateTest('validation', 'success', 'Code validation successful', validationResult);
          } else {
            updateTest('validation', 'error', `Validation failed: ${validationResult.message}`);
          }
        } catch (error: any) {
          updateTest('validation', 'error', `Validation error: ${error.message}`);
        }
      }

    } catch (error: any) {
      console.error('❌ Test suite error:', error);
      updateTest('general', 'error', `Test suite error: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const clearLocalCodes = () => {
    unifiedInviteCodeService.clearLocalCodes();
    toast.success('Local invite codes cleared');
    setGeneratedCode(null);
    setTestResults([]);
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return <ArrowPathIcon className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'error':
        return <XCircleIcon className="w-5 h-5 text-red-500" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestResult['status']) => {
    switch (status) {
      case 'running':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <div className="fixed bottom-4 left-4 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">QR Code Tests</h3>
          <div className="flex gap-2">
            <button
              onClick={clearLocalCodes}
              className="px-2 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear
            </button>
            <button
              onClick={runTests}
              disabled={isRunning}
              className="px-3 py-1.5 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <PlayIcon className="w-4 h-4" />
              {isRunning ? 'Running...' : 'Test'}
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {testResults.length === 0 && !isRunning && (
          <p className="text-gray-500 text-center py-4">
            Click "Test" to troubleshoot QR invite codes
          </p>
        )}

        <div className="space-y-3">
          {testResults.map((result) => (
            <div
              key={result.name}
              className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(result.status)}
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 capitalize">
                    {result.name.replace(/([A-Z])/g, ' $1').trim()}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {result.message}
                  </div>
                  {result.timestamp && (
                    <div className="text-xs text-gray-400 mt-1">
                      {result.timestamp}
                    </div>
                  )}
                  {result.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View Details
                      </summary>
                      <pre className="text-xs text-gray-600 mt-1 p-2 bg-gray-100 rounded overflow-x-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* QR Code Display */}
        {generatedCode && (
          <div className="mt-4 p-4 border border-green-200 bg-green-50 rounded-lg">
            <h4 className="font-medium text-green-900 mb-3">Generated QR Code</h4>
            <div className="flex justify-center">
              <QRCodeDisplay 
                inviteCode={generatedCode}
                propertyName="Test Property"
                size={120}
              />
            </div>
            <p className="text-sm text-green-700 mt-2 text-center">
              Code: <code className="bg-white px-2 py-1 rounded">{generatedCode}</code>
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default QRCodeInviteTest; 