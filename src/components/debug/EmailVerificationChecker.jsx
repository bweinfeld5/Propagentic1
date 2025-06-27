import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import emailVerificationService from '../../services/emailVerificationService';

const EmailVerificationChecker = () => {
  const { currentUser } = useAuth();
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [error, setError] = useState(null);

  // Check status on mount
  useEffect(() => {
    if (currentUser) {
      checkVerificationStatus();
    }
  }, [currentUser]);

  const checkVerificationStatus = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    
    try {
      const verificationStatus = await emailVerificationService.getVerificationStatus(currentUser.uid);
      setStatus(verificationStatus);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const syncVerificationStatus = async () => {
    if (!currentUser) return;

    setLoading(true);
    setError(null);
    setSyncResult(null);

    try {
      const result = await emailVerificationService.syncEmailVerificationStatus(currentUser.uid);
      setSyncResult(result);
      
      // Refresh status after sync
      await checkVerificationStatus();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const sendVerificationEmail = async () => {
    setLoading(true);
    setError(null);

    try {
      const success = await emailVerificationService.sendVerificationEmail();
      if (success) {
        alert('Verification email sent! Please check your inbox.');
      } else {
        setError('Failed to send verification email');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <div className="p-4 bg-gray-100 rounded-lg">
        <p className="text-gray-600">Please log in to check email verification status.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md max-w-2xl">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Email Verification Status Checker
      </h3>
      
      <div className="space-y-4">
        {/* Current User Info */}
        <div className="p-3 bg-gray-50 rounded">
          <p className="text-sm text-gray-600">
            <strong>User:</strong> {currentUser.email}
          </p>
          <p className="text-sm text-gray-600">
            <strong>UID:</strong> {currentUser.uid.substring(0, 12)}...
          </p>
        </div>

        {/* Status Display */}
        {status && (
          <div className="p-4 border rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">Verification Status</h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Firebase Auth:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  status.auth ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {status.auth ? 'Verified ✅' : 'Not Verified ❌'}
                </span>
              </div>
              <div>
                <span className="font-medium">Firestore:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  status.firestore ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {status.firestore ? 'Verified ✅' : 'Not Verified ❌'}
                </span>
              </div>
            </div>
            
            <div className="mt-3">
              <span className="font-medium">Consistency:</span>
              <span className={`ml-2 px-2 py-1 rounded text-xs ${
                status.consistent ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {status.consistent ? 'In Sync ✅' : 'Discrepancy Found ⚠️'}
              </span>
            </div>
          </div>
        )}

        {/* Sync Result */}
        {syncResult && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h4 className="font-medium text-blue-900 mb-2">Sync Result</h4>
            <p className="text-sm text-blue-800">
              <strong>Action:</strong> {syncResult.action}
            </p>
            {syncResult.before && (
              <div className="text-xs text-blue-700 mt-1">
                <strong>Before:</strong> Auth: {syncResult.before.auth ? 'verified' : 'unverified'}, 
                Firestore: {syncResult.before.firestore ? 'verified' : 'unverified'}
                <br />
                <strong>After:</strong> Auth: {syncResult.after.auth ? 'verified' : 'unverified'}, 
                Firestore: {syncResult.after.firestore ? 'verified' : 'unverified'}
              </div>
            )}
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">
              <strong>Error:</strong> {error}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <button
            onClick={checkVerificationStatus}
            disabled={loading}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50 text-sm"
          >
            {loading ? 'Checking...' : 'Check Status'}
          </button>

          {status && !status.consistent && (
            <button
              onClick={syncVerificationStatus}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Syncing...' : 'Sync Status'}
            </button>
          )}

          {status && !status.auth && (
            <button
              onClick={sendVerificationEmail}
              disabled={loading}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50 text-sm"
            >
              {loading ? 'Sending...' : 'Send Verification Email'}
            </button>
          )}
        </div>

        {/* Instructions */}
        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>How this works:</strong></p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong>Check Status:</strong> Compares email verification between Firebase Auth and Firestore</li>
            <li><strong>Sync Status:</strong> Updates Firestore to match Firebase Auth (conservative approach)</li>
            <li><strong>Send Email:</strong> Sends verification email if Auth shows unverified</li>
          </ul>
          <p className="mt-2">
            <strong>Note:</strong> For production users like Charlie, this tool helps identify and fix 
            discrepancies that may occur during onboarding.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationChecker; 