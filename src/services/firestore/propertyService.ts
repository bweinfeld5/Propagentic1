import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  deleteDoc,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Property } from '../../models/schema';
import { propertyConverter, createNewProperty } from '../../models/converters';

// Collection references
const propertiesCollection = collection(db, 'properties').withConverter(propertyConverter);

/**
 * Get a property by ID
 */
export async function getPropertyById(propertyId: string): Promise<Property | null> {
  const propertyDoc = doc(db, 'properties', propertyId).withConverter(propertyConverter);
  const propertySnapshot = await getDoc(propertyDoc);
  
  if (propertySnapshot.exists()) {
    return propertySnapshot.data();
  }
  
  return null;
}

/**
 * Get all properties for a landlord
 */
export async function getLandlordProperties(landlordId: string): Promise<Property[]> {
  const q = query(propertiesCollection, where('landlordId', '==', landlordId));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => doc.data());
}

/**
 * Create a new property
 */
export async function createProperty(
  propertyName: string,
  address: Property['address'],
  landlordId: string,
  unitList: string[] = []
): Promise<Property> {
  // Reference to a new document with auto-generated ID
  const propertyRef = doc(collection(db, 'properties'));
  const propertyId = propertyRef.id;
  
  const propertyData = createNewProperty(
    propertyId,
    propertyName,
    address,
    landlordId,
    unitList
  );
  
  await setDoc(propertyRef, propertyData);
  
  // Update landlord profile to include this property
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (landlordProfileSnapshot.exists()) {
    const properties = landlordProfileSnapshot.data().properties || [];
    await updateDoc(landlordProfileRef, {
      properties: [...properties, propertyId]
    });
  }
  
  return propertyData;
}

/**
 * Update a property
 */
export async function updateProperty(
  propertyId: string, 
  propertyData: Partial<Property>
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  await updateDoc(propertyRef, propertyData);
}

/**
 * Add a unit to a property
 */
export async function addUnitToProperty(
  propertyId: string,
  unitNumber: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const unitList = propertySnapshot.data().unitList || [];
    
    // Add unit if not already in the list
    if (!unitList.includes(unitNumber)) {
      await updateDoc(propertyRef, {
        unitList: [...unitList, unitNumber]
      });
    }
  }
}

/**
 * Remove a unit from a property
 */
export async function removeUnitFromProperty(
  propertyId: string,
  unitNumber: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const unitList = propertySnapshot.data().unitList || [];
    
    await updateDoc(propertyRef, {
      unitList: unitList.filter((unit: string) => unit !== unitNumber)
    });
  }
}

/**
 * Add a tenant to a property
 */
export async function addTenantToProperty(
  propertyId: string,
  tenantId: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const tenantIds = propertySnapshot.data().tenantIds || [];
    
    // Add tenant if not already in the list
    if (!tenantIds.includes(tenantId)) {
      await updateDoc(propertyRef, {
        tenantIds: [...tenantIds, tenantId]
      });
    }
  }
}

/**
 * Remove a tenant from a property
 */
export async function removeTenantFromProperty(
  propertyId: string,
  tenantId: string
): Promise<void> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const tenantIds = propertySnapshot.data().tenantIds || [];
    
    await updateDoc(propertyRef, {
      tenantIds: tenantIds.filter((id: string) => id !== tenantId)
    });
  }
}

// Export maintenance-related functions from the shared service
export { addMaintenanceRequestToProperty, removeMaintenanceRequestFromProperty } from './propertyMaintenanceService';

/**
 * Get all active maintenance requests for a property
 */
export async function getPropertyActiveRequests(propertyId: string): Promise<string[]> {
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    return propertySnapshot.data().activeRequests || [];
  }
  
  return [];
} 