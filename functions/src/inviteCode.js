const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// Validate invite code format
const isValidInviteCode = (code) => {
  // Alphanumeric code, 6-12 characters, case-insensitive
  const regex = /^[a-zA-Z0-9]{6,12}$/;
  return regex.test(code);
};

/**
 * Generate an invite code for a property
 * This function allows landlords to create codes that tenants can use to register
 */
exports.generateInviteCode = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated and has a landlord role
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be logged in to create an invite code.'
    );
  }

  // Get the user data to check role
  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(context.auth.uid).get();
  
  if (!userDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'User profile not found.'
    );
  }
  
  const userData = userDoc.data();
  
  // Verify user is a landlord or property manager
  if (userData?.role !== 'landlord' && userData?.role !== 'admin' && userData?.role !== 'property_manager') {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Only landlords and property managers can create invite codes.'
    );
  }

  // Get parameters from request
  const { propertyId, unitId, email, expirationDays = 7 } = data;

  // Validate required parameters
  if (!propertyId) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Property ID is required.'
    );
  }

  // Check if the property exists and the user has access to it
  const propertyDoc = await db.collection('properties').doc(propertyId).get();
  if (!propertyDoc.exists) {
    throw new functions.https.HttpsError(
      'not-found',
      'Property not found.'
    );
  }

  const propertyData = propertyDoc.data();
  
  // Check if the user has access to this property
  const hasAccess = propertyData?.ownerId === context.auth.uid ||
                   (propertyData?.managers && propertyData.managers.includes(context.auth.uid)) ||
                   userData?.role === 'admin';
  
  if (!hasAccess) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'You do not have permission to create invite codes for this property.'
    );
  }

  // Verify unit exists if specified
  if (unitId && propertyData?.units) {
    const unitExists = propertyData.units.some((unit) => unit.id === unitId || unit.unitNumber === unitId);
    if (!unitExists) {
      throw new functions.https.HttpsError(
        'not-found',
        'The specified unit could not be found in this property.'
      );
    }
  }

  try {
    // Generate a unique code
    let code;
    let isUnique = false;
    
    // Define character set for codes excluding similar-looking characters
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excludes I, O, 0, 1
    
    // Try to generate a unique code
    while (!isUnique) {
      // Generate an 8-character code
      code = '';
      for (let i = 0; i < 8; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      
      // Check if the code already exists
      const codeQuery = await db.collection('inviteCodes')
        .where('code', '==', code)
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
    const inviteCodeData = {
      code,
      landlordId: context.auth.uid,
      propertyId,
      unitId: unitId || undefined,
      email: email || undefined,
      status: 'active',
      createdAt: now,
      expiresAt
    };
    
    const inviteCodeRef = await db.collection('inviteCodes').add(inviteCodeData);
    
    // Return the created invite code
    return {
      success: true,
      inviteCode: {
        id: inviteCodeRef.id,
        ...inviteCodeData,
        createdAt: inviteCodeData.createdAt.toMillis(),
        expiresAt: inviteCodeData.expiresAt.toMillis()
      }
    };
  } catch (error) {
    logger.error('Error creating invite code:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while creating the invite code. Please try again later.'
    );
  }
});

// All tenant redemption functionality has been removed
// This includes: redeemInviteCode, validateInviteCode, and related functions
// To be rebuilt with a simpler, more reliable approach 