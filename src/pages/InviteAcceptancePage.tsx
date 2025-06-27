import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import TenantInviteForm from '../components/tenant/TenantInviteForm';
import Button from '../components/ui/Button';
import inviteService from '../services/firestore/inviteService';
import InviteCodeValidationTest from '../components/debug/InviteCodeValidationTest';
import FirebaseAuthTest from '../components/debug/FirebaseAuthTest';

interface PropertyInfo {
  propertyId: string;
  propertyName: string;
  unitId?: string | null;
}

const InviteAcceptancePage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, refreshUserData } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [propertyInfo, setPropertyInfo] = useState<PropertyInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{
    type: 'success' | 'error' | 'info';
    message: string;
  } | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const codeFromUrl = searchParams.get('code');
    if (codeFromUrl) {
      setInviteCode(codeFromUrl);
      validateCode(codeFromUrl);
    }
  }, [searchParams]);

  const validateCode = async (code: string) => {
    if (!code) return;
    
    setIsValidating(true);
    setValidationMessage(null);
    
    try {
      console.log('🔍 Validating invite code:', code);
      
      const validationResult = await inviteService.validateInviteCode(code);
      
      if (validationResult.isValid && validationResult.inviteData) {
        console.log('✅ Code is valid!');
        setValidationMessage({
          type: 'success',
          message: 'Valid invite code!'
        });

        // Extract property info from the invite data
        const inviteData = validationResult.inviteData;
        setPropertyInfo({
          propertyId: inviteData.propertyId,
          propertyName: inviteData.propertyName || 'Property',
          unitId: inviteData.unitId || null
        });

        setShowForm(true);
      } else {
        console.log('❌ Code validation failed:', validationResult.message);
        setValidationMessage({
          type: 'error',
          message: validationResult.message || 'Invalid invite code. Please check the code and try again.'
        });
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error during validation:', error);
      setValidationMessage({
        type: 'error',
        message: 'An error occurred while validating the code. Please try again.'
      });
      setShowForm(false);
    } finally {
      setIsValidating(false);
    }
  };

  const handleInviteSuccess = async (propertyInfo: any) => {
    // Refresh user data to get updated profile
    await refreshUserData();
    
    // Redirect to tenant dashboard
    navigate('/tenant/dashboard', { 
      state: { 
        message: `Successfully joined ${propertyInfo.propertyName}!` 
      }
    });
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Validating invitation code...</p>
        </div>
      </div>
    );
  }

  if (validationMessage?.type === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{validationMessage.message}</p>
          <div className="space-y-3">
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Have a different code?</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter 8-digit code"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className="flex-1 px-3 py-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  maxLength={20}
                />
                <Button 
                  onClick={() => validateCode(inviteCode)}
                  disabled={!inviteCode.trim()}
                  className="bg-blue-500 hover:bg-blue-600"
                >
                  Validate
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!showForm || !propertyInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Enter Invitation Code</h1>
          <p className="text-gray-600 mb-6">Please enter your invitation code to join a property.</p>
            <div className="space-y-3">
            <input
              type="text"
              placeholder="Enter 8-digit code"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              maxLength={20}
            />
              <Button 
              onClick={() => validateCode(inviteCode)}
              disabled={!inviteCode.trim() || isValidating}
                className="w-full"
            >
              {isValidating ? 'Validating...' : 'Validate Code'}
              </Button>
          </div>
        </div>
      </div>
    );
  }

  // User is authenticated, show invite form with pre-populated code
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-md mx-auto pt-12">
        <div className="bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-center mb-4">
            Join {propertyInfo?.propertyName}
          </h2>
          <p className="text-gray-600 text-center mb-6">
            Your invitation code has been validated. Click below to join this property.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <span className="font-semibold">Invitation Code:</span> {inviteCode}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <span className="font-semibold">Property:</span> {propertyInfo?.propertyName}
            </p>
            {propertyInfo?.unitId && (
              <p className="text-sm text-blue-800 mt-1">
                <span className="font-semibold">Unit:</span> {propertyInfo.unitId}
              </p>
            )}
          </div>
          
          <TenantInviteForm
            onInviteValidated={handleInviteSuccess}
            email={currentUser.email}
            className="space-y-4"
            // Pre-populate with the validated invite code
            initialCode={inviteCode}
            propertyInfo={propertyInfo}
          />
        </div>
      </div>
      
      {/* Debug tools - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <>
          <FirebaseAuthTest />
          <InviteCodeValidationTest />
        </>
      )}
    </div>
  );
};

export default InviteAcceptancePage; 