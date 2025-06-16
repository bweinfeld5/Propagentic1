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
exports.testPing = exports.testSendGrid = void 0;
const functions = __importStar(require("firebase-functions"));
const logger = __importStar(require("firebase-functions/logger"));
const sendgridEmailService_1 = require("./sendgridEmailService");
/**
 * Test function to verify SendGrid integration
 */
exports.testSendGrid = functions.https.onCall(async (data) => {
    const testEmail = data.email;
    if (!testEmail) {
        throw new functions.https.HttpsError('invalid-argument', 'Email address is required for testing.');
    }
    logger.info(`Testing SendGrid with email: ${testEmail}`);
    try {
        // Test 1: Basic email sending
        const basicEmailResult = await (0, sendgridEmailService_1.sendEmail)({
            to: testEmail,
            subject: 'PropAgentic SendGrid Test - Basic Email',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #4F46E5;">SendGrid Test Successful! ✅</h1>
          <p>This is a test email from PropAgentic's SendGrid integration.</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <p><strong>Test Type:</strong> Basic Email</p>
          <p>If you received this email, SendGrid is properly configured and working!</p>
        </div>
      `,
            text: `SendGrid Test Successful! This is a test email from PropAgentic's SendGrid integration. Timestamp: ${new Date().toISOString()}`
        });
        // Test 2: Property invite email
        const inviteEmailResult = await (0, sendgridEmailService_1.sendPropertyInviteEmail)(testEmail, 'TEST123', // Test invite code
        'Test Landlord', 'Test Property - 123 Main St', 'https://propagentic.com');
        const results = {
            success: true,
            basicEmail: basicEmailResult,
            inviteEmail: inviteEmailResult,
            timestamp: new Date().toISOString(),
            testEmail: testEmail
        };
        logger.info('SendGrid test completed successfully', results);
        return {
            success: true,
            message: `Test emails sent successfully to ${testEmail}`,
            results: results
        };
    }
    catch (error) {
        logger.error('SendGrid test failed:', error);
        throw new functions.https.HttpsError('internal', `SendGrid test failed: ${error.message}`, { error: error.message, timestamp: new Date().toISOString() });
    }
});
/**
 * Simple ping function to test if functions are deployed
 */
exports.testPing = functions.https.onCall(async () => {
    return {
        message: "pong",
        timestamp: new Date().toISOString(),
        sendGridConfigured: !!(process.env.SENDGRID_API_KEY ||
            (functions.config().sendgrid && functions.config().sendgrid.api_key))
    };
});
//# sourceMappingURL=testSendGrid.js.map