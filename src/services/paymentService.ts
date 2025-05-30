import { callFunction } from '../firebase/config';

// Type definitions for Stripe responses
export interface StripeAccountStatus {
  isEnabled: boolean;
  needsOnboarding: boolean;
  needsRefresh: boolean;
  accountId?: string;
  capabilities?: {
    card_payments?: string;
    transfers?: string;
  };
  requirements?: {
    currently_due: string[];
    eventually_due: string[];
    past_due: string[];
  };
}

export interface BankAccount {
  last4: string;
  bankName: string;
  status: 'new' | 'verified' | 'verification_failed' | 'verification_pending';
}

export interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand?: string;
  bankName?: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
}

export interface ContractorPayment {
  id: string;
  jobId: string;
  contractorId: string;
  landlordId: string;
  totalAmount: number;
  contractorAmount: number;
  platformFee: number;
  currency: string;
  status: string;
  description: string;
  createdAt: any;
}

export interface ContractorEarnings {
  timeframe: string;
  totalEarnings: number;
  totalJobs: number;
  averagePerJob: number;
  completedPayments: number;
  pendingPayments: number;
  escrowHeld: number;
}

// Enhanced interfaces for Phase 1.4
export interface EscrowPaymentRequest {
  jobId: string;
  contractorId: string;
  amount: number;
  paymentMethodId: string;
  enableMilestones?: boolean;
  milestones?: EscrowMilestone[];
  autoReleaseAfterDays?: number;
}

export interface EscrowMilestone {
  title: string;
  description: string;
  percentage: number;
  dueDate?: Date;
  approvalRequired?: boolean;
}

export interface EscrowPaymentResponse {
  escrowAccountId: string;
  paymentIntent: {
    id: string;
    client_secret: string;
    status: string;
  };
  amount: number;
  fees: {
    platformFee: number;
    stripeFee: number;
    totalFees: number;
  };
  requiresAction: boolean;
  nextAction?: any;
}

export interface EscrowReleaseRequest {
  escrowAccountId: string;
  amount?: number;
  milestoneId?: string;
  reason?: string;
}

export interface DisputeCreationRequest {
  type: 'payment' | 'job_quality' | 'job_completion' | 'contract_terms' | 'communication' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  respondentId: string;
  respondentRole: 'landlord' | 'tenant' | 'contractor';
  jobId?: string;
  escrowAccountId?: string;
  propertyId?: string;
  title: string;
  description: string;
  category: string;
  amountInDispute?: number;
  desiredOutcome: string;
  evidence?: DisputeEvidenceInput[];
  tags?: string[];
}

export interface DisputeEvidenceInput {
  type: 'photo' | 'document' | 'video' | 'audio' | 'text' | 'invoice' | 'contract';
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  isPublic?: boolean;
}

// Payment service functions
export const paymentService = {
  // Stripe Connect functions
  async createAccountLink(userId: string, returnUrl: string, refreshUrl: string): Promise<{ accountLinkUrl: string }> {
    return await callFunction('createStripeAccountLink', {
      userId,
      returnUrl,
      refreshUrl
    }) as { accountLinkUrl: string };
  },

  async getAccountStatus(userId: string): Promise<StripeAccountStatus> {
    return await callFunction('getStripeAccountStatus', {
      userId
    }) as StripeAccountStatus;
  },

  async refreshAccount(userId: string, returnUrl: string, refreshUrl: string): Promise<{ accountLinkUrl: string }> {
    return await callFunction('refreshStripeAccount', {
      userId,
      returnUrl,
      refreshUrl
    }) as { accountLinkUrl: string };
  },

  // Enhanced Stripe Connect Express onboarding
  async createExpressAccount(userId: string, userInfo: {
    email: string;
    firstName: string;
    lastName: string;
    businessType?: 'individual' | 'company';
    country?: string;
  }): Promise<{ accountId: string; accountLinkUrl: string }> {
    return await callFunction('createStripeExpressAccount', {
      userId,
      ...userInfo
    }) as { accountId: string; accountLinkUrl: string };
  },

  async getExpressDashboardLink(userId: string): Promise<{ dashboardUrl: string }> {
    return await callFunction('getStripeExpressDashboard', {
      userId
    }) as { dashboardUrl: string };
  },

  // Bank account functions
  async createBankAccountSetupLink(userId: string, returnUrl: string, refreshUrl: string): Promise<{ setupUrl: string }> {
    return await callFunction('createBankAccountSetupLink', {
      userId,
      returnUrl,
      refreshUrl
    }) as { setupUrl: string };
  },

  async getBankAccountStatus(userId: string): Promise<{ bankAccount: BankAccount | null }> {
    return await callFunction('getStripeBankAccountStatus', {
      userId
    }) as { bankAccount: BankAccount | null };
  },

  async verifyMicroDeposits(userId: string, amounts: number[]): Promise<{ success: boolean }> {
    return await callFunction('verifyBankAccountMicroDeposits', {
      userId,
      amounts
    }) as { success: boolean };
  },

  // Payment method functions
  async getPaymentMethods(userId: string): Promise<{ paymentMethods: PaymentMethod[] }> {
    return await callFunction('getStripePaymentMethods', {
      userId
    }) as { paymentMethods: PaymentMethod[] };
  },

  async createSetupIntent(userId: string): Promise<{ clientSecret: string }> {
    return await callFunction('createSetupIntent', {
      userId
    }) as { clientSecret: string };
  },

  async setDefaultPaymentMethod(userId: string, paymentMethodId: string): Promise<{ success: boolean }> {
    return await callFunction('setDefaultPaymentMethod', {
      userId,
      paymentMethodId
    }) as { success: boolean };
  },

  async removePaymentMethod(userId: string, paymentMethodId: string): Promise<{ success: boolean }> {
    return await callFunction('removePaymentMethod', {
      userId,
      paymentMethodId
    }) as { success: boolean };
  },

  // Enhanced escrow payment functions
  async createEscrowPayment(request: EscrowPaymentRequest): Promise<EscrowPaymentResponse> {
    return await callFunction('createEscrowPayment', request) as EscrowPaymentResponse;
  },

  async confirmEscrowPayment(paymentIntentId: string, escrowAccountId: string): Promise<{
    paymentIntent: { id: string; status: string };
    requiresAction: boolean;
    nextAction?: any;
  }> {
    return await callFunction('confirmEscrowPayment', {
      paymentIntentId,
      escrowAccountId
    }) as {
      paymentIntent: { id: string; status: string };
      requiresAction: boolean;
      nextAction?: any;
    };
  },

  async releaseEscrowFunds(request: EscrowReleaseRequest): Promise<{
    success: boolean;
    transferId: string;
    releasedAmount: number;
    milestoneId?: string;
    escrowStatus: string;
  }> {
    return await callFunction('releaseEscrowFunds', request) as {
      success: boolean;
      transferId: string;
      releasedAmount: number;
      milestoneId?: string;
      escrowStatus: string;
    };
  },

  async refundEscrowFunds(escrowAccountId: string, amount?: number, reason?: string): Promise<{
    success: boolean;
    refundId: string;
    refundedAmount: number;
    refundStatus: string;
  }> {
    return await callFunction('refundEscrowFunds', {
      escrowAccountId,
      amount,
      reason
    }) as {
      success: boolean;
      refundId: string;
      refundedAmount: number;
      refundStatus: string;
    };
  },

  async getEscrowAccount(escrowAccountId: string): Promise<any> {
    return await callFunction('getEscrowAccount', {
      escrowAccountId
    }) as any;
  },

  // Enhanced payment processing functions
  async createJobPayment(jobId: string, contractorId: string, amount: number, description?: string): Promise<{
    paymentId: string;
    transferId: string;
    contractorAmount: number;
    platformFee: number;
  }> {
    return await callFunction('createJobPayment', {
      jobId,
      contractorId,
      amount,
      description
    }) as {
      paymentId: string;
      transferId: string;
      contractorAmount: number;
      platformFee: number;
    };
  },

  async createMilestonePayment(escrowAccountId: string, milestoneId: string, amount: number): Promise<{
    success: boolean;
    transferId: string;
    milestoneId: string;
  }> {
    return await callFunction('createMilestonePayment', {
      escrowAccountId,
      milestoneId,
      amount
    }) as {
      success: boolean;
      transferId: string;
      milestoneId: string;
    };
  },

  async getContractorPayments(contractorId: string, limit = 20, startAfter?: string): Promise<{ payments: ContractorPayment[] }> {
    return await callFunction('getContractorPayments', {
      contractorId,
      limit,
      startAfter
    }) as { payments: ContractorPayment[] };
  },

  async getPaymentDetails(paymentId: string): Promise<ContractorPayment & { stripeDetails?: any }> {
    return await callFunction('getPaymentDetails', {
      paymentId
    }) as ContractorPayment & { stripeDetails?: any };
  },

  async getContractorEarnings(contractorId: string, timeframe = 'month'): Promise<ContractorEarnings> {
    return await callFunction('getContractorEarnings', {
      contractorId,
      timeframe
    }) as ContractorEarnings;
  },

  async refundPayment(paymentId: string, reason?: string): Promise<{ success: boolean; reversalId: string }> {
    return await callFunction('refundPayment', {
      paymentId,
      reason
    }) as { success: boolean; reversalId: string };
  },

  // Dispute handling functions
  async createDispute(request: DisputeCreationRequest): Promise<{ disputeId: string }> {
    return await callFunction('createDispute', request) as { disputeId: string };
  },

  async getDispute(disputeId: string): Promise<any> {
    return await callFunction('getDispute', { disputeId }) as any;
  },

  async getUserDisputes(userId: string, role: 'landlord' | 'contractor', status?: string): Promise<{ disputes: any[] }> {
    return await callFunction('getUserDisputes', {
      userId,
      role,
      status
    }) as { disputes: any[] };
  },

  async addDisputeEvidence(disputeId: string, evidence: DisputeEvidenceInput): Promise<{ success: boolean }> {
    return await callFunction('addDisputeEvidence', {
      disputeId,
      evidence
    }) as { success: boolean };
  },

  async addDisputeMessage(disputeId: string, message: {
    message: string;
    type?: 'general' | 'offer' | 'counter_offer' | 'clarification' | 'evidence_request';
    isPrivate?: boolean;
    attachments?: any[];
  }): Promise<{ success: boolean }> {
    return await callFunction('addDisputeMessage', {
      disputeId,
      ...message
    }) as { success: boolean };
  },

  async createDisputeOffer(disputeId: string, offer: {
    offerType: 'financial' | 'work_completion' | 'partial_refund' | 'credit' | 'replacement' | 'other';
    financialOffer?: {
      amount: number;
      description: string;
      paymentMethod: 'escrow_release' | 'direct_payment' | 'credit' | 'refund';
    };
    workOffer?: {
      description: string;
      timeline: string;
      materials?: string[];
      noCharge: boolean;
    };
    conditions?: string[];
    expiresAt?: Date;
  }): Promise<{ offerId: string }> {
    return await callFunction('createDisputeOffer', {
      disputeId,
      ...offer
    }) as { offerId: string };
  },

  async respondToDisputeOffer(offerId: string, disputeId: string, response: 'accepted' | 'rejected', responseMessage?: string): Promise<{ success: boolean }> {
    return await callFunction('respondToDisputeOffer', {
      offerId,
      disputeId,
      response,
      responseMessage
    }) as { success: boolean };
  },

  async requestMediation(disputeId: string, reason?: string): Promise<{ success: boolean; sessionId: string }> {
    return await callFunction('requestMediation', {
      disputeId,
      reason
    }) as { success: boolean; sessionId: string };
  },

  async resolveDispute(disputeId: string, resolution: {
    type: 'settlement' | 'ruling' | 'withdrawal' | 'escalation';
    outcome: string;
    financialAdjustment?: {
      amount: number;
      direction: 'to_landlord' | 'to_contractor' | 'held_in_escrow' | 'refunded';
      reason: string;
    };
    workAdjustment?: {
      additionalWork: boolean;
      workDescription?: string;
      timeline?: string;
      noChargeWork?: boolean;
    };
    futureActions?: string[];
    binding: boolean;
    enforcementDeadline?: Date;
    notes?: string;
  }): Promise<{ success: boolean }> {
    return await callFunction('resolveDispute', {
      disputeId,
      resolution
    }) as { success: boolean };
  },

  async getDisputeStats(userId?: string, role?: 'landlord' | 'contractor'): Promise<{
    totalDisputes: number;
    openDisputes: number;
    inMediationDisputes: number;
    resolvedDisputes: number;
    escalatedDisputes: number;
    averageResolutionTime: number;
    resolutionRate: number;
    disputesByType: Record<string, number>;
    disputesByPriority: Record<string, number>;
  }> {
    return await callFunction('getDisputeStats', {
      userId,
      role
    }) as {
      totalDisputes: number;
      openDisputes: number;
      inMediationDisputes: number;
      resolvedDisputes: number;
      escalatedDisputes: number;
      averageResolutionTime: number;
      resolutionRate: number;
      disputesByType: Record<string, number>;
      disputesByPriority: Record<string, number>;
    };
  },

  // Payment analytics and reporting
  async getPaymentAnalytics(userId: string, role: 'landlord' | 'contractor', dateRange: {
    startDate: Date;
    endDate: Date;
  }): Promise<{
    totalTransactions: number;
    totalVolume: number;
    averageTransactionSize: number;
    escrowHeld: number;
    disputedAmount: number;
    successRate: number;
    monthlyTrends: Array<{
      month: string;
      volume: number;
      transactions: number;
      disputes: number;
    }>;
  }> {
    return await callFunction('getPaymentAnalytics', {
      userId,
      role,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString()
    }) as {
      totalTransactions: number;
      totalVolume: number;
      averageTransactionSize: number;
      escrowHeld: number;
      disputedAmount: number;
      successRate: number;
      monthlyTrends: Array<{
        month: string;
        volume: number;
        transactions: number;
        disputes: number;
      }>;
    };
  },

  async exportPaymentData(userId: string, role: 'landlord' | 'contractor', format: 'csv' | 'pdf', dateRange: {
    startDate: Date;
    endDate: Date;
  }): Promise<{ downloadUrl: string; fileName: string }> {
    return await callFunction('exportPaymentData', {
      userId,
      role,
      format,
      startDate: dateRange.startDate.toISOString(),
      endDate: dateRange.endDate.toISOString()
    }) as { downloadUrl: string; fileName: string };
  },

  // Fee calculation utilities
  calculateEscrowFees(amount: number): {
    platformFee: number;
    stripeFee: number;
    totalFees: number;
    netAmount: number;
  } {
    const platformFeePercentage = 0.05; // 5%
    const stripeFeePercentage = 0.029; // 2.9% + $0.30
    const stripeFixedFee = 0.30;

    const platformFee = Math.round(amount * platformFeePercentage * 100) / 100;
    const stripeFee = Math.round((amount * stripeFeePercentage + stripeFixedFee) * 100) / 100;
    const totalFees = Math.round((platformFee + stripeFee) * 100) / 100;
    const netAmount = Math.round((amount - totalFees) * 100) / 100;

    return {
      platformFee,
      stripeFee,
      totalFees,
      netAmount
    };
  },

  // Webhook handling for payment events
  async handleStripeWebhook(webhookData: {
    type: string;
    data: any;
  }): Promise<{ success: boolean }> {
    return await callFunction('handleStripeWebhook', webhookData) as { success: boolean };
  },

  // Compliance and verification
  async verifyContractorIdentity(contractorId: string, identityData: {
    documentType: 'license' | 'passport' | 'id_card';
    documentNumber: string;
    documentUrl: string;
    selfieUrl?: string;
  }): Promise<{
    success: boolean;
    verificationId: string;
    status: 'pending' | 'verified' | 'failed';
  }> {
    return await callFunction('verifyContractorIdentity', {
      contractorId,
      ...identityData
    }) as {
      success: boolean;
      verificationId: string;
      status: 'pending' | 'verified' | 'failed';
    };
  },

  async getPaymentCompliance(userId: string): Promise<{
    kycStatus: 'pending' | 'verified' | 'failed';
    amlStatus: 'pending' | 'verified' | 'flagged';
    paymentLimits: {
      daily: number;
      monthly: number;
      annual: number;
    };
    riskScore: number;
    requiresAdditionalVerification: boolean;
  }> {
    return await callFunction('getPaymentCompliance', { userId }) as {
      kycStatus: 'pending' | 'verified' | 'failed';
      amlStatus: 'pending' | 'verified' | 'flagged';
      paymentLimits: {
        daily: number;
        monthly: number;
        annual: number;
      };
      riskScore: number;
      requiresAdditionalVerification: boolean;
    };
  }
}; 