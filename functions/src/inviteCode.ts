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

// Note: PropertyTenantRelationship interface removed as we no longer use separate relationship documents.
// All tenant-property relationships are now stored in the user's propertyAssociations array.

// This should match the PropertyAssociation in `tenantSchema.ts`
interface PropertyAssociation {
  propertyId: string;
  unitId?: string;
  status: 'active' | 'pending' | 'terminated' | 'invited';
  startDate: FirebaseFirestore.Timestamp;
  endDate?: FirebaseFirestore.Timestamp;
  inviteId?: string;
  inviteCodeId?: string;
}

// Collection names
const INVITE_CODES_COLLECTION = 'inviteCodes';
const USERS_COLLECTION = 'users';
const PROPERTIES_COLLECTION = 'properties';
const FUNCTION_CALL_LOGS_COLLECTION = 'functionCallLogs';

// Rate limiting configuration - different limits for different functions
const RATE_LIMIT_PERIOD_MINUTES = 60;
const MAX_GENERATE_CALLS_PER_PERIOD = 50;  // Lower limit for code generation
const MAX_REDEEM_CALLS_PER_PERIOD = 100;   // Moderate limit for redemption
const MAX_VALIDATE_CALLS_PER_PERIOD = 200; // Higher limit for validation (real-time checks)

// Validate invite code format
const isValidInviteCode = (code: string): boolean => {
  // Alphanumeric code, 6-12 characters, case-insensitive
  const regex = /^[a-zA-Z0-9]{6,12}$/;
  return regex.test(code);
};

/**
 * Helper function to safely log function calls for rate limiting
 */
const logFunctionCall = async (
  db: FirebaseFirestore.Firestore,
  functionName: string,
  userId?: string,
  identifier?: string
): Promise<void> => {
  try {
    const logData: any = {
      function: functionName,
      timestamp: admin.firestore.Timestamp.now(),
    };

    if (userId) {
      logData.userId = userId;
    }
    if (identifier) {
      logData.identifier = identifier;
    }

    await db.collection(FUNCTION_CALL_LOGS_COLLECTION).add(logData);
  } catch (error) {
    // Log the error but don't let it break the main function
    functions.logger.warn(`Failed to log function call for rate limiting: ${error}`);
  }
};

/**
 * Helper function to check rate limits for authenticated users
 */
const checkAuthenticatedUserRateLimit = async (
  db: FirebaseFirestore.Firestore,
  userId: string,
  functionName: string,
  maxCalls: number
): Promise<void> => {
  const now = admin.firestore.Timestamp.now();
  const cutoff = new admin.firestore.Timestamp(now.seconds - (RATE_LIMIT_PERIOD_MINUTES * 60), now.nanoseconds);
  
  const recentCalls = await db.collection(FUNCTION_CALL_LOGS_COLLECTION)
    .where('userId', '==', userId)
    .where('function', '==', functionName)
    .where('timestamp', '>', cutoff)
    .get();

  if (recentCalls.size >= maxCalls) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      `You have exceeded the limit for ${functionName}. Please try again later.`
    );
  }
};

/**
 * Helper function to check rate limits for anonymous users (by IP)
 */
const checkAnonymousUserRateLimit = async (
  db: FirebaseFirestore.Firestore,
  identifier: string,
  functionName: string,
  maxCalls: number
): Promise<void> => {
  // Validate IP address format to prevent injection
  if (!identifier || identifier.length > 45) { // IPv6 max length is 45 chars
    throw new functions.https.HttpsError('invalid-argument', 'Invalid client identifier');
  }

  const now = admin.firestore.Timestamp.now();
  const cutoff = new admin.firestore.Timestamp(now.seconds - (RATE_LIMIT_PERIOD_MINUTES * 60), now.nanoseconds);
  
  const recentCalls = await db.collection(FUNCTION_CALL_LOGS_COLLECTION)
    .where('identifier', '==', identifier)
    .where('function', '==', functionName)
    .where('timestamp', '>', cutoff)
    .get();

  if (recentCalls.size >= maxCalls) {
    throw new functions.https.HttpsError(
      'resource-exhausted',
      'Rate limit exceeded. Please try again later.'
    );
  }
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
  const db = admin.firestore();
  functions.logger.info(`🔧 Generating invite code for user: ${userId}`);

  // Rate Limiting Check
  await checkAuthenticatedUserRateLimit(db, userId, 'generateInviteCode', MAX_GENERATE_CALLS_PER_PERIOD);

  try {
    // Get the user data to check role
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
  if (!propertyId || typeof propertyId !== 'string' || propertyId.length > 100) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Valid property ID is required'
    );
  }

  // Validate optional parameters
  if (unitId && (typeof unitId !== 'string' || unitId.length > 50)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid unit ID format'
    );
  }

  if (email && (typeof email !== 'string' || email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid email format'
    );
  }

  if (typeof expirationDays !== 'number' || expirationDays < 1 || expirationDays > 365) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Expiration days must be between 1 and 365'
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
    
    // Log the successful function call for rate limiting
    await logFunctionCall(db, 'generateInviteCode', userId);
    
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
  const db = admin.firestore();
  
  // Rate limiting for both authenticated and anonymous users
  const functionName = 'validateInviteCode';
  if (context.auth?.uid) {
    // Authenticated user - use userId for rate limiting
    await checkAuthenticatedUserRateLimit(db, context.auth.uid, functionName, MAX_VALIDATE_CALLS_PER_PERIOD);
  } else {
    // Anonymous user - use IP for rate limiting
    const clientIP = context.rawRequest.ip;
    await checkAnonymousUserRateLimit(db, clientIP, functionName, MAX_VALIDATE_CALLS_PER_PERIOD);
  }

  // Get the code from the request
  const { code } = data;
  
  // Validate input parameters
  if (!data || typeof data !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request data');
  }

  // Validate code format
  if (!code || typeof code !== 'string' || !isValidInviteCode(code)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid invite code format. Codes must be 6-12 alphanumeric characters.'
    );
  }
  
  const normalizedCode = code.toUpperCase();
  
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
    
    // Log the call
    if (context.auth?.uid) {
      await logFunctionCall(db, functionName, context.auth.uid);
    } else {
      await logFunctionCall(db, functionName, undefined, context.rawRequest.ip);
    }

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
  
  const tenantId = context.auth.uid;
  const db = admin.firestore();
  
  // Rate Limiting
  const functionName = 'redeemInviteCode';
  await checkAuthenticatedUserRateLimit(db, tenantId, functionName, MAX_REDEEM_CALLS_PER_PERIOD);

  // Get parameters from request
  const { code } = data;
  
  // Validate input parameters
  if (!data || typeof data !== 'object') {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid request data');
  }

  if (!code || typeof code !== 'string' || !isValidInviteCode(code)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid invite code format. Codes must be 6-12 alphanumeric characters.'
    );
  }
  
  const normalizedCode = code.toUpperCase();
  
  try {
    return await db.runTransaction(async (transaction) => {
      // 1. Get and validate the invite code
      const inviteCodeQuery = await transaction.get(
        db.collection(INVITE_CODES_COLLECTION).where('code', '==', normalizedCode).limit(1)
      );

      if (inviteCodeQuery.empty) {
        throw new functions.https.HttpsError('not-found', 'Invalid invite code.');
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
      
      // 2. Get user and property documents
      const propertyId = inviteCodeData.propertyId;
      const unitId = inviteCodeData.unitId;
      const userDocRef = db.collection(USERS_COLLECTION).doc(tenantId);
      const propertyDocRef = db.collection(PROPERTIES_COLLECTION).doc(propertyId);

      const [userSnapshot, propertySnapshot] = await transaction.getAll(userDocRef, propertyDocRef);

      if (!propertySnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'Associated property not found.');
      }
      if (!userSnapshot.exists) {
        throw new functions.https.HttpsError('not-found', 'User profile not found.');
      }
      
      const userData = userSnapshot.data() || {};
      const propertyData = propertySnapshot.data() || {};

      // 3. Create and add the new property association to the user
      const newAssociation: PropertyAssociation = {
        propertyId: propertyId,
        unitId: unitId || undefined,
        status: 'active',
        startDate: admin.firestore.Timestamp.now(),
        inviteCodeId: inviteCodeId,
      };

      const existingAssociations = userData.propertyAssociations || [];
      const associationExists = existingAssociations.some(
        (assoc: PropertyAssociation) => assoc.propertyId === propertyId && assoc.status === 'active'
      );

      if (associationExists) {
        throw new functions.https.HttpsError('already-exists', 'You are already associated with this property.');
      }
      
      transaction.update(userDocRef, {
        propertyAssociations: [...existingAssociations, newAssociation],
        updatedAt: admin.firestore.Timestamp.now(),
      });
      
      // 4. Update the invite code to mark it as used
      transaction.update(inviteCodeDoc.ref, {
        status: 'used',
        usedBy: tenantId,
        usedAt: admin.firestore.Timestamp.now(),
      });

      // 5. Update the property document to add the tenant
      if (unitId && propertyData.units) {
        const units = [...propertyData.units];
        const unitIndex = units.findIndex((u: any) => u.id === unitId || u.unitNumber === unitId);
        if (unitIndex !== -1) {
          const unitTenants = units[unitIndex].tenants || [];
          if (!unitTenants.includes(tenantId)) {
            units[unitIndex].tenants.push(tenantId);
            transaction.update(propertyDocRef, { units: units, updatedAt: admin.firestore.Timestamp.now() });
          }
        }
      } else {
        const propertyTenants = propertyData.tenants || [];
        if (!propertyTenants.includes(tenantId)) {
          transaction.update(propertyDocRef, { tenants: [...propertyTenants, tenantId], updatedAt: admin.firestore.Timestamp.now() });
        }
      }

      // Log successful call
      await logFunctionCall(db, functionName, tenantId);

      return {
        success: true,
        message: 'Invite code redeemed successfully',
        propertyId,
        propertyName: propertyData.name || 'Property',
        unitId: unitId || null,
      };
    });
  } catch (error) {
    if (error instanceof HttpsError) {
      throw error;
    }
    functions.logger.error('Error redeeming invite code:', error);
    throw new functions.https.HttpsError('internal', 'An internal error occurred.');
  }
}); 