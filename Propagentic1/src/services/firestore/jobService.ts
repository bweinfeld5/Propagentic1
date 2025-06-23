import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  writeBatch,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export interface Job {
  id?: string;
  title: string;
  description: string;
  category: 'plumbing' | 'electrical' | 'hvac' | 'general_maintenance' | 'cleaning' | 'landscaping' | 'painting' | 'carpentry' | 'other';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';
  propertyId: string;
  propertyName: string;
  propertyAddress: string;
  landlordId: string;
  landlordName: string;
  assignedContractorId?: string;
  assignedContractorName?: string;
  estimatedBudget?: {
    min: number;
    max: number;
  };
  actualCost?: number;
  estimatedDuration?: string; // e.g., "2-3 hours", "1 day", "1 week"
  scheduledDate?: Date;
  completedDate?: Date;
  deadline?: Date;
  images?: string[];
  attachments?: {
    name: string;
    url: string;
    type: string;
    size: number;
  }[];
  requirements?: string[];
  location?: {
    unit?: string;
    specificLocation: string; // e.g., "Kitchen sink", "Living room"
  };
  tags?: string[];
  isEmergency: boolean;
  createdAt: Date;
  updatedAt: Date;
  metadata?: Record<string, any>;
}

export interface Bid {
  id?: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  contractorCompany?: string;
  contractorRating?: number;
  amount: number;
  estimatedDuration: string;
  description: string;
  proposedStartDate: Date;
  materials?: {
    name: string;
    cost: number;
    quantity: number;
  }[];
  laborCost: number;
  materialsCost: number;
  totalCost: number;
  warranty?: {
    duration: string;
    description: string;
  };
  portfolio?: {
    imageUrls: string[];
    description: string;
  };
  status: 'pending' | 'accepted' | 'rejected' | 'withdrawn';
  submittedAt: Date;
  respondedAt?: Date;
  notes?: string;
  metadata?: Record<string, any>;
}

export interface JobUpdate {
  id?: string;
  jobId: string;
  contractorId: string;
  contractorName: string;
  type: 'progress' | 'completion' | 'issue' | 'material_request' | 'schedule_change';
  title: string;
  description: string;
  progress?: {
    percentage: number;
    milestonesCompleted: string[];
    nextSteps: string[];
    estimatedCompletion: Date;
  };
  images?: string[];
  timeSpent?: number; // hours
  materialsUsed?: {
    name: string;
    quantity: number;
    cost: number;
  }[];
  issues?: {
    description: string;
    severity: 'low' | 'medium' | 'high';
    resolution?: string;
  }[];
  requestApproval?: {
    description: string;
    estimatedCost: number;
    urgent: boolean;
  };
  rating?: {
    quality: number;
    timeliness: number;
    communication: number;
    overall: number;
    comments?: string;
  };
  timestamp: Date;
  isRead: boolean;
  metadata?: Record<string, any>;
}

export interface ContractorProfile {
  id?: string;
  userId: string;
  companyName?: string;
  businessLicense?: string;
  insurance?: {
    provider: string;
    policyNumber: string;
    expirationDate: Date;
    amount: number;
  };
  specialties: string[];
  serviceAreas: string[];
  availability: {
    monday: { available: boolean; hours?: string };
    tuesday: { available: boolean; hours?: string };
    wednesday: { available: boolean; hours?: string };
    thursday: { available: boolean; hours?: string };
    friday: { available: boolean; hours?: string };
    saturday: { available: boolean; hours?: string };
    sunday: { available: boolean; hours?: string };
  };
  emergencyAvailable: boolean;
  pricing: {
    hourlyRate?: number;
    minimumCharge?: number;
    emergencyRate?: number;
    travelFee?: number;
  };
  portfolio: {
    images: string[];
    description: string;
    completedJobs: number;
  };
  ratings: {
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: {
      5: number;
      4: number;
      3: number;
      2: number;
      1: number;
    };
  };
  verificationStatus: {
    identity: boolean;
    license: boolean;
    insurance: boolean;
    background: boolean;
  };
  contactPreferences: {
    phone: boolean;
    email: boolean;
    app: boolean;
    sms: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

class JobService {
  private jobsRef = collection(db, 'jobs');
  private bidsRef = collection(db, 'bids');
  private jobUpdatesRef = collection(db, 'jobUpdates');
  private contractorProfilesRef = collection(db, 'contractorProfiles');

  // ========== JOB MANAGEMENT ==========

  async createJob(job: Omit<Job, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const jobData = {
        ...job,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.jobsRef, jobData);
      console.log('Job created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async getJob(jobId: string): Promise<Job | null> {
    try {
      const docRef = doc(this.jobsRef, jobId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
          createdAt: docSnap.data().createdAt?.toDate(),
          updatedAt: docSnap.data().updatedAt?.toDate(),
          scheduledDate: docSnap.data().scheduledDate?.toDate(),
          completedDate: docSnap.data().completedDate?.toDate(),
          deadline: docSnap.data().deadline?.toDate()
        } as Job;
      }
      return null;
    } catch (error) {
      console.error('Error getting job:', error);
      throw error;
    }
  }

  async getJobsForLandlord(landlordId: string, status?: string): Promise<Job[]> {
    try {
      let q = query(
        this.jobsRef,
        where('landlordId', '==', landlordId),
        orderBy('createdAt', 'desc')
      );

      if (status) {
        q = query(
          this.jobsRef,
          where('landlordId', '==', landlordId),
          where('status', '==', status),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        scheduledDate: doc.data().scheduledDate?.toDate(),
        completedDate: doc.data().completedDate?.toDate(),
        deadline: doc.data().deadline?.toDate()
      } as Job));
    } catch (error) {
      console.error('Error getting jobs for landlord:', error);
      throw error;
    }
  }

  async getAvailableJobs(contractorId: string, category?: string, location?: string): Promise<Job[]> {
    try {
      let q = query(
        this.jobsRef,
        where('status', '==', 'open'),
        orderBy('createdAt', 'desc')
      );

      if (category) {
        q = query(
          this.jobsRef,
          where('status', '==', 'open'),
          where('category', '==', category),
          orderBy('createdAt', 'desc')
        );
      }

      const snapshot = await getDocs(q);
      let jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        scheduledDate: doc.data().scheduledDate?.toDate(),
        completedDate: doc.data().completedDate?.toDate(),
        deadline: doc.data().deadline?.toDate()
      } as Job));

      // Filter out jobs where contractor already bid
      const contractorBids = await this.getBidsForContractor(contractorId);
      const bidJobIds = contractorBids.map(bid => bid.jobId);
      jobs = jobs.filter(job => !bidJobIds.includes(job.id!));

      return jobs;
    } catch (error) {
      console.error('Error getting available jobs:', error);
      throw error;
    }
  }

  async getJobsForContractor(contractorId: string): Promise<Job[]> {
    try {
      const q = query(
        this.jobsRef,
        where('assignedContractorId', '==', contractorId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        scheduledDate: doc.data().scheduledDate?.toDate(),
        completedDate: doc.data().completedDate?.toDate(),
        deadline: doc.data().deadline?.toDate()
      } as Job));
    } catch (error) {
      console.error('Error getting jobs for contractor:', error);
      throw error;
    }
  }

  async updateJob(jobId: string, updates: Partial<Job>): Promise<void> {
    try {
      const jobRef = doc(this.jobsRef, jobId);
      await updateDoc(jobRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating job:', error);
      throw error;
    }
  }

  subscribeToJobs(landlordId: string, callback: (jobs: Job[]) => void): () => void {
    const q = query(
      this.jobsRef,
      where('landlordId', '==', landlordId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const jobs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        scheduledDate: doc.data().scheduledDate?.toDate(),
        completedDate: doc.data().completedDate?.toDate(),
        deadline: doc.data().deadline?.toDate()
      } as Job));
      callback(jobs);
    });
  }

  // ========== BID MANAGEMENT ==========

  async createBid(bid: Omit<Bid, 'id' | 'submittedAt'>): Promise<string> {
    try {
      const bidData = {
        ...bid,
        submittedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.bidsRef, bidData);
      console.log('Bid created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating bid:', error);
      throw error;
    }
  }

  async getBidsForJob(jobId: string): Promise<Bid[]> {
    try {
      const q = query(
        this.bidsRef,
        where('jobId', '==', jobId),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        respondedAt: doc.data().respondedAt?.toDate(),
        proposedStartDate: doc.data().proposedStartDate?.toDate()
      } as Bid));
    } catch (error) {
      console.error('Error getting bids for job:', error);
      throw error;
    }
  }

  async getBidsForContractor(contractorId: string): Promise<Bid[]> {
    try {
      const q = query(
        this.bidsRef,
        where('contractorId', '==', contractorId),
        orderBy('submittedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        submittedAt: doc.data().submittedAt?.toDate(),
        respondedAt: doc.data().respondedAt?.toDate(),
        proposedStartDate: doc.data().proposedStartDate?.toDate()
      } as Bid));
    } catch (error) {
      console.error('Error getting bids for contractor:', error);
      throw error;
    }
  }

  async acceptBid(bidId: string, jobId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Update the accepted bid
      const bidRef = doc(this.bidsRef, bidId);
      const bidDoc = await getDoc(bidRef);
      
      if (!bidDoc.exists()) {
        throw new Error('Bid not found');
      }

      const bidData = bidDoc.data() as Bid;
      
      batch.update(bidRef, {
        status: 'accepted',
        respondedAt: serverTimestamp()
      });

      // Update job with contractor assignment
      const jobRef = doc(this.jobsRef, jobId);
      batch.update(jobRef, {
        status: 'assigned',
        assignedContractorId: bidData.contractorId,
        assignedContractorName: bidData.contractorName,
        actualCost: bidData.totalCost,
        scheduledDate: bidData.proposedStartDate,
        updatedAt: serverTimestamp()
      });

      // Reject all other bids for this job
      const otherBidsQuery = query(
        this.bidsRef,
        where('jobId', '==', jobId),
        where('status', '==', 'pending')
      );
      
      const otherBidsSnapshot = await getDocs(otherBidsQuery);
      otherBidsSnapshot.docs.forEach(doc => {
        if (doc.id !== bidId) {
          batch.update(doc.ref, {
            status: 'rejected',
            respondedAt: serverTimestamp()
          });
        }
      });

      await batch.commit();
    } catch (error) {
      console.error('Error accepting bid:', error);
      throw error;
    }
  }

  async rejectBid(bidId: string, reason?: string): Promise<void> {
    try {
      const bidRef = doc(this.bidsRef, bidId);
      await updateDoc(bidRef, {
        status: 'rejected',
        respondedAt: serverTimestamp(),
        ...(reason && { notes: reason })
      });
    } catch (error) {
      console.error('Error rejecting bid:', error);
      throw error;
    }
  }

  // ========== JOB UPDATES ==========

  async createJobUpdate(update: Omit<JobUpdate, 'id' | 'timestamp' | 'isRead'>): Promise<string> {
    try {
      const updateData = {
        ...update,
        timestamp: serverTimestamp(),
        isRead: false
      };

      const docRef = await addDoc(this.jobUpdatesRef, updateData);
      console.log('Job update created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating job update:', error);
      throw error;
    }
  }

  async getJobUpdates(jobId: string): Promise<JobUpdate[]> {
    try {
      const q = query(
        this.jobUpdatesRef,
        where('jobId', '==', jobId),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
        progress: doc.data().progress ? {
          ...doc.data().progress,
          estimatedCompletion: doc.data().progress.estimatedCompletion?.toDate()
        } : undefined
      } as JobUpdate));
    } catch (error) {
      console.error('Error getting job updates:', error);
      throw error;
    }
  }

  subscribeToJobUpdates(jobId: string, callback: (updates: JobUpdate[]) => void): () => void {
    const q = query(
      this.jobUpdatesRef,
      where('jobId', '==', jobId),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const updates = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate(),
        progress: doc.data().progress ? {
          ...doc.data().progress,
          estimatedCompletion: doc.data().progress.estimatedCompletion?.toDate()
        } : undefined
      } as JobUpdate));
      callback(updates);
    });
  }

  async markUpdateAsRead(updateId: string): Promise<void> {
    try {
      const updateRef = doc(this.jobUpdatesRef, updateId);
      await updateDoc(updateRef, {
        isRead: true
      });
    } catch (error) {
      console.error('Error marking update as read:', error);
      throw error;
    }
  }

  // ========== CONTRACTOR PROFILE MANAGEMENT ==========

  async createContractorProfile(profile: Omit<ContractorProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
      const profileData = {
        ...profile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(this.contractorProfilesRef, profileData);
      console.log('Contractor profile created with ID:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Error creating contractor profile:', error);
      throw error;
    }
  }

  async getContractorProfile(userId: string): Promise<ContractorProfile | null> {
    try {
      const q = query(
        this.contractorProfilesRef,
        where('userId', '==', userId)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      return {
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        insurance: doc.data().insurance ? {
          ...doc.data().insurance,
          expirationDate: doc.data().insurance.expirationDate?.toDate()
        } : undefined
      } as ContractorProfile;
    } catch (error) {
      console.error('Error getting contractor profile:', error);
      throw error;
    }
  }

  async updateContractorProfile(profileId: string, updates: Partial<ContractorProfile>): Promise<void> {
    try {
      const profileRef = doc(this.contractorProfilesRef, profileId);
      await updateDoc(profileRef, {
        ...updates,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating contractor profile:', error);
      throw error;
    }
  }

  async searchContractors(criteria: {
    specialties?: string[];
    location?: string;
    availability?: string;
    minRating?: number;
  }): Promise<ContractorProfile[]> {
    try {
      let q = query(
        this.contractorProfilesRef,
        where('isActive', '==', true),
        orderBy('ratings.averageRating', 'desc')
      );

      const snapshot = await getDocs(q);
      let profiles = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        insurance: doc.data().insurance ? {
          ...doc.data().insurance,
          expirationDate: doc.data().insurance.expirationDate?.toDate()
        } : undefined
      } as ContractorProfile));

      // Apply filters
      if (criteria.specialties && criteria.specialties.length > 0) {
        profiles = profiles.filter(profile => 
          criteria.specialties!.some(specialty => profile.specialties.includes(specialty))
        );
      }

      if (criteria.location) {
        profiles = profiles.filter(profile => 
          profile.serviceAreas.some(area => 
            area.toLowerCase().includes(criteria.location!.toLowerCase())
          )
        );
      }

      if (criteria.minRating) {
        profiles = profiles.filter(profile => 
          profile.ratings.averageRating >= criteria.minRating!
        );
      }

      return profiles;
    } catch (error) {
      console.error('Error searching contractors:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========

  async getJobStats(landlordId: string): Promise<{
    total: number;
    open: number;
    inProgress: number;
    completed: number;
    avgCompletionTime: number;
    totalCost: number;
  }> {
    try {
      const jobs = await this.getJobsForLandlord(landlordId);
      
      const stats = {
        total: jobs.length,
        open: jobs.filter(j => j.status === 'open').length,
        inProgress: jobs.filter(j => j.status === 'in_progress').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        avgCompletionTime: 0,
        totalCost: jobs.reduce((sum, j) => sum + (j.actualCost || 0), 0)
      };

      // Calculate average completion time
      const completedJobs = jobs.filter(j => j.status === 'completed' && j.completedDate && j.createdAt);
      if (completedJobs.length > 0) {
        const totalTime = completedJobs.reduce((sum, job) => {
          const timeDiff = job.completedDate!.getTime() - job.createdAt.getTime();
          return sum + (timeDiff / (1000 * 60 * 60 * 24)); // Convert to days
        }, 0);
        stats.avgCompletionTime = totalTime / completedJobs.length;
      }

      return stats;
    } catch (error) {
      console.error('Error getting job stats:', error);
      throw error;
    }
  }

  async getContractorStats(contractorId: string): Promise<{
    totalJobs: number;
    completedJobs: number;
    avgRating: number;
    totalEarnings: number;
    onTimeCompletion: number;
  }> {
    try {
      const jobs = await this.getJobsForContractor(contractorId);
      const profile = await this.getContractorProfile(contractorId);
      
      const completedJobs = jobs.filter(j => j.status === 'completed');
      const onTimeJobs = completedJobs.filter(j => 
        j.deadline && j.completedDate && j.completedDate <= j.deadline
      );

      return {
        totalJobs: jobs.length,
        completedJobs: completedJobs.length,
        avgRating: profile?.ratings.averageRating || 0,
        totalEarnings: completedJobs.reduce((sum, j) => sum + (j.actualCost || 0), 0),
        onTimeCompletion: completedJobs.length > 0 ? (onTimeJobs.length / completedJobs.length) * 100 : 0
      };
    } catch (error) {
      console.error('Error getting contractor stats:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const jobService = new JobService();
export default jobService; 