// Script to test direct email sending via Firebase Functions
// by creating an invite that will trigger the sendInviteEmail function

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';

/**
 * Creates a test invite to trigger the sendInviteEmail function 
 */
async function createTestInvite() {
  try {
    // Make sure user is authenticated
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('You must be logged in to create an invite');
      return;
    }

    console.log('Creating test invite document...');
    
    // Create test data
    const testInviteData = {
      tenantEmail: 'test@example.com', // Replace with your actual email
      propertyId: 'test-property-123', // Replace with an actual property ID if needed
      landlordId: currentUser.uid,
      landlordName: currentUser.displayName || 'Test Landlord',
      propertyName: 'Test Property',
      status: 'pending',
      createdAt: serverTimestamp(),
      emailSentStatus: 'pending'
    };
    
    console.log('Test invite data:', testInviteData);
    
    // Add document to invites collection
    const invitesRef = collection(db, 'invites');
    const docRef = await addDoc(invitesRef, testInviteData);
    
    console.log('Test invite created with ID:', docRef.id);
    console.log('This should trigger the sendInviteEmail Firebase Function');
    console.log('Check Firebase Functions logs to see if the email was sent');
    
  } catch (error) {
    console.error('Error creating test invite:', error);
  }
}

// Execute the function
createTestInvite(); 