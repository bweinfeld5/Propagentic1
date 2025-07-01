import React from 'react';
import ProfileHeader from './ProfileHeader';

const ProfileLayout = ({ children }) => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <ProfileHeader />
        <main className="mt-8">
          {children}
        </main>
      </div>
    </div>
  );
};

export default ProfileLayout; 