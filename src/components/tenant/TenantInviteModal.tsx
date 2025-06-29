import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import TenantInviteForm from './TenantInviteForm';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import inviteService from '../../services/firestore/inviteService';

interface TenantInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (propertyInfo: any) => void;
}

/**
 * Modal component allowing tenants to enter invite codes
 * NOTE: Redemption functionality temporarily disabled while rebuilding the system
 */
const TenantInviteModal: React.FC<TenantInviteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, refreshUserData } = useAuth();
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [validatedProperty, setValidatedProperty] = useState<{
    propertyId: string;
    propertyName: string;
    unitId?: string | null;
    inviteCode?: string;
  } | null>(null);

  // Handle invite code validation success
  const handleInviteValidated = async (propertyInfo: {
    propertyId: string;
    propertyName: string;
    unitId?: string | null;
    inviteCode: string;
  }) => {
    setValidatedProperty(propertyInfo);
    
    // Automatically proceed to join the property
    handleJoinProperty();
  };

  // Handle joining the property after validation
  const handleJoinProperty = async () => {
    if (!validatedProperty || !currentUser || !validatedProperty.inviteCode) return;
    
    setIsRedeeming(true);
    
    try {
      console.log('🔄 Accepting tenant invite for user:', currentUser.uid);
      
      // Call the new acceptTenantInvite service
      const result = await inviteService.acceptTenantInvite({
        inviteCode: validatedProperty.inviteCode,
        unitId: validatedProperty.unitId || undefined
      });
      
      if (result.success) {
        // Refresh user data to get updated profile with property
        await refreshUserData();
        
        toast.success(`You've successfully joined ${validatedProperty.propertyName}!`);
        
        // Notify parent component of success
        if (onSuccess) {
          onSuccess(validatedProperty);
        }
        
        // Close modal
        onClose();
      } else {
        toast.error(result.message || 'Failed to join property');
      }
    } catch (error: any) {
      console.error('💥 Error accepting tenant invite:', error);
      
      // Handle any unexpected errors
      const errorMessage = error.message || 'Failed to join property. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsRedeeming(false);
    }
  };
  
  // Handle skip (cancel)
  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Join Property
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              disabled={isRedeeming}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {!validatedProperty ? (
            <>
              <div className="mb-6">
                <p className="text-gray-600">
                  Enter the invite code provided by your landlord to join their property.
                </p>
              </div>

              <TenantInviteForm
                onInviteValidated={handleInviteValidated}
                email={currentUser?.email}
                showSkip={true}
                onSkip={handleSkip}
                isProcessing={isRedeeming}
              />
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800 mb-2">
                    Invite Code Validated!
                  </h3>
                  <div className="text-green-700 space-y-1">
                    <p><span className="font-medium">Property:</span> {validatedProperty.propertyName}</p>
                    {validatedProperty.unitId && (
                      <p><span className="font-medium">Unit:</span> {validatedProperty.unitId}</p>
                    )}
                    <p><span className="font-medium">Code:</span> {validatedProperty.inviteCode}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  variant="primary"
                  size="lg"
                  fullWidth
                  onClick={handleJoinProperty}
                  isLoading={isRedeeming}
                  disabled={isRedeeming}
                >
                  {isRedeeming ? 'Joining Property...' : 'Join Property'}
                </Button>
                
                <Button
                  variant="secondary"
                  size="lg"
                  fullWidth
                  onClick={handleSkip}
                  disabled={isRedeeming}
                >
                  Cancel
                </Button>
              </div>
            </>
          )}

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              Need help? Contact your landlord or property manager.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantInviteModal; 