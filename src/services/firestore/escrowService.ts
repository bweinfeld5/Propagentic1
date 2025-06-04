import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  serverTimestamp,
  onSnapshot,
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';

// Interfaces for Escrow System
export interface EscrowAccount {
  id?: string;
  jobId: string;
  jobTitle: string;
  landlordId: string;
  landlordName: string;
  contractorId: string;
  contractorName: string;
  propertyId: string;
  propertyAddress: string;
  amount: number; // Total escrow amount in dollars
  currency: 'usd';
  status: 'created' | 'funded' | 'pending_release' | 'released' | 'refunded' | 'disputed' | 'cancelled';
  fundingMethod: 'stripe_payment_intent' | 'bank_transfer' | 'credit_card';
  paymentIntentId?: string; // Stripe Payment Intent ID
  holdStartDate: Date;
  releaseConditions: {
    requiresLandlordApproval: boolean;
    requiresContractorConfirmation: boolean;
    autoReleaseAfterDays?: number; // Auto-release after N days if no disputes
    milestoneBasedRelease: boolean;
  };
  milestones?: EscrowMilestone[];
  fees: {
    platformFee: number; // PropAgentic fee
    stripeFee: number; // Stripe processing fee
    totalFees: number;
  };
  disputeId?: string;
  metadata: {
    stripeAccountId?: string;
    paymentMethodId?: string;
    originalBidId?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  fundedAt?: Date;
  releasedAt?: Date;
  refundedAt?: Date;
}

export interface EscrowMilestone {
  id: string;
  title: string;
  description: string;
  amount: number; // Amount to release for this milestone
  percentage: number; // Percentage of total job cost
  status: 'pending' | 'completed' | 'approved' | 'released' | 'disputed';
  dueDate?: Date;
  completedAt?: Date;
  approvedAt?: Date;
  releasedAt?: Date;
  evidence?: {
    photos: string[];
    documents: string[];
    description: string;
  };
  approvalRequired: boolean;
}

export interface EscrowTransaction {
  id?: string;
  escrowAccountId: string;
  type: 'funding' | 'milestone_release' | 'full_release' | 'refund' | 'fee_deduction' | 'dispute_hold';
  amount: number;
  recipient: 'contractor' | 'landlord' | 'platform';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  stripeTransferId?: string;
  stripePaymentIntentId?: string;
  milestoneId?: string;
  description: string;
  metadata: Record<string, any>;
  createdAt: Date;
  processedAt?: Date;
  failureReason?: string;
}

export interface EscrowRelease {
  id?: string;
  escrowAccountId: string;
  requestedBy: string;
  requestedByRole: 'landlord' | 'contractor' | 'admin';
  type: 'milestone' | 'full_release' | 'early_release';
  amount: number;
  milestoneId?: string;
  reason: string;
  evidence?: {
    photos: string[];
    documents: string[];
    description: string;
  };
  status: 'pending' | 'approved' | 'rejected' | 'released';
  approvals: {
    landlordApproved?: boolean;
    landlordApprovedAt?: Date;
    contractorConfirmed?: boolean;
    contractorConfirmedAt?: Date;
    adminApproved?: boolean;
    adminApprovedAt?: Date;
  };
  automaticReleaseAt?: Date;
  createdAt: Date;
  processedAt?: Date;
  rejectionReason?: string;
}

class EscrowService {
  private escrowAccountsRef = collection(db, 'escrowAccounts');
  private escrowTransactionsRef = collection(db, 'escrowTransactions');
  private escrowReleasesRef = collection(db, 'escrowReleases');

  // Create new escrow account for a job
  async createEscrowAccount(escrowData: Omit<EscrowAccount, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const escrowAccount: Omit<EscrowAccount, 'id'> = {
        ...escrowData,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(this.escrowAccountsRef, {
        ...escrowAccount,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        holdStartDate: Timestamp.fromDate(escrowAccount.holdStartDate),
        ...(escrowAccount.milestones && {
          milestones: escrowAccount.milestones.map(m => ({
            ...m,
            ...(m.dueDate && { dueDate: Timestamp.fromDate(m.dueDate) }),
            ...(m.completedAt && { completedAt: Timestamp.fromDate(m.completedAt) }),
            ...(m.approvedAt && { approvedAt: Timestamp.fromDate(m.approvedAt) }),
            ...(m.releasedAt && { releasedAt: Timestamp.fromDate(m.releasedAt) })
          }))
        })
      });

      console.log('Escrow account created:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating escrow account:', error);
      throw error;
    }
  }

  // Get escrow account details
  async getEscrowAccount(escrowAccountId: string): Promise<EscrowAccount | null> {
    try {
      const docSnap = await getDoc(doc(this.escrowAccountsRef, escrowAccountId));
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        holdStartDate: data.holdStartDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        fundedAt: data.fundedAt?.toDate(),
        releasedAt: data.releasedAt?.toDate(),
        refundedAt: data.refundedAt?.toDate(),
        milestones: data.milestones?.map((m: any) => ({
          ...m,
          dueDate: m.dueDate?.toDate(),
          completedAt: m.completedAt?.toDate(),
          approvedAt: m.approvedAt?.toDate(),
          releasedAt: m.releasedAt?.toDate()
        }))
      } as EscrowAccount;
    } catch (error) {
      console.error('Error getting escrow account:', error);
      throw error;
    }
  }

  // Get escrow accounts for a user (landlord or contractor)
  async getEscrowAccountsForUser(userId: string, role: 'landlord' | 'contractor', status?: string): Promise<EscrowAccount[]> {
    try {
      const roleField = role === 'landlord' ? 'landlordId' : 'contractorId';
      let q = query(
        this.escrowAccountsRef,
        where(roleField, '==', userId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(q, where('status', '==', status));
      }

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          holdStartDate: data.holdStartDate?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          fundedAt: data.fundedAt?.toDate(),
          releasedAt: data.releasedAt?.toDate(),
          refundedAt: data.refundedAt?.toDate(),
          milestones: data.milestones?.map((m: any) => ({
            ...m,
            dueDate: m.dueDate?.toDate(),
            completedAt: m.completedAt?.toDate(),
            approvedAt: m.approvedAt?.toDate(),
            releasedAt: m.releasedAt?.toDate()
          }))
        } as EscrowAccount;
      });
    } catch (error) {
      console.error('Error getting escrow accounts:', error);
      throw error;
    }
  }

  // Get escrow account by job ID
  async getEscrowAccountByJobId(jobId: string): Promise<EscrowAccount | null> {
    try {
      const q = query(this.escrowAccountsRef, where('jobId', '==', jobId));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        return null;
      }

      const doc = querySnapshot.docs[0];
      const data = doc.data();
      
      return {
        id: doc.id,
        ...data,
        holdStartDate: data.holdStartDate?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        fundedAt: data.fundedAt?.toDate(),
        releasedAt: data.releasedAt?.toDate(),
        refundedAt: data.refundedAt?.toDate(),
        milestones: data.milestones?.map((m: any) => ({
          ...m,
          dueDate: m.dueDate?.toDate(),
          completedAt: m.completedAt?.toDate(),
          approvedAt: m.approvedAt?.toDate(),
          releasedAt: m.releasedAt?.toDate()
        }))
      } as EscrowAccount;
    } catch (error) {
      console.error('Error getting escrow account by job ID:', error);
      throw error;
    }
  }

  // Update escrow account status
  async updateEscrowStatus(escrowAccountId: string, status: EscrowAccount['status'], metadata?: Record<string, any>): Promise<void> {
    try {
      const updateData: any = {
        status,
        updatedAt: serverTimestamp(),
        ...metadata
      };

      // Add timestamp fields based on status
      if (status === 'funded') {
        updateData.fundedAt = serverTimestamp();
      } else if (status === 'released') {
        updateData.releasedAt = serverTimestamp();
      } else if (status === 'refunded') {
        updateData.refundedAt = serverTimestamp();
      }

      await updateDoc(doc(this.escrowAccountsRef, escrowAccountId), updateData);
    } catch (error) {
      console.error('Error updating escrow status:', error);
      throw error;
    }
  }

  // Update milestone status
  async updateMilestone(escrowAccountId: string, milestoneId: string, updates: Partial<EscrowMilestone>): Promise<void> {
    try {
      const escrowAccount = await this.getEscrowAccount(escrowAccountId);
      if (!escrowAccount || !escrowAccount.milestones) {
        throw new Error('Escrow account or milestones not found');
      }

      const updatedMilestones = escrowAccount.milestones.map(milestone => {
        if (milestone.id === milestoneId) {
          const updatedMilestone = { ...milestone, ...updates };
          
          // Add timestamps based on status
          if (updates.status === 'completed') {
            updatedMilestone.completedAt = new Date();
          } else if (updates.status === 'approved') {
            updatedMilestone.approvedAt = new Date();
          } else if (updates.status === 'released') {
            updatedMilestone.releasedAt = new Date();
          }
          
          return updatedMilestone;
        }
        return milestone;
      });

      await updateDoc(doc(this.escrowAccountsRef, escrowAccountId), {
        milestones: updatedMilestones.map(m => ({
          ...m,
          ...(m.dueDate && { dueDate: Timestamp.fromDate(m.dueDate) }),
          ...(m.completedAt && { completedAt: Timestamp.fromDate(m.completedAt) }),
          ...(m.approvedAt && { approvedAt: Timestamp.fromDate(m.approvedAt) }),
          ...(m.releasedAt && { releasedAt: Timestamp.fromDate(m.releasedAt) })
        })),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating milestone:', error);
      throw error;
    }
  }

  // Create escrow transaction record
  async createEscrowTransaction(transaction: Omit<EscrowTransaction, 'id' | 'createdAt'>): Promise<string> {
    try {
      const transactionData: Omit<EscrowTransaction, 'id'> = {
        ...transaction,
        createdAt: new Date()
      };

      const docRef = await addDoc(this.escrowTransactionsRef, {
        ...transactionData,
        createdAt: serverTimestamp(),
        ...(transactionData.processedAt && { processedAt: Timestamp.fromDate(transactionData.processedAt) })
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating escrow transaction:', error);
      throw error;
    }
  }

  // Get transactions for an escrow account
  async getEscrowTransactions(escrowAccountId: string): Promise<EscrowTransaction[]> {
    try {
      const q = query(
        this.escrowTransactionsRef,
        where('escrowAccountId', '==', escrowAccountId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate()
        } as EscrowTransaction;
      });
    } catch (error) {
      console.error('Error getting escrow transactions:', error);
      throw error;
    }
  }

  // Create release request
  async createReleaseRequest(releaseData: Omit<EscrowRelease, 'id' | 'createdAt'>): Promise<string> {
    try {
      const releaseRequest: Omit<EscrowRelease, 'id'> = {
        ...releaseData,
        createdAt: new Date()
      };

      const docRef = await addDoc(this.escrowReleasesRef, {
        ...releaseRequest,
        createdAt: serverTimestamp(),
        ...(releaseRequest.automaticReleaseAt && { 
          automaticReleaseAt: Timestamp.fromDate(releaseRequest.automaticReleaseAt) 
        }),
        ...(releaseRequest.processedAt && { 
          processedAt: Timestamp.fromDate(releaseRequest.processedAt) 
        }),
        approvals: {
          ...releaseRequest.approvals,
          ...(releaseRequest.approvals.landlordApprovedAt && {
            landlordApprovedAt: Timestamp.fromDate(releaseRequest.approvals.landlordApprovedAt)
          }),
          ...(releaseRequest.approvals.contractorConfirmedAt && {
            contractorConfirmedAt: Timestamp.fromDate(releaseRequest.approvals.contractorConfirmedAt)
          }),
          ...(releaseRequest.approvals.adminApprovedAt && {
            adminApprovedAt: Timestamp.fromDate(releaseRequest.approvals.adminApprovedAt)
          })
        }
      });

      return docRef.id;
    } catch (error) {
      console.error('Error creating release request:', error);
      throw error;
    }
  }

  // Get pending release requests for user approval
  async getPendingReleaseRequests(userId: string, role: 'landlord' | 'contractor'): Promise<EscrowRelease[]> {
    try {
      // First get escrow accounts for the user
      const escrowAccounts = await this.getEscrowAccountsForUser(userId, role);
      const escrowAccountIds = escrowAccounts.map(account => account.id!);

      if (escrowAccountIds.length === 0) {
        return [];
      }

      const q = query(
        this.escrowReleasesRef,
        where('escrowAccountId', 'in', escrowAccountIds),
        where('status', '==', 'pending'),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          processedAt: data.processedAt?.toDate(),
          automaticReleaseAt: data.automaticReleaseAt?.toDate(),
          approvals: {
            ...data.approvals,
            landlordApprovedAt: data.approvals?.landlordApprovedAt?.toDate(),
            contractorConfirmedAt: data.approvals?.contractorConfirmedAt?.toDate(),
            adminApprovedAt: data.approvals?.adminApprovedAt?.toDate()
          }
        } as EscrowRelease;
      });
    } catch (error) {
      console.error('Error getting pending release requests:', error);
      throw error;
    }
  }

  // Approve/reject release request
  async processReleaseRequest(
    releaseId: string, 
    userId: string, 
    role: 'landlord' | 'contractor' | 'admin', 
    action: 'approve' | 'reject',
    rejectionReason?: string
  ): Promise<void> {
    try {
      const updateData: any = {
        updatedAt: serverTimestamp()
      };

      if (action === 'approve') {
        if (role === 'landlord') {
          updateData['approvals.landlordApproved'] = true;
          updateData['approvals.landlordApprovedAt'] = serverTimestamp();
        } else if (role === 'contractor') {
          updateData['approvals.contractorConfirmed'] = true;
          updateData['approvals.contractorConfirmedAt'] = serverTimestamp();
        } else if (role === 'admin') {
          updateData['approvals.adminApproved'] = true;
          updateData['approvals.adminApprovedAt'] = serverTimestamp();
        }
      } else {
        updateData.status = 'rejected';
        updateData.rejectionReason = rejectionReason;
        updateData.processedAt = serverTimestamp();
      }

      await updateDoc(doc(this.escrowReleasesRef, releaseId), updateData);
    } catch (error) {
      console.error('Error processing release request:', error);
      throw error;
    }
  }

  // Subscribe to escrow account changes
  subscribeToEscrowAccount(escrowAccountId: string, callback: (escrowAccount: EscrowAccount | null) => void): () => void {
    return onSnapshot(
      doc(this.escrowAccountsRef, escrowAccountId),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          const escrowAccount: EscrowAccount = {
            id: doc.id,
            ...data,
            holdStartDate: data.holdStartDate?.toDate() || new Date(),
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
            fundedAt: data.fundedAt?.toDate(),
            releasedAt: data.releasedAt?.toDate(),
            refundedAt: data.refundedAt?.toDate(),
            milestones: data.milestones?.map((m: any) => ({
              ...m,
              dueDate: m.dueDate?.toDate(),
              completedAt: m.completedAt?.toDate(),
              approvedAt: m.approvedAt?.toDate(),
              releasedAt: m.releasedAt?.toDate()
            }))
          } as EscrowAccount;
          callback(escrowAccount);
        } else {
          callback(null);
        }
      },
      (error) => {
        console.error('Error in escrow account subscription:', error);
      }
    );
  }

  // Calculate platform fees
  calculateFees(amount: number): { platformFee: number; stripeFee: number; totalFees: number } {
    const platformFeePercentage = 0.05; // 5% platform fee
    const stripeFeePercentage = 0.029; // 2.9% + $0.30
    const stripeFixedFee = 0.30;

    const platformFee = Math.round(amount * platformFeePercentage * 100) / 100;
    const stripeFee = Math.round((amount * stripeFeePercentage + stripeFixedFee) * 100) / 100;
    const totalFees = Math.round((platformFee + stripeFee) * 100) / 100;

    return {
      platformFee,
      stripeFee,
      totalFees
    };
  }

  // Get escrow statistics
  async getEscrowStats(userId: string, role: 'landlord' | 'contractor'): Promise<{
    totalEscrowAccounts: number;
    totalAmountInEscrow: number;
    pendingReleases: number;
    completedReleases: number;
    averageHoldTime: number; // in days
  }> {
    try {
      const escrowAccounts = await this.getEscrowAccountsForUser(userId, role);
      const pendingReleases = await this.getPendingReleaseRequests(userId, role);

      const totalAmountInEscrow = escrowAccounts
        .filter(account => ['funded', 'pending_release'].includes(account.status))
        .reduce((sum, account) => sum + account.amount, 0);

      const completedAccounts = escrowAccounts.filter(account => 
        ['released', 'refunded'].includes(account.status)
      );

      const averageHoldTime = completedAccounts.length > 0
        ? completedAccounts.reduce((sum, account) => {
            const releaseDate = account.releasedAt || account.refundedAt || new Date();
            const holdDays = Math.floor((releaseDate.getTime() - account.holdStartDate.getTime()) / (1000 * 60 * 60 * 24));
            return sum + holdDays;
          }, 0) / completedAccounts.length
        : 0;

      return {
        totalEscrowAccounts: escrowAccounts.length,
        totalAmountInEscrow,
        pendingReleases: pendingReleases.length,
        completedReleases: completedAccounts.length,
        averageHoldTime: Math.round(averageHoldTime)
      };
    } catch (error) {
      console.error('Error getting escrow stats:', error);
      throw error;
    }
  }
}

export const escrowService = new EscrowService(); 