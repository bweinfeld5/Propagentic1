#!/bin/bash

# Stop on any error
set -e

echo "===== FIXING PACKAGE.JSON ====="
# Replace the corrupted package.json with our clean one
cp new-package.json package.json
echo "package.json fixed!"

echo "===== CLEANING UP ====="
rm -rf build node_modules/.cache

echo "===== INSTALLING DEPENDENCIES ====="
npm install

echo "===== BUILDING APPLICATION ====="
npm run build

echo "===== DEPLOYING TO FIREBASE ====="
firebase deploy --only hosting

echo "===== DEPLOYMENT COMPLETE ====="
echo "Your application should now be available at https://propagentic.web.app" 