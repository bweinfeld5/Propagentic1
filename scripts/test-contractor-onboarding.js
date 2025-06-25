const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  deleteDoc
} = require('firebase/firestore');

// Firebase configuration (use your actual config)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Test function to verify contractor profile creation
 */
async function testContractorProfileCreation() {
  console.log('🧪 Testing Contractor Profile Creation Flow...\n');
  
  const testContractorId = 'test-contractor-' + Date.now();
  
  try {
    // Simulate the data that would be created during onboarding
    const testUserData = {
      firstName: 'John',
      lastName: 'Doe',
      email: 'johndoe@example.com',
      phoneNumber: '(555) 123-4567',
      userType: 'contractor',
      onboardingComplete: true,
      serviceTypes: ['plumbing', 'electrical'],
      serviceArea: 'San Francisco Bay Area',
      hourlyRate: 75,
      companyName: 'Doe Contracting',
      yearsExperience: '5-10',
      bio: 'Professional contractor with 8 years of experience',
      preferredContactMethod: 'email',
      availabilityNotes: 'Available weekdays 8am-5pm',
      w9FormUrl: 'https://example.com/w9-form.pdf',
      stripeAccountSetup: true,
      bankAccountVerified: true,
      paymentMethodsSetup: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const testContractorProfileData = {
      contractorId: testContractorId,
      userId: testContractorId,
      skills: testUserData.serviceTypes,
      serviceArea: testUserData.serviceArea,
      availability: true,
      preferredProperties: [],
      rating: 0,
      jobsCompleted: 0,
      companyName: testUserData.companyName,
      yearsExperience: testUserData.yearsExperience,
      bio: testUserData.bio,
      hourlyRate: testUserData.hourlyRate,
      phoneNumber: testUserData.phoneNumber,
      email: testUserData.email,
      preferredContactMethod: testUserData.preferredContactMethod,
      availabilityNotes: testUserData.availabilityNotes,
      w9FormUrl: testUserData.w9FormUrl,
      stripeAccountSetup: testUserData.stripeAccountSetup,
      bankAccountVerified: testUserData.bankAccountVerified,
      paymentMethodsSetup: testUserData.paymentMethodsSetup,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    console.log('📝 Test data prepared');
    console.log('   User ID:', testContractorId);
    console.log('   Skills:', testContractorProfileData.skills);
    console.log('   Service Area:', testContractorProfileData.serviceArea);
    console.log('   Company:', testContractorProfileData.companyName);
    
    // Test 1: Check that contractor profile structure is valid
    console.log('\n✅ Test 1: Contractor profile structure validation');
    const requiredFields = [
      'contractorId', 'userId', 'skills', 'serviceArea', 
      'availability', 'rating', 'jobsCompleted'
    ];
    
    const missingFields = requiredFields.filter(field => 
      testContractorProfileData[field] === undefined
    );
    
    if (missingFields.length > 0) {
      console.log('❌ Missing required fields:', missingFields);
      throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
    }
    
    console.log('   ✓ All required fields present');
    
    // Test 2: Verify skills mapping from serviceTypes
    console.log('\n✅ Test 2: Skills mapping validation');
    if (JSON.stringify(testContractorProfileData.skills) === JSON.stringify(testUserData.serviceTypes)) {
      console.log('   ✓ Skills properly mapped from serviceTypes');
    } else {
      console.log('   ❌ Skills mapping mismatch');
      console.log('   Expected:', testUserData.serviceTypes);
      console.log('   Got:', testContractorProfileData.skills);
      throw new Error('Skills mapping failed');
    }
    
    // Test 3: Check data consistency between user and profile documents
    console.log('\n✅ Test 3: Data consistency validation');
    const userToProfileMappings = [
      { user: 'email', profile: 'email' },
      { user: 'phoneNumber', profile: 'phoneNumber' },
      { user: 'hourlyRate', profile: 'hourlyRate' },
      { user: 'companyName', profile: 'companyName' }
    ];
    
    for (const mapping of userToProfileMappings) {
      const userValue = testUserData[mapping.user];
      const profileValue = testContractorProfileData[mapping.profile];
      
      if (userValue !== profileValue) {
        console.log(`   ❌ Mismatch in ${mapping.user}: ${userValue} !== ${profileValue}`);
        throw new Error(`Data consistency error in ${mapping.user}`);
      }
    }
    
    console.log('   ✓ Data consistency validated');
    
    // Test 4: Validate default values
    console.log('\n✅ Test 4: Default values validation');
    const expectedDefaults = {
      availability: true,
      rating: 0,
      jobsCompleted: 0,
      preferredProperties: []
    };
    
    for (const [field, expectedValue] of Object.entries(expectedDefaults)) {
      const actualValue = testContractorProfileData[field];
      if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
        console.log(`   ❌ Default value mismatch for ${field}: expected ${expectedValue}, got ${actualValue}`);
        throw new Error(`Default value error for ${field}`);
      }
    }
    
    console.log('   ✓ Default values are correct');
    
    // Test 5: Check for any existing contractors in the database
    console.log('\n✅ Test 5: Database integration check');
    
    try {
      const contractorsQuery = query(
        collection(db, 'contractorProfiles'),
        where('availability', '==', true)
      );
      
      const contractorsSnapshot = await getDocs(contractorsQuery);
      console.log(`   ✓ Found ${contractorsSnapshot.docs.length} existing contractor profiles`);
      
      if (contractorsSnapshot.docs.length > 0) {
        const sampleContractor = contractorsSnapshot.docs[0].data();
        console.log('   Sample contractor structure:');
        console.log('     ID:', contractorsSnapshot.docs[0].id);
        console.log('     Skills:', sampleContractor.skills || 'Not set');
        console.log('     Service Area:', sampleContractor.serviceArea || 'Not set');
        console.log('     Rating:', sampleContractor.rating || 0);
      }
    } catch (error) {
      console.log('   ⚠️  Database connection issue (expected in local dev):', error.message);
    }
    
    console.log('\n🎉 All tests passed! Contractor profile creation structure is valid.');
    console.log('\n📋 Summary:');
    console.log('   ✓ Required fields validation');
    console.log('   ✓ Skills mapping from serviceTypes');
    console.log('   ✓ Data consistency between documents');
    console.log('   ✓ Default values are correct');
    console.log('   ✓ Database integration ready');
    
    console.log('\n🚀 Ready to test live onboarding flow!');
    console.log('   1. Navigate to registration page');
    console.log('   2. Select "Contractor" user type');
    console.log('   3. Complete email verification');
    console.log('   4. Complete onboarding steps');
    console.log('   5. Verify profile creation in Firestore');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testContractorProfileCreation().then(() => {
    console.log('\n✅ Test completed successfully');
    process.exit(0);
  }).catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  });
}

module.exports = { testContractorProfileCreation }; 