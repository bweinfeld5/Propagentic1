/**
 * PropertyTenant Service - Manages associations between properties and tenants
 */

import { db } from '../firebase/config';
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  Timestamp,
  WithFieldValue
} from 'firebase/firestore';
import {
  PropertyTenantRelationship,
  propertyTenantRelationshipConverter,
  createPropertyTenantRelationship
} from '../models/PropertyTenantRelationship';

// Collection reference
const COLLECTION_NAME = 'propertyTenantRelationships';

/**
 * Create a new property-tenant relationship
 * @param propertyId - ID of the property
 * @param tenantId - ID of the tenant
 * @param inviteCodeId - ID of the invite code used to create the relationship
 * @param options - Optional parameters
 * @returns The created relationship
 */
export const createRelationship = async (
  propertyId: string,
  tenantId: string,
  inviteCodeId: string,
  options: {
    unitId?: string;
    endDate?: Timestamp;
  } = {}
): Promise<PropertyTenantRelationship> => {
  if (!propertyId || !tenantId || !inviteCodeId) {
    throw new Error('Property ID, tenant ID, and invite code ID are required');
  }

  try {
    // Check if relationship already exists
    const existingRel = await findRelationship(propertyId, tenantId);
    if (existingRel) {
      throw new Error('A relationship between this property and tenant already exists');
    }

    // Create the relationship model
    const relationshipData = createPropertyTenantRelationship(
      propertyId,
      tenantId,
      inviteCodeId,
      options
    );

    // Add to Firestore
    const docRef = await addDoc(
      collection(db, COLLECTION_NAME).withConverter(propertyTenantRelationshipConverter),
      relationshipData as WithFieldValue<PropertyTenantRelationship>
    );

    return {
      ...relationshipData,
      id: docRef.id
    };
  } catch (error) {
    console.error('Error creating property-tenant relationship:', error);
    throw new Error('Failed to create property-tenant relationship');
  }
};

/**
 * Find a property-tenant relationship
 * @param propertyId - ID of the property
 * @param tenantId - ID of the tenant
 * @returns The relationship if found, null otherwise
 */
export const findRelationship = async (
  propertyId: string,
  tenantId: string
): Promise<PropertyTenantRelationship | null> => {
  if (!propertyId || !tenantId) {
    throw new Error('Property ID and tenant ID are required');
  }

  try {
    const relRef = collection(db, COLLECTION_NAME).withConverter(propertyTenantRelationshipConverter);
    const q = query(
      relRef,
      where('propertyId', '==', propertyId),
      where('tenantId', '==', tenantId)
    );
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    return querySnapshot.docs[0].data();
  } catch (error) {
    console.error('Error finding property-tenant relationship:', error);
    throw new Error('Failed to find property-tenant relationship');
  }
};

/**
 * Get all properties for a tenant
 * @param tenantId - ID of the tenant
 * @returns Array of relationships
 */
export const getTenantProperties = async (
  tenantId: string
): Promise<PropertyTenantRelationship[]> => {
  if (!tenantId) {
    throw new Error('Tenant ID is required');
  }

  try {
    const relRef = collection(db, COLLECTION_NAME).withConverter(propertyTenantRelationshipConverter);
    const q = query(
      relRef,
      where('tenantId', '==', tenantId),
      where('status', 'in', ['active', 'pending'])
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting tenant properties:', error);
    throw new Error('Failed to get tenant properties');
  }
};

/**
 * Get all tenants for a property
 * @param propertyId - ID of the property
 * @returns Array of relationships
 */
export const getPropertyTenants = async (
  propertyId: string
): Promise<PropertyTenantRelationship[]> => {
  if (!propertyId) {
    throw new Error('Property ID is required');
  }

  try {
    const relRef = collection(db, COLLECTION_NAME).withConverter(propertyTenantRelationshipConverter);
    const q = query(
      relRef,
      where('propertyId', '==', propertyId),
      where('status', 'in', ['active', 'pending'])
    );
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map(doc => doc.data());
  } catch (error) {
    console.error('Error getting property tenants:', error);
    throw new Error('Failed to get property tenants');
  }
};

/**
 * Update a property-tenant relationship
 * @param relationshipId - ID of the relationship
 * @param updates - Fields to update
 * @returns Updated relationship
 */
export const updateRelationship = async (
  relationshipId: string,
  updates: {
    status?: 'active' | 'pending' | 'archived';
    endDate?: Timestamp;
  }
): Promise<PropertyTenantRelationship> => {
  if (!relationshipId) {
    throw new Error('Relationship ID is required');
  }

  try {
    const docRef = doc(db, COLLECTION_NAME, relationshipId)
      .withConverter(propertyTenantRelationshipConverter);
    await updateDoc(docRef, updates);

    const updatedDoc = await getDoc(docRef);
    if (!updatedDoc.exists()) {
      throw new Error('Relationship not found');
    }

    return updatedDoc.data();
  } catch (error) {
    console.error('Error updating property-tenant relationship:', error);
    throw new Error('Failed to update property-tenant relationship');
  }
};

/**
 * Archive a property-tenant relationship
 * @param relationshipId - ID of the relationship
 * @returns Updated relationship
 */
export const archiveRelationship = async (
  relationshipId: string
): Promise<PropertyTenantRelationship> => {
  if (!relationshipId) {
    throw new Error('Relationship ID is required');
  }

  try {
    return updateRelationship(relationshipId, {
      status: 'archived',
      endDate: Timestamp.now()
    });
  } catch (error) {
    console.error('Error archiving property-tenant relationship:', error);
    throw new Error('Failed to archive property-tenant relationship');
  }
};

export default {
  createRelationship,
  findRelationship,
  getTenantProperties,
  getPropertyTenants,
  updateRelationship,
  archiveRelationship
}; 