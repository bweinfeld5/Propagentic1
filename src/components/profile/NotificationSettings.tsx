import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { notificationSettingsSchema } from '../../schemas/profileSchemas';
import { ProfileService } from '../../services/profileService';
import { UserProfile } from '../../models/UserProfile';
import { BellIcon, EnvelopeIcon, DevicePhoneMobileIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';

type NotificationFormData = z.infer<typeof notificationSettingsSchema>;

interface NotificationSettingsProps {
  userId: string;
}

const NotificationSettings: React.FC<NotificationSettingsProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { register, handleSubmit, reset, watch, formState: { isSubmitting } } = useForm<NotificationFormData>({
    resolver: zodResolver(notificationSettingsSchema),
  });

  // Watch for changes
  const watchedValues = watch();

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = ProfileService.subscribeToProfile(userId, (data) => {
        if (data) {
          const normalizedProfile: UserProfile = {
            uid: data.uid || userId,
            email: data.email || '',
            displayName: data.displayName || data.firstName && data.lastName 
              ? `${data.firstName} ${data.lastName}` 
              : 'User',
            photoURL: data.photoURL,
            role: data.role || data.userType || 'tenant',
            notificationPreferences: data.notificationPreferences,
            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date(),
          };
          
          setProfile(normalizedProfile);
          
          if (normalizedProfile.notificationPreferences) {
            reset(normalizedProfile.notificationPreferences);
          } else {
            const defaultPreferences = {
              email: { 
                newMessages: true, 
                maintenanceUpdates: true, 
                paymentReminders: true 
              },
              sms: { 
                newMessages: false, 
                maintenanceUpdates: false 
              },
            };
            reset(defaultPreferences);
          }
        } else {
          setError('Profile not found. Please try refreshing the page.');
        }
        setIsLoading(false);
      });

      return () => {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing from profile updates:', err);
        }
      };
    } catch (err) {
      console.error('Error setting up profile subscription:', err);
      setError('Failed to load notification settings. Please try refreshing the page.');
      setIsLoading(false);
    }
  }, [userId, reset]);

  useEffect(() => {
    if (profile?.notificationPreferences && watchedValues) {
      const currentPrefs = JSON.stringify(profile.notificationPreferences);
      const watchedPrefs = JSON.stringify(watchedValues);
      setHasChanges(currentPrefs !== watchedPrefs);
    }
  }, [watchedValues, profile?.notificationPreferences]);

  const onSubmit = async (data: NotificationFormData) => {
    const toastId = toast.loading('Saving preferences...');
    try {
      await ProfileService.updateUserProfile(userId, { 
        notificationPreferences: data 
      });
      toast.success('Notification settings saved!', { id: toastId });
      setHasChanges(false);
    } catch (error: any) {
      console.error('Notification settings update error:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. Please check your account permissions.'
        : 'Failed to save settings. Please try again.';
      toast.error(errorMessage, { id: toastId });
    }
  };

  const handleReset = () => {
    if (profile?.notificationPreferences) {
      reset(profile.notificationPreferences);
    }
    setHasChanges(false);
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex items-center space-x-3 text-red-600">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <div>
            <h3 className="font-medium">Notification Settings Error</h3>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="animate-pulse">
          <div className="flex items-center space-x-3 mb-6">
            <div className="h-6 w-6 bg-gray-300 dark:bg-gray-600 rounded"></div>
            <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-1/3"></div>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-2/3"></div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <div className="flex items-center space-x-3 mb-6">
        <BellIcon className="h-6 w-6 text-gray-400" />
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Notification Settings
        </h3>
      </div>
      
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Choose how you want to be notified about important updates and activities.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Email Notifications */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <EnvelopeIcon className="h-5 w-5 text-gray-500" />
            <h4 className="text-lg font-medium text-gray-800 dark:text-white">
              Email Notifications
            </h4>
          </div>
          
          <div className="space-y-4 ml-7">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="checkbox" 
                {...register('email.newMessages')}
                className="form-checkbox h-5 w-5 text-blue-600 transition-colors border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  New Messages
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Get notified when you receive new messages from tenants, landlords, or contractors
                </p>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="checkbox" 
                {...register('email.maintenanceUpdates')}
                className="form-checkbox h-5 w-5 text-blue-600 transition-colors border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  Maintenance Updates
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Updates about maintenance request status changes and completions
                </p>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="checkbox" 
                {...register('email.paymentReminders')}
                className="form-checkbox h-5 w-5 text-blue-600 transition-colors border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  Payment Reminders
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Reminders about upcoming rent payments and due dates
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* SMS Notifications */}
        <div>
          <div className="flex items-center space-x-2 mb-4">
            <DevicePhoneMobileIcon className="h-5 w-5 text-gray-500" />
            <h4 className="text-lg font-medium text-gray-800 dark:text-white">
              SMS Notifications
            </h4>
          </div>
          
          <div className="space-y-4 ml-7">
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="checkbox" 
                {...register('sms.newMessages')}
                className="form-checkbox h-5 w-5 text-blue-600 transition-colors border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  New Messages
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Text alerts for urgent messages (charges may apply)
                </p>
              </div>
            </label>
            
            <label className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="checkbox" 
                {...register('sms.maintenanceUpdates')}
                className="form-checkbox h-5 w-5 text-blue-600 transition-colors border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
              />
              <div className="flex-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white">
                  Urgent Maintenance Updates
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Text alerts for emergency maintenance issues only
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200 dark:border-gray-600">
            <button
              type="button"
              onClick={handleReset}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition-colors font-medium"
            >
              Reset
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}

        {!hasChanges && (
          <div className="text-center pt-6 border-t border-gray-200 dark:border-gray-600">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Your notification settings are up to date
            </p>
          </div>
        )}
      </form>
    </div>
  );
};

export default NotificationSettings; 