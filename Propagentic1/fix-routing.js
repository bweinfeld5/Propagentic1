/**
 * Script to update Firebase hosting configuration
 * This adds a redirect from /signup to /register
 */

const fs = require('fs');
const path = require('path');

// Path to firebase.json
const firebaseConfigPath = path.join(__dirname, 'firebase.json');

// Read the existing firebase.json file
try {
  const firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, 'utf8'));
  
  // Check if hosting configuration exists
  if (!firebaseConfig.hosting) {
    firebaseConfig.hosting = {
      public: "build",
      ignore: [
        "firebase.json",
        "**/.*",
        "**/node_modules/**"
      ],
      rewrites: []
    };
  }
  
  // Ensure rewrites array exists
  if (!firebaseConfig.hosting.rewrites) {
    firebaseConfig.hosting.rewrites = [];
  }
  
  // Find if we already have a catchall rewrite
  const catchAllRewrite = firebaseConfig.hosting.rewrites.find(
    rewrite => rewrite.source === "**"
  );
  
  // If we have a catchall, it should already handle routing properly
  // Otherwise, we need to add a specific rewrite for /signup
  if (!catchAllRewrite) {
    // Add specific rewrite for /signup to /index.html
    const signupRewrite = firebaseConfig.hosting.rewrites.find(
      rewrite => rewrite.source === "/signup"
    );
    
    if (!signupRewrite) {
      firebaseConfig.hosting.rewrites.push({
        source: "/signup",
        destination: "/index.html"
      });
      console.log('Added rewrite rule for /signup');
    }
  } else {
    console.log('Catchall rewrite already exists, no changes needed');
  }
  
  // Write the updated configuration back to firebase.json
  fs.writeFileSync(firebaseConfigPath, JSON.stringify(firebaseConfig, null, 2));
  console.log('Firebase configuration updated successfully');
  
} catch (error) {
  console.error('Error updating Firebase configuration:', error);
  process.exit(1);
} 