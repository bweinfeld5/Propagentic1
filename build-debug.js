/**
 * PropAgentic Build Debug Utility
 * 
 * This script provides enhanced debugging for React build process issues.
 * It captures build errors and provides detailed diagnostics and suggestions.
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

// Common error patterns to look for in build output
const ERROR_PATTERNS = [
  {
    pattern: /Failed to compile/i,
    category: 'COMPILATION_ERROR',
    suggestion: 'Check for syntax errors in your components or imports.'
  },
  {
    pattern: /Module not found/i,
    category: 'MISSING_MODULE',
    suggestion: 'A required package or file is missing. Check your import statements and install any missing dependencies.'
  },
  {
    pattern: /Type error/i,
    category: 'TYPE_ERROR',
    suggestion: 'TypeScript type checking failed. Check the exact error location and fix the type issues.'
  },
  {
    pattern: /SyntaxError/i,
    category: 'SYNTAX_ERROR',
    suggestion: 'There is a syntax error in your code. Check for missing brackets, commas, or other syntax issues.'
  },
  {
    pattern: /Error: ENOENT/i,
    category: 'FILE_NOT_FOUND',
    suggestion: 'A file or directory could not be found. Verify all file paths are correct.'
  },
  {
    pattern: /cannot find module/i,
    category: 'MODULE_NOT_FOUND',
    suggestion: 'A module is missing. Run npm install to ensure all dependencies are installed.'
  },
  {
    pattern: /Maximum call stack size exceeded/i,
    category: 'INFINITE_RECURSION',
    suggestion: 'You likely have an infinite loop or recursion in your code. Check for circular dependencies.'
  },
  {
    pattern: /Circular dependency detected/i,
    category: 'CIRCULAR_DEPENDENCY',
    suggestion: 'You have circular imports in your code. Refactor to break the dependency cycle.'
  },
  {
    pattern: /memory leak detected/i,
    category: 'MEMORY_LEAK',
    suggestion: 'A memory leak was detected. Check for components not properly cleaning up effects or listeners.'
  },
  {
    pattern: /out of memory/i,
    category: 'OUT_OF_MEMORY',
    suggestion: 'The build process ran out of memory. Try increasing Node memory limit with NODE_OPTIONS=--max_old_space_size=4096'
  },
  {
    pattern: /ENOSPC/i,
    category: 'NO_DISK_SPACE',
    suggestion: 'No space left on device. Free up disk space or use a directory with more available space.'
  },
  {
    pattern: /EPERM|EACCES/i,
    category: 'PERMISSION_ERROR',
    suggestion: 'Permission denied. Check file and directory permissions.'
  }
];

// Look for error patterns in a string
const identifyErrorPatterns = (str) => {
  const matches = [];
  
  ERROR_PATTERNS.forEach(pattern => {
    if (pattern.pattern.test(str)) {
      matches.push(pattern);
    }
  });
  
  return matches;
};

// Extract relevant error context
const extractErrorContext = (error) => {
  // Get file path and line numbers if available
  const fileMatch = error.match(/([a-zA-Z0-9_\-/.]+\.(jsx?|tsx?))(?::(\d+)(?::(\d+))?)?/);
  
  if (!fileMatch) return null;
  
  const [, filePath, fileExt, line, column] = fileMatch;
  
  return {
    filePath,
    line: line ? parseInt(line, 10) : null,
    column: column ? parseInt(column, 10) : null
  };
};

// Check for TypeScript errors
const checkTypeScriptErrors = () => {
  console.log(`${colors.blue}Running TypeScript type check...${colors.reset}`);
  
  return new Promise((resolve) => {
    const tsc = spawn('npx', ['tsc', '--noEmit'], { shell: true });
    
    let output = '';
    let errors = [];
    
    tsc.stdout.on('data', (data) => {
      const str = data.toString();
      output += str;
    });
    
    tsc.stderr.on('data', (data) => {
      const str = data.toString();
      output += str;
      
      // Capture TypeScript errors
      const errorLines = str.split('\n').filter(line => line.includes('error TS'));
      errors = errors.concat(errorLines);
    });
    
    tsc.on('close', (code) => {
      if (code !== 0) {
        console.log(`${colors.red}TypeScript check failed with code ${code}${colors.reset}`);
        console.log(`${colors.yellow}TypeScript errors:${colors.reset}`);
        
        // Format and display errors
        errors.forEach(error => {
          console.log(`  ${colors.red}✗${colors.reset} ${error.trim()}`);
        });
        
        resolve({
          success: false,
          errors
        });
      } else {
        console.log(`${colors.green}TypeScript check passed${colors.reset}`);
        resolve({
          success: true,
          errors: []
        });
      }
    });
  });
};

// Check for package.json issues
const checkPackageJson = () => {
  try {
    const packageJsonPath = path.join(process.cwd(), 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    
    const issues = [];
    
    // Check for React version conflicts
    const reactDeps = [
      packageData.dependencies?.react,
      packageData.dependencies?.['react-dom'],
      packageData.devDependencies?.react,
      packageData.devDependencies?.['react-dom'],
      packageData.resolutions?.react,
      packageData.resolutions?.['react-dom']
    ].filter(Boolean);
    
    if (reactDeps.length > 0 && new Set(reactDeps).size > 1) {
      issues.push({
        category: 'REACT_VERSION_CONFLICT',
        message: `Found multiple React versions: ${reactDeps.join(', ')}`,
        suggestion: 'Ensure all React packages use the same version or specify in resolutions field.'
      });
    }
    
    // Check for missing peerDependencies
    if (!packageData.dependencies && !packageData.devDependencies) {
      issues.push({
        category: 'NO_DEPENDENCIES',
        message: 'No dependencies found in package.json',
        suggestion: 'Run npm install to set up the project properly.'
      });
    }
    
    return {
      issues,
      packageData
    };
  } catch (error) {
    return {
      issues: [{
        category: 'PACKAGE_JSON_ERROR',
        message: `Error reading package.json: ${error.message}`,
        suggestion: 'Verify that package.json exists and is valid JSON.'
      }],
      packageData: null
    };
  }
};

// Run Webpack build with debugging
const runBuildWithDebugging = () => {
  console.log(`\n${colors.blue}${colors.bright}=== PropAgentic Build Debug Tool ===${colors.reset}\n`);
  console.log(`${colors.cyan}Starting enhanced build process with debugging...${colors.reset}\n`);
  
  // First check package.json for issues
  const { issues: packageIssues } = checkPackageJson();
  
  if (packageIssues.length > 0) {
    console.log(`${colors.yellow}Warning: Found ${packageIssues.length} issues in package.json:${colors.reset}`);
    packageIssues.forEach(issue => {
      console.log(`  ${colors.yellow}⚠${colors.reset} ${issue.category}: ${issue.message}`);
      console.log(`     ${colors.cyan}Suggestion: ${issue.suggestion}${colors.reset}`);
    });
    console.log('');
  }
  
  return new Promise((resolve) => {
    // Build with more diagnostic flags
    console.log(`${colors.blue}Starting React build process...${colors.reset}`);
    
    // Set environmental variables for more verbose output
    const env = {
      ...process.env,
      GENERATE_SOURCEMAP: 'true',
      CI: 'false',
      DISABLE_ESLINT_PLUGIN: 'false'
    };
    
    // Run the build command
    const build = spawn('npx', ['react-scripts', 'build'], { 
      env,
      shell: true,
      stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let output = '';
    let errorOutput = '';
    let detectedErrors = [];
    
    build.stdout.on('data', (data) => {
      const str = data.toString();
      output += str;
      process.stdout.write(str);
      
      // Look for error patterns in output
      const errors = identifyErrorPatterns(str);
      if (errors.length > 0) {
        detectedErrors = detectedErrors.concat(errors);
      }
    });
    
    build.stderr.on('data', (data) => {
      const str = data.toString();
      errorOutput += str;
      process.stderr.write(str);
      
      // Look for error patterns in stderr
      const errors = identifyErrorPatterns(str);
      if (errors.length > 0) {
        detectedErrors = detectedErrors.concat(errors);
      }
    });
    
    build.on('close', (code) => {
      console.log('');
      
      if (code !== 0) {
        console.log(`${colors.red}${colors.bright}Build failed with exit code ${code}${colors.reset}\n`);
        
        // Process detected errors
        if (detectedErrors.length > 0) {
          console.log(`${colors.magenta}Detected error categories:${colors.reset}`);
          
          // Group by category and remove duplicates
          const errorsByCategory = {};
          detectedErrors.forEach(error => {
            errorsByCategory[error.category] = error;
          });
          
          Object.values(errorsByCategory).forEach(error => {
            console.log(`  ${colors.red}✗ ${error.category}${colors.reset}`);
            console.log(`    ${colors.cyan}Suggestion: ${error.suggestion}${colors.reset}`);
          });
          
          console.log('');
        }
        
        // Extract error context if available
        const contextInfo = extractErrorContext(output + errorOutput);
        if (contextInfo) {
          console.log(`${colors.magenta}Error location:${colors.reset}`);
          console.log(`  File: ${contextInfo.filePath}`);
          if (contextInfo.line) {
            console.log(`  Line: ${contextInfo.line}${contextInfo.column ? `, Column: ${contextInfo.column}` : ''}`);
          }
          console.log('');
          
          // Try to show the problematic file
          try {
            const fileContent = fs.readFileSync(path.resolve(contextInfo.filePath), 'utf8');
            const lines = fileContent.split('\n');
            
            if (contextInfo.line) {
              const startLine = Math.max(0, contextInfo.line - 3);
              const endLine = Math.min(lines.length, contextInfo.line + 2);
              
              console.log(`${colors.magenta}Code snippet:${colors.reset}`);
              for (let i = startLine; i < endLine; i++) {
                const lineNumber = i + 1;
                const indicator = lineNumber === contextInfo.line ? `${colors.red}>` : ' ';
                console.log(`${indicator} ${lineNumber}: ${lines[i]}${colors.reset}`);
              }
              console.log('');
            }
          } catch (e) {
            // Silently fail if we can't read the file
          }
        }
        
        resolve({
          success: false,
          code,
          detectedErrors
        });
      } else {
        console.log(`${colors.green}${colors.bright}Build completed successfully!${colors.reset}\n`);
        resolve({
          success: true,
          code,
          detectedErrors: []
        });
      }
    });
  });
};

// Main function to run the debug process
const runDebug = async () => {
  // Run TypeScript check first
  const tsResult = await checkTypeScriptErrors();
  
  if (!tsResult.success) {
    console.log(`\n${colors.yellow}Fix TypeScript errors before proceeding with the build.${colors.reset}`);
    console.log(`${colors.cyan}Tip: You can ignore TypeScript errors during build with SKIP_TYPESCRIPT_CHECK=true npm run build${colors.reset}\n`);
    
    const shouldContinue = process.argv.includes('--force') || process.env.SKIP_TYPESCRIPT_CHECK === 'true';
    
    if (!shouldContinue) {
      console.log(`${colors.red}Build aborted due to TypeScript errors.${colors.reset}`);
      console.log(`${colors.cyan}Run with --force flag to continue anyway.${colors.reset}\n`);
      process.exit(1);
    }
    
    console.log(`${colors.yellow}Continuing build despite TypeScript errors...${colors.reset}\n`);
  }
  
  // Run the build with debugging
  const buildResult = await runBuildWithDebugging();
  
  if (!buildResult.success) {
    process.exit(1);
  }
};

// Run the debug process if this script is executed directly
if (require.main === module) {
  runDebug().catch(error => {
    console.error(`${colors.red}Unexpected error:${colors.reset}`, error);
    process.exit(1);
  });
} else {
  // Export functions for use as a module
  module.exports = {
    checkTypeScriptErrors,
    checkPackageJson,
    runBuildWithDebugging,
    runDebug
  };
} 