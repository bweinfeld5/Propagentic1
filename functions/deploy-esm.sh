#!/bin/bash
# Script to deploy functions using the ES module approach

set -e # Exit on error

echo "Deploying Firebase functions with ES module approach..."

# Backup current setup if needed
if [ -f "index.js" ]; then
  echo "Backing up CommonJS files..."
  mkdir -p backup
  cp index.js backup/
  cp package.json backup/
  
  # Verify we have the ESM versions
  if [ ! -f "index.mjs" ]; then
    echo "Error: index.mjs not found!"
    exit 1
  fi
fi

# Check if we need to create notificationDelivery.mjs
if [ ! -f "notificationDelivery.mjs" ] && [ -f "notificationDelivery.js" ]; then
  echo "Creating ESM version of notificationDelivery.js..."
  
  # Create a simple default export wrapper for the existing file
  cat > notificationDelivery.mjs << EOF
/**
 * ES Module wrapper for notificationDelivery.js
 */
import notificationDeliveryFunctions from './notificationDelivery.js';
export default notificationDeliveryFunctions;
EOF
fi

# Deploy with extended timeout
echo "Deploying with extended timeout..."
export FUNCTIONS_DISCOVERY_TIMEOUT=60
firebase deploy --only functions

echo "Deployment completed!" 