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