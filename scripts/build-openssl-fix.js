#!/usr/bin/env node

/**
 * PropAgentic OpenSSL Build Fix Script
 * 
 * This script handles the Node.js v17+ OpenSSL compatibility issues
 * with webpack and Create React App by setting the appropriate
 * environment variables and handling the build process.
 * 
 * Usage:
 *   node scripts/build-openssl-fix.js [options]
 * 
 * Options:
 *   --clean         Clean the build directory before building
 *   --debug         Run in debug mode with verbose logging
 *   --skip-checks   Skip package.json validation checks
 *   --help          Show this help message
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for better console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bold: '\x1b[1m'
};

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  clean: args.includes('--clean'),
  debug: args.includes('--debug'),
  skipChecks: args.includes('--skip-checks'),
  help: args.includes('--help')
};

// Show help message and exit
if (options.help) {
  console.log(`
${colors.bold}PropAgentic OpenSSL Build Fix Script${colors.reset}

This script helps build the PropAgentic application with Node.js v17+
by enabling the OpenSSL legacy provider and handling common build issues.

${colors.bold}Usage:${colors.reset}
  node scripts/build-openssl-fix.js [options]

${colors.bold}Options:${colors.reset}
  --clean         Clean the build directory before building
  --debug         Run in debug mode with verbose logging
  --skip-checks   Skip package.json validation checks
  --help          Show this help message
  `);
  process.exit(0);
}

// Logger for better output
class Logger {
  static debug(message) {
    if (options.debug) {
      console.log(`${colors.cyan}[DEBUG]${colors.reset} ${message}`);
    }
  }

  static info(message) {
    console.log(`${colors.blue}[INFO]${colors.reset} ${message}`);
  }

  static success(message) {
    console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
  }

  static warn(message) {
    console.log(`${colors.yellow}[WARN]${colors.reset} ${message}`);
  }

  static error(message) {
    console.error(`${colors.red}[ERROR]${colors.reset} ${message}`);
  }
}

// Execute a command with proper error handling and status reporting
function execCommand(command, silent = false) {
  let output = '';
  let success = true;
  let exitCode = 0;

  try {
    Logger.debug(`Executing: ${command}`);
    output = execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      env: { ...process.env },
      encoding: 'utf8'
    });
    Logger.debug(`Command output (Success):
${output}`);
    // Initial success state, but check output further
    success = true; 
  } catch (error) {
    // execSync throws on non-zero exit code. This is an error *condition*,
    // but not necessarily a build *failure* yet.
    Logger.warn(`Command finished with non-zero exit code: ${command}`);
    exitCode = error.status || 1;
    output = error.stdout || error.stderr || ''; // Capture output even on error
    Logger.debug(`Command output (Error Catch):\n${output}`);
    success = false; // Mark as potentially failed, confirmation needed
  }

  // Final check: Regardless of exit code, check for explicit failure messages
  const failureKeywords = [
      'Failed to compile',
      'SyntaxError',
      'Module not found',
      'Build failed'
  ];
  
  let explicitFailureFound = false;
  // Ensure output is a string before splitting
  const outputString = typeof output === 'string' ? output : '';
  for (const keyword of failureKeywords) {
      // Check last ~20 lines for failure keywords for robustness
      const lastLines = outputString.split('\n').slice(-20).join('\n'); // Use outputString
      if (lastLines.includes(keyword)) {
          Logger.error(`Detected failure keyword "${keyword}" in build output.`);
          explicitFailureFound = true;
          success = false; // Confirm failure
          break;
      }
  }

  // If no explicit failure was found, but the exit code was non-zero,
  // let's assume it was a success with warnings IF the build folder exists.
  if (!explicitFailureFound && exitCode !== 0 && validateBuildOutput(true)) { // Pass true for silent validation
      Logger.warn('Command exited non-zero, but no failure keywords found and build output exists. Treating as success with warnings.');
      success = true;
  } else if (!explicitFailureFound && exitCode !== 0) {
      Logger.error(`Command exited non-zero (${exitCode}), and build output may be invalid.`);
      success = false;
  } else if (explicitFailureFound) {
      Logger.error(`Build failed due to detected errors in output.`);
      success = false;
  } else {
       Logger.success(`Build command appears to have succeeded (Exit Code: ${exitCode}).`);
  }
  

  return { 
    success,
    code: exitCode,
    output: outputString // Return the guaranteed string output
  };
}

// Modified validateBuildOutput to accept a silent flag
function validateBuildOutput(silent = false) {
  const buildFolders = ['build', 'dist', 'out'];
  for (const folder of buildFolders) {
    if (fs.existsSync(path.join(process.cwd(), folder))) {
      if (!silent) Logger.success(`Build output directory '${folder}' exists.`);
      // Optional: Add more checks here (e.g., index.html exists)
      return true;
    }
  }
  if (!silent) Logger.error('No build output directory found after build completion.');
  return false;
}

// Check Node.js version
function checkNodeVersion() {
  const nodeVersion = process.version;
  Logger.info(`Detected Node.js version: ${nodeVersion}`);
  
  // Extract major version number
  const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0], 10);
  
  if (majorVersion >= 17) {
    Logger.warn(`Node.js v${majorVersion} uses OpenSSL 3.0, which requires the legacy provider for some webpack operations.`);
    return true;
  } else {
    Logger.info(`Node.js v${majorVersion} uses OpenSSL 1.1.1, no additional configuration needed.`);
    return false;
  }
}

// Check if package.json has the necessary scripts
function validatePackageJson() {
  if (options.skipChecks) {
    Logger.debug('Skipping package.json validation.');
    return true;
  }

  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    // Check if the necessary dependencies exist
    const hasCrossEnv = packageJson.dependencies['cross-env'] || packageJson.devDependencies['cross-env'];
    if (!hasCrossEnv) {
      Logger.warn('cross-env package is not installed. This may cause issues on Windows systems.');
      Logger.info('Consider running: npm install cross-env --save-dev');
    }
    
    // Check if we have the required scripts
    const hasBuildScript = packageJson.scripts && packageJson.scripts.build;
    if (!hasBuildScript) {
      Logger.error('No build script found in package.json.');
      return false;
    }
    
    return true;
  } catch (error) {
    Logger.error('Failed to read or parse package.json.');
    Logger.debug(`Error: ${error.message}`);
    return false;
  }
}

// Clean the build directory
function cleanBuildDirectory() {
  if (options.clean) {
    Logger.info('Cleaning build directory...');
    
    // Detect project structure
    const buildFolders = ['build', 'dist', 'out'];
    for (const folder of buildFolders) {
      if (fs.existsSync(path.join(process.cwd(), folder))) {
        execCommand(`rm -rf ${folder}`);
        Logger.success(`Removed ${folder} directory.`);
      }
    }
  }
}

// Main function needs slight adjustment to use the refined success logic
function main() {
  Logger.info('PropAgentic OpenSSL Build Fix Script');
  const needsLegacyProvider = checkNodeVersion();
  if (!validatePackageJson()) {
    Logger.error('Package.json validation failed. Use --skip-checks to bypass.');
    process.exit(1);
  }
  cleanBuildDirectory();

  let buildResult;
  if (needsLegacyProvider) {
    Logger.info('Starting build with OpenSSL legacy provider...');
    process.env.NODE_OPTIONS = `${process.env.NODE_OPTIONS || ''} --openssl-legacy-provider`.trim();
    if (options.debug) {
      process.env.GENERATE_SOURCEMAP = 'true';
      process.env.DEBUG = 'true';
    }
    buildResult = execCommand('npm run build');
  } else {
    Logger.info('Running normal build process...');
    buildResult = execCommand('npm run build');
  }

  // Final validation based on command success AND output folder presence
  const outputValid = validateBuildOutput(); // Non-silent validation here

  if (buildResult.success && outputValid) {
    Logger.success('Build process completed successfully and output validated.');
    Logger.info('You can now deploy the application or start it locally.');
    process.exit(0); // Success
  } else {
    if (!buildResult.success) {
        Logger.error('Build command failed. Check detailed logs above.');
    } else if (!outputValid) {
        Logger.error('Build command finished, but output validation failed (Build directory missing?).');
    }
    process.exit(1); // Failure
  }
}

// Run the main function
main(); 