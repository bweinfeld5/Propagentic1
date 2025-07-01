const { getFirestore } = require('firebase-admin/firestore');
const admin = require('firebase-admin');

// Initialize Firebase Admin (assumes service account or default credentials)
if (!admin.apps.length) {
  admin.initializeApp({
    projectId: 'propagentic'
  });
}

const db = getFirestore();

async function fixMissingTenantDetails() {
  console.log('🔧 Fixing Missing Tenant Details for tenant@propagenticai.com');
  console.log('================================================================\n');

  try {
    // Find the tenant user
    const tenantUsersSnapshot = await db.collection('users')
      .where('email', '==', 'tenant@propagenticai.com')
      .get();

    if (tenantUsersSnapshot.empty) {
      console.log('❌ No tenant user found with email tenant@propagenticai.com');
      return;
    }

    const tenantUser = tenantUsersSnapshot.docs[0];
    const tenantUid = tenantUser.id;
    const tenantData = tenantUser.data();
    console.log(`✅ Found tenant: ${tenantUid} (${tenantData.email})`);

    // Find the landlord user
    const landlordUsersSnapshot = await db.collection('users')
      .where('email', '==', 'owner@propagenticai.com')
      .get();

    if (landlordUsersSnapshot.empty) {
      console.log('❌ No landlord user found with email owner@propagenticai.com');
      return;
    }

    const landlordUser = landlordUsersSnapshot.docs[0];
    const landlordUid = landlordUser.id;
    console.log(`✅ Found landlord: ${landlordUid}`);

    // Get landlord profile
    const landlordProfileDoc = await db.collection('landlordProfiles').doc(landlordUid).get();
    
    if (!landlordProfileDoc.exists) {
      console.log('❌ No landlord profile found');
      return;
    }

    const landlordProfile = landlordProfileDoc.data();
    const acceptedTenants = landlordProfile.acceptedTenants || [];
    const acceptedTenantDetails = landlordProfile.acceptedTenantDetails || [];
    
    console.log(`\nCurrent state:`);
    console.log(`  Accepted Tenants: ${acceptedTenants.length}`);
    console.log(`  Accepted Tenant Details: ${acceptedTenantDetails.length}`);

    // Check if tenant is in acceptedTenants but missing from acceptedTenantDetails
    const tenantInAccepted = acceptedTenants.includes(tenantUid);
    const tenantInDetails = acceptedTenantDetails.some(record => record.tenantId === tenantUid);
    
    console.log(`\n  Tenant in acceptedTenants: ${tenantInAccepted ? '✅' : '❌'}`);
    console.log(`  Tenant in acceptedTenantDetails: ${tenantInDetails ? '✅' : '❌'}`);

    if (tenantInDetails) {
      console.log('\n✅ Tenant already has details record - no fix needed!');
      return;
    }

    if (!tenantInAccepted) {
      console.log('\n❌ Tenant not in acceptedTenants array - this needs investigation');
      return;
    }

    // Find the invite for this tenant
    console.log('\n🔍 Looking for invite data...');
    const invitesSnapshot = await db.collection('invites')
      .where('tenantEmail', '==', 'tenant@propagenticai.com')
      .get();
    
    let inviteData = null;
    let inviteDoc = null;
    if (!invitesSnapshot.empty) {
      inviteDoc = invitesSnapshot.docs[0];
      inviteData = inviteDoc.data();
      console.log(`✅ Found invite: ${inviteDoc.id}`);
      console.log(`   Status: ${inviteData.status}`);
      console.log(`   Short Code: ${inviteData.shortCode || 'N/A'}`);
      console.log(`   Property ID: ${inviteData.propertyId}`);
    } else {
      console.log('⚠️  No invite found');
    }
    
    // Create the missing accepted tenant record
    const acceptedTenantRecord = {
      tenantId: tenantUid,
      propertyId: tenantData.propertyId || inviteData?.propertyId || '',
      inviteId: inviteDoc?.id || '',
      inviteCode: inviteData?.shortCode || '',
      tenantEmail: 'tenant@propagenticai.com',
      unitNumber: inviteData?.unitNumber || null,
      acceptedAt: admin.firestore.FieldValue.serverTimestamp(),
      inviteType: 'manual-fix' // Mark this as a manual fix
    };
    
    console.log('\n🔧 Creating missing accepted tenant record...');
    console.log(JSON.stringify(acceptedTenantRecord, null, 2));
    
    // Update the landlord profile
    await db.collection('landlordProfiles').doc(landlordUid).update({
      acceptedTenantDetails: admin.firestore.FieldValue.arrayUnion(acceptedTenantRecord),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('\n🎉 Successfully added missing tenant detail record!');
    console.log('The tenant should now appear in the landlord dashboard.');
    
  } catch (error) {
    console.error('❌ Error fixing missing tenant details:', error);
  }
}

fixMissingTenantDetails()
  .then(() => {
    console.log('\n✅ Fix complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }); 