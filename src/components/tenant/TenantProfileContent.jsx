import React, { useState } from 'react';
import { PencilIcon, HomeIcon, PhoneIcon, EnvelopeIcon, UserIcon, CalendarIcon } from '@heroicons/react/24/outline';

const TenantProfileContent = ({ profile }) => {
  const [isEditing, setIsEditing] = useState(false);

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp.seconds * 1000).toLocaleDateString();
  };

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Tenant Profile</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors"
          >
            <PencilIcon className="h-4 w-4 mr-2" />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Personal Information</h3>
            
            <div className="flex items-center space-x-3">
              <UserIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Full Name</p>
                <p className="font-medium">{profile?.displayName || `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium">{profile?.email || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{profile?.phoneNumber || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Rental Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Rental Information</h3>
            
            <div className="flex items-center space-x-3">
              <HomeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Current Property</p>
                <p className="font-medium">{profile?.propertyAddress || 'No property assigned'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Move-in Date</p>
                <p className="font-medium">{formatDate(profile?.moveInDate) || 'N/A'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 flex items-center justify-center">
                <div className={`h-3 w-3 rounded-full ${profile?.isActive ? 'bg-green-400' : 'bg-red-400'}`}></div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Tenancy Status</p>
                <p className="font-medium">{profile?.isActive ? 'Active' : 'Inactive'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Account Settings Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h2>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Email Verified</p>
              <p className="text-sm text-gray-500">Your email address has been verified</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              profile?.emailVerified 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {profile?.emailVerified ? 'Verified' : 'Not Verified'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Profile Completion</p>
              <p className="text-sm text-gray-500">Complete your profile to access all features</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              profile?.profileComplete 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {profile?.profileComplete ? 'Complete' : 'Incomplete'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-gray-900">Report Maintenance</h3>
            <p className="text-sm text-gray-500 mt-1">Submit a new maintenance request</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-gray-900">Contact Landlord</h3>
            <p className="text-sm text-gray-500 mt-1">Send a message to your landlord</p>
          </button>
          
          <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <h3 className="font-medium text-gray-900">View Lease</h3>
            <p className="text-sm text-gray-500 mt-1">Access your lease documents</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantProfileContent; 