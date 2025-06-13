import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';

const GoogleSignInButton = ({ 
  userType = 'tenant', 
  isPremium = false, 
  isSignup = false,
  disabled = false,
  className = '',
  onSuccess,
  onError 
}) => {
  const [loading, setLoading] = useState(false);
  const { signInWithGoogle, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    
    try {
      console.log(`Attempting Google ${isSignup ? 'signup' : 'sign-in'} with userType:`, userType);
      
      const result = await signInWithGoogle(userType, isPremium);
      const user = result.user;
      
      console.log('Google authentication successful:', user.uid);
      
      // Fetch the complete user profile
      const profile = await fetchUserProfile(user.uid);
      
      if (onSuccess) {
        onSuccess(result, profile);
      } else {
        // Default navigation logic
        if (profile?.onboardingComplete) {
          // Navigate to appropriate dashboard based on user type
          const dashboardRoute = profile.userType === 'landlord' ? '/landlord' : 
                               profile.userType === 'contractor' ? '/contractor' : 
                               '/dashboard';
          navigate(dashboardRoute);
        } else {
          // Navigate to onboarding
          const onboardingRoute = profile.userType === 'landlord' ? '/landlord-onboarding' :
                                profile.userType === 'contractor' ? '/contractor-onboarding' :
                                '/onboarding';
          navigate(onboardingRoute);
        }
      }
    } catch (error) {
      console.error('Google sign-in failed:', error);
      
      if (onError) {
        onError(error);
      }
      
      // Don't show error for user cancellation
      if (error.code !== 'auth/popup-closed-by-user') {
        // Error is already handled by the AuthContext
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleGoogleSignIn}
      disabled={disabled || loading}
      isLoading={loading}
      className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200 ${className}`}
    >
      {!loading && (
        <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      )}
      {isSignup ? 'Sign up with Google' : 'Sign in with Google'}
    </Button>
  );
};

export default GoogleSignInButton; 