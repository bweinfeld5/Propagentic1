import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext';
import { ConnectionProvider } from './context/ConnectionContext.jsx';
import { DemoModeProvider, useDemoMode } from './context/DemoModeContext.jsx';
import { ThemeProvider } from './design-system/dark-mode';
import DataServiceProvider from './providers/DataServiceProvider';
import LogoLoadingAnimation from './components/shared/LogoLoadingAnimation';
import GlassyHeader from './components/layout/GlassyHeader';
import DashboardSidebar from './components/layout/SidebarNav';
import LocalStorageDebug from './components/shared/LocalStorageDebug';
import UniversalLoadingSpinner from './components/shared/UniversalLoadingSpinner';
import PreLaunchGuard from './components/guards/PreLaunchGuard';
import TenantInviteGuard from './components/guards/TenantInviteGuard.tsx';
import { Toaster } from 'react-hot-toast';
import PitchDeckDemo from './pages/demo/PitchDeckDemo';
import DemoPage from './pages/DemoPage';
import AboutPage from './pages/AboutPage';
import AIExamples from './pages/AIExamples';
import AITutorial from './pages/AITutorial';
import ComponentsShowcasePage from './pages/ComponentsShowcasePage';
import TestUIComponents from './pages/TestUIComponents';
import SimpleUIShowcase from './pages/SimpleUIShowcase';
import MaintenanceSurvey from './components/maintenance/MaintenanceSurvey';
import EnhancedMaintenancePage from './pages/tenant/EnhancedMaintenancePage';
import PublicPropertyDashboardDemo from './pages/PublicPropertyDashboardDemo';
import DemoShowcase from './pages/DemoShowcase';
import TestPage from './pages/TestPage';
import InviteAcceptancePage from './pages/InviteAcceptancePage';

// Lazy load page components
const LandingPage = lazy(() => import('./components/landing/LandingPage.jsx'));
const CanvasLandingPage = lazy(() => import('./pages/CanvasLandingPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword.jsx'));
const TenantDashboard = lazy(() => import('./pages/tenant/TenantDashboard.tsx'));
const EnhancedTenantDashboard = lazy(() => import('./pages/tenant/EnhancedTenantDashboard.tsx'));
const LandlordDashboard = lazy(() => import('./pages/landlord/LandlordDashboard.tsx'));
const LandlordDashboardDemo = lazy(() => import('./pages/LandlordDashboardDemoPage.jsx'));
const ContractorDashboard = lazy(() => import('./components/contractor/EnhancedContractorDashboard'));
const ContractorDashboardDemo = lazy(() => import('./pages/ContractorDashboardDemo.jsx'));
const OriginalContractorDashboard = lazy(() => import('./components/contractor/ContractorDashboard.jsx'));
const ContractorMessagesPage = lazy(() => import('./pages/contractor/ContractorMessagesPage.tsx'));
const PricingPage = lazy(() => import('./pages/PricingPage.jsx'));
const OnboardingSurvey = lazy(() => import('./components/onboarding/OnboardingSurvey.jsx'));
const LandlordOnboarding = lazy(() => import('./components/onboarding/LandlordOnboarding.jsx'));
const ContractorOnboardingPage = lazy(() => import('./pages/ContractorOnboardingPage.jsx'));
const SVGTest = lazy(() => import('./components/branding/SVGTest'));
const BlueprintTest = lazy(() => import('./components/testing/BlueprintTest'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const ContractorEstimateReadinessDemo = lazy(() => import('./components/landlord/ContractorEstimateReadinessDemo.jsx'));
const TenantDataTest = lazy(() => import('./components/test/TenantDataTest.jsx'));

// Route Guards
const PrivateRoute = ({ children }) => {
  const { currentUser, loading } = useAuth();
  
  if (loading) {
     return <div className="flex h-screen items-center justify-center">
       <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
     </div>;
  }
  
  return currentUser ? (
    <TenantInviteGuard>
      {children}
    </TenantInviteGuard>
  ) : <Navigate to="/propagentic/new" />;
};

// Role-specific redirect component
const RoleBasedRedirect = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (authLoading || !currentUser) {
      if (!authLoading && !currentUser) {
        navigate('/propagentic/new');
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
  const { isDemoMode } = useDemoMode();
  
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
        <ThemeProvider defaultTheme="system">
          <AuthProvider>
            <PreLaunchGuard>
              <ConnectionProvider>
                <DemoModeProvider>
                  <DataServiceProvider>
                    <NotificationProvider>
                      <Router>
                        <Suspense fallback={<UniversalLoadingSpinner message="Loading page..." />}>
                        <Routes>
                        {/* Public routes */}
                        <Route path="/" element={<Navigate to="/propagentic/new" replace />} />
                        <Route path="/propagentic/new" element={<LandingPage />} />
                        <Route path="/canvas-landing" element={<CanvasLandingPage />} />
                        {/* Render GlassyHeader for all other routes */}
                        <Route
                          path="*"
                          element={
                            <>
                              <GlassyHeader />
                              <Routes>
                                <Route path="/pricing" element={<PricingPage />} />
                                <Route path="/about" element={<AboutPage />} />
                                <Route path="/demo" element={<Navigate to="/demo/pitchdeck" replace />} />
                                <Route path="/demo-showcase" element={<DemoShowcase />} />
                                <Route path="/property-dashboard-demo" element={<PublicPropertyDashboardDemo />} />
                                <Route path="/svg-test" element={<SVGTest />} />
                                <Route path="/blueprint-test" element={<BlueprintTest />} />
                                <Route path="/test" element={<PrivateRoute><TestPage /></PrivateRoute>} />
                                <Route path="/test/tenant-data" element={<PrivateRoute><TenantDataTest /></PrivateRoute>} />
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/signup" element={<RegisterPage />} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/auth" element={<AuthPage />} />
                                <Route path="/invite" element={<InviteAcceptancePage />} />
                                <Route path="/dashboard" element={<PrivateRoute><RoleBasedRedirect /></PrivateRoute>} />
                                <Route path="/tenant/dashboard" element={<PrivateRoute><EnhancedTenantDashboard /></PrivateRoute>} />
                                <Route path="/tenant/dashboard/legacy" element={<PrivateRoute><TenantDashboard /></PrivateRoute>} />
                                <Route path="/landlord/dashboard" element={<PrivateRoute><LandlordDashboard /></PrivateRoute>} />
                                <Route path="/contractor/dashboard" element={<PrivateRoute><ContractorDashboard /></PrivateRoute>} />
                                <Route path="/contractor/messages" element={<PrivateRoute><ContractorMessagesPage /></PrivateRoute>} />
                                <Route path="/contractor/dashboard/enhanced" element={<ContractorDashboardDemo />} />
                                <Route path="/contractor/dashboard/original" element={<PrivateRoute><OriginalContractorDashboard /></PrivateRoute>} />
                                <Route path="/maintenance/new" element={<PrivateRoute><MaintenanceSurvey /></PrivateRoute>} />
                                <Route path="/maintenance/enhanced" element={<PrivateRoute><EnhancedMaintenancePage /></PrivateRoute>} />
                                <Route path="/onboarding" element={<PrivateRoute><OnboardingSurvey /></PrivateRoute>} />
                                <Route path="/landlord-onboarding" element={<PrivateRoute><LandlordOnboarding /></PrivateRoute>} />
                                <Route path="/contractor-onboarding" element={<PrivateRoute><ContractorOnboardingPage /></PrivateRoute>} />
                                <Route path="/ai-examples" element={<AIExamples />} />
                                <Route path="/ai-tutorial" element={<AITutorial />} />
                                <Route path="/showcase/components" element={<ComponentsShowcasePage />} />
                                <Route path="/showcase/ui-test" element={<TestUIComponents />} />
                                <Route path="/showcase/simple-ui" element={<SimpleUIShowcase />} />
                                <Route path="/landlord/dashboard/demo" element={<LandlordDashboardDemo />} />
                                <Route path="/demo/pitchdeck" element={<PitchDeckDemo />} />
                                <Route path="/demo/contractor-readiness" element={<ContractorEstimateReadinessDemo />} />
                                {/* Fallback/Not Found - Redirect to login or a dedicated 404 page */}
                                <Route path="*" element={<Navigate to="/login" />} />
                              </Routes>
                            </>
                          }
                        />
                      </Routes>
                      </Suspense>
                      {/* Toast Notifications */}
                      <Toaster
                        position="top-right"
                        toastOptions={{
                          duration: 4000,
                          style: {
                            background: '#363636',
                            color: '#fff',
                          },
                          success: {
                            duration: 3000,
                            iconTheme: {
                              primary: '#10B981',
                              secondary: '#FFFFFF',
                            },
                          },
                          error: {
                            duration: 5000,
                            iconTheme: {
                              primary: '#EF4444',
                              secondary: '#FFFFFF',
                            },
                          },
                        }}
                      />
                      
                      <div id="app-loaded" style={{ position: 'fixed', bottom: 0, right: 0, padding: '5px', background: 'rgba(0,0,0,0.1)', fontSize: '10px', zIndex: 9999, pointerEvents: 'none' }}>
                        App Loaded
                      </div>
                      <LocalStorageDebug />
                    </Router>
                  </NotificationProvider>
                </DataServiceProvider>
              </DemoModeProvider>
            </ConnectionProvider>
            </PreLaunchGuard>
          </AuthProvider>
        </ThemeProvider>
      </div>
    </>
  );
}

export default App;
