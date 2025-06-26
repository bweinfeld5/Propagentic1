const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { logger } = require('firebase-functions');

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

/**
 * Firebase Callable Function: acceptTenantInvite
 * 
 * Allows a tenant to accept an invite from a landlord using an 8-digit invite code.
 * This is a clean, simple implementation that replaces the over-engineered system.
 * 
 * @param {Object} data - { inviteCode: string }
 * @param {Object} context - Firebase Functions context with authenticated user
 * @returns {Object} { success: boolean, message: string, propertyId?: string }
 */
exports.acceptTenantInvite = functions.https.onCall(async (data, context) => {
  // Check if user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }

  const { inviteCode } = data;
  const uid = context.auth.uid;

  // Validate input
  if (!inviteCode || typeof inviteCode !== 'string') {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'inviteCode must be a non-empty string.'
    );
  }

  // Validate invite code format (8 digits)
  const codeRegex = /^\d{8}$/;
  if (!codeRegex.test(inviteCode)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid invite code format. Code must be 8 digits.'
    );
  }

  logger.info(`Starting invite acceptance for user ${uid} with code ${inviteCode}`);

  try {
    // Step 1: Fetch the tenant profile using the authenticated user's uid
    const tenantProfileRef = db.collection('tenantProfiles').doc(uid);
    const tenantProfileDoc = await tenantProfileRef.get();

    if (!tenantProfileDoc.exists) {
      logger.error(`Tenant profile not found for uid: ${uid}`);
      throw new functions.https.HttpsError(
        'not-found',
        'Tenant profile not found. Please complete your profile setup first.'
      );
    }

    const tenantProfile = tenantProfileDoc.data();
    logger.info(`Found tenant profile for uid: ${uid}`);

    // Step 2: Search for the invite by code
    const inviteQuery = await db.collection('invites')
      .where('code', '==', inviteCode)
      .limit(1)
      .get();

    if (inviteQuery.empty) {
      logger.warn(`Invalid invite code attempted: ${inviteCode}`);
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Invalid invite code.'
      );
    }

    const inviteDoc = inviteQuery.docs[0];
    const invite = inviteDoc.data();
    const propertyId = invite.propertyId;

    logger.info(`Found invite for property: ${propertyId}`);

    // Step 3: Verify that the property exists
    const propertyRef = db.collection('properties').doc(propertyId);
    const propertyDoc = await propertyRef.get();

    if (!propertyDoc.exists) {
      logger.error(`Property not found: ${propertyId}`);
      throw new functions.https.HttpsError(
        'not-found',
        'Property does not exist.'
      );
    }

    const property = propertyDoc.data();
    logger.info(`Verified property exists: ${propertyId}`);

    // Step 4: Check if tenant is already linked to this property
    const currentProperties = tenantProfile.properties || [];
    if (currentProperties.includes(propertyId)) {
      logger.warn(`Tenant ${uid} already linked to property ${propertyId}`);
      throw new functions.https.HttpsError(
        'already-exists',
        'Tenant already linked to this property.'
      );
    }

    // Step 5: Add the property to the tenant's properties array
    const updatedProperties = [...currentProperties, propertyId];
    
    await tenantProfileRef.update({
      properties: updatedProperties,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    logger.info(`Successfully linked tenant ${uid} to property ${propertyId}`);

    // Return success response
    return {
      success: true,
      message: 'Successfully joined property!',
      propertyId: propertyId,
      propertyAddress: property.address || property.streetAddress || 'Unknown address'
    };

  } catch (error) {
    // Re-throw HttpsError instances as-is
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }

    // Log unexpected errors and throw generic error
    logger.error('Unexpected error in acceptTenantInvite:', error);
    throw new functions.https.HttpsError(
      'internal',
      'An internal error occurred while processing the invite.'
    );
  }
}); 