import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  BuildingOfficeIcon,
  MapPinIcon,
  CurrencyDollarIcon,
  PhotoIcon,
  CheckCircleIcon,
  HomeIcon,
  UsersIcon,
  DocumentTextIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useDemoMode } from '../../context/DemoModeContext';
import dataService from '../../services/dataService';

/**
 * Manual Property Addition Modal with Glassmorphism Design
 * Multi-step form with progress tracking and Firebase integration
 */
const AddPropertyModal = ({ isOpen, onClose, onPropertyAdded }) => {
  const { currentUser, userProfile } = useAuth();
  const { isDemoMode } = useDemoMode();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  
  // Form data state
  const [formData, setFormData] = useState({
    // Step 1: Basic Information
    name: '',
    propertyType: 'apartment',
    description: '',
    
    // Step 2: Location Details
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'United States',
    
    // Step 3: Property Details
    units: 1,
    bedrooms: 1,
    bathrooms: 1,
    squareFootage: '',
    yearBuilt: '',
    amenities: [],
    
    // Step 4: Financial Information
    monthlyRent: '',
    deposit: '',
    utilities: 'tenant',
    leaseTerm: 12,
    petPolicy: 'no-pets',
    petDeposit: '',
    
    // Step 5: Additional Details
    parkingSpaces: 0,
    furnished: false,
    notes: '',
    availability: 'available'
  });

  // Form steps configuration
  const steps = [
    {
      id: 1,
      title: 'Basic Information',
      description: 'Property name and type',
      icon: BuildingOfficeIcon
    },
    {
      id: 2,
      title: 'Location',
      description: 'Address and location details',
      icon: MapPinIcon
    },
    {
      id: 3,
      title: 'Property Details',
      description: 'Units, rooms, and features',
      icon: HomeIcon
    },
    {
      id: 4,
      title: 'Financial Info',
      description: 'Rent, deposits, and terms',
      icon: CurrencyDollarIcon
    },
    {
      id: 5,
      title: 'Final Details',
      description: 'Additional information',
      icon: DocumentTextIcon
    }
  ];

  // Property type options
  const propertyTypes = [
    { value: 'apartment', label: 'Apartment' },
    { value: 'house', label: 'Single Family House' },
    { value: 'condo', label: 'Condominium' },
    { value: 'townhouse', label: 'Townhouse' },
    { value: 'duplex', label: 'Duplex' },
    { value: 'studio', label: 'Studio' },
    { value: 'loft', label: 'Loft' },
    { value: 'commercial', label: 'Commercial' }
  ];

  // Amenities options
  const amenityOptions = [
    'Air Conditioning', 'Heating', 'Washer/Dryer', 'Dishwasher', 'Parking',
    'Pool', 'Gym', 'Balcony', 'Garden', 'Fireplace', 'Storage', 'Pet Friendly'
  ];

  // Update form data
  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field if it exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  // Validate current step
  const validateStep = (step) => {
    const newErrors = {};
    
    switch (step) {
      case 1:
        if (!formData.name.trim()) newErrors.name = 'Property name is required';
        if (!formData.propertyType) newErrors.propertyType = 'Property type is required';
        break;
      case 2:
        if (!formData.street.trim()) newErrors.street = 'Street address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';
        break;
      case 3:
        if (formData.units < 1) newErrors.units = 'At least 1 unit is required';
        if (formData.bedrooms < 0) newErrors.bedrooms = 'Bedrooms cannot be negative';
        if (formData.bathrooms < 0) newErrors.bathrooms = 'Bathrooms cannot be negative';
        break;
      case 4:
        if (!formData.monthlyRent || formData.monthlyRent <= 0) {
          newErrors.monthlyRent = 'Monthly rent is required and must be positive';
        }
        if (formData.deposit < 0) newErrors.deposit = 'Deposit cannot be negative';
        break;
      case 5:
        // Optional step, no required fields
        break;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep < steps.length) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Handle previous step
  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare property data for Firebase
      const propertyData = {
        // Basic information
        name: formData.name,
        propertyType: formData.propertyType,
        description: formData.description,
        
        // Address as both object and string for compatibility
        address: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zip: formData.zipCode,
          country: formData.country
        },
        street: formData.street,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        
        // Property details
        units: parseInt(formData.units),
        bedrooms: parseInt(formData.bedrooms),
        bathrooms: parseInt(formData.bathrooms),
        squareFootage: formData.squareFootage ? parseInt(formData.squareFootage) : null,
        yearBuilt: formData.yearBuilt ? parseInt(formData.yearBuilt) : null,
        amenities: formData.amenities,
        
        // Financial information
        monthlyRent: parseFloat(formData.monthlyRent),
        monthlyRevenue: parseFloat(formData.monthlyRent), // For dashboard calculations
        deposit: formData.deposit ? parseFloat(formData.deposit) : 0,
        utilities: formData.utilities,
        leaseTerm: parseInt(formData.leaseTerm),
        petPolicy: formData.petPolicy,
        petDeposit: formData.petDeposit ? parseFloat(formData.petDeposit) : 0,
        
        // Additional details
        parkingSpaces: parseInt(formData.parkingSpaces),
        furnished: formData.furnished,
        notes: formData.notes,
        availability: formData.availability,
        
        // System fields
        status: 'active',
        occupiedUnits: 0, // Initially no tenants
        occupancy: 0,
        isOccupied: false,
        landlordId: currentUser.uid,
        landlordEmail: userProfile?.email || currentUser.email,
        source: 'manual_entry'
      };

      // Create property in Firebase
      const newProperty = await dataService.createProperty(propertyData);
      
      console.log('Property created successfully:', newProperty);
      
      // Call success callback
      if (onPropertyAdded) {
        onPropertyAdded(newProperty);
      }
      
      // Close modal
      onClose(); 
      
      // Show success message (you can implement toast notifications)
      alert('Property added successfully!');
      
    } catch (error) {
      console.error('Error creating property:', error);
      setErrors({ submit: error.message || 'Failed to create property. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
    }
  }, [isOpen]);

  // Progress calculation
  const progress = (currentStep / steps.length) * 100;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
      >
        {/* Glassmorphism Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}
        >
          {/* Progress Bar */}
          <div className="absolute top-0 left-0 w-full h-1 bg-gray-200">
            <motion.div
              className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>

          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200/50">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Add New Property</h2>
              <p className="text-sm text-gray-600 mt-1">
                Step {currentStep} of {steps.length}: {steps[currentStep - 1]?.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
                    </div>

          {/* Step Indicator */}
          <div className="flex items-center justify-center px-6 py-4 border-b border-gray-200/50">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                  currentStep > step.id
                    ? 'bg-green-500 border-green-500 text-white'
                    : currentStep === step.id
                    ? 'bg-orange-500 border-orange-500 text-white'
                    : 'bg-gray-100 border-gray-300 text-gray-500'
                }`}>
                  {currentStep > step.id ? (
                    <CheckCircleIcon className="w-5 h-5" />
                  ) : (
                    <step.icon className="w-5 h-5" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    currentStep > step.id ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {/* Form Content */}
          <div className="flex-1 overflow-y-auto max-h-96 p-6">
            {renderStepContent()}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200/50 bg-gray-50/50">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 1}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            
            <div className="text-sm text-gray-500">
              {currentStep} of {steps.length}
            </div>
            
            {currentStep < steps.length ? (
              <button
                onClick={handleNext}
                className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <PlusIcon className="w-4 h-4" />
                    Create Property
                  </>
                )}
              </button>
            )}
          </div>

          {/* Error Display */}
          {errors.submit && (
            <div className="absolute bottom-20 left-6 right-6 bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  function renderStepContent() {
    switch (currentStep) {
      case 1:
        return renderBasicInformation();
      case 2:
        return renderLocationDetails();
      case 3:
        return renderPropertyDetails();
      case 4:
        return renderFinancialInformation();
      case 5:
        return renderAdditionalDetails();
      default:
        return null;
    }
  }

  function renderBasicInformation() {
    return (
      <div className="space-y-6">
                  <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Name *
          </label>
                    <input
                      type="text"
            value={formData.name}
            onChange={(e) => updateFormData('name', e.target.value)}
            placeholder="e.g., Sunset Apartments Unit 1A"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property Type *
          </label>
          <select
            value={formData.propertyType}
            onChange={(e) => updateFormData('propertyType', e.target.value)}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
              errors.propertyType ? 'border-red-300' : 'border-gray-300'
            }`}
          >
            {propertyTypes.map(type => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          {errors.propertyType && <p className="mt-1 text-sm text-red-600">{errors.propertyType}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => updateFormData('description', e.target.value)}
            placeholder="Brief description of the property..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                    />
                  </div>
      </div>
    );
  }

  function renderLocationDetails() {
    return (
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Street Address *
          </label>
          <input
            type="text"
            value={formData.street}
            onChange={(e) => updateFormData('street', e.target.value)}
            placeholder="e.g., 123 Main Street"
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
              errors.street ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.street && <p className="mt-1 text-sm text-red-600">{errors.street}</p>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              City *
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => updateFormData('city', e.target.value)}
              placeholder="San Francisco"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.city ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              State *
            </label>
            <input
              type="text"
              value={formData.state}
              onChange={(e) => updateFormData('state', e.target.value)}
              placeholder="CA"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.state ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ZIP Code *
            </label>
            <input
              type="text"
              value={formData.zipCode}
              onChange={(e) => updateFormData('zipCode', e.target.value)}
              placeholder="94102"
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.zipCode ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.zipCode && <p className="mt-1 text-sm text-red-600">{errors.zipCode}</p>}
          </div>

                  <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Country
            </label>
                    <input
                      type="text"
              value={formData.country}
              onChange={(e) => updateFormData('country', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
        </div>
      </div>
    );
  }

  function renderPropertyDetails() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Units *
            </label>
            <input
              type="number"
              min="1"
              value={formData.units}
              onChange={(e) => updateFormData('units', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.units ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.units && <p className="mt-1 text-sm text-red-600">{errors.units}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms
            </label>
            <input
              type="number"
              min="0"
              value={formData.bedrooms}
              onChange={(e) => updateFormData('bedrooms', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.bedrooms ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.bedrooms && <p className="mt-1 text-sm text-red-600">{errors.bedrooms}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bathrooms
            </label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={formData.bathrooms}
              onChange={(e) => updateFormData('bathrooms', e.target.value)}
              className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                errors.bathrooms ? 'border-red-300' : 'border-gray-300'
              }`}
            />
            {errors.bathrooms && <p className="mt-1 text-sm text-red-600">{errors.bathrooms}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Square Footage
            </label>
            <input
              type="number"
              min="0"
              value={formData.squareFootage}
              onChange={(e) => updateFormData('squareFootage', e.target.value)}
              placeholder="1200"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Year Built
            </label>
            <input
              type="number"
              min="1800"
              max={new Date().getFullYear()}
              value={formData.yearBuilt}
              onChange={(e) => updateFormData('yearBuilt', e.target.value)}
              placeholder="2020"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amenities
          </label>
          <div className="grid grid-cols-2 gap-2">
            {amenityOptions.map(amenity => (
              <label key={amenity} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.amenities.includes(amenity)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      updateFormData('amenities', [...formData.amenities, amenity]);
                    } else {
                      updateFormData('amenities', formData.amenities.filter(a => a !== amenity));
                    }
                  }}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{amenity}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderFinancialInformation() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Monthly Rent *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.monthlyRent}
                onChange={(e) => updateFormData('monthlyRent', e.target.value)}
                placeholder="2800"
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                  errors.monthlyRent ? 'border-red-300' : 'border-gray-300'
                }`}
              />
            </div>
            {errors.monthlyRent && <p className="mt-1 text-sm text-red-600">{errors.monthlyRent}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Security Deposit
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.deposit}
                onChange={(e) => updateFormData('deposit', e.target.value)}
                placeholder="2800"
                className={`w-full pl-8 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                  errors.deposit ? 'border-red-300' : 'border-gray-300'
                }`}
                    />
                  </div>
            {errors.deposit && <p className="mt-1 text-sm text-red-600">{errors.deposit}</p>}
          </div>
                    </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Utilities
            </label>
            <select
              value={formData.utilities}
              onChange={(e) => updateFormData('utilities', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="tenant">Tenant Pays</option>
              <option value="landlord">Landlord Pays</option>
              <option value="split">Split</option>
            </select>
                    </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lease Term (months)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={formData.leaseTerm}
              onChange={(e) => updateFormData('leaseTerm', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
                    </div>
                  </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pet Policy
            </label>
                    <select 
              value={formData.petPolicy}
              onChange={(e) => updateFormData('petPolicy', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="no-pets">No Pets</option>
              <option value="cats-only">Cats Only</option>
              <option value="dogs-only">Dogs Only</option>
              <option value="cats-and-dogs">Cats and Dogs</option>
              <option value="all-pets">All Pets Welcome</option>
                       </select>
                     </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Pet Deposit
            </label>
            <div className="relative">
              <span className="absolute left-3 top-3 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={formData.petDeposit}
                onChange={(e) => updateFormData('petDeposit', e.target.value)}
                placeholder="500"
                disabled={formData.petPolicy === 'no-pets'}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  function renderAdditionalDetails() {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Parking Spaces
            </label>
            <input
              type="number"
              min="0"
              value={formData.parkingSpaces}
              onChange={(e) => updateFormData('parkingSpaces', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>

                     <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <select
              value={formData.availability}
              onChange={(e) => updateFormData('availability', e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="available">Available Now</option>
              <option value="occupied">Currently Occupied</option>
              <option value="maintenance">Under Maintenance</option>
              <option value="coming-soon">Coming Soon</option>
            </select>
          </div>
                     </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.furnished}
              onChange={(e) => updateFormData('furnished', e.target.checked)}
              className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-gray-700">Furnished Property</span>
          </label>
                </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Additional Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => updateFormData('notes', e.target.value)}
            placeholder="Any additional information about the property..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
          />
                </div>

        {/* Summary */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <h4 className="font-medium text-orange-900 mb-2">Property Summary</h4>
          <div className="text-sm text-orange-800 space-y-1">
            <p><strong>Property:</strong> {formData.name || 'Unnamed Property'}</p>
            <p><strong>Type:</strong> {propertyTypes.find(t => t.value === formData.propertyType)?.label}</p>
            <p><strong>Location:</strong> {formData.city && formData.state ? `${formData.city}, ${formData.state}` : 'Location not set'}</p>
            <p><strong>Units:</strong> {formData.units} • <strong>Rent:</strong> ${formData.monthlyRent || 0}/month</p>
          </div>
        </div>
      </div>
  );
  }
};

export default AddPropertyModal; 