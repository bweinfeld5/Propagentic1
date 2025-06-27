import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { LandlordProfile, AcceptedTenantRecord } from '../../models/LandlordProfile';

/**
 * Get landlord profile by ID
 */
export const getLandlordProfile = async (landlordId: string): Promise<LandlordProfile | null> => {
  try {
    const profileRef = doc(db, 'landlordProfiles', landlordId);
    const profileDoc = await getDoc(profileRef);
    
    if (!profileDoc.exists()) {
      console.log(`No landlord profile found for ID: ${landlordId}`);
      return null;
    }
    
    return {
      ...profileDoc.data(),
      uid: profileDoc.id
    } as LandlordProfile;
  } catch (error) {
    console.error('Error getting landlord profile:', error);
    throw error;
  }
};

/**
 * Get accepted tenants with detailed information
 */
export const getAcceptedTenantsWithDetails = async (landlordId: string) => {
  try {
    const profile = await getLandlordProfile(landlordId);
    if (!profile || !profile.acceptedTenantDetails) {
      return [];
    }
    
    // Get full tenant details for each accepted tenant
    const tenantDetails = await Promise.all(
      profile.acceptedTenantDetails.map(async (tenantRecord: AcceptedTenantRecord) => {
        try {
          // Get user data
          const userDoc = await getDoc(doc(db, 'users', tenantRecord.tenantId));
          const userData = userDoc.exists() ? userDoc.data() : {};
          
          // Get tenant profile data
          const tenantProfileDoc = await getDoc(doc(db, 'tenantProfiles', tenantRecord.tenantId));
          const tenantProfileData = tenantProfileDoc.exists() ? tenantProfileDoc.data() : {};
          
          // Get property data
          const propertyDoc = await getDoc(doc(db, 'properties', tenantRecord.propertyId));
          const propertyData = propertyDoc.exists() ? propertyDoc.data() : {};
          
          return {
            ...tenantRecord,
            // User information
            email: userData.email || tenantRecord.tenantEmail,
            name: tenantProfileData.fullName || 
                  userData.displayName || 
                  userData.name || 
                  `${userData.firstName || ''} ${userData.lastName || ''}`.trim() ||
                  tenantRecord.tenantEmail.split('@')[0],
            phone: tenantProfileData.phoneNumber || userData.phoneNumber,
            
            // Property information
            propertyName: propertyData.name || propertyData.nickname || 'Unknown Property',
            propertyAddress: propertyData.address || 
                           `${propertyData.streetAddress || ''} ${propertyData.city || ''}`.trim() ||
                           'Address not available',
            
            // Status and metadata
            status: 'active', // Default status for accepted tenants
            displayName: tenantProfileData.fullName || userData.displayName || userData.name,
            joinedDate: tenantRecord.acceptedAt,
            
            // Additional context
            inviteMethod: tenantRecord.inviteType || 'code',
            notes: tenantRecord.landlordNotes || ''
          };
        } catch (error) {
          console.error(`Error fetching details for tenant ${tenantRecord.tenantId}:`, error);
          // Return basic info even if detailed fetch fails
          return {
            ...tenantRecord,
            name: tenantRecord.tenantEmail.split('@')[0],
            email: tenantRecord.tenantEmail,
            status: 'active',
            error: 'Could not load full details'
          };
        }
      })
    );
    
    return tenantDetails;
  } catch (error) {
    console.error('Error getting accepted tenants with details:', error);
    throw error;
  }
};

/**
 * Get landlord statistics
 */
export const getLandlordStatistics = async (landlordId: string) => {
  try {
    const profile = await getLandlordProfile(landlordId);
    if (!profile) {
      return {
        totalInvitesSent: 0,
        totalInvitesAccepted: 0,
        inviteAcceptanceRate: 0,
        totalTenants: 0,
        totalProperties: 0,
        totalContractors: 0
      };
    }
    
    return {
      totalInvitesSent: profile.totalInvitesSent || 0,
      totalInvitesAccepted: profile.totalInvitesAccepted || 0,
      inviteAcceptanceRate: profile.inviteAcceptanceRate || 0,
      totalTenants: profile.acceptedTenants?.length || 0,
      totalProperties: profile.properties?.length || 0,
      totalContractors: profile.contractors?.length || 0
    };
  } catch (error) {
    console.error('Error getting landlord statistics:', error);
    throw error;
  }
};

/**
 * Update landlord profile
 */
export const updateLandlordProfile = async (
  landlordId: string, 
  updates: Partial<LandlordProfile>
): Promise<void> => {
  try {
    const profileRef = doc(db, 'landlordProfiles', landlordId);
    await updateDoc(profileRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating landlord profile:', error);
    throw error;
  }
};

/**
 * Get tenants by property ID for a landlord
 */
export const getTenantsByProperty = async (landlordId: string, propertyId: string) => {
  try {
    const profile = await getLandlordProfile(landlordId);
    if (!profile || !profile.acceptedTenantDetails) {
      return [];
    }
    
    // Filter tenants by property ID
    const propertyTenants = profile.acceptedTenantDetails.filter(
      tenant => tenant.propertyId === propertyId
    );
    
    // Get detailed information for these tenants
    const tenantDetails = await Promise.all(
      propertyTenants.map(async (tenantRecord) => {
        const userDoc = await getDoc(doc(db, 'users', tenantRecord.tenantId));
        const tenantProfileDoc = await getDoc(doc(db, 'tenantProfiles', tenantRecord.tenantId));
        
        const userData = userDoc.exists() ? userDoc.data() : {};
        const tenantProfileData = tenantProfileDoc.exists() ? tenantProfileDoc.data() : {};
        
        return {
          ...tenantRecord,
          email: userData.email || tenantRecord.tenantEmail,
          name: tenantProfileData.fullName || userData.displayName || userData.name,
          phone: tenantProfileData.phoneNumber || userData.phoneNumber,
          status: 'active'
        };
      })
    );
    
    return tenantDetails;
  } catch (error) {
    console.error('Error getting tenants by property:', error);
    throw error;
  }
};

/**
 * Export default service object
 */
const landlordProfileService = {
  getLandlordProfile,
  getAcceptedTenantsWithDetails,
  getLandlordStatistics,
  updateLandlordProfile,
  getTenantsByProperty
};

export default landlordProfileService; 