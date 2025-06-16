import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { CheckCircleIcon, XCircleIcon, ClockIcon } from '@heroicons/react/24/outline';

/**
 * SendGrid Integration Tester Component
 * Use this to test that SendGrid integration is working properly
 */
const SendGridTester = () => {
  const { currentUser } = useAuth();
  const [testResults, setTestResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');

  const runSendGridTest = async () => {
    if (!currentUser) {
      alert('You must be logged in to test email sending');
      return;
    }

    setIsLoading(true);
    setTestResults(null);

    try {
      const functions = getFunctions();
      
      // Test 1: Ping test
      console.log('🏓 Running ping test...');
      const testPing = httpsCallable(functions, 'testPing');
      const pingResult = await testPing();
      
      // Test 2: SendGrid email test
      console.log('📧 Running SendGrid email test...');
      const testSendGrid = httpsCallable(functions, 'testSendGrid');
      const emailResult = await testSendGrid({ 
        email: testEmail || currentUser.email 
      });

      setTestResults({
        success: true,
        ping: pingResult.data,
        email: emailResult.data,
        timestamp: new Date().toISOString()
      });

      console.log('✅ SendGrid test completed successfully:', {
        ping: pingResult.data,
        email: emailResult.data
      });

    } catch (error) {
      console.error('❌ SendGrid test failed:', error);
      setTestResults({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const StatusIcon = ({ status }) => {
    if (status === 'loading') return <ClockIcon className="w-5 h-5 text-orange-500 animate-spin" />;
    if (status === 'success') return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
    return <XCircleIcon className="w-5 h-5 text-red-500" />;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          SendGrid Integration Tester
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Test that SendGrid email delivery is working properly for tenant invitations.
        </p>
      </div>

      {/* Test Email Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Test Email Address (optional)
        </label>
        <input
          type="email"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          placeholder={currentUser?.email || 'your-email@example.com'}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
        />
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Leave empty to use your logged-in email: {currentUser?.email}
        </p>
      </div>

      {/* Test Button */}
      <div className="mb-6">
        <Button
          onClick={runSendGridTest}
          disabled={isLoading || !currentUser}
          variant="primary"
          className="w-full"
        >
          {isLoading ? (
            <>
              <ClockIcon className="w-4 h-4 mr-2 animate-spin" />
              Running Tests...
            </>
          ) : (
            '🧪 Run SendGrid Tests'
          )}
        </Button>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="border border-gray-200 dark:border-gray-600 rounded-lg p-4">
          <div className="flex items-center mb-4">
            <StatusIcon status={testResults.success ? 'success' : 'error'} />
            <h3 className="ml-2 text-lg font-semibold text-gray-900 dark:text-white">
              Test Results {testResults.success ? '✅' : '❌'}
            </h3>
          </div>

          {testResults.success ? (
            <div className="space-y-4">
              {/* Ping Test Results */}
              <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-md">
                <h4 className="font-medium text-green-800 dark:text-green-200 mb-2">
                  🏓 Ping Test - Success
                </h4>
                <div className="text-sm text-green-700 dark:text-green-300">
                  <p>Functions are deployed and accessible</p>
                  <p>SendGrid configured: {testResults.ping.sendGridConfigured ? '✅' : '❌'}</p>
                  <p>Timestamp: {testResults.ping.timestamp}</p>
                </div>
              </div>

              {/* Email Test Results */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                  📧 Email Test - Success
                </h4>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <p>Test emails sent to: {testResults.email.results.testEmail}</p>
                  <p>Basic email: {testResults.email.results.basicEmail ? '✅' : '❌'}</p>
                  <p>Invite email: {testResults.email.results.inviteEmail ? '✅' : '❌'}</p>
                  <p className="mt-2 font-medium">
                    📬 Check your inbox for test emails!
                  </p>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  <strong>Next Steps:</strong>
                  <br />
                  1. Check your email inbox for 2 test emails
                  <br />
                  2. If emails arrive, SendGrid is working perfectly!
                  <br />
                  3. Try creating a property and inviting a tenant
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              <h4 className="font-medium text-red-800 dark:text-red-200 mb-2">
                ❌ Test Failed
              </h4>
              <div className="text-sm text-red-700 dark:text-red-300">
                <p>Error: {testResults.error}</p>
                <p className="mt-2">
                  <strong>Possible solutions:</strong>
                  <br />
                  • Check that SendGrid API key is configured
                  <br />
                  • Verify functions are deployed
                  <br />
                  • Check Firebase Functions logs
                  <br />
                  • See SENDGRID_SETUP.md for detailed setup instructions
                </p>
              </div>
            </div>
          )}

          <div className="mt-4 text-xs text-gray-500 dark:text-gray-400">
            Test completed at: {new Date(testResults.timestamp).toLocaleString()}
          </div>
        </div>
      )}

      {/* Setup Instructions */}
      <div className="mt-6 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 dark:text-white mb-2">
          📚 Setup Instructions
        </h4>
        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <p>1. Configure SendGrid API key in Firebase Functions</p>
          <p>2. Deploy functions with: <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">firebase deploy --only functions</code></p>
          <p>3. Run this test to verify email delivery</p>
          <p>4. Check the SENDGRID_SETUP.md file for detailed instructions</p>
        </div>
      </div>
    </div>
  );
};

export default SendGridTester;