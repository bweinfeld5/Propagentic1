/**
 * Function Reconciliation Script
 * 
 * This script helps reconcile deployed Firebase functions with local functions.
 * It provides options to:
 * 1. List deployed functions
 * 2. Create minimal local versions of deployed functions
 * 3. Deploy functions from existing code
 * 4. Delete specific deployed functions
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Create readline interface for user interaction
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to execute shell commands and return the output
function execCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${error.message}`);
        console.error(stderr);
        reject(error);
        return;
      }
      resolve(stdout);
    });
  });
}

// Get a list of deployed functions
async function listDeployedFunctions() {
  try {
    console.log('Fetching deployed functions...');
    const result = await execCommand('firebase functions:list');
    
    // Extract function names and regions
    const functionLines = result.split('\n').filter(line => 
      line.trim() && !line.includes('┌') && !line.includes('┬') && 
      !line.includes('└') && !line.includes('│') && !line.includes('Function')
    );
    
    const functions = functionLines.map(line => {
      const parts = line.trim().split(/\s+/);
      return {
        name: parts[0],
        region: parts[1].replace('(', '').replace(')', '')
      };
    });
    
    console.log('\nCurrently deployed functions:');
    functions.forEach((func, index) => {
      console.log(`${index + 1}. ${func.name}(${func.region})`);
    });
    
    return functions;
  } catch (error) {
    console.error('Failed to list functions:', error);
    return [];
  }
}

// Create a minimal implementation of a function
function createMinimalFunction(name, type = 'callable') {
  let implementation = '';
  
  switch (type) {
    case 'callable':
      implementation = `
/**
 * ${name} function 
 */
exports.${name} = require('firebase-functions/v2/https').onCall({
  region: 'us-central1',
  maxInstances: 10
}, async (data, context) => {
  // Authentication check
  if (!context.auth) {
    throw new Error('Authentication required');
  }
  
  console.log('${name} called by:', context.auth.uid);
  return { 
    success: true, 
    message: 'Function executed successfully',
    timestamp: Date.now()
  };
});
`;
      break;
    
    case 'firestore-create':
      implementation = `
/**
 * ${name} function - triggered on document creation
 */
exports.${name} = require('firebase-functions/v2/firestore').onDocumentCreated({
  document: 'items/{id}',
  region: 'us-central1'
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.error('No data associated with the event');
    return;
  }
  
  console.log('${name} triggered for document:', event.params.id);
  return null;
});
`;
      break;
    
    case 'firestore-update':
      implementation = `
/**
 * ${name} function - triggered on document update
 */
exports.${name} = require('firebase-functions/v2/firestore').onDocumentUpdated({
  document: 'items/{id}',
  region: 'us-central1'
}, async (event) => {
  const snapshot = event.data;
  if (!snapshot) {
    console.error('No data associated with the event');
    return;
  }
  
  console.log('${name} triggered for document:', event.params.id);
  return null;
});
`;
      break;
    
    case 'scheduled':
      implementation = `
/**
 * ${name} function - scheduled to run periodically
 */
exports.${name} = require('firebase-functions/v2/scheduler').onSchedule({
  schedule: 'every 24 hours',
  region: 'us-central1'
}, async (event) => {
  console.log('${name} scheduled function triggered');
  return null;
});
`;
      break;
    
    default:
      implementation = `
/**
 * ${name} function
 */
exports.${name} = require('firebase-functions/v2/https').onCall({
  region: 'us-central1'
}, (data, context) => {
  return { message: 'Function executed', timestamp: Date.now() };
});
`;
  }
  
  return implementation;
}

// Prompt the user for input with a list of options
function promptChoice(message, choices) {
  return new Promise(resolve => {
    console.log(message);
    choices.forEach((choice, index) => {
      console.log(`${index + 1}. ${choice}`);
    });
    
    rl.question('Enter your choice (number): ', answer => {
      const choice = parseInt(answer);
      if (choice >= 1 && choice <= choices.length) {
        resolve(choice);
      } else {
        console.log('Invalid choice, please try again.');
        resolve(promptChoice(message, choices));
      }
    });
  });
}

// Main menu
async function mainMenu() {
  try {
    const options = [
      'List deployed functions',
      'Create minimal implementations for deployed functions',
      'Deploy a specific function',
      'Delete a deployed function',
      'Exit'
    ];
    
    const choice = await promptChoice('\nFunction Reconciliation Menu:', options);
    
    switch (choice) {
      case 1: // List deployed functions
        await listDeployedFunctions();
        return mainMenu();
      
      case 2: // Create minimal implementations
        await createMinimalImplementations();
        return mainMenu();
      
      case 3: // Deploy a specific function
        await deploySpecificFunction();
        return mainMenu();
      
      case 4: // Delete a deployed function
        await deleteDeployedFunction();
        return mainMenu();
      
      case 5: // Exit
        console.log('Exiting...');
        rl.close();
        return;
      
      default:
        return mainMenu();
    }
  } catch (error) {
    console.error('Error in main menu:', error);
    return mainMenu();
  }
}

// Create minimal implementations for deployed functions
async function createMinimalImplementations() {
  try {
    const deployedFunctions = await listDeployedFunctions();
    
    if (deployedFunctions.length === 0) {
      console.log('No deployed functions found.');
      return;
    }
    
    // Prompt for function types
    const functionTypes = {};
    for (const func of deployedFunctions) {
      const typeOptions = ['callable', 'firestore-create', 'firestore-update', 'scheduled'];
      console.log(`\nSelect type for ${func.name}:`);
      const typeChoice = await promptChoice('Function type:', typeOptions);
      functionTypes[func.name] = typeOptions[typeChoice - 1];
    }
    
    // Create directory for individual function files
    const functionsDir = path.join(__dirname, 'individual-functions');
    if (!fs.existsSync(functionsDir)) {
      fs.mkdirSync(functionsDir);
    }
    
    // Create individual function files
    for (const func of deployedFunctions) {
      const implementation = createMinimalFunction(func.name, functionTypes[func.name]);
      const filePath = path.join(functionsDir, `${func.name}.js`);
      fs.writeFileSync(filePath, implementation);
      console.log(`Created implementation for ${func.name} at ${filePath}`);
    }
    
    // Create main index.js that imports all functions
    let indexContent = `/**
 * Generated index.js with all functions
 * Created by reconcile-functions.js script
 */

// Initialize Firebase Admin SDK
const admin = require('firebase-admin');
if (!admin.apps.length) {
  admin.initializeApp();
}

console.log('Loading all functions...');\n\n`;
    
    // Add function exports
    for (const func of deployedFunctions) {
      indexContent += `// Export ${func.name} function
const ${func.name}Func = require('./individual-functions/${func.name}');
Object.assign(exports, ${func.name}Func);\n\n`;
    }
    
    indexContent += `console.log('All functions loaded successfully.');`;
    
    const indexPath = path.join(__dirname, 'index.js');
    fs.writeFileSync(indexPath, indexContent);
    console.log(`\nCreated main index.js at ${indexPath}`);
    
    console.log('\nFunction implementations created successfully!');
    console.log('To deploy, run: firebase deploy --only functions');
  } catch (error) {
    console.error('Error creating implementations:', error);
  }
}

// Deploy a specific function
async function deploySpecificFunction() {
  try {
    const deployedFunctions = await listDeployedFunctions();
    
    if (deployedFunctions.length === 0) {
      console.log('No deployed functions found.');
      return;
    }
    
    const functionOptions = deployedFunctions.map(func => `${func.name}(${func.region})`);
    functionOptions.push('Deploy all');
    
    const choice = await promptChoice('\nSelect function to deploy:', functionOptions);
    
    if (choice === functionOptions.length) {
      // Deploy all functions
      console.log('Deploying all functions...');
      await execCommand('firebase deploy --only functions');
    } else {
      // Deploy specific function
      const selectedFunc = deployedFunctions[choice - 1];
      console.log(`Deploying function ${selectedFunc.name}...`);
      await execCommand(`firebase deploy --only functions:${selectedFunc.name}`);
    }
    
    console.log('Deployment completed!');
  } catch (error) {
    console.error('Error deploying function:', error);
  }
}

// Delete a deployed function
async function deleteDeployedFunction() {
  try {
    const deployedFunctions = await listDeployedFunctions();
    
    if (deployedFunctions.length === 0) {
      console.log('No deployed functions found.');
      return;
    }
    
    const functionOptions = deployedFunctions.map(func => `${func.name}(${func.region})`);
    
    const choice = await promptChoice('\nSelect function to delete:', functionOptions);
    const selectedFunc = deployedFunctions[choice - 1];
    
    // Confirm deletion
    rl.question(`Are you sure you want to delete ${selectedFunc.name}? (y/n): `, async answer => {
      if (answer.toLowerCase() === 'y') {
        console.log(`Deleting function ${selectedFunc.name}...`);
        await execCommand(`firebase functions:delete ${selectedFunc.name} --region=${selectedFunc.region} --force`);
        console.log('Function deleted!');
      } else {
        console.log('Deletion cancelled.');
      }
    });
  } catch (error) {
    console.error('Error deleting function:', error);
  }
}

// Start the script
console.log('Firebase Functions Reconciliation Tool');
mainMenu(); 