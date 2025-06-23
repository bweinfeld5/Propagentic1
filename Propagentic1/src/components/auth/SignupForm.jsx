import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import GoogleSignInButton from './GoogleSignInButton';

const SignupForm = ({ initialRole, isPremium }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState(initialRole || 'tenant');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    terms: ''
  });
  
  const navigate = useNavigate();
  const location = useLocation();
  const { register, fetchUserProfile } = useAuth();

  // Set initial role when the prop changes
  useEffect(() => {
    if (initialRole) {
      setUserType(initialRole);
    }
  }, [initialRole]);

  // Firebase error message mapping for user-friendly messages
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/email-already-in-use': 'An account with this email already exists.',
      'auth/invalid-email': 'Please provide a valid email address.',
      'auth/weak-password': 'Password should be at least 6 characters long.',
      'auth/network-request-failed': 'Network error. Please check your connection and try again.',
      'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.'
    };
    
    return errorMessages[errorCode] || 'Failed to create an account. Please try again.';
  };

  // Password strength checker
  const checkPasswordStrength = (pass) => {
    if (pass.length === 0) return { score: 0, message: '' };
    if (pass.length < 6) return { score: 1, message: 'Weak: Too short' };
    
    let score = 0;
    // Add 1 point for length
    if (pass.length >= 8) score += 1;
    // Add 1 point for lowercase letter
    if (/[a-z]/.test(pass)) score += 1;
    // Add 1 point for uppercase letter
    if (/[A-Z]/.test(pass)) score += 1;
    // Add 1 point for number
    if (/[0-9]/.test(pass)) score += 1;
    // Add 1 point for special character
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    
    let message = '';
    if (score <= 2) message = 'Weak';
    else if (score <= 3) message = 'Medium';
    else if (score <= 4) message = 'Strong';
    else message = 'Very strong';
    
    return { score, message };
  };

  const passwordStrength = checkPasswordStrength(password);

  // Validate form inputs in real-time
  useEffect(() => {
    const errors = { email: '', password: '', confirmPassword: '', terms: '' };
    
    // Email validation
    if (email.length > 0 && !/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Password validation
    if (password.length > 0 && password.length < 6) {
      errors.password = 'Password must be at least 6 characters long';
    }
    
    // Confirm password validation
    if (confirmPassword.length > 0 && password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setValidationErrors(errors);
  }, [email, password, confirmPassword]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Form validation
    const errors = { ...validationErrors };
    
    if (!termsAccepted) {
      errors.terms = 'You must accept the terms and conditions';
      setValidationErrors(errors);
      return;
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
      setValidationErrors(errors);
      return;
    }
    
    if (password.length < 6) {
      errors.password = 'Password should be at least 6 characters long';
      setValidationErrors(errors);
      return;
    }
    
    // If there are validation errors, don't proceed
    if (Object.values(errors).some(error => error !== '')) {
      return;
    }
    
    // Reset error state and set loading
    setError('');
    setLoading(true);
    setSuccess(false);
    
    try {
      // Use the register function from AuthContext
      console.log('Attempting to register user with email:', email);
      const userCredential = await register(email, password, userType, isPremium);
      console.log('User registered successfully');
      
      // Fetch user profile data to ensure it's loaded in context
      console.log('Fetching user profile data...');
      await fetchUserProfile(userCredential.user.uid);
      console.log('User profile data loaded');
      
      // Set success state
      setSuccess(true);
      
      // Redirect based on user type
      console.log('Redirecting to onboarding based on user type:', userType);
      setTimeout(() => {
        if (userType === 'landlord') {
          navigate('/landlord-onboarding');
        } else if (userType === 'contractor') {
          navigate('/contractor-onboarding');
        } else {
          navigate('/onboarding');
        }
      }, 1000); // Short delay to show success state
      
    } catch (error) {
      console.error('Firebase Auth Error:', error);
      // Extract the error code and message for better debugging
      const errorCode = error.code || 'unknown';
      const errorMessage = error.message || 'Unknown error';
      console.error(`Error code: ${errorCode}, Message: ${errorMessage}`);
      
      // Handle specific Firebase auth errors
      setError(getErrorMessage(errorCode));
      setSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {error && (
        <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger text-red-700 dark:text-red-300 p-4 mb-4 rounded-md" role="alert">
          <p>{error}</p>
        </div>
      )}
      
      {success && (
        <div className="bg-success-subtle dark:bg-success-darkSubtle border-l-4 border-success text-green-700 dark:text-emerald-300 p-4 mb-4 rounded-md" role="alert">
          <p>Account created successfully! Redirecting...</p>
        </div>
      )}
      
      {isPremium && (
        <div className="bg-primary/10 dark:bg-primary/20 border-l-4 border-primary text-primary dark:text-primary-light p-4 mb-4 rounded-md" role="alert">
          <p><strong>Premium Contractor Account:</strong> Registering for premium plan.</p>
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="email-signup" className="block text-sm font-medium text-content dark:text-content-dark mb-1">
            Email address
          </label>
          <input
            id="email-signup"
            name="email"
            type="email"
            autoComplete="email"
            required
            className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-background dark:bg-background-dark text-content dark:text-content-dark placeholder-neutral-400 dark:placeholder-neutral-500 ${
              validationErrors.email ? 'border-danger' : 'border-border dark:border-border-dark'
            }`}
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={loading}
          />
          {validationErrors.email && (
            <p className="mt-1 text-sm text-danger dark:text-red-400">{validationErrors.email}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="password-signup" className="block text-sm font-medium text-content dark:text-content-dark mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password-signup"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-background dark:bg-background-dark text-content dark:text-content-dark placeholder-neutral-400 dark:placeholder-neutral-500 ${
                validationErrors.password ? 'border-danger' : 'border-border dark:border-border-dark'
              }`}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-subtle dark:text-content-darkSubtle hover:text-content dark:hover:text-content-dark"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex="-1"
            >
              {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {validationErrors.password && (
            <p className="mt-1 text-sm text-danger dark:text-red-400">{validationErrors.password}</p>
          )}
          {password.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center">
                <div className="flex-1 h-2 bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-300 ${
                      passwordStrength.score <= 2 ? 'bg-danger' : 
                      passwordStrength.score <= 3 ? 'bg-warning' : 
                      'bg-success'
                    }`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  ></div>
                </div>
                <span className="ml-2 text-xs text-content-secondary dark:text-content-darkSecondary">{passwordStrength.message}</span>
              </div>
              <ul className="mt-1 text-xs text-content-subtle dark:text-content-darkSubtle space-y-1">
                <li className={password.length >= 8 ? 'text-success dark:text-emerald-300' : ''}>• At least 8 characters</li>
                <li className={/[A-Z]/.test(password) ? 'text-success dark:text-emerald-300' : ''}>• At least one uppercase letter</li>
                <li className={/[0-9]/.test(password) ? 'text-success dark:text-emerald-300' : ''}>• At least one number</li>
                <li className={/[^A-Za-z0-9]/.test(password) ? 'text-success dark:text-emerald-300' : ''}>• At least one special character</li>
              </ul>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <label htmlFor="confirm-password-signup" className="block text-sm font-medium text-content dark:text-content-dark mb-1">
            Confirm Password
          </label>
          <div className="relative">
            <input
              id="confirm-password-signup"
              name="confirm-password"
              type={showConfirmPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary bg-background dark:bg-background-dark text-content dark:text-content-dark placeholder-neutral-400 dark:placeholder-neutral-500 ${
                validationErrors.confirmPassword ? 'border-danger' : 'border-border dark:border-border-dark'
              }`}
              placeholder="Confirm your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={loading}
            />
            <button
              type="button"
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-subtle dark:text-content-darkSubtle hover:text-content dark:hover:text-content-dark"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex="-1"
            >
              {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
            </button>
          </div>
          {validationErrors.confirmPassword && (
            <p className="mt-1 text-sm text-danger dark:text-red-400">{validationErrors.confirmPassword}</p>
          )}
        </div>
        
        <div className="mb-6">
          <label className="block text-sm font-medium text-content dark:text-content-dark mb-2">
            I am a:
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[ 'tenant', 'landlord', 'contractor' ].map((type) => (
              <div key={type}>
                <input
                  type="radio"
                  id={type}
                  name="userType"
                  value={type}
                  className="sr-only peer"
                  checked={userType === type}
                  onChange={() => setUserType(type)}
                  disabled={loading || initialRole}
                />
                <label
                  htmlFor={type}
                  className={`cursor-pointer block text-center py-2 px-4 border rounded-md transition-colors duration-150 
                    border-border dark:border-border-dark text-content-secondary dark:text-content-darkSecondary 
                    peer-checked:border-primary peer-checked:bg-primary/10 peer-checked:text-primary dark:peer-checked:text-primary-light dark:peer-checked:bg-primary/20 
                    ${initialRole ? 'opacity-60 cursor-not-allowed' : 'hover:bg-neutral-50 dark:hover:bg-neutral-800/50'}`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="terms-signup"
                name="terms"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-border dark:border-border-dark rounded bg-background dark:bg-background-dark"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                disabled={loading}
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="terms-signup" className="text-content dark:text-content-dark">
                I agree to the{' '}
                <a href="/terms" className="text-primary hover:text-primary-dark dark:hover:text-primary-light underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="/privacy" className="text-primary hover:text-primary-dark dark:hover:text-primary-light underline">
                  Privacy Policy
                </a>
              </label>
            </div>
          </div>
          {validationErrors.terms && (
            <p className="mt-1 text-sm text-danger dark:text-red-400">{validationErrors.terms}</p>
          )}
        </div>
        
        <div className="mb-6">
          <Button
            type="submit"
            variant="primary"
            disabled={loading || Object.values(validationErrors).some(err => err !== '')}
            fullWidth
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Account...
              </>
            ) : (
              'Sign Up'
            )}
          </Button>
        </div>
        
        <div className="flex items-center my-4">
          <div className="flex-grow h-px bg-border dark:bg-border-dark"></div>
          <span className="mx-4 text-sm text-content-subtle dark:text-content-darkSubtle">Or sign up with</span>
          <div className="flex-grow h-px bg-border dark:bg-border-dark"></div>
        </div>
        
        <div className="space-y-3">
          <GoogleSignInButton 
            userType={userType}
            isPremium={isPremium}
            isSignup={true}
            disabled={loading}
            onSuccess={(result, profile) => {
              setSuccess(true);
              console.log('Google signup successful:', result.user.uid);
              // Navigation is handled by the GoogleSignInButton component
            }}
            onError={(error) => {
              setError(getErrorMessage(error.code));
            }}
          />
          <Button type="button" variant="outline" disabled={loading} className="w-full">
            <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
            </svg>
            Sign up with Facebook
          </Button>
        </div>
      </form>
    </>
  );
};

export default SignupForm; 