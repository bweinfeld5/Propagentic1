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
import inviteCodeService from '../../services/inviteCodeService';
import { getPropertyById } from '../../services/firestore/propertyService';

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
  initialUnitId?: string;
  properties?: Property[];
  onInviteSuccess?: () => void;
}

const InviteTenantModal: React.FC<InviteTenantModalProps> = ({
  isOpen,
  onClose,
  propertyId: initialPropertyId,
  propertyName: initialPropertyName,
  initialUnitId,
  properties = [],
  onInviteSuccess,
}) => {
  const [email, setEmail] = useState<string>('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || '');
  const [selectedPropertyName, setSelectedPropertyName] = useState<string>(initialPropertyName || '');
  const [landlordName, setLandlordName] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [unitNumber, setUnitNumber] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [inviteSuccess, setInviteSuccess] = useState<boolean>(false);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'info' | 'qr'>('info');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ type: string; message: string } | null>(null);
  
  // Units management state
  const [propertyUnits, setPropertyUnits] = useState<{ [key: string]: { capacity: number; tenants: string[] } }>({});
  const [selectedUnit, setSelectedUnit] = useState<string>('');
  const [isLoadingUnits, setIsLoadingUnits] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setSelectedPropertyId(initialPropertyId || '');
      setSelectedPropertyName(initialPropertyName || '');
      setSelectedUnit(initialUnitId || '');
      setPropertyUnits({});
      setErrors({});
      setInviteSuccess(false);
      setInviteCode('');
      setActiveTab('info');
    }
  }, [isOpen, initialPropertyId, initialPropertyName, initialUnitId]);

  // Handle property selection and fetch units
  const handlePropertySelect = async (propertyId: string) => {
    setSelectedPropertyId(propertyId);
    setSelectedUnit(''); // Reset unit selection
    setPropertyUnits({}); // Reset units
    
    if (!propertyId) {
      setSelectedPropertyName('');
      return;
    }
    
    // Update property name
    const property = properties.find(p => p.id === propertyId);
    if (property) {
      setSelectedPropertyName(property.nickname || property.name || property.streetAddress || 'Unknown Property');
    }
    
    // Fetch property details including units
    setIsLoadingUnits(true);
    try {
      const propertyDoc = await getPropertyById(propertyId);
      const propertyData = propertyDoc as any; // Cast to any to handle new units structure
      if (propertyData && propertyData.units) {
        setPropertyUnits(propertyData.units);
        console.log('Loaded units for property:', propertyData.units);
      } else {
        console.log('No units found for property or property not found');
        setPropertyUnits({});
      }
    } catch (error) {
      console.error('Error fetching property units:', error);
      toast.error('Failed to load property units');
      setPropertyUnits({});
    } finally {
      setIsLoadingUnits(false);
    }
  };

  useEffect(() => {
    if (selectedPropertyId) {
      handlePropertySelect(selectedPropertyId);
    }
  }, [selectedPropertyId]);

  // Set initial unit after units are loaded
  useEffect(() => {
    if (initialUnitId && propertyUnits && Object.keys(propertyUnits).length > 0 && Object.keys(propertyUnits).includes(initialUnitId)) {
      setSelectedUnit(initialUnitId);
    }
  }, [propertyUnits, initialUnitId]);

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
    
    if (!selectedPropertyId || !email) {
      toast.error('Please fill in all required fields');
      return;
    }

    // Add final validation to prevent submitting an invite for a full unit
    if (selectedUnit && propertyUnits[selectedUnit]) {
      const unit = propertyUnits[selectedUnit];
      if ((unit.tenants?.length || 0) >= unit.capacity) {
        toast.error(`Unit ${selectedUnit} is at full capacity and cannot accept new tenants.`);
        setLoading(false); // Ensure loading state is reset
        return; // Stop the submission
      }
    }

    // Validate unit selection and capacity
    if (Object.keys(propertyUnits).length > 0) { // Only validate if property has units
      if (!selectedUnit) {
        toast.error('Please select a unit for this tenant');
        return;
      }
    }

    setLoading(true);
    
    try {
      // Create the invite using the working inviteService
      const inviteData = {
        tenantEmail: email.trim(),
        propertyId: selectedPropertyId,
        landlordId: auth.currentUser?.uid || '',
        propertyName: selectedPropertyName || 'Property',
        landlordName: landlordName.trim() || auth.currentUser?.displayName || 'Landlord',
        unitId: selectedUnit || undefined,
        unitNumber: selectedUnit || undefined // For now, use unit name as unit number
      };

      console.log('Creating invite with data:', inviteData);
      const shortCode = await inviteService.createInvite(inviteData);
      
      console.log('✅ Invite created successfully with short code:', shortCode);
        setInviteSuccess(true);
      setInviteCode(shortCode);
      
      toast.success(`Invitation sent successfully! Tenant can use code: ${shortCode}`);
        
        if (onInviteSuccess) {
          onInviteSuccess();
        }
      
    } catch (error: any) {
      console.error('Error creating invite:', error);
      toast.error(error.message || 'Failed to send invitation. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getInviteUrl = () => {
    const baseUrl = window.location.origin;
    return `${baseUrl}/invite?code=${inviteCode}`;
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
                              <p className="mt-1">They can join by email or by scanning the QR code below.</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Tabs for Info and QR Code */}
                      <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                          <button
                            onClick={() => setActiveTab('info')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm ${
                              activeTab === 'info'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            Next Steps
                          </button>
                          <button
                            onClick={() => setActiveTab('qr')}
                            className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2 ${
                              activeTab === 'qr'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                          >
                            <QrCodeIcon className="w-4 h-4" />
                            QR Code
                          </button>
                        </nav>
                      </div>

                      {activeTab === 'info' ? (
                        <>
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
                            They'll create an account (if they don't have one)
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
                          {inviteCode && (
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                              <p className="text-sm font-medium text-gray-700 mb-2">Invitation Code:</p>
                          <div className="bg-white rounded-lg px-3 py-2 font-mono text-sm text-center border border-gray-300">
                                {inviteCode}
                              </div>
                              <p className="text-xs text-gray-500 mt-2 text-center">
                                The tenant can use this code to accept the invitation manually.
                              </p>
                            </div>
                          )}
                        </>
                      ) : (
                        /* QR Code Tab */
                        <div className="space-y-4">
                          <div className="text-center">
                            <h4 className="text-lg font-semibold text-gray-900 mb-2">Quick Join QR Code</h4>
                            <p className="text-sm text-gray-600 mb-4">
                              Tenant can scan this code with their phone to join instantly
                            </p>
                            
                            {/* QR Code Display */}
                            <div className="flex justify-center">
                              <div className="relative">
                                <QRCodeDisplay 
                                  inviteCode={inviteCode}
                                  propertyName={selectedPropertyName}
                                  size={200}
                                  includeText={true}
                                  downloadable={true}
                                  style="branded"
                                />
                              </div>
                            </div>
                          </div>

                          <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
                            <h5 className="font-semibold text-orange-900 mb-2">How to use the QR code:</h5>
                            <ul className="text-sm text-orange-800 space-y-1">
                              <li className="flex items-start">
                                <span className="text-orange-500 mr-2">•</span>
                                Show this QR code to your tenant in person
                              </li>
                              <li className="flex items-start">
                                <span className="text-orange-500 mr-2">•</span>
                                They scan it with their phone camera
                              </li>
                              <li className="flex items-start">
                                <span className="text-orange-500 mr-2">•</span>
                                They'll be taken directly to the acceptance page
                              </li>
                              <li className="flex items-start">
                                <span className="text-orange-500 mr-2">•</span>
                                No need to type codes or check email
                              </li>
                            </ul>
                          </div>

                          <div className="text-center">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(getInviteUrl());
                                toast.success('Invite link copied to clipboard!');
                              }}
                              className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                            >
                              <LinkIcon className="w-4 h-4" />
                              Copy Invite Link
                            </button>
                          </div>
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
                            setSelectedPropertyId(initialPropertyId || '');
                            setSelectedPropertyName(initialPropertyName || '');
                            setSelectedUnit(initialUnitId || '');
                            setPropertyUnits({});
                            setActiveTab('info');
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
                                We'll send a professional email invitation to the tenant
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                They'll receive a unique invitation code
                              </li>
                              <li className="flex items-start">
                                <span className="text-blue-500 mr-2">•</span>
                                The tenant can accept directly from the email or enter the code manually
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
                                onChange={(e) => handlePropertySelect(e.target.value)}
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

                        {/* Unit Selection - Only show if property is selected and has units */}
                        {selectedPropertyId && (
                          <div>
                            <label htmlFor="unit" className="block text-sm font-semibold text-gray-700 mb-2">
                              Select Unit
                            </label>
                            {isLoadingUnits ? (
                              <div className="flex items-center justify-center py-4 bg-gray-50 rounded-xl border border-gray-200">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-500"></div>
                                <span className="ml-2 text-sm text-gray-600">Loading units...</span>
                              </div>
                            ) : Object.keys(propertyUnits).length === 0 ? (
                              <div className="text-sm text-gray-500 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
                                <p className="text-yellow-800">⚠️ This property doesn't have units configured yet.</p>
                                <p className="text-yellow-700 mt-1">You can still send the invitation, but consider adding units to better manage tenants.</p>
                              </div>
                            ) : (
                              <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <BuildingOfficeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                                </div>
                                <select
                                  id="unit"
                                  className={`block w-full pl-10 pr-4 py-3 text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                    errors.selectedUnit ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                                  }`}
                                  value={selectedUnit}
                                  onChange={(e) => setSelectedUnit(e.target.value)}
                                >
                                  <option value="">Choose a unit...</option>
                                  {Object.entries(propertyUnits).map(([unitId, unitData]) => {
                                    const isFull = (unitData.tenants?.length || 0) >= unitData.capacity;
                                    const occupancyText = `${unitData.tenants?.length || 0} / ${unitData.capacity}`;
                                    
                                    return (
                                      <option key={unitId} value={unitId} disabled={isFull}>
                                        Unit {unitId} ({occupancyText}) {isFull ? "- Full" : ""}
                                      </option>
                                    );
                                  })}
                                </select>
                                {errors.selectedUnit && <p className="mt-2 text-sm text-red-600">{errors.selectedUnit}</p>}
                                
                                {/* Unit capacity info */}
                                {selectedUnit && propertyUnits[selectedUnit] && (
                                  <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                                    <div className="flex items-center gap-2">
                                      <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <BuildingOfficeIcon className="w-5 h-5 text-blue-600" />
                                      </div>
                                      <p className="text-sm text-blue-800">
                                        <span className="font-medium">Unit {selectedUnit}:</span> {' '}
                                        {propertyUnits[selectedUnit].tenants.length} of {propertyUnits[selectedUnit].capacity} tenants
                                        {propertyUnits[selectedUnit].tenants.length < propertyUnits[selectedUnit].capacity ? (
                                          <span className="text-green-600 ml-2">✓ Available</span>
                                        ) : (
                                          <span className="text-red-600 ml-2">⚠️ At capacity</span>
                                        )}
                                      </p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}

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
                            disabled={loading || !email || !selectedPropertyId || (Object.keys(propertyUnits).length > 0 && !selectedUnit)}
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