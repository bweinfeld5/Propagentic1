import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import InviteTenantModal from '../components/landlord/InviteTenantModal';
import SendGridTester from '../components/testing/SendGridTester';
import Button from '../components/ui/Button';

const TestPage = () => {
  const { currentUser } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);

  // Mock properties for testing
  const mockProperties = [
    {
      id: 'test-property-1',
      name: 'Sunny Hill Apartments',
      nickname: 'Sunny Hill',
      streetAddress: '123 Main St'
    },
    {
      id: 'test-property-2', 
      name: 'Downtown Loft',
      nickname: 'Downtown Loft',
      streetAddress: '456 Oak Ave'
    }
  ];

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Please log in to test</h1>
          <p className="text-gray-600">You need to be logged in to test the email functionality.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🧪 PropAgentic Test Page</h1>
          <p className="text-gray-600">Test email functionality and UI components</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* UI Testing Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">🎨 UI Testing</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Tenant Invitation Modal</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test the improved tenant invitation modal with better styling and UX.
                </p>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  variant="primary"
                >
                  Open Invite Modal
                </Button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">UI Improvements Made:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Enhanced modal styling with gradient header</li>
                  <li>• Better form layout with rounded inputs</li>
                  <li>• Improved visual hierarchy and spacing</li>
                  <li>• Fixed z-index issues and backdrop blur</li>
                  <li>• Added emojis and better visual feedback</li>
                  <li>• Responsive design improvements</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Email Testing Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 Email Testing</h2>
            <div className="space-y-4">
              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Current Status:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• ✅ SendGrid API key configured</li>
                  <li>• ✅ Functions code updated</li>
                  <li>• ❌ Function deployment issues</li>
                  <li>• ❓ Email delivery pending deployment fix</li>
                </ul>
              </div>

              <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                <h4 className="font-semibold text-red-800 mb-2">Known Issues:</h4>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• Cloud Functions deployment failing</li>
                  <li>• Container health check timeouts</li>
                  <li>• Need to fix function runtime issues</li>
                </ul>
              </div>

              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h4 className="font-semibold text-green-800 mb-2">Next Steps:</h4>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Fix function deployment issues</li>
                  <li>• Test SendGrid integration</li>
                  <li>• Verify email delivery</li>
                  <li>• Test end-to-end invite flow</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* SendGrid Tester Component */}
        <div className="mt-8">
          <SendGridTester />
        </div>

        {/* Debug Information */}
        <div className="mt-8 bg-gray-100 rounded-xl p-6 border border-gray-300">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Debug Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <p><strong>User ID:</strong> {currentUser.uid}</p>
              <p><strong>Email:</strong> {currentUser.email}</p>
              <p><strong>Display Name:</strong> {currentUser.displayName || 'Not set'}</p>
            </div>
            <div>
              <p><strong>Mock Properties:</strong> {mockProperties.length}</p>
              <p><strong>Environment:</strong> {process.env.NODE_ENV}</p>
              <p><strong>Timestamp:</strong> {new Date().toISOString()}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tenant Invitation Modal */}
      <InviteTenantModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        properties={mockProperties}
        onInviteSuccess={() => {
          console.log('Invite sent successfully!');
          setShowInviteModal(false);
        }}
      />
    </div>
  );
};

export default TestPage; 