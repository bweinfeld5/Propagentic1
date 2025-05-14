/**
 * Firebase Cloud Functions for user relationship management
 * Provides API endpoints for tenant invitations and contractor rolodex
 */

const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const logger = require("firebase-functions/logger");

/**
 * Send an invitation to a tenant to join a property
 * 
 * Required data:
 * - email: Email address of tenant
 * - propertyId: ID of the property
 * - unitNumber: Unit number for tenant
 */
exports.sendTenantInvitation = onCall({
  region: "us-central1",
}, async (request) => {
  try {
    const {email, propertyId, unitNumber} = request.data;
    const landlordId = request.auth.uid;
    
    // Validate inputs
    if (!email || !propertyId || !unitNumber) {
      throw new HttpsError(
          "invalid-argument", 
          "Missing required fields (email, propertyId, unitNumber)"
      );
    }
    
    // Verify the landlord owns the property
    const propertySnapshot = await admin.firestore()
      .collection("properties")
      .doc(propertyId)
      .get();
    
    if (!propertySnapshot.exists) {
      throw new HttpsError("not-found", "Property not found");
    }
    
    const propertyData = propertySnapshot.data();
    if (propertyData.landlordId !== landlordId) {
      throw new HttpsError(
          "permission-denied", 
          "You do not have permission to manage this property"
      );
    }
    
    // Check if this email already has a pending invitation for this property
    const existingInvites = await admin.firestore()
      .collection("invitations")
      .where("email", "==", email)
      .where("propertyId", "==", propertyId)
      .where("status", "==", "pending")
      .get();
    
    if (!existingInvites.empty) {
      throw new HttpsError(
          "already-exists",
          "A pending invitation already exists for this email and property"
      );
    }
    
    // Create invitation record
    const invitationRef = await admin.firestore().collection("invitations").add({
      type: "tenant",
      email: email,
      propertyId: propertyId,
      landlordId: landlordId,
      unitNumber: unitNumber,
      status: "pending",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      )
    });
    
    // Update landlord profile with sent invitation
    await admin.firestore()
      .collection("landlordProfiles")
      .doc(landlordId)
      .update({
        invitesSent: admin.firestore.FieldValue.arrayUnion(invitationRef.id)
      });
    
    // In a production environment, we would send an email here
    // For now, just log the invitation
    logger.info(`Tenant invitation sent to ${email} for property ${propertyId}`);
    
    return {
      success: true,
      invitationId: invitationRef.id
    };
  } catch (error) {
    logger.error("Error sending tenant invitation:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Accept a tenant invitation
 * 
 * Required data:
 * - invitationId: ID of the invitation to accept
 */
exports.acceptTenantInvitation = onCall({
  region: "us-central1",
}, async (request) => {
  try {
    const {invitationId} = request.data;
    const tenantId = request.auth.uid;
    
    // Validate inputs
    if (!invitationId) {
      throw new HttpsError("invalid-argument", "Missing invitationId");
    }
    
    // Get the invitation
    const invitationSnapshot = await admin.firestore()
      .collection("invitations")
      .doc(invitationId)
      .get();
    
    if (!invitationSnapshot.exists) {
      throw new HttpsError("not-found", "Invitation not found");
    }
    
    const invitation = invitationSnapshot.data();
    
    // Verify invitation is still pending and not expired
    if (invitation.status !== "pending") {
      throw new HttpsError(
          "failed-precondition", 
          "Invitation has already been accepted or canceled"
      );
    }
    
    if (invitation.expiresAt.toDate() < new Date()) {
      throw new HttpsError("failed-precondition", "Invitation has expired");
    }
    
    // Verify that the user's email matches the invitation
    const userSnapshot = await admin.firestore()
      .collection("users")
      .doc(tenantId)
      .get();
    
    if (!userSnapshot.exists) {
      throw new HttpsError("not-found", "User not found");
    }
    
    const userData = userSnapshot.data();
    if (userData.email !== invitation.email) {
      throw new HttpsError(
          "permission-denied", 
          "This invitation was sent to a different email address"
      );
    }
    
    // Update invitation status
    await admin.firestore()
      .collection("invitations")
      .doc(invitationId)
      .update({
        status: "accepted",
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        tenantId: tenantId
      });
    
    // Add tenant to property
    await admin.firestore()
      .collection("properties")
      .doc(invitation.propertyId)
      .update({
        tenantIds: admin.firestore.FieldValue.arrayUnion(tenantId)
      });
    
    // Create tenant-property mapping
    await admin.firestore().collection("tenantProperties").add({
      tenantId: tenantId,
      propertyId: invitation.propertyId,
      unitNumber: invitation.unitNumber,
      landlordId: invitation.landlordId,
      moveInDate: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Add property to tenant profile
    const tenantProfileSnapshot = await admin.firestore()
      .collection("tenantProfiles")
      .doc(tenantId)
      .get();
    
    if (tenantProfileSnapshot.exists) {
      await admin.firestore()
        .collection("tenantProfiles")
        .doc(tenantId)
        .update({
          properties: admin.firestore.FieldValue.arrayUnion(invitation.propertyId)
        });
    } else {
      await admin.firestore()
        .collection("tenantProfiles")
        .doc(tenantId)
        .set({
          tenantId: tenantId,
          properties: [invitation.propertyId],
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    
    logger.info(
        `Tenant invitation ${invitationId} accepted by user ${tenantId}`
    );
    
    return {
      success: true,
      propertyId: invitation.propertyId,
      unitNumber: invitation.unitNumber
    };
  } catch (error) {
    logger.error("Error accepting tenant invitation:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Revoke a pending tenant invitation
 * 
 * Required data:
 * - invitationId: ID of the invitation to revoke
 */
exports.revokeTenantInvitation = onCall({
  region: "us-central1",
}, async (request) => {
  try {
    const {invitationId} = request.data;
    const landlordId = request.auth.uid;
    
    // Validate inputs
    if (!invitationId) {
      throw new HttpsError("invalid-argument", "Missing invitationId");
    }
    
    // Get the invitation
    const invitationSnapshot = await admin.firestore()
      .collection("invitations")
      .doc(invitationId)
      .get();
    
    if (!invitationSnapshot.exists) {
      throw new HttpsError("not-found", "Invitation not found");
    }
    
    const invitation = invitationSnapshot.data();
    
    // Verify user is the landlord who created the invitation
    if (invitation.landlordId !== landlordId) {
      throw new HttpsError(
          "permission-denied",
          "You do not have permission to revoke this invitation"
      );
    }
    
    // Verify invitation is still pending
    if (invitation.status !== "pending") {
      throw new HttpsError(
          "failed-precondition",
          "Invitation has already been accepted or canceled"
      );
    }
    
    // Update invitation status
    await admin.firestore()
      .collection("invitations")
      .doc(invitationId)
      .update({
        status: "revoked",
        revokedAt: admin.firestore.FieldValue.serverTimestamp()
      });
    
    logger.info(
        `Tenant invitation ${invitationId} revoked by landlord ${landlordId}`
    );
    
    return {
      success: true
    };
  } catch (error) {
    logger.error("Error revoking tenant invitation:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Get all tenant invitations for a landlord
 */
exports.getTenantInvitations = onCall({
  region: "us-central1",
}, async (request) => {
  try {
    const landlordId = request.auth.uid;
    
    // Get all invitations for this landlord
    const invitationsSnapshot = await admin.firestore()
      .collection("invitations")
      .where("landlordId", "==", landlordId)
      .where("type", "==", "tenant")
      .orderBy("createdAt", "desc")
      .get();
    
    const invitations = [];
    invitationsSnapshot.forEach(doc => {
      invitations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      invitations: invitations
    };
  } catch (error) {
    logger.error("Error getting tenant invitations:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Add a contractor to landlord's rolodex (send invitation)
 * 
 * Required data:
 * - email: Email address of contractor
 * - message: Optional message to contractor
 */
exports.addContractorToRolodex = onCall({
  region: "us-central1",
}, async (request) => {
  try {
    const {email, message} = request.data;
    const landlordId = request.auth.uid;
    
    // Validate inputs
    if (!email) {
      throw new HttpsError("invalid-argument", "Missing contractor email");
    }
    
    // Check if this email already has a pending invitation from this landlord
    const existingInvites = await admin.firestore()
      .collection("invitations")
      .where("email", "==", email)
      .where("landlordId", "==", landlordId)
      .where("type", "==", "contractor")
      .where("status", "==", "pending")
      .get();
    
    if (!existingInvites.empty) {
      throw new HttpsError(
          "already-exists",
          "A pending invitation already exists for this contractor"
      );
    }
    
    // Check if contractor with this email already exists
    let contractorId = null;
    const existingUsers = await admin.firestore()
      .collection("users")
      .where("email", "==", email)
      .where("role", "==", "contractor")
      .get();
    
    if (!existingUsers.empty) {
      // Contractor exists, get their ID
      existingUsers.forEach(doc => {
        contractorId = doc.id;
      });
      
      // Check if already in rolodex
      const landlordSnapshot = await admin.firestore()
        .collection("landlordProfiles")
        .doc(landlordId)
        .get();
      
      if (landlordSnapshot.exists) {
        const landlordData = landlordSnapshot.data();
        if (landlordData.contractors && 
            landlordData.contractors.includes(contractorId)) {
          throw new HttpsError(
              "already-exists",
              "This contractor is already in your rolodex"
          );
        }
      }
    }
    
    // Create invitation record
    const invitationRef = await admin.firestore().collection("invitations").add({
      type: "contractor",
      email: email,
      landlordId: landlordId,
      status: "pending",
      message: message || "",
      contractorId: contractorId, // Will be null if contractor doesn't exist yet
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      expiresAt: admin.firestore.Timestamp.fromDate(
          new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      )
    });
    
    // Update landlord profile with sent invitation
    await admin.firestore()
      .collection("landlordProfiles")
      .doc(landlordId)
      .update({
        invitesSent: admin.firestore.FieldValue.arrayUnion(invitationRef.id)
      });
    
    // If the contractor already exists, notify them
    if (contractorId) {
      // Add notification for existing contractor
      await admin.firestore()
        .collection("notifications")
        .add({
          userId: contractorId,
          userRole: "contractor",
          type: "invitation",
          read: false,
          data: {
            invitationId: invitationRef.id,
            landlordId: landlordId,
            message: message || ""
          },
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
    }
    
    logger.info(`Contractor invitation sent to ${email} by landlord ${landlordId}`);
    
    return {
      success: true,
      invitationId: invitationRef.id
    };
  } catch (error) {
    logger.error("Error adding contractor to rolodex:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Accept a contractor invitation
 * 
 * Required data:
 * - invitationId: ID of the invitation to accept
 */
exports.acceptContractorInvitation = onCall({
  region: "us-central1",
}, async (request) => {
  try {
    const {invitationId} = request.data;
    const contractorId = request.auth.uid;
    
    // Validate inputs
    if (!invitationId) {
      throw new HttpsError("invalid-argument", "Missing invitationId");
    }
    
    // Get the invitation
    const invitationSnapshot = await admin.firestore()
      .collection("invitations")
      .doc(invitationId)
      .get();
    
    if (!invitationSnapshot.exists) {
      throw new HttpsError("not-found", "Invitation not found");
    }
    
    const invitation = invitationSnapshot.data();
    
    // Verify invitation type and status
    if (invitation.type !== "contractor") {
      throw new HttpsError(
          "failed-precondition", 
          "This is not a contractor invitation"
      );
    }
    
    if (invitation.status !== "pending") {
      throw new HttpsError(
          "failed-precondition", 
          "Invitation has already been accepted or canceled"
      );
    }
    
    if (invitation.expiresAt.toDate() < new Date()) {
      throw new HttpsError("failed-precondition", "Invitation has expired");
    }
    
    // Verify that the user's email matches the invitation
    const userSnapshot = await admin.firestore()
      .collection("users")
      .doc(contractorId)
      .get();
    
    if (!userSnapshot.exists) {
      throw new HttpsError("not-found", "User not found");
    }
    
    const userData = userSnapshot.data();
    if (userData.email !== invitation.email) {
      throw new HttpsError(
          "permission-denied", 
          "This invitation was sent to a different email address"
      );
    }
    
    // Update invitation status
    await admin.firestore()
      .collection("invitations")
      .doc(invitationId)
      .update({
        status: "accepted",
        acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
        contractorId: contractorId
      });
    
    // Add contractor to landlord's rolodex
    await admin.firestore()
      .collection("landlordProfiles")
      .doc(invitation.landlordId)
      .update({
        contractors: admin.firestore.FieldValue.arrayUnion(contractorId)
      });
    
    // Add landlord to contractor's linked accounts
    await admin.firestore()
      .collection("users")
      .doc(contractorId)
      .update({
        linkedTo: admin.firestore.FieldValue.arrayUnion(invitation.landlordId)
      });
    
    // Create or update contractor profile
    const contractorProfileRef = admin.firestore()
      .collection("contractorProfiles")
      .doc(contractorId);
    
    const contractorProfileSnapshot = await contractorProfileRef.get();
    
    if (contractorProfileSnapshot.exists) {
      await contractorProfileRef.update({
        landlords: admin.firestore.FieldValue.arrayUnion(invitation.landlordId)
      });
    } else {
      await contractorProfileRef.set({
        contractorId: contractorId,
        userId: contractorId,
        landlords: [invitation.landlordId],
        availability: true,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });
    }
    
    logger.info(
        `Contractor invitation ${invitationId} accepted by user ${contractorId}`
    );
    
    return {
      success: true,
      landlordId: invitation.landlordId
    };
  } catch (error) {
    logger.error("Error accepting contractor invitation:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Remove a contractor from landlord's rolodex
 * 
 * Required data:
 * - contractorId: ID of the contractor to remove
 */
exports.removeContractorFromRolodex = onCall({
  region: "us-central1",
}, async (request) => {
  try {
    const {contractorId} = request.data;
    const landlordId = request.auth.uid;
    
    // Validate inputs
    if (!contractorId) {
      throw new HttpsError("invalid-argument", "Missing contractorId");
    }
    
    // Get landlord profile
    const landlordProfileSnapshot = await admin.firestore()
      .collection("landlordProfiles")
      .doc(landlordId)
      .get();
    
    if (!landlordProfileSnapshot.exists) {
      throw new HttpsError("not-found", "Landlord profile not found");
    }
    
    const landlordProfile = landlordProfileSnapshot.data();
    
    // Check if contractor is in the rolodex
    if (!landlordProfile.contractors || 
        !landlordProfile.contractors.includes(contractorId)) {
      throw new HttpsError(
          "not-found", 
          "Contractor is not in your rolodex"
      );
    }
    
    // Remove contractor from landlord's rolodex
    await admin.firestore()
      .collection("landlordProfiles")
      .doc(landlordId)
      .update({
        contractors: admin.firestore.FieldValue.arrayRemove(contractorId)
      });
    
    // Remove landlord from contractor's linked accounts
    await admin.firestore()
      .collection("users")
      .doc(contractorId)
      .update({
        linkedTo: admin.firestore.FieldValue.arrayRemove(landlordId)
      });
    
    // Update contractor profile
    await admin.firestore()
      .collection("contractorProfiles")
      .doc(contractorId)
      .update({
        landlords: admin.firestore.FieldValue.arrayRemove(landlordId)
      });
    
    logger.info(
        `Contractor ${contractorId} removed from rolodex by landlord ${landlordId}`
    );
    
    return {
      success: true
    };
  } catch (error) {
    logger.error("Error removing contractor from rolodex:", error);
    throw new HttpsError("internal", error.message);
  }
});

/**
 * Get all contractors in a landlord's rolodex
 */
exports.getContractorRolodex = onCall({
  region: "us-central1",
}, async (request) => {
  try {
    const landlordId = request.auth.uid;
    
    // Get landlord profile
    const landlordProfileSnapshot = await admin.firestore()
      .collection("landlordProfiles")
      .doc(landlordId)
      .get();
    
    if (!landlordProfileSnapshot.exists) {
      throw new HttpsError("not-found", "Landlord profile not found");
    }
    
    const landlordProfile = landlordProfileSnapshot.data();
    
    // Get contractor profiles
    const contractors = [];
    if (landlordProfile.contractors && landlordProfile.contractors.length > 0) {
      const contractorIdsChunks = [];
      
      // Firestore has a limit of 10 IDs in a where-in clause
      // Split the array into chunks of 10
      for (let i = 0; i < landlordProfile.contractors.length; i += 10) {
        contractorIdsChunks.push(
            landlordProfile.contractors.slice(i, i + 10)
        );
      }
      
      // Fetch each chunk and combine results
      for (const chunk of contractorIdsChunks) {
        const contractorsSnapshot = await admin.firestore()
          .collection("users")
          .where(admin.firestore.FieldPath.documentId(), "in", chunk)
          .get();
        
        // Get additional profile data
        for (const doc of contractorsSnapshot.docs) {
          const contractorProfileSnapshot = await admin.firestore()
            .collection("contractorProfiles")
            .doc(doc.id)
            .get();
          
          let profileData = {};
          if (contractorProfileSnapshot.exists) {
            profileData = contractorProfileSnapshot.data();
          }
          
          contractors.push({
            id: doc.id,
            ...doc.data(),
            profile: profileData
          });
        }
      }
    }
    
    // Get pending invitations
    const pendingInvitationsSnapshot = await admin.firestore()
      .collection("invitations")
      .where("landlordId", "==", landlordId)
      .where("type", "==", "contractor")
      .where("status", "==", "pending")
      .get();
    
    const pendingInvitations = [];
    pendingInvitationsSnapshot.forEach(doc => {
      pendingInvitations.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return {
      contractors: contractors,
      pendingInvitations: pendingInvitations
    };
  } catch (error) {
    logger.error("Error getting contractor rolodex:", error);
    throw new HttpsError("internal", error.message);
  }
}); 