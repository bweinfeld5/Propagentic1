/**
 * Firebase Deployment Helper Script
 * 
 * This script helps with the deployment process by:
 * 1. Verifying the build was successful
 * 2. Handling common errors and providing solutions
 * 3. Running deployment commands in the correct sequence
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Check if build directory exists
const buildDir = path.join(process.cwd(), 'build');
const hasBuildDir = fs.existsSync(buildDir);

// Check if Firebase config exists
const firebaseConfig = path.join(process.cwd(), 'firebase.json');
const hasFirebaseConfig = fs.existsSync(firebaseConfig);

console.log('\n🚀 PropAgentic Deployment Helper\n');

// Validate Firebase configuration
if (!hasFirebaseConfig) {
  console.error('❌ Firebase configuration not found!');
  console.log('Please ensure you have a firebase.json file in the project root.');
  console.log('Run the following command to initialize Firebase:');
  console.log('  firebase init');
  process.exit(1);
}

// Perform the build if directory doesn't exist or --force flag provided
const shouldRebuild = !hasBuildDir || process.argv.includes('--force');

if (shouldRebuild) {
  console.log('📦 Building application...');
  
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('✅ Build successful!');
  } catch (error) {
    console.error('❌ Build failed!');
    console.error('Error:', error.message);
    
    // Check for common build errors
    if (error.message.includes('framer-motion') && error.message.includes('useId')) {
      console.log('\nThis error is likely due to React/Framer-Motion version incompatibility.');
      console.log('Fix: Use a version of framer-motion compatible with React 17:');
      console.log('  npm install framer-motion@6.5.1 --legacy-peer-deps');
    }
    
    process.exit(1);
  }
} else {
  console.log('📦 Using existing build directory.');
  console.log('   Use --force flag to rebuild');
}

// Deploy to Firebase
console.log('\n🔥 Deploying to Firebase...');

try {
  execSync('firebase deploy --only hosting', { stdio: 'inherit' });
  console.log('✅ Deployment successful!');
} catch (error) {
  console.error('❌ Deployment failed!');
  console.error('Error:', error.message);
  
  // Check for common deployment errors
  if (error.message.includes('not logged in')) {
    console.log('\nYou need to login to Firebase:');
    console.log('  firebase login');
  }
  
  if (error.message.includes('cannot find project')) {
    console.log('\nFirebase project is not configured correctly.');
    console.log('Run firebase use to select a project:');
    console.log('  firebase use <project-id>');
  }
  
  process.exit(1);
}

console.log('\n🎉 Process completed successfully!');
console.log('Visit your deployed site at: http://localhost:3000/propagentic/new#'); 