import React, { lazy, Suspense } from 'react';
import { ErrorBoundary } from 'react-error-boundary';

// Import HeroSection from sections folder
import HeroSection from './sections/HeroSection';

// Import other section components using lazy loading for improved performance
const RoleProblemSolutionSection = lazy(() => import('./sections/RoleProblemSolutionSection.jsx'));
const WorkflowDemoSection = lazy(() => import('./sections/WorkflowDemoSection'));
const FeaturesSection = lazy(() => import('./sections/FeaturesSection'));
const TestimonialsSection = lazy(() => import('./sections/TestimonialsSection'));
const PricingSection = lazy(() => import('./sections/PricingSection'));

// Import smaller shared components without lazy loading
import LoadingSpinner from '../shared/LoadingSpinner';
import FloatingActionButton from './components/FloatingActionButton';

/**
 * Main landing page that assembles all sections
 * Uses lazy loading to improve initial page load performance
 * Note: No header is included as this is handled by the PublicLayout component
 */
const LandingPage: React.FC = () => {
  // Fallback for suspense
  const sectionFallback = (
    <div className="flex justify-center items-center py-24">
      <LoadingSpinner size="lg" />
    </div>
  );

  // Error boundary fallback
  const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
    <div className="text-center py-12">
      <h3 className="text-xl font-bold text-red-600 mb-4">Something went wrong:</h3>
      <p className="mb-4">{error.message}</p>
      <button
        onClick={resetErrorBoundary}
        className="px-4 py-2 bg-primary text-white rounded-lg"
      >
        Try again
      </button>
    </div>
  );

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Full-page gradient background with z-index set to ensure it's behind other elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(135deg, #4169e1 0%, #7366ff 50%, #6957da 100%)',
          opacity: 0.98
        }}>
          {/* Subtle grid background texture */}
          <div className="absolute inset-0 opacity-20">
            <div className="h-full w-full" style={{
              backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .05) 25%, rgba(255, 255, 255, .05) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .05) 75%, rgba(255, 255, 255, .05) 76%, transparent 77%, transparent)',
              backgroundSize: '80px 80px'
            }}></div>
          </div>
          
          {/* Add radial highlight in the center */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full">
              <div className="w-full h-full bg-gradient-to-r from-transparent via-blue-300 to-transparent rounded-full blur-[100px]"></div>
            </div>
          </div>
          
          {/* Add subtle particle overlay */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute w-20 h-20 top-1/4 left-1/4 bg-blue-300 rounded-full blur-xl"></div>
            <div className="absolute w-32 h-32 bottom-1/3 right-1/3 bg-purple-300 rounded-full blur-xl"></div>
            <div className="absolute w-24 h-24 top-1/2 right-1/4 bg-indigo-300 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
      
      {/* Content container with proper z-index */}
      <div className="relative z-10">
        {/* Hero section - Loaded directly (not lazy loaded) for best initial experience */}
        <HeroSection />
        
        {/* Other sections with lazy loading */}
        
        {/* Role Problem Solution Section with Interactive Dashboard Preview */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={sectionFallback}>
            <RoleProblemSolutionSection />
          </Suspense>
        </ErrorBoundary>

        {/* Interactive Workflow Demo */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={sectionFallback}>
            <WorkflowDemoSection />
          </Suspense>
        </ErrorBoundary>
        
        {/* Features Section */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={sectionFallback}>
            <FeaturesSection />
          </Suspense>
        </ErrorBoundary>
        
        {/* Testimonials */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={sectionFallback}>
            <TestimonialsSection />
          </Suspense>
        </ErrorBoundary>
        
        {/* Pricing Section */}
        <ErrorBoundary FallbackComponent={ErrorFallback}>
          <Suspense fallback={sectionFallback}>
            <PricingSection />
          </Suspense>
        </ErrorBoundary>
      </div>
      
      {/* Floating Action Button - always visible */}
      <FloatingActionButton />
    </div>
  );
};

export default LandingPage; 