import { 
  doc, 
  getDoc, 
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../firebase/config';

/**
 * Add a maintenance request to a property's active requests
 */
export async function addMaintenanceRequestToProperty(
  propertyId: string,
  ticketId: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const activeRequests = propertySnapshot.data().activeRequests || [];
    
    // Add request if not already in the list
    if (!activeRequests.includes(ticketId)) {
      await updateDoc(propertyRef, {
        activeRequests: [...activeRequests, ticketId]
      });
    }
  }
}

/**
 * Remove a maintenance request from a property's active requests
 */
export async function removeMaintenanceRequestFromProperty(
  propertyId: string,
  ticketId: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const activeRequests = propertySnapshot.data().activeRequests || [];
    
    await updateDoc(propertyRef, {
      activeRequests: activeRequests.filter((id: string) => id !== ticketId)
    });
  }
} 