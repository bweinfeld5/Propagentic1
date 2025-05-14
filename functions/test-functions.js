/**
 * Test script for Propagentic Firebase Cloud Functions
 * 
 * This script can be used to test the AI ticket classification and contractor matching functions
 * by creating test documents in Firestore.
 * 
 * Usage:
 * 1. Make sure you have Firebase Admin SDK credentials (service-account-key.json)
 * 2. Run: node test-functions.js
 */

const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin SDK with service account
const serviceAccount = require('../service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Sample test data
const testTicket = {
  description: 'The kitchen sink is leaking and water is pooling under the cabinet. The leak seems to be coming from the pipe connection under the sink. It started yesterday and is getting worse.',
  urgency: 'medium', // This will be overridden by the AI classification
  status: 'pending_classification', // This triggers the classification function
  submittedBy: 'test-tenant-id', // Replace with a real tenant ID from your database
  propertyId: 'test-property-id', // Replace with a real property ID from your database
  unitNumber: '101',
  timestamps: {
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  }
};

// Sample property data (if test property doesn't exist)
const testProperty = {
  propertyName: 'Test Apartment Building',
  address: {
    street: '123 Test Street',
    city: 'Testville',
    state: 'TS',
    zip: '12345'
  },
  landlordId: 'test-landlord-id', // Replace with a real landlord ID from your database
  unitList: ['101', '102', '103'],
  tenantIds: ['test-tenant-id'], // Replace with real tenant IDs from your database
  activeRequests: [],
  createdAt: admin.firestore.FieldValue.serverTimestamp()
};

// Sample contractor data (if test contractors don't exist)
const testContractors = [
  {
    uid: 'test-contractor-1',
    name: 'Plumbing Pro',
    email: 'plumber@example.com',
    phone: '555-123-4567',
    role: 'contractor',
    contractorSkills: ['plumbing', 'general'],
    linkedTo: ['test-landlord-id'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    profileComplete: true
  },
  {
    uid: 'test-contractor-2',
    name: 'Electric Expert',
    email: 'electrician@example.com',
    phone: '555-987-6543',
    role: 'contractor',
    contractorSkills: ['electrical', 'general'],
    linkedTo: ['test-landlord-id'],
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    profileComplete: true
  }
];

// Sample contractor profiles
const testContractorProfiles = [
  {
    contractorId: 'test-contractor-1',
    userId: 'test-contractor-1',
    skills: ['plumbing', 'general'],
    serviceArea: '12345',
    availability: true,
    preferredProperties: ['test-property-id'],
    rating: 4.8,
    jobsCompleted: 56
  },
  {
    contractorId: 'test-contractor-2',
    userId: 'test-contractor-2',
    skills: ['electrical', 'general'],
    serviceArea: '12345',
    availability: true,
    rating: 4.5,
    jobsCompleted: 42
  }
];

// Sample landlord profile
const testLandlordProfile = {
  landlordId: 'test-landlord-id',
  userId: 'test-landlord-id',
  properties: ['test-property-id'],
  tenants: ['test-tenant-id'],
  contractors: ['test-contractor-1', 'test-contractor-2'],
  invitesSent: []
};

/**
 * Create a test ticket to trigger classification
 */
async function createTestTicket() {
  try {
    // Create a test ticket with a unique ID
    const ticketId = `test-ticket-${uuidv4().substring(0, 8)}`;
    console.log(`Creating test ticket with ID: ${ticketId}`);
    
    // Check if test property exists, create if not
    const propertyRef = db.collection('properties').doc(testTicket.propertyId);
    const propertyDoc = await propertyRef.get();
    
    if (!propertyDoc.exists) {
      console.log(`Creating test property: ${testTicket.propertyId}`);
      await propertyRef.set(testProperty);
    }
    
    // Check if test contractors exist, create if not
    for (const contractor of testContractors) {
      const contractorRef = db.collection('users').doc(contractor.uid);
      const contractorDoc = await contractorRef.get();
      
      if (!contractorDoc.exists) {
        console.log(`Creating test contractor: ${contractor.uid}`);
        await contractorRef.set(contractor);
      }
    }
    
    // Check if test contractor profiles exist, create if not
    for (const profile of testContractorProfiles) {
      const profileRef = db.collection('contractorProfiles').doc(profile.contractorId);
      const profileDoc = await profileRef.get();
      
      if (!profileDoc.exists) {
        console.log(`Creating test contractor profile: ${profile.contractorId}`);
        await profileRef.set(profile);
      }
    }
    
    // Check if test landlord profile exists, create if not
    const landlordProfileRef = db.collection('landlordProfiles').doc(testLandlordProfile.landlordId);
    const landlordProfileDoc = await landlordProfileRef.get();
    
    if (!landlordProfileDoc.exists) {
      console.log(`Creating test landlord profile: ${testLandlordProfile.landlordId}`);
      await landlordProfileRef.set(testLandlordProfile);
    }
    
    // Create the test ticket
    await db.collection('tickets').doc(ticketId).set(testTicket);
    
    console.log(`Test ticket created: ${ticketId}`);
    console.log('The following functions should trigger in sequence:');
    console.log('1. classifyMaintenanceRequest');
    console.log('2. matchContractorToTicket');
    console.log('\nTo test contractor assignment notification:');
    console.log(`db.collection('tickets').doc('${ticketId}').update({`);
    console.log(`  status: 'assigned',`);
    console.log(`  assignedTo: 'test-contractor-1'`);
    console.log('});');
    
    return ticketId;
  } catch (error) {
    console.error('Error creating test ticket:', error);
  }
}

/**
 * Manually trigger contractor assignment to test notification
 * @param {string} ticketId - The ID of the ticket to assign
 */
async function assignContractorToTicket(ticketId) {
  try {
    console.log(`Assigning contractor to ticket: ${ticketId}`);
    
    await db.collection('tickets').doc(ticketId).update({
      status: 'assigned',
      assignedTo: 'test-contractor-1',
      'timestamps.assignedAt': admin.firestore.FieldValue.serverTimestamp(),
      'timestamps.updatedAt': admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log(`Contractor assigned to ticket: ${ticketId}`);
    console.log('The notifyAssignedContractor function should trigger now');
  } catch (error) {
    console.error('Error assigning contractor:', error);
  }
}

/**
 * Monitor a ticket's status changes
 * @param {string} ticketId - The ID of the ticket to monitor
 */
async function monitorTicket(ticketId) {
  console.log(`\nMonitoring ticket: ${ticketId}`);
  
  // Listen for changes to the ticket document
  const unsubscribe = db.collection('tickets').doc(ticketId)
    .onSnapshot((doc) => {
      if (doc.exists) {
        const data = doc.data();
        console.log(`\nTicket ${ticketId} updated:`);
        console.log(`Status: ${data.status}`);
        
        if (data.category) {
          console.log(`Category: ${data.category}`);
        }
        
        if (data.urgency) {
          console.log(`Urgency: ${data.urgency}`);
        }
        
        if (data.recommendedContractors) {
          console.log(`Recommended Contractors: ${data.recommendedContractors.join(', ')}`);
        }
        
        if (data.assignedTo) {
          console.log(`Assigned To: ${data.assignedTo}`);
        }
        
        // If status is ready_to_assign, demonstrate contractor assignment
        if (data.status === 'ready_to_assign' && !data.assignedTo) {
          console.log('\nReady to assign contractor. Automatically assigning in 5 seconds...');
          setTimeout(() => {
            assignContractorToTicket(ticketId);
          }, 5000);
        }
      }
    }, (error) => {
      console.error('Error monitoring ticket:', error);
    });
  
  // Keep monitoring for 2 minutes then unsubscribe
  console.log('Monitoring for 2 minutes...');
  setTimeout(() => {
    unsubscribe();
    console.log('Stopped monitoring ticket');
    process.exit(0);
  }, 120000);
}

// Run the test
async function runTest() {
  try {
    const ticketId = await createTestTicket();
    if (ticketId) {
      await monitorTicket(ticketId);
    }
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTest(); 