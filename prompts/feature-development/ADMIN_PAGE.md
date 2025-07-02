# Admin Dashboard Design & Implementation

## 1. Overview

### Purpose and Scope
The Admin Dashboard serves as the central management interface for PropAgentic's platform administrators. It provides comprehensive tools for user management, system monitoring, and platform configuration while maintaining security and audit compliance.

### High-Level Architecture
- **Frontend**: React 18 + TypeScript components following existing UI patterns
- **Backend**: Firebase Cloud Functions with admin privilege authentication
- **Data Store**: Firestore with enhanced security rules for admin operations
- **Real-time Updates**: Firestore snapshots for live dashboard data

### Component Structure
```
src/pages/admin/
├── AdminDashboardPage.tsx          # Main admin dashboard
src/components/admin/
├── AdminLayout.tsx                 # Layout wrapper with navigation
├── AdminStatsCards.tsx             # Dashboard statistics display
├── UserManagementPanel.tsx         # User CRUD operations
├── AuditLogsTable.tsx             # Admin action logging
├── SystemConfigPanel.tsx          # System-wide configuration
├── SecurityMonitor.tsx            # Security alerts and monitoring
└── AdminNotifications.tsx         # Admin notification dropdown
```

## 2. Authentication & Authorization

### Required User Roles
```typescript
// Enhanced role hierarchy
const ADMIN_ROLES = {
  SUPER_ADMIN: 'super_admin',    // Full system access
  ADMIN: 'admin',                // Standard admin operations
  MODERATOR: 'moderator'         // Limited admin functions
}
```

### Access Control Rules
```javascript
// Firestore security rules addition
function isSuperAdmin() {
  return isUserRole('super_admin');
}

function isAdminOrAbove() {
  return isUserRole('admin') || isUserRole('super_admin');
}

function isModeratorOrAbove() {
  return isUserRole('moderator') || isAdminOrAbove();
}

// Admin collections access
match /adminActions/{actionId} {
  allow read, write: if isAdminOrAbove();
}

match /systemConfig/{configId} {
  allow read: if isModeratorOrAbove();
  allow write: if isSuperAdmin();
}
```

## 3. User Management

### List All Users (with search, sort, pagination)
```typescript
interface UserManagementProps {
  searchTerm: string;
  sortBy: 'name' | 'email' | 'createdAt' | 'lastLogin';
  sortOrder: 'asc' | 'desc';
  roleFilter: 'all' | 'landlord' | 'tenant' | 'contractor';
  statusFilter: 'all' | 'active' | 'suspended' | 'pending';
  pageSize: number;
  currentPage: number;
}
```

### Delete User Accounts (with confirmation, soft vs hard delete options)
```typescript
interface DeleteUserOptions {
  userId: string;
  deleteType: 'soft' | 'hard';
  reason: string;
  transferDataTo?: string; // For data migration
  retentionPeriod?: number; // Days before permanent deletion
}

// Cloud Function for user deletion
exports.deleteUserAccount = https.onCall(async (data, context) => {
  const { userId, deleteType, reason, transferDataTo } = data;
  
  if (deleteType === 'soft') {
    // Soft delete: deactivate but preserve data
    await db.collection('users').doc(userId).update({
      status: 'deleted',
      deletedAt: admin.firestore.FieldValue.serverTimestamp(),
      deletedBy: context.auth.uid,
      deletionReason: reason
    });
  } else {
    // Hard delete: remove from Auth and Firestore
    await admin.auth().deleteUser(userId);
    await deleteUserData(userId, transferDataTo);
  }
});
```

## 4. Tenant & Contractor Management

### List and Manage Service Providers
The admin dashboard includes specialized views for tenant and contractor management through the `UserManagementPanel` component with role filtering.

### Key Management Features
- **Bulk Operations**: Export user data, bulk status updates
- **Quick Actions**: Approve/suspend accounts, view profiles, delete accounts
- **Status Management**: Active, suspended, pending state control
- **Search & Filtering**: By name, email, status, creation date
- **Account Lifecycle**: Invite → Activate → Suspend → Remove workflow

## 5. Audit & Activity Logs

### Show Recent Admin Actions
```typescript
interface AuditLog {
  id: string;
  action: string;
  performedBy: string;
  targetResource: string;
  targetId: string;
  timestamp: Date;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  result: 'success' | 'failure' | 'partial';
}
```

### Tracked Admin Actions
- **USER_CREATE**: New user account creation
- **USER_UPDATE**: Profile modifications, status changes
- **USER_DELETE**: Account deletion (soft/hard)
- **ROLE_UPDATE**: Role and permission changes
- **CONFIG_UPDATE**: System configuration changes
- **SYSTEM_ALERT**: Critical system events
- **LOGIN/LOGOUT**: Admin authentication events

## 6. Site Settings

### Global Configuration
```typescript
interface SystemConfig {
  maintenanceMode: {
    enabled: boolean;
    message: string;
    allowedRoles: string[];
    scheduledEnd?: Date;
  };
  featureFlags: {
    [feature: string]: {
      enabled: boolean;
      rolloutPercentage: number;
      allowedRoles: string[];
    };
  };
  rateLimits: {
    api: number;
    uploads: number;
    invitations: number;
  };
  emailSettings: {
    fromAddress: string;
    replyToAddress: string;
    brandingEnabled: boolean;
  };
}
```

## 7. Error Handling & Notifications

### UI Feedback Patterns
```typescript
// Consistent error handling across admin components
const useAdminErrorHandler = () => {
  const handleError = useCallback((error: Error, action: string) => {
    // Log error for debugging
    console.error(`Admin action failed: ${action}`, error);
    
    // Create audit log entry
    logAdminAction({
      action: action,
      result: 'failure',
      error: error.message,
      timestamp: new Date()
    });

    // Show user-friendly error message
    if (error.code === 'permission-denied') {
      toast.error('You do not have permission to perform this action');
    } else if (error.code === 'not-found') {
      toast.error('The requested resource was not found');
    } else {
      toast.error(`Failed to ${action.toLowerCase()}. Please try again.`);
    }
  }, []);

  return { handleError };
};
```

## 8. Security Considerations

### CSRF/XSS Protections
```typescript
// CSRF protection using Firebase security
const useCSRFProtection = () => {
  const getCSRFToken = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    
    return await user.getIdToken(true); // Force refresh
  };

  const makeSecureRequest = async (endpoint: string, data: any) => {
    const token = await getCSRFToken();
    
    return await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest' // CSRF protection header
      },
      body: JSON.stringify(data)
    });
  };

  return { makeSecureRequest };
};
```

### Firestore Security Rules Snippets
```javascript
// Enhanced admin security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Admin-only collections
    match /adminActions/{actionId} {
      allow read, write: if isAdminOrAbove();
    }
    
    match /systemConfig/{configId} {
      allow read: if isModeratorOrAbove();
      allow write: if isSuperAdmin();
    }
    
    match /auditLogs/{logId} {
      allow read: if isModeratorOrAbove();
      allow create: if isSignedIn(); // Allow system to create logs
      allow update, delete: if false; // Logs are immutable
    }
    
    // Enhanced user document security for admin operations
    match /users/{userId} {
      // Admins can read all user data
      allow read: if isOwner(userId) || isModeratorOrAbove();
      
      // Only super admins can modify roles
      allow update: if isOwner(userId) || 
        (isAdminOrAbove() && !('role' in request.resource.data)) ||
        (isSuperAdmin() && ('role' in request.resource.data));
      
      // Only super admins can delete users
      allow delete: if isSuperAdmin();
    }
  }
}
```

## 9. API Endpoints

### User Management Endpoints
```typescript
// Get all users with pagination and filtering
exports.getUsers = https.onCall(async (data, context) => {
  validateAdminAccess(context);
  
  const { page = 1, limit = 50, roleFilter, statusFilter, searchTerm } = data;
  
  let query = db.collection('users');
  
  if (roleFilter && roleFilter !== 'all') {
    query = query.where('role', '==', roleFilter);
  }
  
  if (statusFilter && statusFilter !== 'all') {
    query = query.where('status', '==', statusFilter);
  }
  
  const snapshot = await query
    .orderBy('createdAt', 'desc')
    .limit(limit)
    .offset((page - 1) * limit)
    .get();
  
  const users = snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
    createdAt: doc.data().createdAt?.toDate(),
    lastLoginAt: doc.data().lastLoginAt?.toDate()
  }));
  
  return {
    users,
    totalCount: await getUserCount(),
    page,
    hasMore: users.length === limit
  };
});
```

## 10. Wireframes & Component Breakdown

### Page Layout Structure
```
┌─────────────────────────────────────────────────────────────┐
│ HEADER: Admin Badge + Navigation + Search + Notifications  │
├─────────────────────────────────────────────────────────────┤
│ SIDEBAR                │ MAIN CONTENT AREA               │
│                        │                                │
│ • Dashboard            │ ┌─────────────────────────────┐ │
│ • User Management      │ │ AdminStatsCards             │ │
│ • Tenant Management    │ │ ┌─────┐ ┌─────┐ ┌─────┐ │   │
│ • Contractor Mgmt      │ │ │Users│ │Props│ │Alerts│ │   │
│ • Property Oversight   │ │ └─────┘ └─────┘ └─────┘ │   │
│ • Audit Logs           │ └─────────────────────────────┘ │
│ • Security Monitor     │                                │
│ • System Config        │ ┌─────────────────────────────┐ │
│ • Reports              │ │ Recent Activity             │ │
│                        │ │ • AuditLogsTable (compact)  │ │
│ ┌────────────────────┐ │ └─────────────────────────────┘ │
│ │ USER PROFILE       │ │                                │
│ │ • Name             │ │ ┌─────────────────────────────┐ │
│ │ • Role Badge       │ │ │ System Health               │ │
│ │ • Sign Out         │ │ │ • SecurityMonitor (compact) │ │
│ └────────────────────┘ │ └─────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Key React Components to Build

#### 1. AdminLayout.tsx
- **Purpose**: Layout wrapper with sidebar navigation and header
- **Props**: `navigationItems`, `currentView`, `onViewChange`, `actionBar`
- **Features**: Responsive sidebar, user menu, notification bell, role badge
- **Mobile**: Collapsible sidebar with overlay

#### 2. AdminStatsCards.tsx
- **Purpose**: Dashboard statistics display using existing StatCard pattern
- **Props**: `stats`, `isLoading`
- **Features**: Real-time updates, color-coded health indicators
- **Stats**: Total users, landlords, tenants, contractors, properties, alerts

#### 3. UserManagementPanel.tsx
- **Purpose**: Comprehensive user CRUD operations
- **Props**: `roleFilter` (optional)
- **Features**: Search, sort, pagination, bulk operations, status management
- **Actions**: View details, edit roles, suspend, delete, export

#### 4. AuditLogsTable.tsx
- **Purpose**: Admin action logging and filtering
- **Props**: `limit`, `compact`
- **Features**: Real-time updates, advanced filtering, export functionality
- **Views**: Full table view, compact dashboard widget

#### 5. SystemConfigPanel.tsx
- **Purpose**: System-wide configuration management
- **Props**: None (super admin only)
- **Features**: Tabbed interface, maintenance mode, feature flags, rate limits
- **Security**: Super admin access required

#### 6. SecurityMonitor.tsx
- **Purpose**: Security alerts and system health monitoring
- **Props**: `compact`
- **Features**: Alert management, metrics display, threat detection
- **Views**: Full security dashboard, compact widget

#### 7. AdminNotifications.tsx
- **Purpose**: Admin-specific notification dropdown
- **Props**: `onClose`
- **Features**: Priority-based alerts, mark as read, real-time updates
- **Types**: Security, user actions, system events, alerts

### Implementation Priority

1. **Phase 1**: Core layout and navigation (AdminLayout, AdminStatsCards)
2. **Phase 2**: User management (UserManagementPanel, basic CRUD)
3. **Phase 3**: Audit logging (AuditLogsTable, admin action tracking)
4. **Phase 4**: Security monitoring (SecurityMonitor, alerts)
5. **Phase 5**: System configuration (SystemConfigPanel, super admin features)
6. **Phase 6**: Advanced features (notifications, analytics, reporting)

This comprehensive admin dashboard design provides a secure, scalable foundation for managing the PropAgentic platform while maintaining consistency with existing UI patterns and following React/Firebase best practices.
