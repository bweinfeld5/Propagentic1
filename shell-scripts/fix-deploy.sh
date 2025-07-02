#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


# Stop on any error
set -e

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