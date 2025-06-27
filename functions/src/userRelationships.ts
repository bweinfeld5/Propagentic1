// import * as functions from "firebase-functions"; // Removed unused v1 import
import { HttpsError, onCall, CallableRequest } from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";
import { sendPropertyInvitationEmailUnified } from './unifiedEmailService';

// Ensure admin is initialized if needed (though index.ts should handle it)
if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

/**
 * Sends a property invitation to a potential tenant.
 * Creates an invite document in Firestore.
 */
export const sendPropertyInvite = onCall(async (request: CallableRequest<{ propertyId: string; tenantEmail: string }>) => {
  logger.info("sendPropertyInvite function called with data:", request.data);

  // 1. Authentication Check
  if (!request.auth) {
    logger.error("sendPropertyInvite: Unauthenticated call.");
    throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
    );
  }
  const landlordUid = request.auth.uid;

  // 2. Input Validation
  const { propertyId, tenantEmail } = request.data;
  if (!propertyId || !tenantEmail) {
    logger.error("sendPropertyInvite: Missing propertyId or tenantEmail.", request.data);
    throw new HttpsError("invalid-argument", "Property ID and Tenant Email are required.");
  }

  // Basic email format check (can be improved)
  if (!/\S+@\S+\.\S+/.test(tenantEmail)) {
      logger.error("sendPropertyInvite: Invalid tenant email format.", { email: tenantEmail });
      throw new HttpsError("invalid-argument", "Invalid tenant email format provided.");
  }

  try {
    logger.info(`Attempting to send invite from landlord ${landlordUid} to ${tenantEmail} for property ${propertyId}`);

    // 3. Fetch Optional Data (Landlord Name & Property Name)
    let landlordName = "Your Landlord"; // Default
    let propertyName = "Their Property"; // Default

    try {
      const landlordUserSnap = await db.collection("users").doc(landlordUid).get();
      if (landlordUserSnap.exists) {
        const landlordData = landlordUserSnap.data();
        landlordName = landlordData?.displayName || landlordData?.firstName || landlordName;
      }

      const propertySnap = await db.collection("properties").doc(propertyId).get();
      if (propertySnap.exists) {
        propertyName = propertySnap.data()?.name || propertyName;
      }
    } catch (fetchError: any) { // Catch errors during optional data fetch but proceed
      logger.warn("sendPropertyInvite: Could not fetch landlord/property name, using defaults.", { error: fetchError.message });
    }

    // 4. Send Email Using Unified Service (Same Logic as Working Browser Tests)
    logger.info(`Sending invitation email using unified service for ${tenantEmail}`);
    
    let propertyAddress = '';
    try {
      const propertySnap = await db.collection("properties").doc(propertyId).get();
      if (propertySnap.exists) {
        const propertyData = propertySnap.data();
        if (propertyData?.streetAddress) {
          propertyAddress = `${propertyData.streetAddress}`;
          if (propertyData.city) propertyAddress += `, ${propertyData.city}`;
          if (propertyData.state) propertyAddress += `, ${propertyData.state}`;
        }
      }
    } catch (error: any) {
      logger.warn("Could not fetch property address:", error.message);
    }

    const emailResult = await sendPropertyInvitationEmailUnified({
      tenantEmail: tenantEmail.toLowerCase(),
      landlordName: landlordName,
      propertyName: propertyName,
      propertyAddress: propertyAddress || undefined
    });

    // 5. Create Invite Document with Email Info
    const inviteData = {
      landlordId: landlordUid,
      landlordName: landlordName,
      propertyId: propertyId,
      propertyName: propertyName,
      propertyAddress: propertyAddress,
      tenantEmail: tenantEmail.toLowerCase(),
      status: "sent", // Changed from "pending" to "sent" since email is sent
      emailSent: true,
      emailSentAt: admin.firestore.FieldValue.serverTimestamp(),
      mailDocId: emailResult.mailDocId,
      inviteCode: emailResult.inviteCode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      method: "unified_service", // Track that this used the unified service
    };

    const inviteRef = await db.collection("invites").add(inviteData);
    logger.info(`Successfully created invite document ${inviteRef.id} and sent email to ${tenantEmail} via unified service`, {
      inviteId: inviteRef.id,
      mailDocId: emailResult.mailDocId,
      inviteCode: emailResult.inviteCode
    });

    // 6. Return Success with Details
    return { 
      success: true, 
      message: "Invitation sent successfully via unified email service.", 
      inviteId: inviteRef.id,
      mailDocId: emailResult.mailDocId,
      inviteCode: emailResult.inviteCode,
      method: "unified_service"
    };

  } catch (error: any) {
    logger.error("sendPropertyInvite: Failed to send invitation.", { 
        error: error.message, 
        landlordUid, 
        propertyId, 
        tenantEmail 
    });
    if (error instanceof HttpsError) { // Re-throw HttpsErrors
        throw error;
    }
    // Throw a generic internal error for other issues
    throw new HttpsError("internal", "An unexpected error occurred while sending the invitation.");
  }
});

// TODO: Implement addContractorToRolodex logic
export const addContractorToRolodex = onCall(async (request: CallableRequest<any>) => {
  logger.warn("addContractorToRolodex function called but not implemented.");
  // Placeholder logic - Replace with actual implementation
  return { success: false, message: "Function not implemented yet." };
});

/**
 * Firebase Cloud Function: acceptPropertyInvite
 * Updates relevant documents when a tenant accepts a property invitation.
 */
export const acceptPropertyInvite = onCall(async (request: CallableRequest<{ inviteId: string }>) => {
  // 1. Authentication Check: Ensure the user is authenticated.
  if (!request.auth) {
    logger.error("acceptPropertyInvite: Unauthenticated call.");
    throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
    );
  }

  const tenantUid = request.auth.uid;
  const tenantEmail = request.auth.token.email;
  const inviteId = request.data.inviteId;

  if (!inviteId) {
    logger.error("acceptPropertyInvite: Missing inviteId argument.");
    throw new HttpsError("invalid-argument", "Invite ID is required.");
  }

  logger.info(`Tenant ${tenantUid} attempting to accept invite ${inviteId}`);

  const inviteRef = db.collection("invites").doc(inviteId);
  const tenantUserRef = db.collection("users").doc(tenantUid);
  let landlordProfileRef: admin.firestore.DocumentReference | null = null;

  try {
    // 2. Run as transaction for atomicity
    await db.runTransaction(async (transaction) => {
      // Read documents within the transaction
      const inviteSnap = await transaction.get(inviteRef);
      const tenantUserSnap = await transaction.get(tenantUserRef);

      // 3. Validation
      if (!inviteSnap.exists) {
        throw new HttpsError("not-found", "Invitation not found.");
      }
      if (!tenantUserSnap.exists) {
        throw new HttpsError("not-found", "Tenant user profile not found.");
      }

      // Assert data exists after checking exists
      const inviteData = inviteSnap.data()!;
      const tenantUserData = tenantUserSnap.data()!;

      const propertyId = inviteData.propertyId;
      const landlordId = inviteData.landlordId;

      // Verify tenant email matches the invite
      if (inviteData.tenantEmail !== tenantEmail) {
        logger.warn(`Permission Denied: Invite email (${inviteData.tenantEmail}) != Auth email (${tenantEmail}) for invite ${inviteId}`);
        throw new HttpsError(
            "permission-denied",
            "This invitation is not for you."
        );
      }
      // Verify invite status is pending
      if (inviteData.status !== "pending") {
        throw new HttpsError(
            "failed-precondition",
            `This invitation has already been ${inviteData.status}.`
        );
      }
      // Check required data from invite
      if (!propertyId || !landlordId) {
        logger.error(`Invite ${inviteId} is missing propertyId or landlordId.`);
        throw new HttpsError("internal", "Invite data is incomplete.");
      }

      const propertyRef = db.collection("properties").doc(propertyId);
      landlordProfileRef = db.collection("landlordProfiles").doc(landlordId);

      // Check if property exists within transaction
      const propertySnap = await transaction.get(propertyRef);
      if (!propertySnap.exists) {
        logger.error(`Property ${propertyId} from invite ${inviteId} not found.`);
        throw new HttpsError("not-found", "The property associated with this invite no longer exists.");
      }

      // Check if tenant is already linked to THIS property (idempotency)
      // If using single property model (as current code does): Check if tenantUserData.propertyId exists AT ALL
      // Let's stick to the single property model for now based on existing code:
      if (tenantUserData.propertyId) {
        if (tenantUserData.propertyId === propertyId) {
          logger.warn(`Tenant ${tenantUid} already linked to property ${propertyId}. Invite ${inviteId} acceptance is idempotent.`);
          // Don't throw error, just update invite status and proceed if needed, or return early?
          // For simplicity, let's just update the invite and return.
          transaction.update(inviteRef, {
            status: "accepted",
            acceptedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          return; // Exit transaction early
        } else {
          logger.error(`Tenant ${tenantUid} is already associated with a different property (${tenantUserData.propertyId}). Cannot accept invite ${inviteId} for property ${propertyId}.`);
          throw new HttpsError(
            "failed-precondition",
            "You are already associated with a different property."
          );
        }
      }

      // 4. Perform Updates
      // Update invite status
      transaction.update(inviteRef, {
        status: "accepted",
        acceptedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update tenant user profile
      transaction.update(tenantUserRef, {
        propertyId: propertyId,
        landlordId: landlordId,
        // Mark onboarding complete as they are now linked to a property
        onboardingComplete: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Update property document (add tenant to list)
      transaction.update(propertyRef, {
        tenants: admin.firestore.FieldValue.arrayUnion(tenantUid),
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
        // Optionally update occupied status/count if needed
      });

      // Update landlord profile with accepted tenant details
      // Ensure landlord profile exists before attempting update
      const landlordProfileSnap = await transaction.get(landlordProfileRef);
      if (landlordProfileSnap.exists) {
        // Create accepted tenant record with rich metadata
        const acceptedTenantRecord = {
          tenantId: tenantUid,
          propertyId: propertyId,
          inviteId: inviteId,
          inviteCode: inviteData.inviteCode || '',
          tenantEmail: inviteData.tenantEmail || tenantEmail || '',
          unitNumber: inviteData.unitNumber || null,
          acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
          inviteType: 'email' // Direct invite ID acceptance typically from email
        };

        // Update landlord profile arrays and statistics
        const currentData = landlordProfileSnap.data() || {};
        const currentAccepted = currentData.totalInvitesAccepted || 0;
        const currentSent = currentData.totalInvitesSent || 0;
        const newAccepted = currentAccepted + 1;
        const newRate = currentSent > 0 ? Math.round((newAccepted / currentSent) * 100) : 100;

        transaction.update(landlordProfileRef, {
          acceptedTenants: admin.firestore.FieldValue.arrayUnion(tenantUid),
          acceptedTenantDetails: admin.firestore.FieldValue.arrayUnion(acceptedTenantRecord),
          totalInvitesAccepted: admin.firestore.FieldValue.increment(1),
          inviteAcceptanceRate: newRate,
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info(`Updated landlord profile ${landlordId} with accepted tenant details for ${tenantUid}`);
      } else {
        logger.warn(`Landlord profile ${landlordId} not found during invite acceptance`);
      }
    });

    logger.info(`Invite ${inviteId} successfully accepted by tenant ${tenantUid}`);
    return { success: true, message: "Invitation accepted successfully." };

  } catch (error: any) {
    logger.error("Error accepting invitation:", { error: error.message, code: error.code });
    // Check for specific HttpsError codes vs internal errors
    if (error instanceof HttpsError) {
      throw error;
    } else { // It's an internal server error
      throw new HttpsError("internal", "An unexpected error occurred.", error.message);
    }
  }
});

/**
 * Firebase Cloud Function: rejectPropertyInvite
 * Updates invite status when a tenant rejects an invitation.
 */
export const rejectPropertyInvite = onCall(async (request: CallableRequest<{ inviteId: string }>) => {
  // 1. Authentication Check
  if (!request.auth) {
    logger.error("rejectPropertyInvite: Unauthenticated call.");
    throw new HttpsError(
        "unauthenticated",
        "The function must be called while authenticated."
    );
  }

  const tenantUid = request.auth.uid;
  const tenantEmail = request.auth.token.email;
  const inviteId = request.data.inviteId;

  if (!inviteId) {
    logger.error("rejectPropertyInvite: Missing inviteId argument.");
    throw new HttpsError("invalid-argument", "Invite ID is required.");
  }

  logger.info(`Tenant ${tenantUid} attempting to reject invite ${inviteId}`);

  const inviteRef = db.collection("invites").doc(inviteId);

  try {
    // Use transaction for read-then-write safety
    await db.runTransaction(async (transaction) => {
        const inviteSnap = await transaction.get(inviteRef);

        // 2. Validation
        if (!inviteSnap.exists) {
            throw new HttpsError("not-found", "Invitation not found.");
        }
        // Assert data exists after checking exists
        const inviteData = inviteSnap.data()!;
        if (inviteData.tenantEmail !== tenantEmail) {
            logger.warn(`Permission Denied: Invite email (${inviteData.tenantEmail}) != Auth email (${tenantEmail}) for invite ${inviteId}`);
            throw new HttpsError("permission-denied", "This invitation is not for you.");
        }
        if (inviteData.status !== "pending") {
            logger.warn(`Invite ${inviteId} has status ${inviteData.status}, cannot reject.`);
            throw new HttpsError("failed-precondition", "This invitation is no longer pending.");
        }

        // 3. Perform Update
        transaction.update(inviteRef, {
            status: "declined",
            rejectedAt: admin.firestore.FieldValue.serverTimestamp()
        });
    });

    logger.info(`Invite ${inviteId} successfully rejected by tenant ${tenantUid}`);
    return { success: true, message: "Invitation rejected." };

  } catch (error: any) {
    logger.error("Error rejecting invitation:", { error: error.message, code: error.code });
    if (error instanceof HttpsError) {
      throw error;
    } else {
      throw new HttpsError("internal", "An unexpected error occurred.", error.message);
    }
  }
});

// No need for export {} when using named exports like this
// export {}; 