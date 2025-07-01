import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { UserCircleIcon } from '@heroicons/react/24/solid';

const ProfileHeader = () => {
  const { userProfile } = useAuth();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center">
        <UserCircleIcon className="h-24 w-24 text-gray-300" />
        <div className="ml-6">
          <h1 className="text-3xl font-bold">{userProfile?.displayName || 'User'}</h1>
          <p className="text-gray-500 capitalize">{userProfile?.userType}</p>
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader; 