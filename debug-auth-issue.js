/**
 * Authentication Debug Script
 * Run this in the browser console to diagnose QR code authentication issues
 */

// 1. Check Firebase initialization
console.log('🔍 Firebase Auth Debug Script');
console.log('==============================');

// Check if Firebase is initialized
if (typeof firebase !== 'undefined') {
  console.log('✅ Firebase SDK loaded');
} else {
  console.log('❌ Firebase SDK not loaded');
}

// Check current auth state
if (firebase && firebase.auth) {
  const auth = firebase.auth();
  const user = auth.currentUser;
  
  console.log('👤 Current User:', {
    isSignedIn: !!user,
    uid: user?.uid,
    email: user?.email,
    displayName: user?.displayName
  });
  
  if (user) {
    // Test token acquisition
    console.log('🔑 Testing token acquisition...');
    user.getIdToken()
      .then(token => {
        console.log('✅ Token acquired successfully');
        console.log('Token length:', token.length);
        console.log('Token starts with:', token.substring(0, 50) + '...');
        
        // Test token validation
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('🔍 Token payload:', {
          aud: payload.aud,
          iss: payload.iss,
          exp: new Date(payload.exp * 1000),
          uid: payload.uid
        });
        
      })
      .catch(error => {
        console.error('❌ Token acquisition failed:', error);
      });
  } else {
    console.log('❌ No authenticated user found');
    console.log('📝 Actions to take:');
    console.log('1. Sign out and sign back in');
    console.log('2. Clear browser cache and cookies');
    console.log('3. Check network connectivity');
  }
} else {
  console.log('❌ Firebase auth not available');
}

// Check environment variables
console.log('🌍 Environment Check:', {
  hasApiKey: !!process.env.REACT_APP_FIREBASE_API_KEY,
  hasAuthDomain: !!process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  hasProjectId: !!process.env.REACT_APP_FIREBASE_PROJECT_ID
});

// Instructions
console.log('📋 If authentication is failing:');
console.log('1. Refresh the page (Cmd+R or Ctrl+R)');
console.log('2. Open Developer Tools and check Console for errors');
console.log('3. Sign out and sign back in');
console.log('4. Clear browser cache and localStorage');
console.log('5. Check if you have network connectivity'); 