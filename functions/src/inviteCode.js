const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Timestamp } = require('firebase-admin/firestore');
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
 * Redeem an invite code to associate a tenant with a property
 * This function allows tenants to use invite codes as an alternative to email invitations
 */
exports.redeemInviteCode = functions.https.onCall(async (data, context) => {
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

  // Check if code is provided and in valid format
  if (!code) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'No invite code provided.'
    );
  }

  if (!isValidInviteCode(code)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid invite code format. Codes must be 6-12 alphanumeric characters.'
    );
  }

  // Standardize code format (uppercase for consistency)
  const normalizedCode = code.toUpperCase();

  try {
    const db = admin.firestore();
    
    // Check if the invite code exists in the database
    // First try shortCode field (8-digit codes), then try document ID (20-char codes)
    let inviteCodeQuery = await db
      .collection('invites')
      .where('shortCode', '==', normalizedCode)
      .limit(1)
      .get();
    
    // If not found by shortCode, try by document ID
    if (inviteCodeQuery.empty) {
      const inviteDocRef = db.collection('invites').doc(normalizedCode);
      const inviteDoc = await inviteDocRef.get();
      if (inviteDoc.exists) {
        inviteCodeQuery = { docs: [inviteDoc], empty: false };
      }
    }

    if (inviteCodeQuery.empty) {
      throw new functions.https.HttpsError(
        'not-found',
        'Invalid invite code. Please check the code and try again.'
      );
    }

    const inviteCodeDoc = inviteCodeQuery.docs[0];
    const inviteCodeData = inviteCodeDoc.data();

    // Check if the invite code has already been used (check status field)
    if (inviteCodeData.status === 'accepted' || inviteCodeData.status === 'used') {
      throw new functions.https.HttpsError(
        'already-exists',
        'This invite code has already been used.'
      );
    }

    // Check if the invite code has expired
    const now = Timestamp.now();
    if (inviteCodeData.expiresAt && inviteCodeData.expiresAt.toMillis() < now.toMillis()) {
      throw new functions.https.HttpsError(
        'deadline-exceeded',
        'This invite code has expired.'
      );
    }

    // Get the property information from the invite code
    const propertyId = inviteCodeData.propertyId;
    const landlordId = inviteCodeData.landlordId;
    const unitId = inviteCodeData.unitId || null;

    // Check if the property exists
    const propertyDoc = await db.collection('properties').doc(propertyId).get();
    if (!propertyDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'The property associated with this invite code could not be found.'
      );
    }

    // Get the user's information
    const userDoc = await db.collection('users').doc(tenantId).get();
    if (!userDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'User profile not found. Please complete your profile before redeeming an invite code.'
      );
    }

    const userData = userDoc.data();
    
    // Update user's profile to include the property
    const userUpdateData = {
      propertyId,
      role: 'tenant',
      userType: 'tenant',
      updatedAt: now
    };

    // Add the unit ID if provided
    if (unitId) {
      userUpdateData.unitId = unitId;
    }

    // If the user doesn't have properties array, create it
    if (!userData.properties || !Array.isArray(userData.properties)) {
      userUpdateData.properties = [{ id: propertyId, role: 'tenant' }];
    } else {
      // Check if the property is already in the user's properties
      const existingPropertyIndex = userData.properties.findIndex(p => p.id === propertyId);
      if (existingPropertyIndex === -1) {
        // Add the property to the user's properties
        userUpdateData.properties = [
          ...userData.properties,
          { id: propertyId, role: 'tenant' }
        ];
      }
    }

    // Transaction to update multiple documents atomically
    await db.runTransaction(async (transaction) => {
      // Update the user's profile
      transaction.update(db.collection('users').doc(tenantId), userUpdateData);

      // Update the property to include the tenant
      const propertyData = propertyDoc.data();
      
      // If unitId is provided, add the tenant to the specific unit
      if (unitId) {
        // Get the current units array
        const units = propertyData.units || [];
        // Find the target unit
        const unitIndex = units.findIndex(u => u.id === unitId || u.unitNumber === unitId);
        
        if (unitIndex !== -1) {
          // Unit exists, add tenant to it
          const updatedUnits = [...units];
          const unit = updatedUnits[unitIndex];
          
          // If unit has tenants array, add to it, otherwise create it
          if (!unit.tenants || !Array.isArray(unit.tenants)) {
            unit.tenants = [tenantId];
          } else if (!unit.tenants.includes(tenantId)) {
            unit.tenants.push(tenantId);
          }
          
          updatedUnits[unitIndex] = unit;
          transaction.update(db.collection('properties').doc(propertyId), { 
            units: updatedUnits,
            updatedAt: now
          });
        } else {
          // Unit doesn't exist, add it to the property
          const newUnit = {
            id: unitId,
            unitNumber: unitId,
            tenants: [tenantId]
          };
          transaction.update(db.collection('properties').doc(propertyId), {
            units: [...units, newUnit],
            updatedAt: now
          });
        }
      } else {
        // No specific unit, add tenant to the overall property tenants list
        let tenants = propertyData.tenants || [];
        if (!Array.isArray(tenants)) {
          tenants = [];
        }
        
        if (!tenants.includes(tenantId)) {
          tenants.push(tenantId);
          transaction.update(db.collection('properties').doc(propertyId), { 
            tenants,
            updatedAt: now
          });
        }
      }

      // Mark the invite code as used
      transaction.update(db.collection('invites').doc(inviteCodeDoc.id), {
        status: 'accepted',
        usedBy: tenantId,
        usedAt: now
      });

      // Create a record in tenantProperties collection for tracking
      const tenantPropertyRef = db.collection('tenantProperties').doc();
      transaction.set(tenantPropertyRef, {
        tenantId,
        propertyId,
        unitId: unitId || null,
        landlordId,
        inviteCodeId: inviteCodeDoc.id,
        status: 'active',
        createdAt: now
      });
    });

    // Get the property details to return to the client
    const updatedPropertyDoc = await db.collection('properties').doc(propertyId).get();
    const propertyData = updatedPropertyDoc.data();

    // Return success response with property details
    return {
      success: true,
      message: 'Invite code redeemed successfully',
      property: {
        id: propertyId,
        name: propertyData.name || 'Property',
        formattedAddress: propertyData.formattedAddress || '',
        unitId: unitId || null
      }
    };
  } catch (error) {
    logger.error('Error redeeming invite code:', error);
    
    // Specific error if it's an HttpsError
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    // Generic error for unexpected issues
    throw new functions.https.HttpsError(
      'internal',
      'An error occurred while redeeming the invite code. Please try again later.'
    );
  }
}); 