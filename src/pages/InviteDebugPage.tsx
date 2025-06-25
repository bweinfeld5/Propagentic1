import React from 'react';
import InviteCodeValidationTest from '../components/debug/InviteCodeValidationTest';

const InviteDebugPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          🔍 Invite Code Validation Debug Page
        </h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Test Information</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><strong>Test Codes:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li><code className="bg-gray-100 px-2 py-1 rounded">62523174</code> - 8-digit shortCode from your database</li>
              <li><code className="bg-gray-100 px-2 py-1 rounded">38LXEX7F</code> - 20-character document ID from your database</li>
            </ul>
            <p className="mt-4"><strong>Expected Results:</strong></p>
            <ul className="list-disc list-inside ml-4 space-y-1">
              <li>Firebase connection should be successful</li>
              <li>Database query should find invites</li>
              <li>ShortCode query should find the document with shortCode "62523174"</li>
              <li>Direct document check should find document ID "38LXEX7F"</li>
              <li>Validation should succeed for both codes</li>
            </ul>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Debug Console</h2>
          <p className="text-gray-600 mb-4">
            The debug tool will appear in the bottom-right corner. Click "Run Tests" to start comprehensive validation testing.
          </p>
        </div>
        
        {/* Debug tool will appear as overlay */}
        <InviteCodeValidationTest />
      </div>
    </div>
  );
};

export default InviteDebugPage; 