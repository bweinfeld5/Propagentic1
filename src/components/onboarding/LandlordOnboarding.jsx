import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, updateDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import HomeNavLink from '../layout/HomeNavLink';

const LandlordOnboarding = () => {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    // Profile
    firstName: '',
    lastName: '',
    phoneNumber: '',
    businessName: '',
    preferredContactMethod: 'email',
    // Property
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    propertyType: 'Single-Family Home',
    numberOfUnits: 1,
    propertyNickname: '',
    monthlyRent: '',
    // Business
    yearsInBusiness: '1-5',
    totalProperties: '1',
    managementSoftware: 'None',
    // Tenant Invite
    tenantEmail: '',
  });

  // Redirect if not a landlord or already onboarded
  useEffect(() => {
    console.log('LandlordOnboarding - Mount State:', {
      currentUser: currentUser?.uid,
      userProfile,
      userType: userProfile?.userType,
      onboardingComplete: userProfile?.onboardingComplete,
      path: window.location.pathname
    });

    if (!currentUser) {
      console.log('LandlordOnboarding - No current user, redirecting to login');
      navigate('/login');
    } else if (!userProfile) {
      console.log('LandlordOnboarding - Waiting for user profile to load...');
      // Don't redirect, wait for profile to load
    } else if (userProfile.userType !== 'landlord') {
      console.log(`LandlordOnboarding - User is not a landlord (${userProfile.userType}), redirecting`);
      navigate(`/${userProfile.userType || 'dashboard'}`); // Redirect non-landlords
    } else if (userProfile.onboardingComplete) {
      console.log('LandlordOnboarding - Onboarding already complete, redirecting to dashboard');
      navigate('/landlord/dashboard'); // Updated path to match App.js routes
    } else {
      console.log('LandlordOnboarding - Ready to show onboarding UI');
    }
  }, [currentUser, userProfile, navigate]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    // Reset numberOfUnits if propertyType is not Multi-Family
    if (name === 'propertyType' && value !== 'Multi-Family Building') {
      setFormData(prev => ({ ...prev, numberOfUnits: 1 }));
    }
  };

  const handleNext = () => {
    if (validateStep()) {
      setError('');
      setCurrentStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setError('');
    setCurrentStep(prev => prev - 1);
  };

  const validateStep = () => {
    switch (currentStep) {
      case 1: // Profile
        if (!formData.firstName || !formData.lastName || !formData.phoneNumber) {
          setError('First Name, Last Name, and Phone Number are required.');
          return false;
        }
        break;
      case 2: // Property
        if (!formData.streetAddress || !formData.city || !formData.state || !formData.zipCode || !formData.propertyType) {
          setError('All property address fields and property type are required.');
          return false;
        }
        if (formData.propertyType === 'Multi-Family Building' && (!formData.numberOfUnits || formData.numberOfUnits < 1)) {
          setError('Number of units is required for Multi-Family buildings.');
          return false;
        }
        break;
      case 3: // Business Details
        // These are optional, no validation needed
        break;
      case 4: // Tenant Invite (optional)
        // Email validation if provided
        if (formData.tenantEmail && !formData.tenantEmail.includes('@')) {
          setError('Please enter a valid email address.');
          return false;
        }
        break;
      case 5: // Confirmation
        // Just confirmation, no validation needed
        break;
      default:
        break;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep()) return;

    if (!currentUser) {
      setError('Authentication error. Please log in again.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('Starting landlord onboarding submission for user:', currentUser.uid);
      
      // 1. Create Property Document
      const propertyData = {
        nickname: formData.propertyNickname || formData.streetAddress,
        streetAddress: formData.streetAddress,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        propertyType: formData.propertyType,
        numberOfUnits: formData.propertyType === 'Multi-Family Building' ? parseInt(formData.numberOfUnits, 10) : 1,
        monthlyRent: formData.monthlyRent ? parseFloat(formData.monthlyRent) : 0,
        landlordId: currentUser.uid,
        createdAt: serverTimestamp(),
        status: 'active',
        // Add invited tenant email if provided
        ...(formData.tenantEmail && { invitedTenantEmail: formData.tenantEmail })
      };
      const propertyRef = await addDoc(collection(db, 'properties'), propertyData);
      console.log('Property document created with ID: ', propertyRef.id);

      // 2. Update User Document
      const userDocRef = doc(db, 'users', currentUser.uid);
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`, // Add full name field for easier display
        phoneNumber: formData.phoneNumber,
        businessName: formData.businessName || '',
        preferredContactMethod: formData.preferredContactMethod,
        yearsInBusiness: formData.yearsInBusiness,
        totalProperties: formData.totalProperties,
        managementSoftware: formData.managementSoftware,
        userType: 'landlord', // Ensure userType is set to landlord
        onboardingComplete: true, // Mark onboarding as complete
        updatedAt: serverTimestamp(),
        properties: [propertyRef.id], // Add reference to the created property
      };
      
      console.log('Updating user document with data:', userData);
      await updateDoc(userDocRef, userData);
      console.log('User document updated successfully.');
      
      // TODO: Handle Tenant Invite logic if needed (e.g., send email, create invite record)
      if (formData.tenantEmail) {
        console.log(`Tenant invite email: ${formData.tenantEmail} for property ${propertyRef.id}`);
        // Implement actual invite sending/tracking here
      }

      // Refresh the user profile before redirecting
      const updatedProfile = await fetchUserProfile(currentUser.uid);
      console.log('Landlord onboarding complete, refreshed profile:', updatedProfile);
      
      // 3. Redirect to Landlord Dashboard
      console.log('Redirecting to landlord dashboard...');
      navigate('/landlord/dashboard');

    } catch (error) {
      console.error('Error during landlord onboarding submission:', error);
      setError(`Failed to complete setup: ${error.message}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator with orange theme
  const ProgressIndicator = () => {
    return (
      <div className="mb-8 flex justify-center">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((step) => (
            <React.Fragment key={step}>
              <div 
                className={`rounded-full h-8 w-8 flex items-center justify-center border-2 text-sm font-medium
                  ${currentStep >= step 
                    ? 'border-orange-500 bg-orange-500 text-white' 
                    : 'border-gray-300 text-gray-400'}`}
              >
                {step}
              </div>
              {step < 5 && (
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

  // --- Step Rendering Functions ---

  const renderStep1 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Your Profile</h3>
      <div className="space-y-6">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
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
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
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
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
          <input 
            type="tel" 
            id="phoneNumber" 
            name="phoneNumber" 
            value={formData.phoneNumber} 
            onChange={handleChange} 
            required 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200" 
          />
        </div>
        <div>
          <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700 mb-2">Preferred Contact Method</label>
          <select 
            id="preferredContactMethod" 
            name="preferredContactMethod" 
            value={formData.preferredContactMethod} 
            onChange={handleChange} 
            required 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-white"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="text">Text Message</option>
          </select>
        </div>
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700 mb-2">Business Name <span className="text-gray-400">(Optional)</span></label>
          <input 
            type="text" 
            id="businessName" 
            name="businessName" 
            value={formData.businessName} 
            onChange={handleChange} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200" 
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Add Your First Property</h3>
      <div className="space-y-6">
        <div>
          <label htmlFor="propertyNickname" className="block text-sm font-medium text-gray-700 mb-2">Property Nickname</label>
          <input 
            type="text" 
            id="propertyNickname" 
            name="propertyNickname" 
            value={formData.propertyNickname} 
            onChange={handleChange} 
            placeholder="e.g., Main Street House" 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          />
        </div>
        <div>
          <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700 mb-2">Street Address</label>
          <input 
            type="text" 
            id="streetAddress" 
            name="streetAddress" 
            value={formData.streetAddress} 
            onChange={handleChange} 
            required 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <input 
              type="text" 
              id="city" 
              name="city" 
              value={formData.city} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">State</label>
            <input 
              type="text" 
              id="state" 
              name="state" 
              value={formData.state} 
              onChange={handleChange} 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
            />
          </div>
        </div>
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700 mb-2">Zip Code</label>
          <input 
            type="text" 
            id="zipCode" 
            name="zipCode" 
            value={formData.zipCode} 
            onChange={handleChange} 
            required 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          />
        </div>
        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700 mb-2">Property Type</label>
          <select 
            name="propertyType" 
            id="propertyType" 
            value={formData.propertyType} 
            onChange={handleChange} 
            required 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50"
          >
            <option>Single-Family Home</option>
            <option>Multi-Family Building</option>
            <option>Commercial</option>
          </select>
        </div>
        {formData.propertyType === 'Multi-Family Building' && (
          <div>
            <label htmlFor="numberOfUnits" className="block text-sm font-medium text-gray-700 mb-2">Number of Units</label>
            <input 
              type="number" 
              id="numberOfUnits" 
              name="numberOfUnits" 
              value={formData.numberOfUnits} 
              onChange={handleChange} 
              min="1" 
              required 
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
            />
          </div>
        )}
        <div>
          <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700 mb-2">Monthly Rent/Unit ($)</label>
          <input 
            type="text" 
            id="monthlyRent" 
            name="monthlyRent" 
            value={formData.monthlyRent} 
            onChange={handleChange} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Business Details</h3>
      <div className="space-y-6">
        <div>
          <label htmlFor="yearsInBusiness" className="block text-sm font-medium text-gray-700 mb-2">Years in Business</label>
          <select 
            id="yearsInBusiness" 
            name="yearsInBusiness" 
            value={formData.yearsInBusiness} 
            onChange={handleChange} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50"
          >
            <option value="1-5">1-5 years</option>
            <option value="6-10">6-10 years</option>
            <option value="11-20">11-20 years</option>
            <option value="20+">20+ years</option>
          </select>
        </div>
        <div>
          <label htmlFor="totalProperties" className="block text-sm font-medium text-gray-700 mb-2">Total Properties</label>
          <select 
            id="totalProperties" 
            name="totalProperties" 
            value={formData.totalProperties} 
            onChange={handleChange} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num.toString()}>{num} {num === 1 ? 'property' : 'properties'}</option>
            ))}
            <option value="20+">20+ properties</option>
          </select>
        </div>
        <div>
          <label htmlFor="managementSoftware" className="block text-sm font-medium text-gray-700 mb-2">Management Software</label>
          <select 
            id="managementSoftware" 
            name="managementSoftware" 
            value={formData.managementSoftware} 
            onChange={handleChange} 
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 bg-gray-50"
          >
            <option value="None">None</option>
            <option value="Property Management Software">Property Management Software</option>
            <option value="Custom Software">Custom Software</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Invite a Tenant <span className="text-gray-400">(Optional)</span></h3>
      <p className="text-gray-600 mb-6">You can invite the first tenant for the property you just added. You can always do this later from your dashboard.</p>
      <div>
        <label htmlFor="tenantEmail" className="block text-sm font-medium text-gray-700 mb-2">Tenant's Email Address</label>
        <input 
          type="email" 
          id="tenantEmail" 
          name="tenantEmail" 
          value={formData.tenantEmail} 
          onChange={handleChange} 
          placeholder="tenant@example.com"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h3 className="text-xl font-semibold text-gray-900 mb-6">Confirm Details</h3>
      <div className="space-y-4 text-sm bg-orange-50 p-6 rounded-lg border border-orange-200">
        <div>
          <h4 className="font-semibold text-orange-900 mb-3">Personal Information</h4>
          <div className="space-y-1 text-gray-700">
            <p><span className="font-medium">Name:</span> {formData.firstName} {formData.lastName}</p>
            <p><span className="font-medium">Phone:</span> {formData.phoneNumber}</p>
            <p><span className="font-medium">Contact Method:</span> {formData.preferredContactMethod}</p>
            {formData.businessName && <p><span className="font-medium">Business:</span> {formData.businessName}</p>}
          </div>
        </div>
        
        <hr className="border-orange-200" />
        
        <div>
          <h4 className="font-semibold text-orange-900 mb-3">Property Details</h4>
          <div className="space-y-1 text-gray-700">
            <p><span className="font-medium">Nickname:</span> {formData.propertyNickname || formData.streetAddress}</p>
            <p><span className="font-medium">Address:</span> {formData.streetAddress}, {formData.city}, {formData.state} {formData.zipCode}</p>
            <p><span className="font-medium">Type:</span> {formData.propertyType}</p>
            {formData.propertyType === 'Multi-Family Building' && (
              <p><span className="font-medium">Units:</span> {formData.numberOfUnits}</p>
            )}
            {formData.monthlyRent && <p><span className="font-medium">Monthly Rent:</span> ${formData.monthlyRent}</p>}
          </div>
        </div>

        {formData.tenantEmail && (
          <>
            <hr className="border-orange-200" />
            <div>
              <h4 className="font-semibold text-orange-900 mb-3">Tenant Invitation</h4>
              <p className="text-gray-700"><span className="font-medium">Inviting:</span> {formData.tenantEmail}</p>
            </div>
          </>
        )}
      </div>
      
      <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-green-800">
            Ready to complete your setup! Click "Complete Setup" to create your property and start managing.
          </p>
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
      case 5: return renderStep5();
      default: return null;
    }
  };

  // --- Main Render ---
  if (!userProfile) { // Still loading profile
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
        <div className="w-full max-w-2xl">
          <div className="bg-white rounded-xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Property Setup</h1>
              <p className="text-gray-600">Let's get your first property set up in the system</p>
            </div>

            <ProgressIndicator />

            {/* Error message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in slide-in-from-top duration-300">
                {error}
              </div>
            )}

            {/* Step content */}
            <form onSubmit={currentStep === 5 ? handleSubmit : (e) => e.preventDefault()}>
              {renderStepContent()}

              {/* Navigation buttons */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 ? (
                  <button
                    type="button"
                    onClick={handleBack}
                    className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Previous
                  </button>
                ) : (
                  <div></div>
                )}

                {currentStep < 5 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-3 bg-gradient-to-r from-orange-600 to-red-600 text-white rounded-lg font-medium hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Setting up...
                      </span>
                    ) : (
                      'Complete Setup'
                    )}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandlordOnboarding; 