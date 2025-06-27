import React from 'react';
import { useAuth } from '../../context/AuthContext.jsx';

const QuickAuthTest: React.FC = () => {
  const { currentUser, userProfile, loading, authError } = useAuth();

  return (
    <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm z-50">
      <h3 className="font-bold text-sm mb-2">🔍 Auth Status</h3>
      <div className="text-xs space-y-1">
        <div>
          <strong>Loading:</strong> {loading ? '⏳ Yes' : '✅ No'}
        </div>
        <div>
          <strong>Firebase User:</strong> {currentUser ? '✅ Logged In' : '❌ Not Logged In'}
        </div>
        <div>
          <strong>Profile:</strong> {userProfile ? '✅ Loaded' : '❌ Missing'}
        </div>
        <div>
          <strong>User Type:</strong> {userProfile?.userType || 'Unknown'}
        </div>
        <div>
          <strong>Error:</strong> {authError || 'None'}
        </div>
        {currentUser && (
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div><strong>UID:</strong> {currentUser.uid.slice(0, 8)}...</div>
            <div><strong>Email:</strong> {currentUser.email}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuickAuthTest; 