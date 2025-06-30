import React from 'react';
import { PhoneIcon } from '@heroicons/react/24/outline';

const EmergencyContactStep = ({ formData, onChange }) => {
  const handleInputChange = (field, value) => {
    const emergencyContact = { ...formData.emergencyContact, [field]: value };
    onChange({ emergencyContact });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <PhoneIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Emergency Contact</h2>
        <p className="text-gray-600">Who should we contact in case of emergency? (Optional)</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Emergency Contact Name
        </label>
        <input
          type="text"
          value={formData.emergencyContact?.name || ''}
          onChange={(e) => handleInputChange('name', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Emergency contact's full name"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Emergency Contact Phone
          </label>
          <input
            type="tel"
            value={formData.emergencyContact?.phone || ''}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="(555) 123-4567"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Relationship
          </label>
          <select
            value={formData.emergencyContact?.relationship || ''}
            onChange={(e) => handleInputChange('relationship', e.target.value)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">Select relationship</option>
            <option value="spouse">Spouse</option>
            <option value="parent">Parent</option>
            <option value="sibling">Sibling</option>
            <option value="child">Child</option>
            <option value="friend">Friend</option>
            <option value="other">Other</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default EmergencyContactStep; 