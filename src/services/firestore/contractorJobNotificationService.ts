import {
  collection,
  doc,
  addDoc,
  updateDoc,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { db } from '../../firebase/config';

export interface ContractorJobNotification {
  id?: string;
  type: 'bid_accepted' | 'bid_rejected' | 'job_assigned' | 'job_completed' | 'bid_submitted';
  priority: 'low' | 'normal' | 'high' | 'urgent';
  title: string;
  message: string;
  userId: string;
  userRole: 'landlord' | 'contractor' | 'tenant';
  jobId: string;
  bidId?: string;
  contractorId?: string;
  contractorName?: string;
  landlordId?: string;
  landlordName?: string;
  propertyId?: string;
  propertyName?: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

export interface JobNotificationPreferences {
  userId: string;
  bidUpdates: boolean;
  jobAssignments: boolean;
  jobCompletions: boolean;
  urgentAlerts: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  inAppNotifications: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // HH:mm format
    end: string;
  };
  updatedAt: Date;
}

class ContractorJobNotificationService {
  private notificationsRef = collection(db, 'notifications');
  private jobNotificationsRef = collection(db, 'jobNotifications');
  private preferencesRef = collection(db, 'jobNotificationPreferences');

  // ========== NOTIFICATION CREATION ==========

  /**
   * Create a notification for bid acceptance
   */
  async createBidAcceptedNotification(
    jobId: string,
    bidId: string,
    contractorId: string,
    contractorName: string,
    landlordId: string,
    landlordName: string,
    propertyId: string,
    propertyName: string,
    jobTitle: string,
    amount: number
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Create notification for landlord
      const landlordNotification: Omit<ContractorJobNotification, 'id' | 'createdAt'> = {
        type: 'bid_accepted',
        priority: 'high',
        title: 'Job Bid Accepted',
        message: `${contractorName} has accepted your job: ${jobTitle}`,
        userId: landlordId,
        userRole: 'landlord',
        jobId,
        bidId,
        contractorId,
        contractorName,
        landlordId,
        landlordName,
        propertyId,
        propertyName,
        data: {
          amount,
          jobTitle,
          actionUrl: `/jobs/${jobId}`,
          actionText: 'View Job Details'
        },
        read: false
      };

      const landlordNotificationRef = doc(this.jobNotificationsRef);
      batch.set(landlordNotificationRef, {
        ...landlordNotification,
        createdAt: serverTimestamp()
      });

      // Create notification for contractor
      const contractorNotification: Omit<ContractorJobNotification, 'id' | 'createdAt'> = {
        type: 'job_assigned',
        priority: 'high',
        title: 'Job Assignment Confirmed',
        message: `You have been assigned to: ${jobTitle}`,
        userId: contractorId,
        userRole: 'contractor',
        jobId,
        bidId,
        contractorId,
        contractorName,
        landlordId,
        landlordName,
        propertyId,
        propertyName,
        data: {
          amount,
          jobTitle,
          actionUrl: `/contractor/jobs/${jobId}`,
          actionText: 'View Job Details'
        },
        read: false
      };

      const contractorNotificationRef = doc(this.jobNotificationsRef);
      batch.set(contractorNotificationRef, {
        ...contractorNotification,
        createdAt: serverTimestamp()
      });

      // Also create notifications in the main notifications collection for compatibility
      const mainLandlordNotification = {
        userId: landlordId,
        userRole: 'landlord',
        type: 'bid_accepted',
        title: 'Job Bid Accepted',
        message: `${contractorName} has accepted your job: ${jobTitle}`,
        data: {
          jobId,
          bidId,
          contractorId,
          contractorName,
          amount,
          propertyName,
          actionUrl: `/jobs/${jobId}`
        },
        read: false,
        createdAt: serverTimestamp()
      };

      const mainContractorNotification = {
        userId: contractorId,
        userRole: 'contractor',
        type: 'job_assigned',
        title: 'Job Assignment Confirmed',
        message: `You have been assigned to: ${jobTitle}`,
        data: {
          jobId,
          bidId,
          propertyName,
          propertyAddress: propertyName,
          actionUrl: `/contractor/jobs/${jobId}`
        },
        read: false,
        createdAt: serverTimestamp()
      };

      const mainLandlordRef = doc(this.notificationsRef);
      const mainContractorRef = doc(this.notificationsRef);
      
      batch.set(mainLandlordRef, mainLandlordNotification);
      batch.set(mainContractorRef, mainContractorNotification);

      await batch.commit();
      console.log('Bid accepted notifications created successfully');
    } catch (error) {
      console.error('Error creating bid accepted notifications:', error);
      throw error;
    }
  }

  /**
   * Create a notification for bid rejection
   */
  async createBidRejectedNotification(
    jobId: string,
    bidId: string,
    contractorId: string,
    contractorName: string,
    landlordId: string,
    landlordName: string,
    propertyId: string,
    propertyName: string,
    jobTitle: string,
    reason?: string
  ): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Create notification for landlord
      const landlordNotification: Omit<ContractorJobNotification, 'id' | 'createdAt'> = {
        type: 'bid_rejected',
        priority: 'normal',
        title: 'Job Bid Rejected',
        message: `${contractorName} has rejected your job: ${jobTitle}`,
        userId: landlordId,
        userRole: 'landlord',
        jobId,
        bidId,
        contractorId,
        contractorName,
        landlordId,
        landlordName,
        propertyId,
        propertyName,
        data: {
          reason: reason || 'No reason provided',
          jobTitle,
          actionUrl: `/jobs/${jobId}`,
          actionText: 'View Job Details'
        },
        read: false
      };

      const landlordNotificationRef = doc(this.jobNotificationsRef);
      batch.set(landlordNotificationRef, {
        ...landlordNotification,
        createdAt: serverTimestamp()
      });

      // Also create notification in main notifications collection
      const mainLandlordNotification = {
        userId: landlordId,
        userRole: 'landlord',
        type: 'bid_rejected',
        title: 'Job Bid Rejected',
        message: `${contractorName} has rejected your job: ${jobTitle}`,
        data: {
          jobId,
          bidId,
          contractorId,
          contractorName,
          reason: reason || 'No reason provided',
          actionUrl: `/jobs/${jobId}`
        },
        read: false,
        createdAt: serverTimestamp()
      };

      const mainLandlordRef = doc(this.notificationsRef);
      batch.set(mainLandlordRef, mainLandlordNotification);

      await batch.commit();
      console.log('Bid rejected notifications created successfully');
    } catch (error) {
      console.error('Error creating bid rejected notifications:', error);
      throw error;
    }
  }

  // ========== NOTIFICATION RETRIEVAL ==========

  /**
   * Get job notifications for a user
   */
  async getJobNotifications(userId: string, unreadOnly: boolean = false): Promise<ContractorJobNotification[]> {
    try {
      let q = query(
        this.jobNotificationsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      if (unreadOnly) {
        q = query(
          this.jobNotificationsRef,
          where('userId', '==', userId),
          where('read', '==', false),
          orderBy('createdAt', 'desc'),
          limit(50)
        );
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        readAt: doc.data().readAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      } as ContractorJobNotification));
    } catch (error) {
      console.error('Error getting job notifications:', error);
      throw error;
    }
  }

  /**
   * Subscribe to real-time job notifications for a user
   */
  subscribeToJobNotifications(
    userId: string,
    callback: (notifications: ContractorJobNotification[]) => void,
    unreadOnly: boolean = false
  ): () => void {
    let q = query(
      this.jobNotificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    if (unreadOnly) {
      q = query(
        this.jobNotificationsRef,
        where('userId', '==', userId),
        where('read', '==', false),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
    }

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        readAt: doc.data().readAt?.toDate(),
        expiresAt: doc.data().expiresAt?.toDate()
      } as ContractorJobNotification));
      callback(notifications);
    });
  }

  // ========== NOTIFICATION MANAGEMENT ==========

  /**
   * Mark a job notification as read
   */
  async markJobNotificationAsRead(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(this.jobNotificationsRef, notificationId);
      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error marking job notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all job notifications as read for a user
   */
  async markAllJobNotificationsAsRead(userId: string): Promise<void> {
    try {
      const q = query(
        this.jobNotificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach((doc: any) => {
        batch.update(doc.ref, {
          read: true,
          readAt: serverTimestamp()
        });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking all job notifications as read:', error);
      throw error;
    }
  }

  /**
   * Delete a job notification
   */
  async deleteJobNotification(notificationId: string): Promise<void> {
    try {
      const notificationRef = doc(this.jobNotificationsRef, notificationId);
      await deleteDoc(notificationRef);
    } catch (error) {
      console.error('Error deleting job notification:', error);
      throw error;
    }
  }

  // ========== NOTIFICATION PREFERENCES ==========

  /**
   * Get notification preferences for a user
   */
  async getNotificationPreferences(userId: string): Promise<JobNotificationPreferences | null> {
    try {
      const preferencesRef = doc(this.preferencesRef, userId);
      const preferencesDoc = await getDoc(preferencesRef);

      if (preferencesDoc.exists()) {
        return {
          ...preferencesDoc.data(),
          updatedAt: preferencesDoc.data().updatedAt?.toDate()
        } as JobNotificationPreferences;
      }

      return null;
    } catch (error) {
      console.error('Error getting notification preferences:', error);
      throw error;
    }
  }

  /**
   * Create or update notification preferences
   */
  async updateNotificationPreferences(
    userId: string,
    preferences: Partial<JobNotificationPreferences>
  ): Promise<void> {
    try {
      const preferencesRef = doc(this.preferencesRef, userId);
      await updateDoc(preferencesRef, {
        ...preferences,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      throw error;
    }
  }

  /**
   * Create default notification preferences for a user
   */
  async createDefaultPreferences(userId: string): Promise<void> {
    try {
      const defaultPreferences: Omit<JobNotificationPreferences, 'updatedAt'> = {
        userId,
        bidUpdates: true,
        jobAssignments: true,
        jobCompletions: true,
        urgentAlerts: true,
        emailNotifications: true,
        pushNotifications: true,
        inAppNotifications: true,
        quietHours: {
          enabled: false,
          start: '22:00',
          end: '08:00'
        }
      };

      const preferencesRef = doc(this.preferencesRef, userId);
      await setDoc(preferencesRef, {
        ...defaultPreferences,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating default preferences:', error);
      throw error;
    }
  }

  // ========== UTILITY METHODS ==========

  /**
   * Get unread notification count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const q = query(
        this.jobNotificationsRef,
        where('userId', '==', userId),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      return snapshot.size;
    } catch (error) {
      console.error('Error getting unread count:', error);
      throw error;
    }
  }

  /**
   * Check if user should receive notifications based on preferences and quiet hours
   */
  async shouldReceiveNotification(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getNotificationPreferences(userId);
      
      if (!preferences) {
        return true; // Default to true if no preferences set
      }

      // Check quiet hours
      if (preferences.quietHours.enabled) {
        const now = new Date();
        const currentTime = now.getHours() * 60 + now.getMinutes();
        const startTime = this.parseTime(preferences.quietHours.start);
        const endTime = this.parseTime(preferences.quietHours.end);

        if (startTime <= endTime) {
          // Same day range (e.g., 22:00 to 08:00)
          if (currentTime >= startTime || currentTime <= endTime) {
            return false;
          }
        } else {
          // Overnight range (e.g., 22:00 to 08:00)
          if (currentTime >= startTime && currentTime <= endTime) {
            return false;
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true; // Default to true on error
    }
  }

  /**
   * Parse time string (HH:mm) to minutes
   */
  private parseTime(timeString: string): number {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }
}

export default ContractorJobNotificationService; 