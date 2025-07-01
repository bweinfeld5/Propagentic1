# Comprehensive User Profile System Overhaul & Bug Fixes

## 1. Executive Summary

This document outlines the necessary steps to fix critical bugs and implement essential features in the PropAgentic user profile system. The current implementation suffers from several issues, including a crashing bug with toast notifications, and lacks core functionalities like username editing, photo uploads, password changes, and notification settings.

This guide provides a production-ready roadmap to address these deficiencies. The key improvements include:

- **Bug Fixes**: Correcting the invalid `toast.info()` method call that causes application crashes.
- **Feature Implementation**: Adding profile photo uploads, username/display name editing, a secure password change modal, and a functional notification preferences system.
- **Technical Enhancements**: Introducing `zod` for robust form validation, creating a dedicated service layer for Firebase interactions, implementing real-time profile updates via Firestore listeners, and ensuring all components are responsive and accessible.
- **Code Quality**: Migrating relevant components to TypeScript for improved type safety and maintainability.

By following this guide, we will deliver a stable, feature-rich, and secure user profile experience for all user roles (Landlords, Tenants, Contractors).

---

## 2. Immediate Bug Fix: `toast.info()` Crash

The most critical issue is the application crash caused by an incorrect method call to `react-hot-toast`. The library does not have a `toast.info()` method.

**File to Fix**: `src/components/landlord/LandlordProfileContent.jsx`

### Step 1: Identify and Replace Invalid `toast.info()` Calls

The `toast.info()` calls must be replaced with a valid method, such as `toast()`, which is suitable for displaying informational messages.

**Original (Buggy) Code in `LandlordProfileContent.jsx`:**

```jsx
// Example of the buggy code
const handleSomeAction = () => {
  // ... some logic
  toast.info("Profile feature coming soon!"); 
};
```

**Corrected Code:**

Replace all instances of `toast.info(...)` with `toast(...)`.

```jsx
import toast from 'react-hot-toast';

// ...

const handleSomeAction = () => {
  // ... some logic
  toast("Profile feature coming soon!"); 
};
```

This simple change prevents the application from crashing and restores basic notification functionality.

---

## 3. Implementation Plan: New Profile System

We will create a new, unified profile component that can be used by all user roles. This approach promotes code reuse and ensures a consistent user experience.

### 3.1. Project Structure & New Files

The following files will be created or modified:

- **`src/pages/UserProfilePage.tsx`**: A new page to host the profile components.
- **`src/components/profile/UserProfileCard.tsx`**: Component for displaying and editing user information (name, photo).
- **`src/components/profile/PasswordChangeModal.tsx`**: Modal for securely changing the user's password.
- **`src/components/profile/NotificationSettings.tsx`**: Component for managing notification preferences.
- **`src/services/profileService.ts`**: A dedicated service for all profile-related Firebase operations.
- **`src/hooks/useUserProfile.ts`**: A custom hook to manage user profile data and state.
- **`src/schemas/profileSchemas.ts`**: `zod` schemas for validating profile forms.
- **`src/models/UserProfile.ts`**: TypeScript interface for the user profile data structure.

### 3.2. Data Model (`src/models/UserProfile.ts`)

First, define a clear TypeScript interface for our user profile data.

```typescript
// src/models/UserProfile.ts
export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: 'landlord' | 'tenant' | 'contractor' | 'admin';
  notificationPreferences?: {
    email: {
      newMessages: boolean;
      maintenanceUpdates: boolean;
      paymentReminders: boolean;
    };
    sms: {
      newMessages: boolean;
      maintenanceUpdates: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}
```

### 3.3. Firebase Service Layer (`src/services/profileService.ts`)

Create a service to handle all interactions with Firebase, including Firestore and Storage.

```typescript
// src/services/profileService.ts
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db, storage } from '../firebase/config'; // Adjust path to your Firebase config
import { UserProfile } from '../models/UserProfile';

// Get user profile data from Firestore
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  const userDocRef = doc(db, 'users', uid);
  const docSnap = await getDoc(userDocRef);
  return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
};

// Stream user profile data in real-time
export const streamUserProfile = (uid: string, callback: (profile: UserProfile | null) => void) => {
  const userDocRef = doc(db, 'users', uid);
  return onSnapshot(userDocRef, (docSnap) => {
    callback(docSnap.exists() ? (docSnap.data() as UserProfile) : null);
  });
};

// Update user profile data (Firestore and Auth)
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>) => {
  if (!auth.currentUser || auth.currentUser.uid !== uid) {
    throw new Error("You are not authorized to perform this action.");
  }

  const userDocRef = doc(db, 'users', uid);
  const updateData = { ...data, updatedAt: new Date() };

  // Update Firestore document
  await updateDoc(userDocRef, updateData);

  // Update Firebase Auth profile
  if (data.displayName || data.photoURL) {
    await updateProfile(auth.currentUser, {
      displayName: data.displayName,
      photoURL: data.photoURL,
    });
  }
};

// Upload profile photo to Firebase Storage
export const uploadProfilePhoto = async (uid: string, file: File): Promise<string> => {
  const storageRef = ref(storage, `profile-photos/${uid}/${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(snapshot.ref);
  return downloadURL;
};

// Change user password
export const changeUserPassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error("User not authenticated.");

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  
  // Re-authenticate before changing password for security
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};
```

### 3.4. Validation Schemas (`src/schemas/profileSchemas.ts`)

Use `zod` to define validation schemas for our forms.

```typescript
// src/schemas/profileSchemas.ts
import { z } from 'zod';

export const profileSchema = z.object({
  displayName: z.string().min(2, "Name must be at least 2 characters long.").max(50, "Name is too long."),
});

export const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters long."),
  confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

export const notificationSettingsSchema = z.object({
  email: z.object({
    newMessages: z.boolean(),
    maintenanceUpdates: z.boolean(),
    paymentReminders: z.boolean(),
  }),
  sms: z.object({
    newMessages: z.boolean(),
    maintenanceUpdates: z.boolean(),
  }),
});
```

### 3.5. Profile Page and Components

Now, let's build the UI components.

#### Main Page (`src/pages/UserProfilePage.tsx`)

```typescript
// src/pages/UserProfilePage.tsx
import React from 'react';
import { useAuth } from '../context/AuthContext'; // Adjust path
import UserProfileCard from '../components/profile/UserProfileCard';
import PasswordChangeModal from '../components/profile/PasswordChangeModal';
import NotificationSettings from '../components/profile/NotificationSettings';
import { Toaster } from 'react-hot-toast';

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <div>Loading...</div>; // Or a proper loader
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <Toaster position="top-center" reverseOrder={false} />
      <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">
        My Profile
      </h1>
      <div className="space-y-8">
        <UserProfileCard userId={user.uid} />
        <NotificationSettings userId={user.uid} />
        <PasswordChangeModal />
      </div>
    </div>
  );
};

export default UserProfilePage;
```

#### User Profile Card (`src/components/profile/UserProfileCard.tsx`)

This component handles display name and photo updates.

```typescript
// src/components/profile/UserProfileCard.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { profileSchema } from '../../schemas/profileSchemas';
import { streamUserProfile, updateUserProfile, uploadProfilePhoto } from '../../services/profileService';
import { UserProfile } from '../../models/UserProfile';
import { CameraIcon } from '@heroicons/react/24/solid';

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfileCardProps {
  userId: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    const unsubscribe = streamUserProfile(userId, (data) => {
      setProfile(data);
      if (data) {
        reset({ displayName: data.displayName });
      }
    });
    return () => unsubscribe();
  }, [userId, reset]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const toastId = toast.loading('Uploading photo...');
    try {
      const photoURL = await uploadProfilePhoto(userId, file);
      await updateUserProfile(userId, { photoURL });
      toast.success('Profile photo updated!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to upload photo. Please try again.', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    const toastId = toast.loading('Updating profile...');
    try {
      await updateUserProfile(userId, { displayName: data.displayName });
      toast.success('Profile updated successfully!', { id: toastId });
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile.', { id: toastId });
    }
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="relative">
          <img
            src={profile.photoURL || `https://ui-avatars.com/api/?name=${profile.displayName}&background=random`}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50"
            aria-label="Change profile photo"
          >
            <CameraIcon className="h-5 w-5" />
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            className="hidden"
            accept="image/png, image/jpeg"
          />
        </div>
        <div className="flex-grow text-center sm:text-left">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)}>
              <input
                {...register('displayName')}
                className="text-lg font-semibold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 rounded px-2 py-1"
              />
              {errors.displayName && <p className="text-red-500 text-sm mt-1">{errors.displayName.message}</p>}
              <div className="mt-2 space-x-2">
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">Save</button>
                <button type="button" onClick={() => setIsEditing(false)} className="btn btn-secondary">Cancel</button>
              </div>
            </form>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.displayName}</h2>
              <p className="text-gray-500 dark:text-gray-400">{profile.email}</p>
              <button onClick={() => setIsEditing(true)} className="text-blue-600 hover:underline mt-2">Edit Name</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileCard;
```

#### Password Change Modal (`src/components/profile/PasswordChangeModal.tsx`)

```typescript
// src/components/profile/PasswordChangeModal.tsx
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { passwordSchema } from '../../schemas/profileSchemas';
import { changeUserPassword } from '../../services/profileService';

type PasswordFormData = z.infer<typeof passwordSchema>;

const PasswordChangeModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    const toastId = toast.loading('Changing password...');
    try {
      await changeUserPassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully!', { id: toastId });
      setIsOpen(false);
      reset();
    } catch (error: any) {
      console.error(error);
      const message = error.code === 'auth/wrong-password' ? 'Incorrect current password.' : 'Failed to change password.';
      toast.error(message, { id: toastId });
    }
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Security</h3>
        <p className="text-gray-600 dark:text-gray-300 mt-2">Change your password to keep your account secure.</p>
        <button onClick={() => setIsOpen(true)} className="btn btn-primary mt-4">
          Change Password
        </button>
      </div>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-8 w-full max-w-md">
            <h2 className="text-2xl font-bold mb-4">Change Password</h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block mb-1">Current Password</label>
                <input type="password" {...register('currentPassword')} className="input-field" />
                {errors.currentPassword && <p className="text-red-500 text-sm mt-1">{errors.currentPassword.message}</p>}
              </div>
              <div>
                <label className="block mb-1">New Password</label>
                <input type="password" {...register('newPassword')} className="input-field" />
                {errors.newPassword && <p className="text-red-500 text-sm mt-1">{errors.newPassword.message}</p>}
              </div>
              <div>
                <label className="block mb-1">Confirm New Password</label>
                <input type="password" {...register('confirmPassword')} className="input-field" />
                {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>}
              </div>
              <div className="flex justify-end space-x-4">
                <button type="button" onClick={() => setIsOpen(false)} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={isSubmitting} className="btn btn-primary">
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default PasswordChangeModal;
```

#### Notification Settings (`src/components/profile/NotificationSettings.tsx`)

```typescript
// src/components/profile/NotificationSettings.tsx
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { notificationSettingsSchema } from '../../schemas/profileSchemas';
import { streamUserProfile, updateUserProfile } from '../../services/profileService';
import { UserProfile } from '../../models/UserProfile';

type NotificationFormData = z.infer<typeof notificationSettingsSchema>;

interface NotificationSettingsProps {
  userId: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const { register, handleSubmit, reset, formState: { isSubmitting, isDirty } } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSettingsSchema),
  });

  useEffect(() => {
    const unsubscribe = streamUserProfile(userId, (data) => {
      setProfile(data);
      if (data?.notificationPreferences) {
        reset(data.notificationPreferences);
      } else {
        // Set default values if none exist
        reset({
          email: { newMessages: true, maintenanceUpdates: true, paymentReminders: true },
          sms: { newMessages: false, maintenanceUpdates: false },
        });
      }
    });
    return () => unsubscribe();
  }, [userId, reset]);

  const onSubmit = async (data: NotificationFormData) => {
    const toastId = toast.loading('Saving preferences...');
    try {
      await updateUserProfile(userId, { notificationPreferences: data });
      toast.success('Notification settings saved!', { id: toastId });
    } catch (error) {
      console.error(error);
      toast.error('Failed to save settings.', { id: toastId });
    }
  };

  if (!profile) {
    return <div>Loading settings...</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Notification Settings</h3>
      <p className="text-gray-600 dark:text-gray-300 mt-2">Choose how you want to be notified.</p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-6">
        <div>
          <h4 className="font-medium text-gray-800 dark:text-white">Email Notifications</h4>
          <div className="space-y-2 mt-2">
            <label className="flex items-center">
              <input type="checkbox" {...register('email.newMessages')} className="form-checkbox" />
              <span className="ml-2">New Messages</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" {...register('email.maintenanceUpdates')} className="form-checkbox" />
              <span className="ml-2">Maintenance Updates</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" {...register('email.paymentReminders')} className="form-checkbox" />
              <span className="ml-2">Payment Reminders</span>
            </label>
          </div>
        </div>
        <div>
          <h4 className="font-medium text-gray-800 dark:text-white">SMS Notifications</h4>
          <div className="space-y-2 mt-2">
            <label className="flex items-center">
              <input type="checkbox" {...register('sms.newMessages')} className="form-checkbox" />
              <span className="ml-2">New Messages</span>
            </label>
            <label className="flex items-center">
              <input type="checkbox" {...register('sms.maintenanceUpdates')} className="form-checkbox" />
              <span className="ml-2">Maintenance Updates</span>
            </label>
          </div>
        </div>
        <div className="text-right">
          <button type="submit" disabled={isSubmitting || !isDirty} className="btn btn-primary">
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NotificationSettings;
```

---

## 4. Security & Best Practices

- **Firebase Security Rules**: Ensure your Firestore rules only allow users to edit their own profiles.
  ```json
  // firestore.rules
  match /users/{userId} {
    allow read: if request.auth != null;
    allow write: if request.auth.uid == userId;
  }
  ```
- **Storage Security Rules**: Protect user-uploaded content so users can only write to their own folder and only read their own photo (or make public if desired).
  ```
  // storage.rules
  match /b/{bucket}/o {
    match /profile-photos/{userId}/{fileName} {
      allow read; // Or: if request.auth != null;
      allow write: if request.auth.uid == userId && request.resource.size < 5 * 1024 * 1024 // 5MB limit
                   && request.resource.contentType.matches('image/.*');
    }
  }
  ```
- **Password Re-authentication**: The `changeUserPassword` service function correctly uses re-authentication, which is a critical security step before performing sensitive actions like changing a password.
- **Input Validation**: Using `zod` schemas on the client-side prevents invalid data from being sent to the backend. Always perform validation on the backend as well (e.g., in Cloud Functions) if you have more complex logic.

---

## 5. Testing Strategy

- **Unit Tests (Jest)**:
  - Test the `profileService` functions with mocked Firebase calls to ensure they handle data correctly.
  - Test the `zod` schemas to confirm validation logic is correct.
  - Test individual components to ensure they render correctly based on props and state.
- **Integration Tests (React Testing Library)**:
  - Test the `UserProfilePage` to ensure all child components work together.
  - Simulate user interactions like filling out forms, clicking buttons, and uploading files to verify the end-to-end flow within the UI.
- **End-to-End Tests (Playwright/Cypress)**:
  - Create test scripts that simulate a full user journey: login, navigate to the profile page, edit name, upload a photo, change password, and update notification settings. Verify that changes are persisted in Firebase.

---

## 6. Deployment Checklist

1.  [x] **Fix `toast.info()` Bug**: Confirm all instances have been replaced in the codebase.
2.  [ ] **Code Review**: Have another developer review the new components, services, and schemas.
3.  [ ] **Firebase Rules**: Deploy the updated `firestore.rules` and `storage.rules` to Firebase.
4.  [ ] **Environment Variables**: Ensure all necessary environment variables for Firebase are correctly configured in all environments (development, staging, production).
5.  [ ] **Testing**: Run all unit, integration, and E2E tests to ensure no regressions were introduced.
6.  [ ] **Manual QA**: Perform manual testing across different user roles (Landlord, Tenant) and on various devices (desktop, mobile) to verify responsiveness and functionality.
7.  [ ] **Deploy**: Deploy the updated application code to Firebase Hosting.
8.  [ ] **Monitor**: After deployment, monitor application logs and user feedback for any unexpected issues.
