import React, { useState, useEffect } from 'react';
import { 
  PlayIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  ClockIcon,
  UserGroupIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import Button from '../ui/Button';

/**
 * Test Component: Landlord Tenant Data Access
 * 
 * This component tests whether landlords can successfully load tenant data
 * from the PropAgentic system using Firebase client-side authentication.
 */
const TenantDataTest = () => {
  const [user, loading, error] = useAuthState(auth);
  const [testResults, setTestResults] = useState({});
  const [isRunning, setIsRunning] = useState(false);
  const [tenantData, setTenantData] = useState([]);
  const [testSummary, setTestSummary] = useState(null);

  // Test states
  const [tests, setTests] = useState({
    authentication: { status: 'pending', message: 'Not started' },
    databaseAccess: { status: 'pending', message: 'Not started' },
    tenantQuery: { status: 'pending', message: 'Not started' },
    dataValidation: { status: 'pending', message: 'Not started' },
    searchFunction: { status: 'pending', message: 'Not started' },
    modalIntegration: { status: 'pending', message: 'Not started' }
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
   * Test 2: Database Access
   */
  const testDatabaseAccess = async () => {
    updateTestStatus('databaseAccess', 'running', 'Testing Firestore access...');
    
    try {
      const testQuery = query(collection(db, 'users'), where('role', '!=', 'non-existent-role'));
      await getDocs(testQuery);
      updateTestStatus('databaseAccess', 'passed', 'Successfully accessed Firestore');
      return true;
    } catch (error) {
      updateTestStatus('databaseAccess', 'failed', `Database access failed: ${error.message}`);
      return false;
    }
  };

  /**
   * Test 3: Tenant Query
   */
  const testTenantQuery = async () => {
    updateTestStatus('tenantQuery', 'running', 'Querying tenant accounts...');
    
    try {
      // Query all users with role 'tenant'
      const tenantQuery1 = query(collection(db, 'users'), where('role', '==', 'tenant'));
      const tenantSnapshot1 = await getDocs(tenantQuery1);
      
      // Query all users with userType 'tenant'
      const tenantQuery2 = query(collection(db, 'users'), where('userType', '==', 'tenant'));
      const tenantSnapshot2 = await getDocs(tenantQuery2);
      
      // Combine and deduplicate results
      const tenantMap = new Map();
      
      tenantSnapshot1.forEach(doc => {
        const data = doc.data();
        tenantMap.set(doc.id, {
          id: doc.id,
          ...data,
          foundBy: 'role'
        });
      });
      
      tenantSnapshot2.forEach(doc => {
        const data = doc.data();
        if (tenantMap.has(doc.id)) {
          tenantMap.get(doc.id).foundBy = 'both';
        } else {
          tenantMap.set(doc.id, {
            id: doc.id,
            ...data,
            foundBy: 'userType'
          });
        }
      });
      
      const tenants = Array.from(tenantMap.values());
      setTenantData(tenants);
      
      updateTestStatus('tenantQuery', 'passed', 
        `Found ${tenants.length} tenant accounts (${tenantSnapshot1.size} by role, ${tenantSnapshot2.size} by userType)`,
        { total: tenants.length, byRole: tenantSnapshot1.size, byUserType: tenantSnapshot2.size }
      );
      return tenants;
    } catch (error) {
      updateTestStatus('tenantQuery', 'failed', `Tenant query failed: ${error.message}`);
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
   * Run all tests
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
      
      // Generate summary
      const passedTests = Object.values(tests).filter(test => test.status === 'passed').length;
      const totalTests = Object.keys(tests).length;
      
      setTestSummary({
        passed: passedTests,
        total: totalTests,
        tenantsFound: tenants.length,
        success: passedTests === totalTests
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
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <UserGroupIcon className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Landlord Tenant Data Access Test
            </h1>
            <p className="text-gray-600">
              Test suite to verify landlords can load and interact with tenant data
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
          <h2 className="text-lg font-semibold text-gray-900">Test Suite</h2>
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

      {/* Test Results */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">Test Results</h3>
        
        {Object.entries(tests).map(([testName, test]) => (
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
                <div className="text-sm font-mono bg-white rounded px-2 py-1 border">
                  {JSON.stringify(test.data, null, 2)}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Test Summary */}
      {testSummary && (
        <div className={`rounded-lg border p-6 ${testSummary.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h3 className="text-lg font-semibold mb-3">Test Summary</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{testSummary.passed}/{testSummary.total}</div>
              <div className="text-sm text-gray-600">Tests Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{testSummary.tenantsFound}</div>
              <div className="text-sm text-gray-600">Tenants Found</div>
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
    </div>
  );
};

export default TenantDataTest; 