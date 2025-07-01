/**
 * Script to fetch and display all current tenant accounts from PropAgentic
 * 
 * Usage: node scripts/getTenants.js
 * 
 * This script connects to Firestore and queries all users with role='tenant' or userType='tenant'
 * and displays them in a formatted table.
 */

const admin = require('firebase-admin');
const Table = require('cli-table3');

// Initialize Firebase Admin if not already initialized
if (!admin.apps.length) {
  // For local development, make sure you have GOOGLE_APPLICATION_CREDENTIALS set
  // or place your service account key in the project
  try {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      // You may need to add your project ID here
      // projectId: 'your-project-id'
    });
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin:', error.message);
    console.log('\n💡 Make sure you have:');
    console.log('1. GOOGLE_APPLICATION_CREDENTIALS environment variable set');
    console.log('2. Or a service account key file in your project');
    console.log('3. Firebase Admin SDK properly configured');
    process.exit(1);
  }
}

const db = admin.firestore();

/**
 * Get all tenant accounts from Firestore
 */
async function getAllTenants() {
  try {
    console.log('🔍 Searching for tenant accounts...\n');
    
    // Query users with role='tenant'
    const roleQuery = db.collection('users').where('role', '==', 'tenant');
    const roleSnapshot = await roleQuery.get();
    
    // Query users with userType='tenant'  
    const userTypeQuery = db.collection('users').where('userType', '==', 'tenant');
    const userTypeSnapshot = await userTypeQuery.get();
    
    const tenants = [];
    const addedUids = new Set(); // Prevent duplicates
    
    // Process both query results
    [roleSnapshot, userTypeSnapshot].forEach(snapshot => {
      snapshot.docs.forEach(doc => {
        const uid = doc.id;
        
        // Skip if we already added this user
        if (addedUids.has(uid)) return;
        addedUids.add(uid);
        
        const data = doc.data();
        const tenant = {
          uid: uid,
          email: data.email || 'No email',
          name: data.name,
          firstName: data.firstName,
          lastName: data.lastName,
          displayName: data.displayName,
          phone: data.phone,
          role: data.role || data.userType,
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate?.() || data.createdAt || null,
          lastLoginAt: data.lastLoginAt?.toDate?.() || data.lastLoginAt || null
        };
        
        tenants.push(tenant);
      });
    });
    
    // Sort by name/email
    tenants.sort((a, b) => {
      const nameA = getTenantDisplayName(a);
      const nameB = getTenantDisplayName(b);
      return nameA.localeCompare(nameB);
    });
    
    return tenants;
  } catch (error) {
    console.error('❌ Error fetching tenants:', error);
    throw error;
  }
}

/**
 * Get a formatted display name for a tenant
 */
function getTenantDisplayName(tenant) {
  if (tenant.name) return tenant.name;
  if (tenant.displayName) return tenant.displayName;
  if (tenant.firstName && tenant.lastName) return `${tenant.firstName} ${tenant.lastName}`;
  if (tenant.firstName) return tenant.firstName;
  return tenant.email;
}

/**
 * Format date for display
 */
function formatDate(date) {
  if (!date) return 'N/A';
  if (date instanceof Date) return date.toLocaleDateString();
  return 'N/A';
}

/**
 * Display tenants in a formatted table
 */
function displayTenants(tenants) {
  if (tenants.length === 0) {
    console.log('📭 No tenant accounts found in the system.\n');
    return;
  }
  
  console.log(`✅ Found ${tenants.length} tenant account${tenants.length !== 1 ? 's' : ''}:\n`);
  
  // Create table
  const table = new Table({
    head: ['Name', 'Email', 'Phone', 'Status', 'Role', 'Created', 'Last Login'],
    colWidths: [20, 30, 15, 10, 10, 12, 12],
    style: {
      head: ['cyan', 'bold']
    }
  });
  
  // Add tenant rows
  tenants.forEach(tenant => {
    table.push([
      getTenantDisplayName(tenant),
      tenant.email,
      tenant.phone || 'N/A',
      tenant.status,
      tenant.role,
      formatDate(tenant.createdAt),
      formatDate(tenant.lastLoginAt)
    ]);
  });
  
  console.log(table.toString());
  
  // Display summary stats
  console.log('\n📊 Summary Statistics:');
  console.log(`├─ Total Tenants: ${tenants.length}`);
  console.log(`├─ Active: ${tenants.filter(t => t.status === 'active' || !t.status).length}`);
  console.log(`├─ With Phone: ${tenants.filter(t => t.phone).length}`);
  console.log(`└─ With Names: ${tenants.filter(t => t.name || t.displayName || (t.firstName && t.lastName)).length}`);
  
  console.log('\n💡 To invite any of these tenants to a property, use the enhanced InviteTenantModal in the web app.');
}

/**
 * Main execution
 */
async function main() {
  console.log('🏠 PropAgentic Tenant Account Lookup\n');
  console.log('=' .repeat(50));
  
  try {
    const tenants = await getAllTenants();
    displayTenants(tenants);
    
    // Output raw data for debugging if needed
    if (process.argv.includes('--json')) {
      console.log('\n📄 Raw JSON data:');
      console.log(JSON.stringify(tenants, null, 2));
    }
    
  } catch (error) {
    console.error('❌ Script failed:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  main().then(() => {
    console.log('\n✅ Script completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });
}

module.exports = { getAllTenants, getTenantDisplayName, formatDate }; 