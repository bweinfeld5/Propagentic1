import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ExclamationTriangleIcon,
  ChatBubbleLeftRightIcon,
  DocumentTextIcon,
  ClockIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  FunnelIcon,
  PlusIcon,
  PaperClipIcon,
  HandRaisedIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import StatusPill from '../ui/StatusPill';
import DisputeStatusPill from '../ui/DisputeStatusPill';
import PriorityStatusPill from '../ui/PriorityStatusPill';
import disputeService, { Dispute, DisputeEvidence, DisputeMessage } from '../../services/firestore/disputeService';

interface SettlementOffer {
  id: string;
  offeredBy: string;
  offeredByRole: 'landlord' | 'contractor';
  offerType: 'monetary' | 'work_completion' | 'partial_refund' | 'additional_work';
  monetaryOffer?: {
    amount: number;
    description: string;
  };
  workOffer?: {
    description: string;
    timeline: string;
    materials: string[];
    noCharge: boolean;
  };
  conditions: string[];
  expiresAt: Date;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  response?: {
    respondedBy: string;
    action: 'accepted' | 'rejected';
    message: string;
    respondedAt: Date;
  };
}

interface DisputeManagerProps {
  userRole: 'landlord' | 'contractor';
}

const DisputeManager: React.FC<DisputeManagerProps> = ({ userRole }) => {
  const { currentUser } = useAuth();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'open' | 'pending_response' | 'resolved'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [messageText, setMessageText] = useState('');
  const [uploadingEvidence, setUploadingEvidence] = useState(false);

  useEffect(() => {
    loadDisputes();
  }, [currentUser, userRole]);

  const loadDisputes = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const disputesData = await disputeService.getDisputesForUser(currentUser.uid, userRole);
      setDisputes(disputesData);
    } catch (error) {
      console.error('Error loading disputes:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-100 text-blue-800';
      case 'in_review':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_mediation':
        return 'bg-purple-100 text-purple-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityStyles = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-800';
      case 'normal':
        return 'bg-blue-100 text-blue-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'urgent':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (filter === 'all') return true;
    if (filter === 'open') return ['open', 'in_review'].includes(dispute.status);
    if (filter === 'pending_response') {
      return dispute.status === 'open' && 
             dispute.initiatedByRole !== userRole && 
             dispute.communications.length === 0;
    }
    if (filter === 'resolved') return ['resolved', 'closed'].includes(dispute.status);
    return true;
  });

  const handleSendMessage = async () => {
    if (!selectedDispute || !selectedDispute.id || !messageText.trim() || !currentUser) return;

    try {
      const message = {
        senderId: currentUser.uid,
        senderRole: userRole,
        senderName: currentUser.displayName || userRole,
        message: messageText,
        type: 'general' as const,
        isPrivate: false,
        attachments: []
      };

      await disputeService.addMessage(selectedDispute.id, message);
      setMessageText('');
      
      // Refresh dispute data
      const updatedDispute = await disputeService.getDispute(selectedDispute.id);
      setSelectedDispute(updatedDispute);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || !selectedDispute || !selectedDispute.id || !currentUser) return;

    try {
      setUploadingEvidence(true);

      for (const file of Array.from(files)) {
        const evidence = {
          type: file.type.startsWith('image/') ? 'photo' as const : 'document' as const,
          title: file.name,
          description: '',
          fileUrl: `https://storage.demo.com/evidence/${selectedDispute.id}_${file.name}`, // Simulated
          uploadedBy: currentUser.uid,
          uploadedByRole: userRole,
          isPublic: true,
          metadata: { mimeType: file.type, fileSize: file.size }
        };

        await disputeService.addEvidence(selectedDispute.id, evidence);
      }

      // Refresh dispute data
      const updatedDispute = await disputeService.getDispute(selectedDispute.id);
      setSelectedDispute(updatedDispute);
    } catch (error) {
      console.error('Error uploading evidence:', error);
    } finally {
      setUploadingEvidence(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dispute Management</h2>
          <p className="text-gray-600">Manage payment and job-related disputes</p>
        </div>
        <Button variant="primary" onClick={() => setShowCreateModal(true)}>
          <ExclamationTriangleIcon className="w-4 h-4 mr-2" />
          Create Dispute
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Disputes List */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow">
            {/* Filters */}
            <div className="p-4 border-b border-gray-200">
              <div className="flex flex-wrap gap-2">
                {[
                  { key: 'all', label: 'All' },
                  { key: 'open', label: 'Open' },
                  { key: 'pending_response', label: 'Pending Response' },
                  { key: 'resolved', label: 'Resolved' }
                ].map((filterOption) => (
                  <button
                    key={filterOption.key}
                    onClick={() => setFilter(filterOption.key as any)}
                    className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                      filter === filterOption.key
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {filterOption.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Disputes List */}
            <div className="max-h-96 overflow-y-auto">
              {filteredDisputes.length === 0 ? (
                <div className="p-8 text-center">
                  <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No disputes found</h3>
                  <p className="text-gray-600">
                    {filter === 'all' 
                      ? 'You don\'t have any disputes yet.'
                      : `No ${filter.replace('_', ' ')} disputes found.`
                    }
                  </p>
                </div>
              ) : (
                filteredDisputes.map((dispute) => (
                  <div
                    key={dispute.id}
                    onClick={() => setSelectedDispute(dispute)}
                    className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedDispute?.id === dispute.id ? 'bg-blue-50 border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900 text-sm">{dispute.title}</h4>
                      <div className="flex gap-1">
                        <DisputeStatusPill
                          status={dispute.status}
                          className={getStatusStyles(dispute.status)}
                        />
                        <PriorityStatusPill
                          status={dispute.priority}
                          className={getPriorityStyles(dispute.priority)}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{dispute.jobTitle}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>
                        {dispute.initiatedByRole === userRole ? 'You' : dispute.initiatedByName}
                      </span>
                      <span>{dispute.createdAt.toLocaleDateString()}</span>
                    </div>
                    {dispute.amountInDispute && dispute.amountInDispute > 0 && (
                      <div className="mt-1 text-sm font-medium text-orange-600">
                        ${dispute.amountInDispute.toLocaleString()} in dispute
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Dispute Details */}
        <div className="lg:col-span-2">
          {selectedDispute ? (
            <div className="bg-white rounded-lg shadow">
              {/* Header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {selectedDispute.title}
                    </h3>
                    <p className="text-gray-600">{selectedDispute.jobTitle}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <DisputeStatusPill
                        status={selectedDispute.status}
                        className={getStatusStyles(selectedDispute.status)}
                      />
                      <PriorityStatusPill
                        status={selectedDispute.priority}
                        className={getPriorityStyles(selectedDispute.priority)}
                      />
                      <span className="text-sm text-gray-500">
                        Created {selectedDispute.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-orange-600">
                      ${selectedDispute.amountInDispute?.toLocaleString() || '0'}
                    </div>
                    <div className="text-sm text-gray-500">in dispute</div>
                  </div>
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                  <p className="text-gray-700">{selectedDispute.description}</p>
                  <div className="mt-2">
                    <span className="font-medium text-gray-700">Desired Outcome: </span>
                    <span className="text-gray-600">{selectedDispute.desiredOutcome}</span>
                  </div>
                </div>
              </div>

              {/* Content Tabs */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  <button className="py-4 text-sm font-medium text-blue-600 border-b-2 border-blue-600">
                    Discussion
                  </button>
                  <button className="py-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Evidence ({selectedDispute.evidence.length})
                  </button>
                  <button className="py-4 text-sm font-medium text-gray-500 hover:text-gray-700">
                    Offers (0)
                  </button>
                </nav>
              </div>

              {/* Discussion */}
              <div className="p-6">
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {selectedDispute.communications.length === 0 ? (
                    <div className="text-center py-8">
                      <ChatBubbleLeftRightIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No messages yet. Start the conversation.</p>
                    </div>
                  ) : (
                    selectedDispute.communications.map((message) => (
                      <div
                        key={message.id}
                        className={`flex items-start gap-3 ${
                          message.senderRole === userRole ? 'flex-row-reverse' : ''
                        }`}
                      >
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div
                          className={`flex-1 max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            message.senderRole === userRole
                              ? 'bg-blue-500 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">
                              {message.senderName}
                            </span>
                            <span className="text-xs opacity-75">
                              {message.timestamp.toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm">{message.message}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Message Input */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <textarea
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      rows={2}
                    />
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={handleSendMessage}
                        disabled={!messageText.trim()}
                        size="sm"
                      >
                        Send
                      </Button>
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          multiple
                          accept="image/*,.pdf,.doc,.docx"
                          onChange={(e) => handleFileUpload(e.target.files)}
                          className="hidden"
                        />
                        <Button variant="outline" size="sm" disabled={uploadingEvidence}>
                          <PaperClipIcon className="w-4 h-4" />
                        </Button>
                      </label>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    {selectedDispute.status === 'open' && selectedDispute.initiatedByRole !== userRole && (
                      <>
                        <Button variant="outline" size="sm">
                          <HandRaisedIcon className="w-4 h-4 mr-2" />
                          Make Offer
                        </Button>
                        <Button variant="outline" size="sm">
                          Request Mediation
                        </Button>
                      </>
                    )}
                    {selectedDispute.status === 'open' && selectedDispute.initiatedByRole === userRole && (
                      <Button variant="outline" size="sm">
                        Close Dispute
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow p-8 text-center">
              <ExclamationTriangleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Select a dispute</h3>
              <p className="text-gray-600">Choose a dispute from the list to view details and manage it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DisputeManager; 