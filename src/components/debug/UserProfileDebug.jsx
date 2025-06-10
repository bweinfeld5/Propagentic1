import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const UserProfileDebug = () => {
  const { currentUser, userProfile } = useAuth();

  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div className="bg-yellow-50 border-2 border-dashed border-yellow-400 p-4 rounded-lg my-6">
      <h3 className="text-lg font-bold text-yellow-800 mb-2">User Profile Diagnostic Tool</h3>
      {currentUser ? (
        <div>
          <p className="text-sm font-medium text-gray-700">
            <strong>Current User UID:</strong> {currentUser.uid}
          </p>
        </div>
      ) : (
        <p className="text-sm text-gray-700">No user logged in.</p>
      )}
      <div className="mt-4">
        <p className="text-sm font-medium text-gray-700 mb-1">
          <strong>Firestore User Profile:</strong>
        </p>
        <pre className="bg-white p-3 rounded text-xs overflow-x-auto">
          {userProfile ? JSON.stringify(userProfile, null, 2) : 'userProfile is null or undefined.'}
        </pre>
      </div>
    </div>
  );
};

export default UserProfileDebug; 