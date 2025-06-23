import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Steps } from 'intro.js-react'; // Import the Steps component
import 'intro.js/introjs.css'; // Import default Intro.js CSS
// Optional: Import a theme CSS
// import 'intro.js/themes/introjs-modern.css';
import Button from './Button'; // Import Button component
import { XMarkIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline'; // Import XMarkIcon and QuestionMarkCircleIcon
import { SafeMotion, AnimatePresence } from "../shared/SafeMotion";

/**
 * AppTourGuide Component (using intro.js-react)
 * 
 * A customizable tour guide component using Intro.js via its React wrapper.
 */
const AppTourGuide = ({
  steps: propSteps = [],
  isEnabled = false,
  onComplete,
  onExit, // Use onExit for both skip and close
  onSkip, // Note: Intro.js primarily uses onExit
  autoStart = false,
  showSkipButton = true,
  showProgress = true, // Intro.js option
  showBullets = true, // Intro.js option
  showButtons = true, // Intro.js option
  keyboardNavigation = true, // Intro.js option
  primaryColor, // Not directly used by intro.js-react, styling via CSS
  textColor, // Not directly used
  backdropColor, // Not directly used (uses overlayOpacity option)
  overlayOpacity = 0.5, // Example: Control Intro.js overlay opacity
  className = '' // For the callout button
}) => {

  // State to control whether the tour steps are enabled (visible)
  const [stepsEnabled, setStepsEnabled] = useState(isEnabled && autoStart);
  // State to control the initial step index when the tour starts
  const [initialStep, setInitialStep] = useState(0);
  // State for the callout button visibility
  const [showStartButton, setShowStartButton] = useState(isEnabled && !autoStart);

  // Map propSteps to the format expected by intro.js-react (element, intro, position, etc.)
  // This assumes propSteps already mostly matches the required format.
  // If not, a mapping function would be needed here.
  const introJsSteps = propSteps.map(step => ({
      element: step.target, // Map target to element
      intro: step.content,   // Map content to intro
      position: step.placement, // Map placement to position
      title: step.title, // Pass title if it exists
      // Add other intro.js step options if needed
      tooltipClass: step.tooltipClass, // Example
      highlightClass: step.highlightClass, // Example
  }));

  // Effect to handle changes in the main isEnabled prop
  useEffect(() => {
      if (isEnabled) {
          if (autoStart) {
              setInitialStep(0); // Reset to start
              setStepsEnabled(true);
              setShowStartButton(false);
          } else {
              setShowStartButton(true);
              setStepsEnabled(false); // Ensure tour is not running if disabled
          }
      } else {
          setStepsEnabled(false);
          setShowStartButton(false);
      }
  }, [isEnabled, autoStart]);

  // Callback when the Intro.js tour is exited (via Esc, overlay click, Skip, or Done)
  const handleExit = useCallback((stepIndex) => {
      console.log('Intro.js exited at step:', stepIndex);
      setStepsEnabled(false);
      setShowStartButton(isEnabled && !autoStart); // Show button again if tour was enabled
      // Call the original onExit or onSkip prop passed to AppTourGuide
      if (onExit) onExit(stepIndex);
      if (onSkip) onSkip(stepIndex); // Call onSkip as well if provided
  }, [isEnabled, autoStart, onExit, onSkip]);

  // Callback when the Intro.js tour is completed (reaches the last step and clicks Done)
  const handleComplete = useCallback(() => {
      console.log('Intro.js tour completed');
      // State changes are handled by handleExit, which is always called
      if (onComplete) onComplete();
  }, [onComplete]);

  // Function to start the tour manually from the button
  const startTour = () => {
    setInitialStep(0); // Start from the beginning
    setStepsEnabled(true);
    setShowStartButton(false);
  };

  // Intro.js options object based on props
  const introJsOptions = {
      // tooltipPosition: position || 'bottom',
      // buttonLabel: 'Next',
      // doneLabel: 'Done',
      // nextLabel: 'Next',
      // prevLabel: 'Back',
      // skipLabel: 'Skip',
      exitOnEsc: true,
      exitOnOverlayClick: true,
      showProgress: showProgress,
      showBullets: showBullets,
      showButtons: showButtons,
      keyboardNavigation: keyboardNavigation,
      disableInteraction: false, // Allow interaction with highlighted elements?
      overlayOpacity: backdropColor ? parseFloat(backdropColor.split(',')[3] || overlayOpacity.toString()) : overlayOpacity,
      // Add more options as needed
  };

  // Callout button component using the new Button component
  const TourCallout = () => (
    <AnimatePresence>
      {showStartButton && (
        <SafeMotion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3 }}
          className={`fixed bottom-4 right-4 z-[10001] ${className}`} // High z-index
        >
          <Button
            variant="primary" // Use primary theme color
            size="md" // Example size
            onClick={startTour}
            icon={<QuestionMarkCircleIcon className="w-5 h-5" />} // Use a suitable icon
          >
            Take a tour
          </Button>
        </SafeMotion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      <Steps
        enabled={stepsEnabled}
        steps={introJsSteps}
        initialStep={initialStep}
        onExit={handleExit}
        onComplete={handleComplete}
        // Add other callbacks like onChange, onBeforeChange if needed
        // onChange={(nextStepIndex) => console.log('Changed to:', nextStepIndex)}
        options={introJsOptions}
        // Use a ref if direct access to introJs instance is needed
        // ref={stepsRef => (this.stepsRef = stepsRef)}
      />
      <TourCallout />
    </>
  );
};

// Update PropTypes to match intro.js-react where applicable
AppTourGuide.propTypes = {
  /** Array of tour steps (ensure properties match intro.js structure: element, intro, position, etc.) */
  steps: PropTypes.arrayOf(
    PropTypes.shape({
      target: PropTypes.string.isRequired, // Maps to introJs.element
      content: PropTypes.node.isRequired, // Maps to introJs.intro
      title: PropTypes.string, // Pass through
      placement: PropTypes.oneOf(['top', 'right', 'bottom', 'left', 'auto']), // Maps to introJs.position
      tooltipClass: PropTypes.string,
      highlightClass: PropTypes.string,
      // Add other potential step props
    })
  ).isRequired,
  /** Whether the tour is enabled (controls visibility) */
  isEnabled: PropTypes.bool,
  /** Callback when tour is fully completed (clicks Done on last step) */
  onComplete: PropTypes.func,
  /** Callback when tour is exited prematurely (Esc, Skip, Overlay Click, Close Button) */
  onExit: PropTypes.func,
  /** Kept for potential compatibility, but intro.js usually triggers onExit */
  onSkip: PropTypes.func,
  /** Whether to start the tour automatically when isEnabled becomes true */
  autoStart: PropTypes.bool,
  /** Whether to show the skip button (controlled by intro.js options/CSS) */
  showSkipButton: PropTypes.bool, // Note: Less direct control
  /** Whether to show progress indicator (intro.js option) */
  showProgress: PropTypes.bool,
  /** Whether to show navigation bullets (intro.js option) */
  showBullets: PropTypes.bool,
  /** Whether to show Next/Prev/Done buttons (intro.js option) */
  showButtons: PropTypes.bool,
  /** Allow keyboard navigation (intro.js option) */
  keyboardNavigation: PropTypes.bool,
  /** Primary color (Used for custom CSS styling if needed) */
  primaryColor: PropTypes.string,
  /** Text color (Used for custom CSS styling if needed) */
  textColor: PropTypes.string,
  /** Backdrop color (Used to calculate overlayOpacity if needed) */
  backdropColor: PropTypes.string,
  /** Explicit Intro.js overlay opacity */
  overlayOpacity: PropTypes.number,
  /** Additional CSS class for the callout button */
  className: PropTypes.string,
};

export default AppTourGuide; 