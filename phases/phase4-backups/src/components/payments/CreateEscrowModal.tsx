import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  XMarkIcon,
  CreditCardIcon,
  BanknotesIcon,
  PlusIcon,
  MinusIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowLeftIcon,
  ArrowRightIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { escrowService, EscrowMilestone as ServiceEscrowMilestone } from '../../services/firestore/escrowService';
import { paymentService, PaymentMethod } from '../../services/paymentService';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  percentage: number;
  order: number;
}

interface CreateEscrowModalProps {
  isOpen: boolean;
  onClose: () => void;
  jobData?: {
    id: string;
    title: string;
    description: string;
    amount: number;
    contractorId: string;
    contractorName: string;
    propertyId: string;
    propertyAddress: string;
  };
  onEscrowCreated: (escrowId: string) => void;
}

const CreateEscrowModal: React.FC<CreateEscrowModalProps> = ({
  isOpen,
  onClose,
  jobData,
  onEscrowCreated
}) => {
  const { currentUser } = useAuth();
  const [step, setStep] = useState<'details' | 'milestones' | 'payment' | 'confirm'>('details');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  // Form data
  const [formData, setFormData] = useState({
    amount: jobData?.amount || 0,
    autoReleaseAfterDays: 7,
    requiresLandlordApproval: true,
    requiresContractorConfirmation: false,
    enableMilestones: false,
    paymentMethodId: '',
    notes: ''
  });

  const [milestones, setMilestones] = useState<Milestone[]>([]);

  useEffect(() => {
    if (isOpen && currentUser) {
      loadPaymentMethods();
    }
  }, [isOpen, currentUser]);

  const loadPaymentMethods = async () => {
    if (!currentUser) return;
    
    try {
      const response = await paymentService.getPaymentMethods(currentUser.uid);
      setPaymentMethods(response.paymentMethods || []);
      
      // Select default payment method
      const defaultMethod = response.paymentMethods?.find(pm => pm.isDefault);
      if (defaultMethod) {
        setFormData(prev => ({ ...prev, paymentMethodId: defaultMethod.id }));
      }
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError('Failed to load payment methods');
    }
  };

  const addMilestone = () => {
    const newMilestone: Milestone = {
      id: `milestone_${Date.now()}`,
      title: '',
      description: '',
      amount: 0,
      percentage: 0,
      order: milestones.length + 1
    };
    setMilestones([...milestones, newMilestone]);
  };

  const updateMilestone = (id: string, updates: Partial<Milestone>) => {
    setMilestones(prev => 
      prev.map(m => m.id === id ? { ...m, ...updates } : m)
    );
  };

  const removeMilestone = (id: string) => {
    setMilestones(prev => prev.filter(m => m.id !== id));
  };

  const calculateMilestonePercentages = () => {
    const totalAmount = formData.amount;
    setMilestones(prev => 
      prev.map(m => ({
        ...m,
        percentage: totalAmount > 0 ? Math.round((m.amount / totalAmount) * 100) : 0
      }))
    );
  };

  const validateStep = () => {
    switch (step) {
      case 'details':
        return formData.amount > 0 && formData.autoReleaseAfterDays > 0;
      case 'milestones':
        if (!formData.enableMilestones) return true;
        const totalMilestoneAmount = milestones.reduce((sum, m) => sum + m.amount, 0);
        return milestones.length > 0 && Math.abs(totalMilestoneAmount - formData.amount) < 0.01;
      case 'payment':
        return formData.paymentMethodId !== '';
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (!validateStep()) return;
    
    const steps = ['details', 'milestones', 'payment', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1] as any);
    }
  };

  const handleBack = () => {
    const steps = ['details', 'milestones', 'payment', 'confirm'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1] as any);
    }
  };

  const handleSubmit = async () => {
    if (!currentUser || !jobData || !validateStep()) return;

    try {
      setLoading(true);
      setError(null);

      const escrowData = {
        jobId: jobData.id,
        jobTitle: jobData.title,
        landlordId: currentUser.uid,
        landlordName: currentUser.displayName || 'Landlord',
        contractorId: jobData.contractorId,
        contractorName: jobData.contractorName,
        propertyId: jobData.propertyId,
        propertyAddress: jobData.propertyAddress,
        amount: formData.amount,
        currency: 'usd' as const,
        status: 'created' as const,
        fundingMethod: 'stripe_payment_intent' as const,
        holdStartDate: new Date(),
        releaseConditions: {
          requiresLandlordApproval: formData.requiresLandlordApproval,
          requiresContractorConfirmation: formData.requiresContractorConfirmation,
          autoReleaseAfterDays: formData.autoReleaseAfterDays,
          milestoneBasedRelease: formData.enableMilestones
        },
        ...(formData.enableMilestones && {
          milestones: milestones.map(m => ({
            id: m.id,
            title: m.title,
            description: m.description,
            amount: m.amount,
            percentage: m.percentage,
            status: 'pending' as const,
            approvalRequired: false
          }))
        }),
        fees: paymentService.calculateEscrowFees(formData.amount),
        metadata: {
          paymentMethodId: formData.paymentMethodId,
          notes: formData.notes
        }
      };

      const escrowId = await escrowService.createEscrowAccount(escrowData);
      
      // Initiate payment
      await paymentService.createEscrowPayment({
        jobId: jobData?.id || '',
        contractorId: jobData?.contractorId || '',
        amount: formData.amount,
        paymentMethodId: formData.paymentMethodId,
        enableMilestones: formData.enableMilestones,
        milestones: formData.enableMilestones ? milestones.map(m => ({
          title: m.title,
          description: m.description,
          percentage: m.percentage,
          approvalRequired: false
        })) : undefined,
        autoReleaseAfterDays: formData.autoReleaseAfterDays
      });

      onEscrowCreated(escrowId);
      onClose();
    } catch (err) {
      console.error('Error creating escrow:', err);
      setError(err instanceof Error ? err.message : 'Failed to create escrow account');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const fees = paymentService.calculateEscrowFees(formData.amount);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />
        
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full">
          {/* Header */}
          <div className="bg-white px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Create Escrow Account</h3>
                <p className="text-sm text-gray-600">Step {['details', 'milestones', 'payment', 'confirm'].indexOf(step) + 1} of 4</p>
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

            {/* Step 1: Details */}
            {step === 'details' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Escrow Details</h4>
                  <div className="bg-gray-50 p-4 rounded-lg mb-4">
                    <h5 className="font-medium text-gray-900">{jobData?.title}</h5>
                    <p className="text-sm text-gray-600">{jobData?.propertyAddress}</p>
                    <p className="text-sm text-gray-600">Contractor: {jobData?.contractorName}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Escrow Amount
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-gray-500">$</span>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => setFormData(prev => ({ ...prev, amount: Number(e.target.value) }))}
                      className="pl-8 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Auto-release after (days)
                  </label>
                  <input
                    type="number"
                    value={formData.autoReleaseAfterDays}
                    onChange={(e) => setFormData(prev => ({ ...prev, autoReleaseAfterDays: Number(e.target.value) }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    min="1"
                    max="90"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Funds will be automatically released to contractor after this period if not manually released
                  </p>
                </div>

                <div className="space-y-3">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.requiresLandlordApproval}
                      onChange={(e) => setFormData(prev => ({ ...prev, requiresLandlordApproval: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Require landlord approval for release</span>
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.enableMilestones}
                      onChange={(e) => setFormData(prev => ({ ...prev, enableMilestones: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">Enable milestone-based releases</span>
                  </label>
                </div>
              </div>
            )}

            {/* Step 2: Milestones */}
            {step === 'milestones' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-medium text-gray-900">Milestones</h4>
                  {formData.enableMilestones && (
                    <Button onClick={addMilestone} size="sm" variant="outline">
                      <PlusIcon className="w-4 h-4 mr-2" />
                      Add Milestone
                    </Button>
                  )}
                </div>

                {!formData.enableMilestones ? (
                  <div className="text-center py-8">
                    <InformationCircleIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Milestone-based releases are disabled.</p>
                    <p className="text-sm text-gray-500">The full amount will be released at once upon completion.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {milestones.map((milestone, index) => (
                      <div key={milestone.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <h5 className="font-medium text-gray-900">Milestone {index + 1}</h5>
                          <button
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <MinusIcon className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                            <input
                              type="text"
                              value={milestone.title}
                              onChange={(e) => updateMilestone(milestone.id, { title: e.target.value })}
                              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              placeholder="e.g., Demolition Complete"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                            <div className="relative">
                              <span className="absolute left-2 top-2 text-gray-500">$</span>
                              <input
                                type="number"
                                value={milestone.amount}
                                onChange={(e) => {
                                  updateMilestone(milestone.id, { amount: Number(e.target.value) });
                                  calculateMilestonePercentages();
                                }}
                                className="pl-6 w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                min="0"
                                step="0.01"
                              />
                            </div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                          <textarea
                            value={milestone.description}
                            onChange={(e) => updateMilestone(milestone.id, { description: e.target.value })}
                            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={2}
                            placeholder="Describe what needs to be completed for this milestone"
                          />
                        </div>
                      </div>
                    ))}

                    {milestones.length > 0 && (
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <p className="text-sm text-blue-700">
                          Total milestone amount: ${milestones.reduce((sum, m) => sum + m.amount, 0).toFixed(2)} 
                          (Target: ${formData.amount.toFixed(2)})
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 3: Payment */}
            {step === 'payment' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Payment Method</h4>
                
                <div className="space-y-3">
                  {paymentMethods.map((method) => (
                    <label
                      key={method.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-colors ${
                        formData.paymentMethodId === method.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        value={method.id}
                        checked={formData.paymentMethodId === method.id}
                        onChange={(e) => setFormData(prev => ({ ...prev, paymentMethodId: e.target.value }))}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                      <div className="ml-3 flex items-center">
                        <CreditCardIcon className="w-5 h-5 text-gray-400 mr-3" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {method.type === 'card' ? `${method.brand} ****${method.last4}` : `Bank ****${method.last4}`}
                          </p>
                          {method.isDefault && (
                            <span className="text-xs text-blue-600">Default</span>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-medium text-gray-900 mb-2">Fee Breakdown</h5>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Escrow Amount:</span>
                      <span>${formData.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Platform Fee:</span>
                      <span>${fees.platformFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Processing Fee:</span>
                      <span>${fees.stripeFee.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-medium border-t pt-1">
                      <span>Total:</span>
                      <span>${(formData.amount + fees.totalFees).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Confirm */}
            {step === 'confirm' && (
              <div className="space-y-6">
                <h4 className="text-lg font-medium text-gray-900">Confirm Escrow Account</h4>
                
                <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Job:</span>
                    <span>{jobData?.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Contractor:</span>
                    <span>{jobData?.contractorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Amount:</span>
                    <span>${formData.amount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Auto-release:</span>
                    <span>{formData.autoReleaseAfterDays} days</span>
                  </div>
                  {formData.enableMilestones && (
                    <div className="flex justify-between">
                      <span className="font-medium">Milestones:</span>
                      <span>{milestones.length} configured</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="Add any additional notes or instructions"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 py-4 flex justify-between">
            <Button
              variant="outline"
              onClick={step === 'details' ? onClose : handleBack}
              disabled={loading}
            >
              {step === 'details' ? 'Cancel' : 'Back'}
            </Button>
            
            <Button
              variant="primary"
              onClick={step === 'confirm' ? handleSubmit : handleNext}
              disabled={!validateStep() || loading}
            >
              {loading ? 'Creating...' : step === 'confirm' ? 'Create Escrow' : 'Next'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEscrowModal; 