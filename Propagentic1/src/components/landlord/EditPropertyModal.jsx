import React, { useState, useEffect } from 'react';
import { 
  XMarkIcon,
  BuildingOfficeIcon,
  CurrencyDollarIcon,
  MapPinIcon,
  HomeIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useRetry } from '../../hooks/useRetry';
import { useConnection } from '../../context/ConnectionContext';
import dataService from '../../services/dataService';
import { cx } from '../../design-system';

const EditPropertyModal = ({
  isOpen = false,
  onClose,
  onSuccess,
  property = null,
  className = ''
}) => {
  const { isOnline, connectionQuality } = useConnection();
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    nickname: '',
    propertyType: 'apartment',
    description: '',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    monthlyRent: '',
    units: '1',
    status: 'active'
  });

  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);

  // Initialize retry hook for the update operation
  const {
    execute: updateProperty,
    isLoading,
    error: updateError,
    reset: resetRetry
  } = useRetry(
    async (propertyId, data) => {
      return await dataService.updateProperty(propertyId, data);
    },
    {
      maxRetries: 3,
      onSuccess: (result) => {
        onSuccess?.(result);
        onClose();
        resetForm();
      },
      onError: (error) => {
        console.error('Property update failed:', error);
      }
    }
  );

  // Initialize form when property changes
  useEffect(() => {
    if (property) {
      setFormData({
        name: property.name || property.title || '',
        nickname: property.nickname || '',
        propertyType: property.propertyType || property.type || 'apartment',
        description: property.description || '',
        street: typeof property.address === 'string' ? property.address : (property.address?.street || property.street || ''),
        city: typeof property.address === 'object' ? property.address?.city : (property.city || ''),
        state: typeof property.address === 'object' ? property.address?.state : (property.state || ''),
        zipCode: typeof property.address === 'object' ? property.address?.zip : (property.zipCode || property.zip || ''),
        monthlyRent: property.monthlyRent?.toString() || property.rentAmount?.toString() || '',
        units: property.units?.toString() || '1',
        status: property.status || 'active'
      });
      setErrors({});
      setIsDirty(false);
    }
  }, [property]);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    setIsDirty(true);
    
    // Clear field-specific error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Property name is required';
    }

    if (!formData.street.trim()) {
      newErrors.street = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    }

    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{5}(-\d{4})?$/.test(formData.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid ZIP code';
    }

    if (formData.monthlyRent && isNaN(parseFloat(formData.monthlyRent))) {
      newErrors.monthlyRent = 'Please enter a valid amount';
    }

    if (formData.units && (isNaN(parseInt(formData.units)) || parseInt(formData.units) < 1)) {
      newErrors.units = 'Units must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!property?.id) {
      console.error('No property ID available for update');
      return;
    }

    // Prepare update data
    const updateData = {
      name: formData.name.trim(),
      nickname: formData.nickname.trim(),
      propertyType: formData.propertyType,
      description: formData.description.trim(),
      street: formData.street.trim(),
      city: formData.city.trim(),
      state: formData.state.trim(),
      zipCode: formData.zipCode.trim(),
      status: formData.status
    };

    // Add optional fields if they have values
    if (formData.monthlyRent) {
      updateData.monthlyRent = parseFloat(formData.monthlyRent);
    }
    
    if (formData.units) {
      updateData.units = parseInt(formData.units);
    }

    // Execute update
    await updateProperty(property.id, updateData);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      nickname: '',
      propertyType: 'apartment',
      description: '',
      street: '',
      city: '',
      state: '',
      zipCode: '',
      monthlyRent: '',
      units: '1',
      status: 'active'
    });
    setErrors({});
    setIsDirty(false);
    resetRetry();
  };

  // Handle modal close
  const handleClose = () => {
    if (isDirty && !isLoading) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        resetForm();
        onClose();
      }
    } else {
      resetForm();
      onClose();
    }
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isLoading, isDirty]);

  if (!isOpen) return null;

  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'House' },
    { value: 'condo', label: 'Condominium' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'commercial', label: 'Commercial' },
    { value: 'other', label: 'Other' }
  ];

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
    { value: 'maintenance', label: 'Under Maintenance' },
    { value: 'vacant', label: 'Vacant' },
    { value: 'occupied', label: 'Occupied' }
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-80 transition-opacity" aria-hidden="true" />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className={cx(
          'relative inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full',
          className
        )}>
          {/* Header */}
          <div className="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-orange-100 dark:bg-orange-900/20">
                  <BuildingOfficeIcon className="h-6 w-6 text-orange-600 dark:text-orange-400" aria-hidden="true" />
                </div>
                <div className="ml-4">
                  <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                    Edit Property
                  </h3>
                  {property && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {property.name || property.title || 'Untitled Property'}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                className="bg-white dark:bg-gray-800 rounded-md text-gray-400 hover:text-gray-500 dark:text-gray-500 dark:hover:text-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500"
                onClick={handleClose}
                disabled={isLoading}
              >
                <span className="sr-only">Close</span>
                <XMarkIcon className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Connection warning */}
          {!isOnline && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    You're currently offline. Changes will be saved when your connection is restored.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-4 pb-4 sm:px-6 sm:pb-6">
            {/* Error display */}
            {updateError && (
              <div className="mb-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                      Update Failed
                    </h3>
                    <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                      {updateError.message || 'An error occurred while updating the property.'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {/* Property Name */}
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Property Name *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <HomeIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={cx(
                      'block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                      errors.name
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="Enter property name"
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.name}</p>
                )}
              </div>

              {/* Nickname */}
              <div>
                <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Nickname
                </label>
                <input
                  type="text"
                  id="nickname"
                  value={formData.nickname}
                  onChange={(e) => handleInputChange('nickname', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Optional nickname"
                  disabled={isLoading}
                />
              </div>

              {/* Property Type */}
              <div>
                <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Property Type
                </label>
                <select
                  id="propertyType"
                  value={formData.propertyType}
                  onChange={(e) => handleInputChange('propertyType', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                >
                  {propertyTypes.map(type => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Street Address */}
              <div className="sm:col-span-2">
                <label htmlFor="street" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Street Address *
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MapPinIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    id="street"
                    value={formData.street}
                    onChange={(e) => handleInputChange('street', e.target.value)}
                    className={cx(
                      'block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                      errors.street
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="Enter street address"
                    disabled={isLoading}
                  />
                </div>
                {errors.street && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.street}</p>
                )}
              </div>

              {/* City */}
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  City *
                </label>
                <input
                  type="text"
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  className={cx(
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                    errors.city
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="Enter city"
                  disabled={isLoading}
                />
                {errors.city && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.city}</p>
                )}
              </div>

              {/* State */}
              <div>
                <label htmlFor="state" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  State *
                </label>
                <input
                  type="text"
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  className={cx(
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                    errors.state
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="Enter state"
                  disabled={isLoading}
                />
                {errors.state && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.state}</p>
                )}
              </div>

              {/* ZIP Code */}
              <div>
                <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  ZIP Code *
                </label>
                <input
                  type="text"
                  id="zipCode"
                  value={formData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={cx(
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                    errors.zipCode
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                  placeholder="Enter ZIP code"
                  disabled={isLoading}
                />
                {errors.zipCode && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.zipCode}</p>
                )}
              </div>

              {/* Monthly Rent */}
              <div>
                <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Monthly Rent
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <CurrencyDollarIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="number"
                    id="monthlyRent"
                    value={formData.monthlyRent}
                    onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
                    className={cx(
                      'block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                      errors.monthlyRent
                        ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                        : 'border-gray-300 dark:border-gray-600'
                    )}
                    placeholder="0.00"
                    step="0.01"
                    min="0"
                    disabled={isLoading}
                  />
                </div>
                {errors.monthlyRent && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.monthlyRent}</p>
                )}
              </div>

              {/* Units */}
              <div>
                <label htmlFor="units" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Number of Units
                </label>
                <input
                  type="number"
                  id="units"
                  value={formData.units}
                  onChange={(e) => handleInputChange('units', e.target.value)}
                  className={cx(
                    'mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white',
                    errors.units
                      ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300 dark:border-gray-600'
                  )}
                  min="1"
                  disabled={isLoading}
                />
                {errors.units && (
                  <p className="mt-2 text-sm text-red-600 dark:text-red-400">{errors.units}</p>
                )}
              </div>

              {/* Status */}
              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Status
                </label>
                <select
                  id="status"
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                  disabled={isLoading}
                >
                  {statusOptions.map(status => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div className="sm:col-span-2">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-700 dark:text-white"
                  placeholder="Optional property description"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="mt-6 flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={isLoading}
                className="mt-3 sm:mt-0 w-full sm:w-auto"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={isLoading}
                disabled={isLoading || !isDirty}
                className="w-full sm:w-auto"
              >
                {isLoading ? 'Updating...' : 'Update Property'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditPropertyModal;