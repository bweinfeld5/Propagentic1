#!/bin/bash

# Navigate to project root directory
cd "$(dirname "$0")/.."


# Firebase Emulator Setup Script with Simplified Functions
# This script sets up and runs Firebase emulators with simplified functions for testing

echo "==============================================="
echo "Propagentic - Firebase Emulator Setup (Simplified for Testing)"
echo "==============================================="

# Check for Firebase CLI
if ! command -v firebase &> /dev/null; then
  echo "Firebase CLI not found. Please install it using:"
  echo "npm install -g firebase-tools"
  exit 1
fi

# Make sure we have the emulators configured
if [ ! -f "firebase.json" ]; then
  echo "firebase.json not found. Initializing Firebase emulators..."
  firebase init emulators
fi

# Create temporary simplified functions directory
echo "Setting up simplified functions for testing..."
mkdir -p ./temp-functions

# Copy package.json to temporary functions folder
if [ -f "./functions/package.json" ]; then
  cp ./functions/package.json ./temp-functions/
fi

# Copy the simplified functions index file
if [ -f "./functions/simplified-index.js" ]; then
  cp ./functions/simplified-index.js ./temp-functions/index.js
else
  echo "Error: simplified-index.js not found. Please create this file first."
  exit 1
fi

# Install dependencies for the simplified functions
echo "Installing dependencies for simplified functions..."
cd ./temp-functions
npm install firebase-functions firebase-admin
cd ..

# Create test data directory if it doesn't exist
if [ ! -d "./test-data" ]; then
  mkdir -p ./test-data
fi

# Create test users data
cat > ./test-data/users.json << EOF
{
  "users": {
    "landlord1": {
      "uid": "landlord1",
      "email": "landlord@test.com",
      "displayName": "Test Landlord",
      "role": "landlord",
      "properties": ["property1", "property2"],
      "notificationPreferences": {
        "email": true,
        "push": true,
        "categories": {
          "maintenance": true,
          "payments": true,
          "tenants": true,
          "contractors": true
        }
      }
    },
    "tenant1": {
      "uid": "tenant1",
      "email": "tenant@test.com",
      "displayName": "Test Tenant",
      "role": "tenant",
      "properties": ["property1"],
      "notificationPreferences": {
        "email": true,
        "push": true,
        "categories": {
          "maintenance": true,
          "payments": true,
          "property": true
        }
      }
    },
    "contractor1": {
      "uid": "contractor1",
      "email": "contractor@test.com",
      "displayName": "Test Contractor",
      "role": "contractor",
      "specialties": ["plumbing", "electrical"],
      "notificationPreferences": {
        "email": true,
        "push": true,
        "categories": {
          "jobs": true,
          "payments": true
        }
      }
    }
  }
}
EOF

# Create test properties data
cat > ./test-data/properties.json << EOF
{
  "properties": {
    "property1": {
      "id": "property1",
      "address": {
        "street": "123 Test Street",
        "city": "Test City",
        "state": "TS",
        "zip": "12345"
      },
      "propertyName": "Test Property",
      "owner": "landlord1",
      "tenants": ["tenant1"],
      "maintenanceRequests": ["request1"]
    },
    "property2": {
      "id": "property2",
      "address": {
        "street": "456 Sample Avenue",
        "city": "Test City",
        "state": "TS",
        "zip": "12345"
      },
      "propertyName": "Sample Property",
      "owner": "landlord1",
      "tenants": []
    }
  }
}
EOF

# Create test maintenance requests
cat > ./test-data/maintenance.json << EOF
{
  "tickets": {
    "request1": {
      "id": "request1",
      "propertyId": "property1",
      "unitNumber": "101",
      "submittedBy": "tenant1",
      "description": "The kitchen faucet has been leaking for two days",
      "status": "new",
      "priority": "medium",
      "category": null,
      "createdAt": "2023-07-15T10:30:00Z",
      "assignedTo": null,
      "notified": true
    }
  }
}
EOF

# Create test notifications
cat > ./test-data/notifications.json << EOF
{
  "notifications": {
    "notification1": {
      "id": "notification1",
      "userId": "landlord1",
      "userRole": "landlord",
      "type": "maintenance_request",
      "title": "New Maintenance Request",
      "message": "A tenant has submitted a new maintenance request for 123 Test Street",
      "data": {
        "ticketId": "request1",
        "propertyId": "property1",
        "unitNumber": "101"
      },
      "read": false,
      "createdAt": "2023-07-15T10:35:00Z"
    },
    "notification2": {
      "id": "notification2",
      "userId": "tenant1",
      "userRole": "tenant",
      "type": "maintenance_status",
      "title": "Maintenance Request Update",
      "message": "Your request for 'Leaking Faucet' has been received and is being processed",
      "data": {
        "ticketId": "request1",
        "propertyId": "property1",
        "unitNumber": "101",
        "status": "new"
      },
      "read": true,
      "createdAt": "2023-07-15T10:40:00Z"
    },
    "notification3": {
      "id": "notification3",
      "userId": "contractor1",
      "userRole": "contractor",
      "type": "job_match",
      "title": "New Job Match",
      "message": "You have been matched to a new plumbing job at 123 Test Street",
      "data": {
        "ticketId": "request1",
        "propertyId": "property1",
        "unitNumber": "101",
        "category": "plumbing"
      },
      "read": false,
      "createdAt": "2023-07-15T11:00:00Z"
    }
  }
}
EOF

# Create import script
cat > ./test-data/import.js << EOF
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize the app with a service account
admin.initializeApp({
  projectId: 'demo-propagentic'
});

const db = admin.firestore();

// Read JSON files
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json'), 'utf8')).users;
const properties = JSON.parse(fs.readFileSync(path.join(__dirname, 'properties.json'), 'utf8')).properties;
const maintenanceRequests = JSON.parse(fs.readFileSync(path.join(__dirname, 'maintenance.json'), 'utf8')).tickets;
const notifications = JSON.parse(fs.readFileSync(path.join(__dirname, 'notifications.json'), 'utf8')).notifications;

// Import data
async function importData() {
  const batch = db.batch();
  
  // Import users
  Object.keys(users).forEach(key => {
    const userRef = db.collection('users').doc(key);
    batch.set(userRef, users[key]);
  });
  
  // Import properties
  Object.keys(properties).forEach(key => {
    const propertyRef = db.collection('properties').doc(key);
    batch.set(propertyRef, properties[key]);
  });
  
  // Import maintenance requests
  Object.keys(maintenanceRequests).forEach(key => {
    const requestRef = db.collection('tickets').doc(key);
    batch.set(requestRef, maintenanceRequests[key]);
  });
  
  // Import notifications
  Object.keys(notifications).forEach(key => {
    const notificationRef = db.collection('notifications').doc(key);
    batch.set(notificationRef, notifications[key]);
  });
  
  // Commit the batch
  await batch.commit();
  console.log('Test data imported successfully');
  process.exit(0);
}

importData().catch(error => {
  console.error('Error importing data:', error);
  process.exit(1);
});
EOF

# Install dependencies for the import script if needed
if [ ! -d "./test-data/node_modules" ]; then
  echo "Installing dependencies for the import script..."
  cd test-data
  npm init -y > /dev/null
  npm install firebase-admin > /dev/null
  cd ..
fi

# Create temporary firebase.json file for simplified setup
cat > firebase-temp.json << EOF
{
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "functions": {
    "source": "temp-functions"
  },
  "hosting": {
    "public": "build",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ]
  },
  "emulators": {
    "auth": {
      "port": 9099
    },
    "functions": {
      "port": 5001
    },
    "firestore": {
      "port": 8080
    },
    "hosting": {
      "port": 5000
    },
    "ui": {
      "enabled": true
    }
  }
}
EOF

# Kill any running emulators
echo "Stopping any running emulators..."
npx kill-port 9099 5001 8080 5000 > /dev/null 2>&1

# Start emulators with temporary configuration and data import
echo "==============================================="
echo "Starting Firebase emulators with simplified functions..."
echo "==============================================="
echo ""
echo "This will start the Firebase emulators with simplified functions and test data."
echo "The emulators provide:"
echo "- Firestore database with test users, properties, and notifications"
echo "- Simplified Cloud Functions for testing notifications"
echo "- Authentication for testing user roles"
echo ""
echo "To test the app with this data:"
echo "1. In a separate terminal, start the React app with: npm start"
echo "2. Use one of the test users to log in:"
echo "   - Landlord: landlord@test.com"
echo "   - Tenant: tenant@test.com"
echo "   - Contractor: contractor@test.com"
echo "   (Password for all test users: password123)"
echo ""
echo "Available simplified functions for testing:"
echo "- createTestNotification: Create test notifications manually"
echo "- markNotificationRead: Mark notifications as read"
echo "- getUserNotifications: Get notifications for a user"
echo "- createTestMaintenanceRequest: Create test maintenance requests"
echo ""
echo "Press Enter to start emulators or Ctrl+C to cancel..."
read -r

# Start emulators with simplified configuration
firebase emulators:start --config=firebase-temp.json --import=./test-data

# Clean up temporary files when emulators are stopped
echo "Cleaning up temporary files..."
rm -f firebase-temp.json
rm -rf ./temp-functions 