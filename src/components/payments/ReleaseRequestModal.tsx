import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  XMarkIcon,
  PhotoIcon,
  DocumentTextIcon,
  PaperClipIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { escrowService } from '../../services/firestore/escrowService';
import { EscrowAccount as ServiceEscrowAccount, EscrowMilestone } from '../../services/firestore/escrowService';

interface Evidence {
  id: string;
  type: 'photo' | 'document' | 'video';
  file: File;
  title: string;
  description: string;
  preview?: string;
}

interface Milestone extends EscrowMilestone {
  // This already matches the service interface
}

interface EscrowAccount extends ServiceEscrowAccount {
  // Add any additional fields if needed
}

interface ReleaseRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrowAccount: EscrowAccount;
  onRequestCreated: () => void;
}

const ReleaseRequestModal: React.FC<ReleaseRequestModalProps> = ({
  isOpen,
  onClose,
  escrowAccount,
  onRequestCreated
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<'type' | 'details' | 'evidence' | 'confirm'>('type');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form data
  const [releaseType, setReleaseType] = useState<'full' | 'milestone' | 'partial'>('full');
  const [selectedMilestone, setSelectedMilestone] = useState<string>('');
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [workDescription, setWorkDescription] = useState<string>('');
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [additionalNotes, setAdditionalNotes] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setStep('type');
      setReleaseType(escrowAccount.releaseConditions.milestoneBasedRelease ? 'milestone' : 'full');
      setError(null);
      setEvidence([]);
    }
  }, [isOpen, escrowAccount]);

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    Array.from(files).forEach((file) => {
      const newEvidence: Evidence = {
        id: `evidence_${Date.now()}_${Math.random()}`,
        type: file.type.startsWith('image/') ? 'photo' : 'document',
        file,
        title: file.name,
        description: '',
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined
      };

      setEvidence(prev => [...prev, newEvidence]);
    });
  };

  const removeEvidence = (id: string) => {
    setEvidence(prev => {
      const evidenceToRemove = prev.find(e => e.id === id);
      if (evidenceToRemove?.preview) {
        URL.revokeObjectURL(evidenceToRemove.preview);
      }
      return prev.filter(e => e.id !== id);
    });
  };

  const updateEvidence = (id: string, updates: Partial<Evidence>) => {
    setEvidence(prev => 
      prev.map(e => e.id === id ? { ...e, ...updates } : e)
    );
  };

  const validateStep = () => {
    switch (step) {
      case 'type':
        if (releaseType === 'milestone') {
          return selectedMilestone !== '';
        }
        if (releaseType === 'partial') {
          return partialAmount > 0 && partialAmount <= escrowAccount.amount;
        }
        return true;
      case 'details':
        return reason.trim() !== '' && workDescription.trim() !== '';
      case 'evidence':
        return evidence.length > 0 && evidence.every(e => e.title.trim() !== '');
      default:
        return true;
    }
  };

  const getRequestAmount = () => {
    switch (releaseType) {
      case 'milestone':
        const milestone = escrowAccount.milestones?.find(m => m.id === selectedMilestone);
        return milestone?.amount || 0;
      case 'partial':
        return partialAmount;
      case 'full':
      default:
        return escrowAccount.amount;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    const steps = ['type', 'details', 'evidence', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1] as any);
    }
  };

  const handleBack = () => {
    const steps = ['type', 'details', 'evidence', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1] as any);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !validateStep() || !escrowAccount.id) {
      setError('Invalid escrow account or missing information');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Upload evidence files (simulated)
      const evidenceData = evidence.map(e => ({
        type: e.type,
        title: e.title,
        description: e.description,
        fileUrl: `https://storage.demo.com/evidence/${e.id}_${e.file.name}`, // Simulated URL
        fileName: e.file.name,
        fileSize: e.file.size,
        uploadedBy: currentUser.uid,
        uploadedByRole: 'contractor',
        isPublic: true,
        metadata: {
          mimeType: e.file.type
        }
      }));

      const releaseRequest = {
        escrowAccountId: escrowAccount.id,
        requestedBy: currentUser.uid,
        requestedByRole: 'contractor' as const,
        type: releaseType === 'full' ? 'full_release' as const : 
              releaseType === 'milestone' ? 'milestone' as const : 'early_release' as const,
        amount: getRequestAmount(),
        milestoneId: releaseType === 'milestone' ? selectedMilestone : undefined,
        reason: reason,
        evidence: {
          photos: evidence.filter(e => e.type === 'photo').map(e => e.file.name),
          documents: evidence.filter(e => e.type === 'document').map(e => e.file.name),
          description: workDescription
        },
        status: 'pending' as const,
        approvals: {},
        automaticReleaseAt: escrowAccount.releaseConditions.requiresLandlordApproval
          ? undefined
          : escrowAccount.releaseConditions.autoReleaseAfterDays 
            ? new Date(Date.now() + escrowAccount.releaseConditions.autoReleaseAfterDays * 24 * 60 * 60 * 1000)
            : undefined
      };

      await escrowService.createReleaseRequest(releaseRequest);
      
      onRequestCreated();
      onClose();
    } catch (err) {
      console.error('Error creating release request:', err);
      setError(err instanceof Error ? err.message : 'Failed to create release request');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-3xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Request Payment Release</h3>
                <p className="text-sm text-gray-600">
                  Step {['type', 'details', 'evidence', 'confirm'].indexOf(step) + 1} of 4 - {escrowAccount.jobTitle}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4 max-h-96 overflow-y-auto">
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1: Release Type */}
            {step === 'type' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Select Release Type</h4>
                  <div className="space-y-3">
                    <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      releaseType === 'full' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="full"
                        checked={releaseType === 'full'}
                        onChange={(e) => setReleaseType(e.target.value as any)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3">
                        <div className="font-medium text-gray-900">Full Release</div>
                        <div className="text-sm text-gray-600">
                          Request release of the entire escrow amount (${escrowAccount.amount.toLocaleString()})
                        </div>
                      </div>
                    </label>

                    {escrowAccount.releaseConditions.milestoneBasedRelease && 
                     escrowAccount.milestones && escrowAccount.milestones.length > 0 && (
                      <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                        releaseType === 'milestone' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <input
                          type="radio"
                          value="milestone"
                          checked={releaseType === 'milestone'}
                          onChange={(e) => setReleaseType(e.target.value as any)}
                          className="mt-1 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="ml-3 flex-1">
                          <div className="font-medium text-gray-900">Milestone Release</div>
                          <div className="text-sm text-gray-600 mb-3">
                            Request release for a specific completed milestone
                          </div>
                          {releaseType === 'milestone' && (
                            <select
                              value={selectedMilestone}
                              onChange={(e) => setSelectedMilestone(e.target.value)}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="">Select a milestone</option>
                              {escrowAccount.milestones
                                .filter(m => m.status === 'pending')
                                .map(milestone => (
                                <option key={milestone.id} value={milestone.id}>
                                  {milestone.title} - ${milestone.amount.toLocaleString()}
                                </option>
                              ))}
                            </select>
                          )}
                        </div>
                      </label>
                    )}

                    <label className={`flex items-start p-4 border rounded-lg cursor-pointer transition-colors ${
                      releaseType === 'partial' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="partial"
                        checked={releaseType === 'partial'}
                        onChange={(e) => setReleaseType(e.target.value as any)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex-1">
                        <div className="font-medium text-gray-900">Partial Release</div>
                        <div className="text-sm text-gray-600 mb-3">
                          Request release of a specific amount for completed work
                        </div>
                        {releaseType === 'partial' && (
                          <div className="relative">
                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                            <input
                              type="number"
                              value={partialAmount}
                              onChange={(e) => setPartialAmount(Number(e.target.value))}
                              className="pl-8 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              min="0"
                              max={escrowAccount.amount}
                              step="0.01"
                              placeholder="Enter amount"
                            />
                          </div>
                        )}
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {step === 'details' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Work Completion Details</h4>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason for Release Request *
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Work completed successfully, all requirements met"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description of Completed Work *
                  </label>
                  <textarea
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={4}
                    placeholder="Describe the work that has been completed, including any specific details that demonstrate quality and adherence to requirements..."
                  />
                </div>

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <h5 className="font-medium text-blue-900">Release Information</h5>
                      <p className="text-sm text-blue-700 mt-1">
                        Requesting release of ${getRequestAmount().toLocaleString()} from escrow.
                        {escrowAccount.releaseConditions.requiresLandlordApproval && 
                          " This request requires landlord approval."}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Evidence */}
            {step === 'evidence' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Upload Evidence</h4>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <Button variant="outline" size="sm">
                      <PaperClipIcon className="w-4 h-4 mr-2" />
                      Add Files
                    </Button>
                  </label>
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Upload photos or documents to support your release request</p>
                  <p className="text-sm text-gray-500">
                    Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB each)
                  </p>
                  <label className="mt-4 cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                    />
                    <Button variant="outline">
                      Select Files
                    </Button>
                  </label>
                </div>

                {evidence.length > 0 && (
                  <div className="space-y-4">
                    <h5 className="font-medium text-gray-900">Uploaded Evidence</h5>
                    {evidence.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          {item.preview ? (
                            <img
                              src={item.preview}
                              alt={item.title}
                              className="w-16 h-16 object-cover rounded"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                              <DocumentTextIcon className="w-8 h-8 text-gray-400" />
                            </div>
                          )}
                          <div className="flex-1 space-y-2">
                            <input
                              type="text"
                              value={item.title}
                              onChange={(e) => updateEvidence(item.id, { title: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="Evidence title"
                            />
                            <textarea
                              value={item.description}
                              onChange={(e) => updateEvidence(item.id, { description: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={2}
                              placeholder="Description of this evidence"
                            />
                          </div>
                          <button
                            onClick={() => removeEvidence(item.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {evidence.length === 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-yellow-700">
                          Evidence is required to support your release request. Please upload photos or documents
                          showing the completed work.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 'confirm' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Confirm Release Request</h4>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Release Type:</span>
                    <span className="capitalize">{releaseType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Amount:</span>
                    <span className="text-lg font-semibold text-green-600">
                      ${getRequestAmount().toLocaleString()}
                    </span>
                  </div>
                  {selectedMilestone && (
                    <div className="flex justify-between">
                      <span className="font-medium">Milestone:</span>
                      <span>
                        {escrowAccount.milestones?.find(m => m.id === selectedMilestone)?.title}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="font-medium">Evidence Files:</span>
                    <span>{evidence.length} uploaded</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Requires Approval:</span>
                    <span>
                      {escrowAccount.releaseConditions.requiresLandlordApproval ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Additional Notes (Optional)
                  </label>
                  <textarea
                    value={additionalNotes}
                    onChange={(e) => setAdditionalNotes(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Any additional information or special instructions"
                  />
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm text-blue-700">
                        {escrowAccount.releaseConditions.requiresLandlordApproval
                          ? "Your release request will be sent to the landlord for approval. You'll receive a notification when they respond."
                          : `Funds will be automatically released in ${escrowAccount.releaseConditions.autoReleaseAfterDays} days if no action is taken.`
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between">
            <Button
              variant="outline"
              onClick={step === 'type' ? onClose : handleBack}
              disabled={loading}
            >
              {step === 'type' ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              variant="primary"
              onClick={step === 'confirm' ? handleSubmit : handleNext}
              disabled={!validateStep() || loading}
            >
              {loading ? 'Submitting...' : step === 'confirm' ? 'Submit Request' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReleaseRequestModal; 