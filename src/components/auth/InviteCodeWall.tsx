import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import TenantInviteForm from '../tenant/TenantInviteForm';
import Button from '../ui/Button';
import { signOut } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { unifiedInviteCodeService } from '../../services/unifiedInviteCodeService';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface InviteCodeWallProps {
  onInviteValidated: () => void;
}

/**
 * Mandatory wall that blocks tenant access until they provide a valid invite code
 */
const InviteCodeWall: React.FC<InviteCodeWallProps> = ({ onInviteValidated }) => {
  const { currentUser, userProfile, refreshUserData } = useAuth();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleBypassForTesting = () => {
    console.log('Bypass button clicked - Test mode activated');
    console.warn('Bypassing invite code (dev only)');
    toast.success('Bypassing to maintenance request for testing');
    navigate('/maintenance/enhanced', { 
      state: { 
        propertyId: 'test-property-id',
        testMode: true 
      } 
    });
  };

  const handleInviteValidated = async (propertyInfo: {
    propertyId: string;
    propertyName: string;
    unitId?: string | null;
    inviteCode: string;
  }) => {
    if (!currentUser) {
      toast.error('Please log in to redeem the invite code');
      return;
    }

    setIsProcessing(true);
    
    try {
      console.log('🔄 Redeeming invite code for user:', currentUser.uid);
      
      // Redeem the invite code
      const result = await unifiedInviteCodeService.redeemInviteCode(propertyInfo.inviteCode);
      
      if (result.success) {
        console.log('✅ Invite code redeemed successfully');
        
        // Refresh user data to get updated profile with propertyId and landlordId
        await refreshUserData();
        
        toast.success(`Successfully joined ${propertyInfo.propertyName}!`);
        
        // Notify parent component to refresh and check access
        onInviteValidated();
      } else {
        console.error('❌ Failed to redeem invite code:', result.message);
        toast.error(result.message || 'Failed to join property');
      }
    } catch (error: any) {
      console.error('💥 Error redeeming invite code:', error);
      toast.error(error.message || 'Failed to join property. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
          </div>
          
          <h2 className="mt-6 text-3xl font-bold text-gray-900 dark:text-white">
            Invite Code Required
          </h2>
          
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            To access PropAgentic as a tenant, you need a valid invite code from your landlord.
          </p>
          
          {userProfile?.email && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">
              Logged in as: {userProfile.email}
            </p>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-4">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Enter Your Invite Code
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your landlord should have provided you with an invite code via email or text message.
            </p>
          </div>

          <TenantInviteForm
            onInviteValidated={handleInviteValidated}
            email={userProfile?.email}
            className="space-y-4"
          />
          
          {/* Developer Bypass Button - Only visible in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-4">
              <Button
                variant="secondary"
                onClick={handleBypassForTesting}
                className="w-full bg-yellow-100 hover:bg-yellow-200 text-yellow-800 border-yellow-300"
                disabled={isProcessing}
              >
                🛠️ Bypass and Test Maintenance Request (Dev Only)
              </Button>
            </div>
          )}
          
          {isProcessing && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Joining property...
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="text-center space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2">
              Don't have an invite code?
            </h4>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Contact your landlord or property manager to request an invitation to join your property on PropAgentic.
            </p>
          </div>

          <Button
            variant="secondary"
            onClick={handleSignOut}
            className="w-full"
            disabled={isProcessing}
          >
            Sign Out & Use Different Account
          </Button>
        </div>
      </div>
    </div>
  );
};

export default InviteCodeWall; 