import React from 'react';
import { BuildingOfficeIcon } from '@heroicons/react/24/outline';

const BusinessDetailsStep = ({ formData, onChange, currentUser }) => {
  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <BuildingOfficeIcon className="w-16 h-16 mx-auto text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Business Details</h2>
        <p className="text-gray-600">Tell us about your property management experience</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Years in Business
        </label>
        <select
          value={formData.yearsInBusiness || '1-5'}
          onChange={(e) => handleInputChange('yearsInBusiness', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
        >
          <option value="1-5">1-5 years</option>
          <option value="6-10">6-10 years</option>
          <option value="11-20">11-20 years</option>
          <option value="20+">20+ years</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Total Properties
        </label>
        <select
          value={formData.totalProperties || '1'}
          onChange={(e) => handleInputChange('totalProperties', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
        >
          {Array.from({ length: 20 }, (_, i) => i + 1).map(num => (
            <option key={num} value={num.toString()}>
              {num} {num === 1 ? 'property' : 'properties'}
            </option>
          ))}
          <option value="20+">20+ properties</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Management Software
        </label>
        <select
          value={formData.managementSoftware || 'None'}
          onChange={(e) => handleInputChange('managementSoftware', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
        >
          <option value="None">None</option>
          <option value="Property Management Software">Property Management Software</option>
          <option value="Custom Software">Custom Software</option>
        </select>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-orange-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-orange-800">
              <strong>Optional Information:</strong> These details help us understand your experience level and provide better support. You can skip this step if you prefer.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessDetailsStep; 