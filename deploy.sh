#!/bin/bash

# Check if Firebase CLI is installed
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing Firebase CLI..."
    npm install -g firebase-tools
else
    echo "Firebase CLI already installed."
fi

# Check if user is logged in to Firebase
firebase login --interactive

# Deploy only hosting
echo "Building and deploying app to Firebase hosting..."
npm run deploy

echo "Deployment complete! Your app should be live at https://propagentic.firebaseapp.com" 