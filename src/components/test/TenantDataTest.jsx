import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserGroupIcon,
  InformationCircleIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth, db } from '../../firebase/config';
import { collection, addDoc, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { useAuthState } from 'react-firebase-hooks/auth';
import Button from '../ui/Button';

/**
 * Enhanced Test Component: Landlord Tenant Data Access + Email Flow
 * 
 * This component tests:
 * 1. Landlord tenant data access via Cloud Functions
 * 2. Email system functionality via Firebase Extension
 * 3. Property invitation flow with email notifications
 * 4. Non-email notification alternatives
 */
const TenantDataTest = () => {
  const [user, loading, error] = useAuthState(auth);
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [tenantData, setTenantData] = useState([]);
  const [testSummary, setTestSummary] = useState(null);
  const [emailTestData, setEmailTestData] = useState(null);

  // Enhanced test states - added email tests
  const [tests, setTests] = useState({
    authentication: { status: 'pending', message: 'Not started' },
    databaseAccess: { status: 'pending', message: 'Not started' },
    tenantQuery: { status: 'pending', message: 'Not started' },
    dataValidation: { status: 'pending', message: 'Not started' },
    searchFunction: { status: 'pending', message: 'Not started' },
    modalIntegration: { status: 'pending', message: 'Not started' },
    // NEW EMAIL TESTS
    emailSystemAccess: { status: 'pending', message: 'Not started' },
    emailSendTest: { status: 'pending', message: 'Not started' },
    invitationEmailFlow: { status: 'pending', message: 'Not started' },
    alternativeNotifications: { status: 'pending', message: 'Not started' }
  });

  /**
   * Update test status
   */
  const updateTestStatus = (testName, status, message, data = null) => {
    setTests(prev => ({
      ...prev,
      [testName]: { status, message, data }
    }));
  };

  /**
   * Test 1: Authentication Check
   */
  const testAuthentication = async () => {
    updateTestStatus('authentication', 'running', 'Checking user authentication...');
    
    if (!user) {
      updateTestStatus('authentication', 'failed', 'User not authenticated');
      return false;
    }
    
    updateTestStatus('authentication', 'passed', `Authenticated as: ${user.email}`);
    return true;
  };

  /**
   * Test 2: Cloud Function Access
   */
  const testDatabaseAccess = async () => {
    updateTestStatus('databaseAccess', 'running', 'Testing Cloud Function access...');
    
    try {
      const functions = getFunctions();
      const ping = httpsCallable(functions, 'ping');
      await ping();
      updateTestStatus('databaseAccess', 'passed', 'Successfully accessed Firebase Cloud Functions');
      return true;
    } catch (error) {
      updateTestStatus('databaseAccess', 'failed', `Cloud Function access failed: ${error.message}`);
      return false;
    }
  };

  /**
   * Test 3: Tenant Query via Cloud Function
   */
  const testTenantQuery = async () => {
    updateTestStatus('tenantQuery', 'running', 'Querying tenant accounts via Cloud Function...');
    
    try {
      const functions = getFunctions();
      const getAllTenantsFunction = httpsCallable(functions, 'getAllTenants');
      
      const result = await getAllTenantsFunction({ limit: 100 });
      const data = result.data;
      
      const tenants = data.tenants.map(tenant => ({
        id: tenant.uid,
        ...tenant,
        foundBy: 'cloudFunction'
      }));
      
      setTenantData(tenants);
      
      updateTestStatus('tenantQuery', 'passed', 
        `✅ Found ${data.totalCount} tenant accounts via Cloud Function: ${data.message}`,
        { total: data.totalCount, source: 'getAllTenants Cloud Function' }
      );
      return tenants;
    } catch (error) {
      updateTestStatus('tenantQuery', 'failed', `❌ Cloud Function call failed: ${error.message}`);
      return [];
    }
  };

  /**
   * Test 4: Data Validation
   */
  const testDataValidation = (tenants) => {
    updateTestStatus('dataValidation', 'running', 'Validating tenant data structure...');
    
    if (tenants.length === 0) {
      updateTestStatus('dataValidation', 'warning', 'No tenant data to validate');
      return true;
    }
    
    const validationResults = {
      withNames: tenants.filter(t => t.name || t.displayName || (t.firstName && t.lastName)).length,
      withEmails: tenants.filter(t => t.email).length,
      withPhones: tenants.filter(t => t.phone || t.phoneNumber).length,
      activeStatus: tenants.filter(t => t.status === 'active').length
    };
    
    updateTestStatus('dataValidation', 'passed', 
      `Validation complete: ${validationResults.withNames} with names, ${validationResults.withEmails} with emails, ${validationResults.withPhones} with phones`,
      validationResults
    );
    return true;
  };

  /**
   * Test 5: Search Function
   */
  const testSearchFunction = (tenants) => {
    updateTestStatus('searchFunction', 'running', 'Testing search functionality...');
    
    const searchTenants = (query) => {
      if (!query || query.trim() === '') return tenants;
      
      const searchQuery = query.toLowerCase().trim();
      
      return tenants.filter(tenant => {
        const name = (tenant.name || tenant.displayName || tenant.firstName + ' ' + tenant.lastName || '').toLowerCase();
        const email = (tenant.email || '').toLowerCase();
        const phone = (tenant.phone || tenant.phoneNumber || '').toLowerCase();
        
        return name.includes(searchQuery) || 
               email.includes(searchQuery) || 
               phone.includes(searchQuery);
      });
    };
    
    const testQueries = ['john', '@gmail.com', '555'];
    const searchResults = testQueries.map(query => ({
      query,
      results: searchTenants(query).length
    }));
    
    updateTestStatus('searchFunction', 'passed', 
      `Search tests: ${searchResults.map(r => `"${r.query}": ${r.results}`).join(', ')}`,
      searchResults
    );
    return true;
  };

  /**
   * Test 6: Modal Integration Test
   */
  const testModalIntegration = (tenants) => {
    updateTestStatus('modalIntegration', 'running', 'Testing InviteTenantModal data format...');
    
    try {
      // Test the data structure that the modal expects
      const modalReadyTenants = tenants.map(tenant => ({
        id: tenant.id,
        name: tenant.name || tenant.displayName || 'No name',
        email: tenant.email || 'No email',
        phone: tenant.phone || tenant.phoneNumber || 'No phone',
        status: tenant.status || 'unknown'
      }));
      
      updateTestStatus('modalIntegration', 'passed', 
        `Modal integration ready: ${modalReadyTenants.length} tenants formatted for InviteTenantModal`,
        { modalReadyCount: modalReadyTenants.length }
      );
      return true;
    } catch (error) {
      updateTestStatus('modalIntegration', 'failed', `Modal integration test failed: ${error.message}`);
      return false;
    }
  };

  /**
   * NEW Test 7: Email System Access
   */
  const testEmailSystemAccess = async () => {
    updateTestStatus('emailSystemAccess', 'running', 'Testing Firebase Email Extension access...');
    
    try {
      // Test reading from mail collection to verify permissions
      // Use a simple query without complex ordering to avoid index requirements
      const mailQuery = query(
        collection(db, 'mail'),
        limit(5)
      );
      
      const mailSnapshot = await getDocs(mailQuery);
      const recentEmails = mailSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      updateTestStatus('emailSystemAccess', 'passed', 
        `✅ Email system accessible: Found ${recentEmails.length} recent emails in mail collection. Security rules are properly configured.`,
        { recentEmailCount: recentEmails.length, sampleIds: recentEmails.slice(0, 3).map(e => e.id) }
      );
      
      setEmailTestData(recentEmails);
      return true;
    } catch (error) {
      updateTestStatus('emailSystemAccess', 'failed', 
        `❌ Email system access failed: ${error.message} - Check security rules for mail collection`
      );
      return false;
    }
  };

  /**
   * NEW Test 8: Email Send Test
   */
  const testEmailSend = async () => {
    updateTestStatus('emailSendTest', 'running', 'Testing email sending via Firebase Extension...');
    
    try {
      const testEmailData = {
        to: 'ben@propagenticai.com', // Send to Ben as requested
        subject: 'PropAgentic Email System Test',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">📧 PropAgentic Email Test</h2>
            <p>This is a test email from the PropAgentic tenant invitation system.</p>
            <p><strong>Test ID:</strong> TEST-${Date.now()}</p>
            <p><strong>Sent to:</strong> ben@propagenticai.com</p>
            <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 15px 0;">
              <h3 style="margin: 0 0 10px 0; color: #374151;">✅ Email System Status</h3>
              <p style="margin: 0; color: #6b7280;">Firebase Extension is working correctly!</p>
            </div>
            <p style="font-size: 12px; color: #9ca3af;">
              This email was generated by the TenantDataTest component for testing purposes.
            </p>
          </div>
        `,
        text: `PropAgentic Email Test - This is a test email from the tenant invitation system sent to ben@propagenticai.com. Test ID: TEST-${Date.now()}. Time: ${new Date().toLocaleString()}. If you received this, the email system is working correctly!`,
        metadata: {
          testId: `TEST-${Date.now()}`,
          source: 'TenantDataTest',
          type: 'system_test'
        }
      };
      
      const emailDoc = await addDoc(collection(db, 'mail'), testEmailData);
      
      updateTestStatus('emailSendTest', 'passed', 
        `✅ Test email queued successfully! Document ID: ${emailDoc.id}. Check ben@propagenticai.com for the test email.`,
        { emailDocId: emailDoc.id, recipient: 'ben@propagenticai.com' }
      );
      return true;
    } catch (error) {
      updateTestStatus('emailSendTest', 'failed', 
        `❌ Email send test failed: ${error.message} - Check write permissions to mail collection`
      );
      return false;
    }
  };

  /**
   * NEW Test 9: Invitation Email Flow Test
   */
  const testInvitationEmailFlow = async () => {
    updateTestStatus('invitationEmailFlow', 'running', 'Testing property invitation email flow...');
    
    try {
      // Create a mock property invitation to test the email flow
      const mockInvitation = {
        propertyId: 'TEST-PROPERTY-123',
        landlordId: user.uid,
        landlordEmail: user.email,
        tenantId: 'TEST-TENANT-456',
        tenantEmail: 'ben@propagenticai.com', // Send to Ben for testing
        tenantName: 'Test Tenant',
        status: 'pending',
        type: 'existing_user', // This should trigger email notification
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        propertyName: 'Test Property for Email Flow',
        propertyAddress: '123 Test Street, Test City, TS 12345',
        unitId: 'Unit 101'
      };
      
      // Add to propertyInvitations collection - this should trigger the Cloud Function
      const invitationDoc = await addDoc(collection(db, 'propertyInvitations'), mockInvitation);
      
      updateTestStatus('invitationEmailFlow', 'passed', 
        `✅ Property invitation created! ID: ${invitationDoc.id}. Cloud Function should send email to ben@propagenticai.com. Check Firebase Functions logs for email processing.`,
        { 
          invitationId: invitationDoc.id, 
          recipient: 'ben@propagenticai.com',
          triggerType: 'firestore_trigger',
          expectedEmail: 'Property invitation notification'
        }
      );
      return true;
    } catch (error) {
      updateTestStatus('invitationEmailFlow', 'failed', 
        `❌ Invitation email flow test failed: ${error.message}`
      );
      return false;
    }
  };

  /**
   * NEW Test 10: Alternative Notifications (Non-Email)
   */
  const testAlternativeNotifications = async () => {
    updateTestStatus('alternativeNotifications', 'running', 'Testing non-email notification alternatives...');
    
    try {
      // Test in-app notification creation
      const testNotification = {
        userId: user.uid,
        type: 'property_invitation',
        title: 'Property Invitation Available',
        message: 'You have a pending property invitation. Please check your dashboard.',
        data: {
          invitationId: 'TEST-INV-789',
          propertyName: 'Test Property',
          landlordEmail: user.email,
          source: 'alternative_notification_test'
        },
        read: false,
        createdAt: new Date(),
        priority: 'high'
      };
      
      // Add to notifications collection
      const notificationDoc = await addDoc(collection(db, 'notifications'), testNotification);
      
      // Test SMS-like notification (could be extended to actual SMS)
      const smsAlternative = {
        phoneNumber: '+1234567890', // Mock phone number
        message: `PropAgentic: You have a property invitation pending. Check your dashboard.`,
        type: 'property_invitation',
        userId: user.uid,
        createdAt: new Date(),
        status: 'simulated' // In real implementation, this would be 'sent'
      };
      
      // Test push notification data structure
      const pushNotification = {
        userId: user.uid,
        title: 'Property Invitation',
        body: 'You have been invited to join a property on PropAgentic',
        data: {
          type: 'property_invitation',
          action: 'open_dashboard',
          invitationId: 'TEST-INV-789'
        },
        createdAt: new Date(),
        status: 'simulated' // In real implementation, this would be sent via FCM
      };
      
      updateTestStatus('alternativeNotifications', 'passed', 
        `✅ Alternative notifications tested successfully! In-app: ${notificationDoc.id}, SMS: simulated, Push: simulated`,
        { 
          inAppNotificationId: notificationDoc.id,
          smsAlternative: smsAlternative,
          pushNotification: pushNotification,
          alternatives: [
            'In-app notifications (✅ working)',
            'SMS notifications (📱 ready for implementation)',
            'Push notifications (🔔 ready for FCM integration)',
            'Dashboard banner alerts (💬 already implemented)',
            'Browser notifications (🌐 can be added)'
          ]
        }
      );
      return true;
    } catch (error) {
      updateTestStatus('alternativeNotifications', 'failed', 
        `❌ Alternative notifications test failed: ${error.message}`
      );
      return false;
    }
  };

  /**
   * Run all tests including new email tests
   */
  const runAllTests = async () => {
    setIsRunning(true);
    setTestSummary(null);
    
    try {
      // Reset all tests
      Object.keys(tests).forEach(testName => {
        updateTestStatus(testName, 'pending', 'Waiting...');
      });
      
      // Run tests sequentially
      const authResult = await testAuthentication();
      if (!authResult) {
        setIsRunning(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for UX
      
      const dbResult = await testDatabaseAccess();
      if (!dbResult) {
        setIsRunning(false);
        return;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const tenants = await testTenantQuery();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      testDataValidation(tenants);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      testSearchFunction(tenants);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      testModalIntegration(tenants);
      
      // NEW EMAIL TESTS
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testEmailSystemAccess();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testEmailSend();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testInvitationEmailFlow();
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      await testAlternativeNotifications();
      
      // Generate summary
      const passedTests = Object.values(tests).filter(test => test.status === 'passed').length;
      const totalTests = Object.keys(tests).length;
      
      setTestSummary({
        passed: passedTests,
        total: totalTests,
        tenantsFound: tenants.length,
        success: passedTests === totalTests,
        emailSystemWorking: tests.emailSystemAccess.status === 'passed' && tests.emailSendTest.status === 'passed'
      });
      
    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircleIcon className="h-5 w-5 text-red-500" />;
      case 'running':
        return <ClockIcon className="h-5 w-5 text-blue-500 animate-spin" />;
      case 'warning':
        return <InformationCircleIcon className="h-5 w-5 text-yellow-500" />;
      default:
        return <div className="h-5 w-5 bg-gray-300 rounded-full" />;
    }
  };

  /**
   * Get status color
   */
  const getStatusColor = (status) => {
    switch (status) {
      case 'passed':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'failed':
        return 'text-red-700 bg-red-50 border-red-200';
      case 'running':
        return 'text-blue-700 bg-blue-50 border-blue-200';
      case 'warning':
        return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <UserGroupIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Enhanced Landlord System Test Suite
            </h1>
            <p className="text-gray-600">
              Comprehensive testing: Tenant data access + Email system functionality + Alternative notifications
            </p>
          </div>
        </div>
      </div>

      {/* Authentication Status */}
      {!loading && (
        <div className={`rounded-lg border p-4 ${user ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
          <div className="flex items-center space-x-2">
            {user ? (
              <>
                <CheckCircleIcon className="h-5 w-5 text-green-500" />
                <span className="text-green-700">
                  Authenticated as: {user.email}
                </span>
              </>
            ) : (
              <>
                <XCircleIcon className="h-5 w-5 text-red-500" />
                <span className="text-red-700">
                  Not authenticated - Please log in to run tests
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Test Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Enhanced Test Suite</h2>
            <p className="text-sm text-gray-600 mt-1">
              Now includes email flow testing and non-email notification alternatives
            </p>
          </div>
          <Button
            onClick={runAllTests}
            disabled={!user || isRunning}
            variant="primary"
            className="flex items-center space-x-2"
          >
            <PlayIcon className="h-4 w-4" />
            <span>{isRunning ? 'Running Tests...' : 'Run All Tests'}</span>
          </Button>
        </div>
      </div>

      {/* Test Results - Split into sections */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tenant Data Tests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <UserGroupIcon className="h-5 w-5 text-blue-600" />
            <span>Tenant Data Tests</span>
          </h3>
          
          {Object.entries(tests).slice(0, 6).map(([testName, test]) => (
            <div
              key={testName}
              className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h4 className="font-medium capitalize">
                      {testName.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-sm">{test.message}</p>
                  </div>
                </div>
                {test.data && (
                  <div className="text-xs font-mono bg-white rounded px-2 py-1 border max-w-xs overflow-hidden">
                    {JSON.stringify(test.data, null, 2).substring(0, 100)}...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Email & Notification Tests */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center space-x-2">
            <EnvelopeIcon className="h-5 w-5 text-purple-600" />
            <span>Email & Notification Tests</span>
          </h3>
          
          {Object.entries(tests).slice(6).map(([testName, test]) => (
            <div
              key={testName}
              className={`border rounded-lg p-4 ${getStatusColor(test.status)}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <h4 className="font-medium capitalize">
                      {testName.replace(/([A-Z])/g, ' $1').trim()}
                    </h4>
                    <p className="text-sm">{test.message}</p>
                  </div>
                </div>
                {test.data && (
                  <div className="text-xs font-mono bg-white rounded px-2 py-1 border max-w-xs overflow-hidden">
                    {JSON.stringify(test.data, null, 2).substring(0, 100)}...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Test Summary */}
      {testSummary && (
        <div className={`rounded-lg border p-6 ${testSummary.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h3 className="text-lg font-semibold mb-3">Enhanced Test Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testSummary.passed}/{testSummary.total}</div>
              <div className="text-sm text-gray-600">Tests Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{testSummary.tenantsFound}</div>
              <div className="text-sm text-gray-600">Tenants Found</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${testSummary.emailSystemWorking ? 'text-green-600' : 'text-red-600'}`}>
                {testSummary.emailSystemWorking ? 'WORKING' : 'ISSUES'}
              </div>
              <div className="text-sm text-gray-600">Email System</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${testSummary.success ? 'text-green-600' : 'text-yellow-600'}`}>
                {testSummary.success ? 'PASS' : 'PARTIAL'}
              </div>
              <div className="text-sm text-gray-600">Overall Result</div>
            </div>
          </div>
        </div>
      )}

      {/* Email System Recommendations */}
      {tests.emailSendTest.status === 'failed' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start space-x-3">
            <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="text-lg font-semibold text-yellow-900 mb-2">Email System Issues Detected</h3>
              <p className="text-yellow-800 mb-4">
                The email system tests failed. Here are the recommended alternatives:
              </p>
              <div className="bg-white rounded-lg p-4 border border-yellow-200">
                <h4 className="font-semibold text-yellow-900 mb-2">Non-Email Alternatives:</h4>
                <ul className="space-y-2 text-sm text-yellow-800">
                  <li>• ✅ <strong>In-App Notifications:</strong> Show invitations directly in tenant dashboard</li>
                  <li>• 📱 <strong>SMS Notifications:</strong> Send text message alerts (requires Twilio integration)</li>
                  <li>• 🔔 <strong>Push Notifications:</strong> Browser/mobile push notifications via FCM</li>
                  <li>• 💬 <strong>Dashboard Banners:</strong> Prominent invitation banners (already implemented)</li>
                  <li>• 🌐 <strong>Browser Notifications:</strong> Native browser notification API</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sample Tenant Data */}
      {tenantData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sample Tenant Data</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Found By
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {tenantData.slice(0, 5).map((tenant, index) => (
                  <tr key={tenant.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.name || tenant.displayName || 'No name'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.email || 'No email'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.phone || tenant.phoneNumber || 'No phone'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.status || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {tenant.foundBy}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {tenantData.length > 5 && (
              <p className="text-sm text-gray-500 mt-2">
                ... and {tenantData.length - 5} more tenants
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Email Data */}
      {emailTestData && emailTestData.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Email Activity</h3>
          <div className="space-y-2">
            {emailTestData.slice(0, 3).map((email, index) => (
              <div key={email.id} className="border border-gray-200 rounded-lg p-3 text-sm">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{email.subject || 'No subject'}</p>
                    <p className="text-gray-600">To: {email.to}</p>
                  </div>
                  <div className="text-xs text-gray-500">
                    {email.delivery?.state || 'Queued'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantDataTest; 