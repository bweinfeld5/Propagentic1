import { onDocumentCreated, onDocumentUpdated, FirestoreEvent, QueryDocumentSnapshot, Change } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import * as logger from "firebase-functions/logger";

// Ensure admin is initialized if needed
if (!admin.apps.length) {
  admin.initializeApp();
}

// TODO: Implement notifyNewMaintenanceRequest logic
export const notifyNewMaintenanceRequest = onDocumentCreated(
    { document: "maintenanceRequests/{requestId}", region: "us-central1" }, 
    (event: FirestoreEvent<QueryDocumentSnapshot | undefined, { requestId: string }>) => { // v2 signature
        const snap = event.data;
        if (!snap) {
            logger.info("notifyNewMaintenanceRequest: No data associated with the event (deletion?). Skipping.");
            return null;
        }
        logger.warn("notifyNewMaintenanceRequest triggered but not implemented.", { params: event.params });
    // Placeholder logic
    return null;
    }
);

// TODO: Implement notifyTicketStatusChange logic
export const notifyTicketStatusChange = onDocumentUpdated(
    { document: "tickets/{ticketId}", region: "us-central1" },
    (event: FirestoreEvent<Change<QueryDocumentSnapshot> | undefined, { ticketId: string }>) => { // v2 signature
        if (!event.data) {
            logger.info("notifyTicketStatusChange: No data associated with the event. Skipping.");
            return null;
        }
        logger.warn("notifyTicketStatusChange triggered but not implemented.", { params: event.params });
        const beforeData = event.data.before.data();
        const afterData = event.data.after.data();

        // Prevent infinite loops by checking if status actually changed
        if (beforeData?.status === afterData?.status) {
            return null;
        }

    // Placeholder logic
    return null;
    }
);

// Add this empty export to treat the file as a module
export {}; 