import { callFunction } from '../firebase/config';

// Type definitions for Stripe responses
export interface StripeAccountStatus {
  isEnabled: boolean;
  needsOnboarding: boolean;
  needsRefresh: boolean;
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

  // Payment processing functions
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
  }
}; 