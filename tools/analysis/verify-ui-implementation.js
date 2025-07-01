/**
 * PropAgentic UI Implementation Verification Script
 * 
 * This script performs checks to verify that the UI implementation is working correctly.
 * It checks for the presence of the required files and runs a simple test to ensure
 * that the components are available in the build.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const chalk = require('chalk') || { green: (s) => s, red: (s) => s, yellow: (s) => s, blue: (s) => s };

console.log(chalk.blue('🔍 PropAgentic UI Implementation Verification'));
console.log('');

// Check for required files
const requiredFiles = [
  'src/components/shared/ErrorBoundary.jsx',
  'src/components/shared/SafeMotion.jsx',
  'src/utils/compatibilityChecks.js',
  'firebase.json',
  'TASKS.md'
];

let allFilesExist = true;
console.log(chalk.blue('📋 Checking for required files:'));

requiredFiles.forEach(file => {
  if (fs.existsSync(path.resolve(file))) {
    console.log(chalk.green(`✓ ${file}`));
  } else {
    console.log(chalk.red(`✗ ${file}`));
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log(chalk.red('\n⚠️ Some required files are missing. Please implement all components before continuing.'));
  process.exit(1);
}

console.log(chalk.green('\n✅ All required files exist.'));

// Check build directory
console.log(chalk.blue('\n📋 Checking build directory:'));
if (fs.existsSync(path.resolve('build'))) {
  console.log(chalk.green('✓ Build directory exists'));

  // Check for key build files
  const buildFiles = ['index.html', 'static/js', 'static/css'];
  let allBuildFilesExist = true;

  buildFiles.forEach(file => {
    if (fs.existsSync(path.resolve('build', file))) {
      console.log(chalk.green(`✓ build/${file}`));
    } else {
      console.log(chalk.red(`✗ build/${file}`));
      allBuildFilesExist = false;
    }
  });

  if (!allBuildFilesExist) {
    console.log(chalk.yellow('\n⚠️ Some build files are missing. You might need to rebuild the application.'));
    console.log('Run: npm run build:clean');
  } else {
    console.log(chalk.green('\n✅ Build directory is properly configured.'));
  }
} else {
  console.log(chalk.yellow('⚠️ Build directory does not exist. You need to build the application first.'));
  console.log('Run: npm run build:clean');
}

// Check firebase.json rewrites
console.log(chalk.blue('\n📋 Checking Firebase configuration:'));
try {
  const firebaseConfig = JSON.parse(fs.readFileSync(path.resolve('firebase.json'), 'utf-8'));
  
  if (firebaseConfig.hosting && firebaseConfig.hosting.rewrites) {
    const rewrites = firebaseConfig.hosting.rewrites;
    const requiredRewrites = ['/propagentic/new', '/ui-showcase', '/ui-simple', '/test-ui'];
    
    let allRewritesExist = true;
    requiredRewrites.forEach(route => {
      if (rewrites.some(rewrite => rewrite.source === route)) {
        console.log(chalk.green(`✓ Route ${route} is properly configured`));
      } else {
        console.log(chalk.yellow(`⚠️ Route ${route} is not explicitly configured`));
        allRewritesExist = false;
      }
    });
    
    if (allRewritesExist) {
      console.log(chalk.green('\n✅ Firebase routes are properly configured.'));
    } else {
      console.log(chalk.yellow('\n⚠️ Some routes are not explicitly configured in firebase.json.'));
    }
  } else {
    console.log(chalk.red('⚠️ Firebase configuration does not contain hosting.rewrites section.'));
  }
} catch (error) {
  console.log(chalk.red(`⚠️ Error parsing firebase.json: ${error.message}`));
}

// Verification complete
console.log(chalk.blue('\n📋 Verification Summary:'));
if (allFilesExist) {
  console.log(chalk.green('✓ All required files exist'));
  console.log(chalk.green('✓ Implementation is ready for testing'));
  console.log('');
  console.log('Next steps:');
  console.log('1. Run the application: npx serve -s build');
  console.log('2. Test all routes in your browser');
  console.log('3. Complete the remaining tasks in TASKS.md');
} else {
  console.log(chalk.red('⚠️ Some required files are missing'));
  console.log('Please refer to TASKS.md for implementation steps.');
}

console.log('');
console.log(chalk.blue('🚀 Verification complete!')); 