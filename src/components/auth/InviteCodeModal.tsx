import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import TenantInviteForm from '../tenant/TenantInviteForm';
import toast from 'react-hot-toast';
import inviteService from '../../services/firestore/inviteService';

interface InviteCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInviteValidated: () => void;
}

interface PropertyInfo {
  inviteCode: string;
  propertyId: string;
  propertyName: string;
  unitId?: string | null;
}

const InviteCodeModal: React.FC<InviteCodeModalProps> = ({
  isOpen,
  onClose,
  onInviteValidated
}) => {
  const { currentUser } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleInviteValidated = async (propertyInfo: PropertyInfo) => {
    if (!currentUser) {
      toast.error('You must be logged in to redeem an invite code');
      return;
    }

    setIsProcessing(true);
    console.log('🔄 Redeeming invite code for user:', currentUser.uid);
    console.log('🔄 Current user auth token:', await currentUser.getIdToken());

    try {
      console.log('🔄 Accepting tenant invite for user:', currentUser.uid);
      
      // Call the new acceptTenantInvite service
      const result = await inviteService.acceptTenantInvite({
        inviteCode: propertyInfo.inviteCode,
        unitId: propertyInfo.unitId || undefined
      });
      
      if (result.success) {
        toast.success(`Successfully joined ${result.propertyAddress || 'property'}!`);
        onInviteValidated();
        onClose();
      } else {
        toast.error(result.message || 'Failed to accept invite');
      }
    } catch (error: any) {
      console.error('💥 Error accepting tenant invite:', error);
      
      // Handle any unexpected errors
      const errorMessage = error.message || 'Failed to join property. Please try again.';
      toast.error(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSkipForNow = () => {
    // Allow user to continue without invite code
    toast('You can enter your invite code later from your profile');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6 sm:align-middle">
          {/* Close button */}
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2"
            >
              <span className="sr-only">Close</span>
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
              <ExclamationTriangleIcon className="h-6 w-6 text-orange-600" />
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                Join Your Property
              </h3>
              <div className="text-sm text-gray-600 mb-6">
                <p>
                  To access property features, enter the invite code provided by your landlord.
                </p>
                <p className="mt-2 text-xs text-gray-500">
                  You can also skip this step and enter your invite code later from your profile.
                </p>
              </div>

              {/* Invite Form */}
              <div className="mb-6">
                <TenantInviteForm
                  onInviteValidated={handleInviteValidated}
                  isProcessing={isProcessing}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
                <button
                  type="button"
                  onClick={handleSkipForNow}
                  className="w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:text-sm"
                  disabled={isProcessing}
                >
                  Skip for now
                </button>
              </div>

              {/* Help text */}
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-xs text-blue-800">
                  <strong>Don't have an invite code?</strong> Contact your landlord or property manager to request an invitation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InviteCodeModal; 