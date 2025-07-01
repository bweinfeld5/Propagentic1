/**
 * Build Fix Script for PropAgentic
 * 
 * This script:
 * 1. Cleans the build directory
 * 2. Creates a production build
 * 3. Verifies the build output
 * 4. Provides detailed error information
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Path constants
const buildDir = path.join(process.cwd(), 'build');
const publicDir = path.join(process.cwd(), 'public');
const indexHtml = path.join(buildDir, 'index.html');

// Clean function - removes build directory
function cleanBuild() {
  console.log('🧹 Cleaning build directory...');
  
  if (fs.existsSync(buildDir)) {
    try {
      execSync('rm -rf build', { stdio: 'inherit' });
      console.log('✅ Build directory cleaned');
    } catch (error) {
      console.error('❌ Failed to clean build directory:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ No existing build directory found');
  }
}

// Verify public directory
function verifyPublicDir() {
  console.log('🔍 Verifying public directory...');
  
  if (!fs.existsSync(publicDir)) {
    console.error('❌ Public directory not found!');
    process.exit(1);
  }
  
  const publicIndexHtml = path.join(publicDir, 'index.html');
  if (!fs.existsSync(publicIndexHtml)) {
    console.error('❌ index.html not found in public directory!');
    process.exit(1);
  }
  
  const manifestFile = path.join(publicDir, 'manifest.json');
  if (!fs.existsSync(manifestFile)) {
    console.warn('⚠️ manifest.json not found in public directory');
  }
  
  console.log('✅ Public directory verified');
}

// Run the build
function runBuild() {
  console.log('🚀 Building production version...');
  
  try {
    // Use CI=false to prevent treating warnings as errors
    execSync('CI=false npm run build', { 
      stdio: 'inherit', 
      env: { 
        ...process.env, 
        CI: 'false',
        GENERATE_SOURCEMAP: 'false', // Disable source maps for smaller build
        TSC_COMPILE_ON_ERROR: 'true'  // Continue building even with TypeScript errors
      }
    });
    console.log('✅ Build completed');
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Verify build output
function verifyBuild() {
  console.log('🔍 Verifying build output...');
  
  if (!fs.existsSync(buildDir)) {
    console.error('❌ Build directory not created!');
    process.exit(1);
  }
  
  if (!fs.existsSync(indexHtml)) {
    console.error('❌ index.html not found in build directory!');
    console.log('This indicates a serious build problem.');
    process.exit(1);
  }
  
  // Check for static directory or JS/CSS files
  const staticDir = path.join(buildDir, 'static');
  const hasStaticDir = fs.existsSync(staticDir);
  
  const jsFiles = fs.readdirSync(buildDir).filter(file => file.endsWith('.js'));
  const cssFiles = fs.readdirSync(buildDir).filter(file => file.endsWith('.css'));
  
  if (!hasStaticDir && jsFiles.length === 0) {
    console.error('❌ No JavaScript files found in build!');
    console.log('The build process did not generate any JS files.');
    process.exit(1);
  }
  
  console.log('✅ Build verified successfully');
  
  // Print build contents for debugging
  console.log('\n📦 Build directory contents:');
  const buildFiles = fs.readdirSync(buildDir);
  buildFiles.forEach(file => {
    const stats = fs.statSync(path.join(buildDir, file));
    if (stats.isDirectory()) {
      console.log(`  📁 ${file}/`);
    } else {
      console.log(`  📄 ${file}`);
    }
  });
  
  if (hasStaticDir) {
    console.log('\n📦 Static directory contents:');
    const staticFiles = fs.readdirSync(staticDir);
    staticFiles.forEach(file => {
      console.log(`  📁 ${file}/`);
    });
  }
}

// Copy Firebase files if needed
function copyFirebaseFiles() {
  console.log('🔍 Checking for Firebase files...');
  
  // Check for 404.html in public
  const public404 = path.join(publicDir, '404.html');
  const build404 = path.join(buildDir, '404.html');
  
  if (fs.existsSync(public404) && !fs.existsSync(build404)) {
    try {
      fs.copyFileSync(public404, build404);
      console.log('✅ Copied 404.html to build directory');
    } catch (error) {
      console.warn('⚠️ Failed to copy 404.html:', error.message);
    }
  }
  
  // Check for existing firebase.json
  const firebaseJson = path.join(process.cwd(), 'firebase.json');
  if (!fs.existsSync(firebaseJson)) {
    console.warn('⚠️ firebase.json not found in project root');
    console.log('You may need to run firebase init before deploying');
  } else {
    console.log('✅ firebase.json found');
  }
}

// Main function
async function main() {
  console.log('\n🛠️ PropAgentic Build Fix Tool\n');
  
  try {
    cleanBuild();
    verifyPublicDir();
    runBuild();
    verifyBuild();
    copyFirebaseFiles();
    
    console.log('\n✨ Build process completed successfully!');
    console.log('🚀 You can now deploy with: npm run deploy');
  } catch (error) {
    console.error('\n❌ Build process failed:', error.message);
    process.exit(1);
  }
}

// Run the script
main();