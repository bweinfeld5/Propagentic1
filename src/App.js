import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ConnectionProvider } from './context/ConnectionContext';
import { DemoModeProvider, useDemoMode } from './context/DemoModeContext';
import DataServiceProvider from './providers/DataServiceProvider';
import LogoLoadingAnimation from './components/shared/LogoLoadingAnimation';
import GlassyHeader from './components/layout/GlassyHeader';
import DashboardSidebar from './components/layout/SidebarNav';
import LocalStorageDebug from './components/shared/LocalStorageDebug';
import UniversalLoadingSpinner from './components/shared/UniversalLoadingSpinner';

// Lazy load page components
const LandingPage = lazy(() => import('./components/landing/LandingPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const TenantDashboard = lazy(() => import('./pages/tenant/TenantDashboard'));
const LandlordDashboard = lazy(() => import('./pages/LandlordDashboard'));
const ContractorDashboard = lazy(() => import('./components/contractor/ContractorDashboard'));
const PricingPage = lazy(() => import('./pages/PricingPage'));
const OnboardingSurvey = lazy(() => import('./components/onboarding/OnboardingSurvey'));
const LandlordOnboarding = lazy(() => import('./components/onboarding/LandlordOnboarding'));
const ContractorOnboardingPage = lazy(() => import('./pages/ContractorOnboardingPage'));
const SVGTest = lazy(() => import('./components/branding/SVGTest'));
const BlueprintTest = lazy(() => import('./components/testing/BlueprintTest'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const DemoPage = lazy(() => import('./pages/DemoPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const AIExamples = lazy(() => import('./pages/AIExamples'));
const AITutorial = lazy(() => import('./pages/AITutorial'));
const ComponentsShowcasePage = lazy(() => import('./pages/ComponentsShowcasePage'));
const TestUIComponents = lazy(() => import('./pages/TestUIComponents'));
const SimpleUIShowcase = lazy(() => import('./pages/SimpleUIShowcase'));
const MaintenanceSurvey = lazy(() => import('./components/maintenance/MaintenanceSurvey'));

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
import { useNavigate } from 'react-router-dom';
const RoleBasedRedirect = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser) {
      if (!authLoading && !currentUser) {
        navigate('/login');
      }
      setProfileLoading(authLoading); 
      return; 
    }
    if (!userProfile) {
      setProfileLoading(true); 
      return; 
    }
    setProfileLoading(false);
    const userRole = userProfile.userType || userProfile.role;
    const onboardingComplete = userProfile.onboardingComplete;
    if (!onboardingComplete) {
      switch (userRole) {
        case 'landlord': navigate('/landlord-onboarding'); break;
        case 'contractor': navigate('/contractor-onboarding'); break;
        default: navigate('/onboarding'); break;
      }
    } else {
       switch (userRole) {
        case 'tenant': navigate('/tenant/dashboard'); break;
        case 'landlord': navigate('/landlord/dashboard'); break;
        case 'contractor': navigate('/contractor/dashboard'); break;
        default: navigate('/profile'); break;
      }
    }
  }, [currentUser, userProfile, authLoading, navigate]);

  if (authLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary-light"></div>
      </div>
    );
  }
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
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (hasVisitedBefore === 'true') {
      setShowContent(true);
      setLoading(false);
    } else {
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);
  
  const finishLoading = () => {
    setShowContent(true);
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
                    <Suspense fallback={<UniversalLoadingSpinner message="Loading page..." />}>
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
                      
                        {/* AI Example Routes */}
                        <Route path="/ai-examples" element={<AIExamples />} />
                        <Route path="/ai-tutorial" element={<AITutorial />} />

                        {/* UI Showcase Routes */}
                        <Route path="/showcase/components" element={<ComponentsShowcasePage />} />
                        <Route path="/showcase/ui-test" element={<TestUIComponents />} />
                        <Route path="/showcase/simple-ui" element={<SimpleUIShowcase />} />
                        
                        {/* Fallback/Not Found - Redirect to login or a dedicated 404 page */}
                      <Route path="*" element={<Navigate to="/login" />} />
                    </Routes>
                    </Suspense>
                    
                    <div id="app-loaded" style={{ position: 'fixed', bottom: 0, right: 0, padding: '5px', background: 'rgba(0,0,0,0.1)', fontSize: '10px', zIndex: 9999, pointerEvents: 'none' }}>
                      App Loaded
                    </div>
                    
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
