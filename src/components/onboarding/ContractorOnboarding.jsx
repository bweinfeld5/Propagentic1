import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import HomeNavLink from '../layout/HomeNavLink';
// Import payment components
import W9FormUpload from '../payments/W9FormUpload';
import StripeOnboarding from '../payments/StripeOnboarding';
import BankAccountVerification from '../payments/BankAccountVerification';
import PaymentMethodsManager from '../payments/PaymentMethodsManager';

// Service types for contractors
const SERVICE_TYPES = [
  { id: 'plumbing', name: 'Plumbing' },
  { id: 'electrical', name: 'Electrical' },
  { id: 'hvac', name: 'HVAC/Climate Control' },
  { id: 'carpentry', name: 'Carpentry/Woodwork' },
  { id: 'roofing', name: 'Roofing' },
  { id: 'landscaping', name: 'Landscaping/Grounds' },
  { id: 'painting', name: 'Painting' },
  { id: 'flooring', name: 'Flooring' },
  { id: 'appliance', name: 'Appliance Repair' },
  { id: 'general', name: 'General Handyman' }
];

const ContractorOnboarding = () => {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Personal Info
    firstName: '',
    lastName: '',
    phoneNumber: '',
    // Business Info - merged with services
    companyName: '',
    yearsExperience: '0-2',
    bio: '',
    // Service Info
    serviceTypes: [],
    hourlyRate: '',
    serviceArea: '',
    // Contact & Availability
    email: '',
    preferredContactMethod: 'email',
    availabilityNotes: '',
    // Business Verification
    taxId: '',
    insuranceInfo: '',
    website: '',
    // Payment Data
    w9FormUrl: '',
    stripeAccountSetup: false,
    bankAccountVerified: false,
    paymentMethodsSetup: false,
  });

  // Step completion tracking
  const [stepCompletion, setStepCompletion] = useState({
    1: false, // Basic Information
    2: false, // Services & Availability
    3: false, // W-9 Form Upload
    4: false, // Stripe Connect Onboarding
    5: false, // Bank Account Verification
    6: false, // Payment Methods Setup
  });

  // Redirect if user is not authenticated or not a contractor
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
    } else if (userProfile) {
      if (userProfile.userType !== 'contractor') {
        // Redirect non-contractors
        navigate(`/${userProfile.userType || 'dashboard'}`);
      } else if (userProfile.onboardingComplete) {
        // Redirect contractors who have completed onboarding
        navigate('/contractor');
      }
      
      // Pre-fill email from profile
      setFormData(prev => ({
        ...prev,
        email: userProfile.email || currentUser.email || '',
        firstName: userProfile.firstName || '',
        lastName: userProfile.lastName || '',
        phoneNumber: userProfile.phoneNumber || '',
      }));
    }
  }, [currentUser, userProfile, navigate]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle checkbox changes for service types
  const handleServiceTypeChange = (serviceId) => {
    const newServiceTypes = [...formData.serviceTypes];
    
    if (newServiceTypes.includes(serviceId)) {
      // Remove if already selected
      const index = newServiceTypes.indexOf(serviceId);
      newServiceTypes.splice(index, 1);
    } else {
      // Add if not selected
      newServiceTypes.push(serviceId);
    }
    
    setFormData(prev => ({
      ...prev,
      serviceTypes: newServiceTypes
    }));
  };

  // Navigate to next step
  const handleNext = () => {
    if (validateStep()) {
      setError('');
      // Mark current step as complete
      setStepCompletion(prev => ({
        ...prev,
        [currentStep]: true
      }));
      setCurrentStep(prev => prev + 1);
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  // Validate current step
  const validateStep = () => {
    switch (currentStep) {
      case 1: // Basic Information
        if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
          setError('Please fill out all required fields: First Name, Last Name, and Phone Number.');
          return false;
        }
        break;
      case 2: // Services & Availability 
        if (formData.serviceTypes.length === 0) {
          setError('Please select at least one service type that you offer.');
          return false;
        }
        if (!formData.serviceArea) {
          setError('Please specify your service area (e.g., city, zip code radius).');
          return false;
        }
        // Validate hourly rate format if provided
        if (formData.hourlyRate && !/^\d+(\.\d{1,2})?$/.test(formData.hourlyRate)) {
          setError('Please enter a valid hourly rate (e.g., 75 or 75.50).');
          return false;
        }
        if (formData.bio && formData.bio.length > 1000) {
          setError('Professional bio is too long. Please keep it under 1000 characters.');
          return false;
        }
        // Validate website format if provided
        if (formData.website && !formData.website.startsWith('http')) {
          setError('Please enter a valid website URL starting with http:// or https://');
          return false;
        }
        break;
      case 3: // W-9 Form Upload
        console.log('[ContractorOnboarding] Validating step 3 - W9 URL:', formData.w9FormUrl);
        if (!formData.w9FormUrl) {
          console.log('[ContractorOnboarding] W9 validation failed - no URL found');
          setError('Please upload your W-9 form to continue.');
          return false;
        }
        console.log('[ContractorOnboarding] W9 validation passed');
        break;
      case 4: // Stripe Connect Onboarding
        if (!formData.stripeAccountSetup) {
          setError('Please complete the Stripe Connect onboarding to continue.');
          return false;
        }
        break;
      case 5: // Bank Account Verification
        if (!formData.bankAccountVerified) {
          setError('Please verify your bank account to continue.');
          return false;
        }
        break;
      case 6: // Payment Methods Setup
        // This is the final step, no validation needed here
        break;
      default:
        break;
    }
    return true;
  };

  // Handle W-9 form upload completion
  const handleW9Upload = (downloadUrl) => {
    console.log('[ContractorOnboarding] W9 upload completed with URL:', downloadUrl);
    setFormData(prev => {
      const updated = {
        ...prev,
        w9FormUrl: downloadUrl
      };
      console.log('[ContractorOnboarding] Updated form data:', updated);
      return updated;
    });
    setStepCompletion(prev => {
      const updated = {
        ...prev,
        3: true
      };
      console.log('[ContractorOnboarding] Updated step completion:', updated);
      return updated;
    });
    console.log('[ContractorOnboarding] W9 upload handling complete');
  };

  // Handle Stripe Connect onboarding completion
  const handleStripeOnboardingComplete = () => {
    setFormData(prev => ({
      ...prev,
      stripeAccountSetup: true
    }));
    setStepCompletion(prev => ({
      ...prev,
      4: true
    }));
  };

  // Handle bank account verification completion
  const handleBankAccountComplete = () => {
    setFormData(prev => ({
      ...prev,
      bankAccountVerified: true
    }));
    setStepCompletion(prev => ({
      ...prev,
      5: true
    }));
  };

  // Handle payment methods setup completion
  const handlePaymentMethodsComplete = () => {
    setFormData(prev => ({
      ...prev,
      paymentMethodsSetup: true
    }));
    setStepCompletion(prev => ({
      ...prev,
      6: true
    }));
  };

  // Submit form to Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!currentUser) return;
    
    setLoading(true);
    setError('');
    
    try {
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Use updateDoc to update the user document
      await updateDoc(userDocRef, {
        ...formData,
        onboardingComplete: true,
        name: `${formData.firstName} ${formData.lastName}`,
        userType: 'contractor', // Ensure userType is set
        updatedAt: serverTimestamp(),
        // Convert hourly rate to a number if it's a valid string
        hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : null,
      });
      
      // Refresh the user profile before redirecting
      await fetchUserProfile(currentUser.uid);
      
      console.log('Contractor onboarding complete, redirecting to dashboard');
      
      // Redirect to contractor dashboard
      navigate('/contractor');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setError(`Error saving your information: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator
  const ProgressIndicator = () => {
    return (
      <div className="mb-8 flex justify-center">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <React.Fragment key={step}>
              <div 
                className={`rounded-full h-8 w-8 flex items-center justify-center border-2 
                  ${currentStep >= step 
                    ? 'border-teal-500 bg-teal-500 text-white' 
                    : 'border-gray-300 text-gray-300'}`}
              >
                {stepCompletion[step] ? (
                  <svg className="h-4 w-4" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  step
                )}
              </div>
              {step < 6 && (
                <div 
                  className={`w-10 h-1 mx-1 
                    ${currentStep > step ? 'bg-teal-500' : 'bg-gray-300'}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  // Step 1: Basic Information
  const renderStep1 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Tell Us About Yourself</h3>
      <p className="text-sm text-gray-600 mb-4">
        This information will be displayed to landlords looking for contractors.
      </p>
      <div className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name * <span className="text-red-500">Required</span>
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
            Last Name * <span className="text-red-500">Required</span>
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone Number * <span className="text-red-500">Required</span>
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            placeholder="e.g., (555) 123-4567"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
          <p className="mt-1 text-xs text-gray-500">
            Your phone number will be used by landlords to contact you about jobs.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 2: Services & Availability (merged from steps 2, 3, 4, 5)
  const renderStep2 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Services & Availability</h3>
      <div className="space-y-6">
        {/* Business Information */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="text-md font-medium text-gray-800 mb-3">Business Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">
                Company/Business Name (if applicable)
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700">
                Years of Experience
              </label>
              <select
                id="yearsExperience"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10-15">10-15 years</option>
                <option value="15+">15+ years</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700">
              Professional Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="3"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about your experience, skills, and qualifications..."
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Services Offered */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="text-md font-medium text-gray-800 mb-3">Services Offered</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Services You Provide * <span className="text-red-500">Required</span>
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 p-4 rounded-lg">
              {SERVICE_TYPES.map(service => (
                <div key={service.id} className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`service-${service.id}`}
                      name={`service-${service.id}`}
                      type="checkbox"
                      checked={formData.serviceTypes.includes(service.id)}
                      onChange={() => handleServiceTypeChange(service.id)}
                      className="focus:ring-teal-500 h-4 w-4 text-teal-600 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={`service-${service.id}`} className="font-medium text-gray-700">
                      {service.name}
                    </label>
                  </div>
                </div>
              ))}
            </div>
            {formData.serviceTypes.length === 0 && (
              <p className="mt-2 text-xs text-red-600">Please select at least one service.</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                Hourly Rate ($)
              </label>
              <input
                type="text"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                placeholder="e.g., 75"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="mt-1 text-xs text-gray-500">Enter your standard hourly rate for general work.</p>
            </div>
            <div>
              <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700">
                Service Area * <span className="text-red-500">Required</span>
              </label>
              <input
                type="text"
                id="serviceArea"
                name="serviceArea"
                value={formData.serviceArea}
                onChange={handleChange}
                required
                placeholder="e.g., San Francisco Bay Area, 30-mile radius of Chicago, etc."
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="mt-1 text-xs text-gray-500">Specify the geographic area where you're available to work.</p>
            </div>
          </div>
        </div>

        {/* Contact & Availability */}
        <div className="border-b border-gray-200 pb-4">
          <h4 className="text-md font-medium text-gray-800 mb-3">Contact & Availability</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 bg-gray-50 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="mt-1 text-xs text-gray-500">Email address cannot be changed.</p>
            </div>
            <div>
              <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700">
                Preferred Contact Method
              </label>
              <select
                id="preferredContactMethod"
                name="preferredContactMethod"
                value={formData.preferredContactMethod}
                onChange={handleChange}
                className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text Message</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="availabilityNotes" className="block text-sm font-medium text-gray-700">
              Availability
            </label>
            <textarea
              id="availabilityNotes"
              name="availabilityNotes"
              rows="3"
              value={formData.availabilityNotes}
              onChange={handleChange}
              placeholder="e.g., Available weekdays 8am-5pm, emergency services available 24/7"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>

        {/* Business Verification */}
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">Business Verification (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700">
                Tax ID / EIN (optional)
              </label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              />
              <p className="mt-1 text-xs text-gray-500">
                This information is for verification purposes and will be kept secure.
              </p>
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700">
                Website (optional)
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourbusiness.com"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="insuranceInfo" className="block text-sm font-medium text-gray-700">
              Insurance Information (optional)
            </label>
            <input
              type="text"
              id="insuranceInfo"
              name="insuranceInfo"
              value={formData.insuranceInfo}
              onChange={handleChange}
              placeholder="e.g., Liability Insurance Policy #12345"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: W-9 Form Upload
  const renderStep3 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Tax Documentation</h3>
      <W9FormUpload onComplete={handleW9Upload} />
    </div>
  );

  // Step 4: Stripe Connect Onboarding
  const renderStep4 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Account Setup</h3>
      <StripeOnboarding onComplete={handleStripeOnboardingComplete} />
    </div>
  );

  // Step 5: Bank Account Verification
  const renderStep5 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Bank Account Verification</h3>
      <BankAccountVerification onComplete={handleBankAccountComplete} />
    </div>
  );

  // Step 6: Payment Methods Setup
  const renderStep6 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Payment Methods</h3>
      <PaymentMethodsManager onComplete={handlePaymentMethodsComplete} />
      
      <div className="bg-gray-50 p-4 rounded-md mt-6">
        <h4 className="text-base font-medium text-gray-900 mb-2">Setup Complete!</h4>
        <p className="text-sm text-gray-700 mb-4">
          Congratulations! You've completed all the required steps to start receiving jobs and payments.
          Your profile will be displayed to landlords looking to hire contractors.
        </p>
        
        <div className="text-sm text-gray-700">
          <p className="font-medium">Services Selected:</p>
          <ul className="mt-1 list-disc list-inside pl-2">
            {formData.serviceTypes.map(serviceId => (
              <li key={serviceId}>
                {SERVICE_TYPES.find(s => s.id === serviceId)?.name || serviceId}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  // Render the appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderStep1();
      case 2:
        return renderStep2();
      case 3:
        return renderStep3();
      case 4:
        return renderStep4();
      case 5:
        return renderStep5();
      case 6:
        return renderStep6();
      default:
        return null;
    }
  };

  // Main render
  if (!currentUser) {
    return null; // Or a loading spinner
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-end mb-2">
          <HomeNavLink showOnAuth={true} />
        </div>
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Contractor Onboarding</h2>
          <p className="mt-2 text-sm text-gray-600">
            Complete all steps to start receiving job assignments and payments.
          </p>
        </div>

        <ProgressIndicator />
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={currentStep === 6 ? handleSubmit : (e) => e.preventDefault()}>
          {renderStepContent()}
          
          <div className="mt-8 flex justify-between">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
              >
                Back
              </button>
            ) : (
              <div></div> // Empty div to maintain layout with flex justify-between
            )}
            
            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                disabled={loading}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Next'}
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading || !Object.values(stepCompletion).every(Boolean)}
                className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Completing Setup...
                  </div>
                ) : (
                  'Complete Setup'
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractorOnboarding; 