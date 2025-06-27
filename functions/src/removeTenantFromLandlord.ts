import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { logger } from 'firebase-functions';

interface RemoveTenantData {
  landlordId: string;
  tenantId: string;
  propertyId: string;
}

/**
 * Cloud Function to remove a tenant from a landlord's accepted tenants list
 * and optionally revoke their access in tenantProfiles
 */
export const removeTenantFromLandlord = onCall<RemoveTenantData>(async (request) => {
  const { data, auth } = request;
  
  // Validate authentication
  if (!auth) {
    throw new HttpsError('unauthenticated', 'User must be authenticated');
  }

  // Validate input data
  if (!data.landlordId || !data.tenantId || !data.propertyId) {
    throw new HttpsError('invalid-argument', 'Missing required fields: landlordId, tenantId, propertyId');
  }

  // Ensure the authenticated user is the landlord
  if (auth.uid !== data.landlordId) {
    throw new HttpsError('permission-denied', 'User can only remove tenants from their own properties');
  }

  const db = getFirestore();
  const { landlordId, tenantId, propertyId } = data;

  try {
    // Use a transaction to ensure consistency
    await db.runTransaction(async (transaction) => {
      const landlordProfileRef = db.collection('landlordProfiles').doc(landlordId);
      const tenantProfileRef = db.collection('tenantProfiles').doc(tenantId);
      
      // Get current landlord profile
      const landlordDoc = await transaction.get(landlordProfileRef);
      if (!landlordDoc.exists) {
        throw new HttpsError('not-found', 'Landlord profile not found');
      }

      const landlordData = landlordDoc.data();
      const acceptedTenants = landlordData?.acceptedTenants || [];
      const acceptedTenantDetails = landlordData?.acceptedTenantDetails || [];

      // Check if tenant is actually in the accepted list
      const tenantIndex = acceptedTenants.indexOf(tenantId);
      if (tenantIndex === -1) {
        throw new HttpsError('not-found', 'Tenant not found in landlord\'s accepted tenants list');
      }

      // Remove tenant from acceptedTenants array
      const updatedAcceptedTenants = acceptedTenants.filter((id: string) => id !== tenantId);
      
      // Remove tenant details for this property
      const updatedAcceptedTenantDetails = acceptedTenantDetails.filter(
        (detail: any) => !(detail.tenantId === tenantId && detail.propertyId === propertyId)
      );

      // Update landlord profile
      transaction.update(landlordProfileRef, {
        acceptedTenants: updatedAcceptedTenants,
        acceptedTenantDetails: updatedAcceptedTenantDetails,
        updatedAt: FieldValue.serverTimestamp()
      });

      // Check if tenant profile exists and update it
      const tenantDoc = await transaction.get(tenantProfileRef);
      if (tenantDoc.exists) {
        const tenantData = tenantDoc.data();
        const currentProperties = tenantData?.properties || [];
        
        // Remove the property from tenant's properties list
        const updatedProperties = currentProperties.filter((id: string) => id !== propertyId);
        
        transaction.update(tenantProfileRef, {
          properties: updatedProperties,
          updatedAt: FieldValue.serverTimestamp()
        });
        
        logger.info(`Updated tenant profile ${tenantId} - removed property ${propertyId}`);
      } else {
        logger.warn(`Tenant profile ${tenantId} not found during removal`);
      }

      // Update property to reflect the change (optional)
      const propertyRef = db.collection('properties').doc(propertyId);
      const propertyDoc = await transaction.get(propertyRef);
      
      if (propertyDoc.exists) {
        const propertyData = propertyDoc.data();
        const currentTenants = propertyData?.tenants || [];
        const updatedTenants = currentTenants.filter((id: string) => id !== tenantId);
        
        transaction.update(propertyRef, {
          tenants: updatedTenants,
          isOccupied: updatedTenants.length > 0,
          occupiedUnits: updatedTenants.length,
          updatedAt: FieldValue.serverTimestamp()
        });
        
        logger.info(`Updated property ${propertyId} - removed tenant ${tenantId}`);
      }

      logger.info(`Successfully removed tenant ${tenantId} from landlord ${landlordId}'s property ${propertyId}`);
    });

    return {
      success: true,
      message: 'Tenant successfully removed',
      removedTenantId: tenantId,
      propertyId: propertyId
    };

  } catch (error) {
    logger.error('Error removing tenant from landlord:', error);
    
    if (error instanceof HttpsError) {
      throw error;
    }
    
    throw new HttpsError('internal', 'Failed to remove tenant: ' + (error as Error).message);
  }
}); 