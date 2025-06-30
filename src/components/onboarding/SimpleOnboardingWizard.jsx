import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import standardizedOnboardingService from '../../services/standardizedOnboardingService';

/**
 * Simple OnboardingWizard - Essential reusable component
 * Handles step navigation, validation, and form submission
 */
const SimpleOnboardingWizard = ({
  userType,
  steps,
  initialFormData,
  theme = 'blue',
  title = 'Welcome to PropAgentic!',
  subtitle = 'Let\'s set up your profile'
}) => {
  const { currentUser, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  // Essential state only
  const [formData, setFormData] = useState(initialFormData);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    }
  }, [currentUser, navigate]);

  // Handle form data changes
  const handleFormDataChange = (updates) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  // Validate current step
  const validateCurrentStep = () => {
    const currentStepConfig = steps[currentStep - 1];
    if (currentStepConfig?.validation) {
      const result = currentStepConfig.validation(formData);
      if (!result.isValid) {
        setError(result.error);
        return false;
      }
    }
    setError('');
    return true;
  };

  // Navigate to next step
  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to previous step
  const handlePrevious = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  // Handle form submission
  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    const success = await standardizedOnboardingService.completeOnboarding({
      userType,
      currentUser,
      formData,
      fetchUserProfile,
      navigate,
      setLoading,
      setError
    });

    if (success) {
      console.log(`${userType} onboarding completed successfully`);
    }
  };

  // Render current step
  const renderCurrentStep = () => {
    const currentStepConfig = steps[currentStep - 1];
    if (!currentStepConfig) return null;

    const StepComponent = currentStepConfig.component;
    return (
      <StepComponent
        formData={formData}
        onChange={handleFormDataChange}
        currentUser={currentUser}
      />
    );
  };

  // Theme configurations
  const themeConfig = {
    blue: {
      background: 'bg-gradient-to-br from-blue-50 to-indigo-100',
      progressBar: 'bg-blue-600',
      primaryButton: 'bg-blue-600 hover:bg-blue-700',
      primaryButtonDisabled: 'bg-blue-400'
    },
    orange: {
      background: 'bg-gradient-to-br from-orange-50 to-red-100',
      progressBar: 'bg-gradient-to-r from-orange-600 to-red-600',
      primaryButton: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
      primaryButtonDisabled: 'bg-orange-400'
    }
  };

  const currentTheme = themeConfig[theme] || themeConfig.blue;

  return (
    <div className={`min-h-screen ${currentTheme.background} flex items-center justify-center p-4`}>
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* Simple Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-500 mb-2">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`${currentTheme.progressBar} h-2 rounded-full transition-all duration-300`}
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
          <p className="text-gray-600">{subtitle}</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-700">{error}</div>
          </div>
        )}

        {/* Step Content */}
        <div className="mb-8">
          {renderCurrentStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>

          {currentStep === steps.length ? (
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 text-white ${
                loading
                  ? `${currentTheme.primaryButtonDisabled} cursor-not-allowed`
                  : currentTheme.primaryButton
              }`}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          ) : (
            <button
              onClick={handleNext}
              className={`px-6 py-3 rounded-lg font-medium text-white transition-all duration-200 ${currentTheme.primaryButton}`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default SimpleOnboardingWizard; 