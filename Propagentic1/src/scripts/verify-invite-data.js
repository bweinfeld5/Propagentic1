// Script to verify the data created during the tenant invitation process
const admin = require('firebase-admin');
const path = require('path');

// Load service account key
const serviceAccountPath = path.join(__dirname, '../../propagentic-firebase-adminsdk-fbsvc-c20b027723.json');
const serviceAccount = require(serviceAccountPath);

// Initialize the app with admin privileges
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://propagentic-default-rtdb.firebaseio.com"
});

const db = admin.firestore();

/**
 * Verify the data created during the tenant invitation process
 */
async function verifyInviteData() {
  try {
    console.log('==========================================');
    console.log('VERIFYING TENANT INVITATION PROCESS DATA');
    console.log('==========================================');
    
    // Configuration
    const testLandlordEmail = 'landlord@example.com';
    const testTenantEmail = 'tenant@example.com';
    
    // 1. Verify landlord exists
    console.log('\n1. Checking landlord...');
    const landlord = await findUserByEmail(testLandlordEmail);
    if (landlord) {
      console.log(`✅ Found landlord: ${landlord.email} (ID: ${landlord.id})`);
      console.log(`   User type: ${landlord.userType}, Display name: ${landlord.displayName}`);
    } else {
      console.log('❌ Landlord not found!');
    }
    
    // 2. Verify tenant exists
    console.log('\n2. Checking tenant...');
    const tenant = await findUserByEmail(testTenantEmail);
    if (tenant) {
      console.log(`✅ Found tenant: ${tenant.email} (ID: ${tenant.id})`);
      console.log(`   User type: ${tenant.userType}, Display name: ${tenant.displayName}`);
      console.log(`   Property ID: ${tenant.propertyId}, Landlord ID: ${tenant.landlordId}`);
    } else {
      console.log('❌ Tenant not found!');
    }
    
    // 3. Verify property exists and is linked to tenant
    console.log('\n3. Checking property...');
    if (tenant && tenant.propertyId) {
      const property = await getPropertyById(tenant.propertyId);
      if (property) {
        console.log(`✅ Found property: ${property.name} (ID: ${property.id})`);
        console.log(`   Address: ${property.address}`);
        console.log(`   Is occupied: ${property.isOccupied}, Tenant ID: ${property.tenantId}`);
        console.log(`   Landlord ID: ${property.landlordId}`);
      } else {
        console.log('❌ Property not found!');
      }
    } else {
      console.log('❌ No property ID found for tenant!');
    }
    
    // 4. Verify invitation exists and is accepted
    console.log('\n4. Checking invitation...');
    const invitation = await findInviteByTenantEmail(testTenantEmail);
    if (invitation) {
      console.log(`✅ Found invitation: (ID: ${invitation.id})`);
      console.log(`   Status: ${invitation.status}, Email sent status: ${invitation.emailSentStatus}`);
      console.log(`   Property ID: ${invitation.propertyId}, Tenant ID: ${invitation.tenantId}`);
      console.log(`   Created at: ${invitation.createdAt.toDate().toLocaleString()}`);
      if (invitation.acceptedAt) {
        console.log(`   Accepted at: ${invitation.acceptedAt.toDate().toLocaleString()}`);
      }
    } else {
      console.log('❌ Invitation not found!');
    }
    
    // 5. Verify email was sent (check mail collection)
    console.log('\n5. Checking mail collection...');
    const mailDoc = await findMailByTo(testTenantEmail);
    if (mailDoc) {
      console.log(`✅ Found mail document: (ID: ${mailDoc.id})`);
      console.log(`   To: ${mailDoc.to}`);
      console.log(`   Subject: ${mailDoc.message.subject}`);
    } else {
      console.log('❌ Mail document not found!');
    }
    
    console.log('\n==========================================');
    console.log('VERIFICATION COMPLETE');
    console.log('==========================================');
    
  } catch (error) {
    console.error('❌ Error verifying data:', error);
  } finally {
    // Exit when done
    process.exit(0);
  }
}

/**
 * Find a user by email
 */
async function findUserByEmail(email) {
  const usersRef = db.collection('users');
  const snapshot = await usersRef.where('email', '==', email).limit(1).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Get a property by ID
 */
async function getPropertyById(propertyId) {
  const propertyDoc = await db.collection('properties').doc(propertyId).get();
  
  if (!propertyDoc.exists) {
    return null;
  }
  
  return {
    id: propertyDoc.id,
    ...propertyDoc.data()
  };
}

/**
 * Find an invitation by tenant email
 */
async function findInviteByTenantEmail(email) {
  const invitesRef = db.collection('invites');
  const snapshot = await invitesRef.where('tenantEmail', '==', email.toLowerCase()).limit(1).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  };
}

/**
 * Find a mail document by recipient
 */
async function findMailByTo(email) {
  const mailRef = db.collection('mail');
  const snapshot = await mailRef.where('to', '==', email).limit(1).get();
  
  if (snapshot.empty) {
    return null;
  }
  
  const doc = snapshot.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  };
}

// Run the verification
verifyInviteData(); 