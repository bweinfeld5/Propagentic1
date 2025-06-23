/**
 * Legal Dashboard Component for PropAgentic
 * Comprehensive legal document management and compliance interface
 */

import React, { useState, useEffect } from 'react';
import { 
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ShieldCheckIcon,
  EyeIcon,
  DownloadIcon,
  PencilSquareIcon,
  InformationCircleIcon,
  ScaleIcon,
  ArrowDownTrayIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext.jsx';
import legalManager from '../../services/legal/legalManager';
import Button from '../ui/Button';
import { Tab } from '@headlessui/react';

const LegalDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [legalData, setLegalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState({});
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showDocumentModal, setShowDocumentModal] = useState(false);

  // Load legal compliance data
  useEffect(() => {
    if (currentUser && userProfile) {
      loadLegalData();
    }
  }, [currentUser, userProfile]);

  const loadLegalData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [compliance, acknowledgmentHistory] = await Promise.all([
        legalManager.checkUserCompliance(currentUser.uid),
        legalManager.getUserAcknowledmentHistory(currentUser.uid)
      ]);
      
      setLegalData({ 
        compliance, 
        acknowledgmentHistory,
        requiredDocuments: legalManager.getRequiredDocuments(userProfile.userType)
      });
      
    } catch (error) {
      console.error('Error loading legal data:', error);
      setError('Failed to load legal compliance data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentAcknowledgment = async (documentType) => {
    try {
      setActionLoading({ ...actionLoading, [documentType]: true });
      
      await legalManager.acknowledgeDocument(currentUser.uid, documentType, {
        method: 'electronic',
        ipAddress: 'client_ip', // In production, get real IP
        userAgent: navigator.userAgent
      });
      
      // Reload compliance data
      await loadLegalData();
      
      // Show success message
      alert('Document acknowledged successfully!');
      
    } catch (error) {
      console.error('Error acknowledging document:', error);
      setError('Failed to acknowledge document. Please try again.');
    } finally {
      setActionLoading({ ...actionLoading, [documentType]: false });
    }
  };

  const handleViewDocument = (documentType) => {
    try {
      const document = legalManager.getDocument(documentType);
      setSelectedDocument({
        type: documentType,
        ...document
      });
      setShowDocumentModal(true);
    } catch (error) {
      console.error('Error loading document:', error);
      setError('Failed to load document. Please try again.');
    }
  };

  const handleDownloadDocument = (documentType) => {
    try {
      const document = legalManager.getDocument(documentType);
      const blob = new Blob([document.document], { type: 'text/markdown' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${documentType.replace('_', '-')}-v${document.version}.md`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document. Please try again.');
    }
  };

  const tabs = [
    { id: 'overview', label: 'Compliance Overview', icon: ShieldCheckIcon },
    { id: 'documents', label: 'Legal Documents', icon: DocumentTextIcon },
    { id: 'history', label: 'Acknowledgment History', icon: ClockIcon },
    { id: 'help', label: 'Legal Help', icon: InformationCircleIcon }
  ];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <Button onClick={loadLegalData} variant="outline" size="sm">
                  Try Again
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Legal Dashboard</h1>
        <p className="text-gray-600">
          Manage your legal compliance and review important documents
        </p>
      </div>

      {/* Compliance Status Card */}
      {legalData?.compliance && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
                legalData.compliance.compliant 
                  ? 'bg-green-100 text-green-600'
                  : 'bg-yellow-100 text-yellow-600'
              }`}>
                {legalData.compliance.compliant ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <ExclamationTriangleIcon className="w-6 h-6" />
                )}
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Legal Compliance Status
                </h3>
                <p className="text-sm text-gray-600">
                  {legalData.compliance.compliant 
                    ? 'You are fully compliant with all legal requirements'
                    : `You have ${legalData.compliance.pendingDocuments.length} pending document(s)`
                  }
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {legalData.compliance.complianceScore}%
              </div>
              <div className="text-sm text-gray-500">
                Compliance Score
              </div>
            </div>
          </div>
          
          {/* Pending Documents Alert */}
          {legalData.compliance.pendingDocuments.length > 0 && (
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="text-sm font-medium text-yellow-800 mb-2">
                Action Required
              </h4>
              <div className="space-y-2">
                {legalData.compliance.pendingDocuments.map((doc, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-sm text-yellow-700">
                      {doc.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                    <Button
                      onClick={() => handleViewDocument(doc.type)}
                      size="sm"
                      variant="outline"
                    >
                      Review & Acknowledge
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <ComplianceOverview 
          data={legalData} 
          userType={userProfile?.userType}
          onRefresh={loadLegalData}
        />
      )}

      {activeTab === 'documents' && (
        <LegalDocuments 
          data={legalData}
          userType={userProfile?.userType}
          onViewDocument={handleViewDocument}
          onAcknowledgeDocument={handleDocumentAcknowledgment}
          onDownloadDocument={handleDownloadDocument}
          loading={actionLoading}
        />
      )}

      {activeTab === 'history' && (
        <AcknowledmentHistory 
          data={legalData}
          onRefresh={loadLegalData}
        />
      )}

      {activeTab === 'help' && (
        <LegalHelp userType={userProfile?.userType} />
      )}

      {/* Document Modal */}
      {showDocumentModal && selectedDocument && (
        <DocumentModal
          document={selectedDocument}
          onClose={() => setShowDocumentModal(false)}
          onAcknowledge={handleDocumentAcknowledgment}
          loading={actionLoading[selectedDocument.type]}
        />
      )}
    </div>
  );
};

// Compliance Overview Component
const ComplianceOverview = ({ data, userType, onRefresh }) => {
  if (!data) return null;

  const requiredDocs = data.requiredDocuments;
  const acknowledgedDocs = Object.keys(data.compliance.acknowledgedDocuments || {});
  const pendingDocs = data.compliance.pendingDocuments || [];

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <DocumentTextIcon className="h-8 w-8 text-blue-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Total Documents</h3>
              <p className="text-2xl font-bold text-gray-900">{requiredDocs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <CheckCircleIcon className="h-8 w-8 text-green-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Acknowledged</h3>
              <p className="text-2xl font-bold text-gray-900">{acknowledgedDocs.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-8 w-8 text-yellow-500" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">Pending</h3>
              <p className="text-2xl font-bold text-gray-900">{pendingDocs.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* User Type Information */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Your Account Type: {userType}</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                As a {userType}, you are required to acknowledge specific legal documents 
                to ensure compliance with our terms and applicable laws.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      {data.acknowledgmentHistory && data.acknowledgmentHistory.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Legal Activity</h3>
          <div className="space-y-3">
            {data.acknowledgmentHistory.slice(0, 5).map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {activity.documentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </p>
                  <p className="text-xs text-gray-500">
                    Acknowledged on {new Date(activity.acknowledgedAt?.toDate ? activity.acknowledgedAt.toDate() : activity.acknowledgedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-xs text-gray-500">
                  v{activity.documentVersion}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Legal Documents Component
const LegalDocuments = ({ 
  data, 
  userType, 
  onViewDocument, 
  onAcknowledgeDocument, 
  onDownloadDocument, 
  loading 
}) => {
  if (!data) return null;

  const requiredDocs = data.requiredDocuments;
  const acknowledgedDocs = data.compliance.acknowledgedDocuments || {};

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Required Legal Documents</h3>
        
        <div className="space-y-4">
          {requiredDocs.map((docType) => {
            const isAcknowledged = acknowledgedDocs[docType];
            const document = legalManager.getDocument(docType);
            
            return (
              <div key={docType} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <h4 className="text-base font-medium text-gray-900">
                        {docType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      {isAcknowledged ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-500 ml-2" />
                      ) : (
                        <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 ml-2" />
                      )}
                    </div>
                    
                    <p className="text-sm text-gray-600 mt-1">
                      Version {document.version} • Last updated {new Date(document.lastUpdated).toLocaleDateString()}
                    </p>
                    
                    {isAcknowledged && (
                      <p className="text-xs text-green-600 mt-1">
                        Acknowledged on {new Date(isAcknowledged.acknowledgedAt?.toDate ? isAcknowledged.acknowledgedAt.toDate() : isAcknowledged.acknowledgedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => onViewDocument(docType)}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <EyeIcon className="w-4 h-4 mr-1" />
                      View
                    </Button>
                    
                    <Button
                      onClick={() => onDownloadDocument(docType)}
                      variant="outline"
                      size="sm"
                      className="flex items-center"
                    >
                      <DownloadIcon className="w-4 h-4 mr-1" />
                      Download
                    </Button>
                    
                    {!isAcknowledged && (
                      <Button
                        onClick={() => onAcknowledgeDocument(docType)}
                        disabled={loading[docType]}
                        variant="primary"
                        size="sm"
                        className="flex items-center"
                      >
                        <PencilSquareIcon className="w-4 h-4 mr-1" />
                        {loading[docType] ? 'Processing...' : 'Acknowledge'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Acknowledgment History Component
const AcknowledmentHistory = ({ data, onRefresh }) => {
  if (!data || !data.acknowledgmentHistory) return null;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Document Acknowledgment History</h3>
        
        {data.acknowledgmentHistory.length > 0 ? (
          <div className="space-y-4">
            {data.acknowledgmentHistory.map((record, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">
                      {record.documentType.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-sm text-gray-600">Version {record.documentVersion}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Acknowledged: {new Date(record.acknowledgedAt?.toDate ? record.acknowledgedAt.toDate() : record.acknowledgedAt).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">
                      Method: {record.acknowledgmentMethod}
                    </p>
                  </div>
                  <div className="text-xs text-gray-400">
                    {record.ipAddress && `IP: ${record.ipAddress}`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <ClockIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-sm font-medium text-gray-900">No acknowledgments yet</h3>
            <p className="text-sm text-gray-500">
              Your document acknowledgments will appear here.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Legal Help Component
const LegalHelp = ({ userType }) => {
  const helpContent = {
    landlord: {
      title: "Legal Help for Landlords",
      sections: [
        {
          title: "Required Documents",
          content: "As a landlord, you must acknowledge our Terms of Service, Privacy Policy, and Liability Disclaimer."
        },
        {
          title: "Liability Protection",
          content: "Our liability disclaimer clarifies responsibility boundaries for maintenance work and property management."
        },
        {
          title: "Fair Housing Compliance",
          content: "Ensure all property management activities comply with fair housing laws and regulations."
        }
      ]
    },
    tenant: {
      title: "Legal Help for Tenants",
      sections: [
        {
          title: "Your Rights",
          content: "Our Terms of Service and Privacy Policy outline your rights and our responsibilities as a platform."
        },
        {
          title: "Privacy Protection",
          content: "Review our Privacy Policy to understand how your personal information is collected, used, and protected."
        },
        {
          title: "Platform Usage",
          content: "Learn about acceptable use policies and platform guidelines in our Terms of Service."
        }
      ]
    },
    contractor: {
      title: "Legal Help for Contractors",
      sections: [
        {
          title: "Independent Contractor Agreement",
          content: "This agreement establishes your status as an independent contractor and outlines work requirements."
        },
        {
          title: "Insurance Requirements",
          content: "You must maintain appropriate liability and professional insurance coverage as specified."
        },
        {
          title: "Work Standards",
          content: "All work must meet professional standards and comply with applicable building codes and regulations."
        }
      ]
    }
  };

  const content = helpContent[userType] || helpContent.tenant;

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">{content.title}</h3>
        
        <div className="space-y-6">
          {content.sections.map((section, index) => (
            <div key={index}>
              <h4 className="font-medium text-gray-900 mb-2">{section.title}</h4>
              <p className="text-sm text-gray-600">{section.content}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex">
          <InformationCircleIcon className="h-5 w-5 text-blue-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">Need Legal Assistance?</h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                For specific legal questions or concerns, please contact our legal team at 
                <a href="mailto:legal@propagentic.com" className="font-medium underline ml-1">
                  legal@propagentic.com
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Document Modal Component
const DocumentModal = ({ document, onClose, onAcknowledge, loading }) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
    if (isAtBottom) {
      setHasScrolledToBottom(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={onClose}></div>
        </div>
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-4xl sm:w-full">
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">
                {document.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <span className="sr-only">Close</span>
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div 
              className="max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-4 mb-4"
              onScroll={handleScroll}
            >
              <div className="prose prose-sm max-w-none">
                <pre className="whitespace-pre-wrap text-sm">{document.document}</pre>
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                Version {document.version} • {new Date(document.lastUpdated).toLocaleDateString()}
              </div>
              
              <div className="flex gap-3">
                <Button onClick={onClose} variant="outline">
                  Close
                </Button>
                <Button
                  onClick={() => onAcknowledge(document.type)}
                  disabled={!hasScrolledToBottom || loading}
                  variant="primary"
                >
                  {loading ? 'Processing...' : 'I Acknowledge This Document'}
                </Button>
              </div>
            </div>
            
            {!hasScrolledToBottom && (
              <p className="text-xs text-gray-500 mt-2">
                Please scroll to the bottom of the document to enable acknowledgment.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LegalDashboard; 