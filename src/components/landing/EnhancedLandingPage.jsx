import React, { useState, useEffect } from 'react';
import EnhancedHeroSection from './newComponents/EnhancedHeroSection';
import EnhancedInteractiveDemo from './newComponents/EnhancedInteractiveDemo';
import StatsSection from './newComponents/StatsSection';
import EnhancedComparisonTable from './newComponents/EnhancedComparisonTable';
import EnhancedAIExplainer from './newComponents/EnhancedAIExplainer';
import EnhancedTestimonials from './newComponents/EnhancedTestimonials';
import FaqSection from './newComponents/FaqSection';
import NewsletterSection from './newComponents/NewsletterSection';
import FloatingActionButton from './newComponents/FloatingActionButton';
import FooterSection from './FooterSection';
import DashboardPreview from './newComponents/DashboardPreview';
import RoleProblemSolutionSection from './sections/RoleProblemSolutionSection';
import { UIComponentErrorBoundary } from '../shared/ErrorBoundary';
import { shouldUseAnimations, disableAnimations } from '../../helpers/animationHelper';

const EnhancedLandingPage = () => {
  const [hasError, setHasError] = useState(false);
  const [useAnimations, setUseAnimations] = useState(shouldUseAnimations);
  
  // Handle any animation-related errors
  const handleAnimationError = () => {
    console.warn("Animation error detected in landing page");
    setHasError(true);
    setUseAnimations(false);
    disableAnimations();
  };
  
  // Component wrappers with error boundaries
  const SafeSection = ({ children, name }) => (
    <UIComponentErrorBoundary 
      componentName={name} 
      onError={handleAnimationError}
      fallback={
        <div className="py-8 text-center">
          <p>This section could not be loaded due to a technical issue.</p>
        </div>
      }
    >
      {children}
    </UIComponentErrorBoundary>
  );

  return (
    <div className="min-h-screen bg-propagentic-neutral-lightest dark:bg-propagentic-slate-dark">
      {/* Hero section with sticky header */}
      <SafeSection name="Hero Section">
        <EnhancedHeroSection useAnimations={useAnimations} />
      </SafeSection>

      {/* Role Problem Solution Section */}
      <SafeSection name="Role Problem Solution">
        <RoleProblemSolutionSection useAnimations={useAnimations} />
      </SafeSection>

      {/* Dashboard Preview Section */}
      <section className="py-16 md:py-24 bg-white dark:bg-propagentic-slate">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-propagentic-slate-dark dark:text-propagentic-neutral-lightest mb-4">
              Powerful Dashboard Management
            </h2>
            <p className="text-xl text-propagentic-slate dark:text-propagentic-neutral-light max-w-3xl mx-auto">
              Manage your properties, monitor maintenance requests, and track key metrics all in one place.
            </p>
          </div>
          <SafeSection name="Dashboard Preview">
            <DashboardPreview useAnimations={useAnimations} />
          </SafeSection>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section className="py-16 md:py-24 bg-propagentic-neutral-light dark:bg-propagentic-neutral-dark">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-propagentic-slate-dark dark:text-propagentic-neutral-lightest mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-propagentic-slate dark:text-propagentic-neutral-light max-w-3xl mx-auto">
              Our interactive demo shows you how Propagentic streamlines maintenance workflows from request to completion.
            </p>
          </div>
          <SafeSection name="Interactive Demo">
            <EnhancedInteractiveDemo useAnimations={useAnimations} />
          </SafeSection>
        </div>
      </section>
      
      {/* Stats section */}
      <SafeSection name="Stats Section">
        <StatsSection useAnimations={useAnimations} />
      </SafeSection>
      
      {/* Comparison Table section */}
      <SafeSection name="Comparison Table">
        <EnhancedComparisonTable useAnimations={useAnimations} />
      </SafeSection>
      
      {/* Enhanced AI Explainer */}
      <SafeSection name="AI Explainer">
        <EnhancedAIExplainer useAnimations={useAnimations} />
      </SafeSection>
      
      {/* Testimonials */}
      <SafeSection name="Testimonials">
        <EnhancedTestimonials useAnimations={useAnimations} />
      </SafeSection>
      
      {/* FAQ section */}
      <SafeSection name="FAQ Section">
        <FaqSection useAnimations={useAnimations} />
      </SafeSection>
      
      {/* Newsletter signup */}
      <SafeSection name="Newsletter Section">
        <NewsletterSection useAnimations={useAnimations} />
      </SafeSection>
      
      {/* Footer */}
      <FooterSection />
      
      {/* Floating CTA button */}
      <SafeSection name="Action Button">
        <FloatingActionButton useAnimations={useAnimations} />
      </SafeSection>
      
      {/* Debug indicator for animations */}
      {hasError && (
        <div className="fixed bottom-5 left-5 bg-red-100 text-red-700 p-2 rounded text-xs">
          Animations disabled - Error detected
        </div>
      )}
    </div>
  );
};

export default EnhancedLandingPage; 