import React, { useState, useMemo, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useBreakpoint } from '../../design-system';
import { useAuth } from '../../context/AuthContext';
import { TouchButton } from '../touch/TouchOptimized';
import {
  HomeIcon,
  BuildingOfficeIcon,
  WrenchScrewdriverIcon,
  CreditCardIcon,
  ChartBarIcon,
  UserCircleIcon,
  BellIcon,
  MagnifyingGlassIcon,
  Bars3Icon,
  XMarkIcon,
  CalendarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CogIcon
} from '@heroicons/react/24/outline';

// Navigation configuration by user role
const navigationConfig = {
  landlord: {
    primary: [
      { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, path: '/landlord/dashboard' },
      { id: 'properties', label: 'Properties', icon: BuildingOfficeIcon, path: '/landlord/properties' },
      { id: 'maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon, path: '/landlord/maintenance' },
      { id: 'tenants', label: 'Tenants', icon: UserCircleIcon, path: '/landlord/tenants' }
    ],
    secondary: [
      { id: 'payments', label: 'Payments', icon: CreditCardIcon, path: '/landlord/payments' },
      { id: 'analytics', label: 'Analytics', icon: ChartBarIcon, path: '/landlord/analytics' },
      { id: 'documents', label: 'Documents', icon: DocumentTextIcon, path: '/landlord/documents' }
    ],
    contextual: {
      '/landlord/properties': [
        { id: 'add-property', label: 'Add Property', action: 'add-property' },
        { id: 'bulk-import', label: 'Bulk Import', action: 'bulk-import' }
      ],
      '/landlord/maintenance': [
        { id: 'new-request', label: 'New Request', action: 'new-request' },
        { id: 'emergency', label: 'Emergency', action: 'emergency' }
      ]
    }
  },
  tenant: {
    primary: [
      { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, path: '/tenant/dashboard' },
      { id: 'maintenance', label: 'Maintenance', icon: WrenchScrewdriverIcon, path: '/tenant/maintenance' },
      { id: 'payments', label: 'Payments', icon: CreditCardIcon, path: '/tenant/payments' }
    ],
    secondary: [
      { id: 'lease', label: 'Lease', icon: DocumentTextIcon, path: '/tenant/lease' },
      { id: 'communication', label: 'Messages', icon: ChatBubbleLeftRightIcon, path: '/tenant/messages' }
    ],
    contextual: {
      '/tenant/maintenance': [
        { id: 'new-request', label: 'New Request', action: 'new-request' },
        { id: 'emergency', label: 'Emergency', action: 'emergency' }
      ],
      '/tenant/payments': [
        { id: 'pay-rent', label: 'Pay Rent', action: 'pay-rent' },
        { id: 'payment-history', label: 'History', action: 'payment-history' }
      ]
    }
  },
  contractor: {
    primary: [
      { id: 'dashboard', label: 'Dashboard', icon: HomeIcon, path: '/contractor/dashboard' },
      { id: 'jobs', label: 'Jobs', icon: WrenchScrewdriverIcon, path: '/contractor/jobs' },
      { id: 'schedule', label: 'Schedule', icon: CalendarIcon, path: '/contractor/schedule' }
    ],
    secondary: [
      { id: 'earnings', label: 'Earnings', icon: CreditCardIcon, path: '/contractor/earnings' },
      { id: 'profile', label: 'Profile', icon: UserCircleIcon, path: '/contractor/profile' },
      { id: 'communication', label: 'Messages', icon: ChatBubbleLeftRightIcon, path: '/contractor/messages' }
    ],
    contextual: {
      '/contractor/jobs': [
        { id: 'browse-jobs', label: 'Browse Jobs', action: 'browse-jobs' },
        { id: 'my-bids', label: 'My Bids', action: 'my-bids' }
      ],
      '/contractor/schedule': [
        { id: 'add-availability', label: 'Add Availability', action: 'add-availability' },
        { id: 'time-off', label: 'Request Time Off', action: 'time-off' }
      ]
    }
  }
};

// Bottom tab navigation for mobile
const BottomTabNavigation = ({ items, contextualActions, currentPath, onAction }) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 safe-area-pb z-50">
      <div className="flex items-center justify-around px-2 py-1">
        {items.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.path);
          
          return (
            <TouchButton
              key={item.id}
              variant="ghost"
              size="sm"
              haptic={true}
              className={`
                flex-1 flex flex-col items-center py-2 px-1 min-h-[44px]
                ${isActive ? 'text-blue-600' : 'text-gray-500'}
              `}
              onClick={() => window.location.href = item.path}
            >
              <Icon className="w-5 h-5 mb-1" />
              <span className="text-xs font-medium">{item.label}</span>
            </TouchButton>
          );
        })}
        
        {/* Contextual action button */}
        {contextualActions.length > 0 && (
          <TouchButton
            variant="primary"
            size="sm"
            haptic={true}
            className="flex-1 flex flex-col items-center py-2 px-1 min-h-[44px]"
            onClick={() => onAction(contextualActions[0])}
          >
            <div className="w-5 h-5 mb-1 flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
            <span className="text-xs font-medium">{contextualActions[0].label}</span>
          </TouchButton>
        )}
      </div>
    </div>
  );
};

// Collapsible side navigation for tablet
const CollapsibleSideNavigation = ({ 
  primaryItems, 
  secondaryItems, 
  contextualItems, 
  currentPath,
  onAction 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  return (
    <div className={`
      fixed left-0 top-0 h-full bg-white border-r border-gray-200 z-40 transition-all duration-300
      ${isCollapsed ? 'w-16' : 'w-64'}
    `}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">Navigation</h2>
        )}
        <TouchButton
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          <Bars3Icon className="w-5 h-5" />
        </TouchButton>
      </div>
      
      {/* Primary navigation */}
      <div className="p-2 border-b border-gray-100">
        {!isCollapsed && (
          <h3 className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
            Main
          </h3>
        )}
        {primaryItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath.startsWith(item.path);
          
          return (
            <TouchButton
              key={item.id}
              variant={isActive ? 'primary' : 'ghost'}
              size="sm"
              className={`
                w-full justify-start mb-1
                ${isCollapsed ? 'px-3' : 'px-3 py-2'}
              `}
              onClick={() => window.location.href = item.path}
            >
              <Icon className="w-5 h-5" />
              {!isCollapsed && <span className="ml-3">{item.label}</span>}
            </TouchButton>
          );
        })}
      </div>
      
      {/* Secondary navigation */}
      {secondaryItems.length > 0 && (
        <div className="p-2 border-b border-gray-100">
          {!isCollapsed && (
            <h3 className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
              More
            </h3>
          )}
          {secondaryItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentPath.startsWith(item.path);
            
            return (
              <TouchButton
                key={item.id}
                variant={isActive ? 'primary' : 'ghost'}
                size="sm"
                className={`
                  w-full justify-start mb-1
                  ${isCollapsed ? 'px-3' : 'px-3 py-2'}
                `}
                onClick={() => window.location.href = item.path}
              >
                <Icon className="w-5 h-5" />
                {!isCollapsed && <span className="ml-3">{item.label}</span>}
              </TouchButton>
            );
          })}
        </div>
      )}
      
      {/* Contextual actions */}
      {contextualItems.length > 0 && !isCollapsed && (
        <div className="p-2">
          <h3 className="px-3 py-2 text-sm font-medium text-gray-500 uppercase tracking-wide">
            Quick Actions
          </h3>
          {contextualItems.map((item) => (
            <TouchButton
              key={item.id}
              variant="outline"
              size="sm"
              className="w-full justify-start mb-1 px-3 py-2"
              onClick={() => onAction(item)}
            >
              {item.label}
            </TouchButton>
          ))}
        </div>
      )}
    </div>
  );
};

// Full navigation layout for desktop
const FullNavigationLayout = ({ 
  primaryItems, 
  secondaryItems, 
  contextualItems, 
  currentPath,
  onAction 
}) => {
  return (
    <div className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Primary navigation */}
          <div className="flex items-center space-x-8">
            {primaryItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath.startsWith(item.path);
              
              return (
                <TouchButton
                  key={item.id}
                  variant={isActive ? 'primary' : 'ghost'}
                  size="sm"
                  className="flex items-center space-x-2"
                  onClick={() => window.location.href = item.path}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </TouchButton>
              );
            })}
          </div>
          
          {/* Secondary and contextual actions */}
          <div className="flex items-center space-x-4">
            {/* Contextual actions */}
            {contextualItems.map((item) => (
              <TouchButton
                key={item.id}
                variant="outline"
                size="sm"
                onClick={() => onAction(item)}
              >
                {item.label}
              </TouchButton>
            ))}
            
            {/* Secondary navigation dropdown */}
            {secondaryItems.length > 0 && (
              <div className="relative">
                <TouchButton
                  variant="ghost"
                  size="sm"
                  className="flex items-center space-x-1"
                >
                  <Bars3Icon className="w-5 h-5" />
                  <span>More</span>
                </TouchButton>
                {/* Dropdown would be implemented here */}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Main progressive navigation component
export const ProgressiveNavigation = ({ onAction }) => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const { isMobile, isTablet } = useBreakpoint();
  
  const userRole = userProfile?.userType || 'tenant';
  const currentPath = location.pathname;
  
  // Get navigation configuration for current user role
  const config = navigationConfig[userRole] || navigationConfig.tenant;
  
  // Get contextual items for current path
  const contextualItems = useMemo(() => {
    return config.contextual[currentPath] || [];
  }, [config, currentPath]);
  
  // Handle action execution
  const handleAction = useCallback((action) => {
    if (onAction) {
      onAction(action);
    } else {
      console.log('Action triggered:', action);
      // Default action handling
      switch (action.action) {
        case 'add-property':
          window.location.href = '/landlord/properties/new';
          break;
        case 'new-request':
          window.location.href = '/maintenance/new';
          break;
        case 'pay-rent':
          window.location.href = '/tenant/payments/pay';
          break;
        default:
          console.log('Unhandled action:', action);
      }
    }
  }, [onAction]);
  
  // Progressive navigation based on screen size
  if (isMobile) {
    return (
      <BottomTabNavigation
        items={config.primary}
        contextualActions={contextualItems}
        currentPath={currentPath}
        onAction={handleAction}
      />
    );
  }
  
  if (isTablet) {
    return (
      <CollapsibleSideNavigation
        primaryItems={config.primary}
        secondaryItems={config.secondary}
        contextualItems={contextualItems}
        currentPath={currentPath}
        onAction={handleAction}
      />
    );
  }
  
  return (
    <FullNavigationLayout
      primaryItems={config.primary}
      secondaryItems={config.secondary}
      contextualItems={contextualItems}
      currentPath={currentPath}
      onAction={handleAction}
    />
  );
};

// Hook for getting navigation state
export const useNavigation = () => {
  const { userProfile } = useAuth();
  const location = useLocation();
  const userRole = userProfile?.userType || 'tenant';
  const currentPath = location.pathname;
  
  const config = navigationConfig[userRole] || navigationConfig.tenant;
  const contextualItems = config.contextual[currentPath] || [];
  
  return {
    userRole,
    currentPath,
    primaryItems: config.primary,
    secondaryItems: config.secondary,
    contextualItems,
    config
  };
};

// Navigation context provider (optional)
export const NavigationProvider = ({ children }) => {
  const navigation = useNavigation();
  
  return (
    <NavigationContext.Provider value={navigation}>
      {children}
    </NavigationContext.Provider>
  );
};

export default ProgressiveNavigation; 