const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');
const fs = require('fs');

// Initialize admin SDK
// You'll need to download your service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate New Private Key
// Save it as 'service-account-key.json' in the project root
let admin;

try {
  const serviceAccount = require('../service-account-key.json');
  
  admin = initializeApp({
    credential: cert(serviceAccount),
    databaseURL: "https://propagentic-default-rtdb.firebaseio.com"
  });
  
  console.log('✅ Firebase Admin initialized');
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin');
  console.error('Please ensure you have downloaded the service account key from Firebase Console');
  console.error('Save it as "service-account-key.json" in the project root');
  process.exit(1);
}

const auth = getAuth();
const db = getFirestore();

// Test email patterns
const testEmailPatterns = [
  /test@/i,
  /demo@/i,
  /sample@/i,
  /example@/i,
  /@test\./i,
  /bweinfeld15@gmail\.com/, // Your specific test email
  /fake@/i,
  /temp@/i
];

async function auditUsers() {
  console.log('🔍 Starting user audit...\n');
  
  const auditResults = {
    timestamp: new Date().toISOString(),
    authUsers: [],
    firestoreUsers: [],
    summary: {
      totalAuthUsers: 0,
      verifiedUsers: 0,
      unverifiedUsers: 0,
      testAccounts: 0,
      recommendedForDeletion: 0
    }
  };

  try {
    // 1. Fetch all users from Firebase Auth
    console.log('📊 Fetching users from Firebase Auth...');
    let nextPageToken;
    
    do {
      const listUsersResult = await auth.listUsers(1000, nextPageToken);
      
      listUsersResult.users.forEach(userRecord => {
        const isTestAccount = testEmailPatterns.some(pattern => 
          pattern.test(userRecord.email || '')
        );
        
        const userInfo = {
          uid: userRecord.uid,
          email: userRecord.email,
          emailVerified: userRecord.emailVerified,
          displayName: userRecord.displayName,
          createdAt: userRecord.metadata.creationTime,
          lastSignInTime: userRecord.metadata.lastSignInTime,
          disabled: userRecord.disabled,
          isTestAccount,
          recommendDelete: isTestAccount || !userRecord.emailVerified
        };
        
        auditResults.authUsers.push(userInfo);
        
        // Update summary
        auditResults.summary.totalAuthUsers++;
        if (userRecord.emailVerified) {
          auditResults.summary.verifiedUsers++;
        } else {
          auditResults.summary.unverifiedUsers++;
        }
        if (isTestAccount) {
          auditResults.summary.testAccounts++;
        }
        if (userInfo.recommendDelete) {
          auditResults.summary.recommendedForDeletion++;
        }
      });
      
      nextPageToken = listUsersResult.pageToken;
    } while (nextPageToken);
    
    console.log(`✅ Found ${auditResults.summary.totalAuthUsers} users in Firebase Auth\n`);
    
    // 2. Fetch users from Firestore
    console.log('📊 Fetching users from Firestore...');
    const usersSnapshot = await db.collection('users').get();
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      const authUser = auditResults.authUsers.find(u => u.uid === doc.id);
      
      auditResults.firestoreUsers.push({
        uid: doc.id,
        ...userData,
        hasAuthAccount: !!authUser,
        authEmailVerified: authUser?.emailVerified || false
      });
    });
    
    console.log(`✅ Found ${auditResults.firestoreUsers.length} users in Firestore\n`);
    
    // 3. Generate report
    console.log('📝 Generating audit report...\n');
    
    // Save full audit results
    fs.writeFileSync(
      'user-audit-full.json',
      JSON.stringify(auditResults, null, 2)
    );
    
    // Generate summary report
    const summaryReport = generateSummaryReport(auditResults);
    fs.writeFileSync('user-audit-summary.txt', summaryReport);
    
    // Generate deletion script data
    const deletionList = auditResults.authUsers
      .filter(u => u.recommendDelete)
      .map(u => ({
        uid: u.uid,
        email: u.email,
        reason: u.isTestAccount ? 'Test Account' : 'Unverified Email'
      }));
    
    fs.writeFileSync(
      'users-to-delete.json',
      JSON.stringify(deletionList, null, 2)
    );
    
    console.log('✅ Audit complete!');
    console.log('📁 Generated files:');
    console.log('   - user-audit-full.json (complete audit data)');
    console.log('   - user-audit-summary.txt (human-readable summary)');
    console.log('   - users-to-delete.json (list of users to delete)');
    
  } catch (error) {
    console.error('❌ Error during audit:', error);
    auditResults.error = error.message;
  }
  
  return auditResults;
}

function generateSummaryReport(auditResults) {
  const { summary, authUsers } = auditResults;
  
  let report = `
USER AUDIT SUMMARY REPORT
========================
Generated: ${auditResults.timestamp}

OVERVIEW
--------
Total Firebase Auth Users: ${summary.totalAuthUsers}
Verified Users: ${summary.verifiedUsers} (${((summary.verifiedUsers / summary.totalAuthUsers) * 100).toFixed(1)}%)
Unverified Users: ${summary.unverifiedUsers} (${((summary.unverifiedUsers / summary.totalAuthUsers) * 100).toFixed(1)}%)
Test Accounts: ${summary.testAccounts}
Recommended for Deletion: ${summary.recommendedForDeletion}

USERS BY STATUS
--------------
`;

  // Group users by status
  const verified = authUsers.filter(u => u.emailVerified && !u.isTestAccount);
  const unverified = authUsers.filter(u => !u.emailVerified && !u.isTestAccount);
  const testAccounts = authUsers.filter(u => u.isTestAccount);
  
  report += `\nVERIFIED USERS (${verified.length}):\n`;
  verified.forEach(u => {
    report += `  - ${u.email} (Created: ${u.createdAt})\n`;
  });
  
  report += `\nUNVERIFIED USERS (${unverified.length}):\n`;
  unverified.forEach(u => {
    report += `  - ${u.email} (Created: ${u.createdAt})\n`;
  });
  
  report += `\nTEST ACCOUNTS (${testAccounts.length}):\n`;
  testAccounts.forEach(u => {
    report += `  - ${u.email} (Verified: ${u.emailVerified ? 'Yes' : 'No'})\n`;
  });
  
  report += `\nRECOMMENDATIONS
---------------
1. Delete ${summary.recommendedForDeletion} accounts (test accounts + unverified)
2. Send verification reminders to ${unverified.length} unverified users
3. Implement email verification requirement for new registrations
4. Update security rules to require verified emails

`;
  
  return report;
}

// Run the audit
auditUsers().then(() => {
  console.log('\n✨ Audit process completed');
  process.exit(0);
}).catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
}); 