import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import HomeNavLink from '../components/layout/HomeNavLink';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setError('');
      setLoading(true);
      
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem('rememberEmail', email);
      } else {
        localStorage.removeItem('rememberEmail');
      }
      
      console.log('LoginPage - Attempting to login with email:', email);
      const { user } = await login(email, password);
      console.log('LoginPage - Login successful, fetching user profile');
      
      // Get user profile with user type
      const userProfile = await fetchUserProfile(user.uid);
      console.log('LoginPage - User profile loaded:', userProfile);
      
      if (!userProfile) {
        console.error('LoginPage - No user profile found in database');
        setError('User profile not found. Please contact support.');
        setLoading(false);
        return;
      }
      
      // Get the user role from either userType or role field for backwards compatibility
      const userRole = userProfile.userType || userProfile.role;
      console.log('LoginPage - User role detected:', userRole);
      
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
        
        console.log(`LoginPage - Redirecting to: ${redirectPath}`);
        navigate(redirectPath);
      } else {
        console.log('LoginPage - No userType or role found, redirecting to /dashboard');
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Login Error:', error);
      // Extract the error code for better error messages
      const errorCode = error.code || 'unknown';
      setError(getErrorMessage(errorCode));
    } finally {
      setLoading(false);
    }
  };

  // Load remembered email on component mount
  React.useEffect(() => {
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <HomeNavLink className="text-base flex items-center" />
      </div>
      
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div>
          <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900">
            Sign in to Propagentic
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/register" className="font-medium text-teal-600 hover:text-teal-500">
              create a new account
            </Link>
          </p>
        </div>
        
        {error && (
          <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-md" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-gray-700 mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-teal-500 focus:border-teal-500 focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={togglePasswordVisibility}
                  tabIndex="-1"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-gray-300 rounded"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-teal-600 hover:text-teal-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-75"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage; 