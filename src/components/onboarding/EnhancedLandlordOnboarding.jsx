import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building, User, CreditCard, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useOnboardingProgress } from '../../hooks/useOnboardingProgress';
import AutoSaveForm from './AutoSaveForm';
import ProgressRecoveryBanner from './ProgressRecoveryBanner';
import Button from '../ui/Button';

/**
 * Enhanced landlord onboarding with auto-save and progress recovery
 */
const EnhancedLandlordOnboarding = () => {
  const navigate = useNavigate();
  const { currentUser, completeOnboarding, updateUserProfile } = useAuth();
  const {
    progress,
    saveProgress,
    clearProgress,
    hasValidProgress,
    getProgressSummary,
    canResume
  } = useOnboardingProgress('landlord');

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Personal Information
    firstName: '',
    lastName: '',
    phoneNumber: '',
    companyName: '',
    
    // Step 2: Property Information
    primaryPropertyType: '',
    numberOfProperties: '',
    averageUnits: '',
    managementExperience: '',
    
    // Step 3: Business Information
    businessType: 'individual', // individual, llc, corporation
    taxId: '',
    businessAddress: '',
    
    // Step 4: Preferences
    communicationPreferences: {
      email: true,
      sms: false,
      phone: false
    },
    maintenanceCategories: [],
    budget: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);

  // Steps configuration
  const steps = [
    {
      id: 1,
      title: 'Personal Information',
      icon: User,
      description: 'Tell us about yourself'
    },
    {
      id: 2,
      title: 'Property Portfolio',
      icon: Building,
      description: 'Your properties and experience'
    },
    {
      id: 3,
      title: 'Business Information',
      icon: CreditCard,
      description: 'Business structure and details'
    },
    {
      id: 4,
      title: 'Preferences',
      icon: CheckCircle,
      description: 'Communication and service preferences'
    }
  ];

  // Load progress on mount
  useEffect(() => {
    if (canResume && hasValidProgress()) {
      setShowRecovery(true);
    }
  }, [canResume, hasValidProgress]);

  // Handle progress recovery
  const handleRestoreProgress = () => {
    if (progress && progress.formData) {
      setFormData(prev => ({
        ...prev,
        ...progress.formData
      }));
      setCurrentStep(progress.currentStep);
      setShowRecovery(false);
    }
  };

  const handleDiscardProgress = () => {
    clearProgress();
    setShowRecovery(false);
  };

  // Handle form data changes
  const updateFormData = (field, value) => {
    const newFormData = {
      ...formData,
      [field]: value
    };
    setFormData(newFormData);
    
    // Auto-save progress
    saveProgress(currentStep, newFormData, {
      lastUpdatedField: field,
      stepTitle: steps[currentStep - 1]?.title
    });
  };

  // Handle nested field updates
  const updateNestedFormData = (parentField, childField, value) => {
    const newFormData = {
      ...formData,
      [parentField]: {
        ...formData[parentField],
        [childField]: value
      }
    };
    setFormData(newFormData);
    saveProgress(currentStep, newFormData);
  };

  // Validate current step
  const validateStep = (step) => {
    switch (step) {
      case 1:
        return formData.firstName && formData.lastName && formData.phoneNumber;
      case 2:
        return formData.primaryPropertyType && formData.numberOfProperties;
      case 3:
        return formData.businessType;
      case 4:
        return true; // Preferences are optional
      default:
        return false;
    }
  };

  // Handle step navigation
  const nextStep = () => {
    if (currentStep < 4 && validateStep(currentStep)) {
      const newStep = currentStep + 1;
      setCurrentStep(newStep);
      saveProgress(newStep, formData);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const newStep = currentStep - 1;
      setCurrentStep(newStep);
      saveProgress(newStep, formData);
    }
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    setIsSubmitting(true);
    try {
      // Update user profile with onboarding data
      await updateUserProfile(currentUser.uid, {
        ...formData,
        onboardingComplete: true,
        userType: 'landlord',
        role: 'landlord'
      });

      // Clear progress since onboarding is complete
      await clearProgress();

      // Navigate to dashboard
      navigate('/landlord/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      alert('Failed to complete onboarding. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render step 1: Personal Information
  const renderStep1 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Let's start with some basic information about you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName}
            onChange={(e) => updateFormData('firstName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your first name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName}
            onChange={(e) => updateFormData('lastName', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Enter your last name"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          value={formData.phoneNumber}
          onChange={(e) => updateFormData('phoneNumber', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Company Name (optional)
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => updateFormData('companyName', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="Your property management company"
        />
      </div>
    </div>
  );

  // Render step 2: Property Portfolio
  const renderStep2 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Property Portfolio</h3>
        <p className="text-sm text-gray-600 mb-6">
          Tell us about your properties and management experience.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Primary Property Type *
        </label>
        <select
          value={formData.primaryPropertyType}
          onChange={(e) => updateFormData('primaryPropertyType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select property type</option>
          <option value="single-family">Single Family Homes</option>
          <option value="multi-family">Multi-Family Properties</option>
          <option value="apartment">Apartment Buildings</option>
          <option value="condo">Condominiums</option>
          <option value="commercial">Commercial Properties</option>
          <option value="mixed">Mixed Use</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Properties *
          </label>
          <select
            value={formData.numberOfProperties}
            onChange={(e) => updateFormData('numberOfProperties', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Select range</option>
            <option value="1">1 property</option>
            <option value="2-5">2-5 properties</option>
            <option value="6-10">6-10 properties</option>
            <option value="11-25">11-25 properties</option>
            <option value="25+">25+ properties</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Average Units per Property
          </label>
          <input
            type="number"
            value={formData.averageUnits}
            onChange={(e) => updateFormData('averageUnits', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., 4"
            min="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Management Experience
        </label>
        <select
          value={formData.managementExperience}
          onChange={(e) => updateFormData('managementExperience', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select experience level</option>
          <option value="new">New to property management</option>
          <option value="1-2">1-2 years</option>
          <option value="3-5">3-5 years</option>
          <option value="6-10">6-10 years</option>
          <option value="10+">10+ years</option>
        </select>
      </div>
    </div>
  );

  // Render step 3: Business Information
  const renderStep3 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Business Information</h3>
        <p className="text-sm text-gray-600 mb-6">
          Help us understand your business structure for proper documentation and compliance.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Type *
        </label>
        <div className="space-y-2">
          {[
            { value: 'individual', label: 'Individual Owner' },
            { value: 'llc', label: 'LLC' },
            { value: 'corporation', label: 'Corporation' },
            { value: 'partnership', label: 'Partnership' }
          ].map((type) => (
            <label key={type.value} className="flex items-center">
              <input
                type="radio"
                name="businessType"
                value={type.value}
                checked={formData.businessType === type.value}
                onChange={(e) => updateFormData('businessType', e.target.value)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">{type.label}</span>
            </label>
          ))}
        </div>
      </div>

      {formData.businessType !== 'individual' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tax ID / EIN
          </label>
          <input
            type="text"
            value={formData.taxId}
            onChange={(e) => updateFormData('taxId', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="XX-XXXXXXX"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Address
        </label>
        <textarea
          value={formData.businessAddress}
          onChange={(e) => updateFormData('businessAddress', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          rows={3}
          placeholder="Enter your business address"
        />
      </div>
    </div>
  );

  // Render step 4: Preferences
  const renderStep4 = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
        <p className="text-sm text-gray-600 mb-6">
          Set your communication preferences and maintenance priorities.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Communication Preferences
        </label>
        <div className="space-y-2">
          {[
            { key: 'email', label: 'Email notifications' },
            { key: 'sms', label: 'SMS notifications' },
            { key: 'phone', label: 'Phone calls' }
          ].map((pref) => (
            <label key={pref.key} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.communicationPreferences[pref.key]}
                onChange={(e) => updateNestedFormData('communicationPreferences', pref.key, e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">{pref.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Maintenance Categories of Interest
        </label>
        <div className="grid grid-cols-2 gap-2">
          {[
            'Plumbing', 'Electrical', 'HVAC', 'Appliances',
            'Flooring', 'Painting', 'Landscaping', 'Roofing'
          ].map((category) => (
            <label key={category} className="flex items-center">
              <input
                type="checkbox"
                checked={formData.maintenanceCategories.includes(category)}
                onChange={(e) => {
                  const newCategories = e.target.checked
                    ? [...formData.maintenanceCategories, category]
                    : formData.maintenanceCategories.filter(c => c !== category);
                  updateFormData('maintenanceCategories', newCategories);
                }}
                className="mr-2"
              />
              <span className="text-sm text-gray-700">{category}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Typical Maintenance Budget (monthly)
        </label>
        <select
          value={formData.budget}
          onChange={(e) => updateFormData('budget', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select budget range</option>
          <option value="under-500">Under $500</option>
          <option value="500-1000">$500 - $1,000</option>
          <option value="1000-2500">$1,000 - $2,500</option>
          <option value="2500-5000">$2,500 - $5,000</option>
          <option value="5000+">$5,000+</option>
        </select>
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Recovery banner */}
        {showRecovery && (
          <ProgressRecoveryBanner
            progressSummary={getProgressSummary()}
            onRestore={handleRestoreProgress}
            onDiscard={handleDiscardProgress}
          />
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to PropAgentic</h1>
          <p className="mt-2 text-lg text-gray-600">
            Let's get your property management setup complete
          </p>
        </div>

        {/* Progress indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isCompleted = currentStep > step.id;
              const isCurrent = currentStep === step.id;
              
              return (
                <div key={step.id} className="flex flex-col items-center flex-1">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                    isCurrent ? 'border-blue-500 bg-blue-500 text-white' :
                    isCompleted ? 'border-green-500 bg-green-500 text-white' :
                    'border-gray-300 text-gray-400'
                  }`}>
                    <StepIcon className="h-5 w-5" />
                  </div>
                  <div className="mt-2 text-center">
                    <p className={`text-sm font-medium ${
                      isCurrent ? 'text-blue-600' :
                      isCompleted ? 'text-green-600' :
                      'text-gray-500'
                    }`}>
                      {step.title}
                    </p>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`absolute top-5 w-full h-0.5 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-300'
                    }`} style={{ left: '50%', width: 'calc(100% - 2.5rem)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form content with auto-save */}
        <div className="bg-white rounded-lg shadow p-6">
          <AutoSaveForm
            formData={formData}
            onSave={(data) => saveProgress(currentStep, data)}
            showSaveIndicator={true}
          >
            {renderStepContent()}
          </AutoSaveForm>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            <Button
              onClick={prevStep}
              variant="outline"
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            <div className="flex space-x-3">
              {currentStep < 4 ? (
                <Button
                  onClick={nextStep}
                  disabled={!validateStep(currentStep)}
                >
                  Next Step
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={!validateStep(4) || isSubmitting}
                >
                  {isSubmitting ? 'Completing...' : 'Complete Setup'}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnhancedLandlordOnboarding; 