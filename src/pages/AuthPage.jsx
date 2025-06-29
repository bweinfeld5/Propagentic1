import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Tab } from '@headlessui/react';
import { useAuth } from '../context/AuthContext.jsx';
import SignupForm from '../components/auth/SignupForm';
import HomeNavLink from '../components/layout/HomeNavLink';
import Button from '../components/ui/Button';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const AuthPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  // If user is already logged in, redirect to role-based dashboard
  useEffect(() => {
    if (currentUser) {
      // Should use role-based redirect, but we don't have userProfile here
      // The RoleBasedRedirect component in App.jsx handles this properly
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);
  
  // Set active tab based on query parameter
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');
    
    if (tab === 'signup') {
      setSelectedIndex(1);
    } else {
      setSelectedIndex(0);
    }
  }, [location]);
  
  // When tab changes, update URL
  const handleTabChange = (index) => {
    setSelectedIndex(index);
    const tab = index === 1 ? 'signup' : 'login';
    navigate(`/auth?tab=${tab}`, { replace: true });
  };
  
  // Login form component
  const LoginForm = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [rememberMe, setRememberMe] = useState(false);
    const { login, fetchUserProfile } = useAuth();
    
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
        
        // Get the user role from either userType or role field for backwards compatibility
        const userRole = userProfile?.userType || userProfile?.role;
        
        // Debug login redirect
        console.log('AuthPage - User Role Check:', {
          userEmail: userProfile.email,
          userRole,
          userProfileRole: userProfile.role,
          userProfileType: userProfile.userType
        });

        // Check for admin users first (prioritize admin)
        const isAdmin = userProfile.role === 'admin' || userProfile.role === 'super_admin' || 
                       userProfile.userType === 'admin' || userProfile.userType === 'super_admin';
        
        if (isAdmin) {
          console.log('AuthPage - Redirecting admin to /admin/dashboard');
          navigate('/admin/dashboard');
        } else if (userRole) {
          // Redirect based on user type for non-admin users
          const redirectPath = `/${userRole}/dashboard`;
          console.log(`AuthPage - Redirecting to: ${redirectPath}`);
          
          switch(userRole) {
            case 'tenant':
              navigate('/tenant/dashboard');
              break;
            case 'landlord':
              navigate('/landlord/dashboard');
              break;
            case 'contractor':
              navigate('/contractor/dashboard');
              break;
            default:
              navigate('/dashboard');
          }
        } else {
          console.log('AuthPage - No userType or role found, redirecting to default dashboard');
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
    
    return (
      <div className="space-y-6">
        {error && (
          <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger text-red-700 dark:text-red-300 p-4 rounded-md" role="alert">
            <p>{error}</p>
          </div>
        )}
        
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="email-address" className="block text-sm font-medium text-content dark:text-content-dark mb-1">
                Email address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border dark:border-border-dark placeholder-neutral-400 dark:placeholder-neutral-500 text-content dark:text-content-dark bg-background dark:bg-background-dark focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-content dark:text-content-dark mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none rounded-md relative block w-full px-3 py-2 border border-border dark:border-border-dark placeholder-neutral-400 dark:placeholder-neutral-500 text-content dark:text-content-dark bg-background dark:bg-background-dark focus:outline-none focus:ring-primary focus:border-primary focus:z-10 sm:text-sm"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-content-subtle dark:text-content-darkSubtle hover:text-content dark:hover:text-content-dark"
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
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-border dark:border-border-dark rounded bg-background dark:bg-background-dark"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-content dark:text-content-dark">
                Remember me
              </label>
            </div>
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-primary hover:text-primary-dark dark:hover:text-primary-light">
                Forgot your password?
              </Link>
            </div>
          </div>

          <div>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              fullWidth
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
            </Button>
          </div>
          
          <div className="flex items-center my-4">
            <div className="flex-grow h-px bg-border dark:bg-border-dark"></div>
            <span className="mx-4 text-sm text-content-subtle dark:text-content-darkSubtle">Or sign in with</span>
            <div className="flex-grow h-px bg-border dark:bg-border-dark"></div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              disabled={loading}
            >
              <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
            >
              <svg className="h-5 w-5 mr-2" fill="#1877F2" viewBox="0 0 24 24">
                <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
              </svg>
              Facebook
            </Button>
          </div>
        </form>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background-subtle dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="absolute top-4 left-4 sm:top-8 sm:left-8">
        <HomeNavLink className="text-base flex items-center text-content dark:text-content-dark hover:text-primary" />
      </div>
      
      <div className="max-w-md w-full bg-background dark:bg-background-darkSubtle rounded-lg shadow-md p-8 border border-border dark:border-border-dark">
        <Tab.Group selectedIndex={selectedIndex} onChange={handleTabChange}>
          <Tab.List className="flex rounded-xl bg-neutral-100 dark:bg-neutral-800 p-1 mb-8">
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-100 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  selected
                    ? 'bg-background dark:bg-background-dark text-primary shadow'
                    : 'text-content-secondary dark:text-content-darkSecondary hover:bg-background/60 dark:hover:bg-background-dark/60 hover:text-primary'
                )
              }
            >
              Sign In
            </Tab>
            <Tab
              className={({ selected }) =>
                classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-100 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                  selected
                    ? 'bg-background dark:bg-background-dark text-primary shadow'
                    : 'text-content-secondary dark:text-content-darkSecondary hover:bg-background/60 dark:hover:bg-background-dark/60 hover:text-primary'
                )
              }
            >
              Sign Up
            </Tab>
          </Tab.List>
          <Tab.Panels>
            <Tab.Panel>
              <h2 className="text-center text-2xl font-extrabold text-content dark:text-content-dark mb-6">
                Sign in to Propagentic
              </h2>
              <LoginForm />
            </Tab.Panel>
            <Tab.Panel>
              <h2 className="text-center text-2xl font-extrabold text-content dark:text-content-dark mb-6">
                Create your account
              </h2>
              <SignupForm />
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>
    </div>
  );
};

export default AuthPage; 