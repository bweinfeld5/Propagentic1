import React from 'react';
import { DocumentIcon, TrashIcon, EyeIcon, CalendarIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button';

interface Document {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  expirationDate?: Date;
  status: 'active' | 'expired' | 'pending';
}

interface DocumentListProps {
  documents: Document[];
  onDelete: (documentId: string) => void;
  onView: (document: Document) => void;
  onUpdateExpiration: (documentId: string, date: Date) => void;
}

const DocumentList: React.FC<DocumentListProps> = ({
  documents,
  onDelete,
  onView,
  onUpdateExpiration
}) => {
  const getStatusColor = (status: Document['status']) => {
    switch (status) {
      case 'active':
        return 'text-success dark:text-success-light bg-success/10 dark:bg-success-dark/20';
      case 'expired':
        return 'text-error dark:text-error-light bg-error/10 dark:bg-error-dark/20';
      case 'pending':
        return 'text-warning dark:text-warning-light bg-warning/10 dark:bg-warning-dark/20';
      default:
        return 'text-content-secondary dark:text-content-darkSecondary bg-background-subtle dark:bg-background-darkSubtle';
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  const isExpiringSoon = (expirationDate?: Date) => {
    if (!expirationDate) return false;
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    return expirationDate <= thirtyDaysFromNow && expirationDate > new Date();
  };

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div
          key={doc.id}
          className="bg-background dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark p-4"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="p-2 bg-background-subtle dark:bg-background-dark rounded">
                <DocumentIcon className="w-6 h-6 text-content-secondary dark:text-content-darkSecondary" />
              </div>
              
              <div>
                <h3 className="font-medium text-content dark:text-content-dark">{doc.name}</h3>
                <div className="mt-1 space-y-1">
                  <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                    Uploaded: {formatDate(doc.uploadedAt)}
                  </p>
                  {doc.expirationDate && (
                    <p className={`text-sm ${
                      isExpiringSoon(doc.expirationDate) 
                        ? 'text-warning dark:text-warning-light' 
                        : 'text-content-secondary dark:text-content-darkSecondary'
                    }`}>
                      Expires: {formatDate(doc.expirationDate)}
                      {isExpiringSoon(doc.expirationDate) && ' (Expiring Soon)'}
                    </p>
                  )}
                </div>
                <div className="mt-2">
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(doc.status)}`}>
                    {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                onClick={() => onView(doc)}
                className="text-content-secondary dark:text-content-darkSecondary hover:text-primary dark:hover:text-primary-light"
              >
                <EyeIcon className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                onClick={() => {
                  const date = prompt('Enter new expiration date (YYYY-MM-DD)');
                  if (date) {
                    const newDate = new Date(date);
                    if (!isNaN(newDate.getTime())) {
                      onUpdateExpiration(doc.id, newDate);
                    }
                  }
                }}
                className="text-content-secondary dark:text-content-darkSecondary hover:text-primary dark:hover:text-primary-light"
              >
                <CalendarIcon className="w-5 h-5" />
              </Button>

              <Button
                variant="ghost"
                onClick={() => onDelete(doc.id)}
                className="text-content-secondary dark:text-content-darkSecondary hover:text-error dark:hover:text-error-light"
              >
                <TrashIcon className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      ))}

      {documents.length === 0 && (
        <div className="text-center py-8 text-content-secondary dark:text-content-darkSecondary">
          <DocumentIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No documents uploaded yet</p>
        </div>
      )}
    </div>
  );
};

export default DocumentList; 