#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing Firebase CLI..."
    npm install -g firebase-tools
else
    echo "Firebase CLI already installed."
fi

# Check if user is logged in to Firebase
firebase login --interactive

# Navigate to functions directory
cd functions

# Install dependencies if needed
echo "Installing dependencies..."
npm install

# Deploy only functions
echo "Deploying Firebase function..."
firebase deploy --only functions:classifyMaintenanceRequest

echo "Deployment complete! Your function should now be active." 