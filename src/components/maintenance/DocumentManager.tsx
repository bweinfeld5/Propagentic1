import React, { useState } from 'react';
import DocumentUploader from './DocumentUploader';
import DocumentGallery from './DocumentGallery';

interface DocumentManagerProps {
  jobId: string;
  userId: string;
}

const categories = [
  'before-photos',
  'after-photos',
  'receipts',
  'contracts',
  'miscellaneous',
];

const DocumentManager: React.FC<DocumentManagerProps> = ({ jobId, userId }) => {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleUploadSuccess = () => {
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div>
      <h2>Work Order Document Management</h2>
      {categories.map(category => (
        <div key={category} style={{ marginBottom: 32 }}>
          <h4 style={{ textTransform: 'capitalize' }}>{category.replace('-', ' ')}</h4>
          <DocumentUploader
            jobId={jobId}
            category={category}
            userId={userId}
            onUploadSuccess={handleUploadSuccess}
          />
          <DocumentGallery
            jobId={jobId}
            category={category}
            refreshTrigger={refreshKey}
            userId={userId}
          />
        </div>
      ))}
    </div>
  );
};

export default DocumentManager; 