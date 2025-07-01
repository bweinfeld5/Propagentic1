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