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
  DocumentTextIcon,
  DocumentArrowUpIcon,
  DocumentMagnifyingGlassIcon,
  TrashIcon
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

interface Document {
  id: string;
  name: string;
  type: 'license' | 'insurance' | 'certification' | 'identification' | 'other';
  status: 'pending' | 'approved' | 'rejected';
  uploadDate: Date;
  expiryDate?: Date;
  reviewDate?: Date;
  reviewNotes?: string;
  fileUrl?: string;
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

  const [activeTab, setActiveTab] = useState<'upload' | 'status'>('status');
  const [uploadType, setUploadType] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  
  // Mock documents data
  const [documents, setDocuments] = useState<Document[]>([
    {
      id: '1',
      name: 'Contractor License',
      type: 'license',
      status: 'approved',
      uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30), // 30 days ago
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 335), // 335 days from now
      reviewDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 28), // 28 days ago
      fileUrl: '#'
    },
    {
      id: '2',
      name: 'Liability Insurance',
      type: 'insurance',
      status: 'pending',
      uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 days ago
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180), // 180 days from now
      fileUrl: '#'
    },
    {
      id: '3',
      name: 'Certification',
      type: 'certification',
      status: 'rejected',
      uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5), // 5 days ago
      reviewDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 days ago
      reviewNotes: 'Document is illegible. Please resubmit a clearer copy.',
      fileUrl: '#'
    },
    {
      id: '4',
      name: 'ID Verification',
      type: 'identification',
      status: 'approved',
      uploadDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 60), // 60 days ago
      reviewDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 59), // 59 days ago
      fileUrl: '#'
    }
  ]);
  
  // Document type options
  const documentTypes = [
    { value: 'license', label: 'Contractor License' },
    { value: 'insurance', label: 'Liability Insurance' },
    { value: 'certification', label: 'Professional Certification' },
    { value: 'identification', label: 'ID Verification' },
    { value: 'other', label: 'Other Document' }
  ];

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

  const handleResubmit = (documentId: string) => {
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

  // Handle file selection
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setUploadError(null);
    }
  };
  
  // Handle document upload
  const handleUpload = () => {
    if (!selectedFile || !uploadType) {
      setUploadError('Please select a document type and file');
      return;
    }
    
    setIsUploading(true);
    setUploadError(null);
    
    // Simulate upload delay
    setTimeout(() => {
      // In a real app, this would upload to Firebase Storage
      const newDocument: Document = {
        id: `doc-${Date.now()}`,
        name: documentTypes.find(type => type.value === uploadType)?.label || 'Document',
        type: uploadType as any,
        status: 'pending',
        uploadDate: new Date(),
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        fileUrl: '#'
      };
      
      setDocuments([...documents, newDocument]);
      setSelectedFile(null);
      setUploadType('');
      setExpiryDate('');
      setIsUploading(false);
      setActiveTab('status');
    }, 2000);
  };
  
  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="flex items-center text-green-700 bg-green-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
            <CheckCircleIcon className="w-3 h-3 mr-1" />
            Approved
          </span>
        );
      case 'pending':
        return (
          <span className="flex items-center text-orange-700 bg-orange-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
            <ClockIcon className="w-3 h-3 mr-1" />
            Pending
          </span>
        );
      case 'rejected':
        return (
          <span className="flex items-center text-red-700 bg-red-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
            <XCircleIcon className="w-3 h-3 mr-1" />
            Rejected
          </span>
        );
      default:
        return (
          <span className="flex items-center text-gray-700 bg-gray-100 px-2.5 py-0.5 rounded-full text-xs font-medium">
            Unknown
          </span>
        );
    }
  };
  
  // Get document icon
  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'license':
        return <DocumentCheckIcon className="w-5 h-5 text-blue-600" />;
      case 'insurance':
        return <DocumentCheckIcon className="w-5 h-5 text-purple-600" />;
      case 'certification':
        return <DocumentCheckIcon className="w-5 h-5 text-green-600" />;
      case 'identification':
        return <DocumentMagnifyingGlassIcon className="w-5 h-5 text-orange-600" />;
      default:
        return <DocumentCheckIcon className="w-5 h-5 text-gray-600" />;
    }
  };
  
  // Check verification status
  const getVerificationStatus = () => {
    const requiredDocs = ['license', 'insurance', 'identification'];
    const approvedRequiredDocs = documents.filter(
      doc => requiredDocs.includes(doc.type) && doc.status === 'approved'
    );
    
    if (approvedRequiredDocs.length === requiredDocs.length) {
      return {
        status: 'complete',
        message: 'Verification complete. You are eligible to receive job assignments.',
        icon: CheckCircleIcon,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200'
      };
    } else if (documents.some(doc => doc.status === 'rejected')) {
      return {
        status: 'rejected',
        message: 'One or more documents have been rejected. Please resubmit.',
        icon: ExclamationTriangleIcon,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200'
      };
    } else {
      return {
        status: 'incomplete',
        message: `${approvedRequiredDocs.length}/${requiredDocs.length} required documents verified.`,
        icon: ClockIcon,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200'
      };
    }
  };
  
  const verificationStatus = getVerificationStatus();
  const StatusIcon = verificationStatus.icon;

  return (
    <div className="space-y-6">
      {/* Verification Status */}
      <div className={`${verificationStatus.bgColor} ${verificationStatus.borderColor} border rounded-xl p-4 shadow-md`}>
        <div className="flex items-center">
          <StatusIcon className={`w-6 h-6 ${verificationStatus.color} mr-3`} />
          <div>
            <h3 className={`font-semibold ${verificationStatus.color}`}>Verification Status: {verificationStatus.status}</h3>
            <p className="text-gray-600 text-sm">{verificationStatus.message}</p>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="flex bg-orange-100 rounded-lg p-1">
        <button
          onClick={() => setActiveTab('status')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'status'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Document Status
        </button>
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-all duration-200 ${
            activeTab === 'upload'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Upload Documents
        </button>
      </div>
      
      {/* Content */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-md">
        {activeTab === 'status' ? (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Documents</h3>
            
            {documents.length === 0 ? (
              <div className="text-center py-8">
                <div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                  <DocumentCheckIcon className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="text-gray-500 font-medium">No documents uploaded</h3>
                <p className="text-gray-400 text-sm mt-1">
                  Upload your documents to get verified
                </p>
                <button
                  onClick={() => setActiveTab('upload')}
                  className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg text-sm font-medium hover:bg-orange-700 transition-colors duration-200"
                >
                  Upload Documents
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {documents.map((document) => (
                  <div 
                    key={document.id}
                    className={`border rounded-lg p-4 ${
                      document.status === 'rejected' 
                        ? 'border-red-200 bg-red-50' 
                        : document.status === 'approved'
                          ? 'border-green-200 bg-green-50'
                          : 'border-orange-200 bg-orange-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start">
                        <div className="p-2 bg-white rounded-lg shadow-sm mr-3">
                          {getDocumentIcon(document.type)}
                        </div>
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">{document.name}</h4>
                          <div className="flex items-center mt-1 space-x-2">
                            {getStatusBadge(document.status)}
                            <span className="text-xs text-gray-500">
                              Uploaded: {document.uploadDate.toLocaleDateString()}
                            </span>
                          </div>
                          {document.expiryDate && (
                            <p className="text-xs text-gray-500 mt-1">
                              Expires: {document.expiryDate.toLocaleDateString()}
                            </p>
                          )}
                          {document.reviewNotes && (
                            <div className="mt-2 text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">
                              <p className="font-medium">Review Notes:</p>
                              <p>{document.reviewNotes}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        {document.status === 'rejected' && (
                          <button
                            onClick={() => handleResubmit(document.id)}
                            className="p-1.5 rounded-lg bg-orange-100 text-orange-700 hover:bg-orange-200"
                            aria-label="Resubmit document"
                          >
                            <ArrowPathIcon className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteDocument(document.id)}
                          className="p-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200"
                          aria-label="Delete document"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload New Document</h3>
            
            <div className="space-y-4">
              {/* Document Type */}
              <div>
                <label htmlFor="document-type" className="block text-sm font-medium text-gray-700 mb-1">
                  Document Type
                </label>
                <select
                  id="document-type"
                  value={uploadType}
                  onChange={(e) => setUploadType(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Select document type</option>
                  {documentTypes.map((type) => (
                    <option key={type.value} value={type.value}>
                      {type.label}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* File Upload */}
              <div>
                <label htmlFor="document-file" className="block text-sm font-medium text-gray-700 mb-1">
                  Upload File
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-orange-500 transition-colors duration-200">
                  <input
                    id="document-file"
                    type="file"
                    className="hidden"
                    onChange={handleFileSelect}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                  <label htmlFor="document-file" className="cursor-pointer">
                    <DocumentArrowUpIcon className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-700 mb-1">
                      {selectedFile ? selectedFile.name : 'Click to upload or drag and drop'}
                    </p>
                    <p className="text-xs text-gray-500">
                      PDF, JPG or PNG (max. 10MB)
                    </p>
                  </label>
                </div>
              </div>
              
              {/* Expiry Date */}
              <div>
                <label htmlFor="expiry-date" className="block text-sm font-medium text-gray-700 mb-1">
                  Expiry Date (if applicable)
                </label>
                <input
                  id="expiry-date"
                  type="date"
                  value={expiryDate}
                  onChange={(e) => setExpiryDate(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
              
              {/* Error Message */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {uploadError}
                </div>
              )}
              
              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleUpload}
                  disabled={isUploading || !selectedFile || !uploadType}
                  className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? (
                    <span className="flex items-center">
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Uploading...
                    </span>
                  ) : (
                    'Upload Document'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVerificationSystem; 