import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import UserProfileCard from '../components/profile/UserProfileCard';
import PasswordChangeModal from '../components/profile/PasswordChangeModal';
import NotificationSettings from '../components/profile/NotificationSettings';
import LandlordProfileContent from '../components/landlord/LandlordProfileContent';
import TenantProfileContent from '../components/tenant/TenantProfileContent';
import { Toaster } from 'react-hot-toast';

const UserProfilePage: React.FC = () => {
  const { currentUser, userProfile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');

  // Debug logging
  useEffect(() => {
    console.log('UserProfilePage Debug:', {
      loading,
      hasCurrentUser: !!currentUser,
      currentUserUid: currentUser?.uid,
      hasUserProfile: !!userProfile,
      userProfileType: userProfile?.userType,
      userProfileEmail: userProfile?.email,
      timestamp: new Date().toISOString()
    });
  }, [loading, currentUser, userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Authentication error: Please try logging in again.
        </div>
      </div>
    );
  }

  const handleBackToDashboard = () => {
    const userType = userProfile?.userType;
    switch (userType) {
      case 'landlord':
        navigate('/landlord/dashboard');
        break;
      case 'tenant':
        navigate('/tenant/dashboard');
        break;
      case 'contractor':
        navigate('/contractor/dashboard');
        break;
      case 'admin':
      case 'super_admin':
        navigate('/admin/dashboard');
        break;
      default:
        navigate('/dashboard');
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profile Settings', description: 'Manage your account information' },
    { id: 'roleSpecific', label: `${userProfile?.userType || 'User'} Details`, description: 'Role-specific information' },
    { id: 'notifications', label: 'Notifications', description: 'Manage notification preferences' },
  ];

  const renderRoleSpecificContent = () => {
    switch (userProfile?.userType) {
      case 'landlord':
        return <LandlordProfileContent profile={userProfile} />;
      case 'tenant':
        return <TenantProfileContent profile={userProfile} />;
      case 'contractor':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Contractor Profile</h2>
            <p className="text-gray-600">Contractor profile content coming soon...</p>
          </div>
        );
      case 'admin':
      case 'super_admin':
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Admin Profile</h2>
            <p className="text-gray-600">Admin profile content coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-2xl font-bold mb-4">Profile Loading</h2>
            <p className="text-gray-600">
              {userProfile ? 
                `Unknown user role: ${userProfile.userType}. Please contact support.` :
                'Loading your profile information...'
              }
            </p>
            {/* Debug info for development */}
            <div className="mt-4 p-4 bg-gray-100 rounded text-sm">
              <h3 className="font-bold">Debug Info:</h3>
              <p>User ID: {currentUser?.uid}</p>
              <p>Email: {currentUser?.email}</p>
              <p>Profile Loaded: {userProfile ? 'Yes' : 'No'}</p>
              <p>User Type: {userProfile?.userType || 'Not set'}</p>
            </div>
          </div>
        );
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile':
        return (
          <div className="space-y-6">
            <UserProfileCard userId={currentUser.uid} />
            <PasswordChangeModal />
          </div>
        );
      case 'roleSpecific':
        return renderRoleSpecificContent();
      case 'notifications':
        return <NotificationSettings userId={currentUser.uid} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Toaster position="top-center" reverseOrder={false} />
      
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header with Back Button */}
        <div className="mb-8">
          <button
            onClick={handleBackToDashboard}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
          >
            <ArrowLeftIcon className="h-5 w-5 mr-2" />
            Back to {userProfile?.userType ? `${userProfile.userType.charAt(0).toUpperCase()}${userProfile.userType.slice(1)} Dashboard` : 'Dashboard'}
          </button>
          
          {/* Profile Header */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="flex items-center">
              <div className="relative">
                {currentUser.photoURL ? (
                  <img 
                    src={currentUser.photoURL} 
                    alt="Profile" 
                    className="h-24 w-24 rounded-full object-cover border-4 border-gray-300"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center border-4 border-gray-300">
                    <span className="text-white text-2xl font-bold">
                      {(currentUser.displayName || userProfile?.displayName || currentUser.email || 'U')
                        .split(' ')
                        .map((name: string) => name.charAt(0).toUpperCase())
                        .join('')
                        .slice(0, 2)}
                    </span>
                  </div>
                )}
                {/* Role badge */}
                <div className="absolute -bottom-1 -right-1 bg-blue-500 rounded-full p-2">
                  <div className="w-3 h-3 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="ml-6">
                <div className="flex items-center space-x-3">
                  <h1 className="text-3xl font-bold">
                    {currentUser.displayName || userProfile?.displayName || 'User Profile'}
                  </h1>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-400">{currentUser.email}</p>
                <div className="flex items-center mt-2">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 capitalize">
                    {userProfile?.userType || 'User'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div>
                    <div>{tab.label}</div>
                    <div className="text-xs text-gray-400 mt-1">{tab.description}</div>
                  </div>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <main>
          {renderTabContent()}
        </main>
      </div>
    </div>
  );
};

export default UserProfilePage; 