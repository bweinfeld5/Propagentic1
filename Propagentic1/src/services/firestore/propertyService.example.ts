/**
 * Example service file demonstrating the use of TypeUtils for safer Firebase operations
 * 
 * This is an example file only - not for actual use in the application.
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where,
  limit,
  orderBy,
  updateDoc,
  serverTimestamp,
  Timestamp,
  DocumentReference 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Property } from '../../models/schema';
import { convertSnapshot, exists, hasItems } from '../../utils/TypeUtils';

// Define a basic Tenant interface for the example
interface Tenant {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  propertyId: string;
}

/**
 * Get a property by ID with improved type safety
 */
export async function getPropertyById(propertyId: string): Promise<Property | null> {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    const snapshot = await getDoc(propertyRef);
    
    // Use the convertSnapshot utility for type-safe conversion
    return convertSnapshot<Property>(snapshot, 'propertyId');
  } catch (error) {
    console.error('Error getting property:', error);
    throw error;
  }
}

/**
 * Get properties for a landlord with proper type handling
 */
export async function getPropertiesForLandlord(landlordId: string): Promise<Property[]> {
  try {
    const propertiesRef = collection(db, 'properties');
    const q = query(
      propertiesRef,
      where('landlordId', '==', landlordId),
      orderBy('createdAt', 'desc'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    
    // Type-safe conversion of query results
    return snapshot.docs.map(doc => convertSnapshot<Property>(doc, 'propertyId')!)
      .filter(exists); // Filter out any null results using the type guard
  } catch (error) {
    console.error('Error getting properties for landlord:', error);
    throw error;
  }
}

/**
 * Update a property with improved type safety
 */
export async function updateProperty(
  propertyId: string, 
  updates: Partial<Omit<Property, 'propertyId' | 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const propertyRef = doc(db, 'properties', propertyId);
    
    // Add timestamp for the update
    const updateData = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(propertyRef, updateData);
  } catch (error) {
    console.error('Error updating property:', error);
    throw error;
  }
}

/**
 * Get property with tenants using type guards
 */
export async function getPropertyWithTenants(propertyId: string): Promise<{
  property: Property | null;
  tenants: Tenant[]; // Now using the Tenant interface
}> {
  try {
    // Get the property
    const property = await getPropertyById(propertyId);
    
    // Check if property exists and has tenants using type guards
    if (exists(property) && hasItems(property.tenantIds)) {
      // Fetch tenants (simplified example)
      const tenants: Tenant[] = []; // Explicitly typed as Tenant[]
      
      return { property, tenants };
    }
    
    return { property, tenants: [] };
  } catch (error) {
    console.error('Error getting property with tenants:', error);
    throw error;
  }
} 