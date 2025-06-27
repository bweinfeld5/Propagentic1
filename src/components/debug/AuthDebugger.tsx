import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { auth } from '../../firebase/config';
import { signOut } from 'firebase/auth';

interface AuthDebuggerProps {
  isOpen: boolean;
  onClose: () => void;
}

const AuthDebugger: React.FC<AuthDebuggerProps> = ({ isOpen, onClose }) => {
  const { currentUser, userProfile, loading, authError, profileError } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [clearingCache, setClearingCache] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const updateDebugInfo = () => {
      const info = {
        timestamp: new Date().toISOString(),
        firebase: {
          currentUser: currentUser ? {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName,
            emailVerified: currentUser.emailVerified,
            providerId: currentUser.providerId,
            metadata: {
              creationTime: currentUser.metadata.creationTime,
              lastSignInTime: currentUser.metadata.lastSignInTime
            }
          } : null,
          authInstance: !!auth,
          authReady: !loading
        },
        context: {
          userProfile: userProfile ? {
            uid: userProfile.uid,
            email: userProfile.email,
            userType: userProfile.userType,
            role: userProfile.role,
            onboardingComplete: userProfile.onboardingComplete,
            displayName: userProfile.displayName,
            firstName: userProfile.firstName,
            lastName: userProfile.lastName
          } : null,
          loading,
          authError,
          profileError
        },
        localStorage: {
          user: localStorage.getItem('user'),
          rememberEmail: localStorage.getItem('rememberEmail'),
          hasVisitedBefore: localStorage.getItem('hasVisitedBefore'),
          allKeys: Object.keys(localStorage)
        },
        sessionStorage: {
          allKeys: Object.keys(sessionStorage)
        }
      };
      setDebugInfo(info);
    };

    updateDebugInfo();
    const interval = setInterval(updateDebugInfo, 1000);
    return () => clearInterval(interval);
  }, [isOpen, currentUser, userProfile, loading, authError, profileError]);

  const clearAllCache = async () => {
    setClearingCache(true);
    try {
      // Clear localStorage
      const keysToRemove = [
        'user', 
        'rememberEmail', 
        'hasVisitedBefore',
        'lastAuthToken',
        'userProfile',
        'authState'
      ];
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
      });

      // Clear sessionStorage
      sessionStorage.clear();

      // Sign out from Firebase completely
      if (auth.currentUser) {
        await signOut(auth);
      }

      // Clear any persistent auth state
      await auth.signOut();

      // Force page reload to completely reset state
      setTimeout(() => {
        window.location.href = '/login';
      }, 1000);

    } catch (error) {
      console.error('Error clearing cache:', error);
    } finally {
      setClearingCache(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">🔍 Authentication Debugger</h2>
          <div className="flex gap-2">
            <button
              onClick={clearAllCache}
              disabled={clearingCache}
              className={`px-4 py-2 rounded-lg text-white font-medium ${
                clearingCache 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {clearingCache ? 'Clearing...' : '🧹 Clear All Cache & Logout'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
            >
              ✕ Close
            </button>
          </div>
        </div>
        
        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Firebase Auth State */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-blue-600">🔥 Firebase Auth State</h3>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div><strong>Auth Ready:</strong> {debugInfo.firebase?.authReady ? '✅' : '⏳'}</div>
                  <div><strong>Current User:</strong> {debugInfo.firebase?.currentUser ? '✅ Logged In' : '❌ Not Logged In'}</div>
                  {debugInfo.firebase?.currentUser && (
                    <div className="ml-4 space-y-1">
                      <div><strong>UID:</strong> {debugInfo.firebase.currentUser.uid}</div>
                      <div><strong>Email:</strong> {debugInfo.firebase.currentUser.email}</div>
                      <div><strong>Display Name:</strong> {debugInfo.firebase.currentUser.displayName || 'Not set'}</div>
                      <div><strong>Email Verified:</strong> {debugInfo.firebase.currentUser.emailVerified ? '✅' : '❌'}</div>
                      <div><strong>Last Sign In:</strong> {debugInfo.firebase.currentUser.metadata?.lastSignInTime}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Context State */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-600">⚛️ React Context State</h3>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div><strong>Loading:</strong> {debugInfo.context?.loading ? '⏳' : '✅'}</div>
                  <div><strong>Profile Loaded:</strong> {debugInfo.context?.userProfile ? '✅' : '❌'}</div>
                  <div><strong>Auth Error:</strong> {debugInfo.context?.authError || 'None'}</div>
                  <div><strong>Profile Error:</strong> {debugInfo.context?.profileError || 'None'}</div>
                  {debugInfo.context?.userProfile && (
                    <div className="ml-4 space-y-1">
                      <div><strong>User Type:</strong> {debugInfo.context.userProfile.userType}</div>
                      <div><strong>Role:</strong> {debugInfo.context.userProfile.role}</div>
                      <div><strong>Onboarding:</strong> {debugInfo.context.userProfile.onboardingComplete ? '✅' : '❌'}</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Local Storage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-purple-600">💾 Local Storage</h3>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div><strong>User Data:</strong> {debugInfo.localStorage?.user ? '✅ Present' : '❌ None'}</div>
                  <div><strong>Remember Email:</strong> {debugInfo.localStorage?.rememberEmail || 'None'}</div>
                  <div><strong>All Keys:</strong> {debugInfo.localStorage?.allKeys?.join(', ') || 'None'}</div>
                  {debugInfo.localStorage?.user && (
                    <div className="mt-2">
                      <strong>Stored User:</strong>
                      <pre className="bg-white p-2 rounded border text-xs overflow-x-auto">
                        {JSON.stringify(JSON.parse(debugInfo.localStorage.user), null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Session Storage */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-orange-600">🗃️ Session Storage</h3>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="space-y-2 text-sm">
                  <div><strong>Session Keys:</strong> {debugInfo.sessionStorage?.allKeys?.join(', ') || 'None'}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Full Debug JSON */}
          <div className="mt-6">
            <h3 className="text-lg font-semibold text-gray-600 mb-2">📄 Full Debug Data</h3>
            <pre className="bg-gray-100 p-4 rounded-lg text-xs overflow-x-auto max-h-64">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>

          {/* Instructions */}
          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">🔧 Troubleshooting Steps</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-yellow-700">
              <li>If you see cached user data but auth issues, click "Clear All Cache & Logout"</li>
              <li>Try logging in with the exact credentials you expect</li>
              <li>Check if the Firebase user UID matches your expected account</li>
              <li>Verify the user profile data matches what you expect</li>
              <li>If problems persist, check the browser's Network tab during login</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthDebugger; 