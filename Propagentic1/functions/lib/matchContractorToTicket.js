"use strict";
/**
 * Firebase Cloud Function to match contractors to classified maintenance tickets
 * This function automatically finds suitable contractors based on the ticket category and urgency
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.matchContractorToTicket = void 0;
// Import Firebase Functions v2
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
/**
 * Cloud Function that triggers when a maintenance ticket is updated with a classification
 * and status changes to 'ready_to_dispatch'
 */
exports.matchContractorToTicket = (0, firestore_1.onDocumentUpdated)({
    document: "tickets/{ticketId}",
    region: "us-central1",
}, async (event) => {
    var _a, _b, _c;
    try {
        if (!event.data) {
            logger.info("Event data missing, skipping.");
            return;
        }
        const beforeData = event.data.before.data();
        const afterData = event.data.after.data();
        // Ignore updates that aren't transitioning to 'ready_to_dispatch' status or if data is missing
        if (!afterData || !beforeData || afterData.status !== "ready_to_dispatch" ||
            beforeData.status === "ready_to_dispatch") {
            logger.info(`Ticket ${event.params.ticketId} not ready for matching or data missing. ` +
                `Status: ${afterData === null || afterData === void 0 ? void 0 : afterData.status}`);
            return;
        }
        // Skip processing if no category was assigned or propertyId is missing
        if (!afterData.category || !afterData.propertyId) {
            logger.error(`Missing category or propertyId for ticket ${event.params.ticketId}`);
            await event.data.after.ref.update({
                status: "matching_failed",
                matchingError: "Missing category or propertyId",
            });
            return;
        }
        logger.info(`Finding contractors for ticket: ${event.params.ticketId} in category: ${afterData.category}`);
        // Get the property information
        const propertySnapshot = await admin.firestore()
            .collection('properties')
            .doc(afterData.propertyId)
            .get();
        if (!propertySnapshot.exists) {
            throw new Error(`Property ${afterData.propertyId} not found`);
        }
        const propertyData = propertySnapshot.data();
        if (!(propertyData === null || propertyData === void 0 ? void 0 : propertyData.landlordId)) { // Ensure landlordId exists
            throw new Error(`Landlord ID not found for property ${afterData.propertyId}`);
        }
        const landlordId = propertyData.landlordId;
        // Find suitable contractors
        const matchedContractors = await findMatchingContractors(afterData.category, // category is confirmed to exist
        landlordId, // landlordId is confirmed to exist
        afterData.propertyId, // propertyId is confirmed to exist
        (_a = afterData.urgency) !== null && _a !== void 0 ? _a : 3 // Use urgency or default to 3 (Normal)
        );
        if (matchedContractors.length === 0) {
            logger.warn(`No matching contractors found for ticket ${event.params.ticketId}`);
            await event.data.after.ref.update({
                status: "needs_manual_assignment",
                matchingAttempted: true,
                matchedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            return;
        }
        // Update the ticket with matched contractors
        await event.data.after.ref.update({
            recommendedContractors: matchedContractors,
            status: "ready_to_assign",
            matchedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        logger.info(`Successfully matched ticket ${event.params.ticketId} with ${matchedContractors.length} contractors`);
    }
    catch (error) {
        logger.error("Error matching contractors to ticket:", error);
        try {
            // Update the document with error information
            if ((_c = (_b = event === null || event === void 0 ? void 0 : event.data) === null || _b === void 0 ? void 0 : _b.after) === null || _c === void 0 ? void 0 : _c.ref) {
                await event.data.after.ref.update({
                    status: "matching_failed",
                    matchingError: (error === null || error === void 0 ? void 0 : error.message) || "Unknown matching error",
                });
            }
        }
        catch (updateError) {
            logger.error("Error updating document with error status:", updateError);
        }
    }
});
/**
 * Find matching contractors based on ticket category and property information
 *
 * @param {string} category - The maintenance issue category
 * @param {string} landlordId - The ID of the landlord
 * @param {string} propertyId - The ID of the property
 * @param {number} urgency - The urgency level (1-5)
 * @return {Promise<Array<string>>} - Array of contractor IDs in priority order
 */
async function findMatchingContractors(category, landlordId, propertyId, urgency) {
    try {
        // First, check if the landlord has preferred contractors
        const landlordProfileSnapshot = await admin.firestore()
            .collection('landlordProfiles')
            .doc(landlordId)
            .get();
        if (!landlordProfileSnapshot.exists) {
            logger.warn(`Landlord profile ${landlordId} not found`);
            return [];
        }
        const landlordProfile = landlordProfileSnapshot.data();
        const preferredContractorIds = (landlordProfile === null || landlordProfile === void 0 ? void 0 : landlordProfile.contractors) || [];
        // Find contractors with matching skills from the landlord's preferred list
        const preferredContractors = [];
        if (preferredContractorIds.length > 0) {
            const preferredContractorsQuery = await admin.firestore()
                .collection('contractorProfiles')
                .where(admin.firestore.FieldPath.documentId(), 'in', preferredContractorIds)
                .get();
            preferredContractorsQuery.forEach(doc => {
                var _a, _b, _c, _d, _e;
                const contractorData = doc.data();
                // Check if contractor has the required skill and is available
                if (((_a = contractorData === null || contractorData === void 0 ? void 0 : contractorData.skills) === null || _a === void 0 ? void 0 : _a.includes(category.toLowerCase())) &&
                    (contractorData === null || contractorData === void 0 ? void 0 : contractorData.availability) === true) {
                    preferredContractors.push({
                        id: doc.id,
                        rating: (_b = contractorData.rating) !== null && _b !== void 0 ? _b : 0,
                        jobsCompleted: (_c = contractorData.jobsCompleted) !== null && _c !== void 0 ? _c : 0,
                        preferredProperty: (_e = (_d = contractorData.preferredProperties) === null || _d === void 0 ? void 0 : _d.includes(propertyId)) !== null && _e !== void 0 ? _e : false,
                    });
                }
            });
        }
        // If we have enough preferred contractors, use them
        if (preferredContractors.length >= 3) {
            // Sort by preference for this property, then by rating and experience
            preferredContractors.sort((a, b) => {
                // First prioritize contractors who prefer this property
                if (a.preferredProperty !== b.preferredProperty) {
                    return a.preferredProperty ? -1 : 1;
                }
                // Then by rating
                if (a.rating !== b.rating) {
                    return b.rating - a.rating;
                }
                // Then by experience
                return b.jobsCompleted - a.jobsCompleted;
            });
            return preferredContractors.slice(0, 3).map(c => c.id);
        }
        // If we don't have enough preferred contractors, search more broadly
        // Start with high urgency tickets (4-5) which need contractors with higher ratings
        const minRating = urgency >= 4 ? 4 : 0;
        const publicQuery = await admin.firestore()
            .collection('contractorProfiles')
            .where('skills', 'array-contains', category.toLowerCase())
            .where('availability', '==', true)
            .get();
        const publicContractors = [];
        publicQuery.forEach(doc => {
            var _a, _b, _c;
            // Skip contractors already in the preferred list
            if (preferredContractors.some(pc => pc.id === doc.id)) {
                return;
            }
            const contractorData = doc.data();
            // For high urgency, filter by rating
            if (urgency >= 4 && ((_a = contractorData === null || contractorData === void 0 ? void 0 : contractorData.rating) !== null && _a !== void 0 ? _a : 0) < minRating) {
                return;
            }
            publicContractors.push({
                id: doc.id,
                rating: (_b = contractorData === null || contractorData === void 0 ? void 0 : contractorData.rating) !== null && _b !== void 0 ? _b : 0,
                jobsCompleted: (_c = contractorData === null || contractorData === void 0 ? void 0 : contractorData.jobsCompleted) !== null && _c !== void 0 ? _c : 0,
            });
        });
        // Sort public contractors by rating and experience
        publicContractors.sort((a, b) => {
            if (a.rating !== b.rating) {
                return b.rating - a.rating;
            }
            return b.jobsCompleted - a.jobsCompleted;
        });
        // Combine preferred and public contractors, up to 3 total
        const allContractors = [...preferredContractors, ...publicContractors];
        return allContractors.slice(0, 3).map(c => c.id);
    }
    catch (error) {
        logger.error("Error finding matching contractors:", error);
        throw new Error(`Failed to find matching contractors: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown error'}`);
    }
}
//# sourceMappingURL=matchContractorToTicket.js.map