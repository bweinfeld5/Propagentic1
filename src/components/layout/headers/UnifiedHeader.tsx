import React from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useLocation } from 'react-router-dom';
import MarketingHeader from './MarketingHeader';
import AppHeader from './AppHeader';
import MinimalHeader from './MinimalHeader';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';

interface UnifiedHeaderProps {
  variant?: 'auto' | 'marketing' | 'app' | 'minimal';
  context?: string;
  className?: string;
}

/**
 * UnifiedHeader - Single header component that handles all application states
 * 
 * Features:
 * - Auto-detects appropriate variant based on auth state and route
 * - Progressive disclosure for authenticated users
 * - Consistent design system across all variants
 * - Mobile-first responsive design
 * 
 * Variants:
 * - marketing: Public website header with glassmorphism
 * - app: Authenticated app header with role-based navigation
 * - minimal: Auth pages and onboarding flows
 */
const UnifiedHeader: React.FC<UnifiedHeaderProps> = ({ 
  variant = 'auto', 
  context,
  className = '' 
}) => {
  const { currentUser, userProfile } = useAuth();
  const location = useLocation();

  // Auto-detect variant based on current state
  const getHeaderVariant = (): 'marketing' | 'app' | 'minimal' => {
    if (variant !== 'auto') return variant;

    // Auth pages get minimal header
    if (location.pathname.startsWith('/auth')) {
      return 'minimal';
    }

    // Authenticated users get app header
    if (currentUser) {
      return 'app';
    }

    // Public pages get marketing header
    return 'marketing';
  };

  const headerVariant = getHeaderVariant();

  // Determine current section for contextual navigation
  const getCurrentSection = (): string => {
    const path = location.pathname;
    
    // Extract section from path
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/maintenance')) return 'maintenance';
    if (path.includes('/properties')) return 'properties';
    if (path.includes('/tenants')) return 'tenants';
    if (path.includes('/jobs')) return 'jobs';
    if (path.includes('/schedule')) return 'schedule';
    if (path.includes('/payments')) return 'payments';
    if (path.includes('/settings')) return 'settings';
    if (path.includes('/profile')) return 'profile';
    
    return context || 'general';
  };

  const currentSection = getCurrentSection();

  return (
    <UIComponentErrorBoundary componentName="UnifiedHeader">
      <div className={className}>
        {headerVariant === 'marketing' && (
          <MarketingHeader />
        )}
        
        {headerVariant === 'app' && (
          <AppHeader 
            userRole={userProfile?.userType || 'user'}
            currentSection={currentSection}
          />
        )}
        
        {headerVariant === 'minimal' && (
          <MinimalHeader />
        )}
      </div>
    </UIComponentErrorBoundary>
  );
};

export default UnifiedHeader;

// Export for convenience
export { UnifiedHeader }; 