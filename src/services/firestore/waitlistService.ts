import { 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  QueryConstraint,
  getDocs,
  collection,
  startAfter,
  endBefore
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { BaseFirestoreService, ServiceResult, PaginatedResult } from '../base/BaseFirestoreService';
import { 
  WaitlistEntry, 
  WaitlistMetrics, 
  WaitlistFilters, 
  WaitlistStatus, 
  WaitlistPriority 
} from '../../models/Waitlist';

/**
 * Waitlist Service
 * Manages waitlist entries with specialized operations for analytics and outreach
 */
export class WaitlistService extends BaseFirestoreService<WaitlistEntry> {
  constructor() {
    super('waitlist');
    
    // Configure caching for waitlist data
    this.configureCaching({
      enabled: true,
      ttl: 2 * 60 * 1000, // 2 minutes for fresh data
      maxSize: 50
    });
    
    // Configure retry logic
    this.configureRetry({
      enabled: true,
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 5000,
      backoffFactor: 2
    });
  }

  // =============================================
  // SPECIALIZED WAITLIST OPERATIONS
  // =============================================

  /**
   * Add a new waitlist entry
   */
  async addWaitlistEntry(entryData: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<ServiceResult<WaitlistEntry>> {
    try {
      // Check for duplicate email
      const existingResult = await this.getByEmail(entryData.email);
      if (existingResult.success && existingResult.data) {
        return {
          success: false,
          error: 'This email is already on the waitlist',
          timestamp: new Date()
        };
      }

      // Set default values
      const waitlistEntry: Omit<WaitlistEntry, 'id'> = {
        ...entryData,
        timestamp: serverTimestamp() as Timestamp,
        status: 'active',
        priority: this.calculatePriority(entryData),
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp
      };

      return await this.create(waitlistEntry);
    } catch (error) {
      return this.handleError('addWaitlistEntry', error);
    }
  }

  /**
   * Get waitlist entry by email
   */
  async getByEmail(email: string): Promise<ServiceResult<WaitlistEntry | null>> {
    try {
      const constraints: QueryConstraint[] = [
        where('email', '==', email.toLowerCase())
      ];

      const result = await this.list(constraints);
      if (!result.success) {
        return {
          success: false,
          error: result.error,
          timestamp: new Date()
        };
      }

      const entry = result.data!.items.length > 0 ? result.data!.items[0] : null;
      return {
        success: true,
        data: entry,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('getByEmail', error);
    }
  }

  /**
   * Get waitlist entries with filters
   */
  async getWaitlistEntries(
    filters: WaitlistFilters = {},
    pagination?: { limit?: number; page?: number }
  ): Promise<ServiceResult<PaginatedResult<WaitlistEntry>>> {
    try {
      const constraints: QueryConstraint[] = [];

      // Apply filters
      if (filters.userType) {
        constraints.push(where('userType', '==', filters.userType));
      }

      if (filters.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters.priority) {
        constraints.push(where('priority', '==', filters.priority));
      }

      if (filters.dateRange) {
        constraints.push(where('timestamp', '>=', filters.dateRange.start));
        constraints.push(where('timestamp', '<=', filters.dateRange.end));
      }

      if (filters.interests && filters.interests.length > 0) {
        constraints.push(where('interests', 'array-contains-any', filters.interests));
      }

      // Add ordering - most recent first
      constraints.push(orderBy('timestamp', 'desc'));

      // Add pagination
      if (pagination?.limit) {
        constraints.push(limit(pagination.limit));
      }

      return await this.list(constraints);
    } catch (error) {
      return this.handleError('getWaitlistEntries', error);
    }
  }

  /**
   * Update waitlist entry status
   */
  async updateStatus(id: string, status: WaitlistStatus, notes?: string): Promise<ServiceResult<WaitlistEntry>> {
    try {
      const updateData: Partial<WaitlistEntry> = {
        status,
        updatedAt: serverTimestamp() as Timestamp
      };

      if (notes) {
        updateData.notes = notes;
      }

      return await this.update(id, updateData);
    } catch (error) {
      return this.handleError('updateStatus', error);
    }
  }

  /**
   * Update waitlist entry priority
   */
  async updatePriority(id: string, priority: WaitlistPriority): Promise<ServiceResult<WaitlistEntry>> {
    try {
      const updateData: Partial<WaitlistEntry> = {
        priority,
        updatedAt: serverTimestamp() as Timestamp
      };

      return await this.update(id, updateData);
    } catch (error) {
      return this.handleError('updatePriority', error);
    }
  }

  /**
   * Get waitlist metrics and analytics
   */
  async getWaitlistMetrics(): Promise<ServiceResult<WaitlistMetrics>> {
    const cacheKey = 'waitlist_metrics';
    
    try {
      // Check cache first
      const cached = this.getFromCache<WaitlistMetrics>(cacheKey);
      if (cached) {
        return {
          success: true,
          data: cached,
          timestamp: new Date(),
          cached: true
        };
      }

      // Get all active waitlist entries
      const result = await this.list([]);
      if (!result.success || !result.data) {
        throw new Error('Failed to get waitlist entries');
      }

      const entries = result.data.items;
      
      // Calculate metrics
      const metrics: WaitlistMetrics = {
        totalSignups: entries.length,
        byUserType: {},
        byReferralSource: {},
        conversionRate: 0,
        recentSignups: 0
      };

      // Count by user type
      entries.forEach(entry => {
        metrics.byUserType[entry.userType] = (metrics.byUserType[entry.userType] || 0) + 1;
        
        if (entry.referralSource) {
          metrics.byReferralSource[entry.referralSource] = (metrics.byReferralSource[entry.referralSource] || 0) + 1;
        }
      });

      // Calculate recent signups (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      metrics.recentSignups = entries.filter(entry => {
        const entryDate = entry.timestamp instanceof Timestamp 
          ? entry.timestamp.toDate() 
          : new Date(entry.timestamp);
        return entryDate >= sevenDaysAgo;
      }).length;

      // Calculate conversion rate (contacted + converted / total)
      const convertedOrContacted = entries.filter(entry => 
        entry.status === 'contacted' || entry.status === 'converted'
      ).length;
      metrics.conversionRate = entries.length > 0 ? (convertedOrContacted / entries.length) * 100 : 0;

      // Cache metrics for 5 minutes
      this.setCache(cacheKey, metrics);

      return {
        success: true,
        data: metrics,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('getWaitlistMetrics', error);
    }
  }

  /**
   * Search waitlist entries
   */
  async searchWaitlist(searchTerm: string): Promise<ServiceResult<PaginatedResult<WaitlistEntry>>> {
    try {
      const searchFields = ['name', 'email', 'companyName', 'notes'];
      return await this.search(searchTerm, searchFields);
    } catch (error) {
      return this.handleError('searchWaitlist', error);
    }
  }

  /**
   * Get high priority entries
   */
  async getHighPriorityEntries(limitCount: number = 10): Promise<ServiceResult<WaitlistEntry[]>> {
    try {
      const constraints: QueryConstraint[] = [
        where('priority', '==', 'high'),
        where('status', '==', 'active'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      ];

      const result = await this.list(constraints);
      if (!result.success || !result.data) {
        throw new Error('Failed to get high priority entries');
      }

      return {
        success: true,
        data: result.data.items,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('getHighPriorityEntries', error);
    }
  }

  /**
   * Bulk update status for multiple entries
   */
  async bulkUpdateStatus(ids: string[], status: WaitlistStatus, notes?: string): Promise<ServiceResult<void>> {
    try {
      const updates = ids.map(id => ({
        id,
        data: {
          status,
          notes,
          updatedAt: serverTimestamp() as Timestamp
        }
      }));

      return await this.batchUpdate(updates);
    } catch (error) {
      return this.handleError('bulkUpdateStatus', error);
    }
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  /**
   * Calculate priority based on user data
   */
  private calculatePriority(entryData: Omit<WaitlistEntry, 'id' | 'createdAt' | 'updatedAt'>): WaitlistPriority {
    let score = 0;

    // Higher priority for landlords and property managers
    if (entryData.userType === 'landlord' || entryData.userType === 'property_manager') {
      score += 2;
    }

    // Higher priority for multiple properties
    if (entryData.propertyCount) {
      const count = entryData.propertyCount;
      if (count === '26+') score += 3;
      else if (count === '11-25') score += 2;
      else if (count === '6-10') score += 1;
    }

    // Higher priority for business users
    if (entryData.companyName) {
      score += 1;
    }

    // Higher priority for multiple interests
    if (entryData.interests.length >= 3) {
      score += 1;
    }

    // Determine priority based on score
    if (score >= 4) return 'high';
    if (score >= 2) return 'medium';
    return 'low';
  }
}

// Create and export singleton instance
export const waitlistService = new WaitlistService();
export default waitlistService; 