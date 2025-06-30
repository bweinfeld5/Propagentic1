import {
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  addDoc,
  onSnapshot,
  writeBatch,
  runTransaction,
  DocumentSnapshot,
  QuerySnapshot,
  FirestoreError,
  QueryConstraint,
  DocumentData,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  or,
  and,
  documentId
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  StatusChange,
  Communication,
  BulkOperation,
  RequestTemplate,
  ContractorRating,
  PhotoDocumentation,
  TimeTracking,
  MaintenanceMetrics,
} from '../../models';
import { 
  UserRole,
  NotificationSettings,
} from '../../models/User';
import { 
  maintenanceRequestConverter,
  createNewMaintenanceRequest,
  createNewStatusChange,
  bulkOperationConverter,
  requestTemplateConverter,
  contractorRatingConverter,
  notificationSettingsConverter,
  photoDocumentationConverter,
  timeTrackingConverter
} from '../../models/converters';
import { getFunctions, httpsCallable } from 'firebase/functions';

// Collection references with converters
const requestsCollection = collection(db, 'maintenanceRequests').withConverter(maintenanceRequestConverter);
const bulkOperationsCollection = collection(db, 'bulk_operations').withConverter(bulkOperationConverter);
const requestTemplatesCollection = collection(db, 'request_templates').withConverter(requestTemplateConverter);
const contractorRatingsCollection = collection(db, 'contractor_ratings').withConverter(contractorRatingConverter);
const notificationSettingsCollection = collection(db, 'notification_settings').withConverter(notificationSettingsConverter);

// =============================================
// ENHANCED MAINTENANCE REQUEST OPERATIONS
// =============================================

/**
 * Get a maintenance request by ID with enhanced error handling
 */
export async function getMaintenanceRequest(requestId: string): Promise<MaintenanceRequest | null> {
  try {
    const requestDoc = doc(requestsCollection, requestId);
    const requestSnapshot = await getDoc(requestDoc);
    
    if (requestSnapshot.exists()) {
      return requestSnapshot.data();
  }
  
  return null;
  } catch (error) {
    console.error('Error fetching maintenance request:', error);
    throw new Error(`Failed to fetch maintenance request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Create a comprehensive maintenance request with full data model
 */
export async function createMaintenanceRequest(
  requestData: {
    propertyId: string;
    propertyName: string;
    propertyAddress: string;
    tenantId: string;
    tenantName: string;
    tenantEmail: string;
    tenantPhone?: string;
    title: string;
    description: string;
    category: MaintenanceCategory;
    priority: MaintenancePriority;
    unitNumber?: string;
    specificLocation?: string;
    accessInstructions?: string;
    isEmergency?: boolean;
    emergencyContact?: {
      name: string;
      phone: string;
      relationship: string;
    };
    photos?: string[];
    templateUsed?: string;
  }
): Promise<MaintenanceRequest> {
  try {
    return await runTransaction(db, async (transaction) => {
      // Create new request document reference
      const requestRef = doc(requestsCollection);
      const requestId = requestRef.id;
      
      // Create the maintenance request object
      const newRequest = createNewMaintenanceRequest({
        id: requestId,
        propertyId: requestData.propertyId,
        propertyName: requestData.propertyName,
        propertyAddress: requestData.propertyAddress,
        tenantId: requestData.tenantId,
        tenantName: requestData.tenantName,
        tenantEmail: requestData.tenantEmail,
        title: requestData.title,
        description: requestData.description,
        category: requestData.category,
        priority: requestData.priority,
        unitNumber: requestData.unitNumber,
        isEmergency: requestData.isEmergency
      });
      
      // Add optional fields
      if (requestData.tenantPhone) newRequest.tenantPhone = requestData.tenantPhone;
      if (requestData.specificLocation) newRequest.specificLocation = requestData.specificLocation;
      if (requestData.accessInstructions) newRequest.accessInstructions = requestData.accessInstructions;
      if (requestData.emergencyContact) newRequest.emergencyContact = requestData.emergencyContact;
      if (requestData.templateUsed) newRequest.templateUsed = requestData.templateUsed;
      
      // Add initial status change
      const initialStatusChange = createNewStatusChange(
        'submitted',
        requestData.tenantId,
        'tenant',
        'Request submitted by tenant'
      );
      newRequest.statusHistory = [initialStatusChange];
      
      // Process photos if provided
      if (requestData.photos && requestData.photos.length > 0) {
        newRequest.photos = requestData.photos;
      }
      
      // Set the document
      transaction.set(requestRef, newRequest);
      
      // Add to property's active requests
      const propertyRef = doc(db, 'properties', requestData.propertyId);
      transaction.update(propertyRef, {
        activeRequests: arrayUnion(requestId),
        updatedAt: serverTimestamp()
      });
      
      // Update template usage count if used
      if (requestData.templateUsed) {
        const templateRef = doc(requestTemplatesCollection, requestData.templateUsed);
        transaction.update(templateRef, {
          usageCount: increment(1)
        });
      }
      
      return newRequest;
    });
  } catch (error) {
    console.error('Error creating maintenance request:', error);
    throw new Error(`Failed to create maintenance request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Real-time listener for maintenance requests with filtering
 */
export function subscribeToMaintenanceRequests(
  filters: {
    propertyIds?: string[];
    tenantId?: string;
    contractorId?: string;
    status?: MaintenanceStatus[];
    priority?: MaintenancePriority[];
    category?: MaintenanceCategory[];
    isEmergency?: boolean;
    limit?: number;
  },
  callback: (requests: MaintenanceRequest[]) => void,
  onError?: (error: FirestoreError) => void
): () => void {
  try {
    // Validate filters
    if (!filters || typeof filters !== 'object') {
      console.warn('Invalid filters provided to subscribeToMaintenanceRequests');
      if (onError) {
        onError(new Error('Invalid filters') as FirestoreError);
      }
      return () => {};
    }

    // Build query constraints
    const constraints: QueryConstraint[] = [];
    
    // Property filter (most common filter, so it goes first for efficiency)
    if (filters.propertyIds && Array.isArray(filters.propertyIds) && filters.propertyIds.length > 0) {
      if (filters.propertyIds.length === 1) {
        constraints.push(where('propertyId', '==', filters.propertyIds[0]));
      } else {
        // For multiple properties, we'll need to use 'in' operator (max 10 values)
        const chunks = [];
        for (let i = 0; i < filters.propertyIds.length; i += 10) {
          chunks.push(filters.propertyIds.slice(i, i + 10));
        }
        if (chunks.length === 1) {
          constraints.push(where('propertyId', 'in', chunks[0]));
        } else {
          // For more than 10 properties, we'll need multiple queries
          console.warn('More than 10 properties requested, using first 10 only');
          constraints.push(where('propertyId', 'in', chunks[0]));
        }
      }
    }
    
    // User-specific filters
    if (filters.tenantId && typeof filters.tenantId === 'string') {
      constraints.push(where('tenantId', '==', filters.tenantId));
    }
    
    if (filters.contractorId && typeof filters.contractorId === 'string') {
      constraints.push(where('contractorId', '==', filters.contractorId));
    }

    // Status filter
    if (filters.status && Array.isArray(filters.status) && filters.status.length > 0) {
        constraints.push(where('status', 'in', filters.status));
    }

    // Priority filter
    if (filters.priority && Array.isArray(filters.priority) && filters.priority.length > 0) {
        constraints.push(where('priority', 'in', filters.priority));
    }

    // Category filter
    if (filters.category && Array.isArray(filters.category) && filters.category.length > 0) {
        constraints.push(where('category', 'in', filters.category));
    }

    // Emergency filter
    if (typeof filters.isEmergency === 'boolean') {
      constraints.push(where('isEmergency', '==', filters.isEmergency));
    }

    // Add limit with validation
    if (filters.limit && typeof filters.limit === 'number' && filters.limit > 0) {
      constraints.push(limit(Math.min(filters.limit, 1000))); // Cap at 1000 for safety
    }

    // Create query
    const q = query(requestsCollection, ...constraints);

    // Set up snapshot listener
    return onSnapshot(q, 
      (snapshot: QuerySnapshot<MaintenanceRequest>) => {
        try {
          const requests = snapshot.docs.map(doc => {
            try {
              return doc.data();
            } catch (docError) {
              console.warn('Error processing document:', doc.id, docError);
              return null;
            }
          }).filter(Boolean); // Filter out null values
          callback(requests as MaintenanceRequest[]);
        } catch (snapshotError) {
          console.error('Error processing snapshot:', snapshotError);
          if (onError) {
            onError(snapshotError as FirestoreError);
          }
        }
      },
      (error: FirestoreError) => {
        console.error('Error in maintenance request listener:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  } catch (error) {
    console.error('Failed to subscribe to maintenance requests:', error);
    if (onError) {
      onError(error as FirestoreError);
    }
    return () => {}; // Return no-op unsubscribe function
  }
}

/**
 * Flexible search for maintenance requests
 */
export async function searchMaintenanceRequests(
  searchParams: {
    query?: string; // Search in title and description
    propertyIds?: string[];
    dateRange?: {
      start: Date;
      end: Date;
    };
    status?: MaintenanceStatus[];
    priority?: MaintenancePriority[];
    category?: MaintenanceCategory[];
    assignedContractor?: string;
    isEmergency?: boolean;
    sortBy?: 'createdAt' | 'updatedAt' | 'priority' | 'status';
    sortOrder?: 'asc' | 'desc';
    page?: number;
    pageSize?: number;
  }
): Promise<{
  requests: MaintenanceRequest[];
  hasMore: boolean;
  total: number;
  nextCursor?: DocumentSnapshot;
}> {
  // Implementation for search...
  return { requests: [], hasMore: false, total: 0 };
}


/**
 * Update the status of a maintenance request and log the change
 */
export async function updateMaintenanceRequestStatus(
  requestId: string,
  newStatus: MaintenanceStatus,
  userId: string,
  userRole: UserRole,
  notes?: string,
  additionalData?: {
    contractorId?: string;
    scheduledDate?: Date;
    estimatedCompletion?: Date;
    costEstimate?: number;
  }
): Promise<void> {
  try {
    const requestRef = doc(requestsCollection, requestId);
    const now = Timestamp.now();
    
    // Create status change entry
    const statusChange = createNewStatusChange(newStatus, userId, userRole, notes);
    
    // Prepare update data
    const updates: { [key: string]: any } = {
      status: newStatus,
      lastStatusChange: now,
      updatedAt: now,
      statusHistory: arrayUnion(statusChange)
    };
    
    // Add additional data based on status
    if (newStatus === 'assigned' && additionalData?.contractorId) {
      updates.contractorId = additionalData.contractorId;
      updates.assignedDate = now;
    }
    if (newStatus === 'in-progress' && additionalData?.scheduledDate) {
      updates.scheduledDate = Timestamp.fromDate(additionalData.scheduledDate);
    }
    if (newStatus === 'completed') {
      updates.completedDate = now;
    }
    if (additionalData?.costEstimate) {
      updates.estimatedCost = additionalData.costEstimate;
    }

    await updateDoc(requestRef, updates);

  } catch (error) {
    console.error(`Error updating status for request ${requestId}:`, error);
    throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}


/**
 * Execute a bulk operation on multiple maintenance requests
 */
export async function executeBulkOperation(
  requestIds: string[],
  operation: BulkOperation['operationType'],
  parameters: BulkOperation['parameters'],
  initiatedBy: string
): Promise<BulkOperation> {
  const batch = writeBatch(db);
  const now = Timestamp.now();
  
  const results = {
    successful: [] as string[],
    failed: [] as { requestId: string; error: string }[],
  };

  for (const requestId of requestIds) {
    try {
      const requestRef = doc(requestsCollection, requestId);
      let updateData: { [key: string]: any } = { updatedAt: now };
      
      switch (operation) {
        case 'assign_contractor':
          if (parameters.contractorId) {
            updateData.contractorId = parameters.contractorId;
            updateData.status = 'assigned';
            updateData.statusHistory = arrayUnion(
              createNewStatusChange(
                'assigned',
                initiatedBy,
                `Assigned to contractor ID: ${parameters.contractorId}` as any
              )
            );
          }
          break;
        case 'change_priority':
          if (parameters.priority) {
            updateData.priority = parameters.priority;
            updateData.statusHistory = arrayUnion(
              createNewStatusChange(
                'pending',
                initiatedBy,
                `Priority changed to ${parameters.priority}. ${parameters.notes || ''}` as any
              )
            );
          }
          break;
        case 'change_status':
          if (parameters.status) {
            updateData.status = parameters.status;
            updateData.statusHistory = arrayUnion(
              createNewStatusChange(
                parameters.status as MaintenanceStatus,
                initiatedBy,
                parameters.notes || ''
              )
            );
      }
      break;
        case 'archive':
          updateData.isArchived = true;
          break;
        case 'mark_completed':
             updateData.status = 'completed';
             updateData.completedDate = now;
             updateData.statusHistory = arrayUnion(
               createNewStatusChange(
                 'completed',
                 initiatedBy,
                 parameters.notes || ''
               )
             );
      break;
  }
  
      batch.update(requestRef, updateData);
      results.successful.push(requestId);
    } catch (error) {
      results.failed.push({
        requestId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create bulk operation log
  const bulkOperationData: BulkOperation = {
    id: doc(bulkOperationsCollection).id,
    operationType: operation,
    parameters,
    initiatedBy,
    timestamp: now,
    targetRequestIds: requestIds,
    status: results.failed.length > 0 ? 'failed' : 'completed',
    results,
  };
  const bulkOpRef = doc(bulkOperationsCollection, bulkOperationData.id);
  batch.set(bulkOpRef, bulkOperationData);

  await batch.commit();
  return bulkOperationData;
}


/**
 * Get aggregated maintenance metrics for properties
 */
export async function getMaintenanceMetrics(
  propertyIds?: string[],
  timeRange?: {
    start: Date;
    end: Date;
  }
): Promise<MaintenanceMetrics> {
    // Implementation for metrics...
    return {
        averageResolutionTime: 0, // in hours
        requestsCompleted: 0,
        requestsPending: 0,
        satisfactionScore: 0, // average rating
    };
}

/**
 * Fetches multiple maintenance requests from a list of IDs.
 * @param {string[]} requestIds - An array of maintenance request document IDs.
 * @returns {Promise<any[]>} A promise that resolves to an array of maintenance request objects.
 */
export async function getMaintenanceRequestsByIds(requestIds: string[]): Promise<any[]> {
  if (!requestIds || requestIds.length === 0) {
    return [];
  }

  // Firestore 'in' queries are limited to 30 items. 
  // We'll process the IDs in chunks to handle any number of requests.
  const chunks = [];
  for (let i = 0; i < requestIds.length; i += 30) {
    chunks.push(requestIds.slice(i, i + 30));
  }

  const allRequests: any[] = [];
  for (const chunk of chunks) {
    try {
      const q = query(
        collection(db, 'maintenanceRequests'),
        where(documentId(), 'in', chunk)
      );
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach(doc => {
        allRequests.push({ id: doc.id, ...doc.data() });
      });
    } catch (error) {
      console.error("Error fetching maintenance requests chunk: ", error);
      // Continue with other chunks even if one fails
    }
  }
  
  return allRequests;
}

// Helper functions for metrics calculation (can be moved to a separate file)
function calculateAverageResponseTime(requests: MaintenanceRequest[]): number {
    // Implementation
    return 0;
}

function calculateAverageCompletionTime(requests: MaintenanceRequest[]): number {
    // Implementation
    return 0;
}

function calculateCompletionRate(requests: MaintenanceRequest[]): number {
  if (requests.length === 0) return 0;
  const completed = requests.filter(r => r.status === 'completed').length;
  return (completed / requests.length) * 100;
}

function calculateTenantSatisfactionAverage(requests: MaintenanceRequest[]): number {
    // Implementation
    return 0;
}

function calculateBudgetVariance(requests: MaintenanceRequest[]): number {
    // Implementation
    return 0;
}

function calculateContractorPerformance(requests: MaintenanceRequest[]): any[] {
    // Implementation
    return [];
}

/**
 * Delete a maintenance request by ID
 */
export async function deleteMaintenanceRequest(requestId: string): Promise<void> {
  try {
    return await runTransaction(db, async (transaction) => {
      // Get the request first to check if it exists and get its propertyId
      const requestRef = doc(requestsCollection, requestId);
      const requestDoc = await transaction.get(requestRef);
      
      if (!requestDoc.exists()) {
        throw new Error('Maintenance request not found');
      }
      
      const requestData = requestDoc.data();
      
      // Delete the maintenance request document
      transaction.delete(requestRef);
      
      // Remove from property's active requests if it exists
      if (requestData.propertyId) {
        const propertyRef = doc(db, 'properties', requestData.propertyId);
        transaction.update(propertyRef, {
          activeRequests: arrayRemove(requestId),
          updatedAt: serverTimestamp()
        });
      }
      
      // If the request was assigned to a contractor, remove it from their contractorProfile
      if (requestData.contractorId) {
        const contractorProfileRef = doc(db, 'contractorProfiles', requestData.contractorId);
        const contractorProfileDoc = await transaction.get(contractorProfileRef);
        
        if (contractorProfileDoc.exists()) {
          const contractorData = contractorProfileDoc.data();
          
          // Remove from both legacy field and new contracts structure
          const updateData: any = {
            maintenanceRequests: arrayRemove(requestId), // Legacy field
            updatedAt: serverTimestamp()
          };
          
          // Remove from appropriate contracts array
          if (contractorData.contracts) {
            const contracts = contractorData.contracts;
            if (contracts.pending?.includes(requestId)) {
              updateData['contracts.pending'] = arrayRemove(requestId);
            }
            if (contracts.ongoing?.includes(requestId)) {
              updateData['contracts.ongoing'] = arrayRemove(requestId);
            }
            if (contracts.finished?.includes(requestId)) {
              updateData['contracts.finished'] = arrayRemove(requestId);
            }
          }
          
          transaction.update(contractorProfileRef, updateData);
        }
      }
    });
  } catch (error) {
    console.error('Error deleting maintenance request:', error);
    throw new Error(`Failed to delete maintenance request: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export const maintenanceService = {
  // Core CRUD operations
  getMaintenanceRequest,
  getMaintenanceRequestsByIds,
  createMaintenanceRequest,
  deleteMaintenanceRequest,
  searchMaintenanceRequests,
  updateMaintenanceRequestStatus,
  
  // Real-time listeners
  subscribeToMaintenanceRequests,
  
  // Bulk operations
  executeBulkOperation,
  
  // Metrics and analytics
  getMaintenanceMetrics,
  
  // Contractor / Landlord / Tenant real-time subscriptions (stubs)
  subscribeToContractorJobsByStatus: (
    contractorId: string,
    onUpdate: (jobsByStatus: { pending: MaintenanceRequest[], ongoing: MaintenanceRequest[], finished: MaintenanceRequest[] }, available: MaintenanceRequest[]) => void,
    onError?: (error: any) => void
  ): (() => void) => {
    try {
      console.log('🔍 MaintenanceService - Subscribing to contractor jobs by status for:', contractorId);
      
      let jobsByStatus: { pending: MaintenanceRequest[], ongoing: MaintenanceRequest[], finished: MaintenanceRequest[] } = {
        pending: [],
        ongoing: [],
        finished: []
      };
      let availableRequests: MaintenanceRequest[] = [];

      // Subscribe to contractor profile document to get contracts structure
      const contractorProfileRef = doc(db, 'contractorProfiles', contractorId);
      const unsubscribeContractorJobs = onSnapshot(contractorProfileRef, async (contractorProfileDoc) => {
        try {
          if (contractorProfileDoc.exists()) {
            const contractorProfileData = contractorProfileDoc.data();
            const contracts = contractorProfileData.contracts || { pending: [], ongoing: [], finished: [] };
            
            console.log('🔍 MaintenanceService - Contractor profile contracts received:', {
              contractorId,
              pending: contracts.pending?.length || 0,
              ongoing: contracts.ongoing?.length || 0,
              finished: contracts.finished?.length || 0,
              contracts
            });

            // Fetch maintenance request details for all contract arrays
            const [pendingRequests, ongoingRequests, finishedRequests] = await Promise.all([
              contracts.pending?.length > 0 ? getMaintenanceRequestsByIds(contracts.pending) : [],
              contracts.ongoing?.length > 0 ? getMaintenanceRequestsByIds(contracts.ongoing) : [],
              contracts.finished?.length > 0 ? getMaintenanceRequestsByIds(contracts.finished) : []
            ]);

            jobsByStatus = {
              pending: pendingRequests || [],
              ongoing: ongoingRequests || [],
              finished: finishedRequests || []
            };

            console.log('🔍 MaintenanceService - Fetched job details by status:', {
              pendingJobs: jobsByStatus.pending.length,
              ongoingJobs: jobsByStatus.ongoing.length,
              finishedJobs: jobsByStatus.finished.length,
              pendingIds: jobsByStatus.pending.map(j => j.id),
              ongoingIds: jobsByStatus.ongoing.map(j => j.id),
              finishedIds: jobsByStatus.finished.map(j => j.id)
            });

            // Call the update function with categorized data
            onUpdate(jobsByStatus, availableRequests);
          } else {
            console.log('🔍 MaintenanceService - Contractor profile document not found:', contractorId);
            jobsByStatus = { pending: [], ongoing: [], finished: [] };
            onUpdate(jobsByStatus, availableRequests);
          }
        } catch (error) {
          console.error('🔍 MaintenanceService - Error processing contractor jobs by status:', error);
          if (onError) onError(error);
        }
      }, (error) => {
        console.error('🔍 MaintenanceService - Contractor profile snapshot error:', error);
        if (onError) onError(error);
      });
      
      // Subscribe to available jobs (jobs that are unassigned)
      const unsubscribeAvailable = subscribeToMaintenanceRequests(
        {
          status: ['pending'],
          limit: 20
        },
        (available) => {
          console.log('🔍 MaintenanceService - Available jobs received:', {
            count: available.length,
            jobs: available.map(j => ({ 
              id: j.id, 
              status: j.status, 
              contractorId: j.contractorId,
              title: j.title,
              description: j.description?.substring(0, 50) 
            }))
          });
          
          // Filter out any requests that might already be assigned to this contractor
          availableRequests = available.filter(req => 
            !req.contractorId || req.contractorId !== contractorId
          );
          
          console.log('🔍 MaintenanceService - Filtered available jobs:', {
            originalCount: available.length,
            filteredCount: availableRequests.length
          });
          
          // Call update with current job status categories and new available jobs
          onUpdate(jobsByStatus, availableRequests);
        },
        onError
      );
      
      // Return a combined unsubscribe function
      return () => {
        unsubscribeContractorJobs();
        unsubscribeAvailable();
      };
    } catch (error) {
      console.error('Error subscribing to contractor jobs by status:', error);
      if (onError) onError(error);
      return () => {};
    }
  },
  subscribeToContractorJobs: (
    contractorId: string,
    onUpdate: (assigned: MaintenanceRequest[], available: MaintenanceRequest[]) => void,
    onError?: (error: any) => void
  ): (() => void) => {
    try {
      console.log('🔍 MaintenanceService - Subscribing to contractor jobs for:', contractorId);
      
      let allJobsByStatus: { pending: MaintenanceRequest[], ongoing: MaintenanceRequest[], finished: MaintenanceRequest[] } = {
        pending: [],
        ongoing: [],
        finished: []
      };
      let availableRequests: MaintenanceRequest[] = [];

      // Subscribe to contractor profile document to get contracts structure
      const contractorProfileRef = doc(db, 'contractorProfiles', contractorId);
      const unsubscribeContractorJobs = onSnapshot(contractorProfileRef, async (contractorProfileDoc) => {
        try {
          if (contractorProfileDoc.exists()) {
            const contractorProfileData = contractorProfileDoc.data();
            const contracts = contractorProfileData.contracts || { pending: [], ongoing: [], finished: [] };
            
            console.log('🔍 MaintenanceService - Contractor profile contracts received:', {
              contractorId,
              pending: contracts.pending?.length || 0,
              ongoing: contracts.ongoing?.length || 0,
              finished: contracts.finished?.length || 0,
              contracts
            });

            // Fetch maintenance request details for all contract arrays
            const [pendingRequests, ongoingRequests, finishedRequests] = await Promise.all([
              contracts.pending?.length > 0 ? getMaintenanceRequestsByIds(contracts.pending) : [],
              contracts.ongoing?.length > 0 ? getMaintenanceRequestsByIds(contracts.ongoing) : [],
              contracts.finished?.length > 0 ? getMaintenanceRequestsByIds(contracts.finished) : []
            ]);

            allJobsByStatus = {
              pending: pendingRequests || [],
              ongoing: ongoingRequests || [],
              finished: finishedRequests || []
            };

            console.log('🔍 MaintenanceService - Fetched job details:', {
              pendingJobs: allJobsByStatus.pending.length,
              ongoingJobs: allJobsByStatus.ongoing.length,
              finishedJobs: allJobsByStatus.finished.length,
              pendingIds: allJobsByStatus.pending.map(j => j.id),
              ongoingIds: allJobsByStatus.ongoing.map(j => j.id),
              finishedIds: allJobsByStatus.finished.map(j => j.id)
            });

            // Combine all assigned jobs for backward compatibility
            const assignedJobs = [...allJobsByStatus.pending, ...allJobsByStatus.ongoing, ...allJobsByStatus.finished];
            
            // Call the update function with new data
            onUpdate(assignedJobs, availableRequests);
          } else {
            console.log('🔍 MaintenanceService - Contractor profile document not found:', contractorId);
            allJobsByStatus = { pending: [], ongoing: [], finished: [] };
            onUpdate([], availableRequests);
          }
        } catch (error) {
          console.error('🔍 MaintenanceService - Error processing contractor jobs:', error);
          if (onError) onError(error);
        }
      }, (error) => {
        console.error('🔍 MaintenanceService - Contractor profile snapshot error:', error);
        if (onError) onError(error);
      });
      
      // Subscribe to available jobs (jobs that are unassigned)
      const unsubscribeAvailable = subscribeToMaintenanceRequests(
        {
          status: ['pending'],
          limit: 20
        },
        (available) => {
          console.log('🔍 MaintenanceService - Available jobs received:', {
            count: available.length,
            jobs: available.map(j => ({ 
              id: j.id, 
              status: j.status, 
              contractorId: j.contractorId,
              title: j.title,
              description: j.description?.substring(0, 50) 
            }))
          });
          
          // Filter out any requests that might already be assigned to this contractor
          availableRequests = available.filter(req => 
            !req.contractorId || req.contractorId !== contractorId
          );
          
          console.log('🔍 MaintenanceService - Filtered available jobs:', {
            originalCount: available.length,
            filteredCount: availableRequests.length
          });
          
          // Call update with current assigned jobs and new available jobs
          const assignedJobs = [...allJobsByStatus.pending, ...allJobsByStatus.ongoing, ...allJobsByStatus.finished];
          onUpdate(assignedJobs, availableRequests);
        },
        onError
      );
      
      // Return a combined unsubscribe function
      return () => {
        unsubscribeContractorJobs();
        unsubscribeAvailable();
      };
    } catch (error) {
      console.error('Error subscribing to contractor jobs:', error);
      if (onError) onError(error);
      return () => {};
    }
  },
  subscribeToLandlordRequests: async (
    landlordId: string,
    onUpdate: (requests: MaintenanceRequest[]) => void,
    onError?: (error: any) => void
  ): Promise<() => void> => {
    console.warn('subscribeToLandlordRequests stub called');
    return () => {};
  },
  subscribeToTenantRequests: async (
    tenantId: string,
    onUpdate: (requests: MaintenanceRequest[]) => void,
    onError?: (error: any) => void
  ): Promise<() => void> => {
    console.warn('subscribeToTenantRequests stub called');
    return () => {};
  },
  assignContractor: async (requestId: string, contractorId: string): Promise<void> => {
    try {
      const functions = getFunctions();
      const assignContractorFunction = httpsCallable(functions, 'assignContractorToRequest');
      
      await assignContractorFunction({ requestId, contractorId });
      console.log(`Successfully assigned contractor ${contractorId} to request ${requestId}`);
    } catch (error) {
      console.error('Error assigning contractor:', error);
      throw new Error(`Failed to assign contractor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  acceptJob: async (requestId: string, contractorId: string): Promise<void> => {
    try {
      await updateMaintenanceRequestStatus(
        requestId,
        'in-progress',
        contractorId,
        'contractor',
        'Job accepted by contractor'
      );
      console.log(`Contractor ${contractorId} accepted job ${requestId}`);
    } catch (error) {
      console.error('Error accepting job:', error);
      throw new Error(`Failed to accept job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  declineJob: async (requestId: string, contractorId: string, reason: string): Promise<void> => {
    try {
      // Update status back to pending and add note about decline
      await updateMaintenanceRequestStatus(
        requestId,
        'pending',
        contractorId,
        'contractor',
        `Job declined by contractor. Reason: ${reason}`,
        { contractorId: undefined } // Remove contractor assignment
      );
      
      // Remove contractorId from the request
      const requestRef = doc(requestsCollection, requestId);
      await updateDoc(requestRef, {
        contractorId: null,
        assignedDate: null
      });
      
      console.log(`Contractor ${contractorId} declined job ${requestId}`);
    } catch (error) {
      console.error('Error declining job:', error);
      throw new Error(`Failed to decline job: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
  startJob: async (requestId: string, contractorId: string): Promise<void> => {
    console.warn('startJob stub called');
  },
  completeJob: async (requestId: string, contractorId: string, notes: string): Promise<void> => {
    console.warn('completeJob stub called');
  },
  uploadProgressPhotos: async (
    requestId: string,
    photos: File[],
    onProgress: (progress: number) => void
  ): Promise<string[]> => {
    console.warn('uploadProgressPhotos stub called');
    return [];
  },
  submitRating: async (requestId: string, rating: any): Promise<void> => {
    console.warn('submitRating stub called');
  },
  bulkUpdateStatus: async (requestIds: string[], status: MaintenanceStatus): Promise<void> => {
    console.warn('bulkUpdateStatus stub called');
  }
};

export default maintenanceService; 