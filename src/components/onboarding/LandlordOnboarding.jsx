import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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

  // Progress indicator
  const ProgressIndicator = () => {
    return (
      <div className="mb-8 flex justify-center">
        <div className="flex items-center">
          {[1, 2, 3, 4, 5].map((step) => (
            <React.Fragment key={step}>
              <div 
                className={`rounded-full h-8 w-8 flex items-center justify-center border-2 
                  ${currentStep >= step 
                    ? 'border-teal-500 bg-teal-500 text-white' 
                    : 'border-gray-300 text-gray-300'}`}
              >
                {step}
              </div>
              {step < 5 && (
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

  // --- Step Rendering Functions ---

  const renderStep1 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Your Profile</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">First Name</label>
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
          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">Last Name</label>
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
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">Phone Number</label>
          <input 
            type="tel" 
            id="phoneNumber" 
            name="phoneNumber" 
            value={formData.phoneNumber} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" 
          />
        </div>
        <div>
          <label htmlFor="preferredContactMethod" className="block text-sm font-medium text-gray-700">Preferred Contact Method</label>
          <select 
            id="preferredContactMethod" 
            name="preferredContactMethod" 
            value={formData.preferredContactMethod} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="email">Email</option>
            <option value="phone">Phone</option>
            <option value="text">Text Message</option>
          </select>
        </div>
        <div>
          <label htmlFor="businessName" className="block text-sm font-medium text-gray-700">Business Name (Optional)</label>
          <input 
            type="text" 
            id="businessName" 
            name="businessName" 
            value={formData.businessName} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500" 
          />
        </div>
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Add Your First Property</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="propertyNickname" className="block text-sm font-medium text-gray-700">Property Nickname</label>
          <input 
            type="text" 
            id="propertyNickname" 
            name="propertyNickname" 
            value={formData.propertyNickname} 
            onChange={handleChange} 
            placeholder="e.g., Main Street House" 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label htmlFor="streetAddress" className="block text-sm font-medium text-gray-700">Street Address *</label>
          <input 
            type="text" 
            id="streetAddress" 
            name="streetAddress" 
            value={formData.streetAddress} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label htmlFor="city" className="block text-sm font-medium text-gray-700">City *</label>
          <input 
            type="text" 
            id="city" 
            name="city" 
            value={formData.city} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label htmlFor="state" className="block text-sm font-medium text-gray-700">State *</label>
          <input 
            type="text" 
            id="state" 
            name="state" 
            value={formData.state} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label htmlFor="zipCode" className="block text-sm font-medium text-gray-700">Zip Code *</label>
          <input 
            type="text" 
            id="zipCode" 
            name="zipCode" 
            value={formData.zipCode} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
        <div>
          <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">Property Type *</label>
          <select 
            name="propertyType" 
            id="propertyType" 
            value={formData.propertyType} 
            onChange={handleChange} 
            required 
            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option>Single-Family Home</option>
            <option>Multi-Family Building</option>
            <option>Commercial</option>
          </select>
        </div>
        {formData.propertyType === 'Multi-Family Building' && (
          <div>
            <label htmlFor="numberOfUnits" className="block text-sm font-medium text-gray-700">Number of Units *</label>
            <input 
              type="number" 
              id="numberOfUnits" 
              name="numberOfUnits" 
              value={formData.numberOfUnits} 
              onChange={handleChange} 
              min="1" 
              required 
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
            />
          </div>
        )}
        <div>
          <label htmlFor="monthlyRent" className="block text-sm font-medium text-gray-700">Monthly Rent/Unit ($)</label>
          <input 
            type="text" 
            id="monthlyRent" 
            name="monthlyRent" 
            value={formData.monthlyRent} 
            onChange={handleChange} 
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Business Details</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="yearsInBusiness" className="block text-sm font-medium text-gray-700">Years in Business</label>
          <select 
            id="yearsInBusiness" 
            name="yearsInBusiness" 
            value={formData.yearsInBusiness} 
            onChange={handleChange} 
            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            <option value="1-5">1-5 years</option>
            <option value="5-10">5-10 years</option>
            <option value="10-15">10-15 years</option>
            <option value="15-20">15-20 years</option>
            <option value="20+">20+ years</option>
          </select>
        </div>
        <div>
          <label htmlFor="totalProperties" className="block text-sm font-medium text-gray-700">Total Properties</label>
          <select 
            id="totalProperties" 
            name="totalProperties" 
            value={formData.totalProperties} 
            onChange={handleChange} 
            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
              <option key={num} value={num.toString()}>{num} {num === 1 ? 'property' : 'properties'}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="managementSoftware" className="block text-sm font-medium text-gray-700">Management Software</label>
          <select 
            id="managementSoftware" 
            name="managementSoftware" 
            value={formData.managementSoftware} 
            onChange={handleChange} 
            className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
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
      <h3 className="text-lg font-medium text-gray-900 mb-4">Invite a Tenant (Optional)</h3>
      <p className="text-sm text-gray-600 mb-4">You can invite the first tenant for the property you just added. You can always do this later from your dashboard.</p>
      <div>
        <label htmlFor="tenantEmail" className="block text-sm font-medium text-gray-700">Tenant's Email Address</label>
        <input 
          type="email" 
          id="tenantEmail" 
          name="tenantEmail" 
          value={formData.tenantEmail} 
          onChange={handleChange} 
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
        />
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Confirm Details</h3>
      <div className="space-y-3 text-sm bg-gray-50 p-4 rounded-md">
        <h4 className="font-medium text-gray-700">Personal Information</h4>
        <p><span className="font-medium text-gray-600">Name:</span> {formData.firstName} {formData.lastName}</p>
        <p><span className="font-medium text-gray-600">Phone:</span> {formData.phoneNumber}</p>
        <p><span className="font-medium text-gray-600">Contact Method:</span> {formData.preferredContactMethod}</p>
        {formData.businessName && <p><span className="font-medium text-gray-600">Business:</span> {formData.businessName}</p>}
        
        <hr className="my-2" />
        <h4 className="font-medium text-gray-700">Property Details</h4>
        {formData.propertyNickname && <p><span className="font-medium text-gray-600">Nickname:</span> {formData.propertyNickname}</p>}
        <p><span className="font-medium text-gray-600">Address:</span> {formData.streetAddress}, {formData.city}, {formData.state} {formData.zipCode}</p>
        <p><span className="font-medium text-gray-600">Type:</span> {formData.propertyType} {formData.propertyType === 'Multi-Family Building' ? `(${formData.numberOfUnits} units)` : ''}</p>
        {formData.monthlyRent && <p><span className="font-medium text-gray-600">Monthly Rent:</span> ${formData.monthlyRent}</p>}
        
        <hr className="my-2" />
        <h4 className="font-medium text-gray-700">Business Details</h4>
        <p><span className="font-medium text-gray-600">Years in Business:</span> {formData.yearsInBusiness}</p>
        <p><span className="font-medium text-gray-600">Total Properties:</span> {formData.totalProperties}</p>
        <p><span className="font-medium text-gray-600">Management Software:</span> {formData.managementSoftware}</p>
        
        {formData.tenantEmail && (
          <>
            <hr className="my-2" />
            <h4 className="font-medium text-gray-700">Tenant Details</h4>
            <p><span className="font-medium text-gray-600">Inviting Tenant:</span> {formData.tenantEmail}</p>
          </>
        )}
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
      return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div></div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="flex justify-end pt-4 pr-4">
          <HomeNavLink showOnAuth={true} />
        </div>
        <div className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Property Setup</h2>
            <p className="mt-2 text-sm text-gray-600">
              Let's get your first property set up in the system
            </p>
          </div>

          <ProgressIndicator />

          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {/* Render current step form */} 
            {renderStepContent()}

            {/* Navigation Buttons */} 
            <div className="flex justify-between mt-8">
              {currentStep > 1 ? (
                <button 
                  type="button" 
                  onClick={handleBack} 
                  className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Back
                </button>
              ) : <div></div> /* Placeholder to keep alignment */} 

              {currentStep < 5 ? (
                <button 
                  type="button" 
                  onClick={handleNext} 
                  className="ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Next
                </button>
              ) : (
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  {loading ? (
                     <span className="flex items-center">
                       <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                       Saving...
                     </span>
                   ) : (
                    'Finish Setup'
                   )}
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default LandlordOnboarding; 