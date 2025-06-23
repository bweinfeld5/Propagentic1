#!/usr/bin/env node
/**
 * Build Debug Script
 * 
 * This script enhances the build process with:
 * - Detailed logging during build
 * - Memory usage tracking
 * - Common error pattern detection
 * - Graceful handling of TypeScript errors
 * - Build timing measurement
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration
const DEBUG_MODE = process.argv.includes('--debug');
const FAIL_FAST = process.argv.includes('--fail-fast');
const TYPESCRIPT_WARNINGS_AS_ERRORS = !process.argv.includes('--ignore-ts-errors');
const LOG_FILE = path.join(process.cwd(), 'build-debug.log');

// Initialize log file
fs.writeFileSync(LOG_FILE, `Build Debug Log - ${new Date().toISOString()}\n\n`, 'utf8');

// Common error patterns to detect
const ERROR_PATTERNS = [
  {
    pattern: /Failed to resolve module specifier/i,
    message: 'Module resolution error - Check import paths and package.json dependencies'
  },
  {
    pattern: /Cannot find module/i,
    message: 'Missing dependency - Run npm install or check import paths'
  },
  {
    pattern: /TS(?:\d+)/i,
    message: 'TypeScript error detected'
  },
  {
    pattern: /Conflicting peer dependency: react@(\d+\.\d+\.\d+)/i,
    message: 'React version conflict detected - Check package.json and use resolutions'
  },
  {
    pattern: /out of memory/i,
    message: 'Build process ran out of memory - Increase Node memory limit or reduce bundle size'
  },
  {
    pattern: /Failed to compile/i,
    message: 'Compilation failed - Check for syntax errors'
  }
];

/**
 * Log a message to both console and log file
 * @param {string} message - The message to log
 * @param {string} level - The log level
 */
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = level === 'error' ? '❌ ERROR:' : 
               level === 'warning' ? '⚠️ WARNING:' : 
               level === 'success' ? '✅ SUCCESS:' : 
               level === 'debug' ? '🔍 DEBUG:' : 'ℹ️ INFO:';
  
  const logMessage = `[${timestamp}] ${prefix} ${message}`;
  
  // Only show debug messages if in debug mode
  if (level !== 'debug' || DEBUG_MODE) {
    console.log(logMessage);
  }
  
  // Always write to log file
  fs.appendFileSync(LOG_FILE, logMessage + '\n', 'utf8');
}

/**
 * Format bytes to a human-readable string
 * @param {number} bytes - The number of bytes
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  
  return `${parseFloat((bytes / Math.pow(1024, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Log system information
 */
function logSystemInfo() {
  log('System Information:', 'info');
  log(`Platform: ${os.platform()} ${os.release()}`, 'debug');
  log(`CPU: ${os.cpus()[0].model} (${os.cpus().length} cores)`, 'debug');
  log(`Memory: ${formatBytes(os.totalmem())} total, ${formatBytes(os.freemem())} free`, 'debug');
  log(`Node.js: ${process.version}`, 'debug');
  
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    log(`npm: ${npmVersion}`, 'debug');
  } catch (error) {
    log('Failed to get npm version', 'warning');
  }
  
  // Check for environment variables that might affect the build
  const buildEnvVars = Object.keys(process.env)
    .filter(key => key.includes('NODE_ENV') || key.includes('REACT_APP') || key.includes('BUILD'))
    .reduce((obj, key) => {
      obj[key] = process.env[key];
      return obj;
    }, {});
    
  log(`Build environment variables: ${JSON.stringify(buildEnvVars, null, 2)}`, 'debug');
}

/**
 * Check for TypeScript errors in the output
 * @param {string} data - The output data to check
 * @returns {boolean} - True if TypeScript errors were found
 */
function checkForTypeScriptErrors(data) {
  const tsErrorRegex = /TS(?:\d+)/i;
  return tsErrorRegex.test(data);
}

/**
 * Check for known error patterns and suggest solutions
 * @param {string} data - The output data to check
 */
function detectErrorPatterns(data) {
  for (const { pattern, message } of ERROR_PATTERNS) {
    if (pattern.test(data)) {
      log(`Detected issue: ${message}`, 'warning');
    }
  }
}

/**
 * Run the build process
 */
function runBuild() {
  const startTime = Date.now();
  log('Starting build process...', 'info');
  
  // Log system information
  logSystemInfo();
  
  // Prepare build command
  const buildCommand = 'npm';
  const buildArgs = ['run', 'build'];
  
  if (DEBUG_MODE) {
    // Add verbose output if in debug mode
    buildArgs.push('--verbose');
    
    // Set environment for more detailed React build info
    process.env.GENERATE_SOURCEMAP = 'true';
    process.env.TSC_COMPILE_ON_ERROR = TYPESCRIPT_WARNINGS_AS_ERRORS ? 'false' : 'true';
  }
  
  log(`Running command: ${buildCommand} ${buildArgs.join(' ')}`, 'debug');
  
  // Start build process
  const buildProcess = spawn(buildCommand, buildArgs, {
    stdio: ['ignore', 'pipe', 'pipe'],
    env: { ...process.env }
  });
  
  let hasTypeScriptErrors = false;
  let output = '';
  
  // Handle stdout
  buildProcess.stdout.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;
    
    // Print real-time output
    process.stdout.write(dataStr);
    
    // Check for TypeScript errors
    if (checkForTypeScriptErrors(dataStr)) {
      hasTypeScriptErrors = true;
    }
    
    // Detect known error patterns
    detectErrorPatterns(dataStr);
    
    // Log memory usage periodically
    if (dataStr.includes('Creating an optimized production build')) {
      const memUsage = process.memoryUsage();
      log(`Memory usage: RSS ${formatBytes(memUsage.rss)}, Heap ${formatBytes(memUsage.heapUsed)}/${formatBytes(memUsage.heapTotal)}`, 'debug');
    }
  });
  
  // Handle stderr
  buildProcess.stderr.on('data', (data) => {
    const dataStr = data.toString();
    output += dataStr;
    
    // Print real-time output
    process.stderr.write(dataStr);
    
    // Check for TypeScript errors
    if (checkForTypeScriptErrors(dataStr)) {
      hasTypeScriptErrors = true;
      
      if (TYPESCRIPT_WARNINGS_AS_ERRORS && FAIL_FAST) {
        log('TypeScript errors detected, stopping build due to --fail-fast flag', 'error');
        buildProcess.kill();
      }
    }
    
    // Detect known error patterns
    detectErrorPatterns(dataStr);
  });
  
  // Handle build completion
  buildProcess.on('close', (code) => {
    const endTime = Date.now();
    const buildTime = ((endTime - startTime) / 1000).toFixed(2);
    
    if (code === 0) {
      log(`Build completed successfully in ${buildTime} seconds`, 'success');
      
      // Check build output size
      try {
        const buildDir = path.join(process.cwd(), 'build');
        if (fs.existsSync(buildDir)) {
          let totalSize = 0;
          
          const getAllFiles = (dir) => {
            const files = fs.readdirSync(dir);
            
            files.forEach(file => {
              const filePath = path.join(dir, file);
              const stats = fs.statSync(filePath);
              
              if (stats.isDirectory()) {
                getAllFiles(filePath);
              } else {
                totalSize += stats.size;
              }
            });
          };
          
          getAllFiles(buildDir);
          log(`Build output size: ${formatBytes(totalSize)}`, 'info');
        }
      } catch (error) {
        log(`Error checking build size: ${error.message}`, 'warning');
      }
      
      // Write a build summary
      log('Build Summary:', 'info');
      log(`- Build time: ${buildTime} seconds`, 'info');
      log(`- TypeScript errors: ${hasTypeScriptErrors ? 'Yes' : 'No'}`, 'info');
      log(`- Full log file: ${LOG_FILE}`, 'info');
      
    } else {
      log(`Build failed with exit code ${code} after ${buildTime} seconds`, 'error');
      
      // More detailed error analysis
      if (hasTypeScriptErrors) {
        log('TypeScript errors detected in the build output', 'warning');
        
        if (!TYPESCRIPT_WARNINGS_AS_ERRORS) {
          log('TypeScript errors were ignored due to --ignore-ts-errors flag', 'info');
        }
      }
      
      log('For detailed error information, check the log file', 'info');
    }
  });
}

// Execute the build
try {
  log('Build Debug Script started', 'info');
  runBuild();
} catch (error) {
  log(`Unexpected error: ${error.message}`, 'error');
  process.exit(1);
} 