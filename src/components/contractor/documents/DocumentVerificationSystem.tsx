import React, { useState, useEffect } from 'react';
import { 
  DocumentCheckIcon, 
  ExclamationTriangleIcon, 
  ClockIcon, 
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  ArrowPathIcon,
  ShieldCheckIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import Button from '../../ui/Button';
import FileUpload from './FileUpload';
import DocumentList from './DocumentList';
import { useAuth } from '../../../context/AuthContext';
import { doc, updateDoc, collection, addDoc, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase/config';
import toast from 'react-hot-toast';

interface RequiredDocument {
  id: string;
  name: string;
  description: string;
  type: 'license' | 'certification' | 'insurance' | 'identification' | 'other';
  required: boolean;
  hasExpiration: boolean;
  verificationStatus: 'pending' | 'approved' | 'rejected' | 'not_submitted';
  uploadedDocument?: UploadedDocument;
}

interface UploadedDocument {
  id: string;
  name: string;
  type: string;
  url: string;
  uploadedAt: Date;
  expirationDate?: Date;
  status: 'active' | 'expired' | 'pending';
  verificationStatus: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
  verifiedBy?: string;
  verifiedAt?: Date;
}

interface VerificationSystemProps {
  contractorId: string;
  onVerificationComplete?: (isVerified: boolean) => void;
}

const DocumentVerificationSystem: React.FC<VerificationSystemProps> = ({
  contractorId,
  onVerificationComplete
}) => {
  const { currentUser } = useAuth();
  const [requiredDocuments, setRequiredDocuments] = useState<RequiredDocument[]>([
    {
      id: 'business_license',
      name: 'Business License',
      description: 'Valid business license or contractor license',
      type: 'license',
      required: true,
      hasExpiration: true,
      verificationStatus: 'not_submitted'
    },
    {
      id: 'liability_insurance',
      name: 'Liability Insurance',
      description: 'General liability insurance certificate',
      type: 'insurance',
      required: true,
      hasExpiration: true,
      verificationStatus: 'not_submitted'
    },
    {
      id: 'workers_comp',
      name: 'Workers Compensation',
      description: 'Workers compensation insurance (if applicable)',
      type: 'insurance',
      required: false,
      hasExpiration: true,
      verificationStatus: 'not_submitted'
    },
    {
      id: 'government_id',
      name: 'Government ID',
      description: 'Driver\'s license or state-issued ID',
      type: 'identification',
      required: true,
      hasExpiration: true,
      verificationStatus: 'not_submitted'
    },
    {
      id: 'trade_certification',
      name: 'Trade Certification',
      description: 'Relevant trade certifications or qualifications',
      type: 'certification',
      required: false,
      hasExpiration: true,
      verificationStatus: 'not_submitted'
    }
  ]);

  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [overallVerificationStatus, setOverallVerificationStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');

  // Load contractor documents
  useEffect(() => {
    if (!contractorId) return;

    const documentsQuery = query(
      collection(db, 'contractorDocuments'),
      where('contractorId', '==', contractorId)
    );

    const unsubscribe = onSnapshot(documentsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate(),
        expirationDate: doc.data().expirationDate?.toDate(),
        verifiedAt: doc.data().verifiedAt?.toDate()
      })) as UploadedDocument[];

      setUploadedDocuments(docs);
      updateRequiredDocumentsStatus(docs);
    });

    return () => unsubscribe();
  }, [contractorId]);

  const updateRequiredDocumentsStatus = (docs: UploadedDocument[]) => {
    setRequiredDocuments(prev => prev.map(reqDoc => {
      const uploadedDoc = docs.find(doc => doc.type === reqDoc.type);
      return {
        ...reqDoc,
        verificationStatus: uploadedDoc?.verificationStatus || 'not_submitted',
        uploadedDocument: uploadedDoc
      };
    }));
  };

  const handleFileUpload = async (url: string, metadata: any, documentType: string) => {
    try {
      setIsLoading(true);
      
      const docData = {
        contractorId,
        name: metadata.name,
        type: documentType,
        url,
        uploadedAt: new Date(),
        expirationDate: metadata.expirationDate || null,
        status: 'active',
        verificationStatus: 'pending',
        fileSize: metadata.size,
        fileType: metadata.type
      };

      await addDoc(collection(db, 'contractorDocuments'), docData);
      
      // Create verification request
      await addDoc(collection(db, 'verificationRequests'), {
        contractorId,
        documentType,
        documentUrl: url,
        requestedAt: new Date(),
        status: 'pending',
        priority: getDocumentPriority(documentType)
      });

      toast.success('Document uploaded successfully and sent for verification');
      setSelectedDocumentType('');
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
    } finally {
      setIsLoading(false);
    }
  };

  const getDocumentPriority = (documentType: string): 'high' | 'medium' | 'low' => {
    const highPriority = ['business_license', 'liability_insurance', 'government_id'];
    return highPriority.includes(documentType) ? 'high' : 'medium';
  };

  const handleUploadError = (error: string) => {
    toast.error(error);
  };

  const getVerificationStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-error" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-warning" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-content-secondary" />;
    }
  };

  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'text-success bg-success/10 border-success/20';
      case 'rejected':
        return 'text-error bg-error/10 border-error/20';
      case 'pending':
        return 'text-warning bg-warning/10 border-warning/20';
      default:
        return 'text-content-secondary bg-background-subtle border-border';
    }
  };

  const calculateCompletionPercentage = () => {
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    const approvedDocs = requiredDocs.filter(doc => doc.verificationStatus === 'approved');
    return Math.round((approvedDocs.length / requiredDocs.length) * 100);
  };

  const isFullyVerified = () => {
    const requiredDocs = requiredDocuments.filter(doc => doc.required);
    return requiredDocs.every(doc => doc.verificationStatus === 'approved');
  };

  const handleResubmitDocument = (documentId: string) => {
    // Logic to allow resubmission of rejected documents
    setSelectedDocumentType(documentId);
  };

  const handleViewDocument = (document: UploadedDocument) => {
    window.open(document.url, '_blank');
  };

  const handleDeleteDocument = async (documentId: string) => {
    try {
      await updateDoc(doc(db, 'contractorDocuments', documentId), {
        status: 'deleted',
        deletedAt: new Date()
      });
      toast.success('Document deleted successfully');
    } catch (error) {
      console.error('Error deleting document:', error);
      toast.error('Failed to delete document');
    }
  };

  return (
    <div className="space-y-8">
      {/* Verification Status Overview */}
      <div className="bg-background dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <ShieldCheckIcon className="w-8 h-8 text-primary" />
            <div>
              <h2 className="text-2xl font-bold text-content dark:text-content-dark">
                Document Verification
              </h2>
              <p className="text-content-secondary dark:text-content-darkSecondary">
                Complete verification to start receiving jobs
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              {calculateCompletionPercentage()}%
            </div>
            <div className="text-sm text-content-secondary dark:text-content-darkSecondary">
              Complete
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-background-subtle dark:bg-background-dark rounded-full h-3 mb-4">
          <div
            className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-500"
            style={{ width: `${calculateCompletionPercentage()}%` }}
          />
        </div>

        {isFullyVerified() && (
          <div className="bg-success/10 border border-success/20 rounded-lg p-4 flex items-center space-x-3">
            <CheckCircleIcon className="w-6 h-6 text-success" />
            <div>
              <p className="font-medium text-success">Verification Complete!</p>
              <p className="text-sm text-success/80">
                You're now eligible to receive job assignments
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Required Documents Checklist */}
      <div className="bg-background dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark p-6">
        <h3 className="text-xl font-semibold text-content dark:text-content-dark mb-6 flex items-center">
          <DocumentCheckIcon className="w-6 h-6 mr-2" />
          Required Documents
        </h3>

        <div className="space-y-4">
          {requiredDocuments.map((reqDoc) => (
            <div
              key={reqDoc.id}
              className={`border rounded-lg p-4 transition-all duration-200 ${getVerificationStatusColor(reqDoc.verificationStatus)}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4">
                  <div className="mt-1">
                    {getVerificationStatusIcon(reqDoc.verificationStatus)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h4 className="font-medium text-content dark:text-content-dark">
                        {reqDoc.name}
                      </h4>
                      {reqDoc.required && (
                        <span className="text-xs bg-error/20 text-error px-2 py-1 rounded">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-content-secondary dark:text-content-darkSecondary mt-1">
                      {reqDoc.description}
                    </p>
                    
                    {reqDoc.uploadedDocument && (
                      <div className="mt-2 space-y-1">
                        <p className="text-sm text-content dark:text-content-dark">
                          Uploaded: {reqDoc.uploadedDocument.name}
                        </p>
                        {reqDoc.uploadedDocument.expirationDate && (
                          <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                            Expires: {reqDoc.uploadedDocument.expirationDate.toLocaleDateString()}
                          </p>
                        )}
                        {reqDoc.verificationStatus === 'rejected' && reqDoc.uploadedDocument.rejectionReason && (
                          <p className="text-sm text-error bg-error/10 p-2 rounded">
                            Rejection reason: {reqDoc.uploadedDocument.rejectionReason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {reqDoc.uploadedDocument && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewDocument(reqDoc.uploadedDocument!)}
                    >
                      <EyeIcon className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {(reqDoc.verificationStatus === 'not_submitted' || reqDoc.verificationStatus === 'rejected') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDocumentType(reqDoc.id)}
                    >
                      {reqDoc.verificationStatus === 'rejected' ? (
                        <>
                          <ArrowPathIcon className="w-4 h-4 mr-1" />
                          Resubmit
                        </>
                      ) : (
                        'Upload'
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* File Upload Section */}
      {selectedDocumentType && (
        <div className="bg-background dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-content dark:text-content-dark">
              Upload Document: {requiredDocuments.find(d => d.id === selectedDocumentType)?.name}
            </h3>
            <Button
              variant="ghost"
              onClick={() => setSelectedDocumentType('')}
            >
              Cancel
            </Button>
          </div>
          
          <FileUpload
            onUploadComplete={(url, metadata) => handleFileUpload(url, metadata, selectedDocumentType)}
            onUploadError={handleUploadError}
            userId={contractorId}
            documentType={selectedDocumentType as any}
            allowedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
            maxFileSize={10 * 1024 * 1024} // 10MB
          />
        </div>
      )}

      {/* Uploaded Documents List */}
      {uploadedDocuments.length > 0 && (
        <div className="bg-background dark:bg-background-darkSubtle rounded-xl border border-border dark:border-border-dark p-6">
          <h3 className="text-xl font-semibold text-content dark:text-content-dark mb-6 flex items-center">
            <DocumentTextIcon className="w-6 h-6 mr-2" />
            All Documents
          </h3>
          
          <DocumentList
            documents={uploadedDocuments.map(doc => ({
              id: doc.id,
              name: doc.name,
              type: doc.type,
              url: doc.url,
              uploadedAt: doc.uploadedAt,
              expirationDate: doc.expirationDate,
              status: doc.status
            }))}
            onDelete={handleDeleteDocument}
            onView={(document) => handleViewDocument(uploadedDocuments.find(d => d.id === document.id)!)}
            onUpdateExpiration={(docId, date) => {
              // Handle expiration date update
              updateDoc(doc(db, 'contractorDocuments', docId), {
                expirationDate: date
              });
            }}
          />
        </div>
      )}

      {/* Verification Tips */}
      <div className="bg-info/10 border border-info/20 rounded-lg p-4">
        <h4 className="font-medium text-info mb-2">Verification Tips</h4>
        <ul className="text-sm text-info/80 space-y-1">
          <li>• Ensure all documents are clear and legible</li>
          <li>• Upload documents in PDF, JPEG, or PNG format</li>
          <li>• Make sure documents are current and not expired</li>
          <li>• Verification typically takes 1-2 business days</li>
          <li>• You'll receive email notifications about verification status</li>
        </ul>
      </div>
    </div>
  );
};

export default DocumentVerificationSystem; 