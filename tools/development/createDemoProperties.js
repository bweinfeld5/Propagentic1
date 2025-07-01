/**
 * Script to create demo properties in Firestore
 * Run with: node scripts/createDemoProperties.js
 */

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, query, where, getDocs, serverTimestamp } = require('firebase/firestore');

// Import the invite code generator (need to inline since it's ES module)
const generateInviteCode = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  
  // Ensure first character is a letter for better readability
  result += chars.charAt(Math.floor(Math.random() * 26));
  
  // Generate remaining 7 characters
  for (let i = 1; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
};

const generateUniqueInviteCode = async (checkExistence, maxAttempts = 10) => {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const code = generateInviteCode();
    const exists = await checkExistence(code);
    
    if (!exists) {
      return code;
    }
  }
  
  throw new Error(`Failed to generate unique invite code after ${maxAttempts} attempts`);
};

// Firebase configuration - use your actual config
const firebaseConfig = {
  apiKey: "AIzaSyDcsJWLoVoC_kPORoVJA_-mG3LIWfbU-rw",
  authDomain: "propagentic.firebaseapp.com",
  projectId: "propagentic",
  storageBucket: "propagentic.firebasestorage.app",
  messagingSenderId: "121286300748",
  appId: "1:121286300748:web:0c69ea6ff643c8f75110e9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Check if an invite code already exists in the database
 */
const checkInviteCodeExists = async (code) => {
  const q = query(collection(db, 'properties'), where('inviteCode', '==', code));
  const snapshot = await getDocs(q);
  return !snapshot.empty;
};

/**
 * Demo properties data
 */
const demoProperties = [
  {
    id: 'demo-luxury-highrise',
    name: 'Skyline Towers - Unit 2401',
    description: 'Luxury high-rise apartment in downtown San Francisco with stunning city views',
    type: 'Apartment',
    address: {
      street: '123 Market Street',
      unit: 'Unit 2401',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      full: '123 Market Street, Unit 2401, San Francisco, CA 94105'
    },
    landlordId: 'demo-landlord-1',
    landlordName: 'Sarah Wilson',
    landlordEmail: 'sarah.wilson@demo.com',
    amenities: ['Gym', 'Pool', 'Concierge', 'Rooftop Deck', 'Parking'],
    rent: 4500,
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    petPolicy: 'Small pets allowed',
    isDemo: true,
    preferredCode: 'DEMO2024'
  },
  {
    id: 'demo-family-home',
    name: 'Maple Street Family Home',
    description: 'Charming single-family home in Palo Alto with garden and garage',
    type: 'House',
    address: {
      street: '456 Maple Street',
      city: 'Palo Alto',
      state: 'CA',
      zipCode: '94301',
      full: '456 Maple Street, Palo Alto, CA 94301'
    },
    landlordId: 'demo-landlord-2',
    landlordName: 'Michael Chen',
    landlordEmail: 'michael.chen@demo.com',
    amenities: ['Garden', 'Garage', 'Fireplace', 'Hardwood Floors'],
    rent: 5500,
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1800,
    petPolicy: 'Pets welcome',
    isDemo: true,
    preferredCode: 'FAMILY01'
  },
  {
    id: 'demo-student-housing',
    name: 'University Commons - Room 312',
    description: 'Modern student housing near UC Berkeley campus',
    type: 'Student Housing',
    address: {
      street: '789 University Ave',
      unit: 'Room 312',
      city: 'Berkeley',
      state: 'CA',
      zipCode: '94720',
      full: '789 University Ave, Room 312, Berkeley, CA 94720'
    },
    landlordId: 'demo-landlord-3',
    landlordName: 'Property Management Inc.',
    landlordEmail: 'management@demo.com',
    amenities: ['Study Rooms', 'WiFi', 'Laundry', 'Security'],
    rent: 1200,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 400,
    petPolicy: 'No pets',
    isDemo: true,
    preferredCode: 'STUDENT1'
  },
  {
    id: 'demo-urban-loft',
    name: 'Industrial Loft - Unit 5B',
    description: 'Converted industrial loft in Oakland with exposed brick and high ceilings',
    type: 'Loft',
    address: {
      street: '321 Industrial Blvd',
      unit: 'Unit 5B',
      city: 'Oakland',
      state: 'CA',
      zipCode: '94607',
      full: '321 Industrial Blvd, Unit 5B, Oakland, CA 94607'
    },
    landlordId: 'demo-landlord-4',
    landlordName: 'Urban Properties LLC',
    landlordEmail: 'urban@demo.com',
    amenities: ['Exposed Brick', 'High Ceilings', 'Artist Space', 'Bike Storage'],
    rent: 3200,
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 900,
    petPolicy: 'Cats allowed',
    isDemo: true,
    preferredCode: 'LOFT2024'
  },
  {
    id: 'demo-budget-friendly',
    name: 'Affordable Gardens - Apt 12C',
    description: 'Budget-friendly apartment complex with community amenities',
    type: 'Apartment',
    address: {
      street: '654 Garden Way',
      unit: 'Apt 12C',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95112',
      full: '654 Garden Way, Apt 12C, San Jose, CA 95112'
    },
    landlordId: 'demo-landlord-5',
    landlordName: 'Community Housing Corp',
    landlordEmail: 'community@demo.com',
    amenities: ['Pool', 'Playground', 'Community Garden', 'On-site Maintenance'],
    rent: 2200,
    bedrooms: 2,
    bathrooms: 1,
    squareFeet: 800,
    petPolicy: 'Small pets with deposit',
    isDemo: true,
    preferredCode: 'BUDGET99'
  }
];

/**
 * Create demo properties in Firestore
 */
const createDemoProperties = async () => {
  console.log('🏗️  Creating demo properties in Firestore...');
  
  try {
    for (const propertyData of demoProperties) {
      console.log(`\n📋 Processing: ${propertyData.name}`);
      
      // Try to use preferred code first, otherwise generate unique one
      let inviteCode;
      try {
        const codeExists = await checkInviteCodeExists(propertyData.preferredCode);
        if (!codeExists) {
          inviteCode = propertyData.preferredCode;
          console.log(`✅ Using preferred code: ${inviteCode}`);
        } else {
          console.log(`⚠️  Preferred code ${propertyData.preferredCode} already exists, generating new one...`);
          inviteCode = await generateUniqueInviteCode(checkInviteCodeExists);
          console.log(`🎲 Generated unique code: ${inviteCode}`);
        }
      } catch (error) {
        console.log(`❌ Error with preferred code, generating random: ${error.message}`);
        inviteCode = await generateUniqueInviteCode(checkInviteCodeExists);
        console.log(`🎲 Generated unique code: ${inviteCode}`);
      }
      
      // Remove preferred code from data
      const { preferredCode, ...cleanPropertyData } = propertyData;
      
      // Create property document
      const propertyDoc = {
        ...cleanPropertyData,
        inviteCode,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        status: 'active',
        tenantIds: [], // Initialize empty tenant list
        maintenanceRequests: [], // Initialize empty maintenance requests list
        features: {
          furnished: false,
          parking: propertyData.amenities.includes('Parking') || propertyData.amenities.includes('Garage'),
          laundry: propertyData.amenities.includes('Laundry'),
          airConditioning: true,
          heating: true
        }
      };
      
      // Save to Firestore
      const docRef = doc(db, 'properties', propertyData.id);
      await setDoc(docRef, propertyDoc);
      
      console.log(`✅ Created property: ${propertyData.name} with code: ${inviteCode}`);
    }
    
    console.log('\n🎉 All demo properties created successfully!');
    console.log('\n📝 Demo codes created:');
    
    // List all demo properties with their codes
    const demoQuery = query(collection(db, 'properties'), where('isDemo', '==', true));
    const demoSnapshot = await getDocs(demoQuery);
    
    demoSnapshot.forEach(doc => {
      const data = doc.data();
      console.log(`  ${data.inviteCode} - ${data.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error creating demo properties:', error);
    process.exit(1);
  }
  
  process.exit(0);
};

// Run the script
createDemoProperties(); 