#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


# Stop on error
set -e

echo "===== CLEANING FUNCTIONS NODE_MODULES ====="
rm -rf functions/node_modules
rm -rf functions/package-lock.json

echo "===== INSTALLING FUNCTIONS DEPENDENCIES ====="
cd functions
npm install

echo "===== DEPLOYING FUNCTIONS ====="
npx firebase deploy --only functions

echo "===== FUNCTIONS DEPLOYMENT COMPLETE ====="
echo "Your Cloud Functions should now be available." 