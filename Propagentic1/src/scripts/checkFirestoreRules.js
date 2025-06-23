// Script to check Firestore rules for mail collection
const fs = require('fs');
const path = require('path');

// Function to read the Firestore rules file
async function checkFirestoreRules() {
  try {
    console.log('Checking Firestore rules for mail collection...');
    
    // Path to the firestore.rules file
    const rulesPath = path.join(__dirname, '../../firestore.rules');
    
    // Check if the file exists
    if (!fs.existsSync(rulesPath)) {
      console.error('Firestore rules file not found at:', rulesPath);
      return;
    }
    
    // Read the rules file
    const rulesContent = fs.readFileSync(rulesPath, 'utf8');
    
    // Check for mail collection rules
    if (rulesContent.includes('match /mail/{document}')) {
      console.log('Found specific rules for mail collection!');
      
      // Extract and print the mail collection rules
      const mailRuleRegex = /match\s+\/mail\/\{[^}]+\}\s*{([^}]*)}/s;
      const match = rulesContent.match(mailRuleRegex);
      
      if (match && match[1]) {
        console.log('Mail collection rules:');
        console.log(match[1].trim());
      } else {
        console.log('Unable to parse mail collection rules');
      }
    } else {
      console.log('No specific rules found for mail collection.');
      console.log('You may need to add rules to allow writing to the mail collection.');
      
      // Suggest rules to add
      console.log('\nSuggested rules to add to firestore.rules:');
      console.log(`
    match /mail/{document} {
      // Allow authenticated users to create mail documents
      allow create: if request.auth != null;
      // Only allow system/admin to read mail documents
      allow read, update, delete: if false;
    }
      `);
    }
    
    // Check for default rules that might apply
    if (rulesContent.includes('match /{document=**}')) {
      console.log('\nFound default rules that might apply to mail collection:');
      const defaultRuleRegex = /match\s+\/\{document=\*\*\}\s*{([^}]*)}/s;
      const defaultMatch = rulesContent.match(defaultRuleRegex);
      
      if (defaultMatch && defaultMatch[1]) {
        console.log('Default rules:');
        console.log(defaultMatch[1].trim());
      }
    }
    
  } catch (error) {
    console.error('Error checking Firestore rules:', error);
  }
}

// Run the function
checkFirestoreRules()
  .then(() => console.log('Done checking Firestore rules.'))
  .catch(err => console.error('Failed to check Firestore rules:', err)); 