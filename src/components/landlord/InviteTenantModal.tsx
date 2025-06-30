import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon, EnvelopeIcon, BuildingOfficeIcon, InformationCircleIcon, CheckCircleIcon, QrCodeIcon, LinkIcon } from '@heroicons/react/24/outline';
import { CreateInviteSchema, CreateInviteData } from '../../schemas/CreateInviteSchema';
import { api } from '../../services/api';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { auth } from '../../firebase/config';
import inviteService from '../../services/firestore/inviteService';
import { QRCodeDisplay } from '../qr/QRCodeDisplay';

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
  const [inviteId, setInviteId] = useState<string>('');
  const [inviteLink, setInviteLink] = useState<string>('');
  const [showQRCode, setShowQRCode] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSelectedPropertyId(initialPropertyId || '');
      setSelectedPropertyName(initialPropertyName || '');
      setErrors({});
      setInviteSuccess(false);
      setInviteCode('');
      setInviteId('');
      setInviteLink('');
      setShowQRCode(false);
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
      // Use WORKING inviteService.ts (same logic as working browser tests)
      console.log(`Using working inviteService to send invitation to ${email} for property ${selectedPropertyId}`);
      
      const inviteId = await inviteService.createInvite({
        tenantEmail: email,
        propertyId: selectedPropertyId,
        landlordId: currentUser.uid,
        propertyName: propertyNameForInvite,
        landlordName: currentUser.displayName || currentUser.email || 'Property Manager'
      });
      
      setInviteSuccess(true);
      setInviteId(inviteId);
      
      // Enhanced success toast message
      toast.success(
        `🎉 Invitation sent to ${email}!\nThey'll receive an email with instructions to join ${propertyNameForInvite}.`,
        {
          duration: 5000,
          style: {
            background: '#10B981',
            color: '#FFFFFF',
            padding: '16px',
            borderRadius: '8px',
          },
        }
      );
      
      if (onInviteSuccess) {
        onInviteSuccess();

      }
      
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      const errorMessage = error.message || 'Failed to send invitation. Please try again.';
      
      // Enhanced error toast message
      toast.error(
        `❌ Failed to send invitation: ${errorMessage}`,
        {
          duration: 6000,
          style: {
            background: '#EF4444',
            color: '#FFFFFF',
            padding: '16px',
            borderRadius: '8px',
          },
        }
      );
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" />
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
              <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-xl font-semibold text-white">
                      {inviteSuccess ? '✅ Invitation Sent!' : '📧 Invite a Tenant'}
                    </Dialog.Title>
                    <button
                      type="button"
                      className="text-white/80 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6">
                  {inviteSuccess ? (
                    <div className="space-y-6">
                      <div className="rounded-xl bg-green-50 p-4 border border-green-200">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <CheckCircleIcon className="h-6 w-6 text-green-500" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-lg font-medium text-green-800">Success!</h3>
                            <div className="mt-2 text-sm text-green-700">
                              <p>An invitation has been sent to <span className="font-semibold">{email}</span> for <span className="font-semibold">{selectedPropertyName}</span>.</p>
                              <p className="mt-1">They'll receive an email with instructions on how to join your property.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Invite Code and Link */}
                      <div className="space-y-4">
                        {/* Invite Code */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Invite Code:</p>
                          <div className="flex items-center space-x-2">
                            <div className="bg-white rounded-lg px-4 py-2 font-mono text-lg text-center border border-gray-300 flex-1">
                              {inviteCode}
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => copyToClipboard(inviteCode, 'Invite code')}
                              className="!p-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </Button>
                          </div>
                        </div>

                        {/* Invite Link */}
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Direct Invite Link:</p>
                          <div className="flex items-center space-x-2">
                            <div className="bg-white rounded-lg px-3 py-2 text-sm text-blue-600 border border-gray-300 flex-1 overflow-hidden">
                              <LinkIcon className="inline w-4 h-4 mr-1" />
                              <span className="truncate">{inviteLink}</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => copyToClipboard(inviteLink, 'Invite link')}
                              className="!p-2"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                            </Button>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            Share this link with the tenant for direct access
                          </p>
                        </div>

                        {/* QR Code Button */}
                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="text-sm font-semibold text-blue-800 flex items-center">
                                <QrCodeIcon className="h-5 w-5 mr-2" />
                                QR Code
                              </h4>
                              <p className="text-xs text-blue-600 mt-1">
                                Generate a QR code for easy property access
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setShowQRCode(!showQRCode)}
                              className="text-blue-600 border-blue-300 hover:bg-blue-100"
                            >
                              {showQRCode ? 'Hide' : 'Show'} QR Code
                            </Button>
                          </div>
                          
                          {showQRCode && (
                            <div className="mt-4 p-4 bg-white rounded-lg border border-blue-200">
                              <div className="relative">
                                <QRCodeDisplay 
                                  inviteCode={inviteCode}
                                  propertyName={selectedPropertyName}
                                  size={200}
                                />
                                {/* Coming Soon Overlay */}
                                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center">
                                  <div className="text-center">
                                    <div className="bg-blue-100 rounded-full p-3 mx-auto mb-3 w-fit">
                                      <QrCodeIcon className="h-8 w-8 text-blue-600" />
                                    </div>
                                    <p className="text-lg font-semibold text-gray-800">QR Code Coming Soon!</p>
                                    <p className="text-sm text-gray-600 mt-1">This feature will be available when the Firebase server is live</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Next Steps */}
                      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                        <h4 className="text-sm font-semibold text-blue-800 mb-3 flex items-center">
                          <InformationCircleIcon className="h-5 w-5 mr-2" />
                          What happens next?
                        </h4>
                        <ul className="text-sm text-blue-700 space-y-2">
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            The tenant will receive an email invitation
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            They can use the code or link to join
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            They'll create an account (if needed)
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            Once connected, they can submit maintenance requests
                          </li>
                        </ul>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <Button
                          type="button"
                          variant="primary"
                          onClick={onClose}
                          className="flex-1"
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
                            setInviteId('');
                            setInviteLink('');
                            setShowQRCode(false);
                            setSelectedPropertyId(initialPropertyId || '');
                            setSelectedPropertyName(initialPropertyName || '');
                          }}
                          className="flex-1"
                        >
                          Send Another
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* How it works info */}
                      <div className="rounded-xl bg-blue-50 p-4 mb-6 border border-blue-200">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <InformationCircleIcon className="h-6 w-6 text-blue-500" aria-hidden="true" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-semibold text-blue-800 mb-2">How it works</h3>
                            <ul className="text-sm text-blue-700 space-y-1">
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                We'll send a professional email invitation
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                They'll receive a unique invitation code and link
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                The tenant can accept via email or use the code/link
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                QR codes will be available when Firebase is live
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                          <label htmlFor="property" className="block text-sm font-semibold text-gray-700 mb-2">
                            Select Property
                          </label>
                          {properties.length > 0 ? (
                            <div className="relative">
                              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                              </div>
                              <select
                                id="property"
                                className={`block w-full pl-10 pr-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                  errors.propertyId ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
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
                            <div className="text-sm text-gray-500 p-4 bg-gray-50 rounded-xl border border-gray-200">
                              No properties available. Please add a property first.
                            </div>
                          )}
                        </div>

                        <div>
                          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Tenant's Email
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <EnvelopeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                            </div>
                            <input
                              type="email"
                              id="email"
                              className={`block w-full pl-10 pr-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                              }`}
                              placeholder="tenant@example.com"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                            />
                          </div>
                          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div className="flex gap-3 pt-4">
                          <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={loading}
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            variant="primary"
                            isLoading={loading}
                            disabled={loading || !email || !selectedPropertyId}
                            className="flex-1"
                          >
                            {loading ? 'Sending...' : 'Send Invitation'}
                          </Button>
                        </div>
                      </form>
                    </>
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

export default InviteTenantModal;