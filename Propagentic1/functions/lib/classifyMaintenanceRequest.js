"use strict";
/**
 * Firebase Cloud Function to classify maintenance requests using OpenAI GPT-4
 * This function automatically categorizes maintenance issues and assigns urgency levels
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
exports.classifyMaintenanceRequest = void 0;
// Import Firebase Functions v2
const firestore_1 = require("firebase-functions/v2/firestore");
const admin = __importStar(require("firebase-admin"));
const openai_1 = require("openai");
const logger = __importStar(require("firebase-functions/logger"));
let openaiClient = null;
/** Lazily initialize OpenAI client */
function getOpenAIClient() {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            logger.error("OPENAI_API_KEY environment variable is missing or empty.");
            throw new Error("OpenAI API Key is not configured.");
        }
        openaiClient = new openai_1.OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });
        logger.info("OpenAI client initialized.");
    }
    return openaiClient;
}
/**
 * Cloud Function that triggers when a new maintenance request is added to Firestore
 * with status 'pending_classification'
 */
exports.classifyMaintenanceRequest = (0, firestore_1.onDocumentCreated)({
    document: "tickets/{ticketId}",
    region: "us-central1",
}, async (event) => {
    var _a;
    try {
        const snapshot = event.data;
        if (!snapshot) {
            logger.error("No data associated with the event");
            return;
        }
        const requestData = snapshot.data();
        // Only process documents with 'pending_classification' status
        if (!requestData || requestData.status !== "pending_classification") {
            logger.info(`Document ${event.params.ticketId} already processed or has no data. ` +
                `Status: ${requestData === null || requestData === void 0 ? void 0 : requestData.status}`);
            return;
        }
        logger.info(`Processing maintenance ticket: ${event.params.ticketId}`);
        // Extract the description from the document
        const description = requestData.description;
        if (!description) {
            logger.error("No description found in the document");
            await snapshot.ref.update({
                status: "classification_failed",
                classificationError: "No description provided",
            });
            return;
        }
        // Send the description to OpenAI for classification
        const classification = await classifyWithOpenAI(description);
        // Update the Firestore document with the classification results
        await snapshot.ref.update({
            category: classification.category,
            urgency: classification.urgency,
            status: "pending", // Change to pending after classification
            classifiedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        // Create notification for the tenant
        if (requestData.submittedBy) {
            await admin.firestore().collection('notifications').add({
                userId: requestData.submittedBy,
                userRole: 'tenant',
                type: 'ticket_update',
                title: 'Maintenance Request Analyzed',
                message: `Your ${classification.category} request has been analyzed and classified as ${getUrgencyText(classification.urgency)} priority.`,
                data: {
                    ticketId: event.params.ticketId,
                    category: classification.category,
                    urgency: classification.urgency,
                    originalDescription: description
                },
                read: false,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
            });
        }
        logger.info(`Successfully classified ticket ${event.params.ticketId} as ` +
            `${classification.category} with urgency ${classification.urgency}`);
    }
    catch (error) {
        logger.error("Error classifying maintenance request:", error);
        try {
            // Update the document with error information
            if ((_a = event.data) === null || _a === void 0 ? void 0 : _a.ref) {
                await event.data.ref.update({
                    status: "classification_failed",
                    classificationError: (error === null || error === void 0 ? void 0 : error.message) || "Unknown error",
                });
            }
        }
        catch (updateError) {
            logger.error("Error updating document with error status:", updateError);
        }
    }
});
/**
 * Helper function to convert urgency number to text
 */
function getUrgencyText(urgency) {
    switch (urgency) {
        case 1: return "low";
        case 2: return "minor";
        case 3: return "normal";
        case 4: return "important";
        case 5: return "emergency";
        default: return "normal";
    }
}
/**
 * Function to classify a maintenance request description using OpenAI's GPT-4
 * @param {string} description - The maintenance request description
 * @return {Promise<{category: string, urgency: number}>} - Classification results
 */
async function classifyWithOpenAI(description) {
    var _a, _b, _c, _d;
    const openai = getOpenAIClient();
    const prompt = `
You are a building maintenance expert. Analyze the following maintenance request:

"${description}"

Based on the description, determine:
1. The most appropriate category: plumbing, electrical, HVAC, structural, 
   appliance, or general
2. The urgency level (1-5) where:
   1 = Low priority (can be scheduled anytime)
   2 = Minor issue (should be addressed within 2 weeks)
   3 = Normal priority (should be addressed within a week)
   4 = Important (should be addressed within 48 hours)
   5 = Emergency (requires immediate attention)

Respond with JSON in the following format only, no other text:
{
  "category": "category_name",
  "urgency": urgency_number
}`;
    logger.info("Sending classification request to OpenAI");
    try {
        // Call OpenAI API for classification
        const response = await openai.chat.completions.create({
            model: "gpt-4-turbo", // Use the model name as specified in OpenAI docs
            messages: [
                { role: "system", content: "You are a maintenance issue classifier." },
                { role: "user", content: prompt },
            ],
            temperature: 0.3, // Lower temperature for more deterministic results
            max_tokens: 150, // Limit token usage
        });
        // Parse the response from OpenAI
        const content = (_c = (_b = (_a = response.choices[0]) === null || _a === void 0 ? void 0 : _a.message) === null || _b === void 0 ? void 0 : _b.content) === null || _c === void 0 ? void 0 : _c.trim();
        if (!content) {
            throw new Error("Invalid or empty response content from OpenAI");
        }
        logger.info("Received response from OpenAI:", content);
        const classification = JSON.parse(content);
        // Validate the response format
        if (!classification.category || !classification.urgency) {
            throw new Error("Invalid classification response format");
        }
        // Ensure urgency is a number between 1-5
        const urgency = Number(classification.urgency);
        if (isNaN(urgency) || urgency < 1 || urgency > 5) {
            throw new Error("Invalid urgency value: must be a number between 1-5");
        }
        return {
            category: classification.category.toLowerCase(),
            urgency: urgency,
        };
    }
    catch (error) {
        logger.error("Error processing OpenAI response:", error);
        if ((_d = error === null || error === void 0 ? void 0 : error.response) === null || _d === void 0 ? void 0 : _d.data) {
            logger.error("OpenAI API Error:", error.response.data);
        }
        throw new Error(`Failed to classify issue: ${(error === null || error === void 0 ? void 0 : error.message) || 'Unknown OpenAI error'}`);
    }
}
//# sourceMappingURL=classifyMaintenanceRequest.js.map