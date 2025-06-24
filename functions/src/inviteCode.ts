import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { HttpsError } from 'firebase-functions/v1/auth';

// Interfaces for data types
interface InviteCode {
  id?: string;
  code: string;
  landlordId: string;
  propertyId: string;
  unitId?: string;
  email?: string;
  status: 'active' | 'used' | 'expired' | 'revoked';
  createdAt: FirebaseFirestore.Timestamp;
  expiresAt: FirebaseFirestore.Timestamp;
  usedAt?: FirebaseFirestore.Timestamp;
  usedBy?: string;
}

interface PropertyTenantRelationship {
  id?: string;
  propertyId: string;
  tenantId: string;
  unitId?: string;
  status: 'active' | 'pending' | 'archived';
  inviteCodeId: string;
  startDate: FirebaseFirestore.Timestamp;
  endDate?: FirebaseFirestore.Timestamp;
}

// Collection names
const INVITE_CODES_COLLECTION = 'inviteCodes';
const PROPERTY_TENANT_RELATIONSHIPS_COLLECTION = 'propertyTenantRelationships';

// Validate invite code format
const isValidInviteCode = (code: string): boolean => {
  // Alphanumeric code, 6-12 characters, case-insensitive
  const regex = /^[a-zA-Z0-9]{6,12}$/;
  return regex.test(code);
};

/**
 * Generate an invite code for a property (Callable function for Frontend)
 * This is the correct function for use with httpsCallable()
 */
export const generateInviteCode = functions.https.onCall(async (data: any, context: any) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to generate invite codes.'
    );
  }

  const userId = context.auth.uid;
  functions.logger.info(`🔧 Generating invite code for user: ${userId}`);

  try {
    // Get the user data to check role
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      functions.logger.error(`❌ User profile not found: ${userId}`);
      throw new functions.https.HttpsError(
        'not-found',
        'User profile not found'
      );
    }
    
    const userData = userDoc.data();
    functions.logger.info(`🔧 User role: ${userData?.role || userData?.userType}`);
    
    // Verify user is a landlord or property manager
    const userRole = userData?.role || userData?.userType;
    if (userRole !== 'landlord' && userRole !== 'admin' && userRole !== 'property_manager') {
      functions.logger.error(`❌ User not authorized. Role: ${userRole}`);
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only landlords and property managers can create invite codes'
      );
    }

    // Get parameters from request
    const { propertyId, unitId, email, expirationDays = 7 } = data;
    functions.logger.info(`🔧 Request params:`, { propertyId, unitId, email, expirationDays });

    // Validate required parameters
    if (!propertyId) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Property ID is required'
      );
    }

    // Check if the property exists and the user has access to it
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
      functions.logger.error(`❌ Property not found: ${propertyId}`);
      throw new functions.https.HttpsError(
        'not-found',
        'Property not found'
      );
    }

    const propertyData = propertyDoc.data();
    functions.logger.info(`🔧 Property data:`, { 
      landlordId: propertyData?.landlordId, 
      ownerId: propertyData?.ownerId, 
      requestUserId: userId 
    });
    
    // Check if the user has access to this property
    const hasAccess = propertyData?.ownerId === userId ||
                     propertyData?.landlordId === userId ||
                     (propertyData?.managers && propertyData.managers.includes(userId)) ||
                     userRole === 'admin';
    
    if (!hasAccess) {
      functions.logger.error(`❌ User ${userId} does not have access to property ${propertyId}`);
      throw new functions.https.HttpsError(
        'permission-denied',
        'You do not have permission to create invite codes for this property'
      );
    }

    // Verify unit exists if specified
    if (unitId && propertyData?.units) {
      const unitExists = propertyData.units.some((unit: any) => unit.id === unitId || unit.unitNumber === unitId);
      if (!unitExists) {
        throw new functions.https.HttpsError(
          'not-found',
          'The specified unit could not be found in this property'
        );
      }
    }

    // Generate a unique code
    let generatedCode: string = '';
    let isUnique = false;
    
    // Define character set for codes excluding similar-looking characters
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes I, O, 0, 1
    
    // Try to generate a unique code
    while (!isUnique) {
      // Generate an 8-character code
      generatedCode = '';
      for (let i = 0; i < 8; i++) {
        generatedCode += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Check if the code already exists
      const codeQuery = await db.collection(INVITE_CODES_COLLECTION)
        .where('code', '==', generatedCode)
        .limit(1)
        .get();
      
      isUnique = codeQuery.empty;
    }
    
    // Set expiration date based on provided days or default to 7 days
    const now = admin.firestore.Timestamp.now();
    const expiresAt = new admin.firestore.Timestamp(
      now.seconds + (expirationDays * 24 * 60 * 60), 
      now.nanoseconds
    );
    
    // Create the invite code record
    const inviteCodeData: InviteCode = {
      code: generatedCode,
      landlordId: userId,
      propertyId,
      unitId: unitId || undefined,
      email: email || undefined,
      status: 'active',
      createdAt: now,
      expiresAt
    };
    
    const inviteCodeRef = await db.collection(INVITE_CODES_COLLECTION).add(inviteCodeData);
    
    functions.logger.info(`✅ Invite code created successfully: ${generatedCode}`);
    
    // Return the created invite code
    return {
      success: true,
      inviteCode: {
        id: inviteCodeRef.id,
        code: generatedCode,
        propertyId,
        landlordId: userId,
        unitId: unitId || null,
        email: email || null,
        status: 'active',
        createdAt: inviteCodeData.createdAt.toMillis(),
        expiresAt: inviteCodeData.expiresAt.toMillis()
      }
    };

  } catch (error) {
    // Forward HttpsError errors
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    functions.logger.error('Error creating invite code:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while creating the invite code'
    );
  }
});

/**
 * Validate an invite code without redeeming it
 * This helps check if a code is valid during registration process
 */
export const validateInviteCode = functions.https.onCall(async (data: any, context: any) => {
  // Get the code from the request
  const { code } = data;
  
  // Validate code format
  if (!code || !isValidInviteCode(code)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid invite code format. Codes must be 6-12 alphanumeric characters.'
    );
  }
  
  const normalizedCode = code.toUpperCase();
  const db = admin.firestore();
  
  try {
    // Look up the invite code
    const codeQuery = await db.collection(INVITE_CODES_COLLECTION)
      .where('code', '==', normalizedCode)
      .limit(1)
      .get();
    
    if (codeQuery.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Invalid invite code. Please check the code and try again.'
      );
    }
    
    const inviteCodeDoc = codeQuery.docs[0];
    const inviteCodeData = inviteCodeDoc.data() as InviteCode;
    
    // Check code status
    if (inviteCodeData.status === 'used') {
      throw new functions.https.HttpsError(
        'already-exists',
        'This invite code has already been used.'
      );
    }
    
    if (inviteCodeData.status === 'revoked') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'This invite code has been revoked.'
      );
    }
    
    if (inviteCodeData.status === 'expired' || 
        (inviteCodeData.expiresAt && inviteCodeData.expiresAt.toMillis() < Date.now())) {
      
      // Auto-update expired status if needed
      if (inviteCodeData.status !== 'expired' && inviteCodeData.expiresAt.toMillis() < Date.now()) {
        await db.collection(INVITE_CODES_COLLECTION).doc(inviteCodeDoc.id).update({
          status: 'expired'
        });
      }
      
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'This invite code has expired.'
      );
    }
    
    // Check if the property exists
    const propertyDoc = await db.collection('properties').doc(inviteCodeData.propertyId).get();
    if (!propertyDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'The property associated with this invite code could not be found.'
      );
    }
    
    const propertyData = propertyDoc.data();
    
    // Return validation success with limited property information
    return {
      isValid: true,
      message: 'Valid invite code',
      propertyId: inviteCodeData.propertyId,
      propertyName: propertyData?.name || 'Property',
      unitId: inviteCodeData.unitId || null,
      restrictedEmail: inviteCodeData.email || null
    };
  } catch (error) {
    // Forward HttpsError errors
    if (error instanceof HttpsError) {
      throw error;
    }
    
    functions.logger.error('Error validating invite code:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while validating the invite code. Please try again later.'
    );
  }
});

/**
 * Redeem an invite code to associate a tenant with a property
 * This function allows tenants to use invite codes during or after registration
 */
export const redeemInviteCode = functions.https.onCall(async (data: any, context: any) => {
  // Ensure user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to redeem an invite code.'
    );
  }
  
  // Get parameters from request
  const { code } = data;
  const tenantId = context.auth.uid;
  
  // Validate code
  if (!code || !isValidInviteCode(code)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid invite code format. Codes must be 6-12 alphanumeric characters.'
    );
  }
  
  // Standardize code format
  const normalizedCode = code.toUpperCase();
  const db = admin.firestore();
  
  try {
    // Transaction to ensure atomicity of the redemption process
    return await db.runTransaction(async (transaction) => {
      // Get the invite code
      const inviteCodeQuery = await transaction.get(
        db.collection(INVITE_CODES_COLLECTION)
          .where('code', '==', normalizedCode)
          .limit(1)
      );
      
      if (inviteCodeQuery.empty) {
        throw new functions.https.HttpsError(
          'not-found',
          'Invalid invite code. Please check the code and try again.'
        );
      }
      
      const inviteCodeDoc = inviteCodeQuery.docs[0];
      const inviteCodeData = inviteCodeDoc.data() as InviteCode;
      const inviteCodeId = inviteCodeDoc.id;
      
      // Validate the code status
      if (inviteCodeData.status === 'used') {
        throw new functions.https.HttpsError(
          'already-exists',
          'This invite code has already been used.'
        );
      }
      
      if (inviteCodeData.status === 'revoked') {
        throw new functions.https.HttpsError(
          'permission-denied',
          'This invite code has been revoked.'
        );
      }
      
      if (inviteCodeData.status === 'expired' || 
          (inviteCodeData.expiresAt && inviteCodeData.expiresAt.toMillis() < Date.now())) {
        throw new functions.https.HttpsError(
          'deadline-exceeded',
          'This invite code has expired.'
        );
      }
      
      // Check if email restriction applies and matches user's email
      if (inviteCodeData.email) {
        const userRecord = await admin.auth().getUser(tenantId);
        if (userRecord.email?.toLowerCase() !== inviteCodeData.email.toLowerCase()) {
          throw new functions.https.HttpsError(
            'permission-denied',
            `This invite code is restricted to ${inviteCodeData.email}.`
          );
        }
      }
      
      // Get the property information
      const propertyId = inviteCodeData.propertyId;
      const unitId = inviteCodeData.unitId;
      
      const propertyDoc = await transaction.get(db.collection('properties').doc(propertyId));
      if (!propertyDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'The property associated with this invite code could not be found.'
        );
      }
      
      const propertyData = propertyDoc.data();
      
      // Get the user profile
      const userDoc = await transaction.get(db.collection('users').doc(tenantId));
      if (!userDoc.exists) {
        throw new functions.https.HttpsError(
          'not-found',
          'User profile not found. Please complete your profile before redeeming an invite code.'
        );
      }
      
      // Check if the tenant is already associated with this property
      const existingRelationshipQuery = await transaction.get(
        db.collection(PROPERTY_TENANT_RELATIONSHIPS_COLLECTION)
          .where('tenantId', '==', tenantId)
          .where('propertyId', '==', propertyId)
          .where('status', '==', 'active')
          .limit(1)
      );
      
      if (!existingRelationshipQuery.empty) {
        throw new functions.https.HttpsError(
          'already-exists',
          'You are already associated with this property.'
        );
      }
      
      const now = admin.firestore.Timestamp.now();
      
      // Create the property-tenant relationship
      const relationshipData: PropertyTenantRelationship = {
        propertyId,
        tenantId,
        unitId: unitId || undefined,
        status: 'active',
        inviteCodeId,
        startDate: now
      };
      
      const relationshipRef = db.collection(PROPERTY_TENANT_RELATIONSHIPS_COLLECTION).doc();
      transaction.set(relationshipRef, relationshipData);
      
      // Update the invite code to mark as used
      transaction.update(db.collection(INVITE_CODES_COLLECTION).doc(inviteCodeId), {
        status: 'used',
        usedBy: tenantId,
        usedAt: now
      });
      
      // Update the user's profile
      const userData = userDoc.data();
      const userUpdateData: Record<string, any> = {
        // Only set these if not already set
        role: userData?.role || 'tenant',
        userType: userData?.userType || 'tenant',
        propertyId: propertyId,           // ✅ CRITICAL FIX: Add propertyId
        landlordId: inviteCodeData.landlordId, // ✅ CRITICAL FIX: Add landlordId
        updatedAt: now
      };
      
      // If the user doesn't have properties array, create it
      if (!userData?.properties || !Array.isArray(userData.properties)) {
        userUpdateData.properties = [{ id: propertyId, role: 'tenant' }];
      } else {
        // Check if property is already in user's properties
        const existingPropertyIndex = userData.properties.findIndex((p: any) => p.id === propertyId);
        if (existingPropertyIndex === -1) {
          // Add property to user's properties
          userUpdateData.properties = [
            ...userData.properties,
            { id: propertyId, role: 'tenant' }
          ];
        }
      }
      
      transaction.update(db.collection('users').doc(tenantId), userUpdateData);
      
      // Update the property record if needed to include the tenant
      const updatedPropertyData: Record<string, any> = {
        updatedAt: now
      };
      
      // Handle unit-specific or general property assignment
      if (unitId && propertyData?.units) {
        const units = propertyData.units || [];
        const unitIndex = units.findIndex((u: any) => u.id === unitId || u.unitNumber === unitId);
        
        if (unitIndex !== -1) {
          // Unit exists, add tenant to it
          const updatedUnits = [...units];
          const unit = updatedUnits[unitIndex];
          
          // If unit has tenants array, add to it; otherwise create it
          if (!unit.tenants || !Array.isArray(unit.tenants)) {
            unit.tenants = [tenantId];
          } else if (!unit.tenants.includes(tenantId)) {
            unit.tenants.push(tenantId);
          }
          
          updatedUnits[unitIndex] = unit;
          updatedPropertyData.units = updatedUnits;
        } else {
          // Unit doesn't exist, add it to property
          const newUnit = {
            id: unitId,
            unitNumber: unitId,
            tenants: [tenantId]
          };
          updatedPropertyData.units = [...units, newUnit];
        }
      } else {
        // No specific unit, add tenant to overall property tenants list
        let tenants = propertyData?.tenants || [];
        if (!Array.isArray(tenants)) {
          tenants = [];
        }
        
        if (!tenants.includes(tenantId)) {
          tenants.push(tenantId);
          updatedPropertyData.tenants = tenants;
        }
      }
      
      transaction.update(db.collection('properties').doc(propertyId), updatedPropertyData);
      
      // Return success response with property details
      return {
        success: true,
        message: 'Invite code redeemed successfully',
        propertyId,
        propertyName: propertyData?.name || 'Property',
        unitId: unitId || null,
        relationshipId: relationshipRef.id
      };
    });
  } catch (error) {
    // Forward HttpsError errors
    if (error instanceof HttpsError) {
      throw error;
    }
    
    functions.logger.error('Error redeeming invite code:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while redeeming the invite code. Please try again later.'
    );
  }
}); 