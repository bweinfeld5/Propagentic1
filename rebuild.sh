#!/bin/bash
echo "Cleaning build cache..."
rm -rf build
rm -rf node_modules/.cache

echo "Reinstalling dependencies..."
npm ci

echo "Building the application..."
npm run build

echo "Deploying to Firebase..."
firebase deploy --only hosting

echo "Done! Your application should now be deployed without the createRoot error." 