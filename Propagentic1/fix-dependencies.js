/**
 * Dependency Fix Script for PropAgentic
 * 
 * This script helps fix inconsistent dependencies by:
 * 1. Cleaning the node_modules directory
 * 2. Adding resolutions to package.json for React 19
 * 3. Reinstalling with legacy-peer-deps flag
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

// Print colored message
function print(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Print section header
function section(title) {
  console.log('\n' + colors.bold + colors.cyan + '='.repeat(60) + colors.reset);
  console.log(colors.bold + colors.cyan + `  ${title}` + colors.reset);
  console.log(colors.bold + colors.cyan + '='.repeat(60) + colors.reset + '\n');
}

// Run command and return output
function runCommand(command, silent = false) {
  try {
    if (!silent) {
      print('blue', `> ${command}`);
    }
    const output = execSync(command, { stdio: silent ? 'pipe' : 'inherit', encoding: 'utf8' });
    return { success: true, output };
  } catch (error) {
    return { 
      success: false, 
      output: error.stdout || '', 
      error: error.stderr || error.message || 'Unknown error'
    };
  }
}

// Create .npmrc file with needed config
function createNpmrc() {
  section('Setting up .npmrc file');
  
  const npmrcPath = path.join(process.cwd(), '.npmrc');
  const npmrcContent = `legacy-peer-deps=true
engine-strict=false
strict-peer-dependencies=false
`;
  
  fs.writeFileSync(npmrcPath, npmrcContent);
  print('green', '✅ Created .npmrc file with legacy-peer-deps setting');
}

// Update package.json with resolutions
function updatePackageJson() {
  section('Updating package.json');
  
  const packageJsonPath = path.join(process.cwd(), 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  // Add resolutions field if it doesn't exist
  if (!packageJson.resolutions) {
    packageJson.resolutions = {};
  }
  
  // Add react resolution
  packageJson.resolutions.react = "^19.1.0";
  packageJson.resolutions['react-dom'] = "^19.1.0";
  
  // Write updated package.json
  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  print('green', '✅ Added React 19 resolutions to package.json');
}

// Clean node_modules
function cleanNodeModules() {
  section('Cleaning Installation');
  
  print('yellow', 'Cleaning node_modules directory...');
  runCommand('rm -rf node_modules');
  
  print('yellow', 'Removing package-lock.json...');
  if (fs.existsSync('package-lock.json')) {
    runCommand('rm package-lock.json');
  }
  
  print('yellow', 'Clearing npm cache...');
  runCommand('npm cache clean --force');
  
  print('green', '✅ Clean completed');
}

// Reinstall dependencies
function reinstallDependencies() {
  section('Reinstalling Dependencies');
  
  print('yellow', 'This may take several minutes. Please be patient...');
  const result = runCommand('npm install --legacy-peer-deps');
  
  if (result.success) {
    print('green', '✅ Dependencies reinstalled successfully');
  } else {
    print('red', '❌ Failed to reinstall dependencies');
    print('yellow', 'You may need to manually run: npm install --legacy-peer-deps');
  }
}

// Check if current dependencies are consistent
function checkConsistency() {
  section('Checking React Version Consistency');
  
  const result = runCommand('npm ls react', true);
  if (result.success) {
    if (result.output.includes('invalid')) {
      print('red', '❌ React dependency inconsistencies found');
      return false;
    } else {
      print('green', '✅ React dependencies are consistent');
      return true;
    }
  } else {
    print('red', '❌ Could not check React dependencies');
    return false;
  }
}

// Create a .env file
function createEnvFile() {
  section('Creating Environment File');
  
  const envPath = path.join(process.cwd(), '.env');
  const envContent = `SKIP_PREFLIGHT_CHECK=true
CI=false
GENERATE_SOURCEMAP=false
`;
  
  fs.writeFileSync(envPath, envContent);
  print('green', '✅ Created .env file with build settings');
}

// Main function
async function main() {
  print('bold', '\n🔧 PropAgentic Dependency Fix Tool\n');
  
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  try {
    // Check if we need to fix anything
    const isConsistent = checkConsistency();
    
    if (isConsistent) {
      const answer = await new Promise(resolve => {
        rl.question('Dependencies appear consistent. Fix anyway? (y/n): ', resolve);
      });
      
      if (answer.toLowerCase() !== 'y') {
        print('blue', 'No changes made. Exiting...');
        rl.close();
        return;
      }
    }
    
    print('yellow', 'This process will:');
    print('yellow', '1. Create/update .npmrc file');
    print('yellow', '2. Add React resolutions to package.json');
    print('yellow', '3. Clean node_modules and package-lock.json');
    print('yellow', '4. Reinstall all dependencies');
    print('yellow', '5. Create .env file with build settings');
    
    const confirm = await new Promise(resolve => {
      rl.question('\nProceed? (y/n): ', resolve);
    });
    
    if (confirm.toLowerCase() !== 'y') {
      print('blue', 'Operation cancelled. No changes made.');
      rl.close();
      return;
    }
    
    // Run the fixes
    createNpmrc();
    updatePackageJson();
    cleanNodeModules();
    reinstallDependencies();
    createEnvFile();
    
    // Final message
    print('bold', '\n🎉 Dependency fixes completed!\n');
    print('blue', 'Next steps:');
    print('blue', '1. Run the build: npm run build:safe');
    print('blue', '2. Deploy: npm run deploy:clean');
    
  } catch (error) {
    print('red', `Unexpected error: ${error.message}`);
  } finally {
    rl.close();
  }
}

// Run the main function
main().catch(error => {
  console.error(colors.red, `Unexpected error: ${error.message}`, colors.reset);
  process.exit(1);
}); 