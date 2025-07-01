import React, { useEffect } from 'react';
import { useAuth } from '../context/AuthContext.jsx';
import ProfileLayout from '../components/profile/ProfileLayout';
import LandlordProfileContent from '../components/landlord/LandlordProfileContent';
import TenantProfileContent from '../components/tenant/TenantProfileContent';
// Import other role-specific content components as they are created
// import ContractorProfileContent from '../components/contractor/ContractorProfileContent';

const UniversalProfilePage = () => {
  const { userProfile, loading, currentUser } = useAuth();

  // Debug logging to help identify the issue
  useEffect(() => {
    console.log('UniversalProfilePage Debug:', {
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
    console.log('UniversalProfilePage: Still loading...');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Add additional check for currentUser
  if (!currentUser) {
    console.error('UniversalProfilePage: No currentUser found, this should not happen if PrivateRoute is working');
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Authentication error: Please try logging in again.
        </div>
      </div>
    );
  }

  const renderProfileContent = () => {
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

  return (
    <ProfileLayout>
      {renderProfileContent()}
    </ProfileLayout>
  );
};

export default UniversalProfilePage; 