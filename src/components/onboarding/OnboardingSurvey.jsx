import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import HomeNavLink from '../layout/HomeNavLink';
import TenantInviteForm from '../tenant/TenantInviteForm';
import inviteCodeService from '../../services/inviteCodeService';
import toast from 'react-hot-toast';

const OnboardingSurvey = () => {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validatedProperty, setValidatedProperty] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    preferredContactMethod: 'email',
    address: '',
    propertyType: 'Apartment',
  });

  // Redirect if user is not authenticated
  useEffect(() => {
    console.log('OnboardingSurvey - Mount State:', {
      currentUser: currentUser?.uid,
      userProfile,
      userType: userProfile?.userType,
      onboardingComplete: userProfile?.onboardingComplete
    });

    if (!currentUser) {
      console.log('OnboardingSurvey - No current user, redirecting to login');
      navigate('/login');
    } else if (!userProfile) {
      console.log('OnboardingSurvey - Waiting for user profile to load...');
      // Don't redirect, wait for profile to load
    } else if (userProfile.onboardingComplete) {
      console.log('OnboardingSurvey - Onboarding complete, redirecting to dashboard');
      // Redirect to the appropriate dashboard based on user type
      if (userProfile.userType) {
        navigate(`/${userProfile.userType}/dashboard`);
      } else {
        navigate('/dashboard');
      }
    } else {
      console.log('OnboardingSurvey - Ready to show onboarding UI');
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

  // Handle invite code validation success
  const handleInviteValidated = async (propertyInfo) => {
    console.log('🎉 Invite code validated in onboarding:', propertyInfo);
    
    try {
      // Redeem the invite code immediately after validation
      const result = await inviteCodeService.redeemInviteCode(
        propertyInfo.inviteCode,
        currentUser.uid
      );
      
      if (result.success) {
        setValidatedProperty(propertyInfo);
        toast.success(`Successfully joined ${propertyInfo.propertyName}!`);
        // Automatically move to next step
        setCurrentStep(2);
      } else {
        toast.error(result.message || 'Failed to join property');
      }
    } catch (error) {
      console.error('Error redeeming invite code during onboarding:', error);
      toast.error(error.message || 'Error joining property');
    }
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
      // 1. Update the user document
      const userDocRef = doc(db, 'users', currentUser.uid);
      
      // Create user data with preserved role/userType fields and property info
      const userData = {
        ...formData,
        // Preserve existing userType and role values
        userType: userProfile?.userType || 'tenant',
        role: userProfile?.role || 'tenant',
        onboardingComplete: true,
        name: `${formData.firstName} ${formData.lastName}`,
        // Add property information from validated invite code
        propertyId: validatedProperty?.propertyId,
        propertyName: validatedProperty?.propertyName,
        unitId: validatedProperty?.unitId,
        updatedAt: serverTimestamp()
      };
      
      console.log('Updating user document with data:', userData);
      
      // Use setDoc with merge option to update user document
      await setDoc(userDocRef, userData, { merge: true });
      console.log('User document updated successfully');
      
      // 2. Create a separate tenant profile document
      if ((userProfile?.userType === 'tenant' || userProfile?.role === 'tenant')) {
        const tenantProfileRef = doc(db, 'tenantProfiles', currentUser.uid);
        const tenantProfileData = {
          userId: currentUser.uid,
          email: userProfile?.email || currentUser.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          phoneNumber: formData.phoneNumber,
          preferredContactMethod: formData.preferredContactMethod,
          address: formData.address,
          propertyType: formData.propertyType,
          // Add property information
          propertyId: validatedProperty?.propertyId,
          propertyName: validatedProperty?.propertyName,
          unitId: validatedProperty?.unitId,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        
        console.log('Creating tenant profile document:', tenantProfileData);
        await setDoc(tenantProfileRef, tenantProfileData);
        console.log('Tenant profile document created successfully');
      }
      
      // Refresh the user profile before redirecting
      const updatedProfile = await fetchUserProfile(currentUser.uid);
      console.log('Onboarding complete, refreshed profile:', updatedProfile);
      
      // Redirect to dashboard based on the updated profile
      const userRole = updatedProfile?.userType || updatedProfile?.role || 'tenant';
      const redirectPath = `/${userRole}/dashboard`;
      console.log(`Redirecting to: ${redirectPath}`);
      navigate(redirectPath);
    } catch (error) {
      console.error('Error saving onboarding data:', error);
      
      // Create a more user-friendly error message
      let errorMessage = 'An error occurred while saving your information.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'You do not have permission to complete this action. Please check your account privileges.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'The service is temporarily unavailable. Please try again later.';
      }
      
      alert(`Error: ${errorMessage}\n\nDetails: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Progress indicator - now 6 steps instead of 5
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
                {step}
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

  // Step 1: Invite Code
  const renderStep1 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Join Your Property</h3>
      <p className="text-sm text-gray-600 mb-6">
        Enter the invite code provided by your landlord or property manager to get started.
      </p>
      
      {validatedProperty ? (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h4 className="text-sm font-medium text-green-800">
                Successfully joined property!
              </h4>
              <p className="text-sm text-green-700 mt-1">
                <span className="font-medium">Property:</span> {validatedProperty.propertyName}
              </p>
              {validatedProperty.unitId && (
                <p className="text-sm text-green-700">
                  <span className="font-medium">Unit:</span> {validatedProperty.unitId}
                </p>
              )}
            </div>
          </div>
        </div>
      ) : (
        // Render invite form outside the main form by setting a flag
        <div className="invite-form-placeholder">
          <p className="text-gray-500 text-sm">Loading invite form...</p>
        </div>
      )}
    </div>
  );

  // Step 2: Name (was Step 1)
  const renderStep2 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Tell us your name</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
            First Name
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
            Last Name
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
      </div>
    </div>
  );

  // Step 3: Contact Info (was Step 2)
  const renderStep3 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Contact Information</h3>
      <div className="space-y-4">
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700">
            Phone Number
          </label>
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
    </div>
  );

  // Step 4: Address (was Step 3)
  const renderStep4 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Living Address</h3>
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Current Address
        </label>
        <textarea
          id="address"
          name="address"
          rows="3"
          value={formData.address}
          onChange={handleChange}
          required
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
          placeholder="Enter your full address"
        />
      </div>
    </div>
  );

  // Step 5: Property Type (was Step 4)
  const renderStep5 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Property Information</h3>
      <div>
        <label htmlFor="propertyType" className="block text-sm font-medium text-gray-700">
          Property Type
        </label>
        <select
          id="propertyType"
          name="propertyType"
          value={formData.propertyType}
          onChange={handleChange}
          className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-teal-500 focus:border-teal-500"
        >
          <option value="Apartment">Apartment</option>
          <option value="Home">Home</option>
          <option value="Commercial Unit">Commercial Unit</option>
        </select>
      </div>
    </div>
  );

  // Step 6: Confirmation (was Step 5)
  const renderStep6 = () => (
    <div>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Review & Complete</h3>
      
      {/* Property Information */}
      {validatedProperty && (
        <div className="p-4 bg-blue-50 rounded-md mb-4">
          <h4 className="font-medium text-blue-800 mb-2">Property Information</h4>
          <p className="text-sm text-blue-700">
            <span className="font-medium">Property:</span> {validatedProperty.propertyName}
          </p>
          {validatedProperty.unitId && (
            <p className="text-sm text-blue-700">
              <span className="font-medium">Unit:</span> {validatedProperty.unitId}
            </p>
          )}
        </div>
      )}
      
      <div className="p-4 bg-gray-50 rounded-md">
        <p className="text-gray-700 mb-2">
          <span className="font-medium">Account Type:</span> {userProfile?.userType ? userProfile.userType.charAt(0).toUpperCase() + userProfile.userType.slice(1) : 'User'}
        </p>
        <p className="text-sm text-gray-500">
          This is the account type you selected during registration. This determines which features and functionalities you'll have access to in Propagentic.
        </p>
      </div>
      <div className="mt-6 space-y-2">
        <h4 className="font-medium text-gray-800">Please review your information:</h4>
        <p><span className="text-gray-500">Name:</span> {formData.firstName} {formData.lastName}</p>
        <p><span className="text-gray-500">Phone:</span> {formData.phoneNumber}</p>
        <p><span className="text-gray-500">Preferred Contact:</span> {formData.preferredContactMethod}</p>
        <p><span className="text-gray-500">Address:</span> {formData.address}</p>
        <p><span className="text-gray-500">Property Type:</span> {formData.propertyType}</p>
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

  // Validation
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return validatedProperty !== null; // Must have valid invite code
      case 2:
        return formData.firstName && formData.lastName;
      case 3:
        return formData.phoneNumber && formData.preferredContactMethod;
      case 4:
        return formData.address;
      case 5:
        return formData.propertyType;
      case 6:
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
          <h2 className="text-2xl font-bold text-gray-900">Welcome to Propagentic</h2>
          <p className="mt-2 text-sm text-gray-600">
            Let's set up your profile to get started
          </p>
        </div>

        <ProgressIndicator />
        
        {/* Step 1: Render invite form outside main form to avoid nesting */}
        {currentStep === 1 && !validatedProperty && (
          <TenantInviteForm
            onInviteValidated={handleInviteValidated}
            email={currentUser?.email}
            showSkip={false}
            className="space-y-4 mb-8"
          />
        )}
        
        {/* Main form for steps 2-6 or step 1 when property is validated */}
        {(currentStep > 1 || validatedProperty) && (
          <form onSubmit={currentStep === 6 ? handleSubmit : (e) => e.preventDefault()}>
            {renderStepContent()}
            
            <div className="mt-8 flex justify-between">
              {currentStep > 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="py-2 px-4 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                >
                  Back
                </button>
              )}
              
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!isStepValid()}
                  className={`ml-auto py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                    ${isStepValid() 
                      ? 'bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500' 
                      : 'bg-teal-300 cursor-not-allowed'}`}
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
                  <div className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </div>
                ) : (
                  'Complete Setup'
                )}
              </button>
            )}
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default OnboardingSurvey; 