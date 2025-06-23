#!/bin/bash
# Script to deploy functions without timeout issues

set -e # Exit on error

echo "Deploying Firebase functions with timeout fix..."

# Step 1: Backup original index.js
echo "Backing up original index.js..."
cp index.js index.js.backup

# Step 2: Replace with minimal deployment file
echo "Replacing with minimal deployment file..."
cp minimal-deployment.js index.js

# Step 3: Deploy functions
echo "Deploying functions..."
firebase deploy --only functions

# Step 4: Restore original index.js
echo "Restoring original index.js..."
mv index.js.backup index.js

echo "Deployment completed successfully!"
echo "Your original index.js has been restored." 