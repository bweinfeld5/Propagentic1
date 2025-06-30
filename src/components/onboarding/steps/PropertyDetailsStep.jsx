import React from 'react';
import { HomeIcon } from '@heroicons/react/24/outline';

const PropertyDetailsStep = ({ formData, onChange, currentUser }) => {
  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  const handlePropertyTypeChange = (value) => {
    const updates = { propertyType: value };
    // Reset numberOfUnits if not multi-family
    if (value !== 'Multi-Family Building') {
      updates.numberOfUnits = 1;
    }
    onChange(updates);
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <HomeIcon className="w-16 h-16 mx-auto text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Add Your First Property</h2>
        <p className="text-gray-600">Every landlord needs at least one property to get started</p>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Nickname
          <span className="text-gray-400 text-sm ml-1">(Optional)</span>
        </label>
        <input
          type="text"
          value={formData.propertyNickname || ''}
          onChange={(e) => handleInputChange('propertyNickname', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="e.g., Main Street House, Downtown Condo"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Street Address *
        </label>
        <input
          type="text"
          value={formData.streetAddress || ''}
          onChange={(e) => handleInputChange('streetAddress', e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="123 Main Street"
        />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            City *
          </label>
          <input
            type="text"
            value={formData.city || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="San Francisco"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            State *
          </label>
          <input
            type="text"
            value={formData.state || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="CA"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Zip Code *
        </label>
        <input
          type="text"
          value={formData.zipCode || ''}
          onChange={(e) => handleInputChange('zipCode', e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="94105"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Property Type *
        </label>
        <select
          value={formData.propertyType || 'Single-Family Home'}
          onChange={(e) => handlePropertyTypeChange(e.target.value)}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
        >
          <option value="Single-Family Home">Single-Family Home</option>
          <option value="Multi-Family Building">Multi-Family Building</option>
          <option value="Commercial">Commercial</option>
        </select>
      </div>

      {formData.propertyType === 'Multi-Family Building' && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Number of Units *
          </label>
          <input
            type="number"
            value={formData.numberOfUnits || ''}
            onChange={(e) => handleInputChange('numberOfUnits', parseInt(e.target.value) || 1)}
            min="1"
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            placeholder="2"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Monthly Rent/Unit ($)
          <span className="text-gray-400 text-sm ml-1">(Optional)</span>
        </label>
        <input
          type="text"
          value={formData.monthlyRent || ''}
          onChange={(e) => handleInputChange('monthlyRent', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="2500"
        />
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800">
          <strong>Note:</strong> You can add more properties later from your dashboard. This is just your first property to get started.
        </p>
      </div>
    </div>
  );
};

export default PropertyDetailsStep; 