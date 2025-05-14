"use strict";
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
exports.notifyTicketStatusChange = exports.notifyNewMaintenanceRequest = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const logger = __importStar(require("firebase-functions/logger"));
// Ensure admin is initialized if needed
if (!admin.apps.length) {
    admin.initializeApp();
}
// TODO: Implement notifyNewMaintenanceRequest logic
exports.notifyNewMaintenanceRequest = (0, firestore_1.onDocumentCreated)({ document: "maintenanceRequests/{requestId}", region: "us-central1" }, (event) => {
    const snap = event.data;
    if (!snap) {
        logger.info("notifyNewMaintenanceRequest: No data associated with the event (deletion?). Skipping.");
        return null;
    }
    logger.warn("notifyNewMaintenanceRequest triggered but not implemented.", { params: event.params });
    // Placeholder logic
    return null;
});
// TODO: Implement notifyTicketStatusChange logic
exports.notifyTicketStatusChange = (0, firestore_1.onDocumentUpdated)({ document: "tickets/{ticketId}", region: "us-central1" }, (event) => {
    if (!event.data) {
        logger.info("notifyTicketStatusChange: No data associated with the event. Skipping.");
        return null;
    }
    logger.warn("notifyTicketStatusChange triggered but not implemented.", { params: event.params });
    const beforeData = event.data.before.data();
    const afterData = event.data.after.data();
    // Prevent infinite loops by checking if status actually changed
    if ((beforeData === null || beforeData === void 0 ? void 0 : beforeData.status) === (afterData === null || afterData === void 0 ? void 0 : afterData.status)) {
        return null;
    }
    // Placeholder logic
    return null;
});
//# sourceMappingURL=notificationTriggers.js.map