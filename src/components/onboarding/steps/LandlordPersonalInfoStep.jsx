import React from 'react';
import { UserIcon } from '@heroicons/react/24/outline';

const LandlordPersonalInfoStep = ({ formData, onChange, currentUser }) => {
  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <UserIcon className="w-16 h-16 mx-auto text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Your Profile</h2>
        <p className="text-gray-600">Let's start with your basic information</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name *
          </label>
          <input
            type="text"
            value={formData.firstName || ''}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="John"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name *
          </label>
          <input
            type="text"
            value={formData.lastName || ''}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="Doe"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phone Number *
        </label>
        <input
          type="tel"
          value={formData.phoneNumber || ''}
          onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="(555) 123-4567"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Preferred Contact Method
        </label>
        <select
          value={formData.preferredContactMethod || 'email'}
          onChange={(e) => handleInputChange('preferredContactMethod', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
        >
          <option value="email">Email</option>
          <option value="phone">Phone</option>
          <option value="text">Text Message</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Business Name 
          <span className="text-gray-400 text-sm ml-1">(Optional)</span>
        </label>
        <input
          type="text"
          value={formData.businessName || ''}
          onChange={(e) => handleInputChange('businessName', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="ABC Property Management"
        />
      </div>
      
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800">
          <strong>Pre-filled:</strong> Your email ({currentUser?.email}) is already set up from registration.
        </p>
      </div>
    </div>
  );
};

export default LandlordPersonalInfoStep; 