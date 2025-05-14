import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { DemoModeProvider, useDemoMode } from './context/DemoModeContext';
import DataServiceProvider from './providers/DataServiceProvider';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase/config';
import LogoLoadingAnimation from './components/shared/LogoLoadingAnimation';
// Comment out SafeMotion import which is causing problems
// import { SafeMotion, AnimatePresence } from './components/shared/SafeMotion';
// import SafeMotionDemo from './pages/SafeMotionDemo';
import GlassyHeader from './components/layout/GlassyHeader';
import DashboardSidebar from './components/layout/SidebarNav';
// Import our LocalStorageDebug component
import LocalStorageDebug from './components/shared/LocalStorageDebug';

// Pages & Components
import LandingPage from './components/landing/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';

// New Components
import TenantDashboard from './pages/tenant/TenantDashboard';
import LandlordTicketDashboard from './components/landlord/LandlordTicketDashboard';
import ContractorDashboard from './components/contractor/ContractorDashboard';
import CreateLandlordProfile from './components/landlord/CreateLandlordProfile';

// SVG Test Component
import SVGTest from './components/branding/SVGTest';
import BlueprintTest from './components/testing/BlueprintTest';

// Existing Pages
import MaintenanceFormPage from './pages/MaintenanceFormPage';
import MyMaintenanceRequestsPage from './pages/MyMaintenanceRequestsPage';
import PricingPage from './pages/PricingPage';
import OnboardingSurvey from './components/onboarding/OnboardingSurvey';
import LandlordOnboarding from './components/onboarding/LandlordOnboarding';
import ContractorOnboardingPage from './pages/ContractorOnboardingPage';
import JobDetailPage from './pages/JobDetailPage';
import JobHistoryPage from './pages/JobHistoryPage';
import ContractorProfilePage from './pages/ContractorProfilePage';
import ProfilePage from './pages/ProfilePage';
import NotificationsPage from './pages/NotificationsPage';
import AuthPage from './pages/AuthPage';
import DemoPage from './pages/DemoPage';
import AboutPage from './pages/AboutPage';
import PropertiesPage from './pages/landlord/PropertiesPage';
import TenantsPage from './pages/landlord/TenantsPage';
import MaintenancePage from './pages/landlord/MaintenancePage';
import SupportPage from './pages/SupportPage';
import SettingsPage from './pages/SettingsPage';

// AI Example Pages
import AIExamples from './pages/AIExamples';
import AITutorial from './pages/AITutorial';

// Showcase Page for UI Components
import ComponentsShowcasePage from './pages/ComponentsShowcasePage';
import TestUIComponents from './pages/TestUIComponents';
import SimpleUIShowcase from './pages/SimpleUIShowcase';

// Maintenance Survey Component
import MaintenanceSurvey from './components/maintenance/MaintenanceSurvey';

// Route Guards
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
     return <div className="flex h-screen items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
     </div>;
  }
  
  return currentUser ? children : <Navigate to="/login" />;
};

// Role-specific redirect component
const RoleBasedRedirect = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth(); // Get userProfile and auth loading state
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    // Wait for auth and profile to be loaded
    if (authLoading || !currentUser) {
      // If auth is still loading or no user, wait or redirect to login
      if (!authLoading && !currentUser) {
        console.log('RoleBasedRedirect: No user, navigating to login.');
        navigate('/login');
      }
      // Keep profileLoading true until auth is ready
      setProfileLoading(authLoading); 
      return; 
    }

    // Auth is loaded, currentUser exists. Now check profile.
    // Use userProfile from context directly, assuming fetch happens on auth change
    if (!userProfile) {
      // Profile might still be loading via onAuthStateChanged
      console.log('RoleBasedRedirect: Waiting for user profile...');
      // We might need a more robust way to wait if fetchUserProfile is slow
      // For now, assume context updates trigger re-render
      setProfileLoading(true); 
      return; 
    }

    // Profile is available
    setProfileLoading(false);
    console.log('RoleBasedRedirect: User profile loaded:', userProfile);

    const userRole = userProfile.userType || userProfile.role;
    const onboardingComplete = userProfile.onboardingComplete;

    console.log(`RoleBasedRedirect - Role: ${userRole}, Onboarding Complete: ${onboardingComplete}`);

    if (!onboardingComplete) {
      console.log('RoleBasedRedirect: Onboarding not complete, redirecting...');
      switch (userRole) {
        case 'landlord':
          navigate('/landlord-onboarding');
          break;
        case 'contractor':
          navigate('/contractor-onboarding');
          break;
        case 'tenant': // Assuming tenants might have a simple onboarding survey
        default:
          // Redirect to generic onboarding or profile if no specific role onboarding
          navigate('/onboarding'); 
          break;
      }
    } else {
       console.log('RoleBasedRedirect: Onboarding complete, redirecting to dashboard...');
       switch (userRole) {
        case 'tenant':
          navigate('/tenant/dashboard');
          break;
        case 'landlord':
          navigate('/landlord/dashboard');
          break;
        case 'contractor':
          navigate('/contractor/dashboard');
          break;
        default:
          console.log('RoleBasedRedirect - No recognized role after onboarding, redirecting to profile');
          navigate('/profile'); 
          break;
      }
    }
  // Depend on authLoading, currentUser, and userProfile
  }, [currentUser, userProfile, authLoading, navigate]);

  // Show loading while checking auth and profile
  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary-light"></div>
      </div>
    );
  }

  // Render nothing once redirection logic is complete
  return null;
};

// Content layout that wraps page content
const ContentLayout = ({ children }) => {
  return (
    <div className="flex-1 flex flex-col min-h-[calc(100vh-var(--header-height))]">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

// Dashboard content layout with sidebar
const DashboardContent = ({ children }) => {
  const { isDemoMode } = useDemoMode ? useDemoMode() : { isDemoMode: false };
  
  return (
    <div className="flex min-h-[calc(100vh-var(--header-height))]">
      <DashboardSidebar />
      <div className="flex-1 ml-0 md:ml-64">
        {isDemoMode && (
          <div className="bg-blue-500 text-white text-center py-1 px-4 text-sm font-medium">
            DEMO MODE - No backend connection required
          </div>
        )}
        <main className="p-4 md:p-6 bg-gray-100">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  const [loading, setLoading] = useState(true);
  const [showContent, setShowContent] = useState(false);
  
  useEffect(() => {
    // Check if this is the first visit
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    
    if (hasVisitedBefore === 'true') {
      // If visited before, skip animation
      setShowContent(true);
      setLoading(false);
    } else {
      // Show loading animation for first-time visitors
      // The LogoLoadingAnimation will call finishLoading when done
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);
  
  const finishLoading = () => {
    // First set showContent to true while loading is still true
    setShowContent(true);
    // After a brief overlap for a smoother transition, remove the loader
    setTimeout(() => setLoading(false), 800);
  };

  return (
    <>
      {loading && <LogoLoadingAnimation finishLoading={finishLoading} />}
      
      <div className={`transition-all duration-1000 ease-in-out ${
        showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
      }`}>
        <AuthProvider>
          <ConnectionProvider>
            <DemoModeProvider>
              <DataServiceProvider>
                <NotificationProvider>
                  <Router>
                    <GlassyHeader />
                    
                    <Routes>
                      {/* Public routes */}
                      <Route path="/" element={<Navigate to="/propagentic/new" replace />} />
                      <Route path="/propagentic/new" element={<LandingPage />} />
                      <Route path="/pricing" element={<PricingPage />} />
                      <Route path="/about" element={<AboutPage />} />
                      <Route path="/demo" element={<DemoPage />} />
                      <Route path="/svg-test" element={<SVGTest />} />
                      <Route path="/blueprint-test" element={<BlueprintTest />} />
                      
                      {/* Authentication routes */}
                      <Route path="/login" element={<LoginPage />} />
                      <Route path="/register" element={<RegisterPage />} />
                      <Route path="/signup" element={<RegisterPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      
                      {/* User specific dashboard routes */}
                      <Route path="/dashboard" element={<PrivateRoute><RoleBasedRedirect /></PrivateRoute>} />
                      <Route path="/tenant/dashboard" element={<PrivateRoute><TenantDashboard /></PrivateRoute>} />
                      <Route path="/landlord/dashboard" element={<PrivateRoute><LandlordDashboard /></PrivateRoute>} />
                      <Route path="/contractor/dashboard" element={<PrivateRoute><ContractorDashboard /></PrivateRoute>} />
                      
                      {/* Maintenance routes */}
                      <Route path="/maintenance/new" element={<PrivateRoute><MaintenanceSurvey /></PrivateRoute>} />
                      
                      {/* Onboarding routes */}
                      <Route path="/onboarding" element={<PrivateRoute><OnboardingSurvey /></PrivateRoute>} />
                      <Route path="/landlord-onboarding" element={<PrivateRoute><LandlordOnboarding /></PrivateRoute>} />
                      <Route path="/contractor-onboarding" element={<PrivateRoute><ContractorOnboardingPage /></PrivateRoute>} />
                      
                      {/* Fallback/Not Found - Redirect to login */}
                      <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                    
                    {/* Debug indicator - always visible */}
                    <div id="app-loaded" style={{ position: 'fixed', bottom: 0, right: 0, padding: '5px', background: 'rgba(0,0,0,0.1)', fontSize: '10px', zIndex: 9999, pointerEvents: 'none' }}>
                      App Loaded
                    </div>
                    
                    {/* LocalStorageDebug - only visible in development */}
                    <LocalStorageDebug />
                  </Router>
                </NotificationProvider>
              </DataServiceProvider>
            </DemoModeProvider>
          </ConnectionProvider>
        </AuthProvider>
      </div>
    </>
  );
}

export default App;
