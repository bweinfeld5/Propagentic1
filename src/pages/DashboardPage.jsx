import React, { Suspense, useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import Dashboard from '../components/dashboard/Dashboard';
import PropertyDashboard from '../components/landlord/PropertyDashboard';
import LoadingFallback from '../components/ui/LoadingFallback';
import { preloadCriticalComponents } from '../utils/lazyComponents';
import cacheService from '../services/cacheService';
import { useBreakpoint, Container, ResponsiveGrid, ShowOn, HideOn, Tabs, TabList, Tab, TabPanels, TabPanel, useResponsiveLayout } from '../design-system';
import { LoadingState, Spinner } from '../design-system/loading-states';
import { PageTransition, FadeIn, SlideUp, StaggerContainer, StaggerItem } from '../design-system';
import { AdaptiveGrid, DashboardGrid, AdaptiveContainer, WidgetArea } from '../components/layout/AdaptiveGrid';
import { TouchButton } from '../components/touch/TouchOptimized';
import { ProgressiveNavigation } from '../components/navigation/ProgressiveNavigation';

const DashboardPage = () => {
  const { userProfile, currentUser } = useAuth();
  const { isMobile, isTablet, isDesktop, current } = useBreakpoint();
  const responsiveLayout = useResponsiveLayout();
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    // Preload critical components based on user role
    if (userProfile?.role && currentUser) {
      preloadCriticalComponents();
      
      // Preload cache with critical data
      cacheService.preloadCriticalData(currentUser.uid, userProfile.role);
    }
  }, [userProfile?.role, currentUser]);

  // Handle navigation actions
  const handleNavigationAction = useCallback((action) => {
    console.log('Navigation action:', action);
    // Handle different action types
    switch (action.action) {
      case 'add-property':
        setActiveTab(1); // Switch to properties tab
        break;
      case 'new-request':
        // Navigate to maintenance request form
        break;
      default:
        console.log('Unhandled action:', action);
    }
  }, []);

  // Handle property dashboard actions
  const handleViewProperty = useCallback((propertyId) => {
    // In a real app, this would navigate to property details
    console.log('View property:', propertyId);
    // You could integrate with React Router here
  }, []);

  const handleAddProperty = useCallback(() => {
    // In a real app, this would navigate to property creation
    console.log('Add property');
    // You could integrate with React Router here
  }, []);

  const handleViewAllProperties = useCallback(() => {
    // In a real app, this would navigate to properties list
    console.log('View all properties');
    // You could integrate with React Router here
  }, []);

  return (
    <PageTransition>
      {/* Progressive Navigation */}
      <ProgressiveNavigation onAction={handleNavigationAction} />
      
      <AdaptiveContainer role={userProfile?.userType}>
        {/* Debug Information - Only show on desktop */}
        <ShowOn breakpoint="lg">
          <FadeIn delay={0.1}>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-blue-700 dark:text-blue-300">
                📱 Current breakpoint: <strong>{current}</strong> • 
                Mobile: {isMobile ? '✅' : '❌'} • 
                Tablet: {isTablet ? '✅' : '❌'} • 
                Desktop: {isDesktop ? '✅' : '❌'} •
                Touch targets: <strong>{responsiveLayout.getTouchTargetSize()}</strong>
              </p>
            </div>
          </FadeIn>
        </ShowOn>

      {/* Mobile/Tablet Status */}
      <HideOn breakpoint="lg">
        <FadeIn delay={0.2}>
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300">
              📱 {isMobile ? 'Mobile' : 'Tablet'} view active - Touch optimized
            </p>
          </div>
        </FadeIn>
      </HideOn>

        {/* Main Dashboard Content with Tabs */}
        <SlideUp delay={0.3}>
          <Tabs selectedIndex={activeTab} onChange={setActiveTab}>
            <TabList className="mb-6">
              <Tab>Overview</Tab>
              <Tab>Properties</Tab>
            </TabList>
            
            <TabPanels>
              {/* General Dashboard Tab */}
              <TabPanel>
                <DashboardGrid spacing="standard" className="mb-6">
                  <WidgetArea span="full" priority="high" data-priority="critical-stats">
                    <Suspense 
                      fallback={
                        <LoadingState
                          loading={true}
                          loader={<LoadingFallback type="dashboard" title="Loading Dashboard..." />}
                        >
                          <div>Loading dashboard content...</div>
                        </LoadingState>
                      }
                    >
                      <Dashboard />
                    </Suspense>
                  </WidgetArea>
                </DashboardGrid>
              </TabPanel>
              
              {/* Property Dashboard Tab */}
              <TabPanel>
                <DashboardGrid spacing="standard">
                  <WidgetArea span="full" priority="high" data-priority="property-overview">
                    <Suspense 
                      fallback={
                        <LoadingState
                          loading={true}
                          loader={<LoadingFallback type="properties" title="Loading Property Dashboard..." />}
                        >
                          <div>Loading property dashboard...</div>
                        </LoadingState>
                      }
                    >
                      <PropertyDashboard
                        onViewProperty={handleViewProperty}
                        onAddProperty={handleAddProperty}
                        onViewAllProperties={handleViewAllProperties}
                      />
                    </Suspense>
                  </WidgetArea>
                </DashboardGrid>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </SlideUp>

        {/* Responsive Info Cards */}
        <StaggerContainer>
          <AdaptiveGrid pattern="cards" variant="stats" spacing="standard" className="mt-6">
            <WidgetArea span="1" priority="medium" data-priority="design-info">
              <StaggerItem>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Mobile-First Design
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Touch-optimized components with {responsiveLayout.getTouchTargetSize()} minimum touch targets.
                  </p>
                </div>
              </StaggerItem>
            </WidgetArea>

            <WidgetArea span="1" priority="medium" data-priority="responsive-info">
              <StaggerItem>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Adaptive Layout
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Progressive disclosure based on screen size and user role.
                  </p>
                </div>
              </StaggerItem>
            </WidgetArea>

            <WidgetArea span="1" priority="medium" data-priority="haptic-info">
              <StaggerItem>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Touch Feedback
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {responsiveLayout.shouldUseHaptics() ? 'Haptic feedback enabled' : 'Click feedback optimized'} for your device.
                  </p>
                </div>
              </StaggerItem>
            </WidgetArea>

            <WidgetArea span="1" priority="medium" data-priority="performance-info">
              <StaggerItem>
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-700">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    Performance
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Intelligent caching and optimized loading for {isMobile ? 'mobile' : 'desktop'} experience.
                  </p>
                </div>
              </StaggerItem>
            </WidgetArea>
          </AdaptiveGrid>
        </StaggerContainer>
        
        {/* Bottom spacing for mobile navigation */}
        {isMobile && <div className="h-20" />}
      </AdaptiveContainer>
    </PageTransition>
  );
};

export default DashboardPage; 