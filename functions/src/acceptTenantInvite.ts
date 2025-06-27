import * as functions from "firebase-functions";
import * as admin from "firebase-admin";
import * as corsLib from "cors";

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();
const cors = corsLib.default({ origin: true }); // Allow all origins during development

/**
 * Firebase HTTP Function: acceptTenantInvite
 * 
 * Allows a tenant to accept an invite from a landlord using an 8-character alphanumeric invite code.
 * This is a clean, simple implementation that replaces the over-engineered system.
 * Converted from callable function to HTTP function with CORS support.
 * 
 * @param {functions.Request} req - HTTP request with body: { inviteCode: string }
 * @param {functions.Response} res - HTTP response
 */
export const acceptTenantInvite = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    if (req.method !== "POST") {
      return res.status(405).send("Method Not Allowed");
    }

    try {
      const { inviteCode } = req.body;

      // Extract and verify Bearer token
      const authHeader = req.headers.authorization || "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.split("Bearer ")[1] : null;

      if (!token) {
        return res.status(401).json({
          success: false,
          error: "unauthenticated",
          message: "Unauthorized: Missing token."
        });
      }

      // Verify the Firebase ID token
      let decodedToken;
      try {
        decodedToken = await admin.auth().verifyIdToken(token);
      } catch (error) {
        functions.logger.error("Invalid token:", error);
        return res.status(401).json({
          success: false,
          error: "unauthenticated", 
          message: "Invalid authentication token."
        });
      }

      const uid = decodedToken.uid;

      // Validate input
      if (!inviteCode || typeof inviteCode !== 'string') {
        return res.status(400).json({
          success: false,
          error: "invalid-argument",
          message: "inviteCode must be a non-empty string."
        });
      }

      // Normalize invite code to uppercase
      const normalizedInviteCode = inviteCode.trim().toUpperCase();

      // Validate invite code format (8 alphanumeric characters)
      const codeRegex = /^[A-Z0-9]{8}$/;
      if (!codeRegex.test(normalizedInviteCode)) {
        return res.status(400).json({
          success: false,
          error: "invalid-argument",
          message: "Invalid invite code format. Code must be 8 alphanumeric characters."
        });
      }

      functions.logger.info(`Starting invite acceptance for user ${uid} with code ${normalizedInviteCode}`);

      // Step 1: Fetch the tenant profile using the authenticated user's uid
      const tenantProfileRef = db.collection('tenantProfiles').doc(uid);
      const tenantProfileDoc = await tenantProfileRef.get();

      if (!tenantProfileDoc.exists) {
        functions.logger.error(`Tenant profile not found for uid: ${uid}`);
        return res.status(404).json({
          success: false,
          error: "not-found",
          message: "Tenant profile not found. Please complete your profile setup first."
        });
      }

      const tenantProfile = tenantProfileDoc.data()!;
      functions.logger.info(`Found tenant profile for uid: ${uid}`);

      // Step 2: Search for the invite by shortCode
      const inviteQuery = await db.collection('invites')
        .where('shortCode', '==', normalizedInviteCode)
        .limit(1)
        .get();

      if (inviteQuery.empty) {
        functions.logger.warn(`Invalid invite code attempted: ${normalizedInviteCode}`);
        return res.status(400).json({
          success: false,
          error: "invalid-argument",
          message: "Invalid invite code."
        });
      }

      const inviteDoc = inviteQuery.docs[0];
      const invite = inviteDoc.data()!;
      const propertyId = invite.propertyId;

      functions.logger.info(`Found invite for property: ${propertyId}`);

      // Step 3: Verify that the property exists
      const propertyRef = db.collection('properties').doc(propertyId);
      const propertyDoc = await propertyRef.get();

      if (!propertyDoc.exists) {
        functions.logger.error(`Property not found: ${propertyId}`);
        return res.status(404).json({
          success: false,
          error: "not-found",
          message: "Property does not exist."
        });
      }

      const property = propertyDoc.data()!;
      functions.logger.info(`Verified property exists: ${propertyId}`);

      // Step 4: Check if tenant is already linked to this property
      const currentProperties = tenantProfile.properties || [];
      if (currentProperties.includes(propertyId)) {
        functions.logger.warn(`Tenant ${uid} already linked to property ${propertyId}`);
        return res.status(409).json({
          success: false,
          error: "already-exists",
          message: "Tenant already linked to this property."
        });
      }

      // Step 5: Add the property to the tenant's properties array
      const updatedProperties = [...currentProperties, propertyId];
      
      await tenantProfileRef.update({
        properties: updatedProperties,
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      functions.logger.info(`Successfully linked tenant ${uid} to property ${propertyId}`);

      // Step 6: Update landlord profile with accepted tenant (NEW)
      const landlordId = invite.landlordId;
      const landlordProfileRef = db.collection('landlordProfiles').doc(landlordId);

      await db.runTransaction(async (transaction) => {
        const landlordDoc = await transaction.get(landlordProfileRef);
        
        // Create accepted tenant record
        const acceptedTenantRecord = {
          tenantId: uid,
          propertyId: propertyId,
          inviteId: inviteDoc.id,
          inviteCode: normalizedInviteCode,
          tenantEmail: invite.tenantEmail || '',
          unitNumber: invite.unitNumber || null,
          acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
          inviteType: 'code'
        };
        
        if (!landlordDoc.exists) {
          // Create new landlord profile
          transaction.set(landlordProfileRef, {
            uid: landlordId,
            landlordId: landlordId,
            userId: landlordId,
            email: invite.landlordEmail || '',
            displayName: invite.landlordName || '',
            phoneNumber: '',
            businessName: '',
            acceptedTenants: [uid],
            properties: [propertyId],
            invitesSent: [inviteDoc.id],
            contractors: [],
            acceptedTenantDetails: [acceptedTenantRecord],
            totalInvitesSent: 1,
            totalInvitesAccepted: 1,
            inviteAcceptanceRate: 100,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          functions.logger.info(`Created new landlord profile for ${landlordId}`);
        } else {
          // Update existing landlord profile
          const currentData = landlordDoc.data() || {};
          const currentAccepted = currentData.totalInvitesAccepted || 0;
          const currentSent = currentData.totalInvitesSent || 0;
          const newAccepted = currentAccepted + 1;
          const newRate = currentSent > 0 ? Math.round((newAccepted / currentSent) * 100) : 100;
          
          transaction.update(landlordProfileRef, {
            acceptedTenants: admin.firestore.FieldValue.arrayUnion(uid),
            acceptedTenantDetails: admin.firestore.FieldValue.arrayUnion(acceptedTenantRecord),
            totalInvitesAccepted: admin.firestore.FieldValue.increment(1),
            inviteAcceptanceRate: newRate,
            updatedAt: admin.firestore.FieldValue.serverTimestamp()
          });
          
          functions.logger.info(`Updated landlord profile for ${landlordId}, new acceptance rate: ${newRate}%`);
        }

        // Step 7: Add tenant to property tenants array
        transaction.update(propertyRef, {
          tenants: admin.firestore.FieldValue.arrayUnion(uid),
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        
        functions.logger.info(`Added tenant ${uid} to property ${propertyId} tenants array`);
      });

      functions.logger.info(`Successfully updated landlord profile for ${landlordId} with accepted tenant ${uid}`);

      // Return success response
      return res.status(200).json({
        success: true,
        message: "Successfully joined property!",
        propertyId: propertyId,
        propertyAddress: property.address || property.streetAddress || "Unknown address"
      });

    } catch (error) {
      // Log unexpected errors and return generic error
      functions.logger.error("Unexpected error in acceptTenantInvite:", error);
      return res.status(500).json({
        success: false,
        error: "internal",
        message: "An internal error occurred while processing the invite."
      });
    }
  });
}); 