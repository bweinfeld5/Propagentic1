import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
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
  and
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MaintenanceTicket, TicketStatus } from '../../models/schema';
import { 
  MaintenanceRequest,
  MaintenanceStatus,
  MaintenancePriority,
  MaintenanceCategory,
  StatusChange,
  Communication,
  ContractorMaintenanceProfile,
  BulkOperation,
  RequestTemplate,
  ContractorRating,
  NotificationSettings,
  PhotoDocumentation,
  TimeTracking,
  MaintenanceMetrics,
  UserRole
} from '../../types/maintenance';
import { 
  maintenanceTicketConverter, 
  createNewMaintenanceTicket,
  maintenanceRequestConverter,
  createNewMaintenanceRequest,
  createNewStatusChange,
  createNewCommunication,
  contractorMaintenanceProfileConverter,
  bulkOperationConverter,
  requestTemplateConverter,
  contractorRatingConverter,
  notificationSettingsConverter,
  photoDocumentationConverter,
  timeTrackingConverter
} from '../../models/converters';
import { addMaintenanceRequestToProperty, removeMaintenanceRequestFromProperty } from './propertyMaintenanceService';

// Collection references with converters
const ticketsCollection = collection(db, 'tickets').withConverter(maintenanceTicketConverter);
const requestsCollection = collection(db, 'maintenance_requests').withConverter(maintenanceRequestConverter);
const contractorProfilesCollection = collection(db, 'contractor_maintenance_profiles').withConverter(contractorMaintenanceProfileConverter);
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
        newRequest.photos = requestData.photos.map((url, index) => ({
          id: `${requestId}_photo_${index}`,
          url,
          uploadedBy: requestData.tenantId,
          uploadedAt: serverTimestamp() as Timestamp,
          photoType: 'problem' as const,
          description: `Problem photo ${index + 1}`,
          metadata: {
            fileSize: 0,
            mimeType: 'image/jpeg',
            originalName: `photo_${index + 1}.jpg`
          }
        }));
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
    // Build query constraints
    const constraints: QueryConstraint[] = [];
    
    // Property filter (most common filter, so it goes first for efficiency)
    if (filters.propertyIds && filters.propertyIds.length > 0) {
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
    if (filters.tenantId) {
      constraints.push(where('tenantId', '==', filters.tenantId));
    }
    
    if (filters.contractorId) {
      constraints.push(where('contractorId', '==', filters.contractorId));
    }
    
    // Status filter
    if (filters.status && filters.status.length > 0) {
      if (filters.status.length === 1) {
        constraints.push(where('status', '==', filters.status[0]));
      } else {
        constraints.push(where('status', 'in', filters.status));
      }
    }
    
    // Priority filter
    if (filters.priority && filters.priority.length > 0) {
      if (filters.priority.length === 1) {
        constraints.push(where('priority', '==', filters.priority[0]));
      } else {
        constraints.push(where('priority', 'in', filters.priority));
      }
    }
    
    // Emergency filter
    if (filters.isEmergency !== undefined) {
      constraints.push(where('isEmergency', '==', filters.isEmergency));
    }
    
    // Always order by creation date (newest first)
    constraints.push(orderBy('createdAt', 'desc'));
    
    // Apply limit
    if (filters.limit) {
      constraints.push(limit(filters.limit));
    }
    
    // Create the query
    const q = query(requestsCollection, ...constraints);
    
    // Set up the listener
    return onSnapshot(
      q,
      (snapshot: QuerySnapshot<MaintenanceRequest>) => {
        const requests = snapshot.docs.map(doc => doc.data());
        
        // Apply category filter in memory (since Firestore doesn't support multiple array-contains)
        const filteredRequests = filters.category && filters.category.length > 0
          ? requests.filter(request => filters.category!.includes(request.category))
          : requests;
        
        callback(filteredRequests);
      },
      (error: FirestoreError) => {
        console.error('Error in maintenance requests listener:', error);
        if (onError) {
          onError(error);
        }
      }
    );
  } catch (error) {
    console.error('Error setting up maintenance requests listener:', error);
    throw new Error(`Failed to set up listener: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Advanced search for maintenance requests
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
  try {
    // Build base query constraints
    const constraints: QueryConstraint[] = [];
    
    // Property filter
    if (searchParams.propertyIds && searchParams.propertyIds.length > 0) {
      if (searchParams.propertyIds.length === 1) {
        constraints.push(where('propertyId', '==', searchParams.propertyIds[0]));
      } else {
        constraints.push(where('propertyId', 'in', searchParams.propertyIds.slice(0, 10)));
      }
    }
    
    // Date range filter
    if (searchParams.dateRange) {
      constraints.push(
        where('createdAt', '>=', Timestamp.fromDate(searchParams.dateRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(searchParams.dateRange.end))
      );
    }
    
    // Status filter
    if (searchParams.status && searchParams.status.length > 0) {
      constraints.push(where('status', 'in', searchParams.status));
    }
    
    // Priority filter
    if (searchParams.priority && searchParams.priority.length > 0) {
      constraints.push(where('priority', 'in', searchParams.priority));
    }
    
    // Assigned contractor filter
    if (searchParams.assignedContractor) {
      constraints.push(where('contractorId', '==', searchParams.assignedContractor));
    }
    
    // Emergency filter
    if (searchParams.isEmergency !== undefined) {
      constraints.push(where('isEmergency', '==', searchParams.isEmergency));
    }
    
    // Sorting
    const sortBy = searchParams.sortBy || 'createdAt';
    const sortOrder = searchParams.sortOrder || 'desc';
    constraints.push(orderBy(sortBy, sortOrder));
    
    // Pagination
    const pageSize = searchParams.pageSize || 20;
    constraints.push(limit(pageSize + 1)); // Get one extra to check if there are more
    
    // Create and execute query
    const q = query(requestsCollection, ...constraints);
    const snapshot = await getDocs(q);
    
    let requests = snapshot.docs.map(doc => doc.data());
    
    // Apply text search in memory (since Firestore doesn't have full-text search)
    if (searchParams.query) {
      const searchTerm = searchParams.query.toLowerCase();
      requests = requests.filter(request => 
        request.title.toLowerCase().includes(searchTerm) ||
        request.description.toLowerCase().includes(searchTerm) ||
        request.propertyName.toLowerCase().includes(searchTerm)
      );
    }
    
    // Apply category filter in memory
    if (searchParams.category && searchParams.category.length > 0) {
      requests = requests.filter(request => 
        searchParams.category!.includes(request.category)
      );
    }
    
    // Check if there are more results
    const hasMore = requests.length > pageSize;
    if (hasMore) {
      requests = requests.slice(0, pageSize);
    }
    
    return {
      requests,
      hasMore,
      total: requests.length, // This is approximate since we're doing client-side filtering
      nextCursor: hasMore ? snapshot.docs[pageSize - 1] : undefined
    };
  } catch (error) {
    console.error('Error searching maintenance requests:', error);
    throw new Error(`Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Update maintenance request status with full audit trail
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
    await runTransaction(db, async (transaction) => {
      const requestRef = doc(requestsCollection, requestId);
      const requestSnapshot = await transaction.get(requestRef);
      
      if (!requestSnapshot.exists()) {
        throw new Error('Maintenance request not found');
      }
      
      const currentRequest = requestSnapshot.data();
      const now = serverTimestamp() as Timestamp;
      
      // Create status change entry
      const statusChange = createNewStatusChange(
        newStatus,
        userId,
        userRole,
        notes
      );
      
      // Prepare update data
      const updateData: Partial<MaintenanceRequest> = {
        status: newStatus,
        lastStatusChange: now,
        updatedAt: now,
        statusHistory: arrayUnion(statusChange)
      };
      
      // Add additional data based on status
      if (additionalData) {
        if (additionalData.contractorId) {
          updateData.contractorId = additionalData.contractorId;
        }
        if (additionalData.scheduledDate) {
          updateData.scheduledDate = Timestamp.fromDate(additionalData.scheduledDate);
        }
        if (additionalData.costEstimate) {
          updateData.estimatedCost = additionalData.costEstimate;
        }
      }
      
      // Handle status-specific logic
      switch (newStatus) {
        case 'completed':
          updateData.completedDate = now;
          // Remove from property's active requests
          transaction.update(doc(db, 'properties', currentRequest.propertyId), {
            activeRequests: arrayRemove(requestId)
          });
          break;
          
        case 'cancelled':
          // Remove from property's active requests
          transaction.update(doc(db, 'properties', currentRequest.propertyId), {
            activeRequests: arrayRemove(requestId)
          });
          break;
          
        case 'assigned':
          if (additionalData?.contractorId) {
            // Update contractor's active jobs count
            const contractorProfileRef = doc(contractorProfilesCollection, additionalData.contractorId);
            transaction.update(contractorProfileRef, {
              'performance.totalJobs': increment(1)
            });
          }
          break;
      }
      
      // Update the request
      transaction.update(requestRef, updateData);
    });
  } catch (error) {
    console.error('Error updating maintenance request status:', error);
    throw new Error(`Failed to update status: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Bulk operations for maintenance requests
 */
export async function executeBulkOperation(
  requestIds: string[],
  operation: BulkOperation['operationType'],
  parameters: BulkOperation['parameters'],
  initiatedBy: string
): Promise<BulkOperation> {
  try {
    return await runTransaction(db, async (transaction) => {
      // Create bulk operation record
      const bulkOpRef = doc(bulkOperationsCollection);
      const bulkOpId = bulkOpRef.id;
      
      const bulkOperation: BulkOperation = {
        id: bulkOpId,
        operationType: operation,
        requestIds,
        parameters,
        initiatedBy,
        initiatedAt: serverTimestamp() as Timestamp,
        status: 'in_progress',
        results: {
          successful: [],
          failed: []
        }
      };
      
      // Process each request
      for (const requestId of requestIds) {
        try {
          const requestRef = doc(requestsCollection, requestId);
          const requestSnapshot = await transaction.get(requestRef);
          
          if (!requestSnapshot.exists()) {
            bulkOperation.results.failed.push({
              requestId,
              error: 'Request not found'
            });
            continue;
          }
          
          const updateData: Partial<MaintenanceRequest> = {
            updatedAt: serverTimestamp() as Timestamp
          };
          
          // Apply operation-specific updates
          switch (operation) {
            case 'assign_contractor':
              if (parameters.contractorId) {
                updateData.contractorId = parameters.contractorId;
                updateData.status = 'assigned';
                updateData.statusHistory = arrayUnion(
                  createNewStatusChange(
                    'assigned',
                    initiatedBy,
                    'landlord',
                    parameters.notes || 'Bulk assigned contractor'
                  )
                );
              }
              break;
              
            case 'update_status':
              if (parameters.status) {
                updateData.status = parameters.status;
                updateData.statusHistory = arrayUnion(
                  createNewStatusChange(
                    parameters.status,
                    initiatedBy,
                    'landlord',
                    parameters.notes || 'Bulk status update'
                  )
                );
              }
              break;
              
            case 'update_priority':
              if (parameters.priority) {
                updateData.priority = parameters.priority;
                updateData.statusHistory = arrayUnion(
                  createNewStatusChange(
                    requestSnapshot.data().status,
                    initiatedBy,
                    'landlord',
                    `Priority changed to ${parameters.priority}. ${parameters.notes || ''}`
                  )
                );
              }
              break;
              
            case 'close_requests':
              updateData.status = 'completed';
              updateData.completedDate = serverTimestamp() as Timestamp;
              updateData.statusHistory = arrayUnion(
                createNewStatusChange(
                  'completed',
                  initiatedBy,
                  'landlord',
                  parameters.notes || 'Bulk closed'
                )
              );
              break;
          }
          
          transaction.update(requestRef, updateData);
          bulkOperation.results.successful.push(requestId);
        } catch (error) {
          bulkOperation.results.failed.push({
            requestId,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
      
      // Update bulk operation status
      bulkOperation.status = 'completed';
      bulkOperation.completedAt = serverTimestamp() as Timestamp;
      
      // Save bulk operation record
      transaction.set(bulkOpRef, bulkOperation);
      
      return bulkOperation;
    });
  } catch (error) {
    console.error('Error executing bulk operation:', error);
    throw new Error(`Bulk operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get maintenance analytics for dashboard
 */
export async function getMaintenanceMetrics(
  propertyIds?: string[],
  timeRange?: {
    start: Date;
    end: Date;
  }
): Promise<MaintenanceMetrics> {
  try {
    // Build query constraints
    const constraints: QueryConstraint[] = [];
    
    if (propertyIds && propertyIds.length > 0) {
      if (propertyIds.length === 1) {
        constraints.push(where('propertyId', '==', propertyIds[0]));
      } else {
        constraints.push(where('propertyId', 'in', propertyIds.slice(0, 10)));
      }
    }
    
    if (timeRange) {
      constraints.push(
        where('createdAt', '>=', Timestamp.fromDate(timeRange.start)),
        where('createdAt', '<=', Timestamp.fromDate(timeRange.end))
      );
    }
    
    // Get all requests for the period
    const q = query(requestsCollection, ...constraints);
    const snapshot = await getDocs(q);
    const requests = snapshot.docs.map(doc => doc.data());
    
    // Calculate metrics
    const metrics: MaintenanceMetrics = {
      propertyId: propertyIds?.length === 1 ? propertyIds[0] : undefined,
      timeRange: timeRange ? {
        start: Timestamp.fromDate(timeRange.start),
        end: Timestamp.fromDate(timeRange.end)
      } : {
        start: Timestamp.fromDate(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)), // 30 days ago
        end: Timestamp.now()
      },
      
      totalRequests: requests.length,
      
      requestsByStatus: requests.reduce((acc, request) => {
        acc[request.status] = (acc[request.status] || 0) + 1;
        return acc;
      }, {} as Record<MaintenanceStatus, number>),
      
      requestsByCategory: requests.reduce((acc, request) => {
        acc[request.category] = (acc[request.category] || 0) + 1;
        return acc;
      }, {} as Record<MaintenanceCategory, number>),
      
      requestsByPriority: requests.reduce((acc, request) => {
        acc[request.priority] = (acc[request.priority] || 0) + 1;
        return acc;
      }, {} as Record<MaintenancePriority, number>),
      
      // Calculate performance metrics
      averageResponseTime: calculateAverageResponseTime(requests),
      averageCompletionTime: calculateAverageCompletionTime(requests),
      completionRate: calculateCompletionRate(requests),
      tenantSatisfactionAverage: calculateTenantSatisfactionAverage(requests),
      
      // Calculate cost metrics
      totalCost: requests.reduce((sum, request) => sum + (request.actualCost || 0), 0),
      averageCostPerRequest: requests.length > 0 
        ? requests.reduce((sum, request) => sum + (request.actualCost || 0), 0) / requests.length 
        : 0,
      costByCategory: requests.reduce((acc, request) => {
        if (request.actualCost) {
          acc[request.category] = (acc[request.category] || 0) + request.actualCost;
        }
        return acc;
      }, {} as Record<MaintenanceCategory, number>),
      budgetVariance: calculateBudgetVariance(requests),
      
      contractorPerformance: calculateContractorPerformance(requests)
    };
    
    return metrics;
  } catch (error) {
    console.error('Error calculating maintenance metrics:', error);
    throw new Error(`Failed to calculate metrics: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// =============================================
// LEGACY SUPPORT (for backward compatibility)
// =============================================

/**
 * Get a maintenance ticket by ID (legacy)
 */
export async function getTicketById(ticketId: string): Promise<MaintenanceTicket | null> {
  const ticketDoc = doc(db, 'tickets', ticketId).withConverter(maintenanceTicketConverter);
  const ticketSnapshot = await getDoc(ticketDoc);
  
  if (ticketSnapshot.exists()) {
    return ticketSnapshot.data();
  }
  
  return null;
}

/**
 * Get all tickets for a property (legacy)
 */
export async function getPropertyTickets(propertyId: string): Promise<MaintenanceTicket[]> {
  const q = query(
    ticketsCollection, 
    where('propertyId', '==', propertyId),
    orderBy('timestamps.createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data());
}

/**
 * Get all tickets submitted by a tenant (legacy)
 */
export async function getTenantTickets(tenantId: string): Promise<MaintenanceTicket[]> {
  const q = query(
    ticketsCollection, 
    where('submittedBy', '==', tenantId),
    orderBy('timestamps.createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data());
}

/**
 * Get all tickets assigned to a contractor (legacy)
 */
export async function getContractorTickets(contractorId: string): Promise<MaintenanceTicket[]> {
  const q = query(
    ticketsCollection, 
    where('assignedTo', '==', contractorId),
    orderBy('timestamps.createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data());
}

/**
 * Get all tickets for a landlord (legacy)
 */
export async function getLandlordTickets(landlordId: string, properties: string[]): Promise<MaintenanceTicket[]> {
  if (!properties || properties.length === 0) {
    return [];
  }
  
  const ticketsPromises = properties.map(propertyId => {
    const q = query(
      ticketsCollection, 
      where('propertyId', '==', propertyId),
      orderBy('timestamps.createdAt', 'desc')
    );
    return getDocs(q);
  });
  
  const ticketsSnapshots = await Promise.all(ticketsPromises);
  
  const tickets: MaintenanceTicket[] = [];
  ticketsSnapshots.forEach(snapshot => {
    snapshot.docs.forEach(doc => {
      tickets.push(doc.data());
    });
  });
  
  tickets.sort((a, b) => {
    const aTime = a.timestamps.createdAt instanceof Timestamp 
      ? a.timestamps.createdAt.toMillis() 
      : 0;
    
    const bTime = b.timestamps.createdAt instanceof Timestamp 
      ? b.timestamps.createdAt.toMillis() 
      : 0;
    
    return bTime - aTime;
  });
  
  return tickets;
}

/**
 * Create a new maintenance ticket (legacy)
 */
export async function createMaintenanceTicket(
  description: string,
  urgency: MaintenanceTicket['urgency'],
  propertyId: string,
  unitNumber: string,
  submittedBy: string,
  photoUrl?: string
): Promise<MaintenanceTicket> {
  const ticketRef = doc(collection(db, 'tickets'));
  const ticketId = ticketRef.id;
  
  const ticketData = createNewMaintenanceTicket(
    ticketId,
    description,
    urgency,
    propertyId,
    unitNumber,
    submittedBy,
    photoUrl
  );
  
  await setDoc(ticketRef, ticketData);
  await addMaintenanceRequestToProperty(propertyId, ticketId);
  
  return ticketData;
}

/**
 * Update a maintenance ticket (legacy)
 */
export async function updateTicket(
  ticketId: string, 
  updateData: Partial<MaintenanceTicket>
): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  
  await updateDoc(ticketRef, {
    ...updateData,
    'timestamps.updatedAt': Timestamp.now()
  });
}

/**
 * Update ticket status (legacy)
 */
export async function updateTicketStatus(
  ticketId: string,
  status: TicketStatus
): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  const now = Timestamp.now();
  
  const updates: Record<string, any> = {
    status,
    'timestamps.updatedAt': now
  };
  
  switch (status) {
    case 'assigned':
      updates['timestamps.assignedAt'] = now;
      break;
    case 'completed':
      updates['timestamps.completedAt'] = now;
      
      const ticketSnapshot = await getDoc(ticketRef);
      if (ticketSnapshot.exists()) {
        const propertyId = ticketSnapshot.data().propertyId;
        await removeMaintenanceRequestFromProperty(propertyId, ticketId);
      }
      break;
    case 'classified':
      updates['timestamps.classifiedAt'] = now;
      break;
  }
  
  await updateDoc(ticketRef, updates);
}

/**
 * Assign a contractor to a ticket (legacy)
 */
export async function assignContractorToTicket(
  ticketId: string,
  contractorId: string
): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  const now = Timestamp.now();
  
  await updateDoc(ticketRef, {
    assignedTo: contractorId,
    status: 'assigned',
    'timestamps.assignedAt': now,
    'timestamps.updatedAt': now
  });
}

// =============================================
// HELPER FUNCTIONS FOR METRICS CALCULATION
// =============================================

function calculateAverageResponseTime(requests: MaintenanceRequest[]): number {
  const responseTimes = requests
    .filter(request => request.statusHistory.some(change => change.status === 'assigned'))
    .map(request => {
      const submitted = request.createdAt instanceof Timestamp ? request.createdAt.toMillis() : 0;
      const assigned = request.statusHistory
        .find(change => change.status === 'assigned')?.timestamp;
      const assignedTime = assigned instanceof Timestamp ? assigned.toMillis() : 0;
      return assignedTime - submitted;
    })
    .filter(time => time > 0);
  
  return responseTimes.length > 0 
    ? responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length / (1000 * 60 * 60) // Convert to hours
    : 0;
}

function calculateAverageCompletionTime(requests: MaintenanceRequest[]): number {
  const completionTimes = requests
    .filter(request => request.status === 'completed' && request.completedDate)
    .map(request => {
      const assigned = request.statusHistory
        .find(change => change.status === 'assigned')?.timestamp;
      const assignedTime = assigned instanceof Timestamp ? assigned.toMillis() : 0;
      const completedTime = request.completedDate instanceof Timestamp ? request.completedDate.toMillis() : 0;
      return completedTime - assignedTime;
    })
    .filter(time => time > 0);
  
  return completionTimes.length > 0 
    ? completionTimes.reduce((sum, time) => sum + time, 0) / completionTimes.length / (1000 * 60 * 60) // Convert to hours
    : 0;
}

function calculateCompletionRate(requests: MaintenanceRequest[]): number {
  const completedRequests = requests.filter(request => request.status === 'completed').length;
  return requests.length > 0 ? (completedRequests / requests.length) * 100 : 0;
}

function calculateTenantSatisfactionAverage(requests: MaintenanceRequest[]): number {
  const ratingsData = requests
    .filter(request => request.tenantSatisfaction?.rating)
    .map(request => request.tenantSatisfaction!.rating);
  
  return ratingsData.length > 0 
    ? ratingsData.reduce((sum, rating) => sum + rating, 0) / ratingsData.length
    : 0;
}

function calculateBudgetVariance(requests: MaintenanceRequest[]): number {
  const variances = requests
    .filter(request => request.estimatedCost && request.actualCost)
    .map(request => (request.actualCost! - request.estimatedCost!) / request.estimatedCost! * 100);
  
  return variances.length > 0 
    ? variances.reduce((sum, variance) => sum + variance, 0) / variances.length
    : 0;
}

function calculateContractorPerformance(requests: MaintenanceRequest[]): MaintenanceMetrics['contractorPerformance'] {
  const contractorData = new Map<string, {
    contractorName: string;
    jobsCompleted: number;
    ratings: number[];
    completionTimes: number[];
    totalEarnings: number;
  }>();
  
  requests.forEach(request => {
    if (request.contractorId && request.contractorName) {
      const data = contractorData.get(request.contractorId) || {
        contractorName: request.contractorName,
        jobsCompleted: 0,
        ratings: [],
        completionTimes: [],
        totalEarnings: 0
      };
      
      if (request.status === 'completed') {
        data.jobsCompleted++;
        
        if (request.actualCost) {
          data.totalEarnings += request.actualCost;
        }
        
        if (request.rating?.rating) {
          data.ratings.push(request.rating.rating);
        }
        
        // Calculate completion time
        const assigned = request.statusHistory
          .find(change => change.status === 'assigned')?.timestamp;
        if (assigned && request.completedDate) {
          const assignedTime = assigned instanceof Timestamp ? assigned.toMillis() : 0;
          const completedTime = request.completedDate instanceof Timestamp ? request.completedDate.toMillis() : 0;
          const completionTime = (completedTime - assignedTime) / (1000 * 60 * 60); // Hours
          if (completionTime > 0) {
            data.completionTimes.push(completionTime);
          }
        }
      }
      
      contractorData.set(request.contractorId, data);
    }
  });
  
  return Array.from(contractorData.entries()).map(([contractorId, data]) => ({
    contractorId,
    contractorName: data.contractorName,
    jobsCompleted: data.jobsCompleted,
    averageRating: data.ratings.length > 0 
      ? data.ratings.reduce((sum, rating) => sum + rating, 0) / data.ratings.length 
      : 0,
    averageCompletionTime: data.completionTimes.length > 0 
      ? data.completionTimes.reduce((sum, time) => sum + time, 0) / data.completionTimes.length 
      : 0,
    totalEarnings: data.totalEarnings
  }));
} 