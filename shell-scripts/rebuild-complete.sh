#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


# Stop on error
set -e

echo "===== CLEANING PROJECT ====="
rm -rf node_modules
rm -rf build
rm -rf .firebase/*.cache
rm -rf package-lock.json

echo "===== INSTALLING DEPENDENCIES ====="
npm install

echo "===== RUNNING BUILD ====="
npm run build

echo "===== VERIFYING BUILD ====="
if [ ! -s "build/static/js/main."*.js ]; then
  echo "ERROR: JavaScript build file is empty or missing!"
  exit 1
fi

if [ ! -f "build/index.html" ]; then
  echo "ERROR: index.html is missing from build!"
  exit 1
fi

if ! grep -q "<div id=\"root\"></div>" "build/index.html"; then
  echo "ERROR: root div is missing from index.html!"
  exit 1
fi

echo "===== BUILD SUCCESSFUL ====="
echo "===== DEPLOYING TO FIREBASE ====="

firebase deploy

echo "===== DEPLOYMENT COMPLETE ====="
echo "Your application is now available at https://propagentic.web.app" 