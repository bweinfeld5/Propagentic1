import { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon } from '@heroicons/react/24/outline';
import TenantInviteForm from './TenantInviteForm';
import Button from '../ui/Button';
import toast from 'react-hot-toast';
import inviteCodeService from '../../services/inviteCodeService';
import { useAuth } from '../../context/AuthContext.jsx';
import inviteService from '../../services/firestore/inviteService';

interface TenantInviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (propertyInfo: {
    propertyId: string;
    propertyName: string;
    unitId?: string | null;
  }) => void;
}

/**
 * Modal component allowing tenants to enter invite codes
 */
const TenantInviteModal: React.FC<TenantInviteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser } = useAuth();
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
    
    // Automatically redeem the code if user wants to join
    handleJoinProperty();
  };

  // Handle joining the property after validation
  const handleJoinProperty = async () => {
    if (!validatedProperty || !currentUser || !validatedProperty.inviteCode) return;
    
    setIsRedeeming(true);
    
    try {
      // Redeem the invite code
      const result = await inviteCodeService.redeemInviteCode(
        validatedProperty.inviteCode,
        currentUser.uid
      );
      
      if (result.success) {
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
      console.error('Error redeeming invite code:', error);
      toast.error(error.message || 'Error joining property');
    } finally {
      setIsRedeeming(false);
    }
  };
  
  // Handle skip (cancel)
  const handleSkip = () => {
    onClose();
  };

  // Reset state when modal closes
  const handleOnClose = () => {
    setValidatedProperty(null);
    onClose();
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={handleOnClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black bg-opacity-25" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title
                    as="h3"
                    className="text-lg font-medium leading-6 text-gray-900"
                  >
                    Add a Property
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500"
                    onClick={handleOnClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                <div className="mt-2">
                  {validatedProperty ? (
                    <div className="p-4 bg-blue-50 rounded-lg mb-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Property:</span>{' '}
                        {validatedProperty.propertyName}
                      </p>
                      {validatedProperty.unitId && (
                        <p className="text-sm text-gray-700 mt-1">
                          <span className="font-medium">Unit:</span> {validatedProperty.unitId}
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">
                      Enter the invite code provided by your landlord to join a property.
                    </p>
                  )}

                  {!validatedProperty && (
                    <TenantInviteForm
                      onInviteValidated={handleInviteValidated}
                      email={currentUser?.email || undefined}
                      showSkip={true}
                      onSkip={handleSkip}
                    />
                  )}

                  {validatedProperty && (
                    <div className="mt-4 flex justify-end space-x-3">
                      <Button
                        variant="secondary"
                        onClick={handleOnClose}
                        disabled={isRedeeming}
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="primary"
                        onClick={handleJoinProperty}
                        isLoading={isRedeeming}
                      >
                        {isRedeeming ? 'Joining...' : 'Join Property'}
                      </Button>
                    </div>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default TenantInviteModal; 