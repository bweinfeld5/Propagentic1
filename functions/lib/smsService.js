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
exports.sendTestSMS = exports.sendContractorWelcomeSMS = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
// Initialize Twilio
const twilio = require('twilio');
/**
 * Send SMS notification to contractor when added to landlord profile
 */
exports.sendContractorWelcomeSMS = functions.firestore
    .onDocumentCreated('contractors/{contractorId}', async (event) => {
    var _a, _b, _c, _d;
    try {
        const snap = event.data;
        if (!snap) {
            console.error('No data associated with the event');
            return;
        }
        const contractorData = snap.data();
        const contractorId = event.params.contractorId;
        console.log(`📱 New contractor added: ${contractorId}`);
        // Get Twilio credentials from environment config
        const config = functions.config();
        const accountSid = (_a = config.twilio) === null || _a === void 0 ? void 0 : _a.account_sid;
        const authToken = (_b = config.twilio) === null || _b === void 0 ? void 0 : _b.auth_token;
        const twilioNumber = (_c = config.twilio) === null || _c === void 0 ? void 0 : _c.phone_number;
        if (!accountSid || !authToken || !twilioNumber) {
            console.error('❌ Twilio configuration missing');
            return;
        }
        // Initialize Twilio client
        const client = twilio(accountSid, authToken);
        // Get landlord information
        const landlordDoc = await admin.firestore()
            .doc(`landlordProfiles/${contractorData.landlordId}`)
            .get();
        if (!landlordDoc.exists) {
            console.error('❌ Landlord profile not found');
            return;
        }
        const landlordData = landlordDoc.data();
        const landlordName = `${(landlordData === null || landlordData === void 0 ? void 0 : landlordData.firstName) || ''} ${(landlordData === null || landlordData === void 0 ? void 0 : landlordData.lastName) || ''}`.trim()
            || (landlordData === null || landlordData === void 0 ? void 0 : landlordData.companyName)
            || 'PropAgentic';
        // Compose SMS message
        const message = `🏠 Welcome to ${landlordName}'s preferred contractors network! You've been added to their PropAgentic contractor list for ${((_d = contractorData.trades) === null || _d === void 0 ? void 0 : _d.join(', ')) || 'general services'}. You may receive maintenance requests and job opportunities. Reply STOP to opt out.`;
        // Send SMS only if contractor has a valid phone number
        if (contractorData.phone) {
            // Clean phone number (remove any formatting)
            const cleanPhone = contractorData.phone.replace(/[^\d+]/g, '');
            try {
                const smsResult = await client.messages.create({
                    body: message,
                    from: twilioNumber,
                    to: cleanPhone
                });
                console.log(`✅ SMS sent successfully: ${smsResult.sid}`);
                // Log the SMS in contractor document
                await snap.ref.update({
                    welcomeSMSSent: true,
                    welcomeSMSTimestamp: admin.firestore.FieldValue.serverTimestamp(),
                    welcomeSMSSid: smsResult.sid
                });
            }
            catch (smsError) {
                console.error('❌ Failed to send SMS:', smsError);
                // Log failed SMS attempt
                await snap.ref.update({
                    welcomeSMSSent: false,
                    welcomeSMSError: (smsError === null || smsError === void 0 ? void 0 : smsError.message) || 'Unknown error',
                    welcomeSMSTimestamp: admin.firestore.FieldValue.serverTimestamp()
                });
            }
        }
        else {
            console.log('📱 No phone number provided for contractor, skipping SMS');
        }
    }
    catch (error) {
        console.error('❌ Error in sendContractorWelcomeSMS:', error);
    }
});
/**
 * HTTP function to manually send SMS (for testing or manual notifications)
 */
exports.sendTestSMS = functions.https.onCall(async (data, context) => {
    var _a, _b, _c;
    try {
        // Verify authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
        }
        const { phoneNumber, message } = data;
        if (!phoneNumber || !message) {
            throw new functions.https.HttpsError('invalid-argument', 'Phone number and message required');
        }
        // Get Twilio credentials
        const config = functions.config();
        const accountSid = (_a = config.twilio) === null || _a === void 0 ? void 0 : _a.account_sid;
        const authToken = (_b = config.twilio) === null || _b === void 0 ? void 0 : _b.auth_token;
        const twilioNumber = (_c = config.twilio) === null || _c === void 0 ? void 0 : _c.phone_number;
        if (!accountSid || !authToken || !twilioNumber) {
            throw new functions.https.HttpsError('failed-precondition', 'Twilio not configured');
        }
        // Initialize Twilio client
        const client = twilio(accountSid, authToken);
        // Send SMS
        const result = await client.messages.create({
            body: message,
            from: twilioNumber,
            to: phoneNumber
        });
        console.log(`✅ Test SMS sent: ${result.sid}`);
        return {
            success: true,
            messageSid: result.sid,
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        console.error('❌ Error sending test SMS:', error);
        throw new functions.https.HttpsError('internal', (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error');
    }
});
//# sourceMappingURL=smsService.js.map