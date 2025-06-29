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
  PlusIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useDemoMode } from '../../context/DemoModeContext';
import dataService from '../../services/dataService';
import { getClimateZoneByZip } from '../../services/climateZoneService';

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
    units: 1, // Keep for compatibility, but will be replaced by unitsData
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
    availability: 'available',
    
    // Step 6: HVAC Data
    hvacData: {
      currentSystems: [],
      buildingConstruction: '',
      ceilingHeight: '',
      windowCount: '',
      windowType: '',
      insulationQuality: '',
      ductworkAccess: '',
      currentUtilityCosts: '',
      hvacMaintenanceHistory: [],
      thermostatType: '',
      thermostatLocations: []
    },
    
    // Step 7: Plumbing Data
    plumbingData: {
      fullBathrooms: '',
      halfBathrooms: '',
      kitchens: 1,
      kitchenettes: '',
      waterPressureIssues: false,
      basementAccess: false,
      crawlSpaceAccess: false,
      existingPipeMaterial: '',
      waterHeaterType: '',
      waterHeaterAge: '',
      washerDryerHookups: false,
      plumbingIssueHistory: [],
      waterQualityIssues: [],
      fixtureQuality: ''
    },
    
    // Step 8: Electrical Data
    electricalData: {
      electricalPanelCapacity: '',
      electricalPanelAge: '',
      majorAppliances: [],
      outdoorElectricalNeeds: [],
      highDemandFacilities: [],
      smartHomeFeatures: [],
      electricalIssueHistory: [],
      specialElectricalNeeds: []
    },

    // Step 9: Tenant Invitations
    tenantEmails: [''],
    skipInvites: false
  });

  // Additional state for invite management
  const [inviteStatus, setInviteStatus] = useState({});
  const [createdProperty, setCreatedProperty] = useState(null);
  
  // Units management state
  const [unitsData, setUnitsData] = useState([{ name: '', capacity: 1 }]);

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
    },
    {
      id: 6,
      title: 'HVAC Systems',
      description: 'Heating & cooling details',
      icon: HomeIcon
    },
    {
      id: 7,
      title: 'Plumbing Info',
      description: 'Water & plumbing systems',
      icon: HomeIcon
    },
    {
      id: 8,
      title: 'Electrical Details',
      description: 'Electrical systems',
      icon: HomeIcon
    },
    {
      id: 9,
      title: 'Invite Tenants',
      description: 'Send invitations (optional)',
      icon: UsersIcon
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

  // Units management functions
  const handleUnitChange = (index, field, value) => {
    const newUnits = [...unitsData];
    newUnits[index][field] = value;
    setUnitsData(newUnits);
    // Update the total units count for compatibility
    updateFormData('units', newUnits.length);
  };

  const addUnit = () => {
    setUnitsData([...unitsData, { name: '', capacity: 1 }]);
    updateFormData('units', unitsData.length + 1);
  };

  const removeUnit = (index) => {
    if (unitsData.length > 1) { // Ensure at least one unit remains
      const newUnits = unitsData.filter((_, i) => i !== index);
      setUnitsData(newUnits);
      updateFormData('units', newUnits.length);
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
        // Validate units
        const validUnits = unitsData.filter(unit => unit.name && unit.name.trim());
        if (validUnits.length === 0) {
          newErrors.units = 'At least one unit with a name is required';
        } else {
          // Check for duplicate unit names
          const unitNames = validUnits.map(unit => unit.name.trim().toLowerCase());
          const duplicates = unitNames.filter((name, index) => unitNames.indexOf(name) !== index);
          if (duplicates.length > 0) {
            newErrors.units = 'Unit names must be unique';
          }
        }
        
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
      case 6:
        // Optional step, no required fields
        break;
      case 7:
        // Optional step, no required fields
        break;
      case 8:
        // Optional step, no required fields
        break;
      case 9:
        // Validate tenant invitations only if not skipping
        if (!formData.skipInvites) {
          const validEmails = formData.tenantEmails.filter(email => 
            email.trim() && /\S+@\S+\.\S+/.test(email.trim())
          );
          // Note: We don't require emails because user can still choose to skip at this point
        }
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
    
    // If we're on the last step (step 9)
    if (currentStep === 9) {
      // Check if user wants to skip invites or has no valid emails
      const validEmails = formData.tenantEmails.filter(email => 
        email.trim() && /\S+@\S+\.\S+/.test(email.trim())
      );
      
      if (formData.skipInvites || validEmails.length === 0) {
        // Skip invites and finish property creation
        return await createPropertyAndFinish();
      } else {
        // Send invites
        return handleSendInvites();
      }
    }
    
    // If we're on step 5 and user wants to skip invites
    if (currentStep === 5 && formData.skipInvites) {
      return await createPropertyAndFinish();
    }
    
    // If we're on step 5 and moving to enhanced steps
    if (currentStep === 5 && !formData.skipInvites) {
      setCurrentStep(6);
      return;
    }
    
    // If we're on step 8 and need to proceed to invites or finish
    if (currentStep === 8) {
      if (formData.skipInvites) {
        return await createPropertyAndFinish();
      } else {
        await createPropertyAndContinue();
        setCurrentStep(9);
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      await createPropertyAndFinish();
    } catch (error) {
      console.error('Error creating property:', error);
      setErrors({ submit: error.message || 'Failed to create property. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPropertyAndContinue = async () => {
    setIsSubmitting(true);
    
    try {
      const propertyData = await buildPropertyData();
      const newProperty = await dataService.createProperty(propertyData);
      setCreatedProperty(newProperty);
      console.log('Property created successfully:', newProperty);
    } catch (error) {
      console.error('Error creating property:', error);
      setErrors({ submit: error.message || 'Failed to create property. Please try again.' });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const createPropertyAndFinish = async () => {
    setIsSubmitting(true);
    
    try {
      let property = createdProperty;
      if (!property) {
        const propertyData = await buildPropertyData();
        property = await dataService.createProperty(propertyData);
      }
      
      // Call success callback
      if (onPropertyAdded) {
        onPropertyAdded(property);
      }
      
      // Close modal
      onClose();
      
      // Show success message based on whether invites were skipped
      if (formData.skipInvites) {
        alert('🏠 Property created successfully! You can invite tenants at any time from the property dashboard.');
      } else {
        alert('🏠 Property added successfully!');
      }
      
    } catch (error) {
      console.error('Error creating property:', error);
      setErrors({ submit: error.message || 'Failed to create property. Please try again.' });
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const buildPropertyData = async () => {
    // Get climate zone from ZIP code
    let climateZone = null;
    try {
      if (formData.zipCode) {
        climateZone = await getClimateZoneByZip(formData.zipCode);
      }
    } catch (error) {
      console.warn('Could not determine climate zone:', error);
    }

    // Transform units array into the map structure
    const unitsMap = unitsData.reduce((acc, unit) => {
      if (unit.name && unit.name.trim()) { // Only add units with a name
        acc[unit.name.trim()] = {
          capacity: parseInt(unit.capacity) || 1,
          tenants: [] // Always starts empty
        };
      }
      return acc;
    }, {});

    // Prepare property data for Firebase
    return {
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
      units: unitsMap, // NEW: Units as a map with capacity and tenants
      unitCount: Object.keys(unitsMap).length, // For compatibility/easy counting
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
      
      // Enhanced property data for contractor estimates
      hvacData: {
        ...formData.hvacData,
        climateZone: climateZone?.zone || null,
        climateZoneDescription: climateZone?.description || null
      },
      plumbingData: formData.plumbingData,
      electricalData: formData.electricalData,
      
      // System fields
      status: 'active',
      occupiedUnits: 0, // Initially no tenants
      occupancy: 0,
      isOccupied: false,
      landlordId: currentUser.uid,
      landlordEmail: userProfile?.email || currentUser.email,
      source: 'manual_entry'
    };
  };

  const handleSendInvites = async () => {
    // Ensure property is created first
    let property = createdProperty;
    if (!property) {
      try {
        await createPropertyAndContinue();
        property = createdProperty; // createPropertyAndContinue sets createdProperty
        if (!property) {
          throw new Error('Property creation failed - no property returned');
        }
      } catch (error) {
        setErrors({ submit: 'Failed to create property before sending invites.' });
        return;
      }
    }

    const validEmails = formData.tenantEmails.filter(email => 
      email.trim() && /\S+@\S+\.\S+/.test(email.trim())
    );

    if (validEmails.length === 0) {
      await createPropertyAndFinish();
      return;
    }

    setIsSubmitting(true);

    try {
      // Import the working inviteService
      const { default: inviteService } = await import('../../services/firestore/inviteService');
      
      const invitePromises = validEmails.map(async (email) => {
        try {
          setInviteStatus(prev => ({ ...prev, [email]: 'sending' }));
          
          // Use WORKING inviteService.ts (same as working browser tests)
          const inviteId = await inviteService.createInvite({
            tenantEmail: email.trim(),
            propertyId: property.id,
            landlordId: currentUser.uid,
            propertyName: property.name || property.streetAddress || 'Your Property',
            landlordName: currentUser.displayName || currentUser.email || 'Property Manager'
          });

          setInviteStatus(prev => ({ ...prev, [email]: 'sent' }));
          return { email, success: true, inviteId };
        } catch (error) {
          console.error(`Failed to send invite to ${email}:`, error);
          setInviteStatus(prev => ({ ...prev, [email]: 'failed' }));
          return { email, success: false, error: error.message };
        }
      });

      const results = await Promise.all(invitePromises);
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      // Show results
      if (successful > 0 && failed === 0) {
        alert(`🎉 All ${successful} invitation(s) sent successfully!`);
      } else if (successful > 0 && failed > 0) {
        alert(`⚠️ ${successful} invitation(s) sent, ${failed} failed. Check the status above.`);
      } else if (failed > 0) {
        alert(`❌ All ${failed} invitation(s) failed to send.`);
      }

      // Wait a moment to show the status, then finish
      setTimeout(() => {
        createPropertyAndFinish();
      }, 2000);

    } catch (error) {
      console.error('Error sending invites:', error);
      setErrors({ submit: 'Failed to send some invitations. You can send them later from the property dashboard.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setErrors({});
      setInviteStatus({});
      setCreatedProperty(null);
      setUnitsData([{ name: '', capacity: 1 }]); // Reset units data
      setFormData({
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
        availability: 'available',
        
        // Step 6: HVAC Data
        hvacData: {
          currentSystems: [],
          buildingConstruction: '',
          ceilingHeight: '',
          windowCount: '',
          windowType: '',
          insulationQuality: '',
          ductworkAccess: '',
          currentUtilityCosts: '',
          hvacMaintenanceHistory: [],
          thermostatType: '',
          thermostatLocations: []
        },
        
        // Step 7: Plumbing Data
        plumbingData: {
          fullBathrooms: '',
          halfBathrooms: '',
          kitchens: 1,
          kitchenettes: '',
          waterPressureIssues: false,
          basementAccess: false,
          crawlSpaceAccess: false,
          existingPipeMaterial: '',
          waterHeaterType: '',
          waterHeaterAge: '',
          washerDryerHookups: false,
          plumbingIssueHistory: [],
          waterQualityIssues: [],
          fixtureQuality: ''
        },
        
        // Step 8: Electrical Data
        electricalData: {
          electricalPanelCapacity: '',
          electricalPanelAge: '',
          majorAppliances: [],
          outdoorElectricalNeeds: [],
          highDemandFacilities: [],
          smartHomeFeatures: [],
          electricalIssueHistory: [],
          specialElectricalNeeds: []
        },

        // Step 9: Tenant Invitations
        tenantEmails: [''],
        skipInvites: false
      });
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
                {currentStep === 5 ? 'Continue' : 'Next'}
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
                    {formData.skipInvites || formData.tenantEmails.filter(e => e.trim()).length === 0 
                      ? 'Finishing...' 
                      : 'Sending Invites...'
                    }
                  </>
                ) : (
                  <>
                    <CheckCircleIcon className="w-4 h-4" />
                    {formData.skipInvites || formData.tenantEmails.filter(e => e.trim()).length === 0 
                      ? 'Finish' 
                      : 'Send Invites & Finish'
                    }
                  </>
                )}
              </button>
            )}
            
            {/* Skip to end button for step 5 */}
            {currentStep === 5 && (
              <button
                onClick={() => {
                  updateFormData('skipInvites', true);
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors ml-2"
              >
                Skip & Finish
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
      case 6:
        return renderHVACDetails();
      case 7:
        return renderPlumbingDetails();
      case 8:
        return renderElectricalDetails();
      case 9:
        return renderInviteTenants();
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
        {/* Units Management Section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Property Units * <span className="text-xs text-gray-500">(Define each unit and its tenant capacity)</span>
          </label>
          <div className="space-y-3">
            {unitsData.map((unit, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg bg-gray-50">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder="Unit name (e.g., 101, A, Penthouse)"
                    value={unit.name}
                    onChange={(e) => handleUnitChange(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <div className="w-24">
                  <input
                    type="number"
                    placeholder="Capacity"
                    value={unit.capacity}
                    min="1"
                    max="10"
                    onChange={(e) => handleUnitChange(index, 'capacity', parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeUnit(index)}
                  disabled={unitsData.length === 1}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Remove unit"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addUnit}
              className="w-full py-2 px-4 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors flex items-center justify-center gap-2"
            >
              <PlusIcon className="w-4 h-4" />
              Add Another Unit
            </button>
          </div>
          {errors.units && <p className="mt-1 text-sm text-red-600">{errors.units}</p>}
          <p className="mt-2 text-xs text-gray-500">
            Each unit can hold multiple tenants up to its capacity. You can invite tenants to specific units later.
          </p>
        </div>

        {/* Property Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bedrooms (per unit average)
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
              Bathrooms (per unit average)
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
          <h4 className="text-sm font-medium text-orange-800 mb-2">Property Summary</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-orange-700">
            <div><span className="font-medium">Property:</span> {formData.name}</div>
            <div><span className="font-medium">Type:</span> {formData.propertyType}</div>
            <div><span className="font-medium">Rent:</span> ${formData.monthlyRent}/month</div>
            <div><span className="font-medium">Units:</span> {formData.units}</div>
          </div>
        </div>

        {/* Next Steps Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-800 mb-2">What's Next?</h4>
          <div className="space-y-2 text-sm text-blue-700">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="nextStep"
                checked={!formData.skipInvites}
                onChange={() => updateFormData('skipInvites', false)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span>Invite tenants immediately (recommended)</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                name="nextStep"
                checked={formData.skipInvites}
                onChange={() => updateFormData('skipInvites', true)}
                className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
              />
              <span>Create property only (invite tenants later)</span>
            </label>
          </div>
          <p className="text-xs text-blue-600 mt-2">
            {!formData.skipInvites 
              ? "You'll be able to add tenant email addresses in the next step."
              : "You can always invite tenants later from your property dashboard."
            }
          </p>
        </div>
      </div>
    );
  }

  function renderHVACDetails() {
    const currentSystems = [
      'Central Air Conditioning',
      'Central Heating (Gas)',
      'Central Heating (Electric)',
      'Heat Pump',
      'Window AC Units',
      'Space Heaters',
      'No Current Systems'
    ];

    const constructionTypes = [
      { value: 'frame', label: 'Wood Frame' },
      { value: 'masonry', label: 'Masonry/Brick' },
      { value: 'concrete', label: 'Concrete' },
      { value: 'mixed', label: 'Mixed Construction' }
    ];

    const windowTypes = [
      { value: 'single_pane', label: 'Single Pane' },
      { value: 'double_pane', label: 'Double Pane' },
      { value: 'energy_efficient', label: 'Energy Efficient' }
    ];

    const insulationQualities = [
      { value: 'poor', label: 'Poor' },
      { value: 'average', label: 'Average' },
      { value: 'good', label: 'Good' },
      { value: 'excellent', label: 'Excellent' }
    ];

    const ductworkAccess = [
      { value: 'basement', label: 'Basement' },
      { value: 'crawl_space', label: 'Crawl Space' },
      { value: 'attic', label: 'Attic' },
      { value: 'no_access', label: 'No Access' }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            🌡️ HVAC System Information
          </h4>
          <p className="text-sm text-blue-700">
            This information helps contractors provide accurate heating/cooling estimates. All fields are optional but more details = better estimates.
          </p>
        </div>

        {/* Current Systems - CRITICAL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Current Heating/Cooling Systems *
          </label>
          <div className="grid grid-cols-2 gap-2">
            {currentSystems.map(system => (
              <label key={system} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.hvacData?.currentSystems?.includes(system) || false}
                  onChange={(e) => {
                    const currentSystems = formData.hvacData?.currentSystems || [];
                    if (e.target.checked) {
                      updateFormData('hvacData', {
                        ...formData.hvacData,
                        currentSystems: [...currentSystems, system]
                      });
                    } else {
                      updateFormData('hvacData', {
                        ...formData.hvacData,
                        currentSystems: currentSystems.filter(s => s !== system)
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{system}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Building Construction - IMPORTANT */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Building Construction Type
            </label>
            <select
              value={formData.hvacData?.buildingConstruction || ''}
              onChange={(e) => updateFormData('hvacData', {
                ...formData.hvacData,
                buildingConstruction: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">Select construction type</option>
              {constructionTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ceiling Height (feet)
            </label>
            <input
              type="number"
              min="7"
              max="20"
              step="0.5"
              value={formData.hvacData?.ceilingHeight || ''}
              onChange={(e) => updateFormData('hvacData', {
                ...formData.hvacData,
                ceilingHeight: e.target.value
              })}
              placeholder="9"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Window Information */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of Windows
            </label>
            <input
              type="number"
              min="0"
              value={formData.hvacData?.windowCount || ''}
              onChange={(e) => updateFormData('hvacData', {
                ...formData.hvacData,
                windowCount: e.target.value
              })}
              placeholder="12"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Window Type
            </label>
            <select
              value={formData.hvacData?.windowType || ''}
              onChange={(e) => updateFormData('hvacData', {
                ...formData.hvacData,
                windowType: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">Select window type</option>
              {windowTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Insulation and Access */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Insulation Quality
            </label>
            <select
              value={formData.hvacData?.insulationQuality || ''}
              onChange={(e) => updateFormData('hvacData', {
                ...formData.hvacData,
                insulationQuality: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">Select insulation quality</option>
              {insulationQualities.map(quality => (
                <option key={quality.value} value={quality.value}>{quality.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ductwork Access
            </label>
            <select
              value={formData.hvacData?.ductworkAccess || ''}
              onChange={(e) => updateFormData('hvacData', {
                ...formData.hvacData,
                ductworkAccess: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">Select access type</option>
              {ductworkAccess.map(access => (
                <option key={access.value} value={access.value}>{access.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional: Current Utility Costs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Monthly Utility Costs (Optional)
          </label>
          <div className="relative">
            <span className="absolute left-3 top-3 text-gray-500">$</span>
            <input
              type="number"
              min="0"
              step="0.01"
              value={formData.hvacData?.currentUtilityCosts || ''}
              onChange={(e) => updateFormData('hvacData', {
                ...formData.hvacData,
                currentUtilityCosts: e.target.value
              })}
              placeholder="150"
              className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Average monthly heating/cooling costs help contractors understand system efficiency
          </p>
        </div>
      </div>
    );
  }

  function renderPlumbingDetails() {
    const pipeMaterials = [
      { value: 'copper', label: 'Copper' },
      { value: 'pvc', label: 'PVC' },
      { value: 'galvanized', label: 'Galvanized Steel' },
      { value: 'mixed', label: 'Mixed Materials' },
      { value: 'unknown', label: 'Unknown' }
    ];

    const waterHeaterTypes = [
      { value: 'gas', label: 'Gas' },
      { value: 'electric', label: 'Electric' },
      { value: 'tankless_gas', label: 'Tankless Gas' },
      { value: 'tankless_electric', label: 'Tankless Electric' },
      { value: 'solar', label: 'Solar' },
      { value: 'heat_pump', label: 'Heat Pump' }
    ];

    const fixtureQualities = [
      { value: 'basic', label: 'Basic/Builder Grade' },
      { value: 'standard', label: 'Standard' },
      { value: 'premium', label: 'Premium/High-End' }
    ];

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            🚿 Plumbing System Information
          </h4>
          <p className="text-sm text-blue-700">
            Help contractors understand your plumbing setup for accurate repair and replacement estimates.
          </p>
        </div>

        {/* Bathroom Details - CRITICAL */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Bathrooms *
            </label>
            <input
              type="number"
              min="0"
              value={formData.plumbingData?.fullBathrooms || ''}
              onChange={(e) => updateFormData('plumbingData', {
                ...formData.plumbingData,
                fullBathrooms: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Toilet + sink + shower/tub</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Half Bathrooms
            </label>
            <input
              type="number"
              min="0"
              value={formData.plumbingData?.halfBathrooms || ''}
              onChange={(e) => updateFormData('plumbingData', {
                ...formData.plumbingData,
                halfBathrooms: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">Toilet + sink only</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Kitchens *
            </label>
            <input
              type="number"
              min="1"
              value={formData.plumbingData?.kitchens || 1}
              onChange={(e) => updateFormData('plumbingData', {
                ...formData.plumbingData,
                kitchens: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Water System Details */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Existing Pipe Material
            </label>
            <select
              value={formData.plumbingData?.existingPipeMaterial || ''}
              onChange={(e) => updateFormData('plumbingData', {
                ...formData.plumbingData,
                existingPipeMaterial: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">Select pipe material</option>
              {pipeMaterials.map(material => (
                <option key={material.value} value={material.value}>{material.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Water Heater Type
            </label>
            <select
              value={formData.plumbingData?.waterHeaterType || ''}
              onChange={(e) => updateFormData('plumbingData', {
                ...formData.plumbingData,
                waterHeaterType: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">Select water heater type</option>
              {waterHeaterTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Water Heater Age and Access */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Water Heater Age (Years)
            </label>
            <input
              type="number"
              min="0"
              max="50"
              value={formData.plumbingData?.waterHeaterAge || ''}
              onChange={(e) => updateFormData('plumbingData', {
                ...formData.plumbingData,
                waterHeaterAge: e.target.value
              })}
              placeholder="5"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Fixture Quality
            </label>
            <select
              value={formData.plumbingData?.fixtureQuality || ''}
              onChange={(e) => updateFormData('plumbingData', {
                ...formData.plumbingData,
                fixtureQuality: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">Select fixture quality</option>
              {fixtureQualities.map(quality => (
                <option key={quality.value} value={quality.value}>{quality.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Access and Issues */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.plumbingData?.basementAccess || false}
                onChange={(e) => updateFormData('plumbingData', {
                  ...formData.plumbingData,
                  basementAccess: e.target.checked
                })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Basement Access</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.plumbingData?.crawlSpaceAccess || false}
                onChange={(e) => updateFormData('plumbingData', {
                  ...formData.plumbingData,
                  crawlSpaceAccess: e.target.checked
                })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Crawl Space Access</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.plumbingData?.waterPressureIssues || false}
                onChange={(e) => updateFormData('plumbingData', {
                  ...formData.plumbingData,
                  waterPressureIssues: e.target.checked
                })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Known Water Pressure Issues</span>
            </label>

            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.plumbingData?.washerDryerHookups || false}
                onChange={(e) => updateFormData('plumbingData', {
                  ...formData.plumbingData,
                  washerDryerHookups: e.target.checked
                })}
                className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">Washer/Dryer Hookups</span>
            </label>
          </div>
        </div>
      </div>
    );
  }

  function renderElectricalDetails() {
    const panelCapacities = [
      { value: '60', label: '60 Amps' },
      { value: '100', label: '100 Amps' },
      { value: '150', label: '150 Amps' },
      { value: '200', label: '200 Amps' },
      { value: '400', label: '400 Amps' }
    ];

    const majorAppliances = [
      'Electric Range/Oven',
      'Electric Dryer',
      'Central Air Conditioning',
      'Electric Water Heater',
      'Garbage Disposal',
      'Dishwasher',
      'Hot Tub/Spa',
      'Electric Vehicle Charger'
    ];

    const outdoorNeeds = [
      'Parking Lot Lighting',
      'Security Lighting',
      'Outdoor Outlets',
      'Landscape Lighting',
      'Pool Equipment',
      'Gate Motors'
    ];

    const smartFeatures = [
      'Smart Thermostat',
      'Smart Lighting',
      'Smart Outlets',
      'Security System',
      'Smart Locks',
      'Home Automation Hub'
    ];

    return (
      <div className="space-y-6">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            ⚡ Electrical System Information
          </h4>
          <p className="text-sm text-blue-700">
            Electrical system details help contractors provide accurate estimates for upgrades, repairs, and installations.
          </p>
        </div>

        {/* Electrical Panel - IMPORTANT */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Electrical Panel Capacity
            </label>
            <select
              value={formData.electricalData?.electricalPanelCapacity || ''}
              onChange={(e) => updateFormData('electricalData', {
                ...formData.electricalData,
                electricalPanelCapacity: e.target.value
              })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            >
              <option value="">Select panel capacity</option>
              {panelCapacities.map(capacity => (
                <option key={capacity.value} value={capacity.value}>{capacity.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Panel Age (Years)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.electricalData?.electricalPanelAge || ''}
              onChange={(e) => updateFormData('electricalData', {
                ...formData.electricalData,
                electricalPanelAge: e.target.value
              })}
              placeholder="15"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
            />
          </div>
        </div>

        {/* Major Appliances */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Major Electrical Appliances
          </label>
          <div className="grid grid-cols-2 gap-2">
            {majorAppliances.map(appliance => (
              <label key={appliance} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.electricalData?.majorAppliances?.includes(appliance) || false}
                  onChange={(e) => {
                    const currentAppliances = formData.electricalData?.majorAppliances || [];
                    if (e.target.checked) {
                      updateFormData('electricalData', {
                        ...formData.electricalData,
                        majorAppliances: [...currentAppliances, appliance]
                      });
                    } else {
                      updateFormData('electricalData', {
                        ...formData.electricalData,
                        majorAppliances: currentAppliances.filter(a => a !== appliance)
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{appliance}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Outdoor Electrical Needs */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Outdoor Electrical Needs
          </label>
          <div className="grid grid-cols-2 gap-2">
            {outdoorNeeds.map(need => (
              <label key={need} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.electricalData?.outdoorElectricalNeeds?.includes(need) || false}
                  onChange={(e) => {
                    const currentNeeds = formData.electricalData?.outdoorElectricalNeeds || [];
                    if (e.target.checked) {
                      updateFormData('electricalData', {
                        ...formData.electricalData,
                        outdoorElectricalNeeds: [...currentNeeds, need]
                      });
                    } else {
                      updateFormData('electricalData', {
                        ...formData.electricalData,
                        outdoorElectricalNeeds: currentNeeds.filter(n => n !== need)
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{need}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Smart Home Features */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Smart Home Features (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {smartFeatures.map(feature => (
              <label key={feature} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.electricalData?.smartHomeFeatures?.includes(feature) || false}
                  onChange={(e) => {
                    const currentFeatures = formData.electricalData?.smartHomeFeatures || [];
                    if (e.target.checked) {
                      updateFormData('electricalData', {
                        ...formData.electricalData,
                        smartHomeFeatures: [...currentFeatures, feature]
                      });
                    } else {
                      updateFormData('electricalData', {
                        ...formData.electricalData,
                        smartHomeFeatures: currentFeatures.filter(f => f !== feature)
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{feature}</span>
              </label>
            ))}
          </div>
        </div>

        {/* High Demand Facilities */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            High Electrical Demand Facilities
          </label>
          <div className="grid grid-cols-2 gap-2">
            {['Pool', 'Gym', 'Commercial Kitchen', 'Workshop', 'Server Room', 'Laundry Facility'].map(facility => (
              <label key={facility} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.electricalData?.highDemandFacilities?.includes(facility) || false}
                  onChange={(e) => {
                    const currentFacilities = formData.electricalData?.highDemandFacilities || [];
                    if (e.target.checked) {
                      updateFormData('electricalData', {
                        ...formData.electricalData,
                        highDemandFacilities: [...currentFacilities, facility]
                      });
                    } else {
                      updateFormData('electricalData', {
                        ...formData.electricalData,
                        highDemandFacilities: currentFacilities.filter(f => f !== facility)
                      });
                    }
                  }}
                  className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                />
                <span className="text-sm text-gray-700">{facility}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function renderInviteTenants() {
    const addEmailField = () => {
      updateFormData('tenantEmails', [...formData.tenantEmails, '']);
    };

    const removeEmailField = (index) => {
      const newEmails = formData.tenantEmails.filter((_, i) => i !== index);
      updateFormData('tenantEmails', newEmails.length > 0 ? newEmails : ['']);
    };

    const updateEmailField = (index, value) => {
      const newEmails = [...formData.tenantEmails];
      newEmails[index] = value;
      updateFormData('tenantEmails', newEmails);
    };

    const getStatusIcon = (email) => {
      const status = inviteStatus[email];
      switch (status) {
        case 'sending':
          return (
            <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          );
        case 'sent':
          return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
        case 'failed':
          return <XMarkIcon className="w-5 h-5 text-red-500" />;
        default:
          return null;
      }
    };

    return (
      <div className="space-y-6">
        {/* Header with property info */}
        {createdProperty && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              <h3 className="text-sm font-medium text-green-800">Property Created Successfully!</h3>
            </div>
            <p className="text-sm text-green-700 mt-1">
              <strong>{createdProperty.name}</strong> is ready. Now you can invite tenants.
            </p>
          </div>
        )}

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Invite Tenants (Optional)</h3>
          <p className="text-sm text-gray-600 mb-4">
            Send email invitations to potential tenants. They'll receive instructions to join your property on PropAgentic.
          </p>
        </div>

        {/* Skip option */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.skipInvites}
              onChange={(e) => updateFormData('skipInvites', e.target.checked)}
              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
            />
            <span className="text-sm font-medium text-blue-800">
              Skip invitations for now (you can send them later)
            </span>
          </label>
        </div>

        {!formData.skipInvites && (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Tenant Email Addresses
              </label>
              
              <div className="space-y-3">
                {formData.tenantEmails.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <div className="flex-1 relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                      </div>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => updateEmailField(index, e.target.value)}
                        placeholder="tenant@example.com"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                      />
                      {getStatusIcon(email) && (
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          {getStatusIcon(email)}
                        </div>
                      )}
                    </div>
                    
                    {formData.tenantEmails.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEmailField(index)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                        disabled={isSubmitting}
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addEmailField}
                disabled={isSubmitting}
                className="mt-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <PlusIcon className="w-4 h-4 mr-1" />
                Add Another Email
              </button>
            </div>

            {/* Preview of what will be sent */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-800 mb-2">What tenants will receive:</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Email invitation with property details</li>
                <li>• Unique invitation code to join your property</li>
                <li>• Instructions to create their PropAgentic account</li>
                <li>• Direct link to accept the invitation</li>
              </ul>
            </div>

            {/* Status summary */}
            {Object.keys(inviteStatus).length > 0 && (
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-gray-800 mb-3">Invitation Status:</h4>
                <div className="space-y-2">
                  {Object.entries(inviteStatus).map(([email, status]) => (
                    <div key={email} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{email}</span>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(email)}
                        <span className={`capitalize ${
                          status === 'sent' ? 'text-green-600' : 
                          status === 'failed' ? 'text-red-600' : 
                          'text-orange-600'
                        }`}>
                          {status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    );
  }
};

export default AddPropertyModal; 