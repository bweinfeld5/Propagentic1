/**
 * Accessibility Demo Page
 * Demonstrates WCAG 2.1 AA compliance features
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  AccessibilityProvider,
  useAccessibility,
  SkipLink,
  FocusRing,
  useKeyboardNavigation,
  useFocusManagement,
  useHighContrastMode,
  useReducedMotion 
} from '../design-system/accessibility';
import { Container, ResponsiveGrid, useBreakpoint } from '../design-system/responsive';
import { darkModeClasses } from '../design-system/dark-mode';
import AccessibleButton from '../components/ui/AccessibleButton';
import AccessibleInput from '../components/ui/AccessibleInput';
import AccessibleModal from '../components/ui/AccessibleModal';
import { accessibilityTestUtils } from '../test/accessibility/AccessibilityTestSuite';
import { 
  AdjustmentsHorizontalIcon, 
  EyeIcon, 
  KeyboardIcon, 
  SpeakerWaveIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  UserIcon,
  EnvelopeIcon,
  PhoneIcon
} from '@heroicons/react/24/outline';

const AccessibilityDemo = () => {
  const { announce, isHighContrast, toggleHighContrast } = useAccessibility();
  const { isMobile, isTablet, isDesktop } = useBreakpoint();
  const prefersReducedMotion = useReducedMotion();
  
  // Demo state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testResults, setTestResults] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [isMonitoring, setIsMonitoring] = useState(false);
  const monitoringObserver = useRef(null);

  // Focus management demo
  const { containerRef, focusFirst, focusNext, focusPrevious } = useFocusManagement({
    autoFocus: false,
    trapFocus: false
  });

  // Keyboard navigation demo
  const { handleKeyDown } = useKeyboardNavigation({
    onArrowRight: () => focusNext(),
    onArrowLeft: () => focusPrevious(),
    onEnter: () => announce('Enter key pressed', 'polite'),
    enabled: true,
    preventDefault: false
  });

  // Run accessibility tests
  const runTests = () => {
    const results = accessibilityTestUtils.quickCheck();
    setTestResults(results);
    announce('Accessibility test completed', 'polite');
  };

  // Toggle accessibility monitoring
  const toggleMonitoring = () => {
    if (isMonitoring) {
      accessibilityTestUtils.stopMonitoring(monitoringObserver.current);
      setIsMonitoring(false);
      announce('Accessibility monitoring stopped', 'polite');
    } else {
      monitoringObserver.current = accessibilityTestUtils.startMonitoring();
      setIsMonitoring(true);
      announce('Accessibility monitoring started', 'polite');
    }
  };

  // Form validation
  const validateForm = () => {
    const errors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (formData.phone && !/^\+?[\d\s-()]+$/.test(formData.phone)) {
      errors.phone = 'Phone number is invalid';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    }
    
    setFormErrors(errors);
    
    if (Object.keys(errors).length > 0) {
      announce(`Form has ${Object.keys(errors).length} errors`, 'assertive');
    }
    
    return Object.keys(errors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (validateForm()) {
      announce('Form submitted successfully!', 'polite');
      setFormData({ name: '', email: '', phone: '', message: '' });
    }
  };

  // Handle input changes
  const handleInputChange = (field) => (e) => {
    setFormData(prev => ({
      ...prev,
      [field]: e.target.value
    }));
    
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  useEffect(() => {
    return () => {
      if (monitoringObserver.current) {
        accessibilityTestUtils.stopMonitoring(monitoringObserver.current);
      }
    };
  }, []);

  return (
    <div className={`min-h-screen ${darkModeClasses.bg.primary}`}>
      {/* Skip Links */}
      <SkipLink href="#main" />
      <SkipLink href="#demo-form" className="left-32">Skip to Demo Form</SkipLink>
      <SkipLink href="#test-results" className="left-64">Skip to Test Results</SkipLink>

      <Container maxWidth="7xl" padding={true}>
        {/* Header */}
        <header className="py-8">
          <div className="text-center">
            <h1 className={`text-4xl font-bold mb-4 ${darkModeClasses.text.primary}`}>
              Accessibility Compliance Demo
            </h1>
            <p className={`text-xl ${darkModeClasses.text.secondary} max-w-3xl mx-auto`}>
              Demonstrates WCAG 2.1 AA compliance features including keyboard navigation,
              screen reader support, focus management, and automated testing.
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main id="main" className="space-y-12">
          
          {/* Accessibility Controls */}
          <section 
            aria-labelledby="controls-heading"
            className={`p-6 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}
          >
            <h2 id="controls-heading" className={`text-2xl font-semibold mb-6 ${darkModeClasses.text.primary}`}>
              Accessibility Controls
            </h2>
            
            <ResponsiveGrid cols={{ xs: 1, md: 2, lg: 4 }} gap={4}>
              <FocusRing>
                <AccessibleButton
                  variant={isHighContrast ? "primary" : "outline"}
                  onClick={toggleHighContrast}
                  ariaLabel="Toggle high contrast mode"
                  icon={<EyeIcon />}
                  fullWidth
                >
                  {isHighContrast ? 'Disable' : 'Enable'} High Contrast
                </AccessibleButton>
              </FocusRing>

              <AccessibleButton
                variant="outline"
                onClick={runTests}
                ariaLabel="Run accessibility tests"
                icon={<MagnifyingGlassIcon />}
                fullWidth
              >
                Run Tests
              </AccessibleButton>

              <AccessibleButton
                variant={isMonitoring ? "danger" : "outline"}
                onClick={toggleMonitoring}
                ariaLabel={isMonitoring ? "Stop monitoring" : "Start monitoring"}
                icon={<AdjustmentsHorizontalIcon />}
                fullWidth
              >
                {isMonitoring ? 'Stop' : 'Start'} Monitoring
              </AccessibleButton>

              <AccessibleButton
                variant="outline"
                onClick={() => setIsModalOpen(true)}
                ariaLabel="Open accessibility modal demo"
                icon={<KeyboardIcon />}
                fullWidth
              >
                Modal Demo
              </AccessibleButton>
            </ResponsiveGrid>
          </section>

          {/* Keyboard Navigation Demo */}
          <section aria-labelledby="keyboard-heading">
            <h2 id="keyboard-heading" className={`text-2xl font-semibold mb-6 ${darkModeClasses.text.primary}`}>
              Keyboard Navigation Demo
            </h2>
            
            <div 
              ref={containerRef}
              onKeyDown={handleKeyDown}
              className={`p-6 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}
              role="region"
              aria-label="Keyboard navigation demonstration"
              tabIndex={0}
            >
              <p className={`mb-4 ${darkModeClasses.text.secondary}`}>
                Use arrow keys to navigate between buttons. Press Enter to activate.
                Current device: <strong>{isMobile ? 'Mobile' : isTablet ? 'Tablet' : 'Desktop'}</strong>
                {prefersReducedMotion && <span className="ml-2 text-orange-600">(Reduced motion enabled)</span>}
              </p>
              
              <div className="flex flex-wrap gap-3">
                <AccessibleButton 
                  variant="primary" 
                  onClick={() => announce('First button activated', 'polite')}
                  ariaLabel="First navigation button"
                >
                  Button 1
                </AccessibleButton>
                <AccessibleButton 
                  variant="secondary" 
                  onClick={() => announce('Second button activated', 'polite')}
                  ariaLabel="Second navigation button"
                >
                  Button 2
                </AccessibleButton>
                <AccessibleButton 
                  variant="outline" 
                  onClick={() => announce('Third button activated', 'polite')}
                  ariaLabel="Third navigation button"
                >
                  Button 3
                </AccessibleButton>
                <AccessibleButton 
                  variant="ghost" 
                  onClick={() => announce('Fourth button activated', 'polite')}
                  ariaLabel="Fourth navigation button"
                >
                  Button 4
                </AccessibleButton>
              </div>
            </div>
          </section>

          {/* Accessible Form Demo */}
          <section aria-labelledby="form-heading">
            <h2 id="form-heading" className={`text-2xl font-semibold mb-6 ${darkModeClasses.text.primary}`}>
              Accessible Form Demo
            </h2>
            
            <form 
              id="demo-form"
              onSubmit={handleSubmit}
              className={`p-6 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}
              noValidate
            >
              <fieldset>
                <legend className={`text-lg font-medium mb-4 ${darkModeClasses.text.primary}`}>
                  Contact Information
                </legend>
                
                <ResponsiveGrid cols={{ xs: 1, md: 2 }} gap={6}>
                  <AccessibleInput
                    label="Full Name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange('name')}
                    error={formErrors.name}
                    required
                    fullWidth
                    leftIcon={<UserIcon />}
                    helpText="Enter your first and last name"
                    autoComplete="name"
                  />

                  <AccessibleInput
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    onChange={handleInputChange('email')}
                    error={formErrors.email}
                    required
                    fullWidth
                    leftIcon={<EnvelopeIcon />}
                    helpText="We'll never share your email"
                    autoComplete="email"
                  />

                  <AccessibleInput
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange('phone')}
                    error={formErrors.phone}
                    fullWidth
                    leftIcon={<PhoneIcon />}
                    helpText="Optional - for urgent matters only"
                    autoComplete="tel"
                  />

                  <div className="md:col-span-2">
                    <AccessibleInput
                      label="Message"
                      type="text"
                      value={formData.message}
                      onChange={handleInputChange('message')}
                      error={formErrors.message}
                      required
                      fullWidth
                      helpText="Please describe your inquiry"
                      maxLength={500}
                    />
                  </div>
                </ResponsiveGrid>

                <div className="mt-6 flex gap-4">
                  <AccessibleButton
                    type="submit"
                    variant="primary"
                    ariaLabel="Submit contact form"
                  >
                    Submit Form
                  </AccessibleButton>
                  
                  <AccessibleButton
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setFormData({ name: '', email: '', phone: '', message: '' });
                      setFormErrors({});
                      announce('Form cleared', 'polite');
                    }}
                    ariaLabel="Clear form data"
                  >
                    Clear Form
                  </AccessibleButton>
                </div>
              </fieldset>
            </form>
          </section>

          {/* Test Results */}
          {testResults && (
            <section 
              id="test-results"
              aria-labelledby="results-heading"
              role="region"
              aria-live="polite"
            >
              <h2 id="results-heading" className={`text-2xl font-semibold mb-6 ${darkModeClasses.text.primary}`}>
                Accessibility Test Results
              </h2>
              
              <div className={`p-6 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${darkModeClasses.text.success}`}>
                      {testResults.passed.length}
                    </div>
                    <div className={`text-sm ${darkModeClasses.text.secondary}`}>Tests Passed</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${darkModeClasses.text.warning}`}>
                      {testResults.warnings.length}
                    </div>
                    <div className={`text-sm ${darkModeClasses.text.secondary}`}>Warnings</div>
                  </div>
                  
                  <div className="text-center">
                    <div className={`text-3xl font-bold ${darkModeClasses.text.error}`}>
                      {testResults.failed.length}
                    </div>
                    <div className={`text-sm ${darkModeClasses.text.secondary}`}>Failed Tests</div>
                  </div>
                </div>

                {/* Detailed Results */}
                <div className="space-y-4">
                  {testResults.passed.map((result, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <CheckCircleIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className={`font-medium ${darkModeClasses.text.primary}`}>
                          {result.test}
                        </div>
                        <div className={`text-sm ${darkModeClasses.text.secondary}`}>
                          {result.message}
                        </div>
                      </div>
                    </div>
                  ))}

                  {testResults.warnings.map((result, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className={`font-medium ${darkModeClasses.text.primary}`}>
                          {result.test}
                        </div>
                        <div className={`text-sm ${darkModeClasses.text.secondary}`}>
                          {result.message}
                        </div>
                      </div>
                    </div>
                  ))}

                  {testResults.failed.map((result, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                      <div>
                        <div className={`font-medium ${darkModeClasses.text.primary}`}>
                          {result.test}
                        </div>
                        <div className={`text-sm ${darkModeClasses.text.secondary}`}>
                          {result.message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </section>
          )}

          {/* Accessibility Guidelines */}
          <section aria-labelledby="guidelines-heading">
            <h2 id="guidelines-heading" className={`text-2xl font-semibold mb-6 ${darkModeClasses.text.primary}`}>
              WCAG 2.1 AA Guidelines Implemented
            </h2>
            
            <ResponsiveGrid cols={{ xs: 1, md: 2, lg: 3 }} gap={6}>
              <div className={`p-6 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}>
                <KeyboardIcon className="h-8 w-8 text-blue-500 mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${darkModeClasses.text.primary}`}>
                  Keyboard Navigation
                </h3>
                <ul className={`text-sm ${darkModeClasses.text.secondary} space-y-1`}>
                  <li>• Tab order management</li>
                  <li>• Focus trapping in modals</li>
                  <li>• Arrow key navigation</li>
                  <li>• Enter/Space activation</li>
                  <li>• Escape key handling</li>
                </ul>
              </div>

              <div className={`p-6 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}>
                <SpeakerWaveIcon className="h-8 w-8 text-green-500 mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${darkModeClasses.text.primary}`}>
                  Screen Reader Support
                </h3>
                <ul className={`text-sm ${darkModeClasses.text.secondary} space-y-1`}>
                  <li>• ARIA labels and descriptions</li>
                  <li>• Live region announcements</li>
                  <li>• Semantic HTML structure</li>
                  <li>• Form label associations</li>
                  <li>• Status announcements</li>
                </ul>
              </div>

              <div className={`p-6 rounded-lg border ${darkModeClasses.border.default} ${darkModeClasses.bg.secondary}`}>
                <EyeIcon className="h-8 w-8 text-purple-500 mb-4" />
                <h3 className={`text-lg font-semibold mb-2 ${darkModeClasses.text.primary}`}>
                  Visual Accessibility
                </h3>
                <ul className={`text-sm ${darkModeClasses.text.secondary} space-y-1`}>
                  <li>• High contrast mode</li>
                  <li>• Focus indicators</li>
                  <li>• Color contrast compliance</li>
                  <li>• Reduced motion support</li>
                  <li>• Touch target sizing</li>
                </ul>
              </div>
            </ResponsiveGrid>
          </section>

        </main>
      </Container>

      {/* Accessible Modal Demo */}
      <AccessibleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Accessibility Modal Demo"
        description="This modal demonstrates proper focus management and keyboard navigation"
        size="lg"
        footer={
          <>
            <AccessibleButton
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              ariaLabel="Cancel and close modal"
            >
              Cancel
            </AccessibleButton>
            <AccessibleButton
              variant="primary"
              onClick={() => {
                announce('Modal action completed', 'polite');
                setIsModalOpen(false);
              }}
              ariaLabel="Confirm modal action"
            >
              Confirm
            </AccessibleButton>
          </>
        }
      >
        <div className="space-y-4">
          <p className={darkModeClasses.text.secondary}>
            This modal demonstrates:
          </p>
          <ul className={`list-disc list-inside space-y-2 ${darkModeClasses.text.secondary}`}>
            <li>Focus is trapped within the modal</li>
            <li>Focus returns to trigger element when closed</li>
            <li>Escape key closes the modal</li>
            <li>Screen reader announcements for state changes</li>
            <li>Proper ARIA attributes for accessibility</li>
          </ul>
          
          <AccessibleInput
            label="Test Input in Modal"
            type="text"
            placeholder="Try tabbing through this form"
            helpText="This demonstrates focus management within modals"
          />
        </div>
      </AccessibleModal>
    </div>
  );
};

// Wrapper with accessibility provider
const AccessibilityDemoPage = () => {
  return (
    <AccessibilityProvider>
      <AccessibilityDemo />
    </AccessibilityProvider>
  );
};

export default AccessibilityDemoPage; 