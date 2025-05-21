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
exports.notifyTicketStatusChange = exports.notifyNewMaintenanceRequest = exports.redeemInviteCode = exports.sendInviteEmail = exports.rejectPropertyInvite = exports.acceptPropertyInvite = exports.addContractorToRolodex = exports.sendPropertyInvite = exports.notifyAssignedContractor = exports.matchContractorToTicket = exports.classifyMaintenanceRequest = exports.ping = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
console.log("🔥 Loading all functions...");
// --- Exporting Functions --- 
// Basic Ping Function (Using v1 for now)
exports.ping = functions.https.onCall(async () => {
    console.log("Ping function invoked.");
    return { message: "pong" };
});
// AI Functions
var classifyMaintenanceRequest_1 = require("./classifyMaintenanceRequest");
Object.defineProperty(exports, "classifyMaintenanceRequest", { enumerable: true, get: function () { return classifyMaintenanceRequest_1.classifyMaintenanceRequest; } });
// Maintenance Ticket Functions
var matchContractorToTicket_1 = require("./matchContractorToTicket");
Object.defineProperty(exports, "matchContractorToTicket", { enumerable: true, get: function () { return matchContractorToTicket_1.matchContractorToTicket; } });
var notifyAssignedContractor_1 = require("./notifyAssignedContractor");
Object.defineProperty(exports, "notifyAssignedContractor", { enumerable: true, get: function () { return notifyAssignedContractor_1.notifyAssignedContractor; } });
// User Relationship & Invitation Functions
var userRelationships_1 = require("./userRelationships");
Object.defineProperty(exports, "sendPropertyInvite", { enumerable: true, get: function () { return userRelationships_1.sendPropertyInvite; } });
Object.defineProperty(exports, "addContractorToRolodex", { enumerable: true, get: function () { return userRelationships_1.addContractorToRolodex; } });
Object.defineProperty(exports, "acceptPropertyInvite", { enumerable: true, get: function () { return userRelationships_1.acceptPropertyInvite; } });
Object.defineProperty(exports, "rejectPropertyInvite", { enumerable: true, get: function () { return userRelationships_1.rejectPropertyInvite; } });
var invites_1 = require("./invites"); // Export the new invite email function
Object.defineProperty(exports, "sendInviteEmail", { enumerable: true, get: function () { return invites_1.sendInviteEmail; } });
// Invite Code Functions
var inviteCode_1 = require("./inviteCode");
Object.defineProperty(exports, "redeemInviteCode", { enumerable: true, get: function () { return inviteCode_1.redeemInviteCode; } });
// Notification Trigger Functions
var notificationTriggers_1 = require("./notificationTriggers");
Object.defineProperty(exports, "notifyNewMaintenanceRequest", { enumerable: true, get: function () { return notificationTriggers_1.notifyNewMaintenanceRequest; } });
Object.defineProperty(exports, "notifyTicketStatusChange", { enumerable: true, get: function () { return notificationTriggers_1.notifyTicketStatusChange; } });
// TODO: Check if createNotificationOnInvite from inviteTriggers.ts is needed/used
// export { createNotificationOnInvite } from './inviteTriggers';
// Scheduled Cleanup Functions
// export { cleanupOldNotifications } from './cleanupNotifications'; // Commented out
console.log("✅ All functions loaded and exported (except cleanup).");
//# sourceMappingURL=index.js.map