#!/bin/bash

# Stop on error
set -e

echo "===== CLEANING BUILD FILES ====="
rm -rf build
npm cache clean --force

echo "===== BUILDING REACT APP ====="
DISABLE_ESLINT_PLUGIN=true npm run build

echo "===== DEPLOYING ONLY HOSTING ====="
npx firebase deploy --only hosting

echo "===== HOSTING DEPLOYMENT COMPLETE ====="
echo "Your website is now available at https://propagentic.web.app"
echo ""
echo "Note: Firebase Functions were not deployed."
echo "Run './deploy-functions.sh' separately to deploy the functions." 