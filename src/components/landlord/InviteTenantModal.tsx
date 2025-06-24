import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition, Tab } from '@headlessui/react';
import { 
  XMarkIcon, 
  EnvelopeIcon, 
  BuildingOfficeIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  UserPlusIcon,
  QrCodeIcon,
  LinkIcon
} from '@heroicons/react/24/outline';
import { CreateInviteSchema, CreateInviteData } from '../../schemas/CreateInviteSchema';
import { api } from '../../services/api';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import Button from '../ui/Button';
import { auth } from '../../firebase/config';
import { QRInviteGenerator } from './QRInviteGenerator';

interface Property {
  id: string;
  name?: string;
  nickname?: string;
  streetAddress?: string;
  [key: string]: any; // Allow other properties
}

interface TenantAccount {
  uid: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role: string;
  userType?: string;
  status?: string;
  phone?: string;
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
  // Form state
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || '');
  const [selectedPropertyName, setSelectedPropertyName] = useState<string>(initialPropertyName || '');
  const [email, setEmail] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [inviteSuccess, setInviteSuccess] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inviteId, setInviteId] = useState<string>('');
  
  // Enhanced invite state
  const [inviteMode, setInviteMode] = useState<'new' | 'existing'>('new');
  const [selectedTenant, setSelectedTenant] = useState<TenantAccount | null>(null);
  const [existingTenants, setExistingTenants] = useState<TenantAccount[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loadingTenants, setLoadingTenants] = useState<boolean>(false);
  const [sendEmailNotifications, setSendEmailNotifications] = useState<boolean>(true);

  // QR Code specific state
  const [qrInviteCode, setQrInviteCode] = useState<string>('');

  // Effect to load existing tenants
  useEffect(() => {
    if (isOpen && inviteMode === 'existing') {
      loadExistingTenants();
    }
  }, [isOpen, inviteMode]);

  // Update property name when selection changes
  useEffect(() => {
    if (selectedPropertyId && properties.length > 0) {
      const property = properties.find(p => p.id === selectedPropertyId);
      if (property) {
        setSelectedPropertyName(property.name || property.nickname || property.streetAddress || 'Unknown Property');
      }
    }
  }, [selectedPropertyId, properties]);

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setSelectedPropertyId(initialPropertyId || '');
      setSelectedPropertyName(initialPropertyName || '');
      setInviteSuccess(false);
      setInviteCode('');
      setInviteId('');
      setQrInviteCode('');
      setErrors({});
    }
  }, [isOpen, initialPropertyId, initialPropertyName]);

  const loadExistingTenants = async () => {
    setLoadingTenants(true);
    try {
      const functions = getFunctions();
      const getAllTenants = httpsCallable(functions, 'getAllTenants');
      const result = await getAllTenants();
      const data = result.data as any;
      
      if (data.success && Array.isArray(data.tenants)) {
        setExistingTenants(data.tenants);
      } else {
        console.log('No tenants found or invalid response format');
        setExistingTenants([]);
      }
    } catch (error: any) {
      console.error('Error loading tenants:', error);
      if (error.code === 'unauthenticated') {
        toast.error('Authentication required to load tenant accounts');
      } else {
        toast.error('Failed to load tenant accounts');
      }
      setExistingTenants([]);
    } finally {
      setLoadingTenants(false);
    }
  };

  // Filter tenants based on search
  const filteredTenants = existingTenants.filter(tenant => {
    if (!searchQuery.trim()) return true;
    
    const searchLower = searchQuery.toLowerCase();
    const displayName = tenant.name || tenant.displayName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim();
    
    return (
      tenant.email.toLowerCase().includes(searchLower) ||
      displayName.toLowerCase().includes(searchLower)
    );
  });

  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!selectedPropertyId) {
      newErrors.propertyId = 'Please select a property';
    }
    
    if (inviteMode === 'new' && !email.trim()) {
      newErrors.email = 'Email is required';
    } else if (inviteMode === 'new' && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (inviteMode === 'existing' && !selectedTenant) {
      newErrors.tenant = 'Please select a tenant';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
    const emailToInvite = inviteMode === 'existing' && selectedTenant ? selectedTenant.email : email;
    
    try {
      const functions = getFunctions();
      const sendPropertyInvite = httpsCallable(functions, 'sendPropertyInvite');
      
      console.log(`Sending invitation to ${emailToInvite} for property ${selectedPropertyId}`);
      
      const result = await sendPropertyInvite({
        propertyId: selectedPropertyId,
        tenantEmail: emailToInvite,
        existingTenant: inviteMode === 'existing' ? selectedTenant : null
      });
      
      const data = result.data as any;
      
      if (data.success) {
        setInviteSuccess(true);
        setInviteId(data.inviteId || '');
        
        const tenantName = inviteMode === 'existing' && selectedTenant 
          ? (selectedTenant.name || selectedTenant.displayName || `${selectedTenant.firstName} ${selectedTenant.lastName}` || selectedTenant.email)
          : emailToInvite;
          
        toast.success(
          `🎉 Invitation sent to ${tenantName}!\nThey'll receive an email with instructions to join ${propertyNameForInvite}.`,
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
      } else {
        throw new Error(data.message || 'Failed to send invitation');
      }
    } catch (error: any) {
      console.error('Error sending invitation:', error);
      const errorMessage = error.message || 'Failed to send invitation. Please try again.';
      
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

  const handleQRInviteGenerated = (code: string) => {
    setQrInviteCode(code);
    setInviteSuccess(true);
    setInviteId(code);
    
    const property = properties.find(p => p.id === selectedPropertyId);
    const propertyNameForInvite = property?.nickname || property?.name || property?.streetAddress || selectedPropertyName || 'Unknown Property';
    
    toast.success(
      `🎉 QR Code generated for ${propertyNameForInvite}!\nTenants can scan this code to join your property.`,
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
  };

  const renderTenantDisplay = (tenant: TenantAccount) => {
    const displayName = tenant.name || tenant.displayName || `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || tenant.email;
    return (
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium text-gray-900">{displayName}</div>
          <div className="text-sm text-gray-600">{tenant.email}</div>
          {tenant.phone && (
            <div className="text-xs text-gray-500">{tenant.phone}</div>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {tenant.status || 'active'}
        </div>
      </div>
    );
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
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-2xl transition-all border border-gray-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <Dialog.Title as="h3" className="text-xl font-semibold text-white">
                      {inviteSuccess ? '✅ Invitation Created!' : '📧 Invite a Tenant'}
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
                <div className="px-6 py-6 max-h-[80vh] overflow-y-auto">
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
                              <p>
                                {qrInviteCode 
                                  ? `A QR code has been generated for ${selectedPropertyName}.`
                                  : `An invitation has been sent to ${inviteMode === 'existing' && selectedTenant 
                                      ? (selectedTenant.name || selectedTenant.displayName || `${selectedTenant.firstName} ${selectedTenant.lastName}` || selectedTenant.email)
                                      : email
                                    } for ${selectedPropertyName}.`
                                }
                              </p>
                              <p className="mt-1">
                                {qrInviteCode 
                                  ? 'Tenants can scan this code to join your property.'
                                  : 'They\'ll receive an email with instructions on how to join your property.'
                                }
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Show invite ID/QR code */}
                      {inviteId && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            {qrInviteCode ? 'QR Code Reference:' : 'Invitation Reference:'}
                          </p>
                          <div className="bg-white rounded-lg px-3 py-2 font-mono text-sm text-center border border-gray-300">
                            {inviteId}
                          </div>
                          <p className="text-xs text-gray-500 mt-2 text-center">
                            Save this ID to track or manage this invitation later.
                          </p>
                        </div>
                      )}

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
                            setQrInviteCode('');
                            setSelectedPropertyId(initialPropertyId || '');
                            setSelectedPropertyName(initialPropertyName || '');
                            setInviteMode('new');
                            setSelectedTenant(null);
                            setSearchQuery('');
                          }}
                          className="flex-1"
                        >
                          Create Another
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
                                Choose between email invitations or QR code generation
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                Email invites are sent directly to tenants
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                QR codes can be shared in person or posted at the property
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>

                      {/* Property Selection - Always shown first */}
                      <div className="mb-6">
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

                      {/* Tab Navigation */}
                      <Tab.Group>
                        <Tab.List className="flex space-x-1 rounded-xl bg-orange-100 p-1 mb-6">
                          <Tab
                            className={({ selected }) =>
                              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${
                                selected
                                  ? 'bg-white text-orange-700 shadow'
                                  : 'text-orange-600 hover:bg-white/[0.12] hover:text-orange-700'
                              }`
                            }
                          >
                            <div className="flex items-center justify-center gap-2">
                              <EnvelopeIcon className="w-4 h-4" />
                              Email Invite
                            </div>
                          </Tab>
                          <Tab
                            className={({ selected }) =>
                              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all ${
                                selected
                                  ? 'bg-white text-orange-700 shadow'
                                  : 'text-orange-600 hover:bg-white/[0.12] hover:text-orange-700'
                              }`
                            }
                          >
                            <div className="flex items-center justify-center gap-2">
                              <QrCodeIcon className="w-4 h-4" />
                              QR Code Invite
                            </div>
                          </Tab>
                        </Tab.List>
                        
                        <Tab.Panels>
                          {/* Email Invite Panel */}
                          <Tab.Panel>
                            <form onSubmit={handleSubmit} className="space-y-6">
                              {/* Invite Mode Selection */}
                              <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                  Tenant Selection
                                </label>
                                <div className="grid grid-cols-2 gap-3">
                                  <button
                                    type="button"
                                    onClick={() => setInviteMode('existing')}
                                    className={`p-4 border-2 rounded-xl transition-all ${
                                      inviteMode === 'existing'
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                                  >
                                    <UserGroupIcon className="h-6 w-6 mx-auto mb-2" />
                                    <div className="text-sm font-medium">Existing Tenant</div>
                                    <div className="text-xs mt-1 opacity-70">
                                      Select from {existingTenants.length} accounts
                                    </div>
                                  </button>
                                  
                                  <button
                                    type="button"
                                    onClick={() => setInviteMode('new')}
                                    className={`p-4 border-2 rounded-xl transition-all ${
                                      inviteMode === 'new'
                                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                                  >
                                    <UserPlusIcon className="h-6 w-6 mx-auto mb-2" />
                                    <div className="text-sm font-medium">New Invitation</div>
                                    <div className="text-xs mt-1 opacity-70">
                                      Send by email
                                    </div>
                                  </button>
                                </div>
                              </div>

                              {/* Existing Tenant Selection */}
                              {inviteMode === 'existing' && (
                                <div>
                                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Select Existing Tenant
                                  </label>
                                  
                                  {/* Search */}
                                  <div className="relative mb-3">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                      <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                      type="text"
                                      placeholder="Search tenants by name or email..."
                                      className="block w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                  </div>

                                  {/* Tenant List */}
                                  <div className="max-h-64 overflow-y-auto border border-gray-200 rounded-lg bg-white">
                                    {loadingTenants ? (
                                      <div className="p-4 text-center text-gray-500">
                                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto mb-2"></div>
                                        Loading tenant accounts...
                                      </div>
                                    ) : filteredTenants.length === 0 ? (
                                      <div className="p-4 text-center text-gray-500">
                                        {searchQuery ? 'No tenants match your search' : 'No tenant accounts found'}
                                      </div>
                                    ) : (
                                      <div className="divide-y divide-gray-200">
                                        {filteredTenants.map((tenant) => (
                                          <button
                                            key={tenant.uid}
                                            type="button"
                                            onClick={() => setSelectedTenant(tenant)}
                                            className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                                              selectedTenant?.uid === tenant.uid ? 'bg-orange-50 border-r-4 border-orange-500' : ''
                                            }`}
                                          >
                                            {renderTenantDisplay(tenant)}
                                          </button>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )}

                              {/* New Email Invitation */}
                              {inviteMode === 'new' && (
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
                              )}

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
                                  disabled={
                                    loading || 
                                    !selectedPropertyId || 
                                    (inviteMode === 'new' && !email) || 
                                    (inviteMode === 'existing' && !selectedTenant)
                                  }
                                  className="flex-1"
                                >
                                  {loading ? 'Sending...' : 'Send Invitation'}
                                </Button>
                              </div>
                            </form>
                          </Tab.Panel>

                          {/* QR Code Invite Panel */}
                          <Tab.Panel>
                            {selectedPropertyId && selectedPropertyName ? (
                              <QRInviteGenerator
                                selectedPropertyId={selectedPropertyId}
                                selectedPropertyName={selectedPropertyName}
                                properties={properties}
                                onInviteCodeGenerated={handleQRInviteGenerated}
                              />
                            ) : (
                              <div className="text-center py-8">
                                <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Property</h3>
                                <p className="text-gray-600">
                                  Choose a property above to generate a QR code invitation
                                </p>
                              </div>
                            )}
                            
                            {/* Fallback Demo QR Generation */}
                            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                              <h4 className="font-semibold text-yellow-800 mb-2">Having Issues?</h4>
                              <p className="text-sm text-yellow-700 mb-3">
                                If QR generation fails due to authentication issues, you can generate a demo QR code for testing:
                              </p>
                              <button
                                onClick={() => {
                                  if (!selectedPropertyId) {
                                    toast.error('Please select a property first');
                                    return;
                                  }
                                  
                                  const demoCode = `DEMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
                                  handleQRInviteGenerated(demoCode);
                                  toast.success('Demo QR code generated for testing!');
                                  toast('⚠️ This is a demo code for testing only', {
                                    duration: 3000,
                                    icon: '⚠️'
                                  });
                                }}
                                className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors text-sm"
                              >
                                Generate Demo QR Code
                              </button>
                            </div>
                          </Tab.Panel>
                        </Tab.Panels>
                      </Tab.Group>
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