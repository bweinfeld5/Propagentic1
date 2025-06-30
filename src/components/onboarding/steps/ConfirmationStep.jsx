import React from 'react';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

const ConfirmationStep = ({ formData, onChange, currentUser }) => {
  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <CheckCircleIcon className="w-16 h-16 mx-auto text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900">Confirm Details</h2>
        <p className="text-gray-600">Please review your information before completing setup</p>
      </div>

      <div className="space-y-6">
        {/* Personal Information Section */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
          <h3 className="font-semibold text-orange-900 mb-4 text-lg">Personal Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <p className="text-gray-900">{formData.firstName} {formData.lastName}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <p className="text-gray-900">{formData.phoneNumber}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Contact Method:</span>
              <p className="text-gray-900 capitalize">{formData.preferredContactMethod}</p>
            </div>
            {formData.businessName && (
              <div>
                <span className="font-medium text-gray-700">Business:</span>
                <p className="text-gray-900">{formData.businessName}</p>
              </div>
            )}
          </div>
        </div>

        {/* Property Details Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-4 text-lg">Property Details</h3>
          <div className="space-y-3 text-sm">
            {formData.propertyNickname && (
              <div>
                <span className="font-medium text-gray-700">Nickname:</span>
                <p className="text-gray-900">{formData.propertyNickname}</p>
              </div>
            )}
            <div>
              <span className="font-medium text-gray-700">Address:</span>
              <p className="text-gray-900">
                {formData.streetAddress}, {formData.city}, {formData.state} {formData.zipCode}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="font-medium text-gray-700">Type:</span>
                <p className="text-gray-900">{formData.propertyType}</p>
              </div>
              {formData.propertyType === 'Multi-Family Building' && (
                <div>
                  <span className="font-medium text-gray-700">Units:</span>
                  <p className="text-gray-900">{formData.numberOfUnits}</p>
                </div>
              )}
            </div>
            {formData.monthlyRent && (
              <div>
                <span className="font-medium text-gray-700">Monthly Rent:</span>
                <p className="text-gray-900">${formData.monthlyRent}</p>
              </div>
            )}
          </div>
        </div>

        {/* Business Details Section */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <h3 className="font-semibold text-purple-900 mb-4 text-lg">Business Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium text-gray-700">Years in Business:</span>
              <p className="text-gray-900">{formData.yearsInBusiness}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Total Properties:</span>
              <p className="text-gray-900">{formData.totalProperties}</p>
            </div>
            <div className="md:col-span-2">
              <span className="font-medium text-gray-700">Management Software:</span>
              <p className="text-gray-900">{formData.managementSoftware}</p>
            </div>
          </div>
        </div>

        {/* Tenant Invitation Section (if provided) */}
        {formData.tenantEmail && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <h3 className="font-semibold text-green-900 mb-4 text-lg">Tenant Invitation</h3>
            <div className="text-sm">
              <span className="font-medium text-gray-700">Inviting:</span>
              <p className="text-gray-900">{formData.tenantEmail}</p>
              <p className="text-green-700 mt-2 text-xs">
                ✓ An invitation will be sent after setup is complete
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Final confirmation message */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-6">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <CheckCircleIcon className="w-6 h-6 text-green-600 mt-1" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-green-800 mb-2">Ready to complete your setup!</h3>
            <p className="text-sm text-green-700 mb-3">
              Click "Complete Setup" to create your landlord profile and start managing your properties.
            </p>
            <div className="text-xs text-green-600 space-y-1">
              <p>✓ Your landlord profile will be created</p>
              <p>✓ Your first property will be added to the system</p>
              <p>✓ You'll be redirected to your dashboard</p>
              {formData.tenantEmail && <p>✓ Tenant invitation will be sent automatically</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationStep; 