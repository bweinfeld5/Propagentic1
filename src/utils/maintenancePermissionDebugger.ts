import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';

export interface PermissionDebugResult {
  userAuth: {
    isAuthenticated: boolean;
    uid: string | null;
    email: string | null;
    claims: any;
  };
  userRole: {
    hasValidRole: boolean;
    userType: string | null;
    role: string | null;
    isLandlord: boolean;
  };
  propertyOwnership: {
    propertyExists: boolean;
    propertyData: any;
    landlordId: string | null;
    ownsProperty: boolean;
  };
  maintenanceRequest: {
    requestExists: boolean;
    requestData: any;
    propertyId: string | null;
    canDelete: boolean;
  };
  recommendations: string[];
}

/**
 * Debug maintenance request deletion permissions
 * This tool helps identify why a landlord might not be able to delete a maintenance request
 */
export async function debugMaintenancePermissions(
  requestId: string
): Promise<PermissionDebugResult> {
  const result: PermissionDebugResult = {
    userAuth: {
      isAuthenticated: false,
      uid: null,
      email: null,
      claims: null
    },
    userRole: {
      hasValidRole: false,
      userType: null,
      role: null,
      isLandlord: false
    },
    propertyOwnership: {
      propertyExists: false,
      propertyData: null,
      landlordId: null,
      ownsProperty: false
    },
    maintenanceRequest: {
      requestExists: false,
      requestData: null,
      propertyId: null,
      canDelete: false
    },
    recommendations: []
  };

  try {
    // 1. Check user authentication
    const currentUser = auth.currentUser;
    if (currentUser) {
      result.userAuth.isAuthenticated = true;
      result.userAuth.uid = currentUser.uid;
      result.userAuth.email = currentUser.email;
      
      // Get ID token to check claims
      try {
        const idTokenResult = await currentUser.getIdTokenResult();
        result.userAuth.claims = idTokenResult.claims;
      } catch (error) {
        console.warn('Could not retrieve ID token claims:', error);
      }
    } else {
      result.recommendations.push('❌ User is not authenticated. Please log in.');
      return result;
    }

    // 2. Check user role in Firestore
    try {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        result.userRole.hasValidRole = true;
        result.userRole.userType = userData.userType || null;
        result.userRole.role = userData.role || null;
        result.userRole.isLandlord = userData.userType === 'landlord' || userData.role === 'landlord';
        
        if (!result.userRole.isLandlord) {
          result.recommendations.push('❌ User is not a landlord. Only landlords can delete maintenance requests for their properties.');
        }
      } else {
        result.recommendations.push('❌ User profile not found in Firestore. Please contact support.');
      }
    } catch (error) {
      result.recommendations.push(`❌ Error fetching user profile: ${error}`);
    }

    // 3. Check maintenance request
    try {
      const requestDoc = await getDoc(doc(db, 'maintenanceRequests', requestId));
      if (requestDoc.exists()) {
        result.maintenanceRequest.requestExists = true;
        result.maintenanceRequest.requestData = requestDoc.data();
        result.maintenanceRequest.propertyId = result.maintenanceRequest.requestData.propertyId;
        
        if (!result.maintenanceRequest.propertyId) {
          result.recommendations.push('❌ Maintenance request does not have a propertyId. This is a data integrity issue.');
        }
      } else {
        result.recommendations.push(`❌ Maintenance request ${requestId} not found.`);
        return result;
      }
    } catch (error) {
      result.recommendations.push(`❌ Error fetching maintenance request: ${error}`);
      return result;
    }

    // 4. Check property ownership
    if (result.maintenanceRequest.propertyId) {
      try {
        const propertyDoc = await getDoc(doc(db, 'properties', result.maintenanceRequest.propertyId));
        if (propertyDoc.exists()) {
          result.propertyOwnership.propertyExists = true;
          result.propertyOwnership.propertyData = propertyDoc.data();
          result.propertyOwnership.landlordId = result.propertyOwnership.propertyData.landlordId;
          result.propertyOwnership.ownsProperty = result.propertyOwnership.landlordId === currentUser.uid;
          
          if (!result.propertyOwnership.ownsProperty) {
            result.recommendations.push(
              `❌ Property ownership mismatch. Property landlordId: ${result.propertyOwnership.landlordId}, User UID: ${currentUser.uid}`
            );
          }
        } else {
          result.recommendations.push(`❌ Property ${result.maintenanceRequest.propertyId} not found.`);
        }
      } catch (error) {
        result.recommendations.push(`❌ Error fetching property: ${error}`);
      }
    }

    // 5. Final permission check
    result.maintenanceRequest.canDelete = 
      result.userAuth.isAuthenticated &&
      result.userRole.isLandlord &&
      result.propertyOwnership.ownsProperty &&
      result.maintenanceRequest.requestExists;

    // 6. Generate recommendations
    if (result.maintenanceRequest.canDelete) {
      result.recommendations.push('✅ User should be able to delete this maintenance request.');
      result.recommendations.push('💡 If deletion still fails, check browser console for Firestore error details.');
    }

    // Add ID token claims check
    if (result.userAuth.claims) {
      const hasRoleInClaims = result.userAuth.claims.role === 'landlord' || result.userAuth.claims.userType === 'landlord';
      if (!hasRoleInClaims) {
        result.recommendations.push('⚠️ User role not set in Firebase Auth claims. Consider refreshing the ID token.');
      }
    }

  } catch (error) {
    result.recommendations.push(`❌ Unexpected error during permission check: ${error}`);
  }

  return result;
}

/**
 * Quick permission check for a maintenance request
 */
export async function canDeleteMaintenanceRequest(requestId: string): Promise<boolean> {
  const debug = await debugMaintenancePermissions(requestId);
  return debug.maintenanceRequest.canDelete;
}

/**
 * Print debug results to console in a readable format
 */
export function printDebugResults(results: PermissionDebugResult): void {
  console.group('🔍 Maintenance Request Permission Debug Results');
  
  console.group('👤 User Authentication');
  console.log('Authenticated:', results.userAuth.isAuthenticated);
  console.log('UID:', results.userAuth.uid);
  console.log('Email:', results.userAuth.email);
  console.log('Claims:', results.userAuth.claims);
  console.groupEnd();
  
  console.group('🎭 User Role');
  console.log('Has Valid Role:', results.userRole.hasValidRole);
  console.log('User Type:', results.userRole.userType);
  console.log('Role:', results.userRole.role);
  console.log('Is Landlord:', results.userRole.isLandlord);
  console.groupEnd();
  
  console.group('🏠 Property Ownership');
  console.log('Property Exists:', results.propertyOwnership.propertyExists);
  console.log('Landlord ID:', results.propertyOwnership.landlordId);
  console.log('Owns Property:', results.propertyOwnership.ownsProperty);
  console.groupEnd();
  
  console.group('🔧 Maintenance Request');
  console.log('Request Exists:', results.maintenanceRequest.requestExists);
  console.log('Property ID:', results.maintenanceRequest.propertyId);
  console.log('Can Delete:', results.maintenanceRequest.canDelete);
  console.groupEnd();
  
  console.group('💡 Recommendations');
  results.recommendations.forEach(rec => console.log(rec));
  console.groupEnd();
  
  console.groupEnd();
} 