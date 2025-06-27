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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
// NOTE: Invitation email logic migrated to src/services/unifiedEmailService.ts
const mail_1 = __importDefault(require("@sendgrid/mail"));
const functions = __importStar(require("firebase-functions"));
const logger = __importStar(require("firebase-functions/logger"));
// Lazy initialization - only initialize when needed
let sendGridInitialized = false;
let SENDGRID_API_KEY;
const initializeSendGrid = () => {
    if (sendGridInitialized)
        return;
    try {
        // Initialize SendGrid with API key from environment variables (Cloud Functions v2)
        // Fallback to functions.config() for backward compatibility during transition
        SENDGRID_API_KEY = process.env.SENDGRID_API_KEY ||
            (functions.config().sendgrid && functions.config().sendgrid.api_key);
        if (SENDGRID_API_KEY) {
            mail_1.default.setApiKey(SENDGRID_API_KEY);
            logger.info('SendGrid initialized successfully');
        }
        else {
            logger.warn('SendGrid API key not found in environment variables or config. Email sending will fail.');
        }
    }
    catch (error) {
        logger.error('Failed to initialize SendGrid:', error.message);
    }
    sendGridInitialized = true;
};
/**
 * Send email using SendGrid
 * @param emailData - Email configuration object
 * @returns Promise<boolean> - Success status
 */
const sendEmail = async (emailData) => {
    var _a;
    // Initialize SendGrid on first use
    initializeSendGrid();
    if (!SENDGRID_API_KEY) {
        logger.error('SendGrid API key not configured');
        return false;
    }
    try {
        const msg = {
            to: emailData.to,
            from: emailData.from || 'noreply@propagentic.com', // Your verified sender
            subject: emailData.subject,
            text: emailData.text || '',
            html: emailData.html,
        };
        logger.info(`Sending email via SendGrid to: ${emailData.to}`);
        const [response] = await mail_1.default.send(msg);
        logger.info(`Email sent successfully via SendGrid`, {
            to: emailData.to,
            statusCode: response.statusCode,
            messageId: response.headers['x-message-id']
        });
        return true;
    }
    catch (error) {
        logger.error('Failed to send email via SendGrid', {
            error: error.message,
            code: error.code,
            response: (_a = error.response) === null || _a === void 0 ? void 0 : _a.body
        });
        return false;
    }
};
exports.sendEmail = sendEmail;
/**
 * Send property invitation email using SendGrid
 * @param tenantEmail - Recipient email address
 * @param inviteCode - Unique invitation code
 * @param landlordName - Name of the landlord
 * @param propertyName - Name of the property
 * @param appDomain - Application domain for links
 * @returns Promise<boolean> - Success status
 */
// REMOVED: sendPropertyInviteEmail function migrated to unified service
//# sourceMappingURL=sendgridEmailService.js.map