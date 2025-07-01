/**
 * Script to automate the migration from direct framer-motion imports to SafeMotion
 * This helps ensure React 19 compatibility
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Config
const rootDir = path.resolve(__dirname, '..');
const componentsDir = path.join(rootDir, 'src', 'components');

// Function to find all files with framer-motion imports
function findFramerMotionImports() {
  try {
    // Use grep to find all files with framer-motion imports
    const grepCommand = `grep -l "import.*from ['\\"]framer-motion['\\"]" --include="*.jsx" --include="*.tsx" --include="*.js" -r "${componentsDir}"`;
    const filesWithImports = execSync(grepCommand, { encoding: 'utf8' }).trim().split('\n');
    
    if (!filesWithImports || filesWithImports[0] === '') {
      console.log('No direct framer-motion imports found!');
      return [];
    }
    
    return filesWithImports;
  } catch (error) {
    console.error('Error finding framer-motion imports:', error.message);
    return [];
  }
}

// Function to migrate a single file
function migrateFile(filePath) {
  try {
    console.log(`Migrating: ${filePath}`);
    
    // Read the file content
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Check if SafeMotion is already imported
    const hasSafeMotionImport = content.includes("import") && content.includes("SafeMotion");
    
    // Find import patterns
    const importRegex = /import\s+{([^}]+)}\s+from\s+['"]framer-motion['"]/g;
    let importMatch;
    let hasMotion = false;
    let hasAnimatePresence = false;
    let otherImports = [];
    
    while ((importMatch = importRegex.exec(content)) !== null) {
      const importItems = importMatch[1].split(',').map(item => item.trim());
      
      importItems.forEach(item => {
        if (item === 'motion') {
          hasMotion = true;
        } else if (item === 'AnimatePresence') {
          hasAnimatePresence = true;
        } else {
          otherImports.push(item);
        }
      });
    }
    
    // Replace motion components with SafeMotion
    if (hasMotion) {
      content = content.replace(/<motion\./g, '<SafeMotion.');
      content = content.replace(/<\/motion\./g, '</SafeMotion.');
    }
    
    // Update imports
    if (hasSafeMotionImport) {
      // If SafeMotion is already imported, update it if needed
      if (hasAnimatePresence && !content.includes('AnimatePresence') && !content.includes('{ SafeMotion, AnimatePresence }')) {
        content = content.replace(
          /import\s+{\s*SafeMotion\s*}\s+from\s+['"]([^'"]+)['"]/,
          'import { SafeMotion, AnimatePresence } from "$1"'
        );
      }
    } else {
      // Add SafeMotion import
      const relativePath = path.relative(path.dirname(filePath), path.join(componentsDir, 'shared')).replace(/\\/g, '/');
      const importPath = relativePath ? relativePath + '/SafeMotion' : '../shared/SafeMotion';
      
      let safeMotionImport;
      if (hasAnimatePresence) {
        safeMotionImport = `import { SafeMotion, AnimatePresence } from "${importPath}";`;
      } else {
        safeMotionImport = `import { SafeMotion } from "${importPath}";`;
      }
      
      // Find a good place to insert the import
      const importLines = content.split('\n').filter(line => line.trim().startsWith('import '));
      if (importLines.length > 0) {
        const lastImportLine = importLines[importLines.length - 1];
        content = content.replace(lastImportLine, lastImportLine + '\n' + safeMotionImport);
      } else {
        content = safeMotionImport + '\n' + content;
      }
    }
    
    // Remove framer-motion imports
    content = content.replace(/import\s+{([^}]+)}\s+from\s+['"]framer-motion['"];?\n?/g, '');
    
    // Write the updated content back to the file
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Successfully migrated: ${filePath}`);
    
    return true;
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

// Main function
function main() {
  console.log('🔍 Finding files with direct framer-motion imports...');
  const files = findFramerMotionImports();
  
  if (files.length === 0) {
    console.log('✅ No files need migration!');
    return;
  }
  
  console.log(`Found ${files.length} files with direct framer-motion imports.`);
  
  let successCount = 0;
  let failCount = 0;
  
  files.forEach(file => {
    const success = migrateFile(file);
    if (success) successCount++;
    else failCount++;
  });
  
  console.log('\n=== Migration Summary ===');
  console.log(`Total files processed: ${files.length}`);
  console.log(`Successfully migrated: ${successCount}`);
  console.log(`Failed migrations: ${failCount}`);
  
  if (failCount > 0) {
    console.log('\n⚠️ Some files could not be automatically migrated. Please check them manually.');
  } else {
    console.log('\n✅ All files successfully migrated to SafeMotion!');
  }
}

// Run the script
main(); 