import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon, BuildingOfficeIcon, InformationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { CreateInviteSchema, CreateInviteData } from '../../schemas/CreateInviteSchema';
import { api } from '../../services/api';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { auth } from '../../firebase/config';

interface Property {
  id: string;
  name?: string;
  nickname?: string;
  streetAddress?: string;
  [key: string]: any; // Allow other properties
}

interface InviteTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId?: string;
  propertyName?: string;
  properties?: Property[];
  onInviteSuccess?: () => void;
}

const InviteTenantModal: React.FC<InviteTenantModalProps> = ({
  isOpen,
  onClose,
  propertyId: initialPropertyId,
  propertyName: initialPropertyName,
  properties = [],
  onInviteSuccess,
}) => {
  const [email, setEmail] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || '');
  const [selectedPropertyName, setSelectedPropertyName] = useState<string>(initialPropertyName || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [inviteSuccess, setInviteSuccess] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSelectedPropertyId(initialPropertyId || '');
      setSelectedPropertyName(initialPropertyName || '');
      setErrors({});
      setInviteSuccess(false);
      setInviteCode('');
    }
  }, [isOpen, initialPropertyId, initialPropertyName]);

  useEffect(() => {
    if (selectedPropertyId) {
      const property = properties.find(p => p.id === selectedPropertyId);
      if (property) {
        setSelectedPropertyName(property.nickname || property.name || property.streetAddress || 'Unknown Property');
      }
    }
  }, [selectedPropertyId, properties]);

  const validateForm = () => {
    try {
      CreateInviteSchema.parse({
        tenantEmail: email,
        propertyId: selectedPropertyId,
        landlordId: auth.currentUser?.uid || '',
        createdAt: new Date(),
      });
      setErrors({});
      return true;
    } catch (error: any) {
      const newErrors: { [key: string]: string } = {};
      if (error.errors) {
        error.errors.forEach((err: any) => {
          const path = err.path[0];
          newErrors[path] = err.message;
        });
      }
      setErrors(newErrors);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const currentUser = auth.currentUser;
    if (!currentUser) {
        toast.error('You must be logged in to send invitations');
        return;
    }

    if (!validateForm()) return;

    setLoading(true);
    
    const property = properties.find(p => p.id === selectedPropertyId);
    const propertyNameForInvite = property?.nickname || property?.name || property?.streetAddress || selectedPropertyName || 'Unknown Property';
    
    try {
      const inviteData: CreateInviteData = {
        tenantEmail: email,
        propertyId: selectedPropertyId,
        landlordId: currentUser.uid,
        propertyName: propertyNameForInvite,
        landlordName: currentUser.displayName || 'Property Manager',
        status: 'pending',
        createdAt: new Date(),
      };
      
      const newInviteId = await api.create('invites', inviteData, CreateInviteSchema);
      
      if (newInviteId) {
        setInviteSuccess(true);
        toast.success('Invitation sent successfully!');
        if (onInviteSuccess) {
          onInviteSuccess();
        }
      } else {
        throw new Error('Failed to create invitation record');
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      toast.error(error.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-10" onClose={onClose}>
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
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 p-6 text-left align-middle shadow-xl transition-all">
                <div className="flex justify-between items-center mb-4">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900 dark:text-white">
                    {inviteSuccess ? 'Invitation Sent!' : 'Invite a Tenant'}
                  </Dialog.Title>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 focus:outline-none"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>

                {inviteSuccess ? (
                  <div className="mt-4">
                    <div className="rounded-md bg-green-50 dark:bg-green-900/20 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <CheckCircleIcon className="h-5 w-5 text-green-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-green-800 dark:text-green-200">Invitation Sent</h3>
                          <div className="mt-2 text-sm text-green-700 dark:text-green-300">
                            <p>An invitation has been sent to <span className="font-semibold">{email}</span>.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {inviteCode && (
                      <div className="mb-4">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Invitation code:</p>
                        <div className="flex items-center justify-center">
                          <div className="bg-gray-100 dark:bg-gray-700 rounded-md px-4 py-2 font-mono text-center text-lg tracking-wider">
                            {inviteCode}
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
                          The tenant will receive this code in their email.
                        </p>
                      </div>
                    )}

                    <div className="mt-4 flex justify-center gap-3">
                      <Button
                        type="button"
                        variant="primary"
                        onClick={onClose}
                      >
                        Close
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => {
                          setEmail('');
                          setInviteSuccess(false);
                          setInviteCode('');
                        }}
                      >
                        Send Another Invitation
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <InformationCircleIcon className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                          <h3 className="text-sm font-medium text-blue-800 dark:text-blue-200">Information</h3>
                          <div className="mt-2 text-sm text-blue-700 dark:text-blue-300">
                            <p>The tenant will receive an email with an invitation code to join your property.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
                      <div>
                        <label htmlFor="property" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Select Property
                        </label>
                        {properties.length > 0 ? (
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <select
                              id="property"
                              className={`block w-full pl-10 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                                errors.propertyId ? 'border-red-500' : ''
                              }`}
                              value={selectedPropertyId}
                              onChange={(e) => setSelectedPropertyId(e.target.value)}
                            >
                              <option value="">Choose a property...</option>
                              {properties.map((prop) => (
                                <option key={prop.id} value={prop.id}>{prop.name}</option>
                              ))}
                            </select>
                            {errors.propertyId && <p className="mt-2 text-sm text-red-600">{errors.propertyId}</p>}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded-md dark:bg-gray-700 dark:text-gray-300">
                            No properties available. Please add a property first.
                          </div>
                        )}
                      </div>

                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Tenant's Email
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                          </div>
                          <input
                            type="email"
                            id="email"
                            className={`block w-full pl-10 pr-10 py-2 text-base border-gray-300 dark:border-gray-600 dark:bg-gray-700 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
                              errors.email ? 'border-red-500' : ''
                            }`}
                            placeholder="tenant@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                          />
                        </div>
                        {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                      </div>

                      <div className="mt-6 flex justify-between">
                        <Button
                          type="button"
                          variant="secondary"
                          onClick={onClose}
                          disabled={loading}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="submit"
                          variant="primary"
                          isLoading={loading}
                          disabled={loading || !email || !selectedPropertyId}
                        >
                          {loading ? 'Sending...' : 'Send Invitation'}
                        </Button>
                      </div>
                    </form>
                  </>
                )}
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

export default InviteTenantModal;