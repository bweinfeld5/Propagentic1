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
exports.createNotificationOnInvite = exports.sendInviteEmail = exports.redeemInviteCode = exports.validateInviteCode = exports.generateInviteCode = exports.ping = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}
console.log("🔥 Loading essential functions...");
// Basic Ping Function
exports.ping = functions.https.onCall(async () => {
    console.log("Ping function invoked.");
    return { message: "pong", timestamp: Date.now() };
});
// Import inviteCode functions
const inviteCodeFunctions = __importStar(require("./inviteCode"));
// Export invite code functions
exports.generateInviteCode = inviteCodeFunctions.generateInviteCode;
exports.validateInviteCode = inviteCodeFunctions.validateInviteCode;
exports.redeemInviteCode = inviteCodeFunctions.redeemInviteCode;
// Import and export email invite function
const invites_1 = require("./invites");
Object.defineProperty(exports, "sendInviteEmail", { enumerable: true, get: function () { return invites_1.sendInviteEmail; } });
// Import and export notification trigger functions  
const inviteTriggers_1 = require("./inviteTriggers");
Object.defineProperty(exports, "createNotificationOnInvite", { enumerable: true, get: function () { return inviteTriggers_1.createNotificationOnInvite; } });
console.log("✅ Essential functions loaded (ping, invite code, email invites, notifications).");
//# sourceMappingURL=index.js.map