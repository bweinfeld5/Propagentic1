import React from 'react';
import { Link } from 'react-router-dom';
import EmailVerificationChecker from '../components/debug/EmailVerificationChecker';
import { useAuth } from '../context/AuthContext';

const EmailVerificationTest = () => {
  const { currentUser, userProfile } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link 
            to="/" 
            className="text-blue-600 hover:text-blue-800 text-sm mb-4 inline-block"
          >
            ← Back to Home
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Email Verification Test Page
          </h1>
          <p className="text-gray-600 mt-2">
            Test and fix email verification discrepancies between Firebase Auth and Firestore.
          </p>
        </div>

        {/* Current User Info */}
        {currentUser && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Current User Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Email:</strong> {currentUser.email}
              </div>
              <div>
                <strong>UID:</strong> {currentUser.uid}
              </div>
              <div>
                <strong>Auth Email Verified:</strong> 
                <span className={`ml-2 px-2 py-1 rounded text-xs ${
                  currentUser.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {currentUser.emailVerified ? 'Yes ✅' : 'No ❌'}
                </span>
              </div>
              <div>
                <strong>User Type:</strong> {userProfile?.userType || 'Loading...'}
              </div>
              <div>
                <strong>Display Name:</strong> {currentUser.displayName || 'Not set'}
              </div>
              <div>
                <strong>Created:</strong> {currentUser.metadata.creationTime}
              </div>
            </div>
          </div>
        )}

        {/* Email Verification Checker */}
        <EmailVerificationChecker />

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-3">
            Testing Instructions
          </h3>
          <div className="space-y-3 text-sm text-blue-800">
            <div>
              <strong>For Charlie Gallagher:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Log in with charlie@propagenticai.com</li>
                <li>Expected result: Auth shows "Not Verified", Firestore shows "Verified"</li>
                <li>Click "Sync Status" to fix the discrepancy</li>
                <li>Optionally send verification email to properly verify</li>
              </ul>
            </div>
            <div>
              <strong>For Other Users:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Check if you have any verification discrepancies</li>
                <li>Use the sync feature to maintain consistency</li>
                <li>Send verification emails if needed</li>
              </ul>
            </div>
            <div>
              <strong>What the Sync Does:</strong>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li>Updates Firestore to match Firebase Auth (conservative approach)</li>
                <li>Adds timestamp tracking for sync operations</li>
                <li>Preserves audit trail of verification status changes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Development Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Development Notes
          </h3>
          <div className="space-y-2 text-sm text-gray-700">
            <p>
              <strong>Service Created:</strong> <code>src/services/emailVerificationService.js</code>
            </p>
            <p>
              <strong>Component Created:</strong> <code>src/components/debug/EmailVerificationChecker.jsx</code>
            </p>
            <p>
              <strong>Test Route:</strong> This page can be accessed at <code>/email-verification-test</code>
            </p>
            <p>
              <strong>Admin Scripts:</strong> <code>scripts/check-charlie-verification-status.js</code> and 
              <code>scripts/fix-email-verification-sync.js</code>
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
          <h3 className="text-lg font-semibold text-green-900 mb-3">
            Next Steps for Production
          </h3>
          <div className="space-y-2 text-sm text-green-800">
            <p>1. Add EmailVerificationChecker to admin dashboard for support team</p>
            <p>2. Consider adding verification status to user settings/profile pages</p>
            <p>3. Update onboarding flow to handle verification more gracefully</p>
            <p>4. Monitor for additional users with similar discrepancies</p>
            <p>5. Consider auto-sync integration in AuthContext for seamless UX</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailVerificationTest; 