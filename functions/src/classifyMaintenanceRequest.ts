/**
 * Firebase Cloud Function to classify maintenance requests using OpenAI GPT-4
 * This function automatically categorizes maintenance issues and assigns urgency levels
 */

// Import Firebase Functions v2
import { onDocumentCreated, FirestoreEvent, QueryDocumentSnapshot } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { OpenAI } from "openai";
import * as logger from "firebase-functions/logger";

let openaiClient: OpenAI | null = null;

/** Lazily initialize OpenAI client */
function getOpenAIClient(): OpenAI {
    if (!openaiClient) {
        if (!process.env.OPENAI_API_KEY) {
            logger.error("OPENAI_API_KEY environment variable is missing or empty.");
            throw new Error("OpenAI API Key is not configured.");
        }
        openaiClient = new OpenAI({
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
export const classifyMaintenanceRequest = onDocumentCreated(
    {
      document: "tickets/{ticketId}",
      region: "us-central1",
    }, 
    async (event: FirestoreEvent<QueryDocumentSnapshot | undefined, { ticketId: string }>) => {
      try {
        const snapshot = event.data;
        if (!snapshot) {
          logger.error("No data associated with the event");
          return;
        }
        
        const requestData = snapshot.data();
        
        // Only process documents with 'pending_classification' status
        if (!requestData || requestData.status !== "pending_classification") {
          logger.info(
              `Document ${event.params.ticketId} already processed or has no data. ` +
              `Status: ${requestData?.status}`
          );
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
        
        logger.info(
            `Successfully classified ticket ${event.params.ticketId} as ` +
            `${classification.category} with urgency ${classification.urgency}`
        );
      } catch (error: any) {
        logger.error("Error classifying maintenance request:", error);
        
        try {
          // Update the document with error information
          if (event.data?.ref) {
          await event.data.ref.update({
            status: "classification_failed",
                classificationError: error?.message || "Unknown error",
          });
          }
        } catch (updateError) {
          logger.error("Error updating document with error status:", updateError);
        }
      }
    }
);

/**
 * Helper function to convert urgency number to text
 */
function getUrgencyText(urgency: number): string {
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
async function classifyWithOpenAI(description: string): Promise<{category: string, urgency: number}> {
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
        {role: "system", content: "You are a maintenance issue classifier."},
        {role: "user", content: prompt},
      ],
      temperature: 0.3, // Lower temperature for more deterministic results
      max_tokens: 150, // Limit token usage
    });
    
    // Parse the response from OpenAI
    const content = response.choices[0]?.message?.content?.trim();
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
  } catch (error: any) {
    logger.error("Error processing OpenAI response:", error);
    if (error?.response?.data) {
      logger.error("OpenAI API Error:", error.response.data);
    }
    throw new Error(`Failed to classify issue: ${error?.message || 'Unknown OpenAI error'}`);
  }
}

// Add this empty export to treat the file as a module
export {};
