import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { getAuthErrorMessage } from '../utils/authHelpers';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [hasInteracted, setHasInteracted] = useState(false);
  const { login, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  // Firebase error message mapping for user-friendly messages
  const getErrorMessage = (errorCode) => {
    const errorMessages = {
      'auth/user-not-found': 'No account found with this email. Please check your email or create an account.',
      'auth/wrong-password': 'Incorrect password. Please try again or reset your password.',
      'auth/invalid-email': 'Please provide a valid email address.',
      'auth/too-many-requests': 'Too many unsuccessful attempts. Please try again later.',
      'auth/user-disabled': 'This account has been disabled. Please contact support.',
      'auth/network-request-failed': 'Network error. Please check your connection and try again.'
    };
    
    return errorMessages[errorCode] || 'Failed to sign in. Please check your credentials.';
  };

  // Real-time validation
  const validateField = (field, value) => {
    switch (field) {
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
      case 'password':
        return value.length < 1 ? 'Password is required' : '';
      default:
        return '';
    }
  };

  // Handle input changes with validation
  const handleInputChange = (field, value) => {
    if (field === 'email') setEmail(value);
    if (field === 'password') setPassword(value);
    
    if (hasInteracted) {
      const error = validateField(field, value);
      setValidationErrors(prev => ({ ...prev, [field]: error }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasInteracted(true);

    // Validate fields
    const errors = {};
    errors.email = validateField('email', email);
    errors.password = validateField('password', password);

    const hasErrors = Object.values(errors).some(error => error !== '');
    setValidationErrors(errors);

    if (hasErrors) return;
    
    try {
      setError('');
      setLoading(true);
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      
      const { user } = await login(email, password);
      
      // Get user profile with user type
      const userProfile = await fetchUserProfile(user.uid);
      
      if (!userProfile) {
        setError('User profile not found. Please contact support.');
        setLoading(false);
        return;
      }
      
      // Get the user role from either userType or role field for backwards compatibility
      const userRole = userProfile.userType || userProfile.role;
      
      // Redirect based on user type
      if (userRole) {
        let redirectPath = '';
        
        switch(userRole) {
          case 'tenant':
            redirectPath = '/tenant/dashboard';
            break;
          case 'landlord':
            redirectPath = '/landlord/dashboard';
            break;
          case 'contractor':
            redirectPath = '/contractor/dashboard';
            break;
          default:
            redirectPath = '/dashboard';
        }
        
        navigate(redirectPath);
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login Error:', error);
      const errorCode = error.code || 'unknown';
      setError(getErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email on component mount
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Stunning gradient background with flowing curves - Orange theme */}
      <div className="absolute inset-0 z-0">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(ellipse 800px 600px at 20% 80%, rgba(251, 146, 60, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse 600px 800px at 80% 20%, rgba(249, 115, 22, 0.4) 0%, transparent 50%),
              radial-gradient(ellipse 400px 600px at 60% 60%, rgba(245, 101, 101, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 500px 400px at 40% 40%, rgba(251, 191, 36, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse 700px 500px at 10% 10%, rgba(252, 211, 77, 0.3) 0%, transparent 50%),
              linear-gradient(135deg, #f97316 0%, #ea580c 100%)
            `
          }}
        />
        {/* Flowing curves overlay */}
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <path
            d="M0,400 Q300,300 600,400 T1200,400 L1200,800 L0,800 Z"
            fill="url(#gradient1)"
            fillOpacity="0.1"
          />
          <path
            d="M0,500 Q400,350 800,500 T1200,500 L1200,800 L0,800 Z"
            fill="url(#gradient2)"
            fillOpacity="0.15"
          />
          <defs>
            <linearGradient id="gradient1" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#f97316" />
              <stop offset="50%" stopColor="#fb923c" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
            <linearGradient id="gradient2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ea580c" />
              <stop offset="50%" stopColor="#f97316" />
              <stop offset="100%" stopColor="#fbbf24" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* PropAgentic logo */}
      <div className="absolute top-8 left-8 z-20">
        <Link to="/" className="text-white text-xl font-bold tracking-tight hover:opacity-80 transition-opacity">
          propagentic
        </Link>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Sign in to your account</h1>
              <p className="text-gray-600">Welcome back to PropAgentic</p>
            </div>
            
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in slide-in-from-top duration-300">
                {error}
              </div>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <input
                  id="email-address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                    validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                  }`}
                  placeholder="your@email.com"
                  disabled={loading}
                />
                {validationErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                )}
              </div>
              
              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link 
                    to="/forgot-password" 
                    className="text-sm text-orange-600 hover:text-orange-500 transition-colors duration-200"
                  >
                    Forgot your password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    value={password}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="Enter your password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                    onClick={togglePasswordVisibility}
                    tabIndex="-1"
                  >
                    {showPassword ? (
                      <EyeSlashIcon className="h-5 w-5" />
                    ) : (
                      <EyeIcon className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {validationErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                )}
              </div>

              {/* Remember me */}
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember-me"
                    type="checkbox"
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <label htmlFor="remember-me" className="ml-3 text-sm text-gray-700">
                    Remember me on this device
                  </label>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-orange-600 to-red-600 text-white py-3 px-4 rounded-lg font-medium hover:from-orange-700 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-75 disabled:cursor-not-allowed transform transition-all duration-200 hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign in'
                )}
              </button>

              {/* OR divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">OR</span>
                </div>
              </div>

              {/* Social authentication */}
              <div className="space-y-3">
                <button
                  type="button"
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Sign in with Google
                </button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                  </svg>
                  Sign in with SSO
                </button>

                <button
                  type="button"
                  className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
                >
                  <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7 14s-1 0-1-1 1-4 6-4 6 3 6 4-1 1-1 1H7zm4-6a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"/>
                  </svg>
                  Sign in with passkey
                </button>
              </div>
            </form>

            {/* Create account link */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-600">
                New to PropAgentic?{' '}
                <Link 
                  to="/signup" 
                  className="font-medium text-orange-600 hover:text-orange-500 transition-colors duration-200"
                >
                  Create account
                </Link>
              </p>
            </div>

            {/* Security note */}
            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500 flex items-center justify-center">
                <svg className="w-4 h-4 mr-1.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Only install browser extensions from companies you trust
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage; 