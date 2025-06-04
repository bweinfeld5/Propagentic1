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
  CalendarIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
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
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

interface VerificationRequest {
  id: string;
  contractorId: string;
  contractorName: string;
  contractorEmail: string;
  documentType: string;
  documentUrl: string;
  documentName: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  priority: 'high' | 'medium' | 'low';
  verifiedBy?: string;
  verifiedAt?: Date;
  rejectionReason?: string;
  fileSize?: number;
  fileType?: string;
}

interface FilterOptions {
  status: string;
  priority: string;
  documentType: string;
  dateRange: string;
}

const DocumentVerificationDashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [verificationRequests, setVerificationRequests] = useState<VerificationRequest[]>([]);
  const [filteredRequests, setFilteredRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
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

  // Load verification requests
  useEffect(() => {
    const requestsQuery = query(
      collection(db, 'verificationRequests'),
      orderBy('requestedAt', 'desc')
    );

    const unsubscribe = onSnapshot(requestsQuery, async (snapshot) => {
      const requests = await Promise.all(
        snapshot.docs.map(async (docSnapshot) => {
          const data = docSnapshot.data();
          
          // Get contractor info
          const contractorDoc = await doc(db, 'users', data.contractorId);
          // Note: In a real app, you'd fetch this data properly
          
          return {
            id: docSnapshot.id,
            ...data,
            requestedAt: data.requestedAt?.toDate(),
            verifiedAt: data.verifiedAt?.toDate(),
            contractorName: data.contractorName || 'Unknown',
            contractorEmail: data.contractorEmail || 'Unknown'
          } as VerificationRequest;
        })
      );

      setVerificationRequests(requests);
    });

    return () => unsubscribe();
  }, []);

  // Apply filters and search
  useEffect(() => {
    let filtered = verificationRequests;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(request =>
        request.contractorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.contractorEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.documentType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filters.status !== 'all') {
      filtered = filtered.filter(request => request.status === filters.status);
    }

    // Priority filter
    if (filters.priority !== 'all') {
      filtered = filtered.filter(request => request.priority === filters.priority);
    }

    // Document type filter
    if (filters.documentType !== 'all') {
      filtered = filtered.filter(request => request.documentType === filters.documentType);
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
      
      if (filters.dateRange !== 'all') {
        filtered = filtered.filter(request => request.requestedAt >= filterDate);
      }
    }

    setFilteredRequests(filtered);
  }, [verificationRequests, searchTerm, filters]);

  const handleApprove = async (requestId: string) => {
    try {
      setIsLoading(true);
      
      const request = verificationRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update verification request
      await updateDoc(doc(db, 'verificationRequests', requestId), {
        status: 'approved',
        verifiedBy: currentUser?.uid,
        verifiedAt: serverTimestamp()
      });

      // Update contractor document
      const contractorDocsQuery = query(
        collection(db, 'contractorDocuments'),
        where('contractorId', '==', request.contractorId),
        where('type', '==', request.documentType)
      );

      // Note: In a real implementation, you'd properly handle the document update
      
      // Create audit log
      await addDoc(collection(db, 'verificationAuditLog'), {
        requestId,
        contractorId: request.contractorId,
        action: 'approved',
        performedBy: currentUser?.uid,
        performedAt: serverTimestamp(),
        documentType: request.documentType
      });

      toast.success('Document approved successfully');
    } catch (error) {
      console.error('Error approving document:', error);
      toast.error('Failed to approve document');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (requestId: string, reason: string) => {
    try {
      setIsLoading(true);
      
      const request = verificationRequests.find(r => r.id === requestId);
      if (!request) return;

      // Update verification request
      await updateDoc(doc(db, 'verificationRequests', requestId), {
        status: 'rejected',
        verifiedBy: currentUser?.uid,
        verifiedAt: serverTimestamp(),
        rejectionReason: reason
      });

      // Update contractor document
      // Note: In a real implementation, you'd properly handle the document update

      // Create audit log
      await addDoc(collection(db, 'verificationAuditLog'), {
        requestId,
        contractorId: request.contractorId,
        action: 'rejected',
        performedBy: currentUser?.uid,
        performedAt: serverTimestamp(),
        documentType: request.documentType,
        rejectionReason: reason
      });

      toast.success('Document rejected');
      setShowRejectModal(false);
      setRejectionReason('');
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
        return <CheckCircleIcon className="w-5 h-5 text-success" />;
      case 'rejected':
        return <XCircleIcon className="w-5 h-5 text-error" />;
      case 'pending':
        return <ClockIcon className="w-5 h-5 text-warning" />;
      default:
        return <ExclamationTriangleIcon className="w-5 h-5 text-content-secondary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-error/10 text-error border-error/20';
      case 'medium':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'low':
        return 'bg-info/10 text-info border-info/20';
      default:
        return 'bg-background-subtle text-content-secondary border-border';
    }
  };

  const formatDocumentType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  const getStats = () => {
    const total = verificationRequests.length;
    const pending = verificationRequests.filter(r => r.status === 'pending').length;
    const approved = verificationRequests.filter(r => r.status === 'approved').length;
    const rejected = verificationRequests.filter(r => r.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-content dark:text-content-dark">
            Document Verification
          </h1>
          <p className="text-content-secondary dark:text-content-darkSecondary">
            Review and verify contractor documents
          </p>
        </div>
        <Button variant="outline">
          <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-background dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary">Total Requests</p>
              <p className="text-2xl font-bold text-content dark:text-content-dark">{stats.total}</p>
            </div>
            <DocumentCheckIcon className="w-8 h-8 text-primary" />
          </div>
        </div>
        
        <div className="bg-background dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary">Pending</p>
              <p className="text-2xl font-bold text-warning">{stats.pending}</p>
            </div>
            <ClockIcon className="w-8 h-8 text-warning" />
          </div>
        </div>
        
        <div className="bg-background dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary">Approved</p>
              <p className="text-2xl font-bold text-success">{stats.approved}</p>
            </div>
            <CheckCircleIcon className="w-8 h-8 text-success" />
          </div>
        </div>
        
        <div className="bg-background dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary">Rejected</p>
              <p className="text-2xl font-bold text-error">{stats.rejected}</p>
            </div>
            <XCircleIcon className="w-8 h-8 text-error" />
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-background dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-content-secondary dark:text-content-darkSecondary" />
              <input
                type="text"
                placeholder="Search by contractor name, email, or document type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-content dark:text-content-dark focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
              className="px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-content dark:text-content-dark"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={filters.priority}
              onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              className="px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-content dark:text-content-dark"
            >
              <option value="all">All Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filters.documentType}
              onChange={(e) => setFilters(prev => ({ ...prev, documentType: e.target.value }))}
              className="px-3 py-2 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-content dark:text-content-dark"
            >
              <option value="all">All Types</option>
              <option value="business_license">Business License</option>
              <option value="liability_insurance">Liability Insurance</option>
              <option value="government_id">Government ID</option>
              <option value="trade_certification">Trade Certification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Verification Requests Table */}
      <div className="bg-background dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-background-subtle dark:bg-background-dark">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                  Contractor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                  Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                  Submitted
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border dark:divide-border-dark">
              {filteredRequests.map((request) => (
                <tr key={request.id} className="hover:bg-background-subtle dark:hover:bg-background-dark">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <UserIcon className="w-8 h-8 text-content-secondary dark:text-content-darkSecondary mr-3" />
                      <div>
                        <div className="text-sm font-medium text-content dark:text-content-dark">
                          {request.contractorName}
                        </div>
                        <div className="text-sm text-content-secondary dark:text-content-darkSecondary">
                          {request.contractorEmail}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-content dark:text-content-dark">
                      {formatDocumentType(request.documentType)}
                    </div>
                    <div className="text-sm text-content-secondary dark:text-content-darkSecondary">
                      {request.documentName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(request.priority)}`}>
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(request.status)}
                      <span className="ml-2 text-sm text-content dark:text-content-dark">
                        {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary dark:text-content-darkSecondary">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1" />
                      {request.requestedAt.toLocaleDateString()}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => window.open(request.documentUrl, '_blank')}
                      >
                        <EyeIcon className="w-4 h-4" />
                      </Button>
                      
                      {request.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleApprove(request.id)}
                            disabled={isLoading}
                            className="text-success border-success hover:bg-success/10"
                          >
                            Approve
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedRequest(request);
                              setShowRejectModal(true);
                            }}
                            disabled={isLoading}
                            className="text-error border-error hover:bg-error/10"
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
            <DocumentCheckIcon className="w-12 h-12 mx-auto text-content-secondary dark:text-content-darkSecondary mb-4" />
            <p className="text-content-secondary dark:text-content-darkSecondary">
              No verification requests found
            </p>
          </div>
        )}
      </div>

      {/* Rejection Modal */}
      {showRejectModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-background dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-content dark:text-content-dark mb-4">
              Reject Document
            </h3>
            <p className="text-content-secondary dark:text-content-darkSecondary mb-4">
              Please provide a reason for rejecting this document:
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows={4}
              className="w-full p-3 border border-border dark:border-border-dark rounded-lg bg-background dark:bg-background-dark text-content dark:text-content-dark resize-none"
            />
            <div className="flex justify-end space-x-3 mt-4">
              <Button
                variant="ghost"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => handleReject(selectedRequest.id, rejectionReason)}
                disabled={!rejectionReason.trim() || isLoading}
                className="bg-error hover:bg-error/90"
              >
                Reject Document
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentVerificationDashboard; 