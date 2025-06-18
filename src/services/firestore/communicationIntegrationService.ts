import {
  doc,
  collection,
  getDoc,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { communicationService } from './communicationService';
// TODO: Create these services
import * as realJobService from './jobService';
// import * as notificationService from './notificationService';
import { 
  Conversation, 
  CommunicationMessage,
  Participant,
  CommunicationRole,
} from '../../models';
// TODO: Create Job and Notification models
import { Job } from './jobService';
import { Message } from '../../models/Communication';
// import { Notification, NotificationRule } from '../../models/Notification';

// Temporary stub types until actual models are created
type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
};

// Use real job service
const jobServiceInstance = realJobService.default || realJobService;
const jobService = {
  getJob: async (jobId: string): Promise<Job | null> => {
    try {
      return await jobServiceInstance.getJob(jobId);
    } catch (error) {
      console.error('Error getting job:', error);
      return null;
    }
  }
};

const notificationService = {
  createNotification: async (data: any): Promise<void> => {}
};

export interface CommunicationStats {
  conversations: {
    total: number;
    unread: number;
    active: number;
  };
  messages: {
    sent: number;
    received: number;
    unread: number;
  };
  jobs: {
    total: number;
    open: number;
    inProgress: number;
    completed: number;
  };
  notifications: {
    total: number;
    unread: number;
    rules: number;
  };
}

export interface CrossAccountInvite {
  id?: string;
  invitedBy: string;
  invitedByName: string;
  invitedByRole: 'landlord' | 'tenant' | 'contractor';
  invitedEmail: string;
  invitedRole: 'tenant' | 'contractor';
  propertyId?: string;
  propertyName?: string;
  jobId?: string;
  jobTitle?: string;
  message?: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  expiresAt: Date;
  createdAt: Date;
}

class CommunicationIntegrationService {
  
  // ========== CROSS-ACCOUNT COMMUNICATION ==========

  async createTenantLandlordConversation(
    landlordId: string,
    tenantId: string,
    propertyId: string,
    initialMessage?: string
  ): Promise<string> {
    try {
      // Get user profiles
      const [landlordProfile, tenantProfile, propertyData] = await Promise.all([
        this.getUserProfile(landlordId),
        this.getUserProfile(tenantId),
        this.getPropertyData(propertyId)
      ]);

      const participants: Participant[] = [
        {
          id: landlordProfile.id || landlordId,
          name: landlordProfile.name || `${landlordProfile.firstName} ${landlordProfile.lastName}`,
          email: landlordProfile.email,
          role: 'landlord'
        },
        {
          id: tenantProfile.id || tenantId,
          name: tenantProfile.name || `${tenantProfile.firstName} ${tenantProfile.lastName}`,
          email: tenantProfile.email,
          role: 'tenant'
        }
      ];

      const conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'lastMessage' | 'unreadCounts'> = {
        type: 'general',
        participants,
        title: `${propertyData.nickname || propertyData.streetAddress} - Communication`,
        priority: 'normal',
        propertyId,
        tags: ['property', 'tenant-landlord']
      };

      const conversationId = await communicationService.createConversation(conversation);

      // Send initial message if provided
      if (initialMessage) {
        await communicationService.sendMessage({
          conversationId,
          sender: landlordId,
          senderName: participants[0].name,
          senderRole: 'landlord',
          text: initialMessage,
        });
      }

      return conversationId;
    } catch (error) {
      console.error('Error creating tenant-landlord conversation:', error);
      throw error;
    }
  }

  async createContractorCommunication(
    landlordId: string,
    contractorId: string,
    jobId: string,
    initialMessage?: string
  ): Promise<string> {
    try {
      // Get user profiles and job data
      const [landlordProfile, contractorProfile, jobData] = await Promise.all([
        this.getUserProfile(landlordId),
        this.getUserProfile(contractorId),
        jobService.getJob(jobId)
      ]);

      if (!jobData) {
        throw new Error('Job not found');
      }

      const participants: Participant[] = [
        {
          id: landlordId,
          name: landlordProfile.name || `${landlordProfile.firstName} ${landlordProfile.lastName}`,
          email: landlordProfile.email,
          role: 'landlord'
        },
        {
          id: contractorId,
          name: contractorProfile.name || `${contractorProfile.firstName} ${contractorProfile.lastName}`,
          email: contractorProfile.email,
          role: 'contractor'
        }
      ];

      const conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'lastMessage' | 'unreadCounts'> = {
        type: 'general',
        participants,
        title: `Job: ${jobData.title}`,
        priority: jobData.priority,
        propertyId: jobData.propertyId,
        jobId,
        tags: ['job', 'contractor-communication', jobData.category]
      };

      const conversationId = await communicationService.createConversation(conversation);

      // Send initial message if provided
      if (initialMessage) {
        await communicationService.sendMessage({
          conversationId,
          sender: landlordId,
          senderName: participants[0].name,
          senderRole: 'landlord',
          text: initialMessage,
        });
      }

      return conversationId;
    } catch (error) {
      console.error('Error creating contractor communication:', error);
      throw error;
    }
  }

  // ========== TENANT INVITATION SYSTEM ==========

  async inviteTenant(
    landlordId: string,
    tenantEmail: string,
    propertyId: string,
    message?: string
  ): Promise<void> {
    try {
      const landlordProfile = await this.getUserProfile(landlordId);
      const propertyData = await this.getPropertyData(propertyId);

      // Create invitation record
      const invitation: CrossAccountInvite = {
        invitedBy: landlordId,
        invitedByName: landlordProfile.name || `${landlordProfile.firstName} ${landlordProfile.lastName}`,
        invitedByRole: 'landlord',
        invitedEmail: tenantEmail,
        invitedRole: 'tenant',
        propertyId,
        propertyName: propertyData.nickname || propertyData.streetAddress,
        message,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date()
      };

      // TODO: Store invitation in Firestore
      // TODO: Send invitation email

      // Create notification for landlord
      await notificationService.createNotification({
        type: 'system',
        priority: 'normal',
        title: 'Tenant Invitation Sent',
        message: `Invitation sent to ${tenantEmail} for ${propertyData.nickname || propertyData.streetAddress}`,
        recipients: [{
          userId: landlordId,
          name: landlordProfile.name,
          role: 'landlord',
          channels: ['in_app', 'email']
        }],
        propertyId,
        status: 'pending'
      });

      console.log(`Tenant invitation sent to ${tenantEmail} for property ${propertyId}`);
    } catch (error) {
      console.error('Error inviting tenant:', error);
      throw error;
    }
  }

  async inviteContractor(
    landlordId: string,
    contractorEmail: string,
    jobId: string,
    message?: string
  ): Promise<void> {
    try {
      const landlordProfile = await this.getUserProfile(landlordId);
      const jobData = await jobService.getJob(jobId);

      if (!jobData) {
        throw new Error('Job not found');
      }

      // Create invitation record
      const invitation: CrossAccountInvite = {
        invitedBy: landlordId,
        invitedByName: landlordProfile.name || `${landlordProfile.firstName} ${landlordProfile.lastName}`,
        invitedByRole: 'landlord',
        invitedEmail: contractorEmail,
        invitedRole: 'contractor',
        jobId,
        jobTitle: jobData.title,
        propertyId: jobData.propertyId,
        propertyName: jobData.propertyName,
        message,
        status: 'pending',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        createdAt: new Date()
      };

      // TODO: Store invitation in Firestore
      // TODO: Send invitation email

      // Create notification for landlord
      await notificationService.createNotification({
        type: 'job',
        priority: 'normal',
        title: 'Contractor Invitation Sent',
        message: `Invitation sent to ${contractorEmail} for job: ${jobData.title}`,
        recipients: [{
          userId: landlordId,
          name: landlordProfile.name,
          role: 'landlord',
          channels: ['in_app', 'email']
        }],
        jobId,
        propertyId: jobData.propertyId,
        status: 'pending'
      });

      console.log(`Contractor invitation sent to ${contractorEmail} for job ${jobId}`);
    } catch (error) {
      console.error('Error inviting contractor:', error);
      throw error;
    }
  }

  // ========== AUTO-NOTIFICATION TRIGGERS ==========

  async triggerJobNotifications(jobId: string, eventType: 'created' | 'assigned' | 'completed' | 'bid_received'): Promise<void> {
    try {
      const jobData = await jobService.getJob(jobId);
      if (!jobData) return;

      const landlordProfile = await this.getUserProfile(jobData.landlordId);

      switch (eventType) {
        case 'created':
          await notificationService.createNotification({
            type: 'job',
            priority: jobData.priority,
            title: 'New Job Created',
            message: `Job "${jobData.title}" has been created for ${jobData.propertyName}`,
            recipients: [{
              userId: jobData.landlordId,
              name: landlordProfile.name,
              role: 'landlord',
              channels: ['in_app', 'email']
            }],
            jobId,
            propertyId: jobData.propertyId,
            status: 'pending'
          });
          break;

        case 'assigned':
          if (jobData.assignedContractorId) {
            const contractorProfile = await this.getUserProfile(jobData.assignedContractorId);
            await notificationService.createNotification({
              type: 'job',
              priority: jobData.priority,
              title: 'Job Assigned',
              message: `You have been assigned to job: ${jobData.title}`,
              recipients: [{
                userId: jobData.assignedContractorId,
                name: contractorProfile.name,
                role: 'contractor',
                channels: ['in_app', 'email', 'sms']
              }],
              jobId,
              propertyId: jobData.propertyId,
              status: 'pending'
            });
          }
          break;

        case 'completed':
          await notificationService.createNotification({
            type: 'job',
            priority: 'normal',
            title: 'Job Completed',
            message: `Job "${jobData.title}" has been marked as completed`,
            recipients: [{
              userId: jobData.landlordId,
              name: landlordProfile.name,
              role: 'landlord',
              channels: ['in_app', 'email']
            }],
            jobId,
            propertyId: jobData.propertyId,
            status: 'pending'
          });
          break;

        case 'bid_received':
          await notificationService.createNotification({
            type: 'job',
            priority: 'normal',
            title: 'New Bid Received',
            message: `A new bid has been received for job: ${jobData.title}`,
            recipients: [{
              userId: jobData.landlordId,
              name: landlordProfile.name,
              role: 'landlord',
              channels: ['in_app', 'email']
            }],
            jobId,
            propertyId: jobData.propertyId,
            status: 'pending'
          });
          break;
      }
    } catch (error) {
      console.error('Error triggering job notifications:', error);
      throw error;
    }
  }

  async triggerMessageNotifications(conversationId: string, messageId: string): Promise<void> {
    try {
      // Get conversation and message data
      const conversation = await this.getConversationData(conversationId);
      const message = await this.getMessageData(messageId);

      if (!conversation || !message) return;

      // Notify all participants except the sender
      const recipients = conversation.participants
        .filter((p: Participant) => p.id !== message.sender)
        .map((p: Participant) => ({
          userId: p.id,
          name: p.name,
          role: p.role,
          channels: ['in_app', 'push'] as ('email' | 'sms' | 'push' | 'in_app')[]
        }));

      if (recipients.length > 0) {
        await notificationService.createNotification({
          type: 'message',
          priority: conversation.priority,
          title: `New message from ${message.senderName}`,
          message: message.text || 'You have a new message',
          recipients,
          conversationId,
          propertyId: conversation.propertyId,
          jobId: conversation.jobId,
          status: 'pending'
        });
      }
    } catch (error) {
      console.error('Error triggering message notifications:', error);
      throw error;
    }
  }

  // ========== STATISTICS AND ANALYTICS ==========

  async getCommunicationStats(userId: string): Promise<CommunicationStats> {
    try {
      const [conversations, jobs] = await Promise.all([
        communicationService.getConversationsForUser(userId),
        this.getUserJobs(userId)
      ]);
      const notifications: Notification[] = []; // TODO: Implement getNotifications

      // Calculate unread conversations
      const unreadConversations = conversations.filter((conv: Conversation) => 
        conv.unreadCounts[userId] > 0
      ).length;

      // Calculate active conversations (messages in last 7 days)
      const activeConversations = conversations.filter((conv: Conversation) => 
        conv.lastMessage && 
        conv.lastMessage.timestamp.toDate().getTime() > (Date.now() - 7 * 24 * 60 * 60 * 1000)
      ).length;

      // Calculate unread notifications
      const unreadNotifications = notifications.filter((notif: Notification) => 
        !notif.isRead
      ).length;

      return {
        conversations: {
          total: conversations.length,
          unread: unreadConversations,
          active: activeConversations
        },
        messages: {
          sent: 0, // TODO: Calculate from messages where sender = userId
          received: 0, // TODO: Calculate from messages where sender != userId
          unread: 0 // TODO: Calculate unread messages
        },
        jobs: {
          total: jobs.length,
          open: jobs.filter((j: Job) => j.status === 'open').length,
          inProgress: jobs.filter((j: Job) => j.status === 'in_progress').length,
          completed: jobs.filter((j: Job) => j.status === 'completed').length
        },
        notifications: {
          total: notifications.length,
          unread: unreadNotifications,
          rules: 0 // TODO: Get notification rules count
        }
      };
    } catch (error) {
      console.error('Error getting communication stats:', error);
      return {
        conversations: { total: 0, unread: 0, active: 0 },
        messages: { sent: 0, received: 0, unread: 0 },
        jobs: { total: 0, open: 0, inProgress: 0, completed: 0 },
        notifications: { total: 0, unread: 0, rules: 0 }
      };
    }
  }

  // ========== SEARCH AND DISCOVERY ==========

  async globalSearch(userId: string, searchTerm: string): Promise<{
    conversations: Conversation[];
    jobs: Job[];
    messages: Message[];
    notifications: Notification[];
  }> {
    try {
      const [jobs, notifications] = await Promise.all([
        this.searchUserJobs(userId, searchTerm),
        this.searchUserNotifications(userId, searchTerm)
      ]);
      
      // TODO: Implement searchConversations and searchMessages
      const conversations: Conversation[] = [];
      const messages: any[] = []; // TODO: Add proper Message type

      return {
        conversations,
        jobs,
        messages,
        notifications
      };
    } catch (error) {
      console.error('Error performing global search:', error);
      return {
        conversations: [],
        jobs: [],
        messages: [],
        notifications: []
      };
    }
  }

  // ========== HELPER METHODS ==========

  private async getUserProfile(userId: string): Promise<any> {
    // TODO: Implement user profile fetching
    return {
      id: userId,
      name: 'User Name',
      firstName: 'User',
      lastName: 'Name',
      email: 'user@example.com'
    };
  }

  private async getPropertyData(propertyId: string): Promise<any> {
    // TODO: Implement property data fetching
    return {
      id: propertyId,
      nickname: 'Property Name',
      streetAddress: '123 Main St'
    };
  }

  private async getConversationData(conversationId: string): Promise<Conversation | null> {
    // TODO: Implement conversation data fetching
    return null;
  }

  private async getMessageData(messageId: string): Promise<Message | null> {
    // TODO: Implement message data fetching
    return null;
  }

  private async getUserJobs(userId: string): Promise<Job[]> {
    // TODO: Implement user jobs fetching based on role
    return [];
  }

  private async searchUserJobs(userId: string, searchTerm: string): Promise<Job[]> {
    // TODO: Implement job search
    return [];
  }

  private async searchUserNotifications(userId: string, searchTerm: string): Promise<Notification[]> {
    // TODO: Implement notification search
    return [];
  }

  // ========== REAL-TIME SUBSCRIPTIONS ==========

  subscribeToAllCommunications(
    userId: string,
    callbacks: {
      onConversationsUpdate: (conversations: Conversation[]) => void;
      onNotificationsUpdate: (notifications: Notification[]) => void;
      onJobsUpdate?: (jobs: Job[]) => void;
    }
  ): () => void {
    const unsubscribes: (() => void)[] = [];

    // Subscribe to conversations
    const unsubscribeConversations = communicationService.subscribeToConversations(
      userId,
      callbacks.onConversationsUpdate
    );
    unsubscribes.push(unsubscribeConversations);

    // TODO: Subscribe to notifications
    // const unsubscribeNotifications = notificationService.subscribeToNotifications(
    //   userId,
    //   callbacks.onNotificationsUpdate
    // );
    // unsubscribes.push(unsubscribeNotifications);

    // Subscribe to jobs if callback provided
    if (callbacks.onJobsUpdate) {
      // TODO: Implement job subscription based on user role
    }

    // Return function to unsubscribe from all
    return () => {
      unsubscribes.forEach(unsubscribe => unsubscribe());
    };
  }
}

// Export singleton instance
export const communicationIntegrationService = new CommunicationIntegrationService();
export default communicationIntegrationService; 