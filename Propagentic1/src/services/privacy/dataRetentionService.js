/**
 * Data Retention Service for PropAgentic
 * Automatically cleans up old data based on configurable retention policies
 */

import { 
  collection, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  doc, 
  updateDoc, 
  addDoc,
  serverTimestamp,
  writeBatch,
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { auditLogger } from '../security/auditLogger';

class DataRetentionService {
  constructor() {
    // Retention policies for different data types
    this.retentionPolicies = {
      // Maintenance and operational data
      maintenance_requests: {
        retentionDays: 1095, // 3 years
        archiveBeforeDelete: true,
        archiveDays: 30, // Archive 30 days before deletion
        exemptions: ['legal_hold', 'ongoing_issue'],
        cleanupFields: ['photos', 'attachments'],
        category: 'operational'
      },
      
      work_orders: {
        retentionDays: 1095, // 3 years
        archiveBeforeDelete: true,
        archiveDays: 30,
        exemptions: ['warranty_claim', 'dispute'],
        cleanupFields: ['contractor_notes', 'before_after_photos'],
        category: 'operational'
      },
      
      inspections: {
        retentionDays: 2190, // 6 years (safety/compliance)
        archiveBeforeDelete: true,
        archiveDays: 60,
        exemptions: ['safety_issue', 'compliance_record'],
        cleanupFields: ['inspection_photos'],
        category: 'compliance'
      },
      
      // Communication data
      messages: {
        retentionDays: 365, // 1 year
        archiveBeforeDelete: false,
        exemptions: ['legal_notice', 'important'],
        cleanupFields: ['attachments'],
        category: 'communication'
      },
      
      notifications: {
        retentionDays: 90, // 3 months
        archiveBeforeDelete: false,
        exemptions: [],
        cleanupFields: [],
        category: 'communication'
      },
      
      // Analytics and logs
      user_analytics: {
        retentionDays: 365, // 1 year
        archiveBeforeDelete: true,
        archiveDays: 30,
        exemptions: [],
        cleanupFields: ['detailed_events'],
        category: 'analytics'
      },
      
      system_logs: {
        retentionDays: 180, // 6 months
        archiveBeforeDelete: false,
        exemptions: ['error_logs', 'security_events'],
        cleanupFields: [],
        category: 'system'
      },
      
      // Session and temporary data
      user_sessions: {
        retentionDays: 30, // 1 month
        archiveBeforeDelete: false,
        exemptions: [],
        cleanupFields: ['session_data'],
        category: 'temporary'
      },
      
      temp_uploads: {
        retentionDays: 7, // 1 week
        archiveBeforeDelete: false,
        exemptions: [],
        cleanupFields: ['file_data'],
        category: 'temporary'
      },
      
      // Audit and compliance (longer retention)
      audit_logs: {
        retentionDays: 2555, // 7 years
        archiveBeforeDelete: true,
        archiveDays: 365, // Archive after 1 year
        exemptions: ['security_incident', 'compliance_audit'],
        cleanupFields: [],
        category: 'audit'
      },
      
      gdpr_requests: {
        retentionDays: 2555, // 7 years
        archiveBeforeDelete: true,
        archiveDays: 365,
        exemptions: [],
        cleanupFields: [],
        category: 'audit'
      }
    };
    
    // Cleanup schedules
    this.cleanupSchedules = {
      daily: ['temp_uploads', 'notifications'],
      weekly: ['user_sessions', 'system_logs'],
      monthly: ['messages', 'user_analytics'],
      quarterly: ['maintenance_requests', 'work_orders'],
      annually: ['inspections', 'audit_logs']
    };
    
    // Archive storage configuration
    this.archiveConfig = {
      enabled: true,
      compressionEnabled: true,
      encryptionEnabled: true,
      storageLocation: 'gs://propagentic-archives',
      indexingEnabled: true
    };
    
    // Cleanup statistics
    this.stats = {
      lastCleanup: null,
      totalRecordsProcessed: 0,
      totalRecordsDeleted: 0,
      totalRecordsArchived: 0,
      errorCount: 0
    };
  }

  /**
   * Initialize data retention service
   */
  async initialize() {
    try {
      console.log('🗂️ Initializing Data Retention Service...');
      
      // Schedule cleanup jobs
      this.scheduleCleanupJobs();
      
      // Load retention statistics
      await this.loadRetentionStats();
      
      console.log('✅ Data Retention Service initialized');
      return { success: true };
      
    } catch (error) {
      console.error('Error initializing data retention service:', error);
      throw error;
    }
  }

  /**
   * Schedule automatic cleanup jobs
   */
  scheduleCleanupJobs() {
    // Daily cleanup (runs every 24 hours)
    setInterval(async () => {
      await this.runScheduledCleanup('daily');
    }, 24 * 60 * 60 * 1000);
    
    // Weekly cleanup (runs every 7 days)
    setInterval(async () => {
      await this.runScheduledCleanup('weekly');
    }, 7 * 24 * 60 * 60 * 1000);
    
    // Monthly cleanup (runs every 30 days)
    setInterval(async () => {
      await this.runScheduledCleanup('monthly');
    }, 30 * 24 * 60 * 60 * 1000);
    
    console.log('📅 Cleanup schedules configured');
  }

  /**
   * Run scheduled cleanup for specific frequency
   */
  async runScheduledCleanup(frequency) {
    try {
      console.log(`🧹 Running ${frequency} data cleanup...`);
      
      const collectionsToClean = this.cleanupSchedules[frequency] || [];
      const results = [];
      
      for (const collectionName of collectionsToClean) {
        try {
          const result = await this.cleanupCollection(collectionName);
          results.push({ collection: collectionName, ...result });
        } catch (error) {
          console.error(`Error cleaning ${collectionName}:`, error);
          results.push({ 
            collection: collectionName, 
            error: error.message,
            deleted: 0,
            archived: 0
          });
        }
      }
      
      // Update statistics
      this.updateCleanupStats(results);
      
      // Log cleanup completion
      await auditLogger.logEvent('DATA_RETENTION_CLEANUP', {
        frequency,
        results,
        timestamp: new Date()
      });
      
      console.log(`✅ ${frequency} cleanup completed:`, results);
      return results;
      
    } catch (error) {
      console.error(`Error during ${frequency} cleanup:`, error);
      throw error;
    }
  }

  /**
   * Clean up a specific collection based on retention policy
   */
  async cleanupCollection(collectionName) {
    try {
      const policy = this.retentionPolicies[collectionName];
      if (!policy) {
        console.warn(`No retention policy found for collection: ${collectionName}`);
        return { deleted: 0, archived: 0, skipped: 0 };
      }
      
      const now = new Date();
      const deleteCutoff = new Date(now.getTime() - (policy.retentionDays * 24 * 60 * 60 * 1000));
      const archiveCutoff = policy.archiveBeforeDelete ? 
        new Date(now.getTime() - ((policy.retentionDays - policy.archiveDays) * 24 * 60 * 60 * 1000)) : 
        null;
      
      console.log(`Cleaning ${collectionName}: Delete before ${deleteCutoff}, Archive before ${archiveCutoff}`);
      
      // Find records to process
      const recordsToDelete = await this.findRecordsToDelete(collectionName, deleteCutoff, policy.exemptions);
      const recordsToArchive = archiveCutoff ? 
        await this.findRecordsToArchive(collectionName, archiveCutoff, deleteCutoff, policy.exemptions) : 
        [];
      
      let deletedCount = 0;
      let archivedCount = 0;
      let skippedCount = 0;
      
      // Archive records first
      if (recordsToArchive.length > 0) {
        archivedCount = await this.archiveRecords(collectionName, recordsToArchive, policy);
      }
      
      // Delete expired records
      if (recordsToDelete.length > 0) {
        deletedCount = await this.deleteRecords(collectionName, recordsToDelete, policy);
      }
      
      // Clean up orphaned fields in remaining records
      if (policy.cleanupFields && policy.cleanupFields.length > 0) {
        skippedCount = await this.cleanupOrphanedFields(collectionName, policy.cleanupFields);
      }
      
      return {
        deleted: deletedCount,
        archived: archivedCount,
        skipped: skippedCount,
        policy: policy.category
      };
      
    } catch (error) {
      console.error(`Error cleaning collection ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Find records that should be deleted
   */
  async findRecordsToDelete(collectionName, cutoffDate, exemptions = []) {
    try {
      const q = query(
        collection(db, collectionName),
        where('createdAt', '<', Timestamp.fromDate(cutoffDate)),
        orderBy('createdAt'),
        limit(1000) // Process in batches
      );
      
      const snapshot = await getDocs(q);
      const records = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Check exemptions
        const isExempt = exemptions.some(exemption => {
          return data.status === exemption || 
                 data.category === exemption || 
                 data.flags?.includes(exemption) ||
                 data.exemptions?.includes(exemption);
        });
        
        if (!isExempt) {
          records.push({ id: doc.id, data });
        }
      });
      
      return records;
      
    } catch (error) {
      console.error(`Error finding records to delete in ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Find records that should be archived
   */
  async findRecordsToArchive(collectionName, archiveCutoff, deleteCutoff, exemptions = []) {
    try {
      const q = query(
        collection(db, collectionName),
        where('createdAt', '>=', Timestamp.fromDate(deleteCutoff)),
        where('createdAt', '<', Timestamp.fromDate(archiveCutoff)),
        where('archived', '!=', true),
        orderBy('createdAt'),
        limit(500) // Smaller batches for archiving
      );
      
      const snapshot = await getDocs(q);
      const records = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        
        // Check exemptions (archived records can still be exempt)
        const isExempt = exemptions.some(exemption => {
          return data.status === exemption || 
                 data.category === exemption || 
                 data.flags?.includes(exemption);
        });
        
        if (!isExempt) {
          records.push({ id: doc.id, data });
        }
      });
      
      return records;
      
    } catch (error) {
      console.error(`Error finding records to archive in ${collectionName}:`, error);
      return [];
    }
  }

  /**
   * Archive records to long-term storage
   */
  async archiveRecords(collectionName, records, policy) {
    try {
      console.log(`📦 Archiving ${records.length} records from ${collectionName}`);
      
      const batch = writeBatch(db);
      let archivedCount = 0;
      
      // Create archive entry
      const archiveEntry = {
        collectionName,
        archivedAt: new Date(),
        recordCount: records.length,
        policy: policy.category,
        records: records.map(r => ({
          id: r.id,
          createdAt: r.data.createdAt,
          size: JSON.stringify(r.data).length
        }))
      };
      
      // Store archive metadata
      await addDoc(collection(db, 'data_archives'), archiveEntry);
      
      // Update original records to mark as archived
      records.forEach(record => {
        const docRef = doc(db, collectionName, record.id);
        batch.update(docRef, {
          archived: true,
          archivedAt: serverTimestamp(),
          archivePolicy: policy.category,
          // Optionally remove large fields to save space
          ...(policy.cleanupFields.reduce((acc, field) => {
            acc[field] = null;
            return acc;
          }, {}))
        });
        archivedCount++;
      });
      
      await batch.commit();
      
      // Store full archive data (in production, this would go to cloud storage)
      if (this.archiveConfig.enabled) {
        await this.storeArchiveData(collectionName, records, archiveEntry);
      }
      
      console.log(`✅ Archived ${archivedCount} records from ${collectionName}`);
      return archivedCount;
      
    } catch (error) {
      console.error(`Error archiving records from ${collectionName}:`, error);
      return 0;
    }
  }

  /**
   * Delete expired records
   */
  async deleteRecords(collectionName, records, policy) {
    try {
      console.log(`🗑️ Deleting ${records.length} expired records from ${collectionName}`);
      
      const batch = writeBatch(db);
      let deletedCount = 0;
      
      // Log what we're about to delete for audit purposes
      await auditLogger.logEvent('DATA_RETENTION_DELETION', {
        collection: collectionName,
        recordCount: records.length,
        policy: policy.category,
        records: records.map(r => ({
          id: r.id,
          createdAt: r.data.createdAt
        }))
      });
      
      // Delete records in batches
      const batchSize = 500; // Firestore batch limit
      for (let i = 0; i < records.length; i += batchSize) {
        const batchRecords = records.slice(i, i + batchSize);
        const currentBatch = writeBatch(db);
        
        batchRecords.forEach(record => {
          const docRef = doc(db, collectionName, record.id);
          currentBatch.delete(docRef);
          deletedCount++;
        });
        
        await currentBatch.commit();
      }
      
      console.log(`✅ Deleted ${deletedCount} records from ${collectionName}`);
      return deletedCount;
      
    } catch (error) {
      console.error(`Error deleting records from ${collectionName}:`, error);
      return 0;
    }
  }

  /**
   * Clean up orphaned fields in remaining records
   */
  async cleanupOrphanedFields(collectionName, fieldsToClean) {
    try {
      // Find records with large or orphaned fields
      const q = query(
        collection(db, collectionName),
        limit(100) // Process small batches
      );
      
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      let cleanedCount = 0;
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        let needsUpdate = false;
        const updates = {};
        
        fieldsToClean.forEach(field => {
          if (data[field] && this.shouldCleanupField(data[field], data.createdAt)) {
            updates[field] = null;
            needsUpdate = true;
          }
        });
        
        if (needsUpdate) {
          batch.update(doc.ref, updates);
          cleanedCount++;
        }
      });
      
      if (cleanedCount > 0) {
        await batch.commit();
        console.log(`🧽 Cleaned up orphaned fields in ${cleanedCount} records from ${collectionName}`);
      }
      
      return cleanedCount;
      
    } catch (error) {
      console.error(`Error cleaning orphaned fields in ${collectionName}:`, error);
      return 0;
    }
  }

  /**
   * Store archive data to long-term storage
   */
  async storeArchiveData(collectionName, records, archiveEntry) {
    try {
      // In production, this would upload to Google Cloud Storage, AWS S3, etc.
      const archiveData = {
        metadata: archiveEntry,
        records: records.map(r => r.data)
      };
      
      // Compress if enabled
      let dataToStore = JSON.stringify(archiveData);
      if (this.archiveConfig.compressionEnabled) {
        // In production, use proper compression library
        dataToStore = this.compressData(dataToStore);
      }
      
      // Encrypt if enabled
      if (this.archiveConfig.encryptionEnabled) {
        // In production, use proper encryption
        dataToStore = this.encryptData(dataToStore);
      }
      
      // Store archive reference in database
      await addDoc(collection(db, 'archive_storage'), {
        collectionName,
        archiveId: archiveEntry.id || 'generated-id',
        storageLocation: `${this.archiveConfig.storageLocation}/${collectionName}/${Date.now()}.archive`,
        size: dataToStore.length,
        compressed: this.archiveConfig.compressionEnabled,
        encrypted: this.archiveConfig.encryptionEnabled,
        createdAt: serverTimestamp()
      });
      
      console.log(`💾 Archive data stored for ${collectionName}`);
      
    } catch (error) {
      console.error(`Error storing archive data for ${collectionName}:`, error);
    }
  }

  /**
   * Manual cleanup for specific collection
   */
  async manualCleanup(collectionName, options = {}) {
    try {
      const {
        dryRun = false,
        forceDelete = false,
        customRetentionDays = null
      } = options;
      
      await auditLogger.logEvent('DATA_RETENTION_MANUAL_CLEANUP', {
        collectionName,
        options,
        initiatedBy: 'manual'
      });
      
      if (dryRun) {
        // Dry run - just count what would be processed
        return await this.dryRunCleanup(collectionName, customRetentionDays);
      }
      
      // Temporarily override retention policy if custom days provided
      if (customRetentionDays) {
        const originalPolicy = this.retentionPolicies[collectionName];
        this.retentionPolicies[collectionName] = {
          ...originalPolicy,
          retentionDays: customRetentionDays
        };
        
        const result = await this.cleanupCollection(collectionName);
        
        // Restore original policy
        this.retentionPolicies[collectionName] = originalPolicy;
        
        return result;
      }
      
      return await this.cleanupCollection(collectionName);
      
    } catch (error) {
      console.error(`Error in manual cleanup for ${collectionName}:`, error);
      throw error;
    }
  }

  /**
   * Dry run cleanup to see what would be processed
   */
  async dryRunCleanup(collectionName, customRetentionDays = null) {
    try {
      const policy = this.retentionPolicies[collectionName];
      if (!policy) {
        return { error: 'No policy found' };
      }
      
      const retentionDays = customRetentionDays || policy.retentionDays;
      const now = new Date();
      const cutoffDate = new Date(now.getTime() - (retentionDays * 24 * 60 * 60 * 1000));
      
      const recordsToDelete = await this.findRecordsToDelete(collectionName, cutoffDate, policy.exemptions);
      const recordsToArchive = policy.archiveBeforeDelete ? 
        await this.findRecordsToArchive(collectionName, 
          new Date(now.getTime() - ((retentionDays - policy.archiveDays) * 24 * 60 * 60 * 1000)), 
          cutoffDate, 
          policy.exemptions) : 
        [];
      
      return {
        dryRun: true,
        wouldDelete: recordsToDelete.length,
        wouldArchive: recordsToArchive.length,
        cutoffDate,
        policy: policy.category
      };
      
    } catch (error) {
      console.error(`Error in dry run cleanup for ${collectionName}:`, error);
      return { error: error.message };
    }
  }

  /**
   * Get retention compliance status
   */
  async getComplianceStatus() {
    try {
      const status = {
        overall: 'compliant',
        collections: {},
        statistics: this.stats,
        lastChecked: new Date()
      };
      
      for (const [collectionName, policy] of Object.entries(this.retentionPolicies)) {
        const dryRun = await this.dryRunCleanup(collectionName);
        
        status.collections[collectionName] = {
          policy: policy.category,
          retentionDays: policy.retentionDays,
          expiredRecords: dryRun.wouldDelete || 0,
          archiveableRecords: dryRun.wouldArchive || 0,
          compliant: (dryRun.wouldDelete || 0) === 0
        };
        
        if (!status.collections[collectionName].compliant) {
          status.overall = 'non-compliant';
        }
      }
      
      return status;
      
    } catch (error) {
      console.error('Error getting compliance status:', error);
      throw error;
    }
  }

  /**
   * Helper methods
   */

  shouldCleanupField(fieldValue, recordCreatedAt) {
    // Clean up large fields after 30 days
    const thirtyDaysAgo = new Date(Date.now() - (30 * 24 * 60 * 60 * 1000));
    const createdDate = recordCreatedAt?.toDate ? recordCreatedAt.toDate() : new Date(recordCreatedAt);
    
    return createdDate < thirtyDaysAgo && 
           (typeof fieldValue === 'string' && fieldValue.length > 10000) ||
           (Array.isArray(fieldValue) && fieldValue.length > 100);
  }

  compressData(data) {
    // Simplified compression simulation
    return `COMPRESSED:${data.substring(0, Math.floor(data.length * 0.7))}`;
  }

  encryptData(data) {
    // Simplified encryption simulation
    return `ENCRYPTED:${btoa(data)}`;
  }

  updateCleanupStats(results) {
    this.stats.lastCleanup = new Date();
    this.stats.totalRecordsProcessed += results.reduce((sum, r) => sum + (r.deleted || 0) + (r.archived || 0), 0);
    this.stats.totalRecordsDeleted += results.reduce((sum, r) => sum + (r.deleted || 0), 0);
    this.stats.totalRecordsArchived += results.reduce((sum, r) => sum + (r.archived || 0), 0);
    this.stats.errorCount += results.filter(r => r.error).length;
  }

  async loadRetentionStats() {
    try {
      // Load existing statistics from database
      const statsQuery = query(
        collection(db, 'retention_stats'),
        orderBy('createdAt', 'desc'),
        limit(1)
      );
      
      const snapshot = await getDocs(statsQuery);
      if (!snapshot.empty) {
        const latestStats = snapshot.docs[0].data();
        this.stats = { ...this.stats, ...latestStats };
      }
    } catch (error) {
      console.warn('Could not load retention stats:', error);
    }
  }

  async saveRetentionStats() {
    try {
      await addDoc(collection(db, 'retention_stats'), {
        ...this.stats,
        createdAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error saving retention stats:', error);
    }
  }
}

// Create and export singleton instance
export const dataRetentionService = new DataRetentionService();
export default dataRetentionService; 