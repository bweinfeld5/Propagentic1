import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

/**
 * Layout component for onboarding flows
 * Handles authentication, redirection, and styling for all onboarding pages
 */
const OnboardingLayout = () => {
  const { currentUser, userProfile, loading } = useAuth();

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // If still loading, show loading state
  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // If onboarding is complete, redirect to dashboard
  if (userProfile.onboardingComplete) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">Welcome to Propagentic</h1>
          <p className="mt-2 text-lg text-gray-600">
            Let's gather some information to get your account set up
          </p>
        </div>
        
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <Outlet />
          </div>
        </div>
        
        <div className="mt-4 text-center text-sm text-gray-500">
          <p>
            Your information helps us provide a better experience.
            All your data is secure and private.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OnboardingLayout; 