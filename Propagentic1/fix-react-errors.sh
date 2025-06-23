#!/bin/bash

# This script helps fix common React import/export errors
# that can lead to the "type is invalid -- expected a string..." error

echo "===== FIXING COMMON REACT IMPORT/EXPORT ERRORS ====="

# 1. Make sure all form components export correctly
for file in src/components/onboarding/*Form.js; do
  # Check if component has a default export
  if ! grep -q "export default" "$file"; then
    echo "  - Adding missing 'export default' to $file"
    echo -e "\nexport default $(basename "$file" .js);" >> "$file"
  fi
done

# 2. Ensure index.js is importing React correctly for React 17
if [ -f src/index.js ]; then
  # Ensure React is imported
  if ! grep -q "import React from 'react';" src/index.js; then
    echo "  - Adding missing React import to index.js"
    sed -i.bak '1s/^/import React from "react";\n/' src/index.js
    rm src/index.js.bak
  fi
  
  # Ensure ReactDOM is imported correctly for React 17
  if grep -q "createRoot" src/index.js; then
    echo "  - Replacing createRoot with render in index.js (for React 17)"
    sed -i.bak 's/import ReactDOM from "react-dom\/client";/import ReactDOM from "react-dom";/' src/index.js
    sed -i.bak 's/const root = ReactDOM.createRoot(document.getElementById("root"));//' src/index.js
    sed -i.bak 's/root.render(/ReactDOM.render(/' src/index.js
    rm src/index.js.bak
  fi
fi

# 3. Clear build cache and rebuild
echo "===== REBUILDING APPLICATION ====="
rm -rf build
npm run build

echo "===== DEPLOYING TO FIREBASE ====="
npx firebase deploy --only hosting

echo "===== DEPLOYMENT COMPLETE ====="
echo "Your website is now available at https://propagentic.web.app" 