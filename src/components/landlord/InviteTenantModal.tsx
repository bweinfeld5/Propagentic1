import { useState, useEffect, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  EnvelopeIcon, 
  BuildingOfficeIcon, 
  InformationCircleIcon, 
  CheckCircleIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { CreateInviteSchema, CreateInviteData } from '../../schemas/CreateInviteSchema';
import { api } from '../../services/api';
import { getFunctions, httpsCallable } from 'firebase/functions';
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
  const [email, setEmail] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || '');
  const [selectedPropertyName, setSelectedPropertyName] = useState<string>(initialPropertyName || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingTenants, setLoadingTenants] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [inviteSuccess, setInviteSuccess] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [inviteId, setInviteId] = useState<string>('');
  
  // New state for existing tenants
  const [inviteMode, setInviteMode] = useState<'new' | 'existing'>('new');
  const [existingTenants, setExistingTenants] = useState<TenantAccount[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<TenantAccount[]>([]);
  const [selectedTenant, setSelectedTenant] = useState<TenantAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sendEmailNotifications, setSendEmailNotifications] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSelectedPropertyId(initialPropertyId || '');
      setSelectedPropertyName(initialPropertyName || '');
      setErrors({});
      setInviteSuccess(false);
      setInviteCode('');
      setInviteId('');
      setInviteMode('new');
      setSelectedTenant(null);
      setSearchQuery('');
      
      // Load existing tenants when modal opens
      loadExistingTenants();
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

  // Filter tenants based on search query
  useEffect(() => {
    if (!searchQuery) {
      setFilteredTenants(existingTenants);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = existingTenants.filter(tenant => 
        tenant.email.toLowerCase().includes(query) ||
        tenant.name?.toLowerCase().includes(query) ||
        `${tenant.firstName} ${tenant.lastName}`.toLowerCase().includes(query) ||
        tenant.displayName?.toLowerCase().includes(query)
      );
      setFilteredTenants(filtered);
    }
  }, [searchQuery, existingTenants]);

  /**
   * Load all existing tenant accounts from the system using Cloud Function
   */
  const loadExistingTenants = async () => {
    setLoadingTenants(true);
    try {
      const functions = getFunctions();
      const getAllTenantsFunction = httpsCallable(functions, 'getAllTenants');
      
      console.log('📋 Loading existing tenants via Cloud Function...');
      const result = await getAllTenantsFunction({ 
        searchQuery: searchQuery,
        limit: 200 
      });
      
      const data = result.data as any;
      
      const tenantAccounts: TenantAccount[] = data.tenants.map((tenant: any) => ({
        uid: tenant.uid,
        email: tenant.email || '',
        name: tenant.name,
        firstName: tenant.firstName,
        lastName: tenant.lastName,
        displayName: tenant.displayName,
        role: tenant.role || tenant.userType,
        userType: tenant.userType,
        status: tenant.status || 'active',
        phone: tenant.phone
      }));
      
      setExistingTenants(tenantAccounts);
      console.log(`✅ Loaded ${tenantAccounts.length} existing tenant accounts via Cloud Function`);
      toast.success(`Found ${tenantAccounts.length} tenant accounts`);
    } catch (error) {
      console.error('❌ Error calling getAllTenants Cloud Function:', error);
      toast.error('Failed to load existing tenant accounts. Please check permissions.');
      setExistingTenants([]);
    } finally {
      setLoadingTenants(false);
    }
  };

  const validateForm = () => {
    try {
      const emailToValidate = inviteMode === 'existing' && selectedTenant 
        ? selectedTenant.email 
        : email;
        
      CreateInviteSchema.parse({
        tenantEmail: emailToValidate,
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
    const emailToInvite = inviteMode === 'existing' && selectedTenant ? selectedTenant.email : email;
    
    try {
      // Use Firebase Cloud Function directly for better reliability
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
        
        // Enhanced success toast message
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
                              <p>An invitation has been sent to <span className="font-semibold">
                                {inviteMode === 'existing' && selectedTenant 
                                  ? (selectedTenant.name || selectedTenant.displayName || `${selectedTenant.firstName} ${selectedTenant.lastName}` || selectedTenant.email)
                                  : email
                                }
                              </span> for <span className="font-semibold">{selectedPropertyName}</span>.</p>
                              <p className="mt-1">They'll receive an email with instructions on how to join your property.</p>
                            </div>
                          </div>
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
                            {inviteMode === 'existing' ? 'They\'ll get access to the property in their existing account' : 'They\'ll create an account (if they don\'t have one)'}
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            They'll get access to submit maintenance requests
                          </li>
                          <li className="flex items-start">
                            <span className="text-blue-500 mr-2">•</span>
                            You'll be able to communicate directly through the platform
                          </li>
                        </ul>
                      </div>

                      {/* Show invite ID if available */}
                      {inviteId && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <p className="text-sm font-medium text-gray-700 mb-2">Invitation Reference:</p>
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
                            setSelectedPropertyId(initialPropertyId || '');
                            setSelectedPropertyName(initialPropertyName || '');
                            setInviteMode('new');
                            setSelectedTenant(null);
                            setSearchQuery('');
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
                                Choose to invite an existing tenant account or create a new invitation
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                We'll send a professional email invitation to the tenant
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                Once accepted, they'll have access to submit maintenance requests
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

                        {/* Email Notification Option for Existing Tenants */}
                        {inviteMode === 'existing' && selectedTenant && (
                          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                            <div className="flex items-start">
                              <div className="flex-shrink-0">
                                <EnvelopeIcon className="h-5 w-5 text-amber-600 mt-0.5" />
                              </div>
                              <div className="ml-3 flex-1">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="text-sm font-medium text-amber-800">
                                      Email Notification
                                    </h4>
                                    <p className="text-sm text-amber-700 mt-1">
                                      Notify {selectedTenant.name || selectedTenant.email} about this invitation via email
                                    </p>
                                  </div>
                                  <div className="ml-4">
                                    <label className="relative inline-flex items-center cursor-pointer">
                                      <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={sendEmailNotifications}
                                        onChange={(e) => setSendEmailNotifications(e.target.checked)}
                                      />
                                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                                    </label>
                                  </div>
                                </div>
                                <p className="text-xs text-amber-600 mt-2">
                                  {sendEmailNotifications 
                                    ? "✓ They'll receive an email notification about the invitation" 
                                    : "⚠️ They'll only see the invitation when they log in"
                                  }
                                </p>
                              </div>
                            </div>
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