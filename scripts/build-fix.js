#!/usr/bin/env node
/**
 * Build Fix Script
 * 
 * A utility script to fix common build issues by:
 * - Cleaning build artifacts
 * - Verifying dependencies
 * - Checking for common configuration errors
 * - Validating critical files
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration options
const DRY_RUN = process.argv.includes('--dry-run');
const VERBOSE = process.argv.includes('--verbose');
const FIX_ALL = process.argv.includes('--fix-all');

// Set to true to skip confirmations
const AUTO_CONFIRM = process.argv.includes('--yes') || FIX_ALL;

/**
 * Logger utility
 */
const logger = {
  info: (message) => console.log(`ℹ️ ${message}`),
  success: (message) => console.log(`✅ ${message}`),
  warning: (message) => console.log(`⚠️ ${message}`),
  error: (message) => console.log(`❌ ${message}`),
  debug: (message) => VERBOSE && console.log(`🔍 ${message}`)
};

/**
 * Executes a shell command
 * @param {string} command - Command to execute
 * @param {boolean} silent - Whether to hide output
 * @returns {string} - Command output
 */
function execCommand(command, silent = false) {
  logger.debug(`Executing: ${command}`);
  
  try {
    const output = execSync(command, { 
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    });
    return output.trim();
  } catch (error) {
    if (!silent) {
      logger.error(`Command failed: ${command}`);
      logger.error(error.message);
    }
    return error.message;
  }
}

/**
 * Ask for confirmation
 * @param {string} message - Confirmation message
 * @returns {boolean} - Whether confirmed
 */
function confirm(message) {
  if (AUTO_CONFIRM) {
    logger.info(`Auto-confirming: ${message}`);
    return true;
  }
  
  if (DRY_RUN) {
    logger.info(`Would ask for confirmation: ${message}`);
    return false;
  }
  
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    readline.question(`${message} (y/N): `, answer => {
      readline.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to file
 * @returns {boolean} - Whether file exists
 */
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Clean build artifacts
 */
async function cleanBuildArtifacts() {
  logger.info('Checking for build artifacts to clean...');
  
  const foldersToRemove = [
    'build',
    'dist',
    '.cache',
    '.parcel-cache',
    'node_modules/.cache'
  ];
  
  for (const folder of foldersToRemove) {
    const folderPath = path.join(process.cwd(), folder);
    
    if (fileExists(folderPath)) {
      logger.warning(`Found build artifact: ${folder}`);
      
      if (DRY_RUN) {
        logger.info(`Would remove: ${folder}`);
        continue;
      }
      
      const shouldRemove = await confirm(`Remove ${folder}?`);
      
      if (shouldRemove) {
        logger.info(`Removing ${folder}...`);
        try {
          fs.rmSync(folderPath, { recursive: true, force: true });
          logger.success(`Removed ${folder}`);
        } catch (error) {
          logger.error(`Failed to remove ${folder}: ${error.message}`);
        }
      }
    } else {
      logger.debug(`${folder} not found, skipping`);
    }
  }
}

/**
 * Clear npm cache
 */
async function clearNpmCache() {
  logger.info('Checking npm cache...');
  
  if (DRY_RUN) {
    logger.info('Would clear npm cache');
    return;
  }
  
  const shouldClear = await confirm('Clear npm cache?');
  
  if (shouldClear) {
    logger.info('Clearing npm cache...');
    execCommand('npm cache clean --force');
    logger.success('Npm cache cleared');
  }
}

/**
 * Check for duplicate dependencies
 */
function checkDuplicateDependencies() {
  logger.info('Checking for duplicate dependencies...');
  
  if (!fileExists(path.join(process.cwd(), 'package.json'))) {
    logger.error('package.json not found');
    return;
  }
  
  try {
    // Use npm ls to find duplicate dependencies
    const output = execCommand('npm ls --json --depth=0', true);
    const dependencies = JSON.parse(output);
    
    if (dependencies.problems) {
      logger.warning('Dependency issues found:');
      dependencies.problems.forEach(problem => {
        logger.warning(`- ${problem}`);
      });
      
      logger.info('These issues can cause build problems. Consider using the --fix-all flag to resolve them.');
    } else {
      logger.success('No duplicate dependencies found');
    }
  } catch (error) {
    logger.error(`Failed to check dependencies: ${error.message}`);
  }
}

/**
 * Verify build-critical files
 */
function verifyBuildCriticalFiles() {
  logger.info('Verifying build-critical files...');
  
  const criticalFiles = [
    'package.json',
    'package-lock.json',
    '.env',
    'public/index.html',
    'src/index.js',
    'firebase.json'
  ];
  
  let allFilesExist = true;
  
  for (const file of criticalFiles) {
    const filePath = path.join(process.cwd(), file);
    
    if (fileExists(filePath)) {
      logger.debug(`Found ${file}`);
    } else {
      logger.warning(`Missing critical file: ${file}`);
      allFilesExist = false;
    }
  }
  
  if (allFilesExist) {
    logger.success('All critical files verified');
  }
  
  // Check public folder for static assets
  const publicFolder = path.join(process.cwd(), 'public');
  if (fileExists(publicFolder)) {
    const files = fs.readdirSync(publicFolder);
    logger.debug(`Public folder contains ${files.length} files`);
    
    // Make sure it contains index.html and favicon
    const hasIndexHtml = files.includes('index.html');
    const hasFavicon = files.some(file => file.includes('favicon'));
    
    if (!hasIndexHtml) {
      logger.warning('Missing index.html in public folder');
    }
    
    if (!hasFavicon) {
      logger.warning('Missing favicon in public folder');
    }
  }
}

/**
 * Verify React and framer-motion compatibility
 */
function verifyReactCompatibility() {
  logger.info('Verifying React compatibility...');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  
  if (!fileExists(packageJsonPath)) {
    logger.error('package.json not found');
    return;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    // Extract version without ^ or ~
    const getVersionNumber = (version) => {
      if (!version) return null;
      return version.replace(/[\^~]/g, '');
    };
    
    const reactVersion = getVersionNumber(dependencies.react);
    const framerMotionVersion = getVersionNumber(dependencies['framer-motion']);
    
    if (reactVersion) {
      logger.info(`React version: ${reactVersion}`);
      
      if (reactVersion.startsWith('19')) {
        logger.info('React 19 detected');
        
        // Check for compatibility issues
        if (framerMotionVersion) {
          logger.info(`framer-motion version: ${framerMotionVersion}`);
          
          // Version compatibility check
          const majorFMVersion = parseInt(framerMotionVersion.split('.')[0]);
          if (majorFMVersion < 10) {
            logger.warning('framer-motion version may not be compatible with React 19');
            logger.info('Consider upgrading framer-motion to version 10 or higher');
          } else {
            logger.success('framer-motion version is compatible with React 19');
          }
        }
      }
    } else {
      logger.warning('React dependency not found in package.json');
    }
    
    // Check for resolutions field
    if (!packageJson.resolutions) {
      logger.warning('No resolutions field found in package.json');
      logger.info('Consider adding resolutions field to ensure consistent dependency versions');
    }
  } catch (error) {
    logger.error(`Failed to check React compatibility: ${error.message}`);
  }
}

/**
 * Fix .env file for Firebase configuration
 */
async function fixEnvFile() {
  logger.info('Checking .env file...');
  
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  // Create .env.local if it doesn't exist
  if (!fileExists(envLocalPath) && fileExists(envPath)) {
    logger.warning('.env.local file not found, but .env exists');
    
    if (DRY_RUN) {
      logger.info('Would create .env.local from .env');
      return;
    }
    
    const shouldCreate = await confirm('Create .env.local from .env?');
    
    if (shouldCreate) {
      try {
        fs.copyFileSync(envPath, envLocalPath);
        logger.success('Created .env.local from .env');
      } catch (error) {
        logger.error(`Failed to create .env.local: ${error.message}`);
      }
    }
  }
  
  // Check if .env.local contains REACT_APP_FIREBASE_ variables
  if (fileExists(envLocalPath)) {
    const envContent = fs.readFileSync(envLocalPath, 'utf8');
    const hasFirebaseConfig = envContent.includes('REACT_APP_FIREBASE_');
    
    if (!hasFirebaseConfig) {
      logger.warning('No Firebase configuration found in .env.local');
      logger.info('Firebase configuration is required for proper functionality');
    } else {
      logger.success('Firebase configuration found in .env.local');
    }
  }
}

/**
 * Fix Firebase hosting configuration
 */
async function fixFirebaseConfig() {
  logger.info('Checking Firebase configuration...');
  
  const firebaseJsonPath = path.join(process.cwd(), 'firebase.json');
  
  if (!fileExists(firebaseJsonPath)) {
    logger.warning('firebase.json not found');
    return;
  }
  
  try {
    const firebaseConfig = JSON.parse(fs.readFileSync(firebaseJsonPath, 'utf8'));
    
    if (!firebaseConfig.hosting) {
      logger.warning('No hosting configuration found in firebase.json');
      return;
    }
    
    // Check for SPA redirect
    const hasSpaRedirect = firebaseConfig.hosting.rewrites && 
      firebaseConfig.hosting.rewrites.some(rewrite => 
        rewrite.source === '**' && rewrite.destination === '/index.html');
    
    if (!hasSpaRedirect) {
      logger.warning('SPA redirect rule not found in firebase.json');
      
      if (DRY_RUN) {
        logger.info('Would add SPA redirect rule to firebase.json');
        return;
      }
      
      const shouldFix = await confirm('Add SPA redirect rule to firebase.json?');
      
      if (shouldFix) {
        if (!firebaseConfig.hosting.rewrites) {
          firebaseConfig.hosting.rewrites = [];
        }
        
        firebaseConfig.hosting.rewrites.push({
          source: '**',
          destination: '/index.html'
        });
        
        fs.writeFileSync(firebaseJsonPath, JSON.stringify(firebaseConfig, null, 2));
        logger.success('Added SPA redirect rule to firebase.json');
      }
    } else {
      logger.success('SPA redirect rule found in firebase.json');
    }
  } catch (error) {
    logger.error(`Failed to check Firebase configuration: ${error.message}`);
  }
}

/**
 * Run all fixes
 */
async function runAll() {
  logger.info('Starting build fix script...');
  
  if (DRY_RUN) {
    logger.info('Running in dry-run mode. No changes will be made.');
  }
  
  // Run all checks and fixes
  await cleanBuildArtifacts();
  await clearNpmCache();
  checkDuplicateDependencies();
  verifyBuildCriticalFiles();
  verifyReactCompatibility();
  await fixEnvFile();
  await fixFirebaseConfig();
  
  // Final verification
  if (!DRY_RUN && AUTO_CONFIRM) {
    logger.info('Running npm install to ensure dependencies are up to date...');
    execCommand('npm install');
    logger.success('Dependencies updated');
  }
  
  logger.success('Build fix script completed');
  
  if (DRY_RUN) {
    logger.info('Run without --dry-run to apply fixes');
  }
}

// Execute script
runAll().catch(error => {
  logger.error(`Unexpected error: ${error.message}`);
  process.exit(1);
}); 