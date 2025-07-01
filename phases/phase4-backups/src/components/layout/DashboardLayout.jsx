import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { NotificationProvider as NotificationCenterProvider } from '../../context/NotificationContext';
import { useDemoMode } from '../../context/DemoModeContext';
import HeaderNav from './HeaderNav';
import SidebarNav from './SidebarNav';
import AnimatedPageLayout from './AnimatedPageLayout';

/**
 * Main dashboard layout component
 * Handles authentication checks, loading states, and layout structure
 */
const DashboardLayout = () => {
  const { currentUser, userProfile, isLandlord, loading: authLoading } = useAuth();
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();
  const location = useLocation();
  const [isReady, setIsReady] = useState(false);

  // Wait for auth to be initialized before making decisions
  useEffect(() => {
    if (!authLoading) {
      setIsReady(true);
    }
  }, [authLoading]);

  // Add more debugging info
  useEffect(() => {
    if (isReady) {
      console.log('DashboardLayout - Auth Status:', {
        isReady,
        pathname: location.pathname,
        currentUser: currentUser?.uid,
        userProfile,
        hasCompletedOnboarding: userProfile?.onboardingComplete
      });
    }
  }, [isReady, location.pathname, currentUser, userProfile]);
  
  // If still loading, show loading state
  if (!isReady || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        <p className="ml-2 text-gray-600">Loading...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    console.log('DashboardLayout - No current user, redirecting to login');
    return <Navigate to="/login" />;
  }

  // If no profile loaded yet, show loading
  if (!userProfile) {
    console.log('DashboardLayout - User authenticated but no profile, showing loading');
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-500"></div>
        <p className="ml-2 text-gray-600">Loading profile...</p>
      </div>
    );
  }

  // Handle onboarding redirect based on user type and completion status
  if (userProfile && userProfile.onboardingComplete === false) {
    console.log('DashboardLayout - Onboarding not complete, redirecting to onboarding');
    const userRole = userProfile.userType || userProfile.role;
    
    if (isLandlord() || userRole === 'landlord') {
      // If landlord hasn't completed onboarding, redirect to landlord-specific flow
      console.log('DashboardLayout - Redirecting landlord to onboarding');
      return <Navigate to="/onboarding/landlord" />;
    } else if (userProfile.userType === 'contractor' || userProfile.role === 'contractor') {
      // If contractor hasn't completed onboarding, redirect to contractor-specific flow
      console.log('DashboardLayout - Redirecting contractor to onboarding');
      return <Navigate to="/onboarding/contractor" />;
    } else {
      // For other roles (tenant), redirect to the general onboarding survey
      console.log('DashboardLayout - Redirecting tenant/other to onboarding');
      return <Navigate to="/onboarding/tenant" />;
    }
  }

  console.log('DashboardLayout - All checks passed, rendering dashboard content');
  
  return (
    <div className="flex h-screen bg-gray-100">
      {/* Use SidebarNav component which has the green styling */}
      <SidebarNav />
      
      {/* Main Content - Wrap the entire right side with NotificationCenterProvider */}
      <NotificationCenterProvider>
        <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
          {/* Use HeaderNav component */}
          <HeaderNav />
          
          {/* Demo Mode Indicator */}
          {isDemoMode && (
            <div className="bg-primary text-white text-center py-1 px-4 text-sm font-medium">
              DEMO MODE - No backend connection required
            </div>
          )}
          
          {/* Main Content Area with Animated Page Transitions */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
            <AnimatedPageLayout transitionType="dashboardTransition" duration={0.3}>
              <Outlet />
            </AnimatedPageLayout>
          </main>
        </div>
      </NotificationCenterProvider>
    </div>
  );
};

export default DashboardLayout; 