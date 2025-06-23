import React from 'react';
import { ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

interface Document {
  id: string;
  name: string;
  type: string;
  expirationDate?: Date;
}

interface ExpirationTrackerProps {
  documents: Document[];
  onExpirationWarning: (documentId: string) => void;
}

const ExpirationTracker: React.FC<ExpirationTrackerProps> = ({
  documents,
  onExpirationWarning
}) => {
  const getExpirationStatus = (expirationDate?: Date) => {
    if (!expirationDate) return 'none';
    
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);
    
    if (expirationDate < now) {
      return 'expired';
    } else if (expirationDate <= thirtyDaysFromNow) {
      return 'expiring-soon';
    }
    return 'valid';
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    if (!a.expirationDate) return 1;
    if (!b.expirationDate) return -1;
    return a.expirationDate.getTime() - b.expirationDate.getTime();
  });

  const expiringDocuments = sortedDocuments.filter(doc => 
    getExpirationStatus(doc.expirationDate) !== 'valid'
  );

  if (expiringDocuments.length === 0) {
    return (
      <div className="bg-success/10 dark:bg-success-dark/20 text-success dark:text-success-light p-4 rounded-lg">
        <div className="flex items-center">
          <ClockIcon className="w-5 h-5 mr-2" />
          <p>All documents are up to date</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {expiringDocuments.map(doc => {
        const status = getExpirationStatus(doc.expirationDate);
        const isExpired = status === 'expired';
        
        return (
          <div
            key={doc.id}
            className={`p-4 rounded-lg ${
              isExpired
                ? 'bg-error/10 dark:bg-error-dark/20'
                : 'bg-warning/10 dark:bg-warning-dark/20'
            }`}
          >
            <div className="flex items-start">
              <ExclamationCircleIcon 
                className={`w-5 h-5 mr-3 flex-shrink-0 ${
                  isExpired
                    ? 'text-error dark:text-error-light'
                    : 'text-warning dark:text-warning-light'
                }`}
              />
              <div>
                <h4 className={`font-medium ${
                  isExpired
                    ? 'text-error dark:text-error-light'
                    : 'text-warning dark:text-warning-light'
                }`}>
                  {isExpired ? 'Expired Document' : 'Document Expiring Soon'}
                </h4>
                <p className="text-content-secondary dark:text-content-darkSecondary mt-1">
                  {doc.name}
                </p>
                {doc.expirationDate && (
                  <p className="text-sm text-content-secondary dark:text-content-darkSecondary mt-1">
                    {isExpired ? 'Expired on: ' : 'Expires on: '}
                    {new Intl.DateTimeFormat('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }).format(doc.expirationDate)}
                  </p>
                )}
                <button
                  onClick={() => onExpirationWarning(doc.id)}
                  className={`mt-3 text-sm font-medium ${
                    isExpired
                      ? 'text-error-dark dark:text-error-light hover:text-error hover:underline'
                      : 'text-warning-dark dark:text-warning-light hover:text-warning hover:underline'
                  }`}
                >
                  Update Document
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ExpirationTracker; 