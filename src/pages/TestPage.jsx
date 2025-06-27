import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import InviteTenantModal from '../components/landlord/InviteTenantModal';
import SendGridTester from '../components/testing/SendGridTester';
import Button from '../components/ui/Button';
import QRCodeInviteTest from '../components/debug/QRCodeInviteTest';
import { unifiedInviteService } from '../services/unifiedInviteService';

const TestPage = () => {
  const { currentUser } = useAuth();
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showQRTest, setShowQRTest] = useState(false);
  const [unifiedTestResult, setUnifiedTestResult] = useState(null);
  const [specificCodeResult, setSpecificCodeResult] = useState(null);
  const [testingUnified, setTestingUnified] = useState(false);
  const [testingSpecificCode, setTestingSpecificCode] = useState(false);

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

  const testUnifiedInviteService = async () => {
    setTestingUnified(true);
    setUnifiedTestResult(null);
    
    try {
      console.log('🧪 Testing Unified Invite Service...');
      
      // Test 1: Generate invite code
      const generateResult = await unifiedInviteService.generateInviteCode('test-property-1', {
        expirationDays: 7
      });
      
      console.log('📝 Generation result:', generateResult);
      
      if (generateResult.success) {
        // Test 2: Validate the generated code
        const validateResult = await unifiedInviteService.validateInviteCode(generateResult.code);
        console.log('📝 Validation result:', validateResult);
        
        // Test 3: Get debug info
        const debugInfo = unifiedInviteService.getDebugInfo();
        console.log('📝 Debug info:', debugInfo);
        
        setUnifiedTestResult({
          success: true,
          results: {
            generation: generateResult,
            validation: validateResult,
            debug: debugInfo
          }
        });
      } else {
        setUnifiedTestResult({
          success: false,
          error: 'Failed to generate invite code'
        });
      }
    } catch (error) {
      console.error('❌ Unified service test failed:', error);
      setUnifiedTestResult({
        success: false,
        error: error.message || 'Unknown error occurred'
      });
    } finally {
      setTestingUnified(false);
    }
  };

  const testSpecificCode = async (code) => {
    setTestingSpecificCode(true);
    setSpecificCodeResult(null);
    
    try {
      console.log('🔍 Testing specific invite code:', code);
      
      // Validate the specific code
      const validateResult = await unifiedInviteService.validateInviteCode(code);
      console.log('📝 Specific code validation result:', validateResult);
      
      // Get debug info to see what service mode was used
      const debugInfo = unifiedInviteService.getDebugInfo();
      
      setSpecificCodeResult({
        success: true,
        code: code,
        validation: validateResult,
        serviceMode: debugInfo.mode,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('❌ Specific code test failed:', error);
      setSpecificCodeResult({
        success: false,
        code: code,
        error: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    } finally {
      setTestingSpecificCode(false);
    }
  };

  const handleTenantBypassDemo = () => {
    // Open tenant demo in a new tab/window
    window.open('/tenant-demo', '_blank');
  };

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
          <p className="text-gray-600">Test email functionality, QR codes, UI components, and tenant interface</p>
          
          {/* Quick Access Tenant Demo Button */}
          <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-purple-900">👤 Tenant Interface Demo</h3>
                <p className="text-sm text-purple-700">View tenant dashboard with empty state (no data)</p>
              </div>
              <Button
                onClick={() => window.open('/tenant/demo', '_blank')}
                variant="primary"
                className="bg-purple-600 hover:bg-purple-700"
              >
                Open Demo
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
          {/* Tenant Bypass Demo Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">👤 Tenant Demo</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Empty State Demo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test the tenant interface with no maintenance requests to see the empty state.
                </p>
                <Button
                  onClick={handleTenantBypassDemo}
                  variant="primary"
                  className="w-full"
                >
                  Open Tenant Demo
                </Button>
              </div>

              <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                <h4 className="font-semibold text-purple-800 mb-2">Demo Features:</h4>
                <ul className="text-sm text-purple-700 space-y-1">
                  <li>• Shows true tenant profile interface</li>
                  <li>• Empty maintenance request history</li>
                  <li>• Functional request form (demo mode)</li>
                  <li>• Property management interface</li>
                  <li>• No actual data - safe to test</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Unified Invite Service Test */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold mb-4">🔧 Unified Invite Service Test</h2>
            <p className="text-gray-600 mb-4">
              Test the new unified invite code service with fallback strategies
            </p>
            
            <div className="space-y-4">
              <Button
                onClick={testUnifiedInviteService}
                disabled={testingUnified}
                className="bg-orange-600 hover:bg-orange-700 text-white"
              >
                {testingUnified ? 'Testing...' : 'Test Unified Service'}
              </Button>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-md font-semibold mb-2">🔍 Test Specific Code</h3>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value="BWNR3QPR"
                    readOnly
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md font-mono text-sm bg-gray-50"
                  />
                  <Button
                    onClick={() => testSpecificCode('BWNR3QPR')}
                    disabled={testingUnified}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Validate
                  </Button>
                </div>
              </div>
              
              {specificCodeResult && (
                <div className={`p-4 rounded-lg ${
                  specificCodeResult.validation.isValid
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <h3 className={`font-semibold mb-2 ${
                    specificCodeResult.validation.isValid ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {specificCodeResult.validation.isValid ? '✅ Code Valid!' : '❌ Code Invalid'}
                  </h3>

                  <div className="space-y-2 text-sm">
                    <div className={specificCodeResult.validation.isValid ? 'text-green-700' : 'text-red-700'}>
                      <strong>Code:</strong> {specificCodeResult.code}
                    </div>
                    <div className={specificCodeResult.validation.isValid ? 'text-green-700' : 'text-red-700'}>
                      <strong>Service Mode:</strong> {specificCodeResult.serviceMode}
                    </div>
                    {specificCodeResult.validation.isValid ? (
                      <>
                        <div className="text-green-700">
                          <strong>Property:</strong> {specificCodeResult.validation.propertyName || 'Unknown'}
                        </div>
                        <div className="text-green-700">
                          <strong>Property ID:</strong> {specificCodeResult.validation.propertyId || 'Unknown'}
                        </div>
                        {specificCodeResult.validation.unitId && (
                          <div className="text-green-700">
                            <strong>Unit ID:</strong> {specificCodeResult.validation.unitId}
                          </div>
                        )}
                        {specificCodeResult.validation.landlordId && (
                          <div className="text-green-700">
                            <strong>Landlord ID:</strong> {specificCodeResult.validation.landlordId}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-red-700">
                        <strong>Reason:</strong> {specificCodeResult.validation.message}
                      </div>
                    )}
                    <div className="text-gray-600 text-xs">
                      <strong>Tested:</strong> {new Date(specificCodeResult.timestamp).toLocaleString()}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* QR Code Testing Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📱 QR Code Testing</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">QR Code Generation</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test QR code generation, styling, and download functionality.
                </p>
                <Button
                  onClick={() => setShowQRTest(!showQRTest)}
                  variant="secondary"
                  className="mb-4"
                >
                  {showQRTest ? 'Hide QR Test' : 'Show QR Test'}
                </Button>
              </div>

              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <h4 className="font-semibold text-orange-800 mb-2">QR Features:</h4>
                <ul className="text-sm text-orange-700 space-y-1">
                  <li>• ✅ Custom PropAgentic branding</li>
                  <li>• ✅ PNG/SVG download support</li>
                  <li>• ✅ Copy invite URL to clipboard</li>
                  <li>• ✅ Multiple size options</li>
                  <li>• ✅ Error handling & retry</li>
                  <li>• ✅ Mobile-friendly scanning</li>
                </ul>
              </div>

              {showQRTest && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
                  <QRCodeInviteTest />
                </div>
              )}
            </div>
          </div>

          {/* Tenant Invitation Testing Section */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">📧 Tenant Invitation Testing</h2>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Invite Modal</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Test both email invites and QR code generation for tenant onboarding.
                </p>
                <Button
                  onClick={() => setShowInviteModal(true)}
                  variant="primary"
                  className="w-full mb-4"
                >
                  🚀 Open Invite Modal
                </Button>
              </div>

              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Features to Test:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• ✅ Email invitation sending</li>
                  <li>• ✅ QR code generation with unified service</li>
                  <li>• ✅ Property selection</li>
                  <li>• ✅ Existing tenant search</li>
                  <li>• ✅ Tab switching between email/QR</li>
                  <li>• ✅ Success state handling</li>
                </ul>
              </div>

              <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-800 mb-2">Current Status:</h4>
                <ul className="text-sm text-yellow-700 space-y-1">
                  <li>• ✅ Unified invite service active</li>
                  <li>• ✅ QR code generation working</li>
                  <li>• ⚠️ Email delivery via SendGrid pending</li>
                  <li>• ⚠️ Firebase Functions deployment issues</li>
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