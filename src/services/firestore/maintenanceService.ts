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
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { MaintenanceTicket, TicketStatus } from '../../models/schema';
import { maintenanceTicketConverter, createNewMaintenanceTicket } from '../../models/converters';
import { addMaintenanceRequestToProperty, removeMaintenanceRequestFromProperty } from './propertyMaintenanceService';

// Collection references
const ticketsCollection = collection(db, 'tickets').withConverter(maintenanceTicketConverter);

/**
 * Get a maintenance ticket by ID
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
 * Get all tickets for a property
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
 * Get all tickets submitted by a tenant
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
 * Get all tickets assigned to a contractor
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
 * Get all tickets for a landlord (across all properties)
 */
export async function getLandlordTickets(landlordId: string, properties: string[]): Promise<MaintenanceTicket[]> {
  if (!properties || properties.length === 0) {
    return [];
  }
  
  // Firebase doesn't support OR queries, so we need to make multiple queries
  // and combine the results
  const ticketsPromises = properties.map(propertyId => {
    const q = query(
      ticketsCollection, 
      where('propertyId', '==', propertyId),
      orderBy('timestamps.createdAt', 'desc')
    );
    return getDocs(q);
  });
  
  const ticketsSnapshots = await Promise.all(ticketsPromises);
  
  // Combine all results into a single array
  const tickets: MaintenanceTicket[] = [];
  ticketsSnapshots.forEach(snapshot => {
    snapshot.docs.forEach(doc => {
      tickets.push(doc.data());
    });
  });
  
  // Sort by createdAt (newest first)
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
 * Create a new maintenance ticket
 */
export async function createMaintenanceTicket(
  description: string,
  urgency: MaintenanceTicket['urgency'],
  propertyId: string,
  unitNumber: string,
  submittedBy: string,
  photoUrl?: string
): Promise<MaintenanceTicket> {
  // Reference to a new document with auto-generated ID
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
  
  // Add ticket to property's active requests
  await addMaintenanceRequestToProperty(propertyId, ticketId);
  
  return ticketData;
}

/**
 * Update a maintenance ticket
 */
export async function updateTicket(
  ticketId: string, 
  updateData: Partial<MaintenanceTicket>
): Promise<void> {
  const ticketRef = doc(db, 'tickets', ticketId);
  
  // Always update the timestamps.updatedAt field
  await updateDoc(ticketRef, {
    ...updateData,
    'timestamps.updatedAt': Timestamp.now()
  });
}

/**
 * Update ticket status
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
  
  // Add specific timestamp based on the status
  switch (status) {
    case 'assigned':
      updates['timestamps.assignedAt'] = now;
      break;
    case 'completed':
      updates['timestamps.completedAt'] = now;
      
      // Get the ticket to find its property and remove from active requests
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
 * Assign a contractor to a ticket
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