import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import TenantInviteForm from '../components/tenant/TenantInviteForm';
import Button from '../components/ui/Button';
import { unifiedInviteCodeService } from '../services/unifiedInviteCodeService';

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
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    if (code) {
      setInviteCode(code);
      validateCode(code);
    } else {
      setValidationError('No invitation code provided');
      setIsValidating(false);
    }
  }, [searchParams]);

  const validateCode = async (code: string) => {
    try {
      const validation = await unifiedInviteCodeService.validateInviteCode(code);
      if (validation.isValid) {
        setPropertyInfo({
          propertyId: validation.propertyId!,
          propertyName: validation.propertyName || 'Property',
          unitId: validation.unitId
        });
      } else {
        setValidationError(validation.message);
      }
    } catch (error: any) {
      setValidationError('Invalid or expired invitation code');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Validating invitation...</p>
        </div>
      </div>
    );
  }

  if (validationError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Invitation</h1>
          <p className="text-gray-600 mb-6">{validationError}</p>
          <Button onClick={() => navigate('/login')}>
            Go to Login
          </Button>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-md mx-auto pt-12">
          <div className="bg-white p-8 rounded-lg shadow-md mb-6">
            <h2 className="text-2xl font-bold text-center mb-4">
              You're Invited to Join {propertyInfo?.propertyName}!
            </h2>
            <p className="text-gray-600 text-center mb-6">
              To accept this invitation, please sign in or create an account. After signing in, you'll be redirected back here to complete the invitation process.
            </p>
            
            <div className="space-y-3">
              <Button 
                onClick={() => {
                  // Store the invite code in localStorage so we can retrieve it after login
                  localStorage.setItem('pendingInviteCode', inviteCode);
                  navigate('/login');
                }} 
                className="w-full"
                variant="primary"
              >
                Sign In
              </Button>
              <Button 
                onClick={() => {
                  // Store the invite code in localStorage so we can retrieve it after registration
                  localStorage.setItem('pendingInviteCode', inviteCode);
                  navigate('/register');
                }} 
                className="w-full"
                variant="outline"
              >
                Create Account
              </Button>
            </div>
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
    </div>
  );
};

export default InviteAcceptancePage; 