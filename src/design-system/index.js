/**
 * PropAgentic Design System
 * Comprehensive design system for consistent UI/UX
 */

// Export all design tokens
export * from './tokens';
export { default as tokens } from './tokens';

// Export responsive utilities
export * from './responsive';
export { default as responsive } from './responsive';

// Export loading states
export * from './loading-states';
export { default as loadingStates } from './loading-states';

// Export dark mode utilities
export * from './dark-mode';
export { default as darkMode } from './dark-mode';

// Export accessibility utilities
export * from './accessibility';
export { default as accessibility } from './accessibility';

// Design system version
export const DESIGN_SYSTEM_VERSION = '1.0.0';

// Design system configuration
export const designSystemConfig = {
  // Enable/disable features
  features: {
    darkMode: true,
    animations: true,
    responsive: true,
    accessibility: true,
  },
  
  // Default component sizes
  defaultSizes: {
    button: 'md',
    input: 'md',
    select: 'md',
    card: 'md',
    modal: 'md',
  },
  
  // Animation preferences
  animations: {
    duration: 'normal',
    easing: 'easeInOut',
    reducedMotion: 'respectPreference',
  },
  
  // Accessibility preferences
  accessibility: {
    focusRingWidth: '2px',
    focusRingOffset: '2px',
    minTouchTarget: '44px',
    highContrast: 'auto',
  },
};

// Quick access to commonly used items
export { colors, typography, spacing, shadows, borderRadius } from './tokens';
export { useBreakpoint, useMediaQuery, Container, ResponsiveGrid } from './responsive';
export { Skeleton, Spinner, LoadingState } from './loading-states';
export { useTheme, ThemeToggle, darkModeClasses } from './dark-mode';
export { 
  useKeyboardNavigation, 
  useFocusManagement, 
  useScreenReader,
  useAccessibility,
  AccessibilityProvider,
  SkipLink,
  FocusRing,
  getAriaAttributes 
} from './accessibility';

// Basic UI Components
export { default as Button } from '../components/ui/Button';
export { default as Card } from '../components/ui/Card';
export { default as CheckboxGroup } from '../components/ui/CheckboxGroup';
export { default as FileUpload } from '../components/ui/FileUpload';
export { default as Input } from '../components/ui/Input';
export { default as Select } from '../components/ui/Select';
export { default as TextArea } from '../components/ui/TextArea';
export { default as StatusPill } from '../components/ui/StatusPill';

// Accessible UI Components
export { default as AccessibleButton } from '../components/ui/AccessibleButton';
export { default as AccessibleInput } from '../components/ui/AccessibleInput';
export { default as AccessibleModal } from '../components/ui/AccessibleModal';

// Navigation Components
export { 
  default as Tabs, 
  TabList, 
  Tab, 
  TabPanels, 
  TabPanel 
} from '../components/ui/Tabs';

// Micro-interactions & Polish Components
export { default as EmptyState } from '../components/ui/EmptyState';
export { default as OnboardingTooltip, OnboardingTour } from '../components/ui/OnboardingTooltip';
export { 
  default as ConfirmationDialog, 
  useConfirmationDialog, 
  confirmDelete, 
  confirmUnsavedChanges, 
  confirmDestructive 
} from '../components/ui/ConfirmationDialog';

// Animation System
export {
  SafeMotion,
  PageTransition,
  FadeIn,
  SlideUp,
  ScaleIn,
  StaggerContainer,
  StaggerItem,
  InteractiveMotion,
  SafeAnimatePresence,
  motionVariants
} from '../components/ui/SafeMotion';

// Utility function to combine classes
export const cx = (...classes) => {
  return classes.filter(Boolean).join(' ');
};

// Utility function to create consistent component classes
export const createComponentClasses = (baseClasses, variants = {}, conditions = {}) => {
  const classes = [baseClasses];
  
  // Add variant classes
  Object.entries(variants).forEach(([key, value]) => {
    if (value && conditions[key]) {
      classes.push(conditions[key][value]);
    }
  });
  
  return cx(...classes);
};

// Export design system documentation
export const designSystemDocs = {
  gettingStarted: `
    The PropAgentic Design System provides a comprehensive set of design tokens,
    utilities, and components for building consistent user interfaces.
    
    Import what you need:
    import { colors, spacing, useTheme } from '@/design-system';
  `,
  
  tokens: `
    Design tokens are the visual design atoms of the design system.
    They include colors, typography, spacing, shadows, and more.
    
    Example usage:
    - Colors: colors.brand.primary
    - Spacing: spacing[4] (16px)
    - Typography: typography.fontSize.lg
  `,
  
  responsive: `
    Responsive utilities help build mobile-first, adaptive layouts.
    
    Hooks:
    - useBreakpoint(): Get current breakpoint info
    - useMediaQuery(): Check specific media queries
    
    Components:
    - Container: Responsive container with max-width
    - ResponsiveGrid: Grid with responsive columns
  `,
  
  darkMode: `
    Dark mode is fully supported with automatic theme detection.
    
    Usage:
    - Wrap app with ThemeProvider
    - Use useTheme() hook for theme state
    - Apply darkModeClasses for consistent styling
  `,
  
  loadingStates: `
    Loading states provide consistent feedback during async operations.
    
    Components:
    - Skeleton: Placeholder for content
    - Spinner: Loading spinner
    - LoadingState: Wrapper with loading/error/empty states
  `,
  
  accessibility: `
    Comprehensive accessibility features for WCAG 2.1 AA compliance.
    
    Hooks:
    - useKeyboardNavigation(): Enhanced keyboard handling
    - useFocusManagement(): Focus trapping and restoration
    - useScreenReader(): Screen reader announcements
    - useAccessibility(): Complete accessibility context
    
    Components:
    - AccessibilityProvider: Context provider for app
    - SkipLink: Skip navigation for keyboard users
    - FocusRing: Consistent focus indicators
    - AccessibleButton: Fully accessible button
    - AccessibleInput: Accessible form input
    - AccessibleModal: Modal with focus trapping
  `,
  
  microInteractions: `
    Smooth animations and polish features that enhance user experience.
    
    Animation Components:
    - SafeMotion: Base motion wrapper with accessibility support
    - PageTransition: Smooth page-to-page transitions
    - FadeIn/SlideUp/ScaleIn: Common entrance animations
    - StaggerContainer/StaggerItem: Sequential animations
    - InteractiveMotion: Hover and tap animations
    - SafeAnimatePresence: Presence animations with reduced motion support
    
    Polish Components:
    - EmptyState: Helpful guidance when no data is available
    - OnboardingTooltip/OnboardingTour: Progressive disclosure system
    - ConfirmationDialog: Prevent accidental critical actions
    
    Features:
    - Respects user motion preferences
    - Maintains accessibility standards
    - Smooth, performant animations
    - Contextual empty states for property management
    - Step-by-step onboarding system
    - Smart confirmation dialogs with text verification
  `,
};

// Property Management Components
export { default as PropertyForm } from '../components/landlord/PropertyForm';
export { default as PropertyList } from '../components/landlord/PropertyList';
export { default as PropertyDetails } from '../components/landlord/PropertyDetails';
export { default as PropertyDashboard } from '../components/landlord/PropertyDashboard';

// Default export for convenience
export default {
  tokens,
  responsive,
  loadingStates,
  darkMode,
  accessibility,
  cx,
  createComponentClasses,
  config: designSystemConfig,
  docs: designSystemDocs,
  version: DESIGN_SYSTEM_VERSION,
}; 