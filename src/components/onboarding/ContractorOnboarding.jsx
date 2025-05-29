import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
        navigate('/contractor/dashboard');
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
    
    // Automatically proceed to submit the form when the final step is completed
    setTimeout(() => {
      handleSubmit({ preventDefault: () => {} });
    }, 500);
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
      
      // Redirect to contractor dashboard immediately
      navigate('/contractor/dashboard');
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      setError(`Error saving your information: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator with orange theme
  const ProgressIndicator = () => {
    return (
      <div className="mb-8 flex justify-center">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5, 6].map((step) => (
            <React.Fragment key={step}>
              <div 
                className={`rounded-full h-8 w-8 flex items-center justify-center border-2 text-sm font-medium
                  ${currentStep >= step 
                    ? 'border-orange-500 bg-orange-500 text-white' 
                    : 'border-gray-300 text-gray-400'}`}
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
                    ${currentStep > step ? 'bg-orange-500' : 'bg-gray-300'}`}
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
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Tell Us About Yourself</h3>
      <p className="text-gray-600 mb-6">
        This information will be displayed to landlords looking for contractors.
      </p>
      <div className="space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            id="firstName"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          />
        </div>
        <div>
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            id="lastName"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            required
            placeholder="(555) 123-4567"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          />
          <p className="mt-2 text-sm text-gray-500">
            Your phone number will be used by landlords to contact you about jobs.
          </p>
        </div>
      </div>
    </div>
  );

  // Step 2: Services & Availability (merged from steps 2, 3, 4, 5)
  const renderStep2 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Services & Availability</h3>
      <div className="space-y-8">
        {/* Business Information */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Business Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                Company/Business Name <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
            </div>
            <div>
              <label htmlFor="yearsExperience" className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience
              </label>
              <select
                id="yearsExperience"
                name="yearsExperience"
                value={formData.yearsExperience}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
              >
                <option value="0-2">0-2 years</option>
                <option value="3-5">3-5 years</option>
                <option value="5-10">5-10 years</option>
                <option value="10-15">10-15 years</option>
                <option value="15+">15+ years</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
              Professional Bio
            </label>
            <textarea
              id="bio"
              name="bio"
              rows="4"
              value={formData.bio}
              onChange={handleChange}
              placeholder="Tell us about your experience, skills, and qualifications..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Services Offered */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Services Offered</h4>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Services You Provide
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-orange-50 p-6 rounded-lg border border-orange-200">
              {SERVICE_TYPES.map(service => (
                <div key={service.id} className="flex items-center">
                  <input
                    id={`service-${service.id}`}
                    name={`service-${service.id}`}
                    type="checkbox"
                    checked={formData.serviceTypes.includes(service.id)}
                    onChange={() => handleServiceTypeChange(service.id)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`service-${service.id}`} className="ml-3 text-sm font-medium text-gray-700">
                    {service.name}
                  </label>
                </div>
              ))}
            </div>
            {formData.serviceTypes.length === 0 && (
              <p className="mt-2 text-sm text-red-600">Please select at least one service.</p>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            <div>
              <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700 mb-2">
                Hourly Rate ($) <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                id="hourlyRate"
                name="hourlyRate"
                value={formData.hourlyRate}
                onChange={handleChange}
                placeholder="75"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
              <p className="mt-2 text-sm text-gray-500">Enter your standard hourly rate for general work.</p>
            </div>
            <div>
              <label htmlFor="serviceArea" className="block text-sm font-medium text-gray-700 mb-2">
                Service Area
              </label>
              <input
                type="text"
                id="serviceArea"
                name="serviceArea"
                value={formData.serviceArea}
                onChange={handleChange}
                required
                placeholder="e.g., San Francisco Bay Area, 30-mile radius of Chicago, etc."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
              <p className="mt-2 text-sm text-gray-500">Specify the geographic area where you're available to work.</p>
            </div>
          </div>
        </div>

        {/* Contact & Availability */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Contact & Availability</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50"
              />
              <p className="mt-2 text-sm text-gray-500">Email address cannot be changed.</p>
            </div>
            <div>
              <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700 mb-2">
                Preferred Contact Method
              </label>
              <select
                id="preferredContactMethod"
                name="preferredContactMethod"
                value={formData.preferredContactMethod}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50"
              >
                <option value="email">Email</option>
                <option value="phone">Phone</option>
                <option value="text">Text Message</option>
              </select>
            </div>
          </div>
          <div className="mt-6">
            <label htmlFor="availabilityNotes" className="block text-sm font-medium text-gray-700 mb-2">
              Availability
            </label>
            <textarea
              id="availabilityNotes"
              name="availabilityNotes"
              rows="4"
              value={formData.availabilityNotes}
              onChange={handleChange}
              placeholder="e.g., Available weekdays 8am-5pm, emergency services available 24/7"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
            />
          </div>
        </div>

        {/* Business Verification */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-lg font-medium text-gray-800 mb-4">Business Verification (Optional)</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="taxId" className="block text-sm font-medium text-gray-700 mb-2">
                Tax ID / EIN (optional)
              </label>
              <input
                type="text"
                id="taxId"
                name="taxId"
                value={formData.taxId}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
              <p className="mt-2 text-sm text-gray-500">
                This information is for verification purposes and will be kept secure.
              </p>
            </div>
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-gray-700 mb-2">
                Website (optional)
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                placeholder="https://yourbusiness.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
              />
            </div>
          </div>
          <div className="mt-6">
            <label htmlFor="insuranceInfo" className="block text-sm font-medium text-gray-700 mb-2">
              Insurance Information (optional)
            </label>
            <input
              type="text"
              id="insuranceInfo"
              name="insuranceInfo"
              value={formData.insuranceInfo}
              onChange={handleChange}
              placeholder="e.g., Liability Insurance Policy #12345"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
            />
          </div>
        </div>
      </div>
    </div>
  );

  // Step 3: W-9 Form Upload
  const renderStep3 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Tax Documentation</h3>
      <W9FormUpload onComplete={handleW9Upload} />
    </div>
  );

  // Step 4: Stripe Connect Onboarding
  const renderStep4 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment Account Setup</h3>
      <StripeOnboarding onComplete={handleStripeOnboardingComplete} />
    </div>
  );

  // Step 5: Bank Account Verification
  const renderStep5 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Bank Account Verification</h3>
      <BankAccountVerification onComplete={handleBankAccountComplete} />
    </div>
  );

  // Step 6: Payment Methods Setup
  const renderStep6 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Payment Methods</h3>
      <PaymentMethodsManager onComplete={handlePaymentMethodsComplete} />
        
      <div className="bg-gray-50 p-6 rounded-lg mt-6">
        <h4 className="text-base font-medium text-gray-900 mb-2">Almost Done!</h4>
        <p className="text-sm text-gray-700 mb-4">
          Complete the payment method setup above, and we'll automatically finalize your profile.
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
        
        {stepCompletion[6] && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm font-medium text-green-800">Setup Complete!</p>
                <p className="text-sm text-green-600">Finalizing your profile and redirecting to your dashboard...</p>
              </div>
            </div>
          </div>
        )}
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
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Orange gradient background matching login/signup pages */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 800px 600px at 20% 80%, rgba(251, 146, 60, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse 600px 800px at 80% 20%, rgba(249, 115, 22, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse 400px 600px at 60% 60%, rgba(245, 101, 101, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 500px 400px at 40% 40%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 700px 500px at 10% 10%, rgba(252, 211, 77, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #f97316 0%, #ea580c 100%)
            `
          }}
        />
        {/* Flowing curves overlay */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <path
            d="M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z"
            fill="url(#gradient1)"
            fillOpacity="0.1"
          />
          <path
            d="M0,500 Q400,350 800,500 T1200,500 L1200,800 L0,800 Z"
            fill="url(#gradient2)"
            fillOpacity="0.15"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* PropAgentic logo */}
      <div className="absolute top-8 left-8 z-20">
        <Link to="/" className="text-white text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          propagentic
        </Link>
      </div>

      {/* Back to Home link */}
      <div className="absolute top-8 right-8 z-20">
        <Link 
          to="/" 
          className="flex items-center text-white/90 hover:text-white font-medium transition-colors duration-200"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
          Back to Home
        </Link>
      </div>
      
      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-3xl">
          <div className="bg-white rounded-xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Contractor Onboarding</h1>
              <p className="text-gray-600">Complete all steps to start receiving job assignments and payments</p>
            </div>

            <ProgressIndicator />
            
            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in slide-in-from-top duration-300">
                {error}
              </div>
            )}
            
            {/* Step content */}
            <form onSubmit={currentStep === 6 ? handleSubmit : (e) => e.preventDefault()}>
              {renderStepContent()}
              
              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    disabled={currentStep === 6 && stepCompletion[6]}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}
                
                {currentStep < 6 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Processing...
                      </span>
                    ) : (
                      'Next'
                    )}
                  </button>
                ) : currentStep === 6 && !stepCompletion[6] ? (
                  <div className="text-sm text-gray-500 font-medium">
                    Complete payment setup above to finish
                  </div>
                ) : currentStep === 6 && stepCompletion[6] ? (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Finalizing Setup...
                      </span>
                    ) : (
                      '✅ Setup Complete'
                    )}
                  </button>
                ) : null}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorOnboarding; 