import React, { useState, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { determineUserRoute, isRouteAllowed } from '../../utils/authHelpers';
import ErrorRecoveryPage from './ErrorRecoveryPage';
import LoadingSpinner from '../shared/LoadingSpinner';

/**
 * SafeRouter component that handles all authentication edge cases
 * and provides safe routing with error recovery
 */
const SafeRouter = ({ children }) => {
  const { 
    currentUser, 
    userProfile, 
    loading: authLoading,
    authError,
    profileError,
    isProfileCorrupted,
    recoverProfile,
    clearErrors
  } = useAuth();
  
  const location = useLocation();
  const [routingError, setRoutingError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRecovering, setIsRecovering] = useState(false);

  // Clear routing errors when location changes
  useEffect(() => {
    setRoutingError(null);
  }, [location.pathname]);

  // Handle profile recovery
  const handleProfileRecovery = async () => {
    if (retryCount >= 3) {
      setRoutingError('Maximum recovery attempts reached. Please contact support.');
      return;
    }

    setIsRecovering(true);
    setRetryCount(prev => prev + 1);

    try {
      const recovered = await recoverProfile();
      if (recovered) {
        clearErrors();
        setRoutingError(null);
        setRetryCount(0);
      } else {
        setRoutingError('Unable to recover profile. Please try logging out and back in.');
      }
    } catch (error) {
      console.error('Profile recovery failed:', error);
      setRoutingError('Profile recovery failed. Please contact support.');
    } finally {
      setIsRecovering(false);
    }
  };

  // Handle routing errors
  const handleRoutingError = (error) => {
    console.error('Routing error:', error);
    setRoutingError(error.message || 'An unexpected routing error occurred.');
  };

  // Show loading state
  if (authLoading || isRecovering) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">
            {isRecovering ? 'Recovering your profile...' : 'Loading...'}
          </p>
        </div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    return (
      <ErrorRecoveryPage
        error={authError}
        type="auth"
        onRetry={() => {
          clearErrors();
          window.location.reload();
        }}
        onGoHome={() => {
          clearErrors();
          window.location.href = '/';
        }}
      />
    );
  }

  // Handle profile corruption
  if (isProfileCorrupted || profileError) {
    return (
      <ErrorRecoveryPage
        error={profileError || 'Your profile data appears to be corrupted.'}
        type="profile"
        onRetry={handleProfileRecovery}
        onGoHome={() => {
          clearErrors();
          window.location.href = '/';
        }}
        canRetry={retryCount < 3}
        retryCount={retryCount}
      />
    );
  }

  // Handle routing errors
  if (routingError) {
    return (
      <ErrorRecoveryPage
        error={routingError}
        type="routing"
        onRetry={() => {
          setRoutingError(null);
          window.location.reload();
        }}
        onGoHome={() => {
          window.location.href = '/';
        }}
      />
    );
  }

  try {
    // Determine the correct route for the user
    const routeDecision = determineUserRoute(currentUser, userProfile);

    // Handle different routing actions
    switch (routeDecision.action) {
      case 'loading':
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-gray-600">Loading your profile...</p>
            </div>
          </div>
        );

      case 'redirect':
        // Check if current path matches required redirect
        if (location.pathname === routeDecision.path) {
          // Already on correct path, render children
          return children;
        }

        // Check if route is allowed for user
        if (!isRouteAllowed(location.pathname, userProfile)) {
          console.log(`Redirecting from ${location.pathname} to ${routeDecision.path} (${routeDecision.reason})`);
          return <Navigate to={routeDecision.path} replace />;
        }

        // Route is allowed, render children
        return children;

      default:
        console.warn('Unknown routing action:', routeDecision.action);
        return children;
    }
  } catch (error) {
    handleRoutingError(error);
    return null;
  }
};

export default SafeRouter; 