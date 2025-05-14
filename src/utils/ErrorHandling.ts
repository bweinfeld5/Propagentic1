export const getFirebaseErrorMessage = (error: any): string => {
    const errorCode = error?.code || '';
    
    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'This email is already registered.',
      'auth/user-not-found': 'No account found with this email.',
      'auth/wrong-password': 'Incorrect password.',
      'auth/weak-password': 'Password should be at least 6 characters.',
      'auth/invalid-email': 'Please enter a valid email address.',
      'permission-denied': 'You do not have permission to perform this action.',
      'not-found': 'The requested document was not found.',
      'already-exists': 'This record already exists.'
    };
    
    return errorMessages[errorCode] || (error?.message || 'An unexpected error occurred. Please try again.');
  };