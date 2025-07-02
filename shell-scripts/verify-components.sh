#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


echo "===== VERIFYING REACT COMPONENT IMPORTS/EXPORTS ====="

# Check each component file
for file in src/components/onboarding/*Form.js; do
  echo "Checking $file..."
  
  # Check for React import
  if ! grep -q "import React" "$file"; then
    echo "  - WARNING: Missing React import in $file"
  fi
  
  # Check for default export
  if ! grep -q "export default" "$file"; then
    echo "  - ERROR: Missing default export in $file"
    echo "    Adding export default statement..."
    component_name=$(basename "$file" .js)
    echo -e "\nexport default $component_name;" >> "$file"
    echo "    Fixed $file"
  fi
done

# Check OnboardingSelector imports
selector_file="src/components/onboarding/OnboardingSelector.js"
echo "Checking $selector_file..."

# Check for .js extensions in imports (should be avoided in React)
if grep -q "from '\.\/.*\.js'" "$selector_file"; then
  echo "  - WARNING: Found .js extensions in imports which can cause issues"
  echo "    Removing .js extensions from imports..."
  sed -i.bak "s/from '\.\(.*\)\.js'/from '\.\1'/g" "$selector_file"
  rm "${selector_file}.bak"
  echo "    Fixed $selector_file"
fi

echo "===== VERIFICATION COMPLETE ====="
echo "Next steps:"
echo "1. Run 'npm run build' to rebuild the application"
echo "2. Run 'firebase deploy --only hosting' to deploy the fixed application" 