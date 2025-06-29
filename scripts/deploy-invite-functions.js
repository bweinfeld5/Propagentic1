#!/usr/bin/env node

/**
 * Deploy Invite-related Cloud Functions
 * Ensures the latest invite acceptance logic is deployed
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function deployInviteFunctions() {
  console.log('🚀 Deploying Invite-related Cloud Functions');
  console.log('==========================================\n');

  const functions = [
    'acceptTenantInvite',
    'acceptPropertyInvite',
    'rejectPropertyInvite'
  ];

  try {
    // First, build the functions
    console.log('1️⃣  Building TypeScript functions...');
    const { stdout: buildOutput } = await execAsync('cd functions && npm run build', { encoding: 'utf8' });
    console.log('✅ Functions built successfully\n');

    // Deploy each function
    for (const functionName of functions) {
      console.log(`2️⃣  Deploying ${functionName}...`);
      try {
        const { stdout } = await execAsync(`firebase deploy --only functions:${functionName}`, { encoding: 'utf8' });
        console.log(`✅ ${functionName} deployed successfully`);
      } catch (error) {
        console.error(`❌ Failed to deploy ${functionName}:`, error.message);
      }
    }

    console.log('\n🎉 Invite functions deployment complete!');
    console.log('\n📋 What was deployed:');
    console.log('• acceptTenantInvite - Handles 8-character code acceptance');
    console.log('• acceptPropertyInvite - Handles direct invite ID acceptance'); 
    console.log('• rejectPropertyInvite - Handles invite rejection');
    
    console.log('\n🔧 Next steps:');
    console.log('1. Test tenant invite acceptance flow');
    console.log('2. Run data integrity checker: npm run check:data-integrity');
    console.log('3. Monitor function logs for any errors');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    process.exit(1);
  }
}

deployInviteFunctions()
  .then(() => {
    console.log('\n✅ Deployment script completed!');
    process.exit(0);
  })
  .catch(error => {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }); 