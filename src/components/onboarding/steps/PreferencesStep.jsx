import React from 'react';
import { HomeIcon } from '@heroicons/react/24/outline';

const PreferencesStep = ({ formData, onChange }) => {
  const handlePreferenceChange = (field, value) => {
    const preferences = { ...formData.preferences, [field]: value };
    onChange({ preferences });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <HomeIcon className="w-16 h-16 mx-auto text-purple-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Communication Preferences</h2>
        <p className="text-gray-600">How would you like to receive updates?</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">
          Preferred Communication Method
        </label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {[
            { value: 'email', label: 'Email' },
            { value: 'sms', label: 'Text Message' },
            { value: 'both', label: 'Email & SMS' }
          ].map((method) => (
            <div key={method.value}>
              <input
                type="radio"
                id={`comm-${method.value}`}
                name="communicationMethod"
                value={method.value}
                checked={formData.preferences?.communicationMethod === method.value}
                onChange={(e) => handlePreferenceChange('communicationMethod', e.target.value)}
                className="sr-only"
              />
              <label
                htmlFor={`comm-${method.value}`}
                className={`block w-full py-3 px-4 text-center rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                  formData.preferences?.communicationMethod === method.value
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-medium'
                    : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                }`}
              >
                {method.label}
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <label className="block text-sm font-medium text-gray-700">
          Notification Preferences
        </label>
        
        <div className="space-y-3">
          <div className="flex items-center">
            <input
              id="maintenance-notifications"
              type="checkbox"
              checked={formData.preferences?.maintenanceNotifications || false}
              onChange={(e) => handlePreferenceChange('maintenanceNotifications', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="maintenance-notifications" className="ml-3 text-sm text-gray-700">
              Maintenance request updates
            </label>
          </div>
          
          <div className="flex items-center">
            <input
              id="payment-reminders"
              type="checkbox"
              checked={formData.preferences?.paymentReminders || false}
              onChange={(e) => handlePreferenceChange('paymentReminders', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="payment-reminders" className="ml-3 text-sm text-gray-700">
              Payment reminders and receipts
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreferencesStep; 