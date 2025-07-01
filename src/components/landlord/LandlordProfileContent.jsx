import React, { useState, useEffect } from 'react';
import { PencilIcon, BuildingOfficeIcon, PhoneIcon, EnvelopeIcon, UserIcon, CalendarIcon, CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import { formatMemberSince, calculateAccountAge } from '../../utils/dateUtils';
import { ProfileService } from '../../services/profileService';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LandlordProfileContent = ({ profile: initialProfile }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState(initialProfile);
  const [isLoading, setIsLoading] = useState(false);
  const { currentUser } = useAuth();

  // Subscribe to real-time profile updates
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = ProfileService.subscribeToProfile(currentUser.uid, (updatedProfile) => {
      if (updatedProfile) {
        setProfile(updatedProfile);
      }
    });

    return unsubscribe;
  }, [currentUser?.uid]);

  // Calculate profile completion and status
  const completionPercentage = profile ? ProfileService.calculateProfileCompletion(profile, 'landlord') : 0;
  const accountStatus = ProfileService.getAccountStatus(profile);
  const statusDisplay = ProfileService.getAccountStatusDisplay(accountStatus);

  const handleQuickAction = async (action) => {
    setIsLoading(true);
    try {
      switch (action) {
        case 'password':
          // Redirect to the new UserProfilePage with password modal
          window.location.href = '/u/profile';
          break;
        case 'notifications':
          // Redirect to the new UserProfilePage with notification settings
          window.location.href = '/u/profile';
          break;
        case 'download':
          toast('Data export feature coming soon!');
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(`Failed to perform action: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              <div className="space-y-4">
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Profile Information Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Profile Information</h2>
          <button
            onClick={() => setIsEditing(!isEditing)}
            disabled={isLoading}
            className="flex items-center px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 transition-colors disabled:opacity-50"
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
                <p className="font-medium">
                  {profile?.displayName || 
                   `${profile?.firstName || ''} ${profile?.lastName || ''}`.trim() || 
                   'Not provided'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Email Address</p>
                <p className="font-medium">{profile?.email || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <PhoneIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone Number</p>
                <p className="font-medium">{profile?.phone || profile?.phoneNumber || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Business Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Business Information</h3>
            
            <div className="flex items-center space-x-3">
              <BuildingOfficeIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Business Name</p>
                <p className="font-medium">{profile?.businessName || 'Not provided'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <CalendarIcon className="h-5 w-5 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Member Since</p>
                <p className="font-medium">{formatMemberSince(profile?.createdAt)}</p>
                {profile?.createdAt && (
                  <p className="text-xs text-gray-400 mt-1">
                    {calculateAccountAge(profile.createdAt)}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <div className="h-5 w-5 flex items-center justify-center">
                <div className={`h-3 w-3 rounded-full ${
                  statusDisplay.color === 'green' ? 'bg-green-400' :
                  statusDisplay.color === 'yellow' ? 'bg-yellow-400' :
                  statusDisplay.color === 'red' ? 'bg-red-400' : 'bg-gray-400'
                }`}></div>
              </div>
              <div>
                <p className="text-sm text-gray-500">Account Status</p>
                <p className="font-medium">{statusDisplay.label}</p>
                <p className="text-xs text-gray-400 mt-1">{statusDisplay.description}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Profile Completion Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Completion</h2>
        
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Overall Progress</span>
            <span className="text-sm font-medium text-gray-900">{completionPercentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${completionPercentage}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { field: 'firstName', label: 'First Name' },
            { field: 'lastName', label: 'Last Name' },
            { field: 'email', label: 'Email Address' },
            { field: 'phone', label: 'Phone Number' },
            { field: 'businessName', label: 'Business Name' },
          ].map(({ field, label }) => {
            const isCompleted = profile[field] && profile[field] !== '';
            return (
              <div key={field} className="flex items-center space-x-2">
                {isCompleted ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
                )}
                <span className={`text-sm ${isCompleted ? 'text-gray-700' : 'text-gray-500'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        {completionPercentage < 100 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-sm text-blue-700">
              Complete your profile to unlock all features and improve your experience on PropAgentic.
            </p>
          </div>
        )}
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
              completionPercentage >= 70
                ? 'bg-green-100 text-green-800' 
                : completionPercentage >= 40
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-red-100 text-red-800'
            }`}>
              {completionPercentage >= 70 ? 'Complete' : 'Incomplete'}
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Onboarding</p>
              <p className="text-sm text-gray-500">Initial setup and tour completion</p>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              profile?.onboardingComplete 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {profile?.onboardingComplete ? 'Complete' : 'Pending'}
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions Card */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Actions</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button 
            onClick={() => handleQuickAction('password')}
            disabled={isLoading}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <h3 className="font-medium text-gray-900">Change Password</h3>
            <p className="text-sm text-gray-500 mt-1">Update your account password</p>
          </button>
          
          <button 
            onClick={() => handleQuickAction('notifications')}
            disabled={isLoading}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <h3 className="font-medium text-gray-900">Notification Settings</h3>
            <p className="text-sm text-gray-500 mt-1">Manage email and SMS preferences</p>
          </button>
          
          <button 
            onClick={() => handleQuickAction('download')}
            disabled={isLoading}
            className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            <h3 className="font-medium text-gray-900">Download Data</h3>
            <p className="text-sm text-gray-500 mt-1">Export your account information</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LandlordProfileContent; 