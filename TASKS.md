# Propagentic UI & Routing Fixes Workflow

This document outlines the steps to address the UI inconsistencies and routing issues identified.

## Task List

1.  **Fix Back Button Routing (`/` vs `/propagentic/new`)**
    *   **Goal:** Ensure navigating back from auth pages leads to `/propagentic/new`, not the old `/`.
    *   **Location:** `src/App.js`, Potentially auth components (`src/pages/AuthPage.jsx`, `src/pages/LoginPage.js`, `src/pages/RegisterPage.js`)
    *   **Action:**
        *   Verify `<Route path="/" element={<Navigate to="/propagentic/new" replace />} />` exists and is correctly placed *before* any other `/` route in `src/App.js`.
        *   Investigate navigation logic after successful login/signup. Ensure `navigate('...', { replace: true })` is used when redirecting to dashboard/profile pages to remove the auth page from history.
        *   Consider removing the old `<Route path="/old-landing" element={<LandingPage />} />` entirely if it's fully deprecated.
    *   **Status:** `done`

2.  **Fix Pricing Page Link in Header**
    *   **Goal:** Ensure the 'Pricing' link in the main navigation header on `/propagentic/new` works.
    *   **Location:** `src/components/landing/newComponents/HeaderTabs.jsx` (or relevant header component).
    *   **Action:** Locate the navigation link for 'Pricing' and confirm its `to` prop is set to `/pricing`.
    *   **Status:** `done`

3.  **Reposition Dashboard Preview Section**
    *   **Goal:** Move the 'Powerful Dashboard Management' section (`DashboardPreview`) to appear directly below the role selection/hero section.
    *   **Location:** `src/components/landing/EnhancedLandingPage.jsx`
    *   **Action:** Cut the `<section>` containing `<DashboardPreview />` and paste it immediately after the `<EnhancedHeroSection />` component. Adjust surrounding styling if necessary.
    *   **Status:** `done`

4.  **Update `EnhancedInteractiveDemo` Styling (Maintenance Workflow)**
    *   **Goal:** Restyle the 'Propagentic Maintenance Workflow' component to match the new theme.
    *   **Location:** `src/components/landing/newComponents/EnhancedInteractiveDemo.jsx`
    *   **Action:** Applied theme styling to container, header, steps, and main content area. Further detailed styling of step content might be needed manually.
    *   **Status:** `done`

5.  **Update `DashboardPreview` Styling**
    *   **Goal:** Restyle the 'Powerful Dashboard Management' preview for both Landlord and Tenant views.
    *   **Location:** `src/components/landing/newComponents/DashboardPreview.jsx`
    *   **Action:** Apply theme tokens and consistent styling (`rounded-xl`, `shadow-lg`, borders, spacing) to the container, header, sidebar, stat cards, and request list items. Utilize the `StatusPill` component. Add theme colors where appropriate to enhance visual appeal.
    *   **Status:** `done`

6.  **Fix Disappearing Icons in `EnhancedAIExplainer`**
    *   **Goal:** Prevent icons from disappearing on hover within the 'How AI Powers Our Platform' section.
    *   **Location:** `src/components/landing/newComponents/EnhancedAIExplainer.jsx`
    *   **Action:** Adjusted z-index and hover states to ensure icon visibility. Cloned icon element to control styling dynamically.
    *   **Status:** `done`

7.  **Final Testing**
    *   **Goal:** Verify all fixes and ensure no regressions were introduced.
    *   **Action:**
        *   Test the back button behavior after login/signup.
        *   Click the 'Pricing' link from the new landing page header.
        *   Confirm the Dashboard Preview is correctly positioned.
        *   Review the styling of the Maintenance Workflow and Dashboard Preview components.
        *   Check the hover effect in the AI Explainer section.
        *   Perform general navigation tests.
    *   **Status:** `todo`

# PropAgentic Project Tasks

## Heroicons v1 to v2 Migration

### Issue
The project is using Heroicons v2 (`@heroicons/react@^2.2.0`), but some components (like PricingPage) were still importing icons using the v1 format:
- V1 format: `@heroicons/react/solid/CheckIcon`
- V2 format: `@heroicons/react/24/solid/CheckIcon` (or outline/mini variants)

### Tasks

1. ✅ **Locate Affected Files**
   - Found components that import from Heroicons v1 paths:
     - PricingPage.js: `import { CheckIcon, XIcon } from '@heroicons/react/solid';`
     - TicketCard.js: `import { BadgeCheckIcon, LightningBoltIcon } from '@heroicons/react/solid';`
     - RequestCard.jsx: `import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/solid';`
     - PropertyTable.jsx: `import { ChevronUpIcon, ChevronDownIcon, HomeIcon } from '@heroicons/react/solid';`

2. ✅ **Update Import Statements**
   - Updated all v1 import paths to v2 format
   - Changed icon names that have been renamed in v2:
     - XIcon → XMarkIcon
     - BadgeCheckIcon → CheckBadgeIcon
     - LightningBoltIcon → BoltIcon

3. ✅ **Create Migration Script**
   - Updated `update-heroicons.sh` to handle both solid and outline icons
   - Added all icon name mappings that have changed in v2

4. ✅ **Testing**
   - Verified that the PricingPage loads correctly without errors

### Completed Solution

We chose **Option 1: Update Components to Use Heroicons v2** as it allows us to use the latest version of Heroicons and follows modern best practices.

Key changes made:
1. Updated all import paths to include size designation (`24/solid` instead of just `solid`)
2. Renamed icons according to the v2 naming convention
3. Enhanced the migration script to handle future updates

### Additional Notes

- The script will help with any future component migrations
- This update ensures consistent icon usage across the application 

## Notification Provider Issue After Landlord Onboarding

### Issue
After completing the landlord onboarding survey, the user sees multiple errors:
```
Uncaught runtime errors:
ERROR
useNotifications must be used within a NotificationProvider
```

The errors occur in notification-related components:
- NotificationBell
- NotificationPanel

### Root Cause Analysis
1. The application has two different notification systems:
   - `NotificationProvider` from `src/components/shared/NotificationProvider.jsx` (used for toast notifications in the app wrapper)
   - `NotificationProvider` from `src/context/NotificationContext.tsx` (used for the notification center/panel)

2. The main `App.js` includes the first `NotificationProvider` which wraps the entire application:
   ```jsx
   function App() {
     return (
       <AuthProvider>
         <NotificationProvider>
           <Router>
             {/* ... */}
           </Router>
         </NotificationProvider>
       </AuthProvider>
     );
   }
   ```

3. When redirecting from the landlord onboarding to the dashboard, the second `NotificationProvider` (from `NotificationContext.tsx`) is not properly wrapped around the components that need it.

### Tasks

1. ✅ **Add Second NotificationProvider to DashboardLayout**
   - Added the `NotificationProvider` from NotificationContext to the DashboardLayout
   - Imported as `NotificationCenterProvider` to avoid name conflicts

2. ✅ **Add Error Handling**
   - Created a `NotificationErrorBoundary` component to catch and handle notification-related errors
   - The boundary prevents notification errors from breaking the entire UI

3. ✅ **Modify HeaderNav Component**
   - Wrapped `NotificationBell` and `NotificationPanel` with the error boundary
   - This prevents rendering issues when the notification context is missing

### Implemented Solution

1. **DashboardLayout.js Changes**
   ```jsx
   import { NotificationProvider as NotificationCenterProvider } from '../../context/NotificationContext';

   // Inside the DashboardLayout component:
   return (
     <div className="flex h-screen bg-gray-100">
       <SidebarNav />
       <div className="flex-1 flex flex-col overflow-hidden md:ml-64">
         <HeaderNav />
         <NotificationCenterProvider>
           <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-100">
             <Outlet />
           </main>
         </NotificationCenterProvider>
       </div>
     </div>
   );
   ```

2. **Created Error Boundary**
   - New component: `src/components/shared/NotificationErrorBoundary.jsx`
   - Gracefully handles errors in notification components

3. **HeaderNav.jsx Updates**
   - Wrapped notification components with error boundary:
   ```jsx
   <NotificationErrorBoundary>
     <NotificationBell onClick={() => setNotificationPanelOpen(true)} />
   </NotificationErrorBoundary>

   <NotificationErrorBoundary>
     <NotificationPanel isOpen={notificationPanelOpen} onClose={() => setNotificationPanelOpen(false)} />
   </NotificationErrorBoundary>
   ```

### Expected Outcome
- Users should now be able to complete the landlord onboarding process and transition to the dashboard without errors
- If notification components fail, they will be gracefully hidden instead of breaking the entire UI
- Both notification providers will coexist until a unified approach can be implemented in the future 

# PropAgentic Application Improvement Tasks

## 1. Implementing Firebase Offline Capabilities

### Description
Enable offline data persistence for Firestore to allow the application to work without an internet connection and synchronize when back online.

### Tasks
- [ ] **Enable Firestore offline persistence**
  - Update `src/firebase/config.js` to enable persistence
  - Add enablePersistence() method with appropriate error handling
  - Set cache size limits appropriate for the application data volume

- [ ] **Implement offline status detection**
  - Create a new context provider `src/context/ConnectionContext.js` to track online/offline status
  - Add UI indicators for offline mode in `src/components/layout/HeaderNav.jsx`
  - Display appropriate messaging when operating in offline mode

- [ ] **Modify data fetching patterns**
  - Update collection queries to work with cache-first strategies
  - Add `getDocsFromCache` fallbacks in critical data paths
  - Add retry mechanisms when reconnecting to network

- [ ] **Test offline functionality**
  - Test application behavior when network is disconnected
  - Verify data synchronization when connection is restored
  - Document usage patterns and limitations for offline mode

## 2. Adding Retry Logic for Firestore Operations

### Description
Implement robust retry mechanisms for Firestore operations to handle temporary outages and connection issues.

### Tasks
- [ ] **Create a retry utility**
  - Implement a generic retry function in `src/utils/retryUtils.js`
  - Configure exponential backoff parameters
  - Add configurable max retry attempts and timeout

- [ ] **Wrap critical Firestore operations with retry logic**
  - Update property fetching in `src/pages/LandlordDashboard.js`
  - Add retry logic to authentication operations in `src/context/AuthContext.js`
  - Implement retry for critical write operations in forms and data updates

- [ ] **Add operation queue for failed writes**
  - Create a queue system for storing failed write operations
  - Implement background retry for queued operations
  - Add UI to show pending operations status

- [ ] **Implement circuit breaker pattern**
  - Add circuit breaker to prevent excessive retries during extended outages
  - Create a service health monitoring utility
  - Provide graceful degradation of features based on service availability

## 3. Creating Demo Mode with Fallback Data

### Description
Implement a demo mode with mock data that can be used when Firebase is unavailable or for new users to explore the application.

### Tasks
- [ ] **Create mock data repository**
  - Generate comprehensive mock data in `src/utils/demoData.js`
  - Include realistic property, tenant, and maintenance request data
  - Structure mock data to match Firestore document formats

- [ ] **Implement demo mode toggle**
  - Add demo mode provider in `src/context/DemoModeContext.js`
  - Create UI controls for switching to demo mode in settings
  - Add visual indicators when operating in demo mode

- [ ] **Create data service abstraction layer**
  - Implement service interfaces in `src/services/dataService.js`
  - Add conditional logic to switch between Firebase and mock data sources
  - Ensure consistent data structure regardless of source

- [ ] **Auto-fallback mechanism**
  - Add automatic fallback to demo mode when Firebase is unavailable
  - Implement smooth transition between live and demo data
  - Provide clear user messaging about data source and limitations

## 4. Adding Comprehensive Error Tracking

### Description
Integrate a professional error tracking solution to monitor, report, and analyze application errors.

### Tasks
- [ ] **Research and select error tracking solution**
  - Compare Sentry, LogRocket, and other options
  - Evaluate pricing, features, and integration complexity
  - Document selection rationale and implementation plan

- [ ] **Integrate error tracking SDK**
  - Install selected tracking package
  - Configure initialization in `src/index.js`
  - Set up environment-specific settings (dev/prod)

- [ ] **Implement contextual error capturing**
  - Add user context to error reports
  - Include relevant application state in error data
  - Capture non-fatal errors and warnings

- [ ] **Create custom error boundaries**
  - Implement error boundaries for critical application sections
  - Update existing `NotificationErrorBoundary` with enhanced tracking
  - Add component-specific error handling where appropriate

- [ ] **Error analytics dashboard**
  - Set up dashboard for monitoring error trends
  - Configure alerts for critical errors
  - Establish error triage and resolution workflow

## Implementation Timeline

1. **Week 1**: Offline capabilities and retry logic
2. **Week 2**: Demo mode implementation
3. **Week 3**: Error tracking integration
4. **Week 4**: Testing, documentation, and deployment

## Resources

- [Firebase Offline Documentation](https://firebase.google.com/docs/firestore/manage-data/enable-offline)
- [Error Handling Best Practices](https://firebase.google.com/docs/firestore/manage-data/transactions#handling_errors)
- [Sentry React Documentation](https://docs.sentry.io/platforms/javascript/guides/react/)
- [LogRocket React Integration](https://docs.logrocket.com/docs/react-plugin)

# PropAgentic Maintenance Tickets Loading Fix

## Issue
After login to the landlord dashboard, users see a "failed to load maintenance tickets" error message instead of seeing their maintenance tickets. The property data from the onboarding phase is not correctly loaded or displayed.

## Root Cause Analysis Tasks

1. [x] **Investigate Firestore query structure in maintenance tickets**
   - Check `getTicketsForCurrentUser()` method in `dataService.js`
   - Verify the query structure for landlord ticket retrieval
   - Ensure properties are loaded before tickets query is executed

2. [x] **Examine data flow issues**
   - Check dependency ordering in useEffect hooks in LandlordDashboard
   - Verify properties are loaded before tickets query is attempted
   - Add console logging for better diagnostics of the loading sequence

3. [ ] **Firestore permissions verification**
   - Check Firestore security rules for tickets collection
   - Verify landlord has read access to tenant-created tickets
   - Test queries with admin access to isolate permission issues

4. [ ] **Examine Firestore schema alignment**
   - Check if the data model matches between onboarding and dashboard components
   - Verify property ID field names are consistent throughout the application
   - Check collection structure for ticket-property relationships

## Implementation Tasks

1. [x] **Fix query structure for maintenance tickets**
   - Update the `getTicketsForCurrentUser()` method to properly handle the landlord role
   - Fix the query to retrieve maintenance tickets for all properties owned by the landlord
   - Add appropriate error handling with specific error messages

2. [x] **Enhance error recovery**
   - Add specific error messages for different failure scenarios 
   - Implement automatic retry with exponential backoff for ticket loading
   - Add a manual reload button for tickets separately from property data

3. [x] **Improve data loading sequence**
   - Update the dependency array in the tickets useEffect to wait for properties
   - Implement a sequential loading pattern for dependent data
   - Add loading states for each data type (properties, tickets, tenants)

4. [ ] **Add fallback/demo data for tickets**
   - Verify demo mode fallback works correctly for ticket data
   - Ensure the mock maintenance tickets are appropriate for testing
   - Add a visible indicator when viewing demo tickets data
   
5. [ ] **Implement ticket-specific error boundary**
   - Create a separate error boundary for the maintenance tickets section
   - Allow the rest of the dashboard to function when tickets fail to load
   - Add appropriate error UI with clear actions for users

## Testing Tasks

1. [ ] **Test with multiple account types**
   - Test with landlords that have different property configurations
   - Test with newly onboarded landlords vs existing accounts
   - Verify behavior with landlords who have no properties yet

2. [ ] **Test connection scenarios**
   - Test offline mode behavior with ticket loading
   - Test with slow connections using network throttling
   - Verify retry and recovery mechanisms work as expected

3. [ ] **Test data migration path**
   - Verify tickets created before this fix are still accessible
   - Test with ticket data created through various app versions
   - Ensure backward compatibility with older ticket formats

## Expected Outcome
After implementing these fixes, landlords should be able to view their maintenance tickets immediately after login. The dashboard should properly display all properties and associated maintenance tickets from the onboarding phase, with appropriate fallbacks and error recovery mechanisms in place to ensure a smooth user experience even in challenging connectivity scenarios.

## Completed Fixes

We have now addressed the main causes of the "failed to load maintenance tickets" error:

1. **Enhanced the dataService.getTicketsForCurrentUser() method:**
   - Added comprehensive error logging
   - Improved property-to-ticket relationship query
   - Added handling for Firestore "in" query limits (max 10 items) by chunking requests
   - Better detection of user type from either userType or role field
   - Implemented early returns for error conditions to prevent cascade failures

2. **Improved LandlordDashboard.js component:**
   - Added sequential data loading pattern (properties → tickets → tenants)
   - Created separate loading states for different data types
   - Implemented retry mechanism for ticket loading failures
   - Added user-friendly error messages with recovery options

3. **Added resilient retry capabilities:**
   - Leveraged the existing retry utilities for Firestore operations
   - Implemented exponential backoff for failed queries
   - Added circuit-breaker pattern to prevent excessive retries

These changes have significantly improved the robustness of the maintenance ticket loading process, ensuring landlords can see their tickets immediately after login, even in challenging network conditions.

# Property Loading Issue

## Issue
After login to the landlord dashboard, users see a "Failed to load properties" error message instead of seeing their property data.

## Root Cause Analysis

1. [x] **Investigate Property Query Structure**
   - Check Firestore query in `getPropertiesForCurrentLandlord` and `subscribeToProperties` methods
   - Verify correct user ID is being used in the query
   - Add comprehensive logging to trace the execution path

2. [x] **Enhance Error Recovery for Properties**
   - Improve error messages to be more specific about the failure reason
   - Add fallback mechanism when subscription fails
   - Create a better retry experience for users

3. [ ] **Validate User Profile Structure**
   - Check if user profile contains the correct role/userType field
   - Verify Firestore permissions for the properties collection
   - Test with different user accounts to ensure consistency

## Implementation

1. [x] **Fix Property Loading in DataService**
   - Updated property queries with better error handling
   - Added fallback to one-time query if subscription fails
   - Improved logging to diagnose underlying issues
   - Added userType validation with fallback to role field

2. [x] **Enhance LandlordDashboard Error UI**
   - Improved error presentation with more details
   - Added specific retry button with forced reload
   - Provided option to switch to demo mode for emergency access
   - Better state management for loading and errors

3. [ ] **Create User Role Verification**
   - Add check in AuthContext to validate user has proper role 
   - Ensure landlord permissions are properly set during registration
   - Create recovery path for users with incorrect role settings

## Expected Outcome
After these fixes, landlords should be able to properly load their property data after logging in. The dashboard will show meaningful error messages with recovery options when problems occur, and users will have the ability to use demo data if their live data cannot be accessed.

# Property Loading Issue - Deep Troubleshooting Guide

## Persistent Issue
After implementing initial fixes, users are still encountering "Failed to load properties" errors when logging into the landlord dashboard.

## Diagnosis Approach

### 1. Identify Authentication Flow Issues
- [ ] **Verify Authentication State Consistency**
  - Add explicit logging in AuthContext.js to verify user object contains all expected fields
  - Check for race conditions between authentication and Firestore queries
  - Add session token validation checks

- [ ] **Trace User Profile Loading Sequence**
  - Add sequential timestamps to track auth → profile → properties pipeline
  - Watch for premature queries before user profile is fully loaded
  - Verify profile document exists in Firestore for the authenticated user

### 2. Deep Firestore Analysis
- [ ] **Test Direct Collection Access**
  - Create a test function to directly query properties collection outside normal flow
  - Compare results when using different auth credentials (admin vs user)
  - Log the full query structure and parameters during execution

- [ ] **Analyze Firestore Security Rules**
  - Export and review current security rules specifically for properties collection
  - Test if rules are blocking legitimate queries from landlord users
  - Verify landlordId field matches the exact capitalization and format expected

- [ ] **Check Collection Structure**
  - Validate property documents have correct schema and required fields
  - Check for subcollections vs root collections organization discrepancies
  - Verify indexes exist for the landlordId field used in queries

### 3. Connection & Service Health
- [ ] **Implement Network Analysis**
  - Add network request timing and success rate tracking
  - Check for rate limiting or throttling on the Firestore instance
  - Analyze request patterns to identify potential congestion points

- [ ] **Monitor Firebase Service Health**
  - Create a service monitoring component to track Firestore availability
  - Add periodic health checks independent of main application flow
  - Log any regional or service-wide Firebase outages

### 4. Implementation Solutions

- [ ] **Create Transaction Wrapper for Property Loading**
  - Implement Firestore transactions for consistent property reading
  - Add explicit ordering to ensure properties are queried after profiles
  - Set up retry logic specifically tuned for transaction failures

- [ ] **Enhanced Fallback Strategy**
  - Implement localStorage caching for most recent property data
  - Add backup query patterns using different field combinations
  - Create alternative views when properties can't be loaded

- [ ] **User Profile Repair Utility**
  - Develop a diagnostic tool to check user profile completeness
  - Create automatic repair function for common profile issues
  - Add guided flow for users to manually complete missing profile data

- [ ] **Implement Progressive Enhancement**
  - Build a minimal UI that works with zero properties
  - Create step-by-step property addition flow for new landlords
  - Display help content when properties can't be loaded

### 5. Testing & Verification

- [ ] **Created Isolated Test Cases**
  - Build a standalone test page that only loads properties
  - Create test accounts with various property configurations
  - Develop script to simulate different network conditions

- [ ] **Document Reproduction Steps**
  - Catalog exact steps that reliably reproduce the error
  - Identify any browser, device, or network patterns in reports
  - Create video recording of error reproduction for development team

- [ ] **A/B Test Different Solutions**
  - Implement feature flags to test multiple fixes simultaneously
  - Create metrics to track success rates for each approach
  - Establish baseline performance metrics to measure improvements

## Implementation Priority
1. **Critical:** Authentication flow analysis and direct collection testing
2. **High:** Security rules verification and user profile repair
3. **Medium:** Caching and fallback improvements
4. **Ongoing:** Testing and metrics collection

## Deep Dive Investigation Tasks

### Debug Session #1: Authentication Flow
1. [ ] Add detailed console logging to track user auth state changes:
   ```javascript
   // In AuthContext.js
   useEffect(() => {
     onAuthStateChanged(auth, (user) => {
       console.log('Auth state changed:', { 
         uid: user?.uid,
         emailVerified: user?.emailVerified,
         providerData: user?.providerData,
         metadata: user?.metadata
       });
       // ... existing code
     });
   }, []);
   ```

2. [ ] Verify token lifecycle and refresh behavior:
   ```javascript
   // In AuthContext.js
   const checkTokenExpiration = async (user) => {
     if (!user) return;
     try {
       const token = await user.getIdTokenResult();
       const expirationTime = new Date(token.expirationTime).getTime();
       const currentTime = Date.now();
       console.log('Token status:', {
         expiresIn: Math.floor((expirationTime - currentTime) / 1000 / 60) + ' minutes',
         isExpired: currentTime > expirationTime
       });
     } catch (err) {
       console.error('Token check failed:', err);
     }
   };
   ```

3. [ ] Add user profile validation check:
   ```javascript
   // In AuthContext.js after fetching user profile
   const validateUserProfile = (profile) => {
     const requiredFields = ['userType', 'email', 'firstName', 'lastName'];
     const missingFields = requiredFields.filter(field => !profile[field]);
     if (missingFields.length > 0) {
       console.warn('User profile missing required fields:', missingFields);
       return false;
     }
     if (profile.userType !== 'landlord') {
       console.warn('User is not a landlord:', profile.userType);
       return false;
     }
     return true;
   };
   ```

### Debug Session #2: Firestore Access Patterns
1. [ ] Create a test function to query properties directly:
   ```javascript
   // Add to LandlordDashboard.js
   const testDirectPropertyQuery = async () => {
     try {
       console.log('Testing direct property query for user:', currentUser.uid);
       const q = query(
         collection(db, 'properties'),
         where('landlordId', '==', currentUser.uid)
       );
       const snapshot = await getDocs(q);
       console.log('Direct query results:', {
         count: snapshot.docs.length,
         docs: snapshot.docs.map(d => ({id: d.id, ...d.data()}))
       });
     } catch (err) {
       console.error('Direct query failed:', err);
     }
   };
   
   // Call this early in component mount
   useEffect(() => {
     if (currentUser) testDirectPropertyQuery();
   }, [currentUser]);
   ```

2. [ ] Add verbose request logging to track Firestore requests:
   ```javascript
   // In firebase/config.js
   if (process.env.NODE_ENV === 'development') {
     const originalGet = Firestore.prototype.get;
     Firestore.prototype.get = function(...args) {
       console.log('Firestore.get request:', args);
       return originalGet.apply(this, args)
         .then(result => {
           console.log('Firestore.get success:', result);
           return result;
         })
         .catch(err => {
           console.error('Firestore.get error:', err);
           throw err;
         });
     };
   }
   ```

### Debug Session #3: Network & Service Health
1. [ ] Add connectivity monitoring with detailed events:
   ```javascript
   // In ConnectionContext.js
   useEffect(() => {
     const handleOnline = () => {
       console.log('Network connected at:', new Date().toISOString());
       setIsOnline(true);
     };
     
     const handleOffline = () => {
       console.log('Network disconnected at:', new Date().toISOString());
       setIsOnline(false);
     };
     
     window.addEventListener('online', handleOnline);
     window.addEventListener('offline', handleOffline);
     
     // Check Firebase connectivity
     const unsubscribe = onSnapshot(doc(db, '_health/status'), 
       () => {
         console.log('Firestore is responsive', new Date().toISOString());
         setIsFirestoreAvailable(true);
       },
       (error) => {
         console.error('Firestore health check failed:', error);
         setIsFirestoreAvailable(false);
       }
     );
     
     return () => {
       window.removeEventListener('online', handleOnline);
       window.removeEventListener('offline', handleOffline);
       unsubscribe();
     };
   }, []);
   ```

## Immediate Action Items

### Quick Fixes to Implement Immediately

1. [ ] **Add Firestore Error Path Debugging**
   ```javascript
   // In dataService.js - subscribeToProperties method
   try {
     // Existing code...
     
     // Add verbose error path logging
     console.log('Building query with params:', {
       collectionPath: 'properties',
       filterField: 'landlordId',
       filterValue: userId,
       userType: this.currentUser.userType || this.currentUser.role
     });
     
     // Check if userId exists in another field (backup check)
     const backupQuery = query(
       collection(db, 'properties'),
       where('owner', '==', userId)
     );
     
     console.log('Attempting primary subscription with landlordId');
     return onSnapshot(
       q,
       // Success callback with more detailed logging
       (snapshot) => {
         console.log(`Properties subscription success: ${snapshot.docs.length} properties found`);
         onData(snapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
       },
       // Error callback with fallback attempt
       (error) => {
         console.error('Primary subscription failed:', error);
         
         // Try backup query if primary fails
         console.log('Attempting backup query with owner field');
         getDocs(backupQuery)
           .then(backupSnapshot => {
             console.log(`Backup query results: ${backupSnapshot.docs.length} properties found`);
             if (backupSnapshot.docs.length > 0) {
               onData(backupSnapshot.docs.map(doc => ({id: doc.id, ...doc.data()})));
             } else {
               onError(error); // Still report original error if backup fails
             }
           })
           .catch(backupError => {
             console.error('Both queries failed:', { primary: error, backup: backupError });
             onError(error);
           });
       }
     );
   } catch (error) {
     // Existing error handling...
   }
   ```

2. [ ] **Implement Local Storage Fallback**
   ```javascript
   // In LandlordDashboard.js - add localStorage caching
   
   // After successfully loading properties
   useEffect(() => {
     if (properties.length > 0) {
       try {
         localStorage.setItem('landlord_properties_cache', JSON.stringify({
           userId: currentUser.uid,
           timestamp: Date.now(),
           properties: properties
         }));
         console.log('Properties cached to localStorage');
       } catch (e) {
         console.error('Failed to cache properties:', e);
       }
     }
   }, [properties, currentUser?.uid]);
   
   // When handling property loading errors, try to load from cache
   const loadFromCache = () => {
     try {
       const cachedData = localStorage.getItem('landlord_properties_cache');
       if (cachedData) {
         const parsed = JSON.parse(cachedData);
         if (parsed.userId === currentUser.uid) {
           console.log('Using cached properties from localStorage');
           setProperties(parsed.properties);
           setPropertiesLoaded(true);
           setLoadingData(false);
           
           // Show cache notification
           setError(`Using cached data from ${new Date(parsed.timestamp).toLocaleString()}. Some information may be outdated.`);
           return true;
         }
       }
     } catch (e) {
       console.error('Failed to load from cache:', e);
     }
     return false;
   };
   
   // Update error handling to try cache
   const handlePropertyError = (error) => {
     console.error("Error fetching properties: ", error);
     captureError(error, 'LandlordDashboard.fetchProperties');
     
     // Try to load from cache before showing error
     if (!loadFromCache()) {
       setError(error.message || "Failed to load properties. Please try refreshing the page.");
       setProperties([]);
     }
     
     setLoadingData(false);
   };
   ```

3. [ ] **Add Empty State Handling**
   ```jsx
   // In LandlordDashboard.js - add better empty state UI
   
   // Handle zero properties condition with helpful UI
   if (properties.length === 0 && !loadingData && !error) {
     return (
       <div className="space-y-6 p-1 md:p-4">
         <div className="flex flex-col sm:flex-row sm:items-center justify-between">
           <h1 className="text-2xl font-semibold text-slate-800">Landlord Dashboard</h1>
           <p className="text-sm text-slate-500">Welcome, {userProfile?.firstName || 'Landlord'}</p>
         </div>
         
         <div className="bg-white rounded-xl shadow-md p-8 text-center">
           <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-teal-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
           </svg>
           <h2 className="text-xl font-medium text-gray-900 mb-2">No Properties Found</h2>
           <p className="text-gray-500 max-w-md mx-auto mb-6">
             You don't have any properties in your account yet. Let's add your first property to get started.
           </p>
           <button 
             onClick={() => navigate('/properties/add')}
             className="px-4 py-2 bg-teal-600 text-white rounded-md shadow hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
           >
             Add Your First Property
           </button>
         </div>
       </div>
     );
   }
   ```

### Emergency User Workarounds

1. [ ] **Create Demo Mode Entry Point**
   ```jsx
   // Add a special path to force demo mode
   // In App.js routes
   <Route path="/emergency-demo" element={
     <Navigate to="/dashboard" replace state={{ forceDemoMode: true }} />
   } />
   
   // Then in DemoModeContext.js
   const DemoModeProvider = ({ children }) => {
     // Get location from React Router
     const location = useLocation();
     
     // Check for force demo mode flag in location state
     const forceDemoMode = location.state?.forceDemoMode || false;
     
     useEffect(() => {
       if (forceDemoMode) {
         console.log('Forcing demo mode via URL parameter');
         enableDemoMode();
       }
     }, [forceDemoMode]);
     
     // Rest of provider code...
   };
   ```

2. [ ] **Implement Data Export/Import Feature**
   ```jsx
   // Add to PropertyManagementPage.js or similar component
   const exportProperties = () => {
     if (properties.length === 0) {
       alert('No properties to export');
       return;
     }
     
     const dataStr = JSON.stringify(properties, null, 2);
     const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
     
     const exportFileDefaultName = `property_backup_${new Date().toISOString().slice(0,10)}.json`;
     
     const linkElement = document.createElement('a');
     linkElement.setAttribute('href', dataUri);
     linkElement.setAttribute('download', exportFileDefaultName);
     linkElement.click();
   };
   
   const importProperties = async (event) => {
     try {
       const file = event.target.files[0];
       const reader = new FileReader();
       
       reader.onload = async (e) => {
         try {
           const properties = JSON.parse(e.target.result);
           // Validate schema
           if (!Array.isArray(properties)) throw new Error('Invalid format');
           
           // Process each property
           for (const property of properties) {
             // Strip any existing ID to create new copies
             const { id, ...propertyData } = property;
             await dataService.createProperty(propertyData);
           }
           
           alert(`Successfully imported ${properties.length} properties`);
           window.location.reload();
         } catch (err) {
           alert(`Error parsing file: ${err.message}`);
         }
       };
       
       reader.readAsText(file);
     } catch (err) {
       alert(`Error importing file: ${err.message}`);
     }
   };
   ```

## Testing Matrix

| Test Case | Steps | Expected Result | Actual Result |
|-----------|-------|-----------------|--------------|
| Fresh Login | Login as landlord user | Properties load successfully | |
| Offline Mode | Disable network, then login | See cached properties with notice | |
| Invalid User | Login with non-landlord user | See appropriate error message | |
| Empty Properties | Login with new user account | See empty state UI with add property button | |
| Security Rule Test | Login, test direct property query | Query succeeds with property data | |
| Large Account | Login with 50+ properties | All properties load with pagination | |

## Next Steps Based on Test Results

1. If **user validation fails**, focus on AuthContext improvements and user profile repair
2. If **direct Firestore query succeeds** but normal flow fails, look at the data service implementation
3. If **security rules block access**, update Firestore rules and verify proper field usage
4. If **all tests fail**, implement demo mode fallback prominently for users

## Follow-up Tasks

- [ ] Schedule regular Firebase health checks every 4 hours
- [ ] Add comprehensive error tracking with Sentry or similar service
- [ ] Create a recovery dashboard for administrators
- [ ] Develop a diagnostic tool for customer support team

# Priority Implementation Plan

Based on the analysis of the error patterns and the code review, here are the most likely issues and their fixes, prioritized by likelihood and impact:

## 1. Field Name Mismatch in Firestore Query (HIGHEST PROBABILITY)

The property loading is likely failing due to a mismatch between the field name used in the query (`landlordId`) and the actual field name in the documents. This is a common issue after database schema changes or during development.

### Implementation Fix:

```javascript
// Create a new enhanced version of getPropertiesForCurrentLandlord in dataService.js
async getPropertiesForCurrentLandlord() {
  if (!this.currentUser) {
    console.error('getPropertiesForCurrentLandlord: No authenticated user');
    throw new Error('No authenticated user');
  }

  console.log(`Fetching properties for landlord: ${this.currentUser.uid}`);
  
  if (this.isDemoMode) {
    console.log('Using demo data for properties');
    return demoData.getDemoPropertiesForLandlord('landlord-001');
  }

  const getPropertiesOperation = async () => {
    try {
      // Try multiple field names that might be used for landlord reference
      const possibleFieldNames = ['landlordId', 'ownerId', 'owner', 'userId', 'createdBy'];
      let allProperties = [];
      let successes = [];
      let failures = [];
      
      console.log(`Attempting property queries with ${possibleFieldNames.length} potential field names`);
      
      // Try each field name
      for (const fieldName of possibleFieldNames) {
        try {
          const q = query(
            collection(db, 'properties'), 
            where(fieldName, '==', this.currentUser.uid)
          );
          
          console.log(`Trying query with field: ${fieldName}`);
          const querySnapshot = await getDocs(q);
          const properties = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          console.log(`Query with field '${fieldName}' returned ${properties.length} properties`);
          
          // Add unique properties based on ID
          const existingIds = new Set(allProperties.map(p => p.id));
          const newProperties = properties.filter(p => !existingIds.has(p.id));
          allProperties.push(...newProperties);
          
          successes.push({field: fieldName, count: properties.length});
        } catch (fieldError) {
          console.error(`Query with field '${fieldName}' failed:`, fieldError);
          failures.push({field: fieldName, error: fieldError.message});
        }
      }
      
      console.log('Property query results:', {
        totalPropertiesFound: allProperties.length,
        successfulQueries: successes,
        failedQueries: failures
      });
      
      // If we found any properties, return them
      if (allProperties.length > 0) {
        return allProperties;
      }
      
      // If no properties found with any field, try one more approach with collection group query
      try {
        console.log('Attempting collection group query as last resort');
        // This works if properties are in subcollections instead of root collection
        const groupQuery = query(
          collectionGroup(db, 'properties'),
          where('createdBy', '==', this.currentUser.uid)
        );
        
        const groupSnapshot = await getDocs(groupQuery);
        return groupSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
      } catch (groupError) {
        console.error('Collection group query failed:', groupError);
        // If all queries failed, throw the original error
        throw new Error('Failed to find properties with any known field name');
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
      throw error;
    }
  };

  // Use resilient operation for Firestore calls
  return await resilientFirestoreOperation(getPropertiesOperation, {
    operationName: 'Multi-field property query',
    maxRetries: 2 // Lower retries since we're already trying multiple approaches
  });
}
```

## 2. User Role/Type Mismatch (HIGH PROBABILITY)

The auth system may be using a different field or value for user roles than what the property queries expect.

### Implementation Fix:

```javascript
// Add to AuthContext.js 
const normalizeUserType = (userProfile) => {
  // Get the original user type (could be in different fields)
  const originalType = userProfile.userType || userProfile.role || userProfile.type;
  
  // Normalize common variations of user types
  if (!originalType) return null;
  
  const lowercaseType = originalType.toLowerCase();
  
  if (lowercaseType.includes('land') || lowercaseType === 'owner' || lowercaseType === 'property manager') {
    return 'landlord';
  }
  
  if (lowercaseType.includes('tenant') || lowercaseType === 'renter' || lowercaseType === 'occupant') {
    return 'tenant';
  }
  
  if (lowercaseType.includes('contract') || lowercaseType === 'worker' || lowercaseType === 'service') {
    return 'contractor';
  }
  
  // Default to original if no match
  return originalType;
};

// When setting the current user profile, normalize the type
const getUserProfile = async (uid) => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const userData = docSnap.data();
      
      // Add the normalized user type
      const normalizedType = normalizeUserType(userData);
      const enhancedUserData = {
        ...userData,
        id: uid,
        // Keep original value but add normalized version
        userType: normalizedType || userData.userType || userData.role,
        originalUserType: userData.userType || userData.role
      };
      
      console.log('Normalized user profile:', {
        original: userData.userType || userData.role,
        normalized: normalizedType
      });
      
      return enhancedUserData;
    } else {
      console.log("No user profile found!");
      return { id: uid, userType: 'unknown' };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    throw error;
  }
};
```

## 3. Firestore Path/Collection Issue (MEDIUM PROBABILITY)

The properties collection may be in a different location than expected, possibly a subcollection or nested path.

### Implementation Fix:

```javascript
// Add to firebase/config.js as helpers
export const COLLECTIONS = {
  // Define all possible paths to try
  PROPERTIES: [
    'properties',                      // Root collection
    'data/production/properties',      // Nested path
    'landlords/{userId}/properties',   // Subcollection
    'accounts/{userId}/properties'     // Alternative subcollection
  ],
  USERS: [
    'users',
    'accounts',
    'data/production/users'
  ],
  // Add other collections as needed
};

// Helper to try multiple collection paths
export const getCollectionRef = async (collectionType, params = {}) => {
  const paths = COLLECTIONS[collectionType];
  if (!paths) throw new Error(`Unknown collection type: ${collectionType}`);
  
  // Replace params in paths
  const resolvedPaths = paths.map(path => {
    let resolvedPath = path;
    for (const [key, value] of Object.entries(params)) {
      resolvedPath = resolvedPath.replace(`{${key}}`, value);
    }
    return resolvedPath;
  });
  
  console.log(`Trying ${resolvedPaths.length} possible collection paths for ${collectionType}`);
  
  // For each path, check if it exists and has documents
  for (const path of resolvedPaths) {
    try {
      // Skip paths with unreplaced parameters
      if (path.includes('{')) continue;
      
      const segments = path.split('/');
      
      // Handle different path types
      let collRef;
      if (segments.length === 1) {
        // Root collection
        collRef = collection(db, path);
      } else if (segments.length === 3) {
        // Subcollection with one level
        collRef = collection(db, segments[0], segments[1], segments[2]);
      } else if (segments.length === 5) {
        // Deeply nested path
        collRef = collection(db, segments[0], segments[1], segments[2], segments[3], segments[4]);
      } else {
        // Skip paths we can't handle
        continue;
      }
      
      // Check if collection exists and has documents
      const testQuery = query(collRef, limit(1));
      const testSnapshot = await getDocs(testQuery);
      
      console.log(`Path ${path} exists with ${testSnapshot.size} documents`);
      
      // Return the first collection that exists and has documents
      if (testSnapshot.size > 0) {
        return { collectionRef: collRef, path };
      }
    } catch (e) {
      console.log(`Path ${path} failed:`, e.message);
      // Continue to next path
    }
  }
  
  // If we reach here, no valid collection was found
  console.error(`No valid collection found for ${collectionType}`);
  throw new Error(`Failed to locate ${collectionType} collection`);
};
```

## Immediate Implementation Steps:

1. **Add the Multi-Field Property Query** implementation (highest priority)
2. **Implement the LocalStorage Caching** for fallback data
3. **Add the Empty State UI** for better user experience when no properties are found
4. **Create Firestore Path Helper** if the multi-field approach doesn't work

## Follow-up Implementation for Comprehensive Fix:

1. **Add User Type Normalization** to handle variations in user roles
2. **Implement Emergency Demo Mode** for fallback in critical situations
3. **Add Export/Import Feature** for data portability
4. **Deploy Monitoring** to track Firestore service health

This plan provides both immediate fixes for the most likely issues and a robust long-term solution.

# Property Loading Fixes - Implementation Summary

## Successfully Implemented Solutions

### 1. Multi-Field Property Query Implementation ✅

```javascript
// Enhanced getPropertiesForCurrentLandlord with multi-field approach
const possibleFieldNames = ['landlordId', 'ownerId', 'owner', 'userId', 'createdBy'];
let allProperties = [];

// Try each field name
for (const fieldName of possibleFieldNames) {
  try {
    const q = query(
      collection(db, 'properties'), 
      where(fieldName, '==', this.currentUser.uid)
    );
    
    // Process results from each field query...
  } catch (fieldError) {
    // Track failures but continue trying other fields
  }
}

// Fallback to collection group query if needed
if (allProperties.length === 0) {
  const groupQuery = query(
    collectionGroup(db, 'properties'),
    where('createdBy', '==', this.currentUser.uid)
  );
  // ...
}
```

### 2. Enhanced Property Subscriptions ✅

```javascript
// Set up multiple subscriptions with different field names
const possibleFieldNames = ['landlordId', 'ownerId', 'owner', 'userId', 'createdBy'];
let unsubscribeFunctions = [];

// Track unique properties across all subscriptions
let activePropertyIds = new Set();

// Set up subscriptions for each field name
for (const fieldName of possibleFieldNames) {
  try {
    const q = query(
      collection(db, 'properties'),
      where(fieldName, '==', userId)
    );
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        // Handle property data, combining from multiple sources
      },
      (error) => {
        // Handle errors but continue with other subscriptions
      }
    );
    
    unsubscribeFunctions.push(unsubscribe);
  } catch (error) {
    // Continue with other field names
  }
}
```

### 3. Local Storage Caching Mechanism ✅

```javascript
// Save cache when properties change
useEffect(() => {
  if (properties.length > 0 && currentUser) {
    localStorage.setItem('landlord_properties_cache', JSON.stringify({
      userId: currentUser.uid,
      timestamp: Date.now(),
      properties: properties
    }));
  }
}, [properties, currentUser?.uid]);

// Load from cache when Firestore fails
const loadFromCache = () => {
  try {
    const cachedData = localStorage.getItem('landlord_properties_cache');
    if (cachedData) {
      const parsed = JSON.parse(cachedData);
      if (parsed.userId === currentUser.uid) {
        setProperties(parsed.properties);
        setPropertiesLoaded(true);
        setError(`Using cached data from ${new Date(parsed.timestamp).toLocaleString()}`);
        return true;
      }
    }
  } catch (e) {
    console.error('Failed to load from cache:', e);
  }
  return false;
};
```

### 4. Improved Empty State UI ✅

Added a comprehensive empty state UI with:
- Clear messaging about no properties found
- Direct button to add first property
- Option to view demo data
- Property import functionality from JSON files

## Impact

These improvements create a robust, multi-layered approach to property loading:

1. **Primary**: Try multiple field names and collection paths
2. **Secondary**: Fall back to one-time queries when real-time subscriptions fail
3. **Tertiary**: Load from localStorage cache as last resort data source
4. **Quaternary**: Provide a helpful empty state with recovery options

The solution is designed to be resilient against:
- Database schema inconsistencies
- Network connectivity issues
- Firestore service disruptions
- Permission/security rule challenges

Each layer has comprehensive error handling and logging to enable further diagnosis if issues persist, while ensuring the user always has a functional UI with clear next steps.

# PropAgentic UI & Navigation Improvement Tasks

This document outlines the specific tasks required to enhance the UI, fix navigation issues, and create a more cohesive user experience across the PropAgentic application.

## 1. Dashboard UI Enhancement & Interactivity

### Dashboard Layout Improvements
- [ ] **Redesign Dashboard Cards**
  - Implement shadow elevation and rounded corners consistently (rounded-xl)
  - Add hover effects to interactive elements for better feedback
  - Use a consistent color palette based on the teal primary color

- [ ] **Improve Data Visualization**
  - Add visual charts/graphs for occupancy rates and tenant statistics
  - Implement progress indicators for maintenance ticket status
  - Create dynamic badges that visually represent property status

- [ ] **Enhance Interactive Elements**
  - Add hover and active states to all clickable components
  - Implement animated transitions between dashboard states
  - Create tooltips for dashboard metrics to explain their meaning

### Maintenance Section Enhancements
- [ ] **Redesign Maintenance Request Cards**
  - Improve visual hierarchy with clearer status indicators
  - Add priority badges with appropriate colors (red for urgent, yellow for medium, etc.)
  - Implement expandable cards to show more details on click

- [ ] **Create Interactive Maintenance Flow**
  - Add ability to update ticket status directly from dashboard
  - Implement drag-and-drop functionality for ticket prioritization
  - Create filtered views (by status, property, priority)

## 2. Landing Page & Navigation Fixes

### Landing Page Interactivity
- [ ] **Add Interactive Demo Section**
  - Create an interactive preview of the dashboard functionality
  - Implement click-through demo highlighting key features
  - Add animated transitions between demo screens

- [ ] **Enhance Call-to-Action Elements**
  - Make CTA buttons more prominent with hover animations
  - Implement scroll-triggered animations for feature sections
  - Add micro-interactions to improve engagement

### Navigation Fixes
- [ ] **Fix Landing Page to Pricing Page Navigation**
  - Debug and fix broken link from header navigation to pricing page
  - Ensure proper route configuration in the router
  - Add visual feedback for navigation actions

- [ ] **Fix Landing Page to About Page Navigation**
  - Verify and fix routing from landing page to about page
  - Ensure consistent header navigation across all pages
  - Add breadcrumb navigation for better orientation

- [ ] **Implement Smooth Page Transitions**
  - Add fade/slide transitions between page navigations
  - Maintain scroll position when navigating back to previous pages
  - Implement loading indicators for page transitions

## 3. UI Consistency Across Pages

### About Page UI Alignment
- [ ] **Redesign About Page to Match Style**
  - Apply consistent header and footer design
  - Match typography, spacing, and color scheme with other pages
  - Implement the same card and container styles used in dashboard

- [ ] **Standardize UI Components**
  - Create a shared component library for common UI elements
  - Implement consistent button styles across all pages
  - Standardize form elements, modals, and notifications

### Global Style Improvements
- [ ] **Implement Consistent Color System**
  - Define primary, secondary, and accent colors to use across the application
  - Create a systematic approach to status colors (success, warning, error)
  - Apply consistent color usage for interactive elements

- [ ] **Standardize Typography**
  - Define and implement a consistent type hierarchy
  - Ensure readable font sizes and line heights
  - Maintain consistent text styling across all pages

- [ ] **Create Responsive Layout Framework**
  - Ensure all pages respond consistently to different screen sizes
  - Standardize breakpoints and responsive behavior
  - Implement mobile-first approach consistently

## 4. Demo Dashboard Enhancement

### Visual Improvements
- [ ] **Enhance Color Palette**
  - Expand beyond teal to include complementary colors
  - Implement color-coding for different data categories
  - Add visual contrast between different dashboard sections

- [ ] **Improve Dashboard Cards**
  - Add gradient backgrounds to key metric cards
  - Implement subtle animations for data changes
  - Use icons more effectively to represent different data types

- [ ] **Enhance Data Representation**
  - Add donut charts for occupancy visualization
  - Implement mini sparkline graphs for trend data
  - Create visual property maps/layouts

### Interactive Demo Features
- [ ] **Add Demo Data Controls**
  - Create toggle switches to show different data scenarios
  - Implement time-based data simulation (daily, weekly, monthly views)
  - Add ability to filter demo data by different criteria

- [ ] **Create Guided Tours**
  - Implement step-by-step walkthrough of dashboard features
  - Add tooltips explaining each dashboard component
  - Create interactive tutorials for common tasks

## Implementation Approach

1. **Component Inventory**
   - Catalog all existing UI components
   - Identify inconsistencies and areas for improvement
   - Create prioritized list of components to standardize

2. **Design System Implementation**
   - Create a simple design system documentation
   - Define color palette, typography, and spacing guidelines
   - Implement shared CSS variables or Tailwind theme configuration

3. **Navigation Debugging**
   - Use React Router Dev Tools to inspect current routing configuration
   - Test all navigation paths and document issues
   - Implement fixes systematically starting with main navigation paths

4. **Progressive Enhancement**
   - Begin with critical fixes to existing functionality
   - Implement visual improvements next
   - Add interactive features as final enhancement layer

## Testing Checklist

- [ ] **Cross-browser Testing**
  - Verify UI consistency across Chrome, Firefox, Safari
  - Test responsiveness on different screen sizes

- [ ] **Navigation Flow Testing**
  - Verify all links work correctly
  - Test browser back/forward navigation
  - Check for proper handling of direct URL access

- [ ] **Interactive Element Testing**
  - Verify all hover states and animations
  - Test keyboard accessibility
  - Ensure consistent behavior of similar components

- [ ] **Performance Testing**
  - Check for animation smoothness
  - Verify page load times remain acceptable
  - Test on lower-end devices

## Success Criteria

1. Users can navigate between all pages without errors
2. UI maintains consistent look and feel across all sections
3. Dashboard provides clear, visually appealing data representation
4. Interactive elements provide appropriate feedback
5. Demo mode showcases the application's capabilities effectively
6. Mobile experience is consistent with desktop

# Implementation Plan

Below are specific code changes needed to address the most critical issues:

## 1. Fix Navigation Links

### Fix Pricing Page Navigation
```jsx
// src/components/landing/newComponents/HeaderTabs.jsx
// Find the Pricing link and ensure it uses the correct path:

// FROM:
<Link to="#pricing" className="text-gray-800 hover:text-teal-600">Pricing</Link>

// TO:
<Link to="/pricing" className="text-gray-800 hover:text-teal-600 transition duration-200">Pricing</Link>
```

### Fix About Page Navigation
```jsx
// src/components/landing/newComponents/HeaderTabs.jsx
// Find the About link and ensure it uses the correct path:

// FROM:
<Link to="#about" className="text-gray-800 hover:text-teal-600">About</Link>

// TO:
<Link to="/about" className="text-gray-800 hover:text-teal-600 transition duration-200">About</Link>
```

### Verify Router Configuration
```jsx
// src/App.js
// Ensure these routes are properly defined:

<Routes>
  {/* Landing and marketing pages */}
  <Route path="/" element={<Navigate to="/propagentic/new" replace />} />
  <Route path="/propagentic/new" element={<EnhancedLandingPage />} />
  <Route path="/pricing" element={<PricingPage />} />
  <Route path="/about" element={<AboutPage />} />
  
  {/* ... other routes ... */}
</Routes>
```

## 2. Enhance Dashboard UI

### Improve Dashboard Cards
```jsx
// src/components/landlord/OverviewCards.jsx
// Update the card components with improved styling:

// FROM:
<div className="bg-white p-4 rounded-lg shadow">
  {/* card content */}
</div>

// TO:
<div className="bg-white p-5 rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-100">
  <div className="flex items-center justify-between">
    <h3 className="text-gray-500 text-sm font-medium">{title}</h3>
    <span className="bg-teal-100 text-teal-800 p-1 rounded-full">
      <Icon className="h-4 w-4" />
    </span>
  </div>
  <p className="mt-4 text-3xl font-bold text-gray-800">{value}</p>
  {subtext && <p className="mt-1 text-sm text-gray-500">{subtext}</p>}
</div>
```

### Update Maintenance Request Cards
```jsx
// src/components/landlord/RequestFeed.jsx
// Enhance the maintenance request cards:

// FROM:
<div className="border-b border-gray-200 py-3">
  {/* request content */}
</div>

// TO:
<div className="border-b border-gray-200 py-3 px-2 hover:bg-gray-50 transition-colors duration-150 rounded-md cursor-pointer">
  <div className="flex justify-between items-center">
    <div className="flex items-start space-x-3">
      <div className={`p-2 rounded-full ${getPriorityBgColor(request.priority)}`}>
        <RepairIcon className="h-5 w-5 text-white" />
      </div>
      <div>
        <h4 className="font-medium">{request.title}</h4>
        <p className="text-sm text-gray-500 mt-1">
          {request.location} • {formatDate(request.createdAt)}
        </p>
      </div>
    </div>
    <div className="flex items-center">
      <StatusBadge status={request.status} />
      <button className="ml-2 p-1 rounded-full hover:bg-gray-200">
        <ChevronRightIcon className="h-5 w-5 text-gray-400" />
      </button>
    </div>
  </div>
</div>
```

### Create StatusBadge Component
```jsx
// src/components/shared/StatusBadge.jsx
import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusStyles = () => {
    switch (status.toLowerCase()) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'in progress':
      case 'in-progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusStyles()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
```

## 3. Implement Consistent UI on About Page

```jsx
// src/pages/AboutPage.jsx
// Update to match the dashboard styling:

const AboutPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Use the same header component as other pages */}
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About PropAgentic</h1>
          
          <div className="prose prose-teal max-w-none">
            {/* About content */}
            <p>PropAgentic is a comprehensive property management platform designed to streamline...</p>
            
            {/* Team section */}
            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Team</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
              {teamMembers.map((member) => (
                <div key={member.name} className="bg-gray-50 rounded-xl p-6 border border-gray-100">
                  <img 
                    src={member.image} 
                    alt={member.name} 
                    className="w-24 h-24 rounded-full mx-auto mb-4 object-cover" 
                  />
                  <h3 className="text-xl font-medium text-center">{member.name}</h3>
                  <p className="text-gray-500 text-center">{member.role}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};
```

## 4. Enhance Demo Dashboard with Color and Interactivity

### Create Color Palette Variables
```css
/* src/styles/colors.css */
:root {
  /* Base colors */
  --color-primary: #0d9488; /* teal-600 */
  --color-primary-light: #14b8a6; /* teal-500 */
  --color-primary-dark: #0f766e; /* teal-700 */
  
  /* Accent colors */
  --color-accent-1: #8b5cf6; /* violet-500 */
  --color-accent-2: #f59e0b; /* amber-500 */
  --color-accent-3: #ec4899; /* pink-500 */
  
  /* Status colors */
  --color-success: #10b981; /* emerald-500 */
  --color-warning: #f59e0b; /* amber-500 */
  --color-error: #ef4444; /* red-500 */
  --color-info: #3b82f6; /* blue-500 */
  
  /* Neutrals */
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;
}
```

### Create Gradient Cards for Dashboard
```jsx
// src/components/landlord/GradientStatCard.jsx
import React from 'react';

const GradientStatCard = ({ title, value, icon: Icon, gradientFrom, gradientTo }) => {
  return (
    <div className={`p-6 rounded-xl shadow-lg relative overflow-hidden`}>
      <div 
        className="absolute inset-0 opacity-90" 
        style={{
          background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
        }}
      />
      
      <div className="relative z-10">
        <div className="flex justify-between items-start">
          <h3 className="text-white text-sm font-medium uppercase tracking-wider">{title}</h3>
          <span className="bg-white bg-opacity-30 p-2 rounded-lg">
            <Icon className="h-5 w-5 text-white" />
          </span>
        </div>
        
        <p className="mt-4 text-4xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default GradientStatCard;
```

### Implement Interactive Charts
```jsx
// Install needed packages:
// npm install react-chartjs-2 chart.js

// src/components/landlord/OccupancyChart.jsx
import React, { useState } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

const OccupancyChart = ({ occupied, vacant }) => {
  const data = {
    labels: ['Occupied', 'Vacant'],
    datasets: [
      {
        data: [occupied, vacant],
        backgroundColor: [
          'rgba(16, 185, 129, 0.8)', // green/success for occupied
          'rgba(229, 231, 235, 0.8)', // gray for vacant
        ],
        borderColor: [
          'rgba(16, 185, 129, 1)',
          'rgba(229, 231, 235, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };
  
  const options = {
    cutout: '70%',
    plugins: {
      legend: {
        position: 'bottom',
      },
    },
    maintainAspectRatio: false,
  };
  
  return (
    <div className="h-64">
      <Doughnut data={data} options={options} />
    </div>
  );
};

export default OccupancyChart;
```

## 5. Add Page Transitions

### Install and Configure Framer Motion
```bash
npm install framer-motion
```

```jsx
// src/components/shared/PageTransition.jsx
import React from 'react';
import { motion } from 'framer-motion';

const PageTransition = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default PageTransition;
```

```jsx
// Update your page components to use the transition wrapper:
import PageTransition from '../components/shared/PageTransition';

const DashboardPage = () => {
  return (
    <PageTransition>
      <LandlordDashboard />
    </PageTransition>
  );
};
```

## Priority Tasks

Based on the issues and implementation plan, here's the recommended order for addressing these tasks:

1. **Fix Navigation Links** - This is a critical usability issue and should be addressed first
2. **Implement Consistent UI on About Page** - This creates a more cohesive experience
3. **Enhance Dashboard Cards** - Improves the visual appeal of the most-used feature
4. **Add StatusBadge Component** - Provides clearer status indicators
5. **Create Color Palette Variables** - Establishes consistency for future changes
6. **Add Gradient Cards** - Enhances visual appeal of dashboard
7. **Implement Interactive Charts** - Adds useful data visualization
8. **Add Page Transitions** - Polish the navigation experience

# Interactive Dashboard Features Implementation

To make the dashboard more interactive and enhance the demo experience, implement these additional features:

## 1. Drag-and-Drop Maintenance Priority System

```jsx
// Install needed package:
// npm install react-beautiful-dnd

// src/components/landlord/DraggableRequestList.jsx
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import StatusBadge from '../shared/StatusBadge';

const DraggableRequestList = ({ requests, onReorder }) => {
  const handleDragEnd = (result) => {
    // Dropped outside a valid drop zone
    if (!result.destination) return;
    
    // Reorder logic
    const items = Array.from(requests);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    // Notify parent component of the reordering
    onReorder(items);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="requests">
        {(provided) => (
          <div
            {...provided.droppableProps}
            ref={provided.innerRef}
            className="space-y-2"
          >
            {requests.map((request, index) => (
              <Draggable key={request.id} draggableId={request.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`bg-white p-4 rounded-lg border ${
                      snapshot.isDragging 
                        ? 'border-teal-500 shadow-lg' 
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex justify-between">
                      <div>
                        <h4 className="font-medium">{request.title}</h4>
                        <p className="text-sm text-gray-500">{request.location}</p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <StatusBadge status={request.status} />
                        <svg 
                          xmlns="http://www.w3.org/2000/svg" 
                          className="h-5 w-5 text-gray-400" 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};

export default DraggableRequestList;
```

## 2. Expandable Property Cards with Animation

```jsx
// src/components/landlord/ExpandablePropertyCard.jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const ExpandablePropertyCard = ({ property }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  return (
    <div 
      className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer"
      onClick={() => setIsExpanded(!isExpanded)}
    >
      {/* Card Header - Always visible */}
      <div className="p-5 flex justify-between items-center">
        <div>
          <h3 className="font-medium text-lg text-gray-900">{property.name}</h3>
          <p className="text-gray-500 text-sm">{property.address}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            property.isOccupied 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {property.isOccupied ? 'Occupied' : 'Vacant'}
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.3 }}
          >
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="h-5 w-5 text-gray-400" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </motion.div>
        </div>
      </div>
      
      {/* Expandable Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200"
          >
            <div className="p-5 space-y-4">
              {/* Property Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="block text-gray-500">Units</span>
                  <span className="block text-lg font-medium">{property.numberOfUnits}</span>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <span className="block text-gray-500">Tenants</span>
                  <span className="block text-lg font-medium">{property.occupiedUnits}</span>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="flex space-x-2">
                <button className="flex-1 py-2 px-3 bg-teal-100 text-teal-700 rounded-md text-sm font-medium hover:bg-teal-200 transition-colors">
                  View Details
                </button>
                <button className="flex-1 py-2 px-3 bg-blue-100 text-blue-700 rounded-md text-sm font-medium hover:bg-blue-200 transition-colors">
                  Manage Tenants
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExpandablePropertyCard;
```

## 3. Interactive Dashboard Demo with Guided Tour

```jsx
// Install needed package:
// npm install react-joyride

// src/components/demo/GuidedDashboardDemo.jsx
import React, { useState } from 'react';
import Joyride, { STATUS } from 'react-joyride';
import LandlordDashboard from '../landlord/LandlordDashboard';

const GuidedDashboardDemo = () => {
  const [runTour, setRunTour] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  // Define the tour steps
  const steps = [
    {
      target: '.dashboard-overview-section',
      content: 'This is your dashboard overview. It shows key metrics about your properties at a glance.',
      disableBeacon: true,
    },
    {
      target: '.maintenance-requests-section',
      content: 'Here you can see all maintenance requests from your tenants. You can filter, sort, and prioritize them.',
    },
    {
      target: '.properties-table-section',
      content: 'This table shows all your properties. You can filter by occupancy status and click on a property for more details.',
    },
    {
      target: '.quick-actions-section',
      content: 'Quick actions let you perform common tasks with just one click.',
    },
  ];

  const handleJoyrideCallback = (data) => {
    const { status, index } = data;
    
    // Update the step index
    setStepIndex(index);
    
    // Tour is finished or skipped
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      setRunTour(false);
    }
  };

  return (
    <div>
      {/* Tour Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setRunTour(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-indigo-700 transition-colors flex items-center"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-5 w-5 mr-2" 
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
          </svg>
          Take a Tour
        </button>
      </div>
      
      {/* Tour Component */}
      <Joyride
        steps={steps}
        run={runTour}
        continuous
        showProgress
        showSkipButton
        callback={handleJoyrideCallback}
        styles={{
          options: {
            primaryColor: '#0d9488', // teal-600
            textColor: '#374151', // gray-700
            zIndex: 1000,
          },
        }}
      />
      
      {/* Regular Dashboard */}
      <LandlordDashboard />
    </div>
  );
};

export default GuidedDashboardDemo;
```

## 4. Interactive Property Map Feature

```jsx
// Install needed package:
// npm install react-simple-maps

// src/components/landlord/PropertyMapView.jsx
import React, { useState } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  Marker,
  ZoomableGroup
} from 'react-simple-maps';
import { motion } from 'framer-motion';

// US map data
const geoUrl = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

const PropertyMapView = ({ properties }) => {
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [tooltip, setTooltip] = useState('');
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  
  return (
    <div className="relative h-96 bg-blue-50 rounded-xl overflow-hidden">
      <ComposableMap
        projection="geoAlbersUsa"
        projectionConfig={{ scale: 1000 }}
        className="w-full h-full"
      >
        <ZoomableGroup>
          <Geographies geography={geoUrl}>
            {({ geographies }) =>
              geographies.map(geo => (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#dbeafe" // bg-blue-100
                  stroke="#93c5fd" // bg-blue-300
                  className="outline-none focus:outline-none hover:fill-blue-200 transition-colors duration-200"
                />
              ))
            }
          </Geographies>
          
          {/* Property Markers */}
          {properties.map(property => (
            <Marker
              key={property.id}
              coordinates={[property.coordinates.long, property.coordinates.lat]}
              onMouseEnter={() => {
                setTooltip(property.name);
              }}
              onMouseLeave={() => {
                setTooltip('');
              }}
              onMouseMove={(evt) => {
                setTooltipPos({ x: evt.clientX, y: evt.clientY });
              }}
              onClick={() => setSelectedProperty(property)}
            >
              <circle
                r={6}
                fill={property.isOccupied ? "#10b981" : "#f59e0b"} // emerald-500 or amber-500
                stroke="#fff"
                strokeWidth={2}
                className="cursor-pointer hover:r-8 transition-all duration-200"
              />
            </Marker>
          ))}
        </ZoomableGroup>
      </ComposableMap>
      
      {/* Tooltip */}
      {tooltip && (
        <div 
          className="absolute bg-white px-2 py-1 rounded shadow-md text-sm z-10 pointer-events-none"
          style={{ 
            left: tooltipPos.x, 
            top: tooltipPos.y - 40,
            transform: 'translate(-50%, -100%)'
          }}
        >
          {tooltip}
        </div>
      )}
      
      {/* Property Details Panel */}
      <AnimatePresence>
        {selectedProperty && (
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 20 }}
            className="absolute top-0 right-0 w-72 h-full bg-white shadow-lg p-4"
          >
            <div className="flex justify-between items-start">
              <h3 className="font-medium text-lg">{selectedProperty.name}</h3>
              <button 
                onClick={() => setSelectedProperty(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
            
            <p className="text-sm text-gray-500 mt-1">{selectedProperty.address}</p>
            
            <div className="mt-4 space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-500">Occupancy:</span>
                  <span className="font-medium">{selectedProperty.occupancyRate}%</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-500">Units:</span>
                  <span className="font-medium">{selectedProperty.numberOfUnits}</span>
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <div className="flex justify-between">
                  <span className="text-gray-500">Active Tickets:</span>
                  <span className="font-medium">{selectedProperty.activeTickets || 0}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <button className="w-full bg-teal-600 text-white py-2 rounded-md hover:bg-teal-700 transition-colors">
                View Property Details
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PropertyMapView;
```

## 5. Time-Series Rent Collection Chart

```jsx
// Install needed package:
// npm install react-chartjs-2 chart.js

// src/components/landlord/RentCollectionChart.jsx
import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const timeRanges = [
  { label: '30 Days', value: '30d' },
  { label: '90 Days', value: '90d' },
  { label: '6 Months', value: '6m' },
  { label: '1 Year', value: '1y' },
];

const RentCollectionChart = ({ rentData }) => {
  const [timeRange, setTimeRange] = useState('30d');
  
  // Filter data based on selected time range
  const getFilteredData = () => {
    // In a real app, this would filter based on the timeRange
    // For demo, we'll just return different subsets of the data
    switch(timeRange) {
      case '90d':
        return rentData.slice(0, 3);
      case '6m':
        return rentData.slice(0, 6);
      case '1y':
        return rentData;
      default: // 30d
        return rentData.slice(0, 1);
    }
  };
  
  const filteredData = getFilteredData();
  
  const chartData = {
    labels: filteredData.map(d => d.month),
    datasets: [
      {
        label: 'Rent Collected',
        data: filteredData.map(d => d.collected),
        borderColor: '#0d9488', // teal-600
        backgroundColor: 'rgba(13, 148, 136, 0.1)', // teal-600 with opacity
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Expected Rent',
        data: filteredData.map(d => d.expected),
        borderColor: '#6b7280', // gray-500
        backgroundColor: 'transparent',
        borderDashed: [5, 5],
        tension: 0.4,
      },
    ],
  };
  
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Rent Collection Over Time',
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const label = context.dataset.label || '';
            const value = context.parsed.y;
            return `${label}: $${value.toLocaleString()}`;
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: function(value) {
            return '$' + value.toLocaleString();
          }
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-5">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-gray-900">Rent Collection</h3>
        
        {/* Time range selector */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          {timeRanges.map(range => (
            <button
              key={range.value}
              className={`px-3 py-1 text-xs font-medium rounded-md ${
                timeRange === range.value
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
              onClick={() => setTimeRange(range.value)}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="h-64">
        <Line data={chartData} options={options} />
      </div>
      
      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <span className="block text-gray-500">Collection Rate</span>
          <span className="text-2xl font-bold text-teal-600">
            {Math.round((filteredData.reduce((sum, d) => sum + d.collected, 0) / 
              filteredData.reduce((sum, d) => sum + d.expected, 0)) * 100)}%
          </span>
        </div>
        <div className="text-center">
          <span className="block text-gray-500">Total Collected</span>
          <span className="text-2xl font-bold text-gray-800">
            ${filteredData.reduce((sum, d) => sum + d.collected, 0).toLocaleString()}
          </span>
        </div>
        <div className="text-center">
          <span className="block text-gray-500">Outstanding</span>
          <span className="text-2xl font-bold text-amber-500">
            ${(filteredData.reduce((sum, d) => sum + d.expected, 0) - 
               filteredData.reduce((sum, d) => sum + d.collected, 0)).toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  );
};

export default RentCollectionChart;
```

## Integration Plan

To integrate these interactive components effectively:

1. **First Phase: Basic UI Improvements**
   - Implement the styling updates to cards and badges
   - Create the StatusBadge component
   - Add consistent styling to the About page
   
2. **Second Phase: Dashboard Enhancements**
   - Add the GradientStatCard component to the dashboard
   - Implement the OccupancyChart for property statistics
   - Integrate the ExpandablePropertyCard into the property list
   
3. **Third Phase: Advanced Interactivity**
   - Add the DraggableRequestList for maintenance tickets
   - Implement the RentCollectionChart for financial insights
   - Add the PropertyMapView for geographical representation
   
4. **Final Phase: Guided Tour and Polishing**
   - Implement the GuidedDashboardDemo component
   - Add smooth page transitions with Framer Motion
   - Final UI adjustments and consistency checks

The completed dashboard will feature a rich, interactive experience that showcases PropAgentic's capabilities far more effectively than the current static UI.

# Work Breakdown Structure & Timeline

## Week 1: Foundation & Navigation Fixes

### Day 1-2: Navigation & Router Fixes
- [ ] Fix navigation links in HeaderTabs component
- [ ] Verify and update router configuration in App.js
- [ ] Test all navigation paths across the application
- [ ] Add proper transitional navigation feedback

### Day 3-4: UI Component Library Setup
- [ ] Create styles/colors.css with color palette variables
- [ ] Develop StatusBadge component
- [ ] Create shared button styles
- [ ] Build PageTransition component

### Day 5: About Page Redesign
- [ ] Update About page layout to match dashboard styling
- [ ] Implement consistent header and footer components
- [ ] Add responsive design adjustments
- [ ] Test across different screen sizes

## Week 2: Dashboard UI Enhancements

### Day 1-2: Dashboard Card Improvements
- [ ] Update OverviewCards component with enhanced styling
- [ ] Implement GradientStatCard component
- [ ] Create responsive grid layouts for dashboard sections
- [ ] Add hover effects and transitions

### Day 3-4: Maintenance Request UI Improvements
- [ ] Enhance RequestFeed component UI
- [ ] Implement priority indicators with appropriate colors
- [ ] Add expandable ticket details
- [ ] Create status filtering system

### Day 5: Property Table Enhancements
- [ ] Update PropertyTable component styling
- [ ] Add sorting functionality by different columns
- [ ] Implement filterable views
- [ ] Create ExpandablePropertyCard component

## Week 3: Interactive Features Implementation

### Day 1-2: Chart Components
- [ ] Install chart.js and react-chartjs-2
- [ ] Implement OccupancyChart component
- [ ] Create RentCollectionChart with time filters
- [ ] Build maintenance ticket status distribution chart

### Day 3-4: Advanced Interactivity
- [ ] Install react-beautiful-dnd
- [ ] Implement DraggableRequestList component
- [ ] Create draggable ticket prioritization UI
- [ ] Add ticket status update functionality

### Day 5: Map Feature
- [ ] Install react-simple-maps
- [ ] Build PropertyMapView component
- [ ] Implement interactive property markers
- [ ] Add animated property detail slides

## Week 4: Demo Mode & Polishing

### Day 1-2: Guided Tour Implementation
- [ ] Install react-joyride
- [ ] Create GuidedDashboardDemo component
- [ ] Design tour steps for key dashboard features
- [ ] Implement persistent tour preferences

### Day 3-4: Demo Data & Mode Enhancement
- [ ] Expand mock data with more realistic scenarios
- [ ] Create toggleable demo data views
- [ ] Implement time-based data simulation
- [ ] Add demo data controls and indicators

### Day 5: Final Testing & Deployment
- [ ] Perform cross-browser testing
- [ ] Test responsive behavior on different devices
- [ ] Fix any remaining UI inconsistencies
- [ ] Deploy the updated version

## Installation Guide

To implement all the features in this plan, you'll need to install the following packages:

```bash
# UI and animation packages
npm install framer-motion

# Chart and visualization packages
npm install chart.js react-chartjs-2

# Interactive component packages
npm install react-beautiful-dnd react-joyride

# Map visualization
npm install react-simple-maps

# Date handling (optional but useful)
npm install date-fns
```

## Recommended Implementation Order

For the most effective implementation process, focus on these tasks in sequence:

1. **Fix critical navigation issues first** - This ensures the application is fundamentally usable before adding enhancements.

2. **Create the shared component library** - Building StatusBadge, buttons, and other reusable components will save time later.

3. **Enhance the core dashboard UI** - Improve the visual appearance of existing elements before adding new interactive features.

4. **Add basic charting** - Implement simple charts before moving to more complex interactive features.

5. **Implement advanced interactivity** - Add drag-and-drop and other complex interactions after the basic UI is solid.

6. **Polish with animations and transitions** - Add these enhancement layers last, once the core functionality is working.

## Key Deliverables

1. **Enhanced Navigation System** - Seamless flow between all application pages with proper transition animations.

2. **Consistent UI Design System** - Common color palette, typography, and component styles across all pages.

3. **Interactive Dashboard** - Dashboard with drag-and-drop functionality, expandable elements, and interactive charts.

4. **Visual Data Representations** - Charts, maps, and visual indicators of property and maintenance statuses.

5. **Guided Demo Experience** - Interactive tour highlighting key features for new users.

This implementation plan provides a structured approach to enhancing the PropAgentic application while ensuring all user requirements are met within a reasonable timeframe.

# Build Troubleshooting Tasks

This document outlines a systematic approach to troubleshoot the build process issues in PropAgentic.

## 1. Initial Diagnostics

- [ ] **Run a diagnostic build with verbose output**
  ```bash
  GENERATE_SOURCEMAP=false CI=false npm run build -- --verbose > build_log.txt 2>&1
  ```

- [ ] **Check for specific error messages in the log**
  Look for fatal errors, import failures, or TypeScript errors

- [ ] **Verify Node and npm versions**
  ```bash
  node -v
  npm -v
  ```
  Ensure you're using node v16+ and npm v7+ for compatibility

## 2. Dependency Issues

- [ ] **Clear npm cache and node_modules**
  ```bash
  npm cache clean --force
  rm -rf node_modules
  rm -rf build
  ```

- [ ] **Reinstall dependencies with legacy peer deps**
  ```bash
  npm install --legacy-peer-deps
  ```

- [ ] **Check for React/TypeScript version conflicts**
  Verify that TypeScript version (4.9.5) is compatible with React 17

- [ ] **Fix specific framer-motion issue**
  ```bash
  npm install framer-motion@6.5.1 --legacy-peer-deps --force
  ```

## 3. Configuration Checks

- [ ] **Verify TypeScript config**
  Look for errors in tsconfig.json

- [ ] **Check for missing or incorrect environment variables**
  Create a minimal .env file if needed:
  ```
  GENERATE_SOURCEMAP=false
  CI=false
  ```

- [ ] **Examine webpack configuration**
  If you have a custom webpack config, check for issues

## 4. Code-level Troubleshooting

- [ ] **Run TypeScript compiler in isolation**
  ```bash
  npx tsc --noEmit
  ```

- [ ] **Fix TypeScript errors one by one**
  Address any critical type errors

- [ ] **Search for unsupported React 18 features**
  Look for useId, useTransition, useDeferredValue or other React 18 specific hooks

- [ ] **Check @types package versions**
  Ensure @types/react and @types/react-dom are compatible with React 17

## 5. Alternative Build Approaches

- [ ] **Try building with development configuration**
  ```bash
  NODE_ENV=development npm run build
  ```

- [ ] **Use the build-fix script with debugging**
  ```bash
  node --inspect-brk build-fix.js
  ```

- [ ] **Try create-react-app's build script directly**
  ```bash
  ./node_modules/.bin/react-scripts build
  ```

## 6. Targeted Component Testing

- [ ] **Create a minimal test component**
  Create a simple component that doesn't use complex animations or imports

- [ ] **Check for circular dependencies**
  Circular imports can cause build failures

- [ ] **Test building with specific components excluded**
  Comment out complex components to isolate issues

## 7. Environment Isolation

- [ ] **Try building in a clean environment**
  Use Docker or a fresh environment to eliminate system-specific issues

- [ ] **Test with a specific Node.js version**
  ```bash
  nvm install 16.14.0
  nvm use 16.14.0
  npm run build
  ```

## 8. Last Resort Options

- [ ] **Eject from create-react-app**
  ```bash
  npm run eject
  ```
  Warning: This is a one-way operation and should be a last resort!

- [ ] **Start with a fresh create-react-app**
  Create a new project and migrate components one by one

- [ ] **Try an alternative build tool**
  Consider Vite, Parcel, or Next.js based on your specific needs

## Common Issues and Solutions

### React 17 + TypeScript Issues
The TypeScript types for React 17 might be mismatched. Try:
```bash
npm install --save-dev @types/react@17.0.43 @types/react-dom@17.0.14
```

### Memory Errors
If the build process is running out of memory:
```bash
NODE_OPTIONS=--max_old_space_size=4096 npm run build
```

### Webpack 5 Issues
Create React App 5.x uses Webpack 5, which may cause build issues:
```bash
npm install -D @craco/craco
```
And create a craco.config.js with custom webpack settings

### ESLint Config Problems
Temporarily disable ESLint during build:
```bash
DISABLE_ESLINT_PLUGIN=true npm run build
```

# PropAgentic React 19 Upgrade Tasks

This document outlines the issues identified during the React 19 upgrade process and their solutions.

## ✅ Completed Tasks

### 1. Fixed Dependency Conflicts
- Refactored `SortableTaskList.jsx` to use `@dnd-kit` instead of the incompatible `react-beautiful-dnd`
- Updated `AppTourGuide.jsx` to use `intro.js-react` instead of `react-joyride`

### 2. Fixed Infinite Loop in ConnectionContext
- **Issue**: Maximum update depth exceeded in `ConnectionContext.js`
- **Cause**: The `useEffect` hook was updating `lastOnline` with a new `Date()` object on every render when online
- **Solution**: 
  - Added `useRef` to track previous online state
  - Created separate effect to update `lastOnline` only during transitions to online state
  - Optimized state updates to prevent unnecessary re-renders

### 3. Updated ReactDOM API Usage
- **Issue**: `TypeError: react_dom__WEBPACK_IMPORTED_MODULE_1__.render is not a function`
- **Cause**: React 19 removed the legacy `ReactDOM.render` API
- **Solution**: Updated `src/index.js` to use the new `createRoot` API from `react-dom/client`

## 🔍 Verification Tasks

### 1. Dashboard Component Visibility
- Navigate to `/dashboard` to verify the role-based redirection works
- Check if `DashboardDemo` component renders correctly
- Verify all UI components (cards, charts, stats) are visible

### 2. UI Components Showcase
- Navigate to `/ui-showcase` to see all UI components in one place
- Confirm the following components work as expected:
  - Animated dashboard stats with counters and mini trends
  - Interactive charts (line and bar)
  - Dashboard cards with theming and animations
  - Sortable task list (with drag and drop)
  - Property map visualization

### 3. Browser Compatibility Testing
- Test in Chrome, Firefox, and Safari to ensure cross-browser compatibility
- Check the console for any remaining errors
- Verify animations and transitions work smoothly

## 📋 Possible Further Improvements

### 1. Dependency Cleanup
- Run `npm audit` and address vulnerabilities
- Update other outdated dependencies with React 19 compatibility issues
- Consider upgrading to the latest versions of chart.js, framer-motion, etc.

### 2. Performance Optimization
- Profile the application for any performance bottlenecks
- Implement React.memo and useCallback where appropriate
- Consider code splitting to reduce bundle size

### 3. Testing
- Add unit tests for new components
- Implement integration tests for critical user flows
- Set up end-to-end tests for the main application features

## 🧪 Testing Process

1. **Development Server**: Run `npm run start:safe` to start the dev server
2. **Build Verification**: Run `npm run build:safe` to ensure production build works
3. **Deployment**: After verification, deploy with `npm run deploy:clean`

## 📚 Documentation

The following new UI components have been implemented:

1. **PageTransition**: Wrapper for consistent page animations
2. **AnimatedPageLayout**: Wrapper for applying transitions to page content
3. **DashboardCard**: Versatile card component with theming and animations
4. **StatsChart**: Data visualization component with configurable options
5. **AnimatedDashboardStats**: Stats component with animated counters and trends

These components can be viewed in action on the `/ui-showcase` page.

# PropAgentic UI Implementation Tasks

This document outlines the tasks needed to fix UI rendering issues and implement our UI component improvements across the application, particularly for the `/propagentic/new` landing page.

## Background

We've identified several issues with the UI components:
- White screen on `/ui-showcase` due to React 19 compatibility issues with framer-motion
- TypeScript errors in the build process due to missing or circular dependencies
- Lack of proper error boundaries and fallback UI components

We've already fixed some of these issues for the UI showcase pages, but need to implement similar solutions for the landing page and ensure consistency across the application.

## Tasks

### 1. Update EnhancedLandingPage Component (High Priority)

- [ ] Add error boundary to prevent whole page crashes
- [ ] Add framer-motion compatibility detection
- [ ] Create simplified fallback components for critical UI elements
- [ ] Add debugging instrumentation for better error detection

### 2. Apply UI Infrastructure Improvements (Medium Priority)

- [x] Create a global ErrorBoundary component in `src/components/shared/ErrorBoundary.jsx`
- [x] Create SafeMotion wrapper component in `src/components/shared/SafeMotion.jsx`
- [x] Add compatibility detection utility in `src/utils/compatibilityChecks.js`
- [ ] Update key page components to use these shared components

### 3. Fix Firebase Route Handling (Medium Priority)

- [x] Update the route handling in the Firebase config
- [x] Fix the 404 issue for deep-linked routes
- [x] Update the `firebase.json` file to properly redirect routes

### 4. Improve Build Process (Low Priority)

- [x] Create a script to automatically check for port conflicts
- [x] Add detailed logging during the build process to identify errors earlier
- [x] Update build process to handle TypeScript errors more gracefully

## Implementation Status

The following components have been successfully implemented:

1. **Error Boundary Component** - A reusable component for catching and displaying errors in a user-friendly way
2. **SafeMotion Component** - A wrapper for framer-motion that checks compatibility and provides fallbacks
3. **Compatibility Check Utilities** - Tools for checking browser and React compatibility
4. **Firebase Configuration** - Updated routes handling in firebase.json
5. **Port Manager Script** - Tool to detect and resolve port conflicts automatically
6. **Build Debug Script** - Enhanced build process with detailed error reporting
7. **Deep-Linking Fix** - 404.html and index.html setup for proper SPA routing

Still to be completed:
1. Update the EnhancedLandingPage component to use our new infrastructure
2. Update key page components to use these shared components

## Running the Implementation

To test the current implementation:

1. Build the application:
   ```bash
   npm run build:clean
   ```

2. Serve the built application:
   ```bash
   npx serve -s build
   ```

3. Test the following routes:
   - http://localhost:3000/propagentic/new
   - http://localhost:3000/ui-showcase
   - http://localhost:3000/ui-simple
   - http://localhost:3000/test-ui

## Next Steps

1. Implement the EnhancedLandingPage updates using our new shared components
2. Test all pages on different browsers to verify compatibility
3. Deploy to production with the `npm run deploy:clean` command

## Success Criteria

- The landing page renders correctly without white screen issues
- UI components display properly across different browsers
- Error boundaries catch and display user-friendly error messages instead of white screens
- The application correctly falls back to simpler components when compatibility issues arise
- All routes work correctly, including direct navigation to deep routes

# Landlord Dashboard MVP - Task List

**Goal:** Achieve a Minimum Viable Product (MVP) for the Landlord Dashboard where landlords can log in, view their properties, add new properties, and invite tenants. Data should be fetched from and saved to Firestore.

**Current Status:**
*   Authentication and onboarding flow exist.
*   Landlord login leads to a dashboard view.
*   **Blocking Issue:** A "Failed to load properties" error is displayed on the landlord dashboard, preventing property data from showing.
*   Core data services (`dataService.js`, `propertyService.ts`) and Firestore rules are defined but may have integration issues or bugs.
*   UI components for displaying properties and adding properties exist in mock files (`LandlordDashboard.jsx`) but need to be connected to the live data flow.

**MVP Feature List:**
1.  Landlord Login & Dashboard Access.
2.  Display list of landlord's properties fetched from Firestore.
3.  Display an "empty state" with an "Add Property" prompt if no properties exist.
4.  Ability to add a new property (basic info: name, address) via a modal/form, saving to Firestore.
5.  Ability to invite a tenant to a specific property via email (basic Firestore record creation).

---

## Task Breakdown to MVP

**Phase 1: Core Dashboard & Property Loading (Fix Blocking Issues)**

*   `[ ]` **1.1: Verify Dashboard Routing:**
    *   Confirm the route `/landlord/dashboard` in `src/App.js` correctly maps to the intended primary landlord dashboard component (likely `LandlordTicketDashboard.jsx` needs adaptation or replacement).
    *   **File(s):** `src/App.js`
*   `[ ]` **1.2: Debug "Failed to load properties" Error:**
    *   **File(s):** `src/components/landlord/LandlordTicketDashboard.jsx` (or chosen dashboard), `src/services/dataService.js`, `src/services/firestore/propertyService.ts`, `firestore.rules`
    *   Trace the data fetching logic starting from the dashboard component mount.
    *   Verify the `getPropertiesForCurrentLandlord` and `subscribeToProperties` functions in `dataService.js` are correctly querying Firestore (check field names like `landlordId`, `ownerId`). Use Firestore console to confirm data structure.
    *   Check Firestore security rules (`firestore.rules`) to ensure the logged-in landlord has read permission for the `properties` collection based on their UID.
    *   Add detailed logging in `dataService.js` and the dashboard component to track the data fetching process and errors.
    *   Review the `LandlordOnboarding.jsx` process to ensure the `landlordId` is correctly associated with properties created during onboarding.
    *   Review `CreateLandlordProfile.jsx` to ensure the `landlordProfiles` document is created.
*   `[ ]` **1.3: Implement Empty State UI:**
    *   **File(s):** `src/components/landlord/LandlordTicketDashboard.jsx` (or chosen dashboard)
    *   After attempting to load properties, if the `properties` array is empty and there's no loading error, display a user-friendly message (e.g., "No properties found. Add your first property to get started!").
    *   Include a prominent "Add Property" button in the empty state.

**Phase 2: Property Management (Add & View)**

*   `[ ]` **2.1: Implement "Add Property" Modal & Logic:**
    *   **File(s):** Create `src/components/landlord/AddPropertyModal.jsx`, `src/components/landlord/LandlordTicketDashboard.jsx` (or chosen dashboard), `src/services/dataService.js`
    *   Create or adapt the `AddPropertyModal` component with input fields for essential property details (Name, Street, City, State, Zip).
    *   Connect the modal's "Save" button to trigger the `dataService.createProperty` function, passing the form data.
    *   Ensure necessary validation is in place.
    *   Trigger this modal from the "Add Property" button (from task 1.3 and potentially a persistent button).
*   `[ ]` **2.2: Display Property List:**
    *   **File(s):** Create `src/components/landlord/PropertyCard.jsx` or `PropertyList.jsx`, `src/components/landlord/LandlordTicketDashboard.jsx` (or chosen dashboard)
    *   Create a component (`PropertyCard` or similar) to display basic information for each property fetched from Firestore (Name, Address).
    *   Use the `properties` state variable (populated in task 1.2) to render a list of these cards/items on the dashboard.
    *   Ensure the list updates dynamically when a new property is added (verify the real-time subscription from task 1.2 is working or implement a manual refresh).

**Phase 3: Basic Tenant Invitation**

*   `[ ]` **3.1: Implement "Invite Tenant" UI:**
    *   **File(s):** `src/components/landlord/PropertyCard.jsx` (or list item), Create `src/components/landlord/InviteTenantModal.jsx`
    *   Add an "Invite Tenant" button to each displayed property item/card.
    *   Create a simple modal (`InviteTenantModal`) triggered by the button, containing an input field for the tenant's email address.
*   `[ ]` **3.2: Implement Invite Logic (Firestore Record):**
    *   **File(s):** `src/components/landlord/InviteTenantModal.jsx`, `src/services/firestore/inviteService.ts` (New or adapt existing service)
    *   On modal submission:
        *   Create a new document in a Firestore collection (e.g., `invites`).
        *   Store `propertyId`, `tenantEmail`, `landlordId`, `status: 'pending'`, and a `createdAt` timestamp.
        *   **(Optional MVP+):** Trigger a Firebase Function to send an actual email.
    *   Update the relevant property document in Firestore to potentially link the pending invite or invited tenant's email.
    *   Provide user feedback (e.g., "Invitation sent").

**Phase 4: Refinement & Cleanup**

*   `[ ]` **4.1: Refactor/Remove Mock Data:**
    *   **File(s):** `src/pages/landlord/LandlordDashboard.jsx`, potentially others using mock data.
    *   Remove or comment out any hardcoded mock property/tenant data now that live data is being fetched and displayed.
*   `[ ]` **4.2: Code Review & Testing:**
    *   Review implementations for clarity, efficiency, and error handling.
    *   Perform end-to-end testing:
        *   Register/Login as Landlord.
        *   Verify empty state is shown.
        *   Add a property -> Verify it appears.
        *   Invite a tenant -> Verify invite record is created in Firestore.
        *   Log out/in -> Verify property persists.
    *   Fix any identified bugs.

---
