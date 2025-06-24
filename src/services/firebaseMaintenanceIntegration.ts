/**
 * Firebase Maintenance Integration Service
 * 
 * This service provides a unified interface for all maintenance-related Firebase operations,
 * coordinating between different services and providing optimized data access patterns.
 * 
 * Key Features:
 * - Unified API for all maintenance operations
 * - Real-time data synchronization
 * - Optimized query patterns
 * - Error handling and retry logic
 * - Caching and offline support
 * - Role-based data access
 */

import { 
  Timestamp,
  FirestoreError,
  enableNetwork,
  disableNetwork,
  connectFirestoreEmulator,
  clearIndexedDbPersistence,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  StatusChange
} from '../models/MaintenanceRequest';
import {
  UserRole,
  NotificationSettings
} from '../models/User';
import {
  MaintenanceMetrics,
  BulkOperation,
  ContractorMaintenanceProfile
} from '../models/Maintenance';
import {
  CommunicationMessage as Communication,
  CommunicationRole
} from '../models/Communication';

// Import specific service functions
import {
  getMaintenanceRequest,
  createMaintenanceRequest,
  subscribeToMaintenanceRequests,
  searchMaintenanceRequests,
  updateMaintenanceRequestStatus,
  executeBulkOperation,
  getMaintenanceMetrics
} from './firestore/maintenanceService';

// Note: These functions don't exist in communicationService yet
// They need to be implemented or we need to use the existing communicationService methods
/*
import {
  sendMaintenanceMessage,
  getMaintenanceRequestCommunications,
  subscribeToMaintenanceRequestCommunications,
  markMessagesAsRead,
  getUnreadMessageCount,
  sendSystemNotification,
  getUserNotificationSettings,
  updateUserNotificationSettings,
  getCommunicationStats
} from './firestore/communicationService';
*/

import { communicationService } from './firestore/communicationService';

/**
 * Configuration options for the Firebase integration
 */
export interface FirebaseMaintenanceConfig {
  enableOfflineSupport: boolean;
  enableEmulator: boolean;
  emulatorHost?: string;
  emulatorPort?: number;
  maxRetries: number;
  retryDelay: number;
  cacheSize: number;
  realTimeUpdates: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: FirebaseMaintenanceConfig = {
  enableOfflineSupport: true,
  enableEmulator: false,
  emulatorHost: 'localhost',
  emulatorPort: 8080,
  maxRetries: 3,
  retryDelay: 1000,
  cacheSize: 40 * 1024 * 1024, // 40MB
  realTimeUpdates: true
};

/**
 * Main Firebase Maintenance Integration Service
 */
export class FirebaseMaintenanceIntegration {
  private config: FirebaseMaintenanceConfig;
  private isInitialized = false;
  private listeners = new Map<string, () => void>();
  private retryCount = new Map<string, number>();
  
  constructor(config: Partial<FirebaseMaintenanceConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Initialize the Firebase integration
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Set up emulator if enabled (development only)
      if (this.config.enableEmulator && process.env.NODE_ENV === 'development') {
        try {
          connectFirestoreEmulator(db, this.config.emulatorHost!, this.config.emulatorPort!);
          console.log('Connected to Firestore emulator');
        } catch (error) {
          console.warn('Failed to connect to Firestore emulator:', error);
        }
      }

      // Enable offline persistence
      if (this.config.enableOfflineSupport) {
        try {
          await enableIndexedDbPersistence(db);
          console.log('Firestore offline persistence enabled');
        } catch (error) {
          console.warn('Failed to enable offline persistence:', error);
        }
      }

      this.isInitialized = true;
      console.log('Firebase Maintenance Integration initialized');
    } catch (error) {
      console.error('Failed to initialize Firebase Maintenance Integration:', error);
      throw error;
    }
  }

  /**
   * Clean up all listeners and resources
   */
  async cleanup(): Promise<void> {
    // Unsubscribe from all listeners
    this.listeners.forEach(unsubscribe => unsubscribe());
    this.listeners.clear();
    
    // Clear retry counts
    this.retryCount.clear();
    
    this.isInitialized = false;
    console.log('Firebase Maintenance Integration cleaned up');
  }

  /**
   * Enable/disable network connectivity
   */
  async setNetworkEnabled(enabled: boolean): Promise<void> {
    try {
      if (enabled) {
        await enableNetwork(db);
      } else {
        await disableNetwork(db);
      }
    } catch (error) {
      console.error('Failed to change network state:', error);
    }
  }

  /**
   * Clear offline cache
   */
  async clearCache(): Promise<void> {
    try {
      await clearIndexedDbPersistence(db);
      console.log('Firestore cache cleared');
    } catch (error) {
      console.error('Failed to clear cache:', error);
    }
  }

  // =============================================
  // MAINTENANCE REQUEST OPERATIONS
  // =============================================

  /**
   * Get a maintenance request with retry logic
   */
  async getRequest(requestId: string): Promise<MaintenanceRequest | null> {
    return this.withRetry(`getRequest_${requestId}`, () => 
      getMaintenanceRequest(requestId)
    );
  }

  /**
   * Create a new maintenance request
   */
  async createRequest(requestData: Parameters<typeof createMaintenanceRequest>[0]): Promise<MaintenanceRequest> {
    return this.withRetry('createRequest', () => 
      createMaintenanceRequest(requestData)
    );
  }

  /**
   * Subscribe to maintenance requests with automatic reconnection
   */
  subscribeToRequests(
    filters: Parameters<typeof subscribeToMaintenanceRequests>[0],
    callback: (requests: MaintenanceRequest[]) => void,
    onError?: (error: FirestoreError) => void
  ): () => void {
    const listenerId = `requests_${JSON.stringify(filters)}`;
    
    const unsubscribe = subscribeToMaintenanceRequests(
      filters,
      callback,
      (error) => {
        console.error('Maintenance requests listener error:', error);
        
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (this.listeners.has(listenerId)) {
            console.log('Attempting to reconnect maintenance requests listener...');
            this.subscribeToRequests(filters, callback, onError);
          }
        }, this.config.retryDelay);
        
        if (onError) {
          onError(error);
        }
      }
    );
    
    this.listeners.set(listenerId, unsubscribe);
    
    return () => {
      this.listeners.delete(listenerId);
      unsubscribe();
    };
  }

  /**
   * Search maintenance requests with caching
   */
  async searchRequests(searchParams: Parameters<typeof searchMaintenanceRequests>[0]): Promise<ReturnType<typeof searchMaintenanceRequests>> {
    return this.withRetry('searchRequests', () => 
      searchMaintenanceRequests(searchParams)
    );
  }

  /**
   * Update maintenance request status
   */
  async updateRequestStatus(
    requestId: string,
    newStatus: MaintenanceStatus,
    userId: string,
    userRole: UserRole,
    notes?: string,
    additionalData?: Parameters<typeof updateMaintenanceRequestStatus>[5]
  ): Promise<void> {
    await this.withRetry('updateRequestStatus', () => 
      updateMaintenanceRequestStatus(requestId, newStatus, userId, userRole, notes, additionalData)
    );
    
    // Send system notification for status changes
    await this.sendStatusChangeNotification(requestId, newStatus, userId, userRole, notes);
  }

  /**
   * Execute bulk operations on maintenance requests
   */
  async executeBulkOperation(
    requestIds: string[],
    operation: 'assign_contractor' | 'change_priority' | 'change_status' | 'archive' | 'mark_completed',
    parameters: any = {},
    initiatedBy: string
  ): Promise<BulkOperation> {
    return this.withRetry('executeBulkOperation', () => 
      executeBulkOperation(requestIds, operation as any, parameters, initiatedBy)
    );
  }

  /**
   * Get maintenance metrics for analytics
   */
  async getMetrics(
    propertyIds?: string[],
    timeRange?: { start: Date; end: Date }
  ): Promise<MaintenanceMetrics> {
    return this.withRetry('getMetrics', () => 
      getMaintenanceMetrics(propertyIds, timeRange)
    );
  }

  // =============================================
  // COMMUNICATION OPERATIONS
  // =============================================

  /**
   * Send a message for a maintenance request
   */
  async sendMessage(
    requestId: string,
    userId: string,
    userRole: UserRole,
    userName: string,
    message: string,
    attachments: string[] = [],
    isUrgent: boolean = false
  ): Promise<Communication> {
    return this.withRetry('sendMessage', async () => {
      await communicationService.addMessage(requestId, {
        senderId: userId,
        senderName: userName,
        senderRole: userRole as CommunicationRole,
        content: message,
        attachments,
        isUrgent
      });
      
      // Return a Communication object for compatibility
      return {
        id: Date.now().toString(),
        requestId,
        senderId: userId,
        senderName: userName,
        senderRole: userRole as CommunicationRole,
        content: message,
        timestamp: Timestamp.now(),
        type: 'message',
        isRead: false,
        attachments,
        isUrgent,
        metadata: {},
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      } as Communication;
    });
  }

  /**
   * Get communications for a maintenance request
   */
  async getRequestCommunications(
    requestId: string,
    limitCount: number = 50
  ): Promise<Communication[]> {
    return this.withRetry('getRequestCommunications', () => 
      communicationService.getRequestCommunications(requestId, limitCount)
    );
  }

  /**
   * Subscribe to maintenance request communications
   */
  subscribeToRequestCommunications(
    requestId: string,
    callback: (communications: Communication[]) => void,
    onError?: (error: FirestoreError) => void
  ): () => void {
    const listenerId = `communications_${requestId}`;
    
    const unsubscribe = communicationService.subscribeToRequestCommunications(
      requestId,
      callback,
      (error) => {
        console.error('Communications listener error:', error);
        
        // Attempt to reconnect after delay
        setTimeout(() => {
          if (this.listeners.has(listenerId)) {
            console.log('Attempting to reconnect communications listener...');
            this.subscribeToRequestCommunications(requestId, callback, onError);
          }
        }, this.config.retryDelay);
        
        if (onError) {
          onError(error);
        }
      }
    );
    
    this.listeners.set(listenerId, unsubscribe);
    
    return () => {
      this.listeners.delete(listenerId);
      unsubscribe();
    };
  }

  /**
   * Mark messages as read
   */
  async markAsRead(
    requestId: string,
    userId: string,
    messageIds: string[]
  ): Promise<void> {
    // TODO: Implement this method in communicationService
    console.warn('markMessagesAsRead not implemented yet');
    return Promise.resolve();
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string, userRole: UserRole): Promise<number> {
    // TODO: Implement this method in communicationService
    console.warn('getUnreadMessageCount not implemented yet');
    return 0;
  }

  /**
   * Get communication statistics
   */
  async getCommunicationStats(
    propertyIds?: string[],
    timeRange?: { start: Date; end: Date }
  ): Promise<any> {
    // TODO: Implement this method in communicationService
    console.warn('getCommunicationStats not implemented yet');
    return { total: 0, unread: 0, urgent: 0 };
  }

  // =============================================
  // NOTIFICATION OPERATIONS
  // =============================================

  /**
   * Get user notification settings
   */
  async getNotificationSettings(userId: string, userRole: UserRole): Promise<NotificationSettings> {
    // TODO: Implement this method in communicationService
    console.warn('getUserNotificationSettings not implemented yet');
    return {
      userId,
      userRole: userRole as 'tenant' | 'landlord' | 'contractor',
      emailNotifications: {
        newRequests: true,
        statusUpdates: true,
        messages: true,
        emergencies: true,
        reminders: true
      },
      pushNotifications: {
        newRequests: false,
        statusUpdates: false,
        messages: false,
        emergencies: false,
        reminders: false
      },
      smsNotifications: {
        emergencies: false,
        reminders: false
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00'
      },
      frequency: 'immediate'
    };
  }

  /**
   * Update user notification settings
   */
  async updateNotificationSettings(
    userId: string,
    updates: Partial<NotificationSettings>
  ): Promise<void> {
    // TODO: Implement this method in communicationService
    console.warn('updateUserNotificationSettings not implemented yet');
    return Promise.resolve();
  }

  // =============================================
  // UTILITY METHODS
  // =============================================

  /**
   * Get dashboard data for a specific user role
   */
  async getDashboardData(
    userId: string,
    userRole: UserRole,
    propertyIds?: string[]
  ): Promise<{
    requests: MaintenanceRequest[];
    metrics: MaintenanceMetrics;
    unreadCount: number;
    recentCommunications: Communication[];
  }> {
    try {
      // Build filters based on user role
      const filters: Parameters<typeof subscribeToMaintenanceRequests>[0] = {
        limit: 50
      };

      switch (userRole) {
        case 'tenant':
          filters.tenantId = userId;
          break;
        case 'contractor':
          filters.contractorId = userId;
          break;
        case 'landlord':
          filters.propertyIds = propertyIds;
          break;
      }

      // Fetch data in parallel
      const [requests, metrics, unreadCount] = await Promise.all([
        this.searchRequests({ ...filters, pageSize: 50 }),
        this.getMetrics(propertyIds),
        this.getUnreadCount(userId, userRole)
      ]);

      // Get recent communications from the first few requests
      const recentCommunications: Communication[] = [];
      for (const request of requests.requests.slice(0, 5)) {
        const comms = await this.getRequestCommunications(request.id, 5);
        recentCommunications.push(...comms);
      }

      // Sort communications by timestamp
      recentCommunications.sort((a, b) => {
        const aTime = a.timestamp instanceof Timestamp ? a.timestamp.toMillis() : 0;
        const bTime = b.timestamp instanceof Timestamp ? b.timestamp.toMillis() : 0;
        return bTime - aTime;
      });

      return {
        requests: requests.requests,
        metrics,
        unreadCount,
        recentCommunications: recentCommunications.slice(0, 10)
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      throw error;
    }
  }

  /**
   * Batch update multiple maintenance requests
   */
  async batchUpdateRequests(
    updates: {
      requestId: string;
      status?: MaintenanceStatus;
      priority?: MaintenancePriority;
      contractorId?: string;
      notes?: string;
    }[],
    userId: string,
    userRole: UserRole
  ): Promise<{ successful: string[]; failed: { requestId: string; error: string }[] }> {
    const results: { successful: string[]; failed: { requestId: string; error: string }[] } = { 
      successful: [], 
      failed: [] 
    };

    // Process updates in chunks to avoid overwhelming Firestore
    const chunkSize = 10;
    for (let i = 0; i < updates.length; i += chunkSize) {
      const chunk = updates.slice(i, i + chunkSize);
      
      await Promise.allSettled(
        chunk.map(async (update) => {
          try {
            if (update.status) {
              await this.updateRequestStatus(
                update.requestId,
                update.status,
                userId,
                userRole,
                update.notes,
                update.contractorId ? { contractorId: update.contractorId } : undefined
              );
            }
            results.successful.push(update.requestId);
          } catch (error) {
            results.failed.push({
              requestId: update.requestId,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }
        })
      );
    }

    return results;
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  /**
   * Execute a function with retry logic
   */
  private async withRetry<T>(
    operationId: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const currentRetries = this.retryCount.get(operationId) || 0;
    
    try {
      const result = await operation();
      // Reset retry count on success
      this.retryCount.delete(operationId);
      return result;
    } catch (error) {
      if (currentRetries < this.config.maxRetries) {
        console.warn(`Operation ${operationId} failed, retrying (${currentRetries + 1}/${this.config.maxRetries})...`);
        this.retryCount.set(operationId, currentRetries + 1);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (currentRetries + 1)));
        
        return this.withRetry(operationId, operation);
      } else {
        // Max retries exceeded, reset counter and throw error
        this.retryCount.delete(operationId);
        console.error(`Operation ${operationId} failed after ${this.config.maxRetries} retries:`, error);
        throw error;
      }
    }
  }

  /**
   * Send system notification for status changes
   */
  private async sendStatusChangeNotification(
    requestId: string,
    newStatus: MaintenanceStatus,
    userId: string,
    userRole: UserRole,
    notes?: string
  ): Promise<void> {
    try {
      // Get the request to determine affected users
      const request = await this.getRequest(requestId);
      if (!request) return;

      const affectedUsers: { userId: string; userRole: UserRole; userName: string }[] = [];
      
      // Add tenant
      if (request.tenantId) {
        affectedUsers.push({
          userId: request.tenantId,
          userRole: 'tenant',
          userName: request.tenantName
        });
      }
      
      // Add contractor if assigned
      if (request.contractorId && request.contractorName) {
        affectedUsers.push({
          userId: request.contractorId,
          userRole: 'contractor',
          userName: request.contractorName
        });
      }

      // Create status change message
      const statusMessages: Record<MaintenanceStatus, string> = {
        'submitted': 'Maintenance request submitted',
        'pending': 'Maintenance request pending review',
        'assigned': 'Contractor assigned to maintenance request',
        'in-progress': 'Work has started on maintenance request',
        'completed': 'Maintenance request completed',
        'cancelled': 'Maintenance request cancelled',
        'pending_approval': 'Maintenance request pending approval',
        'scheduled': 'Maintenance request scheduled',
        'on-hold': 'Maintenance request put on hold',
        'requires_parts': 'Maintenance request waiting for parts'
      };

      const message = `${statusMessages[newStatus] || 'Status updated'} for "${request.title}"${notes ? `. Note: ${notes}` : ''}`;

      // TODO: Implement sendSystemNotification in communicationService
      console.warn('sendSystemNotification not implemented yet');
    } catch (error) {
      console.error('Failed to send status change notification:', error);
      // Don't throw error as this is a secondary operation
    }
  }
}

// Create and export singleton instance
export const firebaseMaintenanceIntegration = new FirebaseMaintenanceIntegration();

// Export additional types and interfaces
export type {
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  UserRole,
  Communication,
  MaintenanceMetrics,
  BulkOperation,
  NotificationSettings
};

// Export individual service functions for direct use if needed
export {
  getMaintenanceRequest,
  createMaintenanceRequest,
  subscribeToMaintenanceRequests,
  searchMaintenanceRequests,
  updateMaintenanceRequestStatus,
  executeBulkOperation,
  getMaintenanceMetrics
};

export default firebaseMaintenanceIntegration; 