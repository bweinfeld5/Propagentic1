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
exports.redeemInviteCode = exports.validateInviteCode = exports.generateInviteCode = exports.sendPropertyInvitationEmailManual = exports.sendPropertyInvitationEmail = exports.searchTenants = exports.getAllTenants = exports.simpleTest = exports.testPing = exports.testSendGrid = exports.sendEmail = exports.createNotificationOnInvite = exports.sendInviteEmail = exports.classifyMaintenanceRequest = exports.addContractorToRolodex = exports.rejectPropertyInvite = exports.acceptPropertyInvite = exports.sendPropertyInvite = exports.ping = void 0;
const admin = __importStar(require("firebase-admin"));
const https_1 = require("firebase-functions/v2/https");
const logger = __importStar(require("firebase-functions/logger"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
logger.info("🔥 Loading essential functions...");
// Basic Ping Function
exports.ping = (0, https_1.onCall)(async () => {
    logger.info("Ping function invoked.");
    return { message: "pong", timestamp: Date.now() };
});
// Import and export user relationship functions (property invites)
const userRelationships_1 = require("./userRelationships");
Object.defineProperty(exports, "sendPropertyInvite", { enumerable: true, get: function () { return userRelationships_1.sendPropertyInvite; } });
Object.defineProperty(exports, "acceptPropertyInvite", { enumerable: true, get: function () { return userRelationships_1.acceptPropertyInvite; } });
Object.defineProperty(exports, "rejectPropertyInvite", { enumerable: true, get: function () { return userRelationships_1.rejectPropertyInvite; } });
Object.defineProperty(exports, "addContractorToRolodex", { enumerable: true, get: function () { return userRelationships_1.addContractorToRolodex; } });
// Import and export AI classification function
const classifyMaintenanceRequest_1 = require("./classifyMaintenanceRequest");
Object.defineProperty(exports, "classifyMaintenanceRequest", { enumerable: true, get: function () { return classifyMaintenanceRequest_1.classifyMaintenanceRequest; } });
// Import and export email invite function
const invites_1 = require("./invites");
Object.defineProperty(exports, "sendInviteEmail", { enumerable: true, get: function () { return invites_1.sendInviteEmail; } });
// Import and export notification trigger functions  
const inviteTriggers_1 = require("./inviteTriggers");
Object.defineProperty(exports, "createNotificationOnInvite", { enumerable: true, get: function () { return inviteTriggers_1.createNotificationOnInvite; } });
// Import and export SendGrid email functions
const sendgridEmailService_1 = require("./sendgridEmailService");
Object.defineProperty(exports, "sendEmail", { enumerable: true, get: function () { return sendgridEmailService_1.sendEmail; } });
// Import and export test functions
const testSendGrid_1 = require("./testSendGrid");
Object.defineProperty(exports, "testSendGrid", { enumerable: true, get: function () { return testSendGrid_1.testSendGrid; } });
Object.defineProperty(exports, "testPing", { enumerable: true, get: function () { return testSendGrid_1.testPing; } });
const simpleTest_1 = require("./simpleTest");
Object.defineProperty(exports, "simpleTest", { enumerable: true, get: function () { return simpleTest_1.simpleTest; } });
// Import and export tenant service functions
const tenantService_1 = require("./tenantService");
Object.defineProperty(exports, "getAllTenants", { enumerable: true, get: function () { return tenantService_1.getAllTenants; } });
Object.defineProperty(exports, "searchTenants", { enumerable: true, get: function () { return tenantService_1.searchTenants; } });
// Import and export property invitation notification functions
const propertyInvitationNotifications_1 = require("./propertyInvitationNotifications");
Object.defineProperty(exports, "sendPropertyInvitationEmail", { enumerable: true, get: function () { return propertyInvitationNotifications_1.sendPropertyInvitationEmail; } });
Object.defineProperty(exports, "sendPropertyInvitationEmailManual", { enumerable: true, get: function () { return propertyInvitationNotifications_1.sendPropertyInvitationEmailManual; } });
// Import and export invite code functions
const inviteCode_1 = require("./inviteCode");
Object.defineProperty(exports, "generateInviteCode", { enumerable: true, get: function () { return inviteCode_1.generateInviteCodeHttp; } });
Object.defineProperty(exports, "validateInviteCode", { enumerable: true, get: function () { return inviteCode_1.validateInviteCode; } });
Object.defineProperty(exports, "redeemInviteCode", { enumerable: true, get: function () { return inviteCode_1.redeemInviteCode; } });
logger.info("✅ Essential functions loaded (ping, property invites, AI classification, email invites, notifications, SendGrid, tenant service, property invitation notifications, invite codes, tests).");
//# sourceMappingURL=index.js.map