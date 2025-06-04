import React, { useState, useEffect } from 'react';
import {
  BellIcon,
  EnvelopeIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  InformationCircleIcon,
  Cog6ToothIcon,
  ClockIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  CalendarIcon
} from '@heroicons/react/24/outline';

const NotificationPreferences = ({ userRole = 'landlord', onSave }) => {
  const [preferences, setPreferences] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null);

  // Notification categories based on user role
  const getNotificationCategories = () => {
    const commonCategories = {
      messages: {
        title: 'Messages & Communication',
        icon: ChatBubbleLeftRightIcon,
        color: 'blue',
        events: {
          newMessage: 'New messages received',
          messageReply: 'Replies to your messages',
          urgentMessage: 'Urgent/priority messages'
        }
      },
      maintenance: {
        title: 'Maintenance Requests',
        icon: WrenchScrewdriverIcon,
        color: 'orange',
        events: {
          newRequest: 'New maintenance requests',
          requestUpdate: 'Updates on existing requests',
          requestCompleted: 'Completed maintenance requests',
          urgentRequest: 'Emergency maintenance requests'
        }
      },
      reminders: {
        title: 'Reminders & Deadlines',
        icon: ClockIcon,
        color: 'purple',
        events: {
          rentDue: 'Rent payment reminders',
          inspections: 'Property inspection reminders',
          leaseExpiry: 'Lease expiration notices',
          contractorDeadlines: 'Contractor deadline reminders'
        }
      }
    };

    if (userRole === 'landlord') {
      return {
        ...commonCategories,
        tenant: {
          title: 'Tenant Activities',
          icon: UserGroupIcon,
          color: 'green',
          events: {
            newTenant: 'New tenant applications',
            tenantMove: 'Tenant move-in/move-out',
            leaseRenewal: 'Lease renewal requests',
            tenantComplaints: 'Tenant complaints/issues'
          }
        },
        financial: {
          title: 'Financial & Payments',
          icon: CurrencyDollarIcon,
          color: 'emerald',
          events: {
            rentReceived: 'Rent payments received',
            paymentOverdue: 'Overdue payment alerts',
            expenseAlerts: 'High expense notifications',
            financialReports: 'Monthly financial summaries'
          }
        },
        property: {
          title: 'Property Management',
          icon: DocumentTextIcon,
          color: 'indigo',
          events: {
            occupancyChanges: 'Occupancy rate changes',
            propertyUpdates: 'Property condition updates',
            contractorBids: 'New contractor bids',
            inspectionResults: 'Inspection reports'
          }
        }
      };
    } else if (userRole === 'tenant') {
      return {
        ...commonCategories,
        rent: {
          title: 'Rent & Payments',
          icon: CurrencyDollarIcon,
          color: 'green',
          events: {
            rentReminder: 'Rent payment due reminders',
            paymentConfirmation: 'Payment confirmations',
            lateFeesWarning: 'Late fee warnings',
            receiptAvailable: 'Payment receipts ready'
          }
        },
        property: {
          title: 'Property Updates',
          icon: DocumentTextIcon,
          color: 'indigo',
          events: {
            maintenanceScheduled: 'Maintenance appointments',
            propertyNotices: 'Important property notices',
            amenityUpdates: 'Amenity availability updates',
            emergencyAlerts: 'Emergency building alerts'
          }
        }
      };
    } else if (userRole === 'contractor') {
      return {
        ...commonCategories,
        jobs: {
          title: 'Job Opportunities',
          icon: WrenchScrewdriverIcon,
          color: 'orange',
          events: {
            newJobPosted: 'New job postings',
            bidAccepted: 'Bid acceptance notifications',
            jobUpdates: 'Job status changes',
            paymentReceived: 'Payment confirmations'
          }
        },
        schedule: {
          title: 'Schedule & Deadlines',
          icon: CalendarIcon,
          color: 'blue',
          events: {
            appointmentReminder: 'Upcoming appointments',
            deadlineWarning: 'Project deadline warnings',
            scheduleChanges: 'Schedule modifications',
            completionReminder: 'Completion confirmations'
          }
        }
      };
    }

    return commonCategories;
  };

  const notificationChannels = [
    { id: 'email', label: 'Email', icon: EnvelopeIcon, description: 'Receive notifications via email' },
    { id: 'sms', label: 'SMS/Text', icon: DevicePhoneMobileIcon, description: 'Receive text message notifications' },
    { id: 'push', label: 'Push Notifications', icon: ComputerDesktopIcon, description: 'Browser and mobile push notifications' },
    { id: 'inApp', label: 'In-App', icon: BellIcon, description: 'Notifications within the application' }
  ];

  const quietHours = [
    { value: 'none', label: 'No quiet hours' },
    { value: '22-08', label: '10 PM - 8 AM' },
    { value: '23-07', label: '11 PM - 7 AM' },
    { value: '00-08', label: '12 AM - 8 AM' },
    { value: 'custom', label: 'Custom hours' }
  ];

  useEffect(() => {
    loadPreferences();
  }, [userRole]);

  const loadPreferences = async () => {
    setIsLoading(true);
    try {
      // Mock loading preferences - replace with actual API call
      const mockPreferences = {};
      const categories = getNotificationCategories();
      
      Object.keys(categories).forEach(categoryKey => {
        mockPreferences[categoryKey] = {};
        Object.keys(categories[categoryKey].events).forEach(eventKey => {
          mockPreferences[categoryKey][eventKey] = {
            email: true,
            sms: eventKey.includes('urgent') || eventKey.includes('emergency'),
            push: true,
            inApp: true
          };
        });
      });

      mockPreferences.globalSettings = {
        quietHours: '22-08',
        frequency: 'immediate',
        digest: false,
        digestTime: '09:00'
      };

      setPreferences(mockPreferences);
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
    setIsLoading(false);
  };

  const updatePreference = (category, event, channel, value) => {
    setPreferences(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [event]: {
          ...prev[category]?.[event],
          [channel]: value
        }
      }
    }));
  };

  const updateGlobalSetting = (setting, value) => {
    setPreferences(prev => ({
      ...prev,
      globalSettings: {
        ...prev.globalSettings,
        [setting]: value
      }
    }));
  };

  const toggleCategory = (category, channel, enabled) => {
    const categoryEvents = getNotificationCategories()[category].events;
    const updatedPreferences = { ...preferences };
    
    Object.keys(categoryEvents).forEach(eventKey => {
      if (!updatedPreferences[category]) {
        updatedPreferences[category] = {};
      }
      if (!updatedPreferences[category][eventKey]) {
        updatedPreferences[category][eventKey] = {};
      }
      updatedPreferences[category][eventKey][channel] = enabled;
    });
    
    setPreferences(updatedPreferences);
  };

  const savePreferences = async () => {
    setIsLoading(true);
    setSaveStatus(null);
    
    try {
      // Mock save - replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (onSave) {
        onSave(preferences);
      }
      
      setSaveStatus('success');
      setTimeout(() => setSaveStatus(null), 3000);
    } catch (error) {
      console.error('Error saving preferences:', error);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus(null), 3000);
    }
    
    setIsLoading(false);
  };

  const categories = getNotificationCategories();

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <BellIcon className="w-8 h-8 text-orange-600" />
          <h1 className="text-2xl font-bold text-gray-900">Notification Preferences</h1>
        </div>
        <p className="text-gray-600">
          Customize how and when you receive notifications for different types of events.
        </p>
      </div>

      {/* Global Settings */}
      <div className="bg-gray-50 rounded-lg p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <Cog6ToothIcon className="w-5 h-5" />
          Global Settings
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quiet Hours */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quiet Hours
            </label>
            <select
              value={preferences.globalSettings?.quietHours || 'none'}
              onChange={(e) => updateGlobalSetting('quietHours', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              {quietHours.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              No notifications during these hours (except emergencies)
            </p>
          </div>

          {/* Notification Frequency */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notification Frequency
            </label>
            <select
              value={preferences.globalSettings?.frequency || 'immediate'}
              onChange={(e) => updateGlobalSetting('frequency', e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="immediate">Immediate</option>
              <option value="hourly">Hourly digest</option>
              <option value="daily">Daily digest</option>
              <option value="weekly">Weekly digest</option>
            </select>
          </div>

          {/* Daily Digest */}
          <div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={preferences.globalSettings?.digest || false}
                onChange={(e) => updateGlobalSetting('digest', e.target.checked)}
                className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Enable daily digest
              </span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Receive a summary of all notifications once per day
            </p>
          </div>

          {/* Digest Time */}
          {preferences.globalSettings?.digest && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Digest Time
              </label>
              <input
                type="time"
                value={preferences.globalSettings?.digestTime || '09:00'}
                onChange={(e) => updateGlobalSetting('digestTime', e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          )}
        </div>
      </div>

      {/* Notification Categories */}
      <div className="space-y-6">
        {Object.entries(categories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className={`p-2 bg-${category.color}-100 rounded-lg`}>
                  <category.icon className={`w-5 h-5 text-${category.color}-600`} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{category.title}</h3>
              </div>

              {/* Category Toggle Buttons */}
              <div className="flex items-center gap-2">
                {notificationChannels.map(channel => {
                  const allEnabled = Object.keys(category.events).every(eventKey => 
                    preferences[categoryKey]?.[eventKey]?.[channel.id]
                  );
                  
                  return (
                    <button
                      key={channel.id}
                      onClick={() => toggleCategory(categoryKey, channel.id, !allEnabled)}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${
                        allEnabled
                          ? `bg-${category.color}-100 text-${category.color}-700`
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {channel.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Events List */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2 text-sm font-medium text-gray-700">Event</th>
                    {notificationChannels.map(channel => (
                      <th key={channel.id} className="text-center py-2 px-3 text-sm font-medium text-gray-700">
                        <div className="flex flex-col items-center gap-1">
                          <channel.icon className="w-4 h-4" />
                          <span className="text-xs">{channel.label}</span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(category.events).map(([eventKey, eventLabel]) => (
                    <tr key={eventKey} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 text-sm text-gray-900">{eventLabel}</td>
                      {notificationChannels.map(channel => (
                        <td key={channel.id} className="text-center py-3 px-3">
                          <label className="inline-flex items-center">
                            <input
                              type="checkbox"
                              checked={preferences[categoryKey]?.[eventKey]?.[channel.id] || false}
                              onChange={(e) => updatePreference(categoryKey, eventKey, channel.id, e.target.checked)}
                              className="w-4 h-4 text-orange-600 border-gray-300 rounded focus:ring-orange-500"
                            />
                          </label>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>

      {/* Save Button */}
      <div className="mt-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {saveStatus === 'success' && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon className="w-5 h-5" />
              <span className="text-sm">Preferences saved successfully!</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-red-600">
              <ExclamationTriangleIcon className="w-5 h-5" />
              <span className="text-sm">Error saving preferences. Please try again.</span>
            </div>
          )}
        </div>

        <button
          onClick={savePreferences}
          disabled={isLoading}
          className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Saving...
            </>
          ) : (
            'Save Preferences'
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start gap-3">
          <InformationCircleIcon className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-blue-900 mb-1">Notification Tips</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Emergency notifications will always be sent regardless of quiet hours</li>
              <li>• In-app notifications are always enabled for security reasons</li>
              <li>• SMS notifications may incur carrier charges</li>
              <li>• You can test your notification settings from the account menu</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPreferences; 