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
