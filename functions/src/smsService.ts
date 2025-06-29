import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

// Initialize Twilio
const twilio = require('twilio');

/**
 * Send SMS notification to contractor when added to landlord profile
 */
export const sendContractorWelcomeSMS = functions.firestore
  .onDocumentCreated('contractors/{contractorId}', async (event: any) => {
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
      const accountSid = config.twilio?.account_sid;
      const authToken = config.twilio?.auth_token;
      const twilioNumber = config.twilio?.phone_number;
      
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
      const landlordName = `${landlordData?.firstName || ''} ${landlordData?.lastName || ''}`.trim() 
                           || landlordData?.companyName 
                           || 'PropAgentic';
      
      // Compose SMS message
      const message = `🏠 Welcome to ${landlordName}'s preferred contractors network! You've been added to their PropAgentic contractor list for ${contractorData.trades?.join(', ') || 'general services'}. You may receive maintenance requests and job opportunities. Reply STOP to opt out.`;
      
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
          
        } catch (smsError: any) {
          console.error('❌ Failed to send SMS:', smsError);
          
          // Log failed SMS attempt
          await snap.ref.update({
            welcomeSMSSent: false,
            welcomeSMSError: smsError?.message || 'Unknown error',
            welcomeSMSTimestamp: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      } else {
        console.log('📱 No phone number provided for contractor, skipping SMS');
      }
      
    } catch (error) {
      console.error('❌ Error in sendContractorWelcomeSMS:', error);
    }
  });

/**
 * HTTP function to manually send SMS (for testing or manual notifications)
 */
export const sendTestSMS = functions.https.onCall(async (data: any, context: any) => {
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
    const accountSid = config.twilio?.account_sid;
    const authToken = config.twilio?.auth_token;
    const twilioNumber = config.twilio?.phone_number;
    
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
    
  } catch (error: any) {
    console.error('❌ Error sending test SMS:', error);
    throw new functions.https.HttpsError('internal', error?.message || 'Unknown error');
  }
});
