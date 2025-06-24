import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import HomeNavLink from '../layout/HomeNavLink';

const TenantOnboardingPage = () => {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  
  // Form state aligned with tenantSchema.ts
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    personalInfo: {
      firstName: '',
      lastName: '',
      phone: '',
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: '',
    },
    preferences: {
      notifications: {
        email: true,
        push: true,
        sms: false,
      },
      contactPreference: 'email',
    },
    // Add other fields as needed, e.g., moveInDate
  });

  // Redirect if user is not authenticated
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (userProfile?.onboardingComplete) {
      navigate('/tenant/dashboard');
    }
  }, [currentUser, userProfile, navigate]);

  // Handle input changes for nested state
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const [section, field, subField] = name.split('.');

    const newValue = type === 'checkbox' ? checked : value;

    setFormData(prev => {
      if (subField) { // e.g., preferences.notifications.email
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: {
              ...prev[section][field],
              [subField]: newValue,
            },
          },
        };
      } else { // e.g., personalInfo.firstName
        return {
          ...prev,
          [section]: {
            ...prev[section],
            [field]: newValue,
          },
        };
      }
    });
  };

  // Navigate to next step
  const handleNext = () => {
    setCurrentStep(prev => prev + 1);
  };

  // Navigate to previous step
  const handleBack = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Submit form to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;
    setLoading(true);
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      const userDataToUpdate = {
        name: `${formData.personalInfo.firstName} ${formData.personalInfo.lastName}`,
        phone: formData.personalInfo.phone,
        onboardingComplete: true,
        profileComplete: true, // Assuming this form makes the profile complete
        tenantProfile: {
          tenantId: currentUser.uid,
          emergencyContact: formData.emergencyContact,
          // Add other profile fields here
        },
        preferences: {
          ...userProfile?.preferences,
          ...formData.preferences,
        },
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(userDocRef, userDataToUpdate, { merge: true });
      await fetchUserProfile(currentUser.uid);
      
      navigate('/tenant/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      alert('Failed to save your information. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const ProgressIndicator = () => (
    <div className="mb-8 flex justify-center">
      <div className="flex items-center">
        {[1, 2, 3, 4].map((step) => (
          <React.Fragment key={step}>
            <div 
              className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${
                currentStep >= step 
                  ? 'border-teal-500 bg-teal-500 text-white' 
                  : 'border-gray-300 text-gray-300'
              }`}
            >
              {currentStep > step ? '✓' : step}
            </div>
            {step < 4 && (
              <div className={`w-10 h-1 mx-1 ${currentStep > step ? 'bg-teal-500' : 'bg-gray-300'}`} />
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="personalInfo.firstName" className="block text-sm font-medium text-gray-700">First Name</label>
          <input type="text" id="personalInfo.firstName" name="personalInfo.firstName" value={formData.personalInfo.firstName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
        </div>
        <div>
          <label htmlFor="personalInfo.lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
          <input type="text" id="personalInfo.lastName" name="personalInfo.lastName" value={formData.personalInfo.lastName} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
        </div>
        <div>
          <label htmlFor="personalInfo.phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" id="personalInfo.phone" name="personalInfo.phone" value={formData.personalInfo.phone} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Emergency Contact</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="emergencyContact.name" className="block text-sm font-medium text-gray-700">Full Name</label>
          <input type="text" id="emergencyContact.name" name="emergencyContact.name" value={formData.emergencyContact.name} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
        </div>
        <div>
          <label htmlFor="emergencyContact.phone" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input type="tel" id="emergencyContact.phone" name="emergencyContact.phone" value={formData.emergencyContact.phone} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
        </div>
        <div>
          <label htmlFor="emergencyContact.relationship" className="block text-sm font-medium text-gray-700">Relationship</label>
          <input type="text" id="emergencyContact.relationship" name="emergencyContact.relationship" value={formData.emergencyContact.relationship} onChange={handleChange} required className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="preferences.contactPreference" className="block text-sm font-medium text-gray-700">Preferred Contact Method</label>
          <select id="preferences.contactPreference" name="preferences.contactPreference" value={formData.preferences.contactPreference} onChange={handleChange} className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500">
            <option value="email">Email</option>
            <option value="phone">Phone Call</option>
            <option value="text">Text Message</option>
          </select>
        </div>
        <fieldset>
          <legend className="text-sm font-medium text-gray-700">Notification Types</legend>
          <div className="mt-2 space-y-2">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input id="preferences.notifications.email" name="preferences.notifications.email" type="checkbox" checked={formData.preferences.notifications.email} onChange={handleChange} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 rounded" />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="preferences.notifications.email" className="font-medium text-gray-700">Email</label>
                <p className="text-gray-500">Get important notifications by email.</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input id="preferences.notifications.push" name="preferences.notifications.push" type="checkbox" checked={formData.preferences.notifications.push} onChange={handleChange} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 rounded" />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="preferences.notifications.push" className="font-medium text-gray-700">Push Notifications</label>
                <p className="text-gray-500">Get notifications on your mobile device.</p>
              </div>
            </div>
             <div className="flex items-start">
              <div className="flex items-center h-5">
                <input id="preferences.notifications.sms" name="preferences.notifications.sms" type="checkbox" checked={formData.preferences.notifications.sms} onChange={handleChange} className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 rounded" />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="preferences.notifications.sms" className="font-medium text-gray-700">Text Messages (SMS)</label>
                <p className="text-gray-500">Get critical alerts via text.</p>
              </div>
            </div>
          </div>
        </fieldset>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Review and Complete</h3>
      <div className="space-y-3 p-4 bg-gray-50 rounded-lg border">
        <div>
          <h4 className="font-medium text-gray-800">Personal Info</h4>
          <p className="text-sm text-gray-600">Name: {formData.personalInfo.firstName} {formData.personalInfo.lastName}</p>
          <p className="text-sm text-gray-600">Phone: {formData.personalInfo.phone}</p>
        </div>
        <div>
          <h4 className="font-medium text-gray-800">Emergency Contact</h4>
          <p className="text-sm text-gray-600">Name: {formData.emergencyContact.name}</p>
          <p className="text-sm text-gray-600">Phone: {formData.emergencyContact.phone}</p>
          <p className="text-sm text-gray-600">Relationship: {formData.emergencyContact.relationship}</p>
        </div>
         <div>
          <h4 className="font-medium text-gray-800">Preferences</h4>
          <p className="text-sm text-gray-600">Contact Method: {formData.preferences.contactPreference}</p>
        </div>
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

   const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return formData.personalInfo.firstName && formData.personalInfo.lastName && formData.personalInfo.phone;
      case 2:
        return formData.emergencyContact.name && formData.emergencyContact.phone && formData.emergencyContact.relationship;
      case 3:
        return true; // Preferences are optional
      case 4:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-end mb-2">
          <HomeNavLink showOnAuth={true} />
        </div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Complete Your Profile</h2>
          <p className="mt-2 text-sm text-gray-600">
            A few more details to get you set up.
          </p>
        </div>

        <ProgressIndicator />
        
        <form onSubmit={handleSubmit}>
          {renderStepContent()}
          
          <div className="mt-8 flex justify-between items-center">
            <div>
            {currentStep > 1 && (
              <button
                type="button"
                onClick={handleBack}
                className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Back
              </button>
            )}
            </div>
            
            <div>
            {currentStep < 4 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isStepValid() 
                    ? 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500' 
                    : 'bg-teal-300 cursor-not-allowed'
                }`}
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TenantOnboardingPage; 