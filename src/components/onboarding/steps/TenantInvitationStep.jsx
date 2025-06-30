import React from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

const TenantInvitationStep = ({ formData, onChange, currentUser }) => {
  const handleInputChange = (field, value) => {
    onChange({ [field]: value });
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <EnvelopeIcon className="w-16 h-16 mx-auto text-orange-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">
          Invite a Tenant 
          <span className="text-gray-400 text-lg ml-2">(Optional)</span>
        </h2>
        <p className="text-gray-600">You can invite your first tenant for the property you just added</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tenant's Email Address
        </label>
        <input
          type="email"
          value={formData.tenantEmail || ''}
          onChange={(e) => handleInputChange('tenantEmail', e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
          placeholder="tenant@example.com"
        />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-blue-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800 mb-1">How tenant invitations work:</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• We'll send an invitation email to your tenant</li>
              <li>• They'll receive a unique invite code to join your property</li>
              <li>• Once they accept, they'll appear in your tenant dashboard</li>
              <li>• You can always invite tenants later from your dashboard</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-gray-600">
              <strong>Skip this step</strong> if you don't have a tenant ready to invite yet. You can always send invitations later from your dashboard.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantInvitationStep; 