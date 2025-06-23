import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import { toast } from 'react-hot-toast';
import {
  BellAlertIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  CheckIcon,
} from '@heroicons/react/24/outline';

/**
 * NotificationPreferences allows users to control how they receive notifications
 */
const NotificationPreferences = () => {
  const { currentUser, userProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    pushNotifications: true,
    notificationTypes: {
      status_change: true,
      assignment: true,
      completed: true,
      invitation: true,
      classified: true,
      high_urgency: true,
    },
    emailFrequency: 'immediate', // immediate, daily, weekly
  });

  // Fetch user's notification preferences
  useEffect(() => {
    if (!currentUser) return;

    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const preferencesRef = doc(db, 'userPreferences', currentUser.uid);
        const preferencesDoc = await getDoc(preferencesRef);

        if (preferencesDoc.exists()) {
          setPreferences({
            ...preferences,
            ...preferencesDoc.data().notifications,
          });
        } else {
          // Create default preferences if they don't exist
          await setDoc(preferencesRef, {
            notifications: preferences,
            updatedAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Error fetching notification preferences:', error);
        toast.error('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [currentUser]);

  // Save updated preferences
  const savePreferences = async () => {
    if (!currentUser) return;

    try {
      setSaving(true);
      const preferencesRef = doc(db, 'userPreferences', currentUser.uid);
      
      await updateDoc(preferencesRef, {
        'notifications': preferences,
        'updatedAt': new Date(),
      });
      
      toast.success('Notification preferences saved');
    } catch (error) {
      console.error('Error saving notification preferences:', error);
      toast.error('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  // Toggle a notification type preference
  const toggleNotificationType = (type) => {
    setPreferences({
      ...preferences,
      notificationTypes: {
        ...preferences.notificationTypes,
        [type]: !preferences.notificationTypes[type],
      },
    });
  };

  // Get role-specific notification types
  const getNotificationTypes = () => {
    const commonTypes = [
      { id: 'status_change', label: 'Status Changes', description: 'Get notified when maintenance request status changes' },
      { id: 'invitation', label: 'Invitations', description: 'Get notified about new invitations' },
    ];

    const roleSpecificTypes = {
      landlord: [
        { id: 'high_urgency', label: 'Urgent Issues', description: 'Get notified about high priority maintenance issues' },
        { id: 'classified', label: 'Classifications', description: 'Get notified when tickets are classified by AI' },
        { id: 'completed', label: 'Completions', description: 'Get notified when maintenance requests are completed' },
      ],
      tenant: [
        { id: 'classified', label: 'Classifications', description: 'Get notified when your request is classified' },
        { id: 'completed', label: 'Completions', description: 'Get notified when your request is completed' },
      ],
      contractor: [
        { id: 'assignment', label: 'Job Assignments', description: 'Get notified when you are assigned to a job' },
      ],
    };

    return [
      ...commonTypes,
      ...(roleSpecificTypes[userProfile?.userType] || []),
    ];
  };

  if (loading) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-center items-center h-40">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
        <div className="flex items-center">
          <BellAlertIcon className="h-6 w-6 text-teal-500 mr-2" />
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Notification Preferences
          </h3>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Control how and when you receive notifications
        </p>
      </div>

      <div className="px-4 py-5 sm:p-6">
        {/* Delivery Methods */}
        <div className="mb-8">
          <h4 className="text-base font-medium text-gray-900 mb-4">Delivery Methods</h4>
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="email-notifications"
                  type="checkbox"
                  checked={preferences.emailNotifications}
                  onChange={() => setPreferences({
                    ...preferences,
                    emailNotifications: !preferences.emailNotifications,
                  })}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="email-notifications" className="font-medium text-gray-700 flex items-center">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400 mr-1" />
                  Email Notifications
                </label>
                <p className="text-gray-500">Receive notifications via email</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="push-notifications"
                  type="checkbox"
                  checked={preferences.pushNotifications}
                  onChange={() => setPreferences({
                    ...preferences,
                    pushNotifications: !preferences.pushNotifications,
                  })}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="push-notifications" className="font-medium text-gray-700 flex items-center">
                  <DevicePhoneMobileIcon className="h-5 w-5 text-gray-400 mr-1" />
                  Push Notifications
                </label>
                <p className="text-gray-500">Receive push notifications on your device</p>
              </div>
            </div>
          </div>
        </div>

        {/* Email Frequency */}
        {preferences.emailNotifications && (
          <div className="mb-8">
            <h4 className="text-base font-medium text-gray-900 mb-4">Email Frequency</h4>
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  id="frequency-immediate"
                  name="frequency"
                  type="radio"
                  checked={preferences.emailFrequency === 'immediate'}
                  onChange={() => setPreferences({
                    ...preferences,
                    emailFrequency: 'immediate',
                  })}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                />
                <label htmlFor="frequency-immediate" className="ml-3 text-sm font-medium text-gray-700">
                  Immediate (as they happen)
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="frequency-daily"
                  name="frequency"
                  type="radio"
                  checked={preferences.emailFrequency === 'daily'}
                  onChange={() => setPreferences({
                    ...preferences,
                    emailFrequency: 'daily',
                  })}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                />
                <label htmlFor="frequency-daily" className="ml-3 text-sm font-medium text-gray-700">
                  Daily digest
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="frequency-weekly"
                  name="frequency"
                  type="radio"
                  checked={preferences.emailFrequency === 'weekly'}
                  onChange={() => setPreferences({
                    ...preferences,
                    emailFrequency: 'weekly',
                  })}
                  className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300"
                />
                <label htmlFor="frequency-weekly" className="ml-3 text-sm font-medium text-gray-700">
                  Weekly summary
                </label>
              </div>
            </div>
          </div>
        )}

        {/* Notification Types */}
        <div>
          <h4 className="text-base font-medium text-gray-900 mb-4">Notification Types</h4>
          <p className="text-sm text-gray-500 mb-4">
            Select which types of notifications you want to receive
          </p>
          <div className="bg-gray-50 rounded-lg p-4 divide-y divide-gray-200">
            {getNotificationTypes().map((type) => (
              <div key={type.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id={`notification-type-${type.id}`}
                      type="checkbox"
                      checked={preferences.notificationTypes[type.id] !== false}
                      onChange={() => toggleNotificationType(type.id)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor={`notification-type-${type.id}`} className="font-medium text-gray-700">
                      {type.label}
                    </label>
                    <p className="text-gray-500">{type.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 bg-gray-50 text-right sm:px-6">
        <button
          type="button"
          onClick={savePreferences}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </>
          ) : (
            <>
              <CheckIcon className="h-4 w-4 mr-1" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default NotificationPreferences; 