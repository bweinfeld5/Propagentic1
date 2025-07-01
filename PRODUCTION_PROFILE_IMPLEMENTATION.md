# PRODUCTION-READY SAAS USER PROFILE IMPLEMENTATION PLAN
## PropAgentic Property Management Platform

## 1. Executive Summary

This document outlines a comprehensive plan to elevate the existing PropAgentic user profile page into a production-ready, enterprise-grade feature. The current implementation serves as a basic foundation but lacks the robustness, security, and feature depth required for a scalable SaaS platform.

The current profile shows basic information for landlords but has critical issues including "Invalid Date" displays, incomplete data validation, and missing production features. This plan addresses these issues while building a scalable foundation for all user roles (landlord, tenant, contractor, admin).

**Key Objectives:**
- **Fix Current Issues:** Resolve date formatting and data validation problems
- **Enhance Security:** Implement email verification, secure password changes, and 2FA
- **Improve Data Integrity:** Add robust validation, sanitization, and real-time updates
- **Elevate User Experience:** Add loading states, notifications, and completion tracking
- **Ensure Scalability:** Build flexible architecture supporting multiple roles
- **Achieve Production-Readiness:** Implement testing, monitoring, and optimization

## 2. Current State Analysis

### 2.1. Existing Components
Based on the PropAgentic codebase:
- `src/components/landlord/LandlordProfileContent.jsx` - Basic profile display
- `src/pages/UniversalProfilePage.jsx` - Universal profile routing
- `src/components/profile/ProfileHeader.jsx` - Profile header component
- `src/components/profile/ProfileLayout.jsx` - Layout wrapper

### 2.2. Current Issues Identified
1. **Date Display:** "Invalid Date" shown for Member Since
2. **Status Logic:** Account status showing "Inactive" without proper logic
3. **Data Validation:** No input validation or sanitization
4. **Real-time Updates:** No live data synchronization
5. **Error Handling:** Limited error boundaries and feedback
6. **Security:** Missing verification flows and secure operations

### 2.3. Existing Architecture Strengths
- React 18 + TypeScript foundation
- Firebase Authentication integration
- Role-based routing system
- Tailwind CSS styling
- Component modularity

## 3. Technical Requirements

### 3.1. Enhanced Dependencies
```json
{
  "dependencies": {
    "react-hook-form": "^7.48.2",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.2",
    "libphonenumber-js": "^1.10.51",
    "date-fns": "^2.30.0",
    "react-hot-toast": "^2.4.1",
    "zustand": "^4.4.7"
  },
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^6.1.4",
    "cypress": "^13.6.0"
  }
}
```

### 3.2. Firebase Services Integration
- **Firestore:** Enhanced user profile documents
- **Authentication:** Email verification, password changes, 2FA
- **Storage:** Profile image uploads
- **Functions:** Data processing and exports
- **Security Rules:** Comprehensive access control

### 3.3. PropAgentic-Specific Data Models
```typescript
// src/models/UserProfile.ts
export interface BaseUserProfile {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  displayName: string;
  phone?: string;
  profileImageUrl?: string;
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt?: Date;
  profileComplete: boolean;
  onboardingComplete: boolean;
  role: 'landlord' | 'tenant' | 'contractor' | 'admin';
  status: 'active' | 'inactive' | 'suspended' | 'pending';
}

export interface LandlordProfile extends BaseUserProfile {
  role: 'landlord';
  businessName?: string;
  businessAddress?: Address;
  licenseNumber?: string;
  yearsInBusiness?: number;
  totalProperties: number;
  subscriptionPlan: 'basic' | 'pro' | 'enterprise';
  stripeCustomerId?: string;
}

export interface TenantProfile extends BaseUserProfile {
  role: 'tenant';
  currentPropertyId?: string;
  leaseStartDate?: Date;
  leaseEndDate?: Date;
  emergencyContact?: EmergencyContact;
  petInformation?: PetInfo[];
}

export interface ContractorProfile extends BaseUserProfile {
  role: 'contractor';
  businessName: string;
  serviceTypes: string[];
  serviceArea: string[];
  hourlyRate?: number;
  availability: AvailabilitySchedule;
  certifications: Certification[];
  insuranceInfo?: InsuranceInfo;
}
```

## 4. Implementation Phases

### Phase 1: Foundation & Data Integrity (Week 1-2)

#### Task 1.1: Setup Enhanced Form Management
```typescript
// src/hooks/useProfileForm.ts
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { profileSchema } from '../schemas/profileSchema';

export const useProfileForm = (defaultValues: any) => {
  return useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: 'onBlur',
  });
};
```

#### Task 1.2: Create Validation Schemas
```typescript
// src/schemas/profileSchema.ts
import { z } from 'zod';
import { isValidPhoneNumber } from 'libphonenumber-js';

export const baseProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional().refine(
    (val) => !val || isValidPhoneNumber(val, 'US'),
    { message: 'Invalid phone number' }
  ),
});

export const landlordProfileSchema = baseProfileSchema.extend({
  businessName: z.string().min(1, 'Business name is required').max(100),
  licenseNumber: z.string().optional(),
  yearsInBusiness: z.number().min(0).max(100).optional(),
});

export const tenantProfileSchema = baseProfileSchema.extend({
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
});

export const contractorProfileSchema = baseProfileSchema.extend({
  businessName: z.string().min(1, 'Business name is required'),
  serviceTypes: z.array(z.string()).min(1, 'At least one service type required'),
  hourlyRate: z.number().min(0).optional(),
});
```

#### Task 1.3: Fix Date Handling
```typescript
// src/utils/dateUtils.ts
import { format, isValid, parseISO } from 'date-fns';

export const formatMemberSince = (date: any): string => {
  if (!date) return 'Not available';
  
  let dateObj: Date;
  
  if (date.toDate && typeof date.toDate === 'function') {
    // Firestore Timestamp
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = parseISO(date);
  } else if (date instanceof Date) {
    dateObj = date;
  } else {
    return 'Invalid date';
  }
  
  return isValid(dateObj) ? format(dateObj, 'MMMM yyyy') : 'Invalid date';
};

export const calculateAccountAge = (createdAt: any): string => {
  const date = formatMemberSince(createdAt);
  if (date === 'Invalid date' || date === 'Not available') return date;
  
  const now = new Date();
  const created = new Date(createdAt.toDate ? createdAt.toDate() : createdAt);
  const months = Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24 * 30));
  
  if (months < 1) return 'Less than a month';
  if (months < 12) return `${months} month${months > 1 ? 's' : ''}`;
  
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  
  if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
  return `${years} year${years > 1 ? 's' : ''}, ${remainingMonths} month${remainingMonths > 1 ? 's' : ''}`;
};
```

#### Task 1.4: Enhanced Profile Service
```typescript
// src/services/profileService.ts
import { doc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase/config';
import { User } from 'firebase/auth';
import toast from 'react-hot-toast';

export class ProfileService {
  static async updateProfile(user: User, profileData: any): Promise<void> {
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        ...profileData,
        updatedAt: serverTimestamp(),
      });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }
  }

  static subscribeToProfile(userId: string, callback: (profile: any) => void): () => void {
    const userRef = doc(db, 'users', userId);
    return onSnapshot(userRef, (doc) => {
      if (doc.exists()) {
        callback({ id: doc.id, ...doc.data() });
      }
    });
  }

  static calculateProfileCompletion(profile: any, role: string): number {
    const requiredFields = this.getRequiredFields(role);
    const completedFields = requiredFields.filter(field => {
      const value = this.getNestedValue(profile, field);
      return value !== null && value !== undefined && value !== '';
    });
    
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  private static getRequiredFields(role: string): string[] {
    const baseFields = ['firstName', 'lastName', 'email', 'phone'];
    
    switch (role) {
      case 'landlord':
        return [...baseFields, 'businessName'];
      case 'tenant':
        return [...baseFields];
      case 'contractor':
        return [...baseFields, 'businessName', 'serviceTypes'];
      default:
        return baseFields;
    }
  }

  private static getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}
```

### Phase 2: Security & Authentication (Week 3-4)

#### Task 2.1: Email Verification Component
```typescript
// src/components/profile/EmailVerificationBanner.tsx
import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { sendEmailVerification } from 'firebase/auth';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

export const EmailVerificationBanner: React.FC = () => {
  const { currentUser } = useAuth();
  const [sending, setSending] = React.useState(false);

  if (!currentUser || currentUser.emailVerified) return null;

  const handleResendVerification = async () => {
    setSending(true);
    try {
      await sendEmailVerification(currentUser);
      toast.success('Verification email sent! Check your inbox.');
    } catch (error) {
      toast.error('Failed to send verification email');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-medium text-yellow-800">
            Email Verification Required
          </h3>
          <p className="text-sm text-yellow-700 mt-1">
            Please verify your email address to access all features.
          </p>
        </div>
        <Button
          onClick={handleResendVerification}
          disabled={sending}
          variant="outline"
          size="sm"
        >
          {sending ? 'Sending...' : 'Resend Email'}
        </Button>
      </div>
    </div>
  );
};
```

#### Task 2.2: Secure Password Change Modal
```typescript
// src/components/profile/PasswordChangeModal.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  updatePassword 
} from 'firebase/auth';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';

const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

interface PasswordChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PasswordChangeModal: React.FC<PasswordChangeModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: zodResolver(passwordChangeSchema),
  });

  const onSubmit = async (data: any) => {
    if (!currentUser?.email) return;
    
    setIsLoading(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        data.currentPassword
      );
      await reauthenticateWithCredential(currentUser, credential);
      
      // Update password
      await updatePassword(currentUser, data.newPassword);
      
      toast.success('Password updated successfully');
      reset();
      onClose();
    } catch (error: any) {
      if (error.code === 'auth/wrong-password') {
        toast.error('Current password is incorrect');
      } else {
        toast.error('Failed to update password');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          type="password"
          label="Current Password"
          {...register('currentPassword')}
          error={errors.currentPassword?.message}
        />
        
        <Input
          type="password"
          label="New Password"
          {...register('newPassword')}
          error={errors.newPassword?.message}
        />
        
        <Input
          type="password"
          label="Confirm New Password"
          {...register('confirmPassword')}
          error={errors.confirmPassword?.message}
        />
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Updating...' : 'Update Password'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
```

#### Task 2.3: Enhanced Firestore Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // User profiles - users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId &&
        request.auth.token.email_verified == true;
      
      // Admin can read all user profiles
      allow read: if request.auth != null && 
        request.auth.token.role == 'super_admin';
    }
    
    // Properties - landlords can manage their properties
    match /properties/{propertyId} {
      allow read, write: if request.auth != null && 
        (resource.data.landlordId == request.auth.uid ||
         request.auth.token.role == 'super_admin');
    }
    
    // Maintenance requests - tenants and landlords can access
    match /maintenanceRequests/{requestId} {
      allow read, write: if request.auth != null && 
        (resource.data.tenantId == request.auth.uid ||
         resource.data.landlordId == request.auth.uid ||
         request.auth.token.role == 'super_admin');
    }
  }
}
```

### Phase 3: Enhanced User Experience (Week 5-6)

#### Task 3.1: Profile Completion Component
```typescript
// src/components/profile/ProfileCompletionCard.tsx
import React from 'react';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { ProfileService } from '../../services/profileService';

interface ProfileCompletionCardProps {
  profile: any;
  role: string;
}

export const ProfileCompletionCard: React.FC<ProfileCompletionCardProps> = ({
  profile,
  role,
}) => {
  const completionPercentage = ProfileService.calculateProfileCompletion(profile, role);
  const requiredFields = getRequiredFieldsForRole(role);
  
  const getFieldStatus = (fieldPath: string) => {
    const value = getNestedValue(profile, fieldPath);
    return value !== null && value !== undefined && value !== '';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">Profile Completion</h3>
        <div className="flex items-center">
          <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
            <span className="text-sm font-semibold text-gray-700">
              {completionPercentage}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      
      <div className="space-y-2">
        {requiredFields.map((field) => {
          const isCompleted = getFieldStatus(field.path);
          return (
            <div key={field.path} className="flex items-center">
              {isCompleted ? (
                <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
              ) : (
                <ExclamationCircleIcon className="w-5 h-5 text-yellow-500 mr-2" />
              )}
              <span className={`text-sm ${isCompleted ? 'text-gray-700' : 'text-gray-500'}`}>
                {field.label}
              </span>
            </div>
          );
        })}
      </div>
      
      {completionPercentage < 100 && (
        <div className="mt-4 p-3 bg-blue-50 rounded-md">
          <p className="text-sm text-blue-700">
            Complete your profile to unlock all features and improve your experience.
          </p>
        </div>
      )}
    </div>
  );
};

function getRequiredFieldsForRole(role: string) {
  const baseFields = [
    { path: 'firstName', label: 'First Name' },
    { path: 'lastName', label: 'Last Name' },
    { path: 'email', label: 'Email Address' },
    { path: 'phone', label: 'Phone Number' },
  ];
  
  switch (role) {
    case 'landlord':
      return [
        ...baseFields,
        { path: 'businessName', label: 'Business Name' },
      ];
    case 'contractor':
      return [
        ...baseFields,
        { path: 'businessName', label: 'Business Name' },
        { path: 'serviceTypes', label: 'Service Types' },
      ];
    default:
      return baseFields;
  }
}

function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => current?.[key], obj);
}
```

#### Task 3.2: Enhanced Profile Form with Real-time Updates
```typescript
// src/components/profile/EnhancedProfileForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../context/AuthContext';
import { ProfileService } from '../../services/profileService';
import { getSchemaForRole } from '../../schemas/profileSchema';
import Input from '../ui/Input';
import Button from '../ui/Button';
import LoadingSpinner from '../ui/LoadingSpinner';

interface EnhancedProfileFormProps {
  profile: any;
  onUpdate: (updatedProfile: any) => void;
}

export const EnhancedProfileForm: React.FC<EnhancedProfileFormProps> = ({
  profile,
  onUpdate,
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  const [hasChanges, setHasChanges] = React.useState(false);
  
  const schema = getSchemaForRole(profile.role);
  
  const { register, handleSubmit, formState: { errors }, watch, reset } = useForm({
    resolver: zodResolver(schema),
    defaultValues: profile,
    mode: 'onBlur',
  });

  // Watch for changes
  const watchedValues = watch();
  React.useEffect(() => {
    const hasChanges = JSON.stringify(watchedValues) !== JSON.stringify(profile);
    setHasChanges(hasChanges);
  }, [watchedValues, profile]);

  const onSubmit = async (data: any) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await ProfileService.updateProfile(currentUser, data);
      onUpdate({ ...profile, ...data });
      setHasChanges(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    reset(profile);
    setHasChanges(false);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="First Name"
          {...register('firstName')}
          error={errors.firstName?.message}
        />
        
        <Input
          label="Last Name"
          {...register('lastName')}
          error={errors.lastName?.message}
        />
        
        <Input
          label="Email Address"
          type="email"
          {...register('email')}
          error={errors.email?.message}
          disabled // Email changes should go through a separate flow
        />
        
        <Input
          label="Phone Number"
          type="tel"
          {...register('phone')}
          error={errors.phone?.message}
          placeholder="+1 (555) 123-4567"
        />
        
        {profile.role === 'landlord' && (
          <Input
            label="Business Name"
            {...register('businessName')}
            error={errors.businessName?.message}
            className="md:col-span-2"
          />
        )}
        
        {profile.role === 'contractor' && (
          <>
            <Input
              label="Business Name"
              {...register('businessName')}
              error={errors.businessName?.message}
            />
            <Input
              label="Hourly Rate"
              type="number"
              {...register('hourlyRate', { valueAsNumber: true })}
              error={errors.hourlyRate?.message}
              placeholder="0.00"
            />
          </>
        )}
      </div>
      
      {hasChanges && (
        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Saving...
              </>
            ) : (
              'Save Changes'
            )}
          </Button>
        </div>
      )}
    </form>
  );
};
```

### Phase 4: Advanced Features (Week 7-8)

#### Task 4.1: Data Export Functionality
```typescript
// src/components/profile/DataExportSection.tsx
import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

export const DataExportSection: React.FC = () => {
  const { currentUser } = useAuth();
  const [isExporting, setIsExporting] = React.useState(false);

  const handleExportData = async () => {
    if (!currentUser) return;
    
    setIsExporting(true);
    try {
      const exportUserData = httpsCallable(functions, 'exportUserData');
      const result = await exportUserData({ userId: currentUser.uid });
      
      // Create and download file
      const dataStr = JSON.stringify(result.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `propagentic-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast.success('Data exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Data Export</h3>
      <p className="text-sm text-gray-600 mb-4">
        Download a copy of all your data stored in PropAgentic. This includes your profile 
        information, properties, maintenance requests, and other associated data.
      </p>
      
      <Button
        onClick={handleExportData}
        disabled={isExporting}
        variant="outline"
        className="flex items-center"
      >
        <ArrowDownTrayIcon className="w-4 h-4 mr-2" />
        {isExporting ? 'Exporting...' : 'Export My Data'}
      </Button>
      
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <p className="text-xs text-gray-500">
          Your data will be exported in JSON format. This process may take a few moments 
          for accounts with large amounts of data.
        </p>
      </div>
    </div>
  );
};
```

#### Task 4.2: Notification Preferences
```typescript
// src/components/profile/NotificationPreferences.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuth } from '../../context/AuthContext';
import { ProfileService } from '../../services/profileService';
import Switch from '../ui/Switch';
import Button from '../ui/Button';

interface NotificationPreferencesProps {
  preferences: any;
  onUpdate: (preferences: any) => void;
}

export const NotificationPreferences: React.FC<NotificationPreferencesProps> = ({
  preferences = {},
  onUpdate,
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { register, handleSubmit, watch } = useForm({
    defaultValues: {
      emailNotifications: {
        maintenanceUpdates: preferences.emailNotifications?.maintenanceUpdates ?? true,
        rentReminders: preferences.emailNotifications?.rentReminders ?? true,
        systemUpdates: preferences.emailNotifications?.systemUpdates ?? true,
        marketing: preferences.emailNotifications?.marketing ?? false,
      },
      smsNotifications: {
        urgentMaintenance: preferences.smsNotifications?.urgentMaintenance ?? true,
        rentReminders: preferences.smsNotifications?.rentReminders ?? false,
      },
      pushNotifications: {
        enabled: preferences.pushNotifications?.enabled ?? true,
        maintenance: preferences.pushNotifications?.maintenance ?? true,
        messages: preferences.pushNotifications?.messages ?? true,
      },
    },
  });

  const watchedValues = watch();

  const onSubmit = async (data: any) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await ProfileService.updateProfile(currentUser, {
        notificationPreferences: data,
      });
      onUpdate(data);
      toast.success('Notification preferences updated');
    } catch (error) {
      console.error('Error updating preferences:', error);
      toast.error('Failed to update preferences');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-6">Notification Preferences</h3>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Email Notifications */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Email Notifications</h4>
          <div className="space-y-4">
            <Switch
              label="Maintenance Updates"
              description="Receive updates about maintenance requests and completions"
              {...register('emailNotifications.maintenanceUpdates')}
            />
            <Switch
              label="Rent Reminders"
              description="Get notified about upcoming rent payments"
              {...register('emailNotifications.rentReminders')}
            />
            <Switch
              label="System Updates"
              description="Important updates about PropAgentic features and changes"
              {...register('emailNotifications.systemUpdates')}
            />
            <Switch
              label="Marketing & Promotions"
              description="Special offers and product announcements"
              {...register('emailNotifications.marketing')}
            />
          </div>
        </div>

        {/* SMS Notifications */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">SMS Notifications</h4>
          <div className="space-y-4">
            <Switch
              label="Urgent Maintenance"
              description="Critical maintenance issues that need immediate attention"
              {...register('smsNotifications.urgentMaintenance')}
            />
            <Switch
              label="Rent Reminders"
              description="Text reminders for upcoming rent payments"
              {...register('smsNotifications.rentReminders')}
            />
          </div>
        </div>

        {/* Push Notifications */}
        <div>
          <h4 className="text-md font-medium text-gray-900 mb-4">Push Notifications</h4>
          <div className="space-y-4">
            <Switch
              label="Enable Push Notifications"
              description="Allow PropAgentic to send push notifications to your browser"
              {...register('pushNotifications.enabled')}
            />
            <Switch
              label="Maintenance Notifications"
              description="Push notifications for maintenance-related updates"
              {...register('pushNotifications.maintenance')}
              disabled={!watchedValues.pushNotifications?.enabled}
            />
            <Switch
              label="Message Notifications"
              description="Push notifications for new messages and communications"
              {...register('pushNotifications.messages')}
              disabled={!watchedValues.pushNotifications?.enabled}
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-gray-200">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save Preferences'}
          </Button>
        </div>
      </form>
    </div>
  );
};
```

## 5. Testing Strategy

### 5.1. Unit Tests
```typescript
// src/components/profile/__tests__/ProfileCompletionCard.test.tsx
import { render, screen } from '@testing-library/react';
import { ProfileCompletionCard } from '../ProfileCompletionCard';

describe('ProfileCompletionCard', () => {
  const mockProfile = {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890',
    businessName: 'Test Business',
    role: 'landlord',
  };

  it('calculates completion percentage correctly', () => {
    render(<ProfileCompletionCard profile={mockProfile} role="landlord" />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });

  it('shows incomplete fields', () => {
    const incompleteProfile = { ...mockProfile, businessName: '' };
    render(<ProfileCompletionCard profile={incompleteProfile} role="landlord" />);
    expect(screen.getByText('80%')).toBeInTheDocument();
  });
});
```

### 5.2. End-to-End Tests
```typescript
// cypress/e2e/profile.cy.ts
describe('User Profile', () => {
  beforeEach(() => {
    cy.login('landlord@test.com', 'password123');
    cy.visit('/u/profile');
  });

  it('allows landlord to update profile information', () => {
    cy.get('[data-testid="first-name-input"]').clear().type('Updated Name');
    cy.get('[data-testid="save-button"]').click();
    
    cy.get('[data-testid="success-toast"]').should('contain', 'Profile updated successfully');
    cy.get('[data-testid="first-name-input"]').should('have.value', 'Updated Name');
  });

  it('shows profile completion progress', () => {
    cy.get('[data-testid="completion-percentage"]').should('be.visible');
    cy.get('[data-testid="completion-checklist"]').should('contain', 'First Name');
  });
});
```

## 6. Deployment Checklist

### 6.1. Pre-Deployment
- [ ] All unit tests passing (95%+ coverage)
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] TypeScript compilation successful
- [ ] ESLint and Prettier checks passing
- [ ] Security audit completed (`npm audit`)
- [ ] Performance testing completed
- [ ] Accessibility testing completed (WCAG 2.1 AA)

### 6.2. Firebase Configuration
- [ ] Firestore security rules deployed and tested
- [ ] Cloud Functions deployed (data export, image processing)
- [ ] Firebase Storage rules configured
- [ ] Authentication settings configured (email verification, password requirements)
- [ ] Performance monitoring enabled
- [ ] Error reporting configured

## 7. Security Considerations

### 7.1. Data Protection
- **Input Sanitization:** All user inputs are validated and sanitized using Zod schemas
- [ ] XSS Prevention: React's built-in XSS protection + additional sanitization
- [ ] CSRF Protection: Firebase Authentication handles CSRF tokens
- [ ] Data Encryption: Sensitive data encrypted at rest and in transit

### 7.2. Authentication Security
- [ ] Password Requirements: Minimum 8 characters, complexity requirements
- [ ] Email Verification: Required before accessing sensitive features
- [ ] Session Management: Firebase handles secure session management
- [ ] 2FA Support: Multi-factor authentication available

### 7.3. Access Control
- [ ] Role-Based Access: Firestore rules enforce role-based data access
- [ ] Principle of Least Privilege: Users can only access their own data
- [ ] Admin Oversight: Super admin role for platform management
- [ ] Audit Logging: All profile changes logged for security auditing

## 8. Performance Optimization

### 8.1. Frontend Optimization
```typescript
// Lazy loading for profile components
const ProfileImageUpload = React.lazy(() => import('./ProfileImageUpload'));
const NotificationPreferences = React.lazy(() => import('./NotificationPreferences'));

// Memoization for expensive calculations
const MemoizedProfileCompletion = React.memo(ProfileCompletionCard);

// Debounced auto-save
const useDebouncedSave = (callback: Function, delay: number) => {
  const [debounceTimer, setDebounceTimer] = React.useState<NodeJS.Timeout>();
  
  return React.useCallback((...args: any[]) => {
    if (debounceTimer) clearTimeout(debounceTimer);
    setDebounceTimer(setTimeout(() => callback(...args), delay));
  }, [callback, delay, debounceTimer]);
};
```

### 8.2. Firebase Optimization
- [ ] Firestore Indexing: Create composite indexes for complex queries
- [ ] Data Pagination: Implement cursor-based pagination for large datasets
- [ ] Offline Support: Enable Firestore offline persistence
- [ ] Image Optimization: Cloud Functions for automatic image resizing

## 9. Monitoring & Analytics

### 9.1. Error Monitoring
```typescript
// src/utils/errorReporting.ts
import { getAnalytics, logEvent } from 'firebase/analytics';

export const reportError = (error: Error, context: string) => {
  console.error(`Error in ${context}:`, error);
  
  // Log to Firebase Analytics
  const analytics = getAnalytics();
  logEvent(analytics, 'profile_error', {
    error_message: error.message,
    context,
    user_role: getCurrentUserRole(),
  });
  
  // In production, also send to external service like Sentry
  if (process.env.NODE_ENV === 'production') {
    // Sentry.captureException(error);
  }
};
```

### 9.2. Performance Monitoring
```typescript
// src/utils/performanceMonitoring.ts
import { getPerformance, trace } from 'firebase/performance';

export const trackProfileOperation = async (operation: string, fn: Function) => {
  const perf = getPerformance();
  const profileTrace = trace(perf, `profile_${operation}`);
  
  profileTrace.start();
  try {
    const result = await fn();
    profileTrace.putAttribute('success', 'true');
    return result;
  } catch (error) {
    profileTrace.putAttribute('success', 'false');
    throw error;
  } finally {
    profileTrace.stop();
  }
};
```

## 10. Maintenance Plan

### 10.1. Regular Maintenance Tasks
- [ ] Weekly: Review error logs and user feedback
- [ ] Monthly: Update dependencies and security patches
- [ ] Quarterly: Performance audit and optimization review
- [ ] Annually: Security audit and compliance review

### 10.2. Monitoring Dashboards
- [ ] User Engagement: Profile completion rates, feature usage
- [ ] System Health: Error rates, performance metrics, uptime
- [ ] Security: Failed login attempts, suspicious activity
- [ ] Business Metrics: User growth, feature adoption

## 11. Future Enhancements

### 11.1. Advanced Features
- [ ] Profile Templates: Pre-configured profiles for different business types
- [ ] Bulk Operations: Import/export multiple profiles
- [ ] Advanced Analytics: Detailed user behavior insights
- [ ] API Integration: Connect with external CRM systems

### 11.2. Mobile Optimization
- [ ] Progressive Web App: Full PWA support with offline capabilities
- [ ] Mobile-First Design: Optimized mobile user experience
- [ ] Touch Interactions: Gesture-based navigation and interactions
- [ ] Push Notifications: Mobile push notification support

---

## Conclusion

This implementation plan provides a comprehensive roadmap for transforming the PropAgentic user profile system into a production-ready, enterprise-grade feature. By following this phased approach, we ensure systematic development, thorough testing, and robust security while maintaining excellent user experience.

The plan addresses current issues (like the "Invalid Date" problem) while building a scalable foundation for future growth. Each phase builds upon the previous one, allowing for iterative development and testing.

**Success Metrics:**
- [ ] 100% profile completion rate increase
- [ ] 50% reduction in profile-related support tickets
- [ ] 99.9% uptime for profile operations
- [ ] Sub-2-second page load times
- [ ] Zero security incidents

**Timeline:** 8 weeks for full implementation, with Phase 1 addressing critical issues in the first 2 weeks.
