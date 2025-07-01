// Test script for adding a document to the 'mail' collection
// to check if the Firebase Extension for sending emails is working

import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Creates a test email in the mail collection
 * Make sure you're authenticated before running this script
 */
async function sendTestEmail() {
  try {
    console.log('Creating test email document...');
    
    // Create a document in the 'mail' collection that the extension watches
    const mailRef = collection(db, 'mail');
    const docRef = await addDoc(mailRef, {
      // Required fields
      to: 'test@example.com', // Replace with your actual email
      subject: 'Test Email from PropAgentic',
      text: 'This is a plain text version of the test email.',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px;">
          <h2 style="color: #4a5568;">PropAgentic Email Test</h2>
          <p>This is an HTML test email from PropAgentic.</p>
          <p>If you're seeing this, the email sending system is working!</p>
          <p>Time sent: ${new Date().toLocaleString()}</p>
        </div>
      `
    });
    
    console.log('Test email document created with ID:', docRef.id);
    console.log('Check Firebase Functions logs to see if the email was sent');
    
  } catch (error) {
    console.error('Error creating test email document:', error);
  }
}

// Execute the function
sendTestEmail(); 