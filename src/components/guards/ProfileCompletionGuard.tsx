import React, { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { validateProfile } from '../../schemas/profileValidationSchemas';
import ProfileCompletionPrompt from './ProfileCompletionPrompt';

interface ProfileCompletionGuardProps {
  children: React.ReactNode;
  requiredCompletion?: number; // Percentage required (default 100%)
  allowPartialAccess?: boolean; // Allow access with warnings
}

/**
 * Guard component that validates profile completion before allowing access
 * Redirects to completion flow if profile is incomplete
 */
const ProfileCompletionGuard: React.FC<ProfileCompletionGuardProps> = ({
  children,
  requiredCompletion = 100,
  allowPartialAccess = false
}) => {
  const { currentUser, userProfile, loading } = useAuth();
  const location = useLocation();
  const [showPrompt, setShowPrompt] = useState(true);

  // Still loading auth state
  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-orange-500"></div>
        <p className="ml-2 text-gray-600">Validating profile...</p>
      </div>
    );
  }

  // Not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // No userType set - redirect to role selection
  if (!userProfile.userType) {
    return <Navigate to="/role-selection" state={{ from: location }} replace />;
  }

  // Validate profile completeness
  const validation = validateProfile(userProfile, userProfile.userType);

  console.log('ProfileCompletionGuard validation:', {
    userType: userProfile.userType,
    completionPercentage: validation.completionPercentage,
    requiredCompletion,
    isValid: validation.isValid,
    missingFields: validation.missingFields,
    allowPartialAccess
  });

  // Profile is incomplete and doesn't meet requirements
  if (validation.completionPercentage < requiredCompletion) {
    // For critical missing fields, redirect to onboarding
    if (!allowPartialAccess || validation.completionPercentage < 50) {
      const onboardingRoutes = {
        contractor: '/contractor-onboarding',
        landlord: '/landlord-onboarding', 
        tenant: '/onboarding'
      };

      return (
        <Navigate 
          to={onboardingRoutes[userProfile.userType as keyof typeof onboardingRoutes] || '/onboarding'} 
          state={{ from: location, reason: 'incomplete_profile' }} 
          replace 
        />
      );
    }

    // For partial access, show completion prompt if not dismissed
    if (showPrompt) {
      return (
        <ProfileCompletionPrompt 
          completionPercentage={validation.completionPercentage}
          missingFields={validation.missingFields}
          userType={userProfile.userType}
          onDismiss={() => setShowPrompt(false)}
          allowPartialAccess={allowPartialAccess}
        />
      );
    }
  }

  // Profile validation has errors (but completion % is acceptable)
  if (validation.errors.length > 0 && !allowPartialAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Profile Validation Errors</h3>
            </div>
          </div>
          
          <div className="mb-4">
            <ul className="text-sm text-red-700 space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={() => {
                const routes = {
                  contractor: '/contractor/profile',
                  landlord: '/landlord/profile',
                  tenant: '/tenant/profile'
                };
                window.location.href = routes[userProfile.userType as keyof typeof routes] || '/profile';
              }}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700"
            >
              Fix Profile
            </button>
            <button
              onClick={() => window.location.href = '/login'}
              className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-400"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Profile is valid - render children
  return <>{children}</>;
};

export default ProfileCompletionGuard; 