import React from 'react';
import NotificationPreferences from '../components/notifications/NotificationPreferences';

const SettingsPage = () => {
  return (
    // DashboardLayout is applied by the Router in App.js
    <div>
      <h1 className="text-2xl font-semibold text-content dark:text-content-dark mb-6">
        Settings
      </h1>
      
      {/* Notification Settings Section */}
      <div className="bg-background dark:bg-background-darkSubtle p-6 rounded-lg shadow border border-border dark:border-border-dark mb-6">
        <h2 className="text-lg font-medium text-content dark:text-content-dark mb-4">
            Notification Preferences
        </h2>
        <p className="text-sm text-content-secondary dark:text-content-darkSecondary mb-4">
          Choose how you receive notifications for maintenance requests, tenant messages, and other important updates.
        </p>
        <NotificationPreferences />
      </div>

      {/* Placeholder for Account Settings Section */}
      <div className="bg-background dark:bg-background-darkSubtle p-6 rounded-lg shadow border border-border dark:border-border-dark">
        <h2 className="text-lg font-medium text-content dark:text-content-dark mb-4">
            Account Settings
        </h2>
        <p className="text-content-secondary dark:text-content-darkSecondary">
          Manage your password and other account details. (Placeholder)
        </p>
        {/* Add components for password change, etc. here */}
      </div>
      
      {/* Placeholder for Billing Section (if applicable) */}
      {/* 
      <div className="bg-background dark:bg-background-darkSubtle p-6 rounded-lg shadow border border-border dark:border-border-dark mt-6">
        <h2 className="text-lg font-medium text-content dark:text-content-dark mb-4">
            Billing & Subscription
        </h2>
        <p className="text-content-secondary dark:text-content-darkSecondary">
          Manage your subscription plan and payment methods. (Placeholder)
        </p>
      </div> 
      */}
    </div>
  );
};

export default SettingsPage; 