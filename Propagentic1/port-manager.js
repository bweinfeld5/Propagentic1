/**
 * Port Manager for PropAgentic
 * This script detects if a port is already in use and finds an available alternative
 */

const net = require('net');
const { execSync } = require('child_process');
const readline = require('readline');

// Default ports to check
const DEFAULT_PORTS = {
  app: 3000,
  api: 5000,
  test: 8080
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

/**
 * Check if a port is in use
 * @param {number} port - Port to check
 * @returns {Promise<boolean>} - True if port is in use, false otherwise
 */
const isPortInUse = (port) => {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        resolve(false); // Some other error
      }
    });
    
    server.once('listening', () => {
      // Close the server and report that the port is not in use
      server.close();
      resolve(false);
    });
    
    server.listen(port);
  });
};

/**
 * Find an available port starting from a given port
 * @param {number} startPort - Port to start checking from
 * @param {number} increment - How much to increment by for each check
 * @returns {Promise<number>} - First available port
 */
const findAvailablePort = async (startPort, increment = 1) => {
  let port = startPort;
  let attempts = 0;
  
  while (attempts < 10) {
    console.log(`${colors.cyan}Checking port ${port}...${colors.reset}`);
    const inUse = await isPortInUse(port);
    
    if (!inUse) {
      console.log(`${colors.green}Port ${port} is available!${colors.reset}`);
      return port;
    }
    
    console.log(`${colors.yellow}Port ${port} is in use, trying next...${colors.reset}`);
    port += increment;
    attempts++;
  }
  
  throw new Error('Could not find an available port after 10 attempts');
};

/**
 * Get process using a specific port
 * @param {number} port - Port to check
 * @returns {string} - Process information or empty string if none
 */
const getProcessUsingPort = (port) => {
  try {
    // This works on macOS and Linux
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | grep LISTEN`;
      
    const output = execSync(command, { encoding: 'utf8' });
    return output.trim();
  } catch (e) {
    return '';
  }
};

/**
 * Kill process using a specific port
 * @param {number} port - Port to free up
 * @returns {boolean} - True if successful, false otherwise
 */
const killProcessUsingPort = (port) => {
  try {
    // This command varies by platform
    const command = process.platform === 'win32'
      ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port} ^| findstr LISTENING') do taskkill /F /PID %a`
      : `lsof -ti :${port} | xargs kill -9`;
      
    execSync(command);
    console.log(`${colors.green}Successfully killed process using port ${port}${colors.reset}`);
    return true;
  } catch (e) {
    console.error(`${colors.red}Error killing process on port ${port}: ${e.message}${colors.reset}`);
    return false;
  }
};

/**
 * Ask user for confirmation
 * @param {string} question - Question to ask
 * @returns {Promise<boolean>} - User's response
 */
const askForConfirmation = async (question) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  return new Promise((resolve) => {
    rl.question(`${question} (y/n) `, (answer) => {
      rl.close();
      resolve(answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes');
    });
  });
};

/**
 * Main function to check and handle port conflicts
 * @param {number} requestedPort - Port requested by the application
 * @returns {Promise<number>} - Port to use (either requested or alternative)
 */
const handlePortConflict = async (requestedPort = DEFAULT_PORTS.app) => {
  console.log(`\n${colors.blue}=== PropAgentic Port Manager ===${colors.reset}`);
  console.log(`${colors.cyan}Checking if port ${requestedPort} is available...${colors.reset}`);
  
  const inUse = await isPortInUse(requestedPort);
  
  if (!inUse) {
    console.log(`${colors.green}Port ${requestedPort} is available! Starting app...${colors.reset}`);
    return requestedPort;
  }
  
  // Port is in use, get process information
  const processInfo = getProcessUsingPort(requestedPort);
  console.log(`${colors.yellow}Port ${requestedPort} is already in use.${colors.reset}`);
  
  if (processInfo) {
    console.log(`${colors.yellow}Process using port ${requestedPort}:${colors.reset}\n${processInfo}`);
  }
  
  // Ask user what to do
  const killProcess = await askForConfirmation('Do you want to kill the process using this port?');
  
  if (killProcess) {
    const success = killProcessUsingPort(requestedPort);
    if (success) {
      return requestedPort; // Return the requested port since it's now available
    }
  }
  
  // Find an alternative port
  console.log(`${colors.cyan}Finding an alternative port...${colors.reset}`);
  const alternativePort = await findAvailablePort(requestedPort + 1);
  
  // Set environment variable for React
  if (requestedPort === DEFAULT_PORTS.app) {
    process.env.PORT = alternativePort;
    console.log(`${colors.green}PORT environment variable set to ${alternativePort}${colors.reset}`);
  }
  
  console.log(`${colors.green}Port ${alternativePort} is available and will be used instead.${colors.reset}`);
  return alternativePort;
};

// If running directly (not imported)
if (require.main === module) {
  // Parse command line arguments
  const args = process.argv.slice(2);
  const requestedPort = parseInt(args[0]) || DEFAULT_PORTS.app;
  
  handlePortConflict(requestedPort)
    .then(port => {
      console.log(`${colors.green}Final selected port: ${port}${colors.reset}`);
      // If PORT environment variable is set, start the app
      if (process.env.PORT) {
        console.log(`${colors.blue}Starting the application on port ${port}...${colors.reset}`);
        try {
          // This requires a specific implementation for your start script
          execSync('npm start', { stdio: 'inherit' });
        } catch (e) {
          // Most likely the process was terminated by the user
          console.log(`${colors.yellow}Application process ended.${colors.reset}`);
        }
      }
    })
    .catch(err => {
      console.error(`${colors.red}Error: ${err.message}${colors.reset}`);
      process.exit(1);
    });
} else {
  // Export for use as a module
  module.exports = {
    isPortInUse,
    findAvailablePort,
    getProcessUsingPort,
    killProcessUsingPort,
    handlePortConflict
  };
} 