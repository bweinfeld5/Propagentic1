#!/usr/bin/env node
/**
 * Port Manager - Utility for detecting and handling port conflicts
 *
 * This script will:
 * 1. Check if the specified port is in use
 * 2. If it is, either suggest an alternative port or automatically use the next available port
 * 3. Update the environment variables for the process
 * 
 * Usage:
 *   node port-manager.js [defaultPort] [--auto] [--verbose]
 */

const net = require('net');
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Configuration
const DEFAULT_PORT = process.argv[2] || 3000;
const AUTO_FIX = process.argv.includes('--auto');
const VERBOSE = process.argv.includes('--verbose');
const MAX_PORT_CHECK = 10; // How many ports to check before giving up

// Log utility
function log(message, level = 'info') {
  if (VERBOSE || level !== 'debug') {
    const prefix = level === 'error' ? '❌ ERROR:' : 
                  level === 'warning' ? '⚠️ WARNING:' : 
                  level === 'success' ? '✅ SUCCESS:' : 'ℹ️ INFO:';
    console.log(`${prefix} ${message}`);
  }
}

/**
 * Check if a port is in use
 * @param {number} port - The port to check
 * @returns {Promise<boolean>} - True if the port is in use, false otherwise
 */
function isPortInUse(port) {
  return new Promise((resolve) => {
    const server = net.createServer();
    
    server.once('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        resolve(true); // Port is in use
      } else {
        log(`Error checking port ${port}: ${err.message}`, 'error');
        resolve(false); // Assume port is free if we got a different error
      }
    });
    
    server.once('listening', () => {
      server.close();
      resolve(false); // Port is free
    });
    
    server.listen(port);
  });
}

/**
 * Find the process using a specific port
 * @param {number} port - The port to check
 * @returns {string|null} - The process information or null if not found
 */
function findProcessUsingPort(port) {
  try {
    // This command works on macOS and Linux
    const command = process.platform === 'win32'
      ? `netstat -ano | findstr :${port}`
      : `lsof -i :${port} | grep LISTEN`;
    
    const result = execSync(command, { encoding: 'utf8' });
    return result.trim();
  } catch (error) {
    // Command failed or no process found
    return null;
  }
}

/**
 * Find the next available port starting from the provided port
 * @param {number} startPort - The port to start checking from
 * @returns {Promise<number>} - The next available port or -1 if none found
 */
async function findNextAvailablePort(startPort) {
  for (let port = startPort; port < startPort + MAX_PORT_CHECK; port++) {
    const inUse = await isPortInUse(port);
    if (!inUse) {
      return port;
    }
  }
  return -1; // No available port found
}

/**
 * Update environment variables for the current process
 * @param {number} port - The port to use
 */
function updateEnvironment(port) {
  // Create or update .env.local file
  const envPath = path.join(process.cwd(), '.env.local');
  
  let envContent = '';
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Update PORT variable if it exists, otherwise add it
  if (envContent.includes('PORT=')) {
    envContent = envContent.replace(/PORT=\d+/g, `PORT=${port}`);
  } else {
    envContent += `\nPORT=${port}`;
  }
  
  fs.writeFileSync(envPath, envContent.trim());
  log(`Updated .env.local with PORT=${port}`, 'success');
  
  // Update process.env for the current session
  process.env.PORT = port.toString();
}

/**
 * Main function
 */
async function main() {
  log(`Checking if port ${DEFAULT_PORT} is available...`, 'debug');
  
  const portInUse = await isPortInUse(DEFAULT_PORT);
  
  if (!portInUse) {
    log(`Port ${DEFAULT_PORT} is available.`, 'success');
    return;
  }
  
  log(`Port ${DEFAULT_PORT} is already in use!`, 'warning');
  
  // Try to get more info about what's using the port
  const processInfo = findProcessUsingPort(DEFAULT_PORT);
  if (processInfo) {
    log(`Process using port ${DEFAULT_PORT}: ${processInfo}`, 'info');
  }
  
  // Find an alternative port
  const nextPort = await findNextAvailablePort(parseInt(DEFAULT_PORT) + 1);
  
  if (nextPort === -1) {
    log(`No available ports found in range ${DEFAULT_PORT}-${parseInt(DEFAULT_PORT) + MAX_PORT_CHECK}.`, 'error');
    process.exit(1);
  }
  
  log(`Found available port: ${nextPort}`, 'success');
  
  if (AUTO_FIX) {
    // Automatically update configuration to use the new port
    updateEnvironment(nextPort);
    log(`Your application will now run on port ${nextPort}`, 'success');
  } else {
    // Just suggest the alternative port
    log(`Suggested action: Use port ${nextPort} instead.`, 'info');
    log('Run with --auto flag to automatically update PORT in .env.local', 'info');
  }
}

// Run the script
main().catch(error => {
  log(`An error occurred: ${error.message}`, 'error');
  process.exit(1);
}); 