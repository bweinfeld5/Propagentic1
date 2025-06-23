import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import dataService from '../../services/dataService';
import inviteService from '../../services/firestore/inviteService';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

const InvitationFlowTest = () => {
  const { currentUser, userProfile, isLandlord, isTenant } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test, status, message) => {
    setTestResults(prev => [...prev, { test, status, message, timestamp: new Date() }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Test 1: Check authentication
      addResult('Authentication', currentUser ? 'PASS' : 'FAIL', 
        currentUser ? `User authenticated: ${currentUser.uid}` : 'No user authenticated');

      // Test 2: Check user profile
      addResult('User Profile', userProfile ? 'PASS' : 'FAIL',
        userProfile ? `Profile loaded: ${userProfile.userType}` : 'No user profile');

      // Test 3: Check role functions
      const roleCheck = isLandlord() ? 'landlord' : isTenant() ? 'tenant' : 'unknown';
      addResult('Role Detection', roleCheck !== 'unknown' ? 'PASS' : 'FAIL',
        `Detected role: ${roleCheck}`);

      if (isLandlord()) {
        // Test 4: Check property loading for landlords
        try {
          dataService.configure({
            isDemoMode: false,
            currentUser,
            userType: userProfile?.userType
          });
          
          const properties = await dataService.getPropertiesForCurrentLandlord();
          addResult('Property Loading', 'PASS', `Loaded ${properties.length} properties`);

          // Test 5: Test invitation creation (if properties exist)
          if (properties.length > 0) {
            try {
              const testInvite = await inviteService.createInvite({
                propertyId: properties[0].id,
                tenantEmail: '410haulers@gmail.com',
                propertyName: properties[0].name || 'Test Property',
                landlordName: userProfile?.name || 'Test Landlord',
                landlordId: currentUser.uid
              });
              addResult('Invitation Creation', 'PASS', `Created invite: ${testInvite} - Email sent to 410haulers@gmail.com`);
            } catch (inviteError) {
              addResult('Invitation Creation', 'FAIL', `Error: ${inviteError.message}`);
            }
          } else {
            addResult('Invitation Creation', 'SKIP', 'No properties available for testing');
          }
        } catch (propertyError) {
          addResult('Property Loading', 'FAIL', `Error: ${propertyError.message}`);
        }
      }

      if (isTenant()) {
        // Test 4: Check pending invitations for tenants
        try {
          const invites = await inviteService.getPendingInvitesForTenant(currentUser.email);
          addResult('Pending Invitations', 'PASS', `Found ${invites.length} pending invites`);
        } catch (inviteError) {
          addResult('Pending Invitations', 'FAIL', `Error: ${inviteError.message}`);
        }
      }

      toast.success('Tests completed!');
    } catch (error) {
      addResult('Test Suite', 'FAIL', `Unexpected error: ${error.message}`);
      toast.error('Test suite failed');
    } finally {
      setIsRunning(false);
    }
  };

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="bg-blue-50 border-2 border-dashed border-blue-400 p-6 rounded-lg my-6">
      <h3 className="text-lg font-bold text-blue-800 mb-4">Invitation Flow Test Suite</h3>
      
      <div className="mb-4">
        <Button 
          onClick={runTests} 
          disabled={isRunning || !currentUser}
          variant="primary"
          isLoading={isRunning}
        >
          {isRunning ? 'Running Tests...' : 'Run Tests'}
        </Button>
      </div>

      {testResults.length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-blue-800">Test Results:</h4>
          {testResults.map((result, index) => (
            <div 
              key={index}
              className={`p-3 rounded text-sm ${
                result.status === 'PASS' ? 'bg-green-100 text-green-800' :
                result.status === 'FAIL' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="font-medium">{result.test}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  result.status === 'PASS' ? 'bg-green-200' :
                  result.status === 'FAIL' ? 'bg-red-200' :
                  'bg-yellow-200'
                }`}>
                  {result.status}
                </span>
              </div>
              <div className="mt-1 text-xs opacity-75">{result.message}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-blue-600">
        <p><strong>Current User:</strong> {currentUser?.email || 'Not logged in'}</p>
        <p><strong>User Type:</strong> {userProfile?.userType || 'Unknown'}</p>
        <p><strong>Role Check:</strong> {isLandlord() ? 'Landlord' : isTenant() ? 'Tenant' : 'Unknown'}</p>
      </div>
    </div>
  );
};

export default InvitationFlowTest; 