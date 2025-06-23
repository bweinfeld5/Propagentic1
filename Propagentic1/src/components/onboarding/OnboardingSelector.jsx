import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Navigate } from 'react-router-dom';
// Import each form component separately with a relative path
import TenantForm from './TenantForm';
import LandlordForm from './LandlordForm';
import ContractorForm from './ContractorForm';

const OnboardingSelector = () => {
  const { userProfile, loading } = useAuth();

  // If still loading, show loading state
  if (loading || !userProfile) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
        <div className="h-4 bg-gray-200 rounded mb-4"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-5/6"></div>
        <div className="h-4 bg-gray-200 rounded mb-4 w-4/6"></div>
      </div>
    );
  }

  // If no userType is set, something is wrong - redirect to login
  if (!userProfile.userType) {
    return <Navigate to="/login" />;
  }

  // Log the profile and userType before switching
  console.log('OnboardingSelector - userProfile:', userProfile);
  console.log('OnboardingSelector - userProfile.userType:', userProfile?.userType);

  // Return the appropriate form based on user type
  switch (userProfile.userType) {
    case 'tenant':
      return <TenantForm />;
    case 'landlord':
      return <LandlordForm />;
    case 'contractor':
      return <ContractorForm />;
    default:
      // Unknown userType - show an error
      return (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
          <h3 className="font-bold">Invalid User Type</h3>
          <p>Your user type "{userProfile.userType}" is not recognized. Please contact support.</p>
        </div>
      );
  }
};

export default OnboardingSelector; 