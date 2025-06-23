#!/bin/bash

# Build and deploy script for authentication updates
echo "🔒 Starting authentication system deployment..."

# Check for Firebase CLI
if ! command -v firebase &> /dev/null; then
    echo "Firebase CLI not found. Installing Firebase CLI..."
    npm install -g firebase-tools
else
    echo "Firebase CLI already installed."
fi

# Clean up and install dependencies
echo "📦 Cleaning up and installing dependencies..."
npm cache clean --force
rm -rf node_modules
npm install

# Build the project
echo "🏗️ Building the project..."
npm run build

# Deploy to Firebase
echo "🚀 Deploying to Firebase..."
firebase deploy --only hosting

echo "✅ Authentication improvements deployed successfully!"
echo "You can now test the enhanced signup form at https://propagentic.firebaseapp.com/signup" 