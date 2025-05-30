import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import DocumentVerificationSystem from './documents/DocumentVerificationSystem';

interface ContractorDocumentVerificationProps {
  onBack?: () => void;
}

const ContractorDocumentVerification: React.FC<ContractorDocumentVerificationProps> = ({ onBack }) => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-content-secondary dark:text-content-darkSecondary">
            Please log in to access document verification.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          {onBack && (
            <Button
              variant="ghost"
              onClick={onBack}
              className="mb-4 flex items-center text-content-secondary dark:text-content-darkSecondary hover:text-content dark:hover:text-content-dark"
            >
              <ArrowLeftIcon className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Button>
          )}
          
          <div className="text-center">
            <h1 className="text-3xl font-bold text-content dark:text-content-dark mb-2">
              Document Verification
            </h1>
            <p className="text-lg text-content-secondary dark:text-content-darkSecondary max-w-2xl mx-auto">
              Upload and verify your professional documents to start receiving job assignments on PropAgentic.
            </p>
          </div>
        </div>

        {/* Document Verification System */}
        <DocumentVerificationSystem
          contractorId={currentUser.uid}
          onVerificationComplete={(isVerified) => {
            if (isVerified) {
              // Could trigger a notification or redirect
              console.log('Contractor verification completed successfully');
            }
          }}
        />

        {/* Help Section */}
        <div className="mt-12 bg-background-subtle dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark p-6">
          <h3 className="text-xl font-semibold text-content dark:text-content-dark mb-4">
            Need Help?
          </h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-content dark:text-content-dark mb-2">
                Document Requirements
              </h4>
              <ul className="text-sm text-content-secondary dark:text-content-darkSecondary space-y-1">
                <li>• All documents must be current and not expired</li>
                <li>• Images should be clear and legible</li>
                <li>• Accepted formats: PDF, JPEG, PNG</li>
                <li>• Maximum file size: 10MB per document</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-content dark:text-content-dark mb-2">
                Verification Process
              </h4>
              <ul className="text-sm text-content-secondary dark:text-content-darkSecondary space-y-1">
                <li>• Documents are reviewed within 1-2 business days</li>
                <li>• You'll receive email notifications about status updates</li>
                <li>• Rejected documents can be resubmitted with corrections</li>
                <li>• Contact support if you need assistance</li>
              </ul>
            </div>
          </div>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('mailto:support@propagentic.com', '_blank')}
            >
              Contact Support
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open('/help/document-verification', '_blank')}
            >
              View Help Guide
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorDocumentVerification; 