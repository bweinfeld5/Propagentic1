#!/usr/bin/env node

/**
 * Build Enhancer Script
 * 
 * This script provides enhanced build capabilities:
 * - Detects and resolves port conflicts
 * - Checks for correct environment variables
 * - Validates critical dependencies before building
 * - Adds detailed logging to the build process
 * - Handles TypeScript errors more gracefully
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const readline = require('readline');

// Configuration
const config = {
  defaultPort: 3000,
  buildCommand: 'react-scripts build',
  packageManager: 'npm',
  criticalDependencies: ['react', 'react-dom', 'react-router-dom', 'firebase'],
  knownTypeScriptIssues: [
    { pattern: 'No overload matches this call', solution: 'Type mismatch in component props. Check component prop types.' },
    { pattern: 'Property does not exist on type', solution: 'Missing property or incorrect type. Update your type definitions.' },
    { pattern: 'Cannot find module', solution: 'Missing import or dependency. Check package.json and imports.' }
  ],
  buildDirPath: path.join(process.cwd(), 'build'),
  minimalBuildFiles: ['index.html', 'asset-manifest.json', 'static'],
  envDefaults: {
    REACT_APP_API_URL: 'https://api.propagentic.com',
    REACT_APP_FIREBASE_API_KEY: 'your-firebase-api-key',
    PUBLIC_URL: ''
  }
};

// Check if we're in debug mode
const isDebug = process.argv.includes('--debug') || process.env.REACT_APP_DEBUG === 'true';

// Create readline interface for user input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Logger with timestamps and color
class Logger {
  static info(message) {
    console.log(`\x1b[36m[INFO]\x1b[0m ${new Date().toISOString()}: ${message}`);
  }
  
  static success(message) {
    console.log(`\x1b[32m[SUCCESS]\x1b[0m ${new Date().toISOString()}: ${message}`);
  }
  
  static warning(message) {
    console.log(`\x1b[33m[WARNING]\x1b[0m ${new Date().toISOString()}: ${message}`);
  }
  
  static error(message) {
    console.log(`\x1b[31m[ERROR]\x1b[0m ${new Date().toISOString()}: ${message}`);
  }
  
  static debug(message) {
    if (isDebug) {
      console.log(`\x1b[35m[DEBUG]\x1b[0m ${new Date().toISOString()}: ${message}`);
    }
  }
}

// Utility functions
async function checkPortInUse(port) {
  try {
    Logger.debug(`Checking if port ${port} is in use...`);
    
    // On Unix-like systems
    if (process.platform !== 'win32') {
      try {
        execSync(`lsof -i:${port} -t`, { stdio: 'pipe' });
        return true;
      } catch (e) {
        return false;
      }
    } 
    // On Windows
    else {
      const result = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe', shell: true }).toString();
      return result.length > 0;
    }
  } catch (error) {
    Logger.debug(`Error checking port: ${error.message}`);
    return false;
  }
}

async function findAvailablePort(startPort) {
  let port = startPort;
  while (await checkPortInUse(port)) {
    Logger.warning(`Port ${port} is already in use.`);
    port++;
  }
  return port;
}

function checkEnvironmentVariables() {
  Logger.info('Checking environment variables...');
  
  const missingVars = [];
  const envVars = { ...config.envDefaults };
  
  // Check if .env file exists
  const envPath = path.join(process.cwd(), '.env');
  const envLocalPath = path.join(process.cwd(), '.env.local');
  
  let envFileExists = fs.existsSync(envPath) || fs.existsSync(envLocalPath);
  
  if (!envFileExists) {
    Logger.warning('No .env or .env.local file found. Creating .env with defaults.');
    
    let envContent = '';
    for (const [key, value] of Object.entries(envVars)) {
      envContent += `${key}=${value}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    return false;
  }
  
  return true;
}

function checkCriticalDependencies() {
  Logger.info('Verifying critical dependencies...');
  
  try {
    const packageJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'package.json'), 'utf8'));
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    const missingDeps = [];
    
    for (const dep of config.criticalDependencies) {
      if (!dependencies[dep]) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      Logger.error(`Missing critical dependencies: ${missingDeps.join(', ')}`);
      return false;
    }
    
    // Check for React version compatibility
    const reactVersion = dependencies.react;
    if (reactVersion && reactVersion.match(/(\d+)\./)[1] < 16) {
      Logger.warning(`React version ${reactVersion} might have compatibility issues. Consider upgrading to 16+`);
    }
    
    return true;
  } catch (error) {
    Logger.error(`Error checking dependencies: ${error.message}`);
    return false;
  }
}

function cleanBuildDirectory() {
  Logger.info('Cleaning build directory...');
  
  if (fs.existsSync(config.buildDirPath)) {
    try {
      if (process.platform === 'win32') {
        execSync(`rmdir /s /q "${config.buildDirPath}"`, { stdio: 'inherit' });
      } else {
        execSync(`rm -rf "${config.buildDirPath}"`, { stdio: 'inherit' });
      }
      Logger.success('Build directory cleaned.');
    } catch (error) {
      Logger.error(`Failed to clean build directory: ${error.message}`);
    }
  } else {
    Logger.debug('Build directory does not exist yet.');
  }
}

function analyzeBuildOutput() {
  Logger.info('Analyzing build output...');
  
  if (!fs.existsSync(config.buildDirPath)) {
    Logger.error('Build directory does not exist. Build may have failed.');
    return false;
  }
  
  // Check for minimal required files
  const missingFiles = [];
  for (const file of config.minimalBuildFiles) {
    const filePath = path.join(config.buildDirPath, file);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(file);
    }
  }
  
  if (missingFiles.length > 0) {
    Logger.error(`Build is incomplete. Missing essential files: ${missingFiles.join(', ')}`);
    return false;
  }
  
  // Get build size
  let totalSize = 0;
  const getDirectorySize = (dirPath) => {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });
    
    for (const file of files) {
      const filePath = path.join(dirPath, file.name);
      
      if (file.isDirectory()) {
        getDirectorySize(filePath);
      } else {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      }
    }
  };
  
  getDirectorySize(config.buildDirPath);
  
  Logger.success(`Build completed successfully. Total size: ${(totalSize / (1024 * 1024)).toFixed(2)} MB`);
  return true;
}

function handleTypeScriptError(error) {
  Logger.error('TypeScript compilation errors detected:');
  
  // Look for known TypeScript error patterns
  for (const issue of config.knownTypeScriptIssues) {
    if (error.includes(issue.pattern)) {
      Logger.info(`Possible solution: ${issue.solution}`);
      break;
    }
  }
  
  return false;
}

async function runBuild() {
  return new Promise((resolve, reject) => {
    Logger.info('Starting build process...');
    
    const buildProcess = spawn('npm', ['run', 'build'], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true,
      env: { ...process.env, REACT_APP_BUILD_TIME: new Date().toISOString() }
    });
    
    let output = '';
    
    buildProcess.stdout.on('data', (data) => {
      const chunk = data.toString();
      process.stdout.write(chunk);
      output += chunk;
    });
    
    buildProcess.stderr.on('data', (data) => {
      const chunk = data.toString();
      process.stderr.write(chunk);
      output += chunk;
    });
    
    buildProcess.on('close', (code) => {
      if (code === 0) {
        Logger.success('Build process completed successfully.');
        resolve(true);
      } else {
        // Check for TypeScript errors
        if (output.includes('TypeScript error') || output.includes('TS')) {
          handleTypeScriptError(output);
        }
        
        Logger.error(`Build failed with exit code ${code}`);
        reject(output);
      }
    });
  });
}

async function main() {
  try {
    Logger.info('Build enhancer script started');
    Logger.debug('Debug mode enabled');
    
    // Check port conflicts
    const defaultPort = parseInt(process.env.PORT || config.defaultPort);
    const isPortInUse = await checkPortInUse(defaultPort);
    
    if (isPortInUse) {
      const availablePort = await findAvailablePort(defaultPort);
      Logger.warning(`Setting PORT=${availablePort} to avoid conflicts`);
      process.env.PORT = availablePort.toString();
    }
    
    // Check/set environment variables
    const envVarsOk = checkEnvironmentVariables();
    
    // Check dependencies
    const depsOk = checkCriticalDependencies();
    if (!depsOk) {
      const answer = await new Promise(resolve => {
        rl.question('Continue with build despite dependency issues? (y/n) ', resolve);
      });
      
      if (answer.toLowerCase() !== 'y') {
        Logger.info('Build aborted by user.');
        rl.close();
        return;
      }
    }
    
    // Clean build directory
    cleanBuildDirectory();
    
    // Run the build
    await runBuild();
    
    // Analyze build output
    analyzeBuildOutput();
    
    Logger.success('Build enhancement completed successfully');
  } catch (error) {
    Logger.error(`Build failed: ${error}`);
    if (isDebug && typeof error === 'string') {
      fs.writeFileSync('build-error.log', error);
      Logger.info('Error details saved to build-error.log');
    }
    process.exit(1);
  } finally {
    rl.close();
  }
}

main(); 