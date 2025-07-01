const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Get a list of all JS/JSX/TS/TSX files
try {
  const files = execSync('find ./src -type f -name "*.js" -o -name "*.jsx" -o -name "*.ts" -o -name "*.tsx"', 
    { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);

  console.log(`Found ${files.length} files to scan.`);
  
  // Look for problematic imports
  let problemFiles = [];
  
  files.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const firstLine = content.split('\n')[0];
      
      if (firstLine.includes('react-refresh') || firstLine.includes('/runtime.js')) {
        problemFiles.push({ file, firstLine });
      }
    } catch (error) {
      console.error(`Error reading file ${file}:`, error.message);
    }
  });
  
  if (problemFiles.length > 0) {
    console.log(`\nFound ${problemFiles.length} files with potential react-refresh imports:`);
    problemFiles.forEach(({ file, firstLine }) => {
      console.log(`\n${file}:`);
      console.log(`  ${firstLine}`);
    });
    
    console.log('\nThese files might be causing the build errors.');
  } else {
    console.log('\nNo explicit imports found. This suggests the imports are being injected by a build tool.');
  }
} catch (error) {
  console.error('Error scanning files:', error);
} 