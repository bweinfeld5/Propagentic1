/**
 * Browser Console Debug Script for QR Code Authentication
 * 
 * INSTRUCTIONS:
 * 1. Sign in as a landlord in the web app
 * 2. Navigate to QR code generation page
 * 3. Open browser DevTools (F12)
 * 4. Copy and paste this entire script into the Console
 * 5. Press Enter to run
 * 
 * This will test the authentication flow step by step
 */

(async function debugQRCodeAuth() {
  console.log('🔧 QR Code Authentication Debug');
  console.log('================================');
  
  try {
    // Step 1: Check if Firebase modules are available
    console.log('\n📋 Step 1: Checking Firebase modules...');
    
    const { auth } = await import('/src/firebase/config.js').catch(() => {
      console.error('❌ Could not import auth from /src/firebase/config.js');
      return {};
    });
    
    if (!auth) {
      console.error('❌ Firebase auth not available');
      return;
    }
    
    console.log('✅ Firebase auth imported successfully');
    
    // Step 2: Check current user
    console.log('\n📋 Step 2: Checking authentication state...');
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      console.error('❌ No user is currently signed in');
      console.log('💡 Please sign in as a landlord account first');
      return;
    }
    
    console.log('✅ User is signed in:', {
      uid: currentUser.uid,
      email: currentUser.email,
      emailVerified: currentUser.emailVerified,
      displayName: currentUser.displayName
    });
    
    // Step 3: Test ID token acquisition
    console.log('\n📋 Step 3: Testing ID token acquisition...');
    
    try {
      const idToken = await currentUser.getIdToken(true);
      console.log('✅ ID token acquired successfully:', {
        tokenLength: idToken.length,
        tokenPrefix: idToken.substring(0, 50) + '...'
      });
      
      // Decode token claims
      try {
        const tokenPayload = JSON.parse(atob(idToken.split('.')[1]));
        console.log('✅ Token claims decoded:', {
          issuer: tokenPayload.iss,
          subject: tokenPayload.sub,
          expiry: new Date(tokenPayload.exp * 1000).toISOString(),
          email: tokenPayload.email,
          emailVerified: tokenPayload.email_verified
        });
      } catch (err) {
        console.warn('⚠️ Could not decode token claims:', err.message);
      }
      
    } catch (tokenError) {
      console.error('❌ Failed to get ID token:', tokenError);
      return;
    }
    
    // Step 4: Check user's properties
    console.log('\n📋 Step 4: Checking user properties...');
    
    try {
      const { getFirestore, collection, query, where, getDocs } = await import('firebase/firestore');
      const db = getFirestore();
      
      const propertiesRef = collection(db, 'properties');
      const propertiesQuery = query(propertiesRef, where('landlordId', '==', currentUser.uid));
      const propertiesSnapshot = await getDocs(propertiesQuery);
      
      console.log('✅ Properties query successful:', {
        count: propertiesSnapshot.size,
        properties: propertiesSnapshot.docs.map(doc => ({
          id: doc.id,
          name: doc.data().name || doc.data().nickname || 'Unnamed',
          landlordId: doc.data().landlordId,
          address: doc.data().streetAddress || 'No address'
        }))
      });
      
      if (propertiesSnapshot.empty) {
        console.warn('⚠️ No properties found for this user');
        console.log('💡 You may need to create a property first');
        return;
      }
      
      // Step 5: Test Firebase Function call
      console.log('\n📋 Step 5: Testing Firebase Function call...');
      
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const functions = getFunctions();
      const generateInviteCodeFunction = httpsCallable(functions, 'generateInviteCode');
      
      const testProperty = propertiesSnapshot.docs[0];
      console.log('🔧 Testing with property:', {
        id: testProperty.id,
        name: testProperty.data().name || 'Unnamed'
      });
      
      console.log('🔧 Calling generateInviteCode function...');
      
      const result = await generateInviteCodeFunction({
        propertyId: testProperty.id,
        expirationDays: 7
      });
      
      console.log('📥 Function response:', result.data);
      
      if (result.data && result.data.success) {
        console.log('🎉 SUCCESS! QR code generation worked!');
        console.log('Generated code:', result.data.inviteCode.code);
      } else {
        console.error('❌ Function returned unsuccessful result');
        console.log('Error details:', result.data);
      }
      
    } catch (functionError) {
      console.error('❌ Function call failed:', {
        code: functionError.code,
        message: functionError.message,
        details: functionError.details
      });
      
      // Analyze error type
      if (functionError.code === 'functions/unauthenticated') {
        console.log('\n🔍 AUTHENTICATION ERROR ANALYSIS:');
        console.log('• The Firebase Function cannot verify your identity');
        console.log('• This suggests ID token is not being sent or is invalid');
        console.log('• Check Firebase Functions logs for more details');
      } else if (functionError.code === 'functions/invalid-argument') {
        console.log('\n🔍 INVALID ARGUMENT ERROR ANALYSIS:');
        console.log('• The Function received invalid parameters');
        console.log('• Property might not exist or you might not own it');
        console.log('• Check property ownership and validation logic');
      } else if (functionError.code === 'functions/internal') {
        console.log('\n🔍 INTERNAL ERROR ANALYSIS:');
        console.log('• The Function crashed internally');
        console.log('• Check Firebase Functions logs for stack traces');
        console.log('• Could be Firestore permission or index issues');
      }
    }
    
  } catch (error) {
    console.error('💥 Debug script crashed:', error);
  }
  
  console.log('\n🏁 Debug complete');
  console.log('If you found errors, copy the logs and check Firebase Function logs at:');
  console.log('https://console.firebase.google.com/project/propagentic/functions/logs');
})();
