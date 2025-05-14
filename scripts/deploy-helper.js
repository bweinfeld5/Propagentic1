#!/usr/bin/env node
/**
 * Deploy Helper Script
 * 
 * A utility script to:
 * - Verify build before deployment
 * - Check Firebase configuration
 * - Support multiple environments
 * - Handle deployment to Firebase hosting
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

// Configuration
const CONFIG = {
  environments: ['development', 'staging', 'production'],
  defaultEnv: 'development',
  buildDir: 'build',
  firebaseConfig: 'firebase.json',
  deploymentActions: ['hosting', 'functions', 'firestore', 'storage', 'database'],
  defaultActions: ['hosting']
};

// Command line arguments
const args = process.argv.slice(2);
const ENV = args.find(arg => CONFIG.environments.includes(arg)) || CONFIG.defaultEnv;
const DRY_RUN = args.includes('--dry-run');
const SKIP_BUILD = args.includes('--skip-build');
const VERBOSE = args.includes('--verbose');
const ACTIONS = args
  .filter(arg => CONFIG.deploymentActions.includes(arg))
  .length > 0
  ? args.filter(arg => CONFIG.deploymentActions.includes(arg))
  : CONFIG.defaultActions;

// Logging utility
const logger = {
  info: message => console.log(`ℹ️ ${message}`),
  success: message => console.log(`✅ ${message}`),
  warning: message => console.log(`⚠️ ${message}`),
  error: message => console.log(`❌ ${message}`),
  debug: message => VERBOSE && console.log(`🔍 ${message}`)
};

/**
 * Execute shell command
 * @param {string} command - Command to execute
 * @param {boolean} silent - Whether to suppress output
 * @returns {string} - Command output
 */
function execCommand(command, silent = false) {
  logger.debug(`Executing: ${command}`);
  
  try {
    const options = {
      encoding: 'utf-8',
      stdio: silent ? 'pipe' : 'inherit'
    };
    
    if (DRY_RUN && !command.startsWith('npm run build') && !command.includes('firebase use')) {
      logger.info(`[DRY RUN] Would execute: ${command}`);
      return '';
    }
    
    const output = execSync(command, options);
    return output ? output.trim() : '';
  } catch (error) {
    logger.error(`Command failed: ${command}`);
    if (!silent) logger.error(error.message);
    return null;
  }
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
 * Ask user for confirmation
 * @param {string} message - Message to display
 * @returns {Promise<boolean>} - User confirmed or not
 */
function confirm(message) {
  if (DRY_RUN) {
    logger.info(`[DRY RUN] Would ask: ${message}`);
    return Promise.resolve(true);
  }
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise(resolve => {
    rl.question(`${message} (y/N): `, answer => {
      rl.close();
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

/**
 * Set up Firebase environment
 * @returns {boolean} - Whether setup was successful
 */
async function setupFirebaseEnvironment() {
  logger.info(`Setting up Firebase environment: ${ENV}`);
  
  // Check if Firebase CLI is installed
  const firebaseVersion = execCommand('firebase --version', true);
  if (!firebaseVersion) {
    logger.error('Firebase CLI is not installed. Please run: npm install -g firebase-tools');
    return false;
  }
  logger.debug(`Firebase CLI version: ${firebaseVersion}`);
  
  // Check if user is logged in
  const firebaseUser = execCommand('firebase login:list', true);
  if (!firebaseUser || !firebaseUser.includes('User ID')) {
    logger.warning('You are not logged in to Firebase');
    const shouldLogin = await confirm('Would you like to login to Firebase now?');
    if (shouldLogin) {
      execCommand('firebase login');
    } else {
      logger.error('Firebase login is required for deployment');
      return false;
    }
  }
  
  // Check if .firebaserc exists
  const firebaseRcPath = path.join(process.cwd(), '.firebaserc');
  if (!fileExists(firebaseRcPath)) {
    logger.warning('.firebaserc not found');
    logger.error('Please run firebase init in your project directory first');
    return false;
  }
  
  // Set the Firebase project based on environment
  try {
    const firebaseRc = JSON.parse(fs.readFileSync(firebaseRcPath, 'utf8'));
    
    if (!firebaseRc.projects || !Object.keys(firebaseRc.projects).includes(ENV)) {
      logger.warning(`No project configured for environment: ${ENV}`);
      
      if (Object.keys(firebaseRc.projects || {}).length > 0) {
        logger.info(`Available environments: ${Object.keys(firebaseRc.projects).join(', ')}`);
        const availableEnv = Object.keys(firebaseRc.projects)[0];
        const useAvailable = await confirm(`Use ${availableEnv} instead?`);
        
        if (useAvailable) {
          logger.info(`Using environment: ${availableEnv} instead`);
          return execCommand(`firebase use ${availableEnv}`, true) !== null;
        }
      }
      
      logger.error(`Please configure a project for environment: ${ENV} in .firebaserc`);
      return false;
    }
    
    // Use the specified environment
    return execCommand(`firebase use ${ENV}`, true) !== null;
  } catch (error) {
    logger.error(`Error reading .firebaserc: ${error.message}`);
    return false;
  }
}

/**
 * Verify build directory is ready for deployment
 * @returns {boolean} - Whether build is ready
 */
function verifyBuild() {
  logger.info('Verifying build directory...');
  
  const buildPath = path.join(process.cwd(), CONFIG.buildDir);
  
  if (!fileExists(buildPath)) {
    logger.error(`Build directory not found: ${CONFIG.buildDir}`);
    return false;
  }
  
  // Check if index.html exists in build directory
  const indexPath = path.join(buildPath, 'index.html');
  if (!fileExists(indexPath)) {
    logger.error('index.html not found in build directory');
    return false;
  }
  
  // Check build directory size
  try {
    const files = fs.readdirSync(buildPath);
    logger.debug(`Build directory contains ${files.length} files/directories`);
    
    if (files.length < 3) {
      logger.warning('Build directory seems unusually small');
      return false;
    }
    
    // Check for important assets directories
    const hasStaticDir = files.includes('static');
    if (!hasStaticDir) {
      logger.warning('No static directory found in build');
    }
    
    logger.success('Build directory verified');
    return true;
  } catch (error) {
    logger.error(`Error checking build directory: ${error.message}`);
    return false;
  }
}

/**
 * Run build process if needed
 * @returns {boolean} - Whether build was successful
 */
async function runBuild() {
  if (SKIP_BUILD) {
    logger.info('Skipping build step...');
    return true;
  }
  
  logger.info('Running build process...');
  
  // Check if build script exists in package.json
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  if (!fileExists(packageJsonPath)) {
    logger.error('package.json not found');
    return false;
  }
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts || !packageJson.scripts.build) {
      logger.error('No build script found in package.json');
      return false;
    }
    
    // Ask for confirmation before building
    const shouldBuild = await confirm('Run build script now?');
    if (!shouldBuild) {
      logger.warning('Build process skipped');
      return false;
    }
    
    // Set environment variables based on deployment environment
    const envPrefix = ENV === 'production' ? 'PROD' : ENV === 'staging' ? 'STAGING' : 'DEV';
    const buildCommand = `cross-env REACT_APP_ENV=${ENV} REACT_APP_${envPrefix}_BUILD=true npm run build`;
    
    logger.info(`Building for environment: ${ENV}`);
    const buildResult = execCommand(buildCommand);
    
    if (buildResult === null) {
      logger.error('Build process failed');
      return false;
    }
    
    return verifyBuild();
  } catch (error) {
    logger.error(`Error parsing package.json: ${error.message}`);
    return false;
  }
}

/**
 * Check firebase.json configuration
 * @returns {boolean} - Whether configuration is valid
 */
async function checkFirebaseConfig() {
  logger.info('Checking Firebase configuration...');
  
  const firebaseConfigPath = path.join(process.cwd(), CONFIG.firebaseConfig);
  
  if (!fileExists(firebaseConfigPath)) {
    logger.error(`Firebase configuration not found: ${CONFIG.firebaseConfig}`);
    return false;
  }
  
  try {
    const config = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
    
    // Check hosting configuration
    if (ACTIONS.includes('hosting') && (!config.hosting || !config.hosting.public)) {
      logger.warning('Invalid hosting configuration in firebase.json');
      
      // Check if public directory is configured correctly
      if (config.hosting && config.hosting.public !== CONFIG.buildDir) {
        logger.warning(`Hosting public directory (${config.hosting.public}) does not match build directory (${CONFIG.buildDir})`);
        
        const shouldFix = await confirm('Update hosting public directory?');
        if (shouldFix && !DRY_RUN) {
          config.hosting.public = CONFIG.buildDir;
          fs.writeFileSync(firebaseConfigPath, JSON.stringify(config, null, 2));
          logger.success('Updated hosting public directory in firebase.json');
        }
      }
      
      // Check for SPA redirect
      if (config.hosting && (!config.hosting.rewrites || !config.hosting.rewrites.some(r => r.source === '**'))) {
        logger.warning('No SPA redirect rule found in firebase.json');
        
        const shouldFix = await confirm('Add SPA redirect rule?');
        if (shouldFix && !DRY_RUN) {
          if (!config.hosting.rewrites) config.hosting.rewrites = [];
          config.hosting.rewrites.push({
            source: '**',
            destination: '/index.html'
          });
          fs.writeFileSync(firebaseConfigPath, JSON.stringify(config, null, 2));
          logger.success('Added SPA redirect rule to firebase.json');
        }
      }
    }
    
    // Check functions configuration if deploying functions
    if (ACTIONS.includes('functions') && !config.functions) {
      logger.warning('No functions configuration in firebase.json but deploying functions');
    }
    
    logger.success('Firebase configuration checked');
    return true;
  } catch (error) {
    logger.error(`Error checking Firebase configuration: ${error.message}`);
    return false;
  }
}

/**
 * Create SPA redirect file if needed
 * @returns {boolean} - Whether operation was successful
 */
async function createSpaRedirect() {
  if (!ACTIONS.includes('hosting')) {
    return true;
  }
  
  logger.info('Checking SPA redirect file...');
  
  const buildPath = path.join(process.cwd(), CONFIG.buildDir);
  const redirectHtmlPath = path.join(buildPath, '404.html');
  
  if (fileExists(redirectHtmlPath)) {
    logger.debug('404.html file already exists');
    return true;
  }
  
  const shouldCreate = await confirm('Create 404.html file for SPA routing?');
  if (!shouldCreate) {
    return true;
  }
  
  if (DRY_RUN) {
    logger.info('[DRY RUN] Would create 404.html file');
    return true;
  }
  
  try {
    // Create a simple 404.html file that redirects to index.html with the original URL
    const redirectHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>Propagentic - Redirecting</title>
    <script type="text/javascript">
      // Single Page Apps for GitHub Pages or Firebase Hosting
      // MIT License
      // https://github.com/rafgraph/spa-github-pages
      var segmentCount = 0;
      var l = window.location;
      l.replace(
        l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
        l.pathname.split('/').slice(0, 1 + segmentCount).join('/') + '/?p=/' +
        l.pathname.slice(1).split('/').slice(segmentCount).join('/').replace(/&/g, '~and~') +
        (l.search ? '&q=' + l.search.slice(1).replace(/&/g, '~and~') : '') +
        l.hash
      );
    </script>
  </head>
  <body>
    Redirecting...
  </body>
</html>`;
    
    // Update index.html to handle the redirects
    const indexHtmlPath = path.join(buildPath, 'index.html');
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
    
    // Only add the redirect script if it doesn't already exist
    if (!indexHtml.includes('window.location.search.includes("?p=")')) {
      const redirectScript = `
    <!-- SPA Redirect Handling -->
    <script type="text/javascript">
      // Handle SPA routing for 404 redirects
      (function(l) {
        if (l.search[1] === '/' ) {
          var decoded = l.search.slice(1).split('&').map(function(s) { 
            return s.replace(/~and~/g, '&')
          }).join('?');
          window.history.replaceState(null, null,
              l.pathname.slice(0, -1) + decoded + l.hash
          );
        }
      }(window.location))
    </script>`;
      
      // Insert the script right before the closing head tag
      indexHtml = indexHtml.replace('</head>', redirectScript + '\n  </head>');
      
      // Write the updated index.html
      fs.writeFileSync(indexHtmlPath, indexHtml);
      logger.success('Updated index.html with SPA redirect handling');
    }
    
    // Write the 404.html file
    fs.writeFileSync(redirectHtmlPath, redirectHtml);
    logger.success('Created 404.html file for SPA routing');
    
    return true;
  } catch (error) {
    logger.error(`Error creating SPA redirect: ${error.message}`);
    return false;
  }
}

/**
 * Deploy to Firebase
 * @returns {boolean} - Whether deployment was successful
 */
async function deploy() {
  logger.info(`Deploying to Firebase environment: ${ENV}`);
  
  if (ACTIONS.length === 0) {
    logger.error('No deployment actions specified');
    return false;
  }
  
  logger.info(`Deployment actions: ${ACTIONS.join(', ')}`);
  
  const shouldDeploy = await confirm(`Deploy to ${ENV} environment?`);
  if (!shouldDeploy) {
    logger.warning('Deployment cancelled');
    return false;
  }
  
  if (DRY_RUN) {
    logger.info('[DRY RUN] Would deploy to Firebase');
    return true;
  }
  
  // Build the deploy command
  const deployCommand = `firebase deploy --only ${ACTIONS.join(',')}`;
  logger.info(`Executing: ${deployCommand}`);
  
  const deployResult = execCommand(deployCommand);
  if (deployResult === null) {
    logger.error('Deployment failed');
    return false;
  }
  
  logger.success(`Successfully deployed to ${ENV} environment`);
  return true;
}

/**
 * Main function
 */
async function main() {
  logger.info(`=== Firebase Deploy Helper ===`);
  logger.info(`Environment: ${ENV}`);
  logger.info(`Actions: ${ACTIONS.join(', ')}`);
  
  if (DRY_RUN) {
    logger.info('DRY RUN MODE: No changes will be made');
  }
  
  if (SKIP_BUILD) {
    logger.info('Build step will be skipped');
  }
  
  // Step 1: Set up Firebase environment
  const setupSuccess = await setupFirebaseEnvironment();
  if (!setupSuccess) {
    logger.error('Failed to set up Firebase environment');
    process.exit(1);
  }
  
  // Step 2: Check Firebase configuration
  const configSuccess = await checkFirebaseConfig();
  if (!configSuccess) {
    logger.error('Failed to validate Firebase configuration');
    process.exit(1);
  }
  
  // Step 3: Run build process
  const buildSuccess = await runBuild();
  if (!buildSuccess) {
    logger.error('Build process failed');
    process.exit(1);
  }
  
  // Step 4: Create SPA redirect file if needed
  const redirectSuccess = await createSpaRedirect();
  if (!redirectSuccess) {
    logger.warning('Failed to create SPA redirect files');
    const shouldContinue = await confirm('Continue with deployment anyway?');
    if (!shouldContinue) {
      process.exit(1);
    }
  }
  
  // Step 5: Deploy to Firebase
  const deploySuccess = await deploy();
  if (!deploySuccess) {
    logger.error('Deployment failed');
    process.exit(1);
  }
  
  logger.success('Deployment process completed successfully');
}

// Run the main function
main().catch(error => {
  logger.error(`Unexpected error: ${error.message}`);
  process.exit(1);
}); 