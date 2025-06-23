/**
 * Micro-interactions & Polish Demo Page
 * PropAgentic Design System
 * 
 * Showcases smooth animations, empty states, onboarding tooltips,
 * and confirmation dialogs with accessibility support.
 */

import React, { useState, useRef } from 'react';
import { 
  SparklesIcon,
  PlayIcon,
  PauseIcon,
  TrashIcon,
  DocumentPlusIcon,
  UserPlusIcon,
  HomeIcon,
  AcademicCapIcon,
  RocketLaunchIcon,
  HeartIcon
} from '@heroicons/react/24/outline';
import { Container, ResponsiveGrid } from '../design-system/responsive';
import { darkModeClasses } from '../design-system/dark-mode';
import { AccessibilityProvider, useAccessibility } from '../design-system/accessibility';
import AccessibleButton from '../components/ui/AccessibleButton';
import EmptyState from '../components/ui/EmptyState';
import OnboardingTooltip, { OnboardingTour } from '../components/ui/OnboardingTooltip';
import ConfirmationDialog, { 
  useConfirmationDialog, 
  confirmDelete, 
  confirmUnsavedChanges 
} from '../components/ui/ConfirmationDialog';
import {
  SafeMotion,
  PageTransition,
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  InteractiveMotion,
  SafeAnimatePresence
} from '../components/ui/SafeMotion';

const MicroInteractionsDemoContent = () => {
  const { announce } = useAccessibility();
  
  // Demo state
  const [showAnimations, setShowAnimations] = useState(true);
  const [selectedEmptyState, setSelectedEmptyState] = useState('properties');
  const [onboardingActive, setOnboardingActive] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [demoItems, setDemoItems] = useState([
    { id: 1, name: 'Demo Property 1', type: 'property' },
    { id: 2, name: 'Demo Tenant 1', type: 'tenant' },
    { id: 3, name: 'Demo Document 1', type: 'document' }
  ]);

  // Confirmation dialog hook
  const { 
    isOpen: confirmationOpen, 
    openDialog: openConfirmation, 
    ConfirmationDialog: ManagedConfirmationDialog 
  } = useConfirmationDialog();

  // Refs for onboarding targets
  const animationToggleRef = useRef(null);
  const emptyStateRef = useRef(null);
  const onboardingButtonRef = useRef(null);
  const confirmationDemoRef = useRef(null);

  // Animation toggle
  const toggleAnimations = () => {
    setShowAnimations(!showAnimations);
    announce(`Animations ${!showAnimations ? 'enabled' : 'disabled'}`, 'polite');
  };

  // Empty state types for demo
  const emptyStateTypes = [
    { key: 'properties', label: 'Properties' },
    { key: 'tenants', label: 'Tenants' },
    { key: 'maintenance', label: 'Maintenance' },
    { key: 'documents', label: 'Documents' },
    { key: 'search', label: 'Search Results' },
    { key: 'inbox', label: 'Inbox' },
    { key: 'photos', label: 'Photos' },
    { key: 'error', label: 'Error State' }
  ];

  // Onboarding tour steps
  const onboardingSteps = [
    {
      target: animationToggleRef,
      title: 'Animation Controls',
      content: 'Toggle animations on and off. The system respects user preferences for reduced motion.',
      placement: 'bottom'
    },
    {
      target: emptyStateRef,
      title: 'Empty States',
      content: 'See how empty states provide helpful guidance when there\'s no data to display.',
      placement: 'top'
    },
    {
      target: confirmationDemoRef,
      title: 'Confirmation Dialogs',
      content: 'Try the confirmation dialogs that prevent accidental actions.',
      placement: 'top'
    },
    {
      target: onboardingButtonRef,
      title: 'Onboarding Complete!',
      content: 'You\'ve learned about all the micro-interactions and polish features. Great job!',
      placement: 'bottom'
    }
  ];

  // Handle delete item
  const handleDeleteItem = (item) => {
    openConfirmation(confirmDelete(item.name, () => {
      setDemoItems(prev => prev.filter(i => i.id !== item.id));
      announce(`${item.name} deleted`, 'polite');
    }));
  };

  // Handle unsaved changes demo
  const handleUnsavedChangesDemo = () => {
    openConfirmation(confirmUnsavedChanges(
      () => announce('Changes saved', 'polite'),
      () => announce('Changes discarded', 'polite')
    ));
  };

  // Start onboarding tour
  const startOnboarding = () => {
    setOnboardingActive(true);
    setOnboardingStep(0);
    announce('Onboarding tour started', 'polite');
  };

  return (
    <PageTransition className={`min-h-screen ${darkModeClasses.bg.primary}`}>
      <Container maxWidth="7xl" padding={true}>
        
        {/* Header */}
        <FadeIn>
          <header className="text-center py-12">
            <div className="flex justify-center mb-4">
              <ScaleIn delay={0.2}>
                <div className="p-4 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full">
                  <SparklesIcon className="h-8 w-8 text-white" />
                </div>
              </ScaleIn>
            </div>
            <h1 className={`text-4xl font-bold mb-4 ${darkModeClasses.text.primary}`}>
              Micro-interactions & Polish
            </h1>
            <p className={`text-xl ${darkModeClasses.text.secondary} max-w-3xl mx-auto`}>
              Smooth animations, helpful empty states, progressive onboarding, 
              and confirmation dialogs that enhance user experience.
            </p>
          </header>
        </FadeIn>

        {/* Controls Section */}
        <SlideUp delay={0.3}>
          <section className={`mb-12 p-6 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}>
            <h2 className={`text-2xl font-semibold mb-6 ${darkModeClasses.text.primary}`}>
              Interactive Controls
            </h2>
            
            <ResponsiveGrid cols={{ xs: 1, md: 2, lg: 4 }} gap={4}>
              <InteractiveMotion>
                <AccessibleButton
                  ref={animationToggleRef}
                  variant={showAnimations ? "primary" : "outline"}
                  onClick={toggleAnimations}
                  icon={showAnimations ? <PauseIcon /> : <PlayIcon />}
                  fullWidth
                  ariaLabel={`${showAnimations ? 'Disable' : 'Enable'} animations`}
                >
                  {showAnimations ? 'Disable' : 'Enable'} Animations
                </AccessibleButton>
              </InteractiveMotion>

              <InteractiveMotion>
                <AccessibleButton
                  ref={onboardingButtonRef}
                  variant="secondary"
                  onClick={startOnboarding}
                  icon={<AcademicCapIcon />}
                  fullWidth
                  ariaLabel="Start onboarding tour"
                >
                  Start Tour
                </AccessibleButton>
              </InteractiveMotion>

              <InteractiveMotion>
                <AccessibleButton
                  ref={confirmationDemoRef}
                  variant="outline"
                  onClick={handleUnsavedChangesDemo}
                  icon={<DocumentPlusIcon />}
                  fullWidth
                  ariaLabel="Demo unsaved changes dialog"
                >
                  Unsaved Changes
                </AccessibleButton>
              </InteractiveMotion>

              <InteractiveMotion>
                <AccessibleButton
                  variant="ghost"
                  onClick={() => announce('Smooth micro-interaction activated!', 'polite')}
                  icon={<HeartIcon />}
                  fullWidth
                  ariaLabel="Test micro-interaction"
                >
                  Test Interaction
                </AccessibleButton>
              </InteractiveMotion>
            </ResponsiveGrid>
          </section>
        </SlideUp>

        {/* Animation Showcase */}
        <SafeAnimatePresence>
          {showAnimations && (
            <ScaleIn delay={0.4}>
              <section className="mb-12">
                <h2 className={`text-2xl font-semibold mb-6 ${darkModeClasses.text.primary}`}>
                  Smooth Animations
                </h2>
                
                <StaggerContainer>
                  <ResponsiveGrid cols={{ xs: 1, md: 2, lg: 3 }} gap={6}>
                    {[
                      { icon: RocketLaunchIcon, title: 'Page Transitions', description: 'Smooth page-to-page navigation' },
                      { icon: SparklesIcon, title: 'Micro-interactions', description: 'Delightful hover and click effects' },
                      { icon: AcademicCapIcon, title: 'Staggered Animations', description: 'Sequential element reveals' }
                    ].map((item, index) => (
                      <StaggerItem key={index}>
                        <InteractiveMotion>
                          <div className={`p-6 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary} h-full`}>
                            <item.icon className="h-8 w-8 text-primary-500 mb-4" />
                            <h3 className={`font-semibold text-lg mb-2 ${darkModeClasses.text.primary}`}>
                              {item.title}
                            </h3>
                            <p className={darkModeClasses.text.secondary}>
                              {item.description}
                            </p>
                          </div>
                        </InteractiveMotion>
                      </StaggerItem>
                    ))}
                  </ResponsiveGrid>
                </StaggerContainer>
              </section>
            </ScaleIn>
          )}
        </SafeAnimatePresence>

        {/* Empty States Demo */}
        <SlideUp delay={0.5}>
          <section className="mb-12">
            <h2 className={`text-2xl font-semibold mb-6 ${darkModeClasses.text.primary}`}>
              Empty States
            </h2>
            
            {/* Empty State Type Selector */}
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {emptyStateTypes.map(type => (
                  <InteractiveMotion key={type.key}>
                    <AccessibleButton
                      variant={selectedEmptyState === type.key ? "primary" : "outline"}
                      size="sm"
                      onClick={() => setSelectedEmptyState(type.key)}
                      ariaLabel={`Show ${type.label} empty state`}
                    >
                      {type.label}
                    </AccessibleButton>
                  </InteractiveMotion>
                ))}
              </div>
            </div>

            {/* Empty State Display */}
            <div 
              ref={emptyStateRef}
              className={`rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}
            >
              <SafeAnimatePresence mode="wait">
                <EmptyState
                  key={selectedEmptyState}
                  type={selectedEmptyState}
                  onAction={() => announce(`${selectedEmptyState} action triggered`, 'polite')}
                  secondaryActionText={selectedEmptyState === 'error' ? 'Get Help' : undefined}
                  onSecondaryAction={selectedEmptyState === 'error' ? () => announce('Help requested', 'polite') : undefined}
                />
              </SafeAnimatePresence>
            </div>
          </section>
        </SlideUp>

        {/* Demo Items with Confirmation */}
        <SlideUp delay={0.6}>
          <section className="mb-12">
            <h2 className={`text-2xl font-semibold mb-6 ${darkModeClasses.text.primary}`}>
              Confirmation Dialogs
            </h2>
            
            {demoItems.length > 0 ? (
              <div className="space-y-3">
                {demoItems.map((item, index) => (
                  <ScaleIn key={item.id} delay={Math.max(0, (index || 0) * 0.1)}>
                    <div className={`flex items-center justify-between p-4 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}>
                      <div className="flex items-center gap-3">
                        {item.type === 'property' && <HomeIcon className="h-5 w-5 text-primary-500" />}
                        {item.type === 'tenant' && <UserPlusIcon className="h-5 w-5 text-green-500" />}
                        {item.type === 'document' && <DocumentPlusIcon className="h-5 w-5 text-blue-500" />}
                        <span className={darkModeClasses.text.primary}>{item.name}</span>
                      </div>
                      
                      <InteractiveMotion>
                        <AccessibleButton
                          variant="danger"
                          size="sm"
                          onClick={() => handleDeleteItem(item)}
                          icon={<TrashIcon />}
                          ariaLabel={`Delete ${item.name}`}
                        >
                          Delete
                        </AccessibleButton>
                      </InteractiveMotion>
                    </div>
                  </ScaleIn>
                ))}
              </div>
            ) : (
              <EmptyState
                type="properties"
                title="All Demo Items Deleted"
                description="You've successfully tested the confirmation dialogs! All demo items have been removed."
                actionText="Reset Demo"
                onAction={() => {
                  setDemoItems([
                    { id: Date.now() + 1, name: 'Demo Property 1', type: 'property' },
                    { id: Date.now() + 2, name: 'Demo Tenant 1', type: 'tenant' },
                    { id: Date.now() + 3, name: 'Demo Document 1', type: 'document' }
                  ]);
                  announce('Demo items restored', 'polite');
                }}
              />
            )}
          </section>
        </SlideUp>

        {/* Features Summary */}
        <FadeIn delay={0.7}>
          <section className={`p-8 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}>
            <h2 className={`text-2xl font-semibold mb-6 text-center ${darkModeClasses.text.primary}`}>
              Polish Features Implemented
            </h2>
            
            <ResponsiveGrid cols={{ xs: 1, md: 2 }} gap={8}>
              <div>
                <h3 className={`font-semibold text-lg mb-4 ${darkModeClasses.text.primary}`}>
                  Smooth Animations
                </h3>
                <ul className={`space-y-2 ${darkModeClasses.text.secondary}`}>
                  <li>• Framer Motion integration with reduced motion support</li>
                  <li>• Page transitions and micro-interactions</li>
                  <li>• Staggered animations for content reveals</li>
                  <li>• Hover and focus effects</li>
                  <li>• Loading and state transitions</li>
                </ul>
              </div>

              <div>
                <h3 className={`font-semibold text-lg mb-4 ${darkModeClasses.text.primary}`}>
                  User Experience
                </h3>
                <ul className={`space-y-2 ${darkModeClasses.text.secondary}`}>
                  <li>• Contextual empty states with actions</li>
                  <li>• Progressive disclosure onboarding</li>
                  <li>• Confirmation dialogs for critical actions</li>
                  <li>• Accessibility-first design</li>
                  <li>• Responsive and mobile-optimized</li>
                </ul>
              </div>
            </ResponsiveGrid>
          </section>
        </FadeIn>

      </Container>

      {/* Onboarding Tour */}
      <OnboardingTour
        steps={onboardingSteps}
        isActive={onboardingActive}
        currentStep={onboardingStep}
        onStepChange={setOnboardingStep}
        onComplete={() => {
          setOnboardingActive(false);
          announce('Onboarding tour completed! You now know all about micro-interactions.', 'polite');
        }}
        onSkip={() => {
          setOnboardingActive(false);
          announce('Onboarding tour skipped', 'polite');
        }}
      />

      {/* Managed Confirmation Dialog */}
      <ManagedConfirmationDialog />
    </PageTransition>
  );
};

// Main component with accessibility provider
const MicroInteractionsDemo = () => {
  return (
    <AccessibilityProvider>
      <MicroInteractionsDemoContent />
    </AccessibilityProvider>
  );
};

export default MicroInteractionsDemo; 