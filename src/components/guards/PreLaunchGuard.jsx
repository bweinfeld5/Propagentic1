import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import dataService from '../../services/dataService';
import PreLaunchPage from '../../pages/PreLaunchPage';

/**
 * Pre-Launch Guard Component
 * Controls access to the main application during pre-launch phase
 */
const PreLaunchGuard = ({ children }) => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const [hasAccess, setHasAccess] = useState(null); // null = checking, true = access granted, false = no access
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Skip access check if auth is still loading
      if (authLoading) {
        return;
      }

      try {
        // Configure dataService with demo mode for testing
        const isDemoMode = process.env.NODE_ENV === 'development' || 
                          window.location.hostname === 'localhost' ||
                          window.location.search.includes('demo=true');

        // **LOCAL DEVELOPMENT BYPASS** - Allow full access in development mode
        if (process.env.NODE_ENV === 'development' || 
            window.location.hostname === 'localhost' ||
            window.location.search.includes('bypass=dev')) {
          console.log('🚀 Development mode detected - bypassing early access check');
          setHasAccess(true);
          setIsCheckingAccess(false);
          return;
        }

        if (currentUser && userProfile) {
          dataService.configure({
            isDemoMode,
            currentUser,
            userType: userProfile.userType
          });
        }

        // For pre-launch, we want to show the main app to users with early access
        // and the pre-launch page to everyone else
        if (!currentUser) {
          // **SPECIAL CASE**: Allow access to certain public routes for logged-out users
          const currentPath = window.location.pathname;
          const publicRoutes = [
            '/propagentic/new',
            '/',
            '/login',
            '/register', 
            '/signup',
            '/auth',
            '/pricing',
            '/about',
            '/demo',
            '/canvas-landing'
          ];
          
          if (publicRoutes.includes(currentPath) || currentPath.startsWith('/auth')) {
            console.log('No user logged in - allowing access to public route:', currentPath);
            setHasAccess(true);
            setIsCheckingAccess(false);
            return;
          }
          
          // For all other routes, show pre-launch page
          console.log('No user logged in - showing pre-launch page for route:', currentPath);
          setHasAccess(false);
          setIsCheckingAccess(false);
          return;
        }

        // Check if user has early access
        const hasEarlyAccess = await dataService.hasEarlyAccess(currentUser.email);
        
        setHasAccess(hasEarlyAccess);
        setIsCheckingAccess(false);

        console.log('Access check completed:', {
          email: currentUser.email,
          hasEarlyAccess,
          isDemoMode,
          userType: userProfile?.userType
        });

      } catch (error) {
        console.error('Error checking early access:', error);
        // On error in development, grant access
        // In production, show pre-launch page for safety
        const isDev = process.env.NODE_ENV === 'development' || 
                     window.location.hostname === 'localhost';
        setHasAccess(isDev);
        setIsCheckingAccess(false);
      }
    };

    checkAccess();
  }, [currentUser, userProfile, authLoading]);

  // Show loading state while checking access
  if (authLoading || isCheckingAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking access...</p>
        </div>
      </div>
    );
  }

  // Show pre-launch page if user doesn't have access
  if (!hasAccess) {
    return <PreLaunchPage />;
  }

  // User has access, render the main application
  return children;
};

export default PreLaunchGuard; 