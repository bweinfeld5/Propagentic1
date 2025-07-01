#!/usr/bin/env node
/**
 * Comprehensive Dependency Fix Script for PropAgentic
 * 
 * This script fixes common dependency issues with the PropAgentic application:
 * 1. React version conflicts
 * 2. React Router compatibility issues
 * 3. Framer Motion compatibility issues
 * 4. React types compatibility
 * 5. TypeScript compatibility warnings
 * 
 * Run with one of these commands:
 * - node scripts/fix-dependencies.js
 * - npm run fix-deps
 * 
 * Options:
 * --force - Skip all confirmations
 * --debug - Show verbose logging
 * --skip-clean - Skip the cleaning step
 */

const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Command line arguments
const args = process.argv.slice(2);
const FORCE = args.includes('--force');
const DEBUG = args.includes('--debug');
const SKIP_CLEAN = args.includes('--skip-clean');

// Configuration
const COMPATIBLE_VERSIONS = {
  react: '18.2.0',
  reactDom: '18.2.0',
  reactRouterDom: '6.3.0',
  framerMotion: '6.5.1',
  typesReact: '18.0.28',
  typesReactDom: '18.0.11'
};

// ----- Helper Functions -----

// Create a readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Log with colors and formatting
function log(message, type = 'info') {
  const timestamp = new Date().toISOString().slice(11, 19);
  const prefix = `[${timestamp}]`;
  
  switch (type) {
    case 'info':
      console.log(`${colors.blue}${prefix} INFO${colors.reset} ${message}`);
      break;
    case 'success':
      console.log(`${colors.green}${prefix} SUCCESS${colors.reset} ${message}`);
      break;
    case 'warning':
      console.log(`${colors.yellow}${prefix} WARNING${colors.reset} ${message}`);
      break;
    case 'error':
      console.error(`${colors.red}${prefix} ERROR${colors.reset} ${message}`);
      break;
    case 'debug':
      if (DEBUG) {
        console.log(`${colors.dim}${prefix} DEBUG${colors.reset} ${message}`);
      }
      break;
    case 'header':
      console.log(`\n${colors.bold}${colors.magenta}${message}${colors.reset}\n`);
      break;
  }
}

// Execute a command and return output
function execCommand(command, options = {}) {
  try {
    log(`Executing: ${command}`, 'debug');
    return execSync(command, { 
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    });
  } catch (error) {
    log(`Command failed: ${command}`, 'error');
    if (error.stdout) log(`Stdout: ${error.stdout}`, 'debug');
    if (error.stderr) log(`Stderr: ${error.stderr}`, 'debug');
    throw error;
  }
}

// Prompt user for confirmation
function promptYesNo(question) {
  return new Promise((resolve) => {
    if (FORCE) {
      log(`Auto-confirming: ${question}`, 'debug');
      resolve(true);
      return;
    }
    
    rl.question(`${colors.yellow}${question} (y/N)${colors.reset} `, (answer) => {
      resolve(answer.toLowerCase() === 'y');
    });
  });
}

// Read package.json
function readPackageJson() {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    return JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  } catch (error) {
    log(`Failed to read package.json: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Write package.json
function writePackageJson(packageJson) {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    log('Updated package.json', 'success');
  } catch (error) {
    log(`Failed to write package.json: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Checks installed versions of packages
function checkInstalledVersions() {
  log('Checking currently installed dependency versions...', 'info');
  
  try {
    const output = execCommand('npm list react react-dom react-router-dom framer-motion --depth=0', { silent: true });
    log(output, 'debug');
    return output;
  } catch (error) {
    // npm list returns non-zero exit code if there are unmet peer dependencies
    log('Some dependencies might not be installed correctly', 'warning');
    return error.stdout || '';
  }
}

// ----- Fix Functions -----

// Clean node_modules and package-lock.json
async function cleanInstallation() {
  if (SKIP_CLEAN) {
    log('Skipping clean installation step', 'info');
    return;
  }
  
  const shouldClean = await promptYesNo('Clean installation (node_modules and package-lock.json)?');
  if (!shouldClean) {
    log('Skipping clean installation', 'info');
    return;
  }
  
  log('Cleaning installation...', 'info');
  execCommand('rm -rf node_modules package-lock.json');
  log('Installation cleaned', 'success');
}

// Update package.json resolutions field
function updateResolutions(packageJson) {
  log('Updating package.json resolutions field...', 'info');
  
  packageJson.resolutions = {
    ...packageJson.resolutions,
    'react': `^${COMPATIBLE_VERSIONS.react}`,
    'react-dom': `^${COMPATIBLE_VERSIONS.reactDom}`,
    '@types/react': `^${COMPATIBLE_VERSIONS.typesReact}`,
    '@types/react-dom': `^${COMPATIBLE_VERSIONS.typesReactDom}`,
    'react-router-dom': `^${COMPATIBLE_VERSIONS.reactRouterDom}`,
    'framer-motion': `^${COMPATIBLE_VERSIONS.framerMotion}`
  };
  
  // Update versions in dependencies
  if (packageJson.dependencies.react) {
    packageJson.dependencies.react = `^${COMPATIBLE_VERSIONS.react}`;
  }
  if (packageJson.dependencies['react-dom']) {
    packageJson.dependencies['react-dom'] = `^${COMPATIBLE_VERSIONS.reactDom}`;
  }
  if (packageJson.dependencies['react-router-dom']) {
    packageJson.dependencies['react-router-dom'] = `^${COMPATIBLE_VERSIONS.reactRouterDom}`;
  }
  if (packageJson.dependencies['framer-motion']) {
    packageJson.dependencies['framer-motion'] = `^${COMPATIBLE_VERSIONS.framerMotion}`;
  }
  
  // Update versions in devDependencies
  if (packageJson.devDependencies?.['@types/react']) {
    packageJson.devDependencies['@types/react'] = `^${COMPATIBLE_VERSIONS.typesReact}`;
  }
  if (packageJson.devDependencies?.['@types/react-dom']) {
    packageJson.devDependencies['@types/react-dom'] = `^${COMPATIBLE_VERSIONS.typesReactDom}`;
  }
  
  writePackageJson(packageJson);
  log('Resolutions updated', 'success');
}

// Create a .npmrc file with required configuration
function updateNpmrc() {
  log('Creating/updating .npmrc file...', 'info');
  
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  const npmrcContent = `legacy-peer-deps=true
resolution-mode=highest
`;
  
  fs.writeFileSync(npmrcPath, npmrcContent, 'utf8');
  log('.npmrc file created with legacy-peer-deps=true', 'success');
}

// Add NODE_OPTIONS=--openssl-legacy-provider to package.json scripts
function updateBuildScripts(packageJson) {
  log('Updating npm scripts for OpenSSL compatibility...', 'info');
  
  // Add the OpenSSL legacy provider to all build scripts
  const buildScripts = ['build', 'build:clean', 'build:debug'];
  
  for (const script of buildScripts) {
    if (packageJson.scripts[script] && !packageJson.scripts[script].includes('--openssl-legacy-provider')) {
      packageJson.scripts[script] = `cross-env NODE_OPTIONS=--openssl-legacy-provider ${packageJson.scripts[script]}`;
    }
  }
  
  // Create or update the build:safe script
  packageJson.scripts['build:safe'] = 'cross-env DISABLE_ESLINT_PLUGIN=true CI=false GENERATE_SOURCEMAP=false NODE_OPTIONS="--max_old_space_size=4096 --openssl-legacy-provider" react-scripts build';
  
  // Create or update the start:legacy script
  packageJson.scripts['start:legacy'] = 'cross-env NODE_OPTIONS=--openssl-legacy-provider DISABLE_FORK_TS_CHECKER=true CHOKIDAR_USEPOLLING=true react-scripts start';
  
  writePackageJson(packageJson);
  log('Build scripts updated', 'success');
}

// Reinstall dependencies with --legacy-peer-deps
async function reinstallDependencies() {
  const shouldReinstall = await promptYesNo('Reinstall dependencies now?');
  if (!shouldReinstall) {
    log('Skipping dependency reinstallation', 'info');
    return;
  }
  
  log('Installing dependencies with compatible versions...', 'info');
  
  try {
    // First, install React and React DOM
    execCommand(`npm install react@${COMPATIBLE_VERSIONS.react} react-dom@${COMPATIBLE_VERSIONS.reactDom} --legacy-peer-deps`);
    
    // Then, install React Router DOM
    execCommand(`npm install react-router-dom@${COMPATIBLE_VERSIONS.reactRouterDom} --legacy-peer-deps`);
    
    // Then, install Framer Motion
    execCommand(`npm install framer-motion@${COMPATIBLE_VERSIONS.framerMotion} --legacy-peer-deps`);
    
    // Finally, install React types
    execCommand(`npm install @types/react@${COMPATIBLE_VERSIONS.typesReact} @types/react-dom@${COMPATIBLE_VERSIONS.typesReactDom} --legacy-peer-deps --save-dev`);
    
    log('Dependencies installed successfully', 'success');
  } catch (error) {
    log(`Failed to install dependencies: ${error.message}`, 'error');
    process.exit(1);
  }
}

// ----- Main Function -----
async function main() {
  log('PropAgentic Dependency Fix Script', 'header');
  
  // Check current dependency versions
  const versionOutput = checkInstalledVersions();
  
  // Read package.json
  const packageJson = readPackageJson();
  
  // Clean installation
  await cleanInstallation();
  
  // Update package.json
  updateResolutions(packageJson);
  updateBuildScripts(packageJson);
  
  // Create .npmrc
  updateNpmrc();
  
  // Reinstall dependencies
  await reinstallDependencies();
  
  log('All dependency fixes applied!', 'success');
  log(`\nNext steps:
1. Run ${colors.bold}npm run build:safe${colors.reset} to build the application
2. Run ${colors.bold}npm run start:legacy${colors.reset} to start the development server
3. See ${colors.bold}NODEJS-OPENSSL-README.md${colors.reset} for more information
`, 'info');
  
  rl.close();
}

// Run the main function
main().catch(error => {
  log(`Script failed: ${error.message}`, 'error');
  process.exit(1);
}); 