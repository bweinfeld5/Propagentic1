import React, { useState, useEffect } from 'react';
import {
  DocumentCheckIcon,
  FunnelIcon,
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  ArrowDownTrayIcon,
  UserIcon,
  CalendarIcon,
  ShieldCheckIcon,
  DocumentMagnifyingGlassIcon,
  BellIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import { useAuth } from '../../context/AuthContext';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  getDocs 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { documentVerificationService, ContractorDocument, VerificationRequest } from '../../services/documentVerificationService';
import toast from 'react-hot-toast';

interface FilterOptions {
  status: 'all' | 'pending' | 'approved' | 'rejected' | 'requires_review';
  priority: 'all' | 'high' | 'medium' | 'low';
  documentType: 'all' | 'license' | 'insurance' | 'identification' | 'certification' | 'other';
  dateRange: 'all' | 'today' | 'week' | 'month';
}

interface VerificationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  requiresReview: number;
  highPriority: number;
}

const DocumentVerificationDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [documents, setDocuments] = useState<ContractorDocument[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<ContractorDocument[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<ContractorDocument | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FilterOptions>({
    status: 'all',
    priority: 'all',
    documentType: 'all',
    dateRange: 'all'
  });
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [stats, setStats] = useState<VerificationStats>({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
    requiresReview: 0,
    highPriority: 0
  });

  // Load verification requests and documents
  useEffect(() => {
    const documentsQuery = query(
      collection(db, 'contractorDocuments'),
      orderBy('uploadedAt', 'desc')
    );

    const unsubscribe = onSnapshot(documentsQuery, (snapshot) => {
      const docs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        uploadedAt: doc.data().uploadedAt?.toDate(),
        expirationDate: doc.data().expirationDate?.toDate(),
        verifiedAt: doc.data().verifiedAt?.toDate()
      })) as ContractorDocument[];

      setDocuments(docs);
      updateStats(docs);
    });

    return () => unsubscribe();
  }, []);

  // Filter and search documents
  useEffect(() => {
    let filtered = documents;

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(doc => doc.verificationStatus === filters.status);
    }

    // Document type filter
    if (filters.documentType !== 'all') {
      filtered = filtered.filter(doc => doc.documentType === filters.documentType);
    }

    // Date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      filtered = filtered.filter(doc => doc.uploadedAt >= filterDate);
    }

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.contractorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.documentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, filters, searchTerm]);

  const updateStats = (docs: ContractorDocument[]) => {
    const stats: VerificationStats = {
      total: docs.length,
      pending: docs.filter(d => d.verificationStatus === 'pending').length,
      approved: docs.filter(d => d.verificationStatus === 'approved').length,
      rejected: docs.filter(d => d.verificationStatus === 'rejected').length,
      requiresReview: docs.filter(d => d.verificationStatus === 'requires_review').length,
      highPriority: docs.filter(d => ['license', 'insurance', 'identification'].includes(d.documentType)).length
    };
    setStats(stats);
  };

  const handleApprove = async (documentId: string) => {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await documentVerificationService.manualVerification(
        documentId,
        true,
        currentUser.uid,
        'Approved by admin'
      );
      toast.success('Document approved successfully');
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async () => {
    if (!selectedDocument || !currentUser || !rejectionReason.trim()) return;
    
    setIsLoading(true);
    try {
      await documentVerificationService.manualVerification(
        selectedDocument.id,
        false,
        currentUser.uid,
        rejectionReason
      );
      toast.success('Document rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedDocument(null);
    } catch (error) {
      console.error('Error rejecting document:', error);
      toast.error('Failed to reject document');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircleIcon className="w-5 h-5 text-green-600" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-red-600" />;
      case 'requires_review':
        return <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />;
      case 'pending':
      default:
        return <ClockIcon className="w-5 h-5 text-yellow-600" />;
    }
  };

  const getPriorityBadge = (documentType: string) => {
    const isHighPriority = ['license', 'insurance', 'identification'].includes(documentType);
    return isHighPriority ? (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
        High Priority
      </span>
    ) : (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Medium Priority
      </span>
    );
  };

  const formatDocumentType = (type: string) => {
    return type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ');
  };

  const exportToCSV = () => {
    const csvData = filteredDocuments.map((doc: ContractorDocument) => ({
      'Document ID': doc.id,
      'Contractor ID': doc.contractorId,
      'Document Type': formatDocumentType(doc.documentType),
      'Status': doc.verificationStatus,
      'Upload Date': doc.uploadedAt.toLocaleDateString(),
      'Verified By': doc.verifiedBy || 'N/A',
      'Verified Date': doc.verifiedAt?.toLocaleDateString() || 'N/A'
    }));

    const csvContent = "data:text/csv;charset=utf-8," 
      + Object.keys(csvData[0]).join(",") + "\n"
      + csvData.map(row => Object.values(row).join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `verification_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <ShieldCheckIcon className="w-8 h-8 text-orange-600 mr-3" />
                Document Verification Dashboard
              </h1>
              <p className="text-sm text-gray-600">
                Review and approve contractor documentation
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={exportToCSV}
                className="flex items-center space-x-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Export Report</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-blue-50">
                <DocumentCheckIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Documents</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-yellow-50">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-green-50">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-red-50">
                <XCircleIcon className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-orange-50">
                <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Needs Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.requiresReview}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="flex items-center">
              <div className="p-3 rounded-lg bg-purple-50">
                <BellIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">High Priority</p>
                <p className="text-2xl font-bold text-gray-900">{stats.highPriority}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value as any})}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="requires_review">Needs Review</option>
              </select>

              <select
                value={filters.documentType}
                onChange={(e) => setFilters({...filters, documentType: e.target.value as any})}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="license">License</option>
                <option value="insurance">Insurance</option>
                <option value="identification">Identification</option>
                <option value="certification">Certification</option>
                <option value="other">Other</option>
              </select>

              <select
                value={filters.dateRange}
                onChange={(e) => setFilters({...filters, dateRange: e.target.value as any})}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
          </div>
        </div>

        {/* Documents Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Document
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contractor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Upload Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((document) => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DocumentMagnifyingGlassIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {document.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            ID: {document.id.slice(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 text-gray-400 mr-2" />
                        <div className="text-sm text-gray-900">
                          {document.contractorId.slice(0, 8)}...
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDocumentType(document.documentType)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(document.verificationStatus)}
                        <StatusPill status={document.verificationStatus} />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getPriorityBadge(document.documentType)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <CalendarIcon className="w-4 h-4 mr-2" />
                        {document.uploadedAt.toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedDocument(document);
                            setShowDocumentModal(true);
                          }}
                        >
                          <EyeIcon className="w-4 h-4" />
                        </Button>
                        
                        {(document.verificationStatus === 'pending' || document.verificationStatus === 'requires_review') && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleApprove(document.id)}
                              disabled={isLoading}
                              className="text-green-600 border-green-200 hover:bg-green-50"
                            >
                              Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedDocument(document);
                                setShowRejectModal(true);
                              }}
                              disabled={isLoading}
                              className="text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <DocumentCheckIcon className="w-12 h-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">
                No documents found matching your criteria
              </p>
            </div>
          )}
        </div>

        {/* Reject Modal */}
        {showRejectModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Reject Document
              </h3>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting "{selectedDocument.name}":
              </p>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={4}
                placeholder="Enter rejection reason..."
              />
              <div className="flex justify-end space-x-3 mt-6">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason('');
                    setSelectedDocument(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReject}
                  disabled={isLoading || !rejectionReason.trim()}
                  className="text-red-600 border-red-200 hover:bg-red-50"
                >
                  {isLoading ? 'Rejecting...' : 'Reject Document'}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Document Modal */}
        {showDocumentModal && selectedDocument && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">
                  Document Details
                </h3>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setShowDocumentModal(false);
                    setSelectedDocument(null);
                  }}
                >
                  ×
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Document Information</h4>
                  <div className="space-y-2 text-sm">
                    <div><span className="font-medium">Name:</span> {selectedDocument.name}</div>
                    <div><span className="font-medium">Type:</span> {formatDocumentType(selectedDocument.documentType)}</div>
                    <div><span className="font-medium">Status:</span> <StatusPill status={selectedDocument.verificationStatus} /></div>
                    <div><span className="font-medium">Upload Date:</span> {selectedDocument.uploadedAt.toLocaleDateString()}</div>
                    {selectedDocument.expirationDate && (
                      <div><span className="font-medium">Expiration:</span> {selectedDocument.expirationDate.toLocaleDateString()}</div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Verification Details</h4>
                  <div className="space-y-2 text-sm">
                    {selectedDocument.verificationResult && (
                      <>
                        <div><span className="font-medium">Confidence:</span> {(selectedDocument.verificationResult.confidence * 100).toFixed(1)}%</div>
                        <div><span className="font-medium">Valid:</span> {selectedDocument.verificationResult.isValid ? 'Yes' : 'No'}</div>
                        {selectedDocument.verificationResult.issues.length > 0 && (
                          <div>
                            <span className="font-medium">Issues:</span>
                            <ul className="list-disc list-inside mt-1">
                              {selectedDocument.verificationResult.issues.map((issue, index) => (
                                <li key={index} className="text-red-600">{issue}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                    {selectedDocument.rejectionReason && (
                      <div><span className="font-medium">Rejection Reason:</span> {selectedDocument.rejectionReason}</div>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <Button
                  onClick={() => window.open(selectedDocument.url, '_blank')}
                  className="flex items-center space-x-2"
                >
                  <EyeIcon className="w-4 h-4" />
                  <span>View Document</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentVerificationDashboard; 