import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

/**
 * SendGrid Integration Tester Component
 * Use this to test that SendGrid integration is working properly
 */
const SendGridTester = () => {
  const [testEmail, setTestEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);

  const runSendGridTest = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      const functions = getFunctions();
      
      // Test 1: Basic ping test
      console.log('Testing basic ping...');
      const testPing = httpsCallable(functions, 'testPing');
      const pingResult = await testPing();
      console.log('Ping result:', pingResult.data);

      // Test 2: SendGrid test
      console.log('Testing SendGrid...');
      const testSendGrid = httpsCallable(functions, 'testSendGrid');
      const sendGridResult = await testSendGrid({ email: testEmail });
      console.log('SendGrid result:', sendGridResult.data);

      setResults({
        ping: pingResult.data,
        sendGrid: sendGridResult.data,
        success: true
      });

      toast.success(`✅ SendGrid test completed! Check ${testEmail} for test emails.`);

    } catch (error) {
      console.error('SendGrid test failed:', error);
      
      setResults({
        error: error.message,
        code: error.code,
        details: error.details,
        success: false
      });

      toast.error(`❌ SendGrid test failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testInviteFlow = async () => {
    if (!testEmail) {
      toast.error('Please enter an email address');
      return;
    }

    setLoading(true);

    try {
      const functions = getFunctions();
      const sendPropertyInvite = httpsCallable(functions, 'sendPropertyInvite');
      
      // Create a test invite
      const result = await sendPropertyInvite({
        propertyId: 'test-property-id',
        tenantEmail: testEmail,
        propertyName: 'Test Property - 123 Main St',
        landlordName: 'Test Landlord'
      });

      console.log('Invite test result:', result.data);
      
      if (result.data.success) {
        toast.success(`✅ Test invitation sent to ${testEmail}!`);
        setResults({
          invite: result.data,
          success: true
        });
      } else {
        throw new Error(result.data.message || 'Invite failed');
      }

    } catch (error) {
      console.error('Invite test failed:', error);
      toast.error(`❌ Invite test failed: ${error.message}`);
      setResults({
        error: error.message,
        success: false
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📧 SendGrid Integration Tester</h2>
        <p className="text-gray-600">Test email delivery and diagnose any issues with the SendGrid integration.</p>
      </div>

      <div className="space-y-6">
        <div>
          <label htmlFor="testEmail" className="block text-sm font-semibold text-gray-700 mb-2">
            Test Email Address
          </label>
          <input
            type="email"
            id="testEmail"
            className="block w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="your-email@example.com"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
          />
        </div>

        <div className="flex gap-3">
          <Button
            onClick={runSendGridTest}
            isLoading={loading}
            disabled={loading || !testEmail}
            variant="primary"
            className="flex-1"
          >
            {loading ? 'Testing...' : '🧪 Test SendGrid'}
          </Button>
          
          <Button
            onClick={testInviteFlow}
            isLoading={loading}
            disabled={loading || !testEmail}
            variant="secondary"
            className="flex-1"
          >
            {loading ? 'Testing...' : '📨 Test Invite Flow'}
          </Button>
        </div>

        {results && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">Test Results</h3>
            <div className={`rounded-xl p-4 border ${
              results.success 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <pre className="text-sm overflow-auto">
                {JSON.stringify(results, null, 2)}
              </pre>
            </div>

            {results.success ? (
              <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">✅ Next Steps:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Check your email inbox for test messages</li>
                  <li>• Verify that emails are not in spam folder</li>
                  <li>• If emails arrive, SendGrid is working correctly</li>
                  <li>• If no emails arrive, check Firebase Functions logs</li>
                </ul>
              </div>
            ) : (
              <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">❌ Troubleshooting:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Check if SendGrid API key is configured in Firebase Functions</li>
                  <li>• Verify that functions are deployed correctly</li>
                  <li>• Check Firebase Functions logs for detailed errors</li>
                  <li>• Ensure SendGrid sender email is verified</li>
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-2">📋 Debugging Checklist:</h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• ✅ SendGrid API key configured in Firebase Functions config</li>
            <li>• ✅ Functions deployed with latest code</li>
            <li>• ❓ Sender email verified in SendGrid dashboard</li>
            <li>• ❓ Domain authentication set up (recommended)</li>
            <li>• ❓ Check Firebase Functions logs for errors</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SendGridTester;