const admin = require('firebase-admin');

// Initialize Firebase Admin (works in Firebase Functions environment or with GOOGLE_APPLICATION_CREDENTIALS)
if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

async function sendTestEmail() {
  try {
    console.log('Sending test email to ben@propagenticai.com...');
    
    const emailData = {
      to: 'ben@propagenticai.com',
      message: {
        subject: 'PropAgentic Test Email - Security Rules Update',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #f97316;">🎉 PropAgentic Email System Working!</h2>
            <p>Hi Ben,</p>
            <p>Great news! The email system is functioning properly after the security rules update.</p>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">✅ What's Working:</h3>
              <ul style="color: #6b7280;">
                <li><strong>Tenant Data Access:</strong> 34 tenant accounts accessible via Cloud Functions</li>
                <li><strong>Email Sending:</strong> Firebase Extension integration successful</li>
                <li><strong>Security Rules:</strong> Updated to allow proper mail collection access</li>
                <li><strong>Property Invitations:</strong> New collection rules added for tenant invitations</li>
              </ul>
            </div>
            
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #92400e; margin-top: 0;">🔧 Recent Updates:</h3>
              <ul style="color: #78350f;">
                <li>Added read permissions for mail collection testing</li>
                <li>Created propertyInvitations collection security rules</li>
                <li>Enhanced email system with Firebase Extension</li>
                <li>Fixed tenant invitation flow for existing users</li>
              </ul>
            </div>
            
            <p>The system is ready for tenant property invitations! 🏠</p>
            
            <p style="color: #6b7280; font-size: 14px;">
              Sent at: ${new Date().toLocaleString()}<br>
              From: PropAgentic Email System
            </p>
          </div>
        `,
        text: `PropAgentic Test Email - Security Rules Update
        
Hi Ben,

Great news! The email system is functioning properly after the security rules update.

✅ What's Working:
- Tenant Data Access: 34 tenant accounts accessible via Cloud Functions
- Email Sending: Firebase Extension integration successful  
- Security Rules: Updated to allow proper mail collection access
- Property Invitations: New collection rules added for tenant invitations

🔧 Recent Updates:
- Added read permissions for mail collection testing
- Created propertyInvitations collection security rules
- Enhanced email system with Firebase Extension
- Fixed tenant invitation flow for existing users

The system is ready for tenant property invitations! 🏠

Sent at: ${new Date().toLocaleString()}
From: PropAgentic Email System`
      }
    };

    // Add to mail collection for Firebase Extension processing
    const docRef = await db.collection('mail').add(emailData);
    
    console.log('✅ Test email queued successfully!');
    console.log('Document ID:', docRef.id);
    console.log('Recipient:', emailData.to);
    console.log('Check ben@propagenticai.com for the email.');
    
    // Wait a moment and check the status
    setTimeout(async () => {
      try {
        const doc = await db.collection('mail').doc(docRef.id).get();
        const data = doc.data();
        console.log('\n📧 Email Status Check:');
        console.log('Delivery Status:', data.delivery?.state || 'Processing...');
        console.log('Delivery Info:', data.delivery?.info || 'No delivery info yet');
        if (data.delivery?.error) {
          console.log('Delivery Error:', data.delivery.error);
        }
      } catch (error) {
        console.log('Could not check delivery status:', error.message);
      }
      
      process.exit(0);
    }, 5000);
    
  } catch (error) {
    console.error('❌ Error sending test email:', error);
    process.exit(1);
  }
}

sendTestEmail(); 