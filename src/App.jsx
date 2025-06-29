import React, { useEffect, useState, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import { NotificationProvider } from './context/NotificationContext';
import { ConnectionProvider } from './context/ConnectionContext.jsx';
import { DemoModeProvider, useDemoMode } from './context/DemoModeContext.jsx';
import { ThemeProvider } from './design-system/dark-mode';
import { ModelContextProvider } from './contexts/ModelContext';
import DataServiceProvider from './providers/DataServiceProvider';
import LogoLoadingAnimation from './components/shared/LogoLoadingAnimation';
import GlassyHeader from './components/layout/GlassyHeader';
import DashboardSidebar from './components/layout/SidebarNav';
import LocalStorageDebug from './components/shared/LocalStorageDebug';
import UniversalLoadingSpinner from './components/shared/UniversalLoadingSpinner';
import PreLaunchGuard from './components/guards/PreLaunchGuard';
import TenantInviteGuard from './components/guards/TenantInviteGuard.tsx';
import ProfileCompletionGuard from './components/guards/ProfileCompletionGuard';
import ErrorBoundary from './components/error/ErrorBoundary';
import ErrorMonitoringDashboard from './components/admin/ErrorMonitoringDashboard';
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
import AIMaintenanceChat from './components/tenant/AIMaintenanceChat';
import PublicPropertyDashboardDemo from './pages/PublicPropertyDashboardDemo';
import DemoShowcase from './pages/DemoShowcase';
import TestPage from './pages/TestPage';
import InviteAcceptancePage from './pages/InviteAcceptancePage';
import InviteCodeBrowserTest from './pages/InviteCodeBrowserTest';

// Lazy load page components
const LandingPage = lazy(() => import('./components/landing/LandingPage.jsx'));
const CanvasLandingPage = lazy(() => import('./pages/CanvasLandingPage.tsx'));
const LoginPage = lazy(() => import('./pages/LoginPage.jsx'));
const RegisterPage = lazy(() => import('./pages/RegisterPage.jsx'));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword.jsx'));
const TenantDashboard = lazy(() => import('./pages/tenant/EnhancedTenantDashboard.tsx'));
const LandlordDashboard = lazy(() => import('./pages/landlord/LandlordDashboard.tsx'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboardPage.tsx'));
const LandlordDashboardDemo = lazy(() => import('./pages/LandlordDashboardDemoPage.jsx'));
const ContractorDashboard = lazy(() => import('./components/contractor/EnhancedContractorDashboard'));
const ContractorDashboardDemo = lazy(() => import('./pages/ContractorDashboardDemo.jsx'));
const OriginalContractorDashboard = lazy(() => import('./components/contractor/ContractorDashboard.jsx'));
const ContractorDashboardMVP = lazy(() => import('./pages/contractor/ContractorDashboardPage.tsx'));
const ContractorMessagesPage = lazy(() => import('./pages/contractor/ContractorMessagesPage.tsx'));
const ContractorProfilePage = lazy(() => import('./pages/ContractorProfilePage.jsx'));
const JobHistoryPage = lazy(() => import('./pages/JobHistoryPage.jsx'));
const PricingPage = lazy(() => import('./pages/PricingPage.jsx'));
const OnboardingSurvey = lazy(() => import('./components/onboarding/OnboardingSurvey.jsx'));
const LandlordOnboarding = lazy(() => import('./components/onboarding/LandlordOnboarding.jsx'));
const ContractorOnboardingPage = lazy(() => import('./pages/ContractorOnboardingPage.jsx'));
// New onboarding components
const TenantOnboarding = lazy(() => import('./components/onboarding/TenantOnboarding.jsx'));
const LandlordOnboardingNew = lazy(() => import('./components/onboarding/LandlordOnboardingNew.jsx'));
const ContractorOnboardingNew = lazy(() => import('./components/onboarding/ContractorOnboardingNew.jsx'));
const SVGTest = lazy(() => import('./components/branding/SVGTest'));
const BlueprintTest = lazy(() => import('./components/testing/BlueprintTest'));
const AuthPage = lazy(() => import('./pages/AuthPage.jsx'));
const ContractorEstimateReadinessDemo = lazy(() => import('./components/landlord/ContractorEstimateReadinessDemo.jsx'));
const EmailVerificationTest = lazy(() => import('./pages/EmailVerificationTest.jsx'));

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
    
    // Check for admin roles first (prioritize role field, then userType)
    const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin' || 
                   userProfile.userType === 'admin' || userProfile.userType === 'super_admin';
    
    // Debug logging for admin account (temporary)
    console.log('RoleBasedRedirect Debug:', {
      email: userProfile.email,
      role: userProfile.role,
      userType: userProfile.userType,
      isAdmin,
      currentPath: window.location.pathname
    });
    
    // Handle admin users (they bypass onboarding and go straight to admin dashboard)
    if (isAdmin) {
      console.log('Redirecting admin user to /admin/dashboard');
      navigate('/admin/dashboard');
      return;
    }
    
    const userRole = userProfile.userType || userProfile.role;
    const onboardingComplete = userProfile.onboardingComplete;
    
    if (!onboardingComplete) {
      switch (userRole) {
        case 'landlord': navigate('/onboarding/landlord'); break;
        case 'contractor': navigate('/onboarding/contractor'); break;
        case 'tenant': navigate('/onboarding/tenant'); break;
        default: navigate('/onboarding/tenant'); break;
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
        <ThemeProvider defaultTheme="light">
          <AuthProvider>
            <PreLaunchGuard>
              <ConnectionProvider>
                <DemoModeProvider>
                  <DataServiceProvider>
                    <ModelContextProvider>
                      <NotificationProvider>
                      <ErrorBoundary 
                        level="page"
                        userId={null}
                        userRole={null}
                      >
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
                                <Route path="/login" element={<LoginPage />} />
                                <Route path="/register" element={<RegisterPage />} />
                                <Route path="/signup" element={<RegisterPage />} />
                                <Route path="/onboarding/tenant" element={<PrivateRoute><OnboardingSurvey /></PrivateRoute>} />
                                <Route path="/onboarding/landlord" element={<PrivateRoute><LandlordOnboarding /></PrivateRoute>} />
                                <Route path="/onboarding/contractor" element={<PrivateRoute><ContractorOnboardingPage /></PrivateRoute>} />
                                <Route path="/forgot-password" element={<ForgotPassword />} />
                                <Route path="/auth" element={<AuthPage />} />
                                <Route path="/invite" element={<InviteAcceptancePage />} />
                                <Route path="/invite-test" element={<PrivateRoute><InviteCodeBrowserTest /></PrivateRoute>} />
                                <Route path="/dashboard" element={<PrivateRoute><RoleBasedRedirect /></PrivateRoute>} />
                                <Route path="/tenant/dashboard" element={<PrivateRoute><ProfileCompletionGuard requiredCompletion={75}><TenantDashboard /></ProfileCompletionGuard></PrivateRoute>} />
                                <Route path="/landlord/dashboard" element={<PrivateRoute><ProfileCompletionGuard requiredCompletion={85}><LandlordDashboard /></ProfileCompletionGuard></PrivateRoute>} />
                                <Route path="/contractor/dashboard" element={<PrivateRoute><ProfileCompletionGuard requiredCompletion={90}><ContractorDashboard /></ProfileCompletionGuard></PrivateRoute>} />
                                <Route path="/admin" element={<PrivateRoute><Navigate to="/admin/dashboard" replace /></PrivateRoute>} />
                                <Route path="/admin/dashboard" element={<PrivateRoute><AdminDashboard /></PrivateRoute>} />
                                <Route path="/contractor/messages" element={<PrivateRoute><ContractorMessagesPage /></PrivateRoute>} />
                                <Route path="/contractor/profile" element={<PrivateRoute><ContractorProfilePage /></PrivateRoute>} />
                                <Route path="/contractor/history" element={<PrivateRoute><JobHistoryPage /></PrivateRoute>} />
                                <Route path="/contractor/dashboard/enhanced" element={<ContractorDashboardDemo />} />
                                <Route path="/contractor/dashboard/mvp" element={<ContractorDashboardMVP />} />
                                <Route path="/contractor/dashboard/original" element={<PrivateRoute><OriginalContractorDashboard /></PrivateRoute>} />
                                <Route path="/maintenance/new" element={<PrivateRoute><MaintenanceSurvey /></PrivateRoute>} />
                                <Route path="/maintenance/enhanced" element={<PrivateRoute><EnhancedMaintenancePage /></PrivateRoute>} />
                                <Route path="/maintenance/ai-chat" element={<PrivateRoute><AIMaintenanceChat /></PrivateRoute>} />
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
                                <Route path="/email-verification-test" element={<PrivateRoute><EmailVerificationTest /></PrivateRoute>} />
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
                      </ErrorBoundary>
                      </NotificationProvider>
                    </ModelContextProvider>
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
