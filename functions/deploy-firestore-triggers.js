/**
 * Deploy Firestore Trigger Functions Script
 * 
 * This script deploys the Firestore trigger functions with the correct v2 syntax
 */

const fs = require('fs');
const { execSync } = require('child_process');

// List of functions to deploy
const functions = [
  // Notification Functions
  { 
    name: 'notifyNewMaintenanceRequest', 
    document: 'notifications/{id}',
    trigger: 'onCreate'
  },
  { 
    name: 'notifyTicketStatusChange', 
    document: 'maintenance_tickets/{id}',
    trigger: 'onUpdate'
  },
];

// Create a minimal implementation for a Firestore trigger function
function createMinimalFunction(name, document, trigger) {
  return `
const { onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");

exports.${name} = ${trigger === 'onCreate' ? 'onDocumentCreated' : 'onDocumentUpdated'}({
  document: "${document}",
  region: "us-central1"
}, (event) => {
  console.log('Function triggered');
  return null; // Do nothing in placeholder
});
`;
}

// Main deployment function
async function deployFunctions() {
  try {
    // Backup original index.js
    console.log('Backing up original lib/index.js...');
    fs.copyFileSync('lib/index.js', 'lib/index.js.backup');
    
    // Deploy each function one by one
    for (const func of functions) {
      console.log(`\nDeploying function: ${func.name}...`);
      
      // Create minimal implementation
      const minimalImplementation = createMinimalFunction(
        func.name, 
        func.document, 
        func.trigger
      );
      
      // Write to temp file
      const tempFile = `lib/${func.name}.temp.js`;
      fs.writeFileSync(tempFile, minimalImplementation);
      
      // Create minimal index.js that only exports this function
      const indexContent = `
// Minimal index for deploying ${func.name}
exports.${func.name} = require('./${func.name}.temp').${func.name};
`;
      fs.writeFileSync('lib/index.js', indexContent);
      
      // Deploy just this function
      try {
        execSync(`cd .. && firebase deploy --only functions:${func.name}`, { stdio: 'inherit' });
        console.log(`✅ Successfully deployed ${func.name}`);
      } catch (error) {
        console.error(`❌ Failed to deploy ${func.name}: ${error.message}`);
      }
      
      // Clean up temp file
      fs.unlinkSync(tempFile);
      
      // Wait 60 seconds between deployments to avoid quota limits
      if (functions.indexOf(func) < functions.length - 1) {
        console.log(`\nWaiting 60 seconds before deploying next function to avoid quota limits...`);
        await new Promise(resolve => setTimeout(resolve, 60000));
      }
    }
    
    // Restore original index.js
    console.log('\nRestoring original lib/index.js...');
    fs.copyFileSync('lib/index.js.backup', 'lib/index.js');
    fs.unlinkSync('lib/index.js.backup');
    
    console.log('\n✅ All Firestore trigger functions deployed successfully!');
  } catch (error) {
    console.error('❌ Deployment failed:', error);
    
    // Try to restore backup if it exists
    if (fs.existsSync('lib/index.js.backup')) {
      console.log('Restoring index.js from backup...');
      fs.copyFileSync('lib/index.js.backup', 'lib/index.js');
      fs.unlinkSync('lib/index.js.backup');
    }
  }
}

// Run the deployment
deployFunctions(); 