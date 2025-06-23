#!/bin/bash

# Firebase Test Setup Script
# This script sets up Firebase emulators with test data for notifications

echo "==============================================="
echo "Propagentic - Firebase Test Environment Setup"
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
      "address": "123 Test Street",
      "owner": "landlord1",
      "tenants": ["tenant1"],
      "maintenanceRequests": ["request1"]
    },
    "property2": {
      "id": "property2",
      "address": "456 Sample Avenue",
      "owner": "landlord1",
      "tenants": []
    }
  }
}
EOF

# Create test maintenance requests
cat > ./test-data/maintenance.json << EOF
{
  "maintenanceRequests": {
    "request1": {
      "id": "request1",
      "title": "Leaking Faucet",
      "description": "The kitchen faucet has been leaking for two days",
      "status": "new",
      "priority": "medium",
      "property": "property1",
      "createdBy": "tenant1",
      "createdAt": "2023-07-15T10:30:00Z",
      "category": null,
      "assignedTo": null
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
      "recipient": "landlord1",
      "type": "maintenance_request",
      "title": "New Maintenance Request",
      "content": "A tenant has submitted a new maintenance request for 123 Test Street",
      "relatedEntityId": "request1",
      "relatedEntityType": "maintenanceRequest",
      "isRead": false,
      "isArchived": false,
      "createdAt": "2023-07-15T10:35:00Z",
      "actions": [
        {
          "type": "view",
          "label": "View Request",
          "url": "/maintenance/request1"
        }
      ]
    },
    "notification2": {
      "id": "notification2",
      "recipient": "tenant1",
      "type": "maintenance_status",
      "title": "Maintenance Request Update",
      "content": "Your request for 'Leaking Faucet' has been received and is being processed",
      "relatedEntityId": "request1",
      "relatedEntityType": "maintenanceRequest",
      "isRead": true,
      "isArchived": false,
      "createdAt": "2023-07-15T10:40:00Z",
      "actions": [
        {
          "type": "view",
          "label": "View Request",
          "url": "/maintenance/request1"
        }
      ]
    },
    "notification3": {
      "id": "notification3",
      "recipient": "contractor1",
      "type": "job_match",
      "title": "New Job Match",
      "content": "You have been matched to a new plumbing job at 123 Test Street",
      "relatedEntityId": "request1",
      "relatedEntityType": "maintenanceRequest",
      "isRead": false,
      "isArchived": false,
      "createdAt": "2023-07-15T11:00:00Z",
      "actions": [
        {
          "type": "accept",
          "label": "Accept Job",
          "url": "/jobs/accept/request1"
        },
        {
          "type": "decline",
          "label": "Decline",
          "url": "/jobs/decline/request1"
        }
      ]
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
const maintenanceRequests = JSON.parse(fs.readFileSync(path.join(__dirname, 'maintenance.json'), 'utf8')).maintenanceRequests;
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
    const requestRef = db.collection('maintenanceRequests').doc(key);
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

# Install dependencies for the import script
echo "Installing dependencies for the import script..."
cd test-data
npm init -y
npm install firebase-admin
cd ..

# Start emulators with data import
echo "==============================================="
echo "Starting Firebase emulators with test data..."
echo "==============================================="
echo ""
echo "This will start the Firebase emulators and import test data."
echo "The emulators provide:"
echo "- Firestore database with test users, properties, and notifications"
echo "- Cloud Functions for testing notification triggers"
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
echo "Press Enter to start emulators or Ctrl+C to cancel..."
read -r

# Start emulators and import data
firebase emulators:start --import=./test-data 