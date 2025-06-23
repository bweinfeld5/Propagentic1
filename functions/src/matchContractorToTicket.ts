/**
 * Firebase Cloud Function to match contractors to classified maintenance tickets
 * This function automatically finds suitable contractors based on the ticket category and urgency
 */

// Import Firebase Functions v2
import { onDocumentUpdated, Change, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Define interfaces for data shapes (optional but recommended)
interface TicketData {
  status?: string;
  category?: string;
  propertyId?: string;
  urgency?: number;
  // Add other relevant fields
}

interface PropertyData {
  landlordId?: string;
  // Add other relevant fields
}

interface ContractorProfile {
  skills?: string[];
  availability?: boolean;
  rating?: number;
  jobsCompleted?: number;
  preferredProperties?: string[];
}

interface ContractorMatch {
    id: string;
    rating: number;
    jobsCompleted: number;
    preferredProperty: boolean;
}

/**
 * Cloud Function that triggers when a maintenance ticket is updated with a classification
 * and status changes to 'ready_to_dispatch'
 */
export const matchContractorToTicket = onDocumentUpdated({
  document: "tickets/{ticketId}",
  region: "us-central1",
}, async (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { ticketId: string }>) => {
  try {
    if (!event.data) {
        logger.info("Event data missing, skipping.");
        return;
    }
    const beforeData = event.data.before.data() as TicketData | undefined;
    const afterData = event.data.after.data() as TicketData | undefined;
    
    // Ignore updates that aren't transitioning to 'ready_to_dispatch' status or if data is missing
    if (!afterData || !beforeData || afterData.status !== "ready_to_dispatch" ||
        beforeData.status === "ready_to_dispatch") {
      logger.info(
        `Ticket ${event.params.ticketId} not ready for matching or data missing. ` +
        `Status: ${afterData?.status}`
      );
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
    
    const propertyData = propertySnapshot.data() as PropertyData | undefined;
    if (!propertyData?.landlordId) { // Ensure landlordId exists
        throw new Error(`Landlord ID not found for property ${afterData.propertyId}`);
    }
    const landlordId = propertyData.landlordId;
    
    // Find suitable contractors
    const matchedContractors = await findMatchingContractors(
      afterData.category, // category is confirmed to exist
      landlordId,         // landlordId is confirmed to exist
      afterData.propertyId, // propertyId is confirmed to exist
      afterData.urgency ?? 3 // Use urgency or default to 3 (Normal)
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
    
    logger.info(
      `Successfully matched ticket ${event.params.ticketId} with ${matchedContractors.length} contractors`
    );
  } catch (error: any) {
    logger.error("Error matching contractors to ticket:", error);
    
    try {
      // Update the document with error information
      if (event?.data?.after?.ref) {
        await event.data.after.ref.update({
          status: "matching_failed",
          matchingError: error?.message || "Unknown matching error",
        });
      }
    } catch (updateError) {
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
async function findMatchingContractors(
    category: string, 
    landlordId: string, 
    propertyId: string, 
    urgency: number
): Promise<string[]> {
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
    const preferredContractorIds: string[] = landlordProfile?.contractors || [];
    
    // Find contractors with matching skills from the landlord's preferred list
    const preferredContractors: ContractorMatch[] = [];
    
    if (preferredContractorIds.length > 0) {
      const preferredContractorsQuery = await admin.firestore()
        .collection('contractorProfiles')
        .where(admin.firestore.FieldPath.documentId(), 'in', preferredContractorIds)
        .get();
      
      preferredContractorsQuery.forEach(doc => {
        const contractorData = doc.data() as ContractorProfile | undefined;
        // Check if contractor has the required skill and is available
        if (contractorData?.skills?.includes(category.toLowerCase()) &&
            contractorData?.availability === true) {
          preferredContractors.push({
            id: doc.id,
            rating: contractorData.rating ?? 0,
            jobsCompleted: contractorData.jobsCompleted ?? 0,
            preferredProperty: contractorData.preferredProperties?.includes(propertyId) ?? false,
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
    
    const publicContractors: Omit<ContractorMatch, 'preferredProperty'>[] = [];
    publicQuery.forEach(doc => {
      // Skip contractors already in the preferred list
      if (preferredContractors.some(pc => pc.id === doc.id)) {
        return;
      }
      
      const contractorData = doc.data() as ContractorProfile | undefined;
      // For high urgency, filter by rating
      if (urgency >= 4 && (contractorData?.rating ?? 0) < minRating) {
        return;
      }
      
      publicContractors.push({
        id: doc.id,
        rating: contractorData?.rating ?? 0,
        jobsCompleted: contractorData?.jobsCompleted ?? 0,
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
    const allContractors: (ContractorMatch | Omit<ContractorMatch, 'preferredProperty'>)[] = [...preferredContractors, ...publicContractors];
    return allContractors.slice(0, 3).map(c => c.id);
    
  } catch (error: any) {
    logger.error("Error finding matching contractors:", error);
    throw new Error(`Failed to find matching contractors: ${error?.message || 'Unknown error'}`);
  }
} 

// Add this empty export to treat the file as a module
export {}; 