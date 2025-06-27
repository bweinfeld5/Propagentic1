import React from 'react';
import DocumentManager from '../components/maintenance/DocumentManager';
import { useAuth } from '../context/AuthContext';

const jobId = 'FO5TGNun7WgFrKHmUHM0'; // Test Ticket ID

const TestDocumentPage: React.FC = () => {
  const { currentUser } = useAuth();

  if (!currentUser) return null;

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Document Management Test</h1>
      <DocumentManager jobId={jobId} userId={currentUser.uid} />
    </div>
  );
};

export default TestDocumentPage; 