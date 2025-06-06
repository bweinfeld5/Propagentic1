import { Timestamp, FirestoreDataConverter } from 'firebase/firestore';

/**
 * Interface defining the relationship between a tenant and property
 */
export interface PropertyTenantRelationship {
  id: string;               // Unique identifier
  propertyId: string;       // Reference to property
  tenantId: string;         // Reference to tenant
  unitId?: string;          // Optional specific unit
  status: 'active' | 'pending' | 'archived';
  inviteCodeId: string;     // Reference to invite code used
  startDate: Timestamp;     // Tenancy start date
  endDate?: Timestamp;      // Optional tenancy end date
}

/**
 * FirestoreDataConverter for PropertyTenantRelationship objects
 */
export const propertyTenantRelationshipConverter: FirestoreDataConverter<PropertyTenantRelationship> = {
  toFirestore: (relationship: PropertyTenantRelationship) => {
    return {
      propertyId: relationship.propertyId,
      tenantId: relationship.tenantId,
      unitId: relationship.unitId || null,
      status: relationship.status,
      inviteCodeId: relationship.inviteCodeId,
      startDate: relationship.startDate,
      endDate: relationship.endDate || null,
    };
  },
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      propertyId: data.propertyId,
      tenantId: data.tenantId,
      unitId: data.unitId || undefined,
      status: data.status,
      inviteCodeId: data.inviteCodeId,
      startDate: data.startDate,
      endDate: data.endDate || undefined,
    } as PropertyTenantRelationship;
  },
};

/**
 * Creates a new property-tenant relationship from an invite code
 */
export function createPropertyTenantRelationship(
  propertyId: string,
  tenantId: string,
  inviteCodeId: string,
  options?: {
    unitId?: string;
    endDate?: Timestamp;
  }
): Omit<PropertyTenantRelationship, 'id'> {
  return {
    propertyId,
    tenantId,
    unitId: options?.unitId,
    status: 'active',
    inviteCodeId,
    startDate: Timestamp.now(),
    endDate: options?.endDate,
  };
}

export default PropertyTenantRelationship; 