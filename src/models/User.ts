/**
 * User-related Types and Interfaces
 */

export type UserRole = 'tenant' | 'landlord' | 'contractor' | 'admin';

export interface UserProfile {
  id: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  lastLogin?: Date;
  [key: string]: any; 
}

export interface NotificationSettings {
  userId: string;
  userRole: 'tenant' | 'landlord' | 'contractor';
  emailNotifications: {
    newRequests: boolean;
    statusUpdates: boolean;
    messages: boolean;
    emergencies: boolean;
    reminders: boolean;
  };
  pushNotifications: {
    newRequests: boolean;
    statusUpdates: boolean;
    messages: boolean;
    emergencies: boolean;
    reminders: boolean;
  };
  smsNotifications: {
    emergencies: boolean;
    reminders: boolean;
  };
  quietHours: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
  frequency: 'immediate' | 'hourly' | 'daily';
} 