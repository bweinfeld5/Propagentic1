import React, { lazy, Suspense } from 'react';
import LoadingFallback from '../components/ui/LoadingFallback';

// Performance monitoring helper
const trackComponentLoad = (componentName, startTime) => {
  const loadTime = performance.now() - startTime;
  
  // Log to analytics service
  if (window.gtag) {
    window.gtag('event', 'component_load', {
      component_name: componentName,
      load_time: Math.round(loadTime),
      custom_map: { metric1: loadTime }
    });
  }
  
  console.log(`[Performance] ${componentName} loaded in ${loadTime.toFixed(2)}ms`);
};

// Enhanced lazy loader with monitoring
const createLazyComponent = (componentName, importFunction, fallbackType = 'default') => {
  const LazyComponent = lazy(async () => {
    const startTime = performance.now();
    
    try {
      const component = await importFunction();
      trackComponentLoad(componentName, startTime);
      return component;
    } catch (error) {
      console.error(`[LazyLoad] Failed to load ${componentName}:`, error);
      
      // Track loading errors
      if (window.gtag) {
        window.gtag('event', 'component_load_error', {
          component_name: componentName,
          error_message: error.message
        });
      }
      
      // Return error component or rethrow
      throw error;
    }
  });

  // Return component wrapped with Suspense
  return React.forwardRef((props, ref) => (
    <Suspense fallback={<LoadingFallback type={fallbackType} title={`Loading ${componentName}...`} />}>
      <LazyComponent {...props} ref={ref} />
    </Suspense>
  ));
};

// Lazy-loaded components with performance tracking
export const LazyComponents = {
  // Payment System Components
  EscrowDashboard: createLazyComponent(
    'EscrowDashboard',
    () => import('../components/payments/EscrowDashboard'),
    'dashboard'
  ),
  
  PaymentMethodManager: createLazyComponent(
    'PaymentMethodManager',
    () => import('../components/payments/PaymentMethodManager'),
    'form'
  ),
  
  DisputeManager: createLazyComponent(
    'DisputeManager',
    () => import('../components/payments/DisputeManager'),
    'table'
  ),
  
  CreateEscrowModal: createLazyComponent(
    'CreateEscrowModal',
    () => import('../components/payments/CreateEscrowModal'),
    'form'
  ),
  
  ReleaseRequestModal: createLazyComponent(
    'ReleaseRequestModal',
    () => import('../components/payments/ReleaseRequestModal'),
    'form'
  ),
  
  // Analytics Components
  AnalyticsDashboard: createLazyComponent(
    'AnalyticsDashboard',
    () => import('../components/analytics/AnalyticsDashboard'),
    'dashboard'
  ),
  
  // Legal and Privacy Components
  LegalDashboard: createLazyComponent(
    'LegalDashboard',
    () => import('../components/legal/LegalDashboard'),
    'dashboard'
  ),
  
  PrivacyDashboard: createLazyComponent(
    'PrivacyDashboard',
    () => import('../components/privacy/PrivacyDashboard'),
    'dashboard'
  ),
  
  // Property Management Components
  BulkPropertyImport: createLazyComponent(
    'BulkPropertyImport',
    () => import('../components/landlord/BulkPropertyImport'),
    'form'
  )
};

// Route-based lazy components
export const LazyPages = {
  PaymentsPage: createLazyComponent(
    'PaymentsPage',
    () => import('../pages/PaymentsPage'),
    'dashboard'
  ),
  
  AnalyticsPage: createLazyComponent(
    'AnalyticsPage',
    () => import('../pages/AnalyticsPage'),
    'dashboard'
  ),
  
  LegalPage: createLazyComponent(
    'LegalPage',
    () => import('../pages/LegalPage'),
    'dashboard'
  )
};

// Preload components for better UX
export const preloadComponent = async (componentName) => {
  const startTime = performance.now();
  
  try {
    switch (componentName) {
      case 'EscrowDashboard':
        await import('../components/payments/EscrowDashboard');
        break;
      case 'PaymentMethodManager':
        await import('../components/payments/PaymentMethodManager');
        break;
      case 'AnalyticsDashboard':
        await import('../components/analytics/AnalyticsDashboard');
        break;
      default:
        console.warn(`[Preload] Unknown component: ${componentName}`);
        return;
    }
    
    trackComponentLoad(`${componentName} (preloaded)`, startTime);
  } catch (error) {
    console.error(`[Preload] Failed to preload ${componentName}:`, error);
  }
};

// Preload critical components on user interaction
export const preloadCriticalComponents = () => {
  // Preload likely next components based on user role
  const userRole = localStorage.getItem('userRole');
  
  if (userRole === 'landlord') {
    preloadComponent('EscrowDashboard');
    preloadComponent('BulkPropertyImport');
  } else if (userRole === 'contractor') {
    preloadComponent('PaymentMethodManager');
  }
  
  // Preload analytics for all users
  setTimeout(() => preloadComponent('AnalyticsDashboard'), 2000);
};

export default LazyComponents; 