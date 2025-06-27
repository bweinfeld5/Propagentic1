import React, { useState, Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon, 
  BriefcaseIcon,
  BuildingOfficeIcon,
  CheckCircleIcon,
  PlusIcon,
  XCircleIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import contractorService from '../../services/contractorService';
import toast from 'react-hot-toast';

interface AddContractorModalProps {
  isOpen: boolean;
  onClose: () => void;
  landlordId: string;
  onSuccess: () => void;
  editContractor?: any;
}

/**
 * AddContractorModal Component
 * 
 * Modal for adding new contractors to the preferred list
 * 
 * @param {boolean} isOpen - Whether the modal is open
 * @param {function} onClose - Callback to close the modal
 * @param {string} landlordId - Current landlord's ID
 * @param {function} onSuccess - Callback after successful contractor addition
 * @param {object} editContractor - Contractor to edit (null for new contractor)
 */
const AddContractorModal: React.FC<AddContractorModalProps> = ({ 
  isOpen, 
  onClose, 
  landlordId, 
  onSuccess, 
  editContractor = null 
}) => {
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    trades: [] as string[],
    notes: '',
    website: '',
    licenseNumber: '',
    isInsured: false,
    insuranceExpiry: ''
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [newTrade, setNewTrade] = useState<string>('');
  const [success, setSuccess] = useState<boolean>(false);

  // Common trade options
  const commonTrades = [
    'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting', 
    'Roofing', 'Flooring', 'Appliance Repair', 'Landscaping', 
    'Cleaning', 'General Maintenance', 'Pest Control'
  ];

  // Reset form when modal opens/closes or when editContractor changes
  React.useEffect(() => {
    if (isOpen) {
      if (editContractor) {
        setFormData({
          name: editContractor.name || '',
          companyName: editContractor.companyName || '',
          email: editContractor.email || '',
          phone: editContractor.phone || '',
          trades: editContractor.trades || [],
          notes: editContractor.notes || '',
          website: editContractor.website || '',
          licenseNumber: editContractor.licenseNumber || '',
          isInsured: editContractor.isInsured || false,
          insuranceExpiry: editContractor.insuranceExpiry || ''
        });
      } else {
        setFormData({
          name: '',
          companyName: '',
          email: '',
          phone: '',
          trades: [],
          notes: '',
          website: '',
          licenseNumber: '',
          isInsured: false,
          insuranceExpiry: ''
        });
      }
      setErrors({});
      setSuccess(false);
      setNewTrade('');
    }
  }, [isOpen, editContractor]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target as HTMLInputElement;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addTrade = (trade: string) => {
    if (trade && !formData.trades.includes(trade)) {
      setFormData(prev => ({
        ...prev,
        trades: [...prev.trades, trade]
      }));
    }
    setNewTrade('');
  };

  const removeTrade = (tradeToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      trades: prev.trades.filter(trade => trade !== tradeToRemove)
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (formData.trades.length === 0) {
      newErrors.trades = 'At least one trade/specialty is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      let result;
      
      if (editContractor) {
        // Update existing contractor
        result = await contractorService.updateContractor(editContractor.id, formData);
      } else {
        // Add new contractor
        result = await contractorService.addContractor(landlordId, formData);
      }

      if (result.success) {
        setSuccess(true);
        toast.success(result.message || 'Contractor saved successfully!');
        
        // Close modal after a brief delay to show success state
        setTimeout(() => {
          onSuccess();
          onClose();
        }, 1500);
      } else {
        toast.error(result.error || 'Failed to save contractor');
      }
    } catch (error) {
      console.error('Error saving contractor:', error);
      toast.error('Failed to save contractor');
    } finally {
      setLoading(false);
    }
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
                      {success ? '✅ Contractor Saved!' : `${editContractor ? 'Edit' : 'Add'} Contractor`}
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
                  {success ? (
                    <div className="text-center py-8">
                      <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        Contractor {editContractor ? 'Updated' : 'Added'} Successfully!
                      </h3>
                      <p className="text-gray-600">
                        {formData.name} has been {editContractor ? 'updated in' : 'added to'} your preferred contractors list.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Basic Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                            Contractor Name *
                          </label>
                          <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              id="name"
                              name="name"
                              value={formData.name}
                              onChange={handleInputChange}
                              className={`block w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                errors.name ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                              }`}
                              placeholder="John Smith"
                            />
                          </div>
                          {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                        </div>

                        <div>
                          <label htmlFor="companyName" className="block text-sm font-semibold text-gray-700 mb-2">
                            Company Name
                          </label>
                          <div className="relative">
                            <BuildingOfficeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="text"
                              id="companyName"
                              name="companyName"
                              value={formData.companyName}
                              onChange={handleInputChange}
                              className="block w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                              placeholder="ABC Plumbing Services"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Contact Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                            Email Address *
                          </label>
                          <div className="relative">
                            <EnvelopeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="email"
                              id="email"
                              name="email"
                              value={formData.email}
                              onChange={handleInputChange}
                              className={`block w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                errors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                              }`}
                              placeholder="john@example.com"
                            />
                          </div>
                          {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                          <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                            Phone Number *
                          </label>
                          <div className="relative">
                            <PhoneIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                              type="tel"
                              id="phone"
                              name="phone"
                              value={formData.phone}
                              onChange={handleInputChange}
                              className={`block w-full pl-10 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                                errors.phone ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                              }`}
                              placeholder="(555) 123-4567"
                            />
                          </div>
                          {errors.phone && <p className="mt-2 text-sm text-red-600">{errors.phone}</p>}
                        </div>
                      </div>

                      {/* Trades/Specialties */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Trades & Specialties *
                        </label>
                        
                        {/* Selected trades */}
                        {formData.trades.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-3">
                            {formData.trades.map(trade => (
                              <span
                                key={trade}
                                className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-orange-100 text-orange-800"
                              >
                                {trade}
                                <button
                                  type="button"
                                  onClick={() => removeTrade(trade)}
                                  className="ml-2 text-orange-600 hover:text-orange-800"
                                >
                                  <XCircleIcon className="w-4 h-4" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Common trades buttons */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3">
                          {commonTrades.map(trade => (
                            <button
                              key={trade}
                              type="button"
                              onClick={() => addTrade(trade)}
                              disabled={formData.trades.includes(trade)}
                              className={`px-3 py-2 text-sm border rounded-lg transition-colors ${
                                formData.trades.includes(trade)
                                  ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                                  : 'border-orange-200 text-orange-700 hover:bg-orange-50'
                              }`}
                            >
                              {trade}
                            </button>
                          ))}
                        </div>

                        {/* Custom trade input */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newTrade}
                            onChange={(e) => setNewTrade(e.target.value)}
                            placeholder="Add custom trade..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTrade(newTrade);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => addTrade(newTrade)}
                            className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                          >
                            <PlusIcon className="w-4 h-4" />
                          </button>
                        </div>
                        {errors.trades && <p className="mt-2 text-sm text-red-600">{errors.trades}</p>}
                      </div>

                      {/* Additional Information */}
                      <div>
                        <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-2">
                          Notes
                        </label>
                        <textarea
                          id="notes"
                          name="notes"
                          rows={3}
                          value={formData.notes}
                          onChange={handleInputChange}
                          className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors resize-none"
                          placeholder="Any additional notes about this contractor..."
                        />
                      </div>

                      {/* Form Actions */}
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
                          disabled={loading}
                          className="flex-1"
                        >
                          {loading ? 'Saving...' : editContractor ? 'Update Contractor' : 'Add Contractor'}
                        </Button>
                      </div>
                    </form>
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

export default AddContractorModal; 