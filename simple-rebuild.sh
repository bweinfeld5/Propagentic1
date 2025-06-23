#!/bin/bash

# Stop on error
set -e

echo "===== CLEANING PROJECT THOROUGHLY ====="
# Remove build artifacts, cache, lock file, and node_modules
rm -rf build
rm -rf node_modules
rm -rf package-lock.json
npm cache clean --force
echo "Project cleaned."

echo "===== INSTALLING DEPENDENCIES ====="
# Install dependencies cleanly
npm install --no-fund --no-audit --legacy-peer-deps
echo "Dependencies installed."

echo "===== RUNNING BUILD ====="
# Temporarily disable ESLint during build to avoid potential issues
DISABLE_ESLINT_PLUGIN=true npm run build
echo "Build complete."

echo "===== DEPLOYING TO FIREBASE ====="
# Using the firebase-tools from node_modules to ensure compatibility
npx firebase deploy
echo "Deployment initiated."

echo "===== SCRIPT COMPLETE ====="
echo "Check Firebase console for deployment status."
echo "Your application should eventually be available at https://propagentic.web.app" 