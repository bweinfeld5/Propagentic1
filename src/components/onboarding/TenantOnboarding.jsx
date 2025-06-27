import React, { useState } from 'react';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { UserIcon, HomeIcon, PhoneIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const TenantOnboarding = () => {
  const { currentUser, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    preferences: {
      communicationMethod: 'email',
      maintenanceNotifications: true,
      paymentReminders: true
    }
  });
  
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 3;

  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    
    try {
      const displayName = `${formData.firstName} ${formData.lastName}`.trim();
      
      // Update Firebase Auth profile
      await updateProfile(currentUser, { displayName });
      
      // Update Firestore user document
      await updateDoc(doc(db, 'users', currentUser.uid), {
        firstName: formData.firstName,
        lastName: formData.lastName,
        displayName,
        phoneNumber: formData.phoneNumber,
        onboardingComplete: true,
        profileComplete: true,
        updatedAt: new Date().toISOString()
      });
      
      // Create tenant profile
      await setDoc(doc(db, 'tenantProfiles', currentUser.uid), {
        ...formData,
        fullName: displayName,
        tenantId: currentUser.uid,
        email: currentUser.email,
        createdAt: new Date().toISOString(),
        properties: [],
        maintenanceRequests: [],
        profileCompletionPercentage: 100
      }, { merge: true });
      
      // Refresh the user profile to ensure AuthContext has the latest data
      if (fetchUserProfile) {
        await fetchUserProfile(currentUser.uid);
      }
      
      toast.success('Welcome to PropAgentic! Your profile is complete.');
      
      // Small delay to ensure all updates are processed
      setTimeout(() => {
        navigate('/tenant/dashboard');
      }, 500);
      
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Failed to complete setup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <UserIcon className="w-16 h-16 mx-auto text-blue-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Personal Information</h2>
              <p className="text-gray-600">Let's start with the basics</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Name *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="John"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Last Name *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Doe"
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
                onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="(555) 123-4567"
              />
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-blue-800">
                <strong>Pre-filled:</strong> Your email ({currentUser?.email}) is already set up from registration.
              </p>
            </div>
          </div>
        );
        
      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <PhoneIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Emergency Contact</h2>
              <p className="text-gray-600">Who should we contact in case of emergency?</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Emergency Contact Name
              </label>
              <input
                type="text"
                value={formData.emergencyContact.name}
                onChange={(e) => handleInputChange('emergencyContact.name', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Emergency contact's full name"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Emergency Contact Phone
                </label>
                <input
                  type="tel"
                  value={formData.emergencyContact.phone}
                  onChange={(e) => handleInputChange('emergencyContact.phone', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relationship
                </label>
                <select
                  value={formData.emergencyContact.relationship}
                  onChange={(e) => handleInputChange('emergencyContact.relationship', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select relationship</option>
                  <option value="spouse">Spouse</option>
                  <option value="parent">Parent</option>
                  <option value="sibling">Sibling</option>
                  <option value="child">Child</option>
                  <option value="friend">Friend</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
          </div>
        );
        
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <HomeIcon className="w-16 h-16 mx-auto text-purple-500 mb-4" />
              <h2 className="text-2xl font-bold text-gray-900">Communication Preferences</h2>
              <p className="text-gray-600">How would you like to receive updates?</p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Preferred Communication Method
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { value: 'email', label: 'Email' },
                  { value: 'sms', label: 'Text Message' },
                  { value: 'both', label: 'Email & SMS' }
                ].map((method) => (
                  <div key={method.value}>
                    <input
                      type="radio"
                      id={`comm-${method.value}`}
                      name="communicationMethod"
                      value={method.value}
                      checked={formData.preferences.communicationMethod === method.value}
                      onChange={(e) => handleInputChange('preferences.communicationMethod', e.target.value)}
                      className="sr-only"
                    />
                    <label
                      htmlFor={`comm-${method.value}`}
                      className={`block w-full py-3 px-4 text-center rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                        formData.preferences.communicationMethod === method.value
                          ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                          : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {method.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="space-y-4">
              <label className="block text-sm font-medium text-gray-700">
                Notification Preferences
              </label>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    id="maintenance-notifications"
                    type="checkbox"
                    checked={formData.preferences.maintenanceNotifications}
                    onChange={(e) => handleInputChange('preferences.maintenanceNotifications', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="maintenance-notifications" className="ml-3 text-sm text-gray-700">
                    Maintenance request updates
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    id="payment-reminders"
                    type="checkbox"
                    checked={formData.preferences.paymentReminders}
                    onChange={(e) => handleInputChange('preferences.paymentReminders', e.target.checked)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="payment-reminders" className="ml-3 text-sm text-gray-700">
                    Payment reminders and receipts
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.firstName && formData.lastName && formData.phoneNumber;
      case 2:
        return true; // Emergency contact is optional
      case 3:
        return true; // Preferences have defaults
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Step {currentStep} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to PropAgentic!</h1>
          <p className="text-gray-600">Let's set up your tenant profile</p>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <button
            onClick={handlePrevStep}
            disabled={currentStep === 1}
            className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
              currentStep === 1
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Previous
          </button>

          {currentStep === totalSteps ? (
            <button
              onClick={handleSubmit}
              disabled={loading || !isStepValid()}
              className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 ${
                loading || !isStepValid()
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {loading ? 'Setting up...' : 'Complete Setup'}
            </button>
          ) : (
            <button
              onClick={handleNextStep}
              disabled={!isStepValid()}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                !isStepValid()
                  ? 'bg-blue-400 text-white cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              Next
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantOnboarding; 