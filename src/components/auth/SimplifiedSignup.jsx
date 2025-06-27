import React, { useState, useMemo } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Link, useNavigate } from 'react-router-dom';
import { EyeIcon, EyeSlashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const SimplifiedSignup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState('tenant');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const navigate = useNavigate();

  // Password strength calculation
  const passwordStrength = useMemo(() => {
    if (!password) return { score: 0, feedback: [], color: 'gray' };
    
    let score = 0;
    const feedback = [];
    
    // Length check
    if (password.length >= 8) {
      score += 25;
      feedback.push({ text: 'At least 8 characters', met: true });
    } else {
      feedback.push({ text: 'At least 8 characters', met: false });
    }
    
    // Uppercase check
    if (/[A-Z]/.test(password)) {
      score += 25;
      feedback.push({ text: 'Contains uppercase letter', met: true });
    } else {
      feedback.push({ text: 'Contains uppercase letter', met: false });
    }
    
    // Lowercase check
    if (/[a-z]/.test(password)) {
      score += 25;
      feedback.push({ text: 'Contains lowercase letter', met: true });
    } else {
      feedback.push({ text: 'Contains lowercase letter', met: false });
    }
    
    // Number or special character check
    if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) {
      score += 25;
      feedback.push({ text: 'Contains number or special character', met: true });
    } else {
      feedback.push({ text: 'Contains number or special character', met: false });
    }
    
    // Determine color and label
    let color, label;
    if (score < 50) {
      color = 'red';
      label = 'Weak';
    } else if (score < 75) {
      color = 'yellow';
      label = 'Fair';
    } else if (score < 100) {
      color = 'blue';
      label = 'Good';
    } else {
      color = 'green';
      label = 'Strong';
    }
    
    return { score, feedback, color, label };
  }, [password]);

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError(null);
    
    // Basic validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength.score < 50) {
      setError('Please choose a stronger password');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create minimal user document
      const userData = {
        uid: userCredential.user.uid,
        email,
        userType,
        role: userType, // For backward compatibility
        createdAt: new Date().toISOString(),
        onboardingComplete: false,
        profileComplete: false
      };
      
      // Save minimal user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      // Show success message
      toast.success('Account created successfully!');
      
      // Redirect to role-specific onboarding
      navigate(`/onboarding/${userType}`);
      
    } catch (err) {
      console.error('Sign up error:', err);
      let errorMessage = 'Failed to create account';
      
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address';
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
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
        <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-md backdrop-blur-sm border border-white/20">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
            <p className="text-gray-600">Join PropAgentic to manage your properties</p>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSignUp} className="space-y-6">
            {/* User Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                I am a:
              </label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { value: 'tenant', label: 'Tenant', selected: userType === 'tenant' },
                  { value: 'landlord', label: 'Landlord', selected: userType === 'landlord' },
                  { value: 'contractor', label: 'Contractor', selected: userType === 'contractor' }
                ].map((type) => (
                  <div key={type.value}>
                    <input 
                      type="radio" 
                      id={`role-${type.value}`} 
                      name="userType" 
                      value={type.value}
                      checked={type.selected}
                      onChange={(e) => setUserType(e.target.value)}
                      className="sr-only"
                    />
                    <label 
                      htmlFor={`role-${type.value}`}
                      className={`block w-full py-3 px-4 text-center rounded-lg cursor-pointer border-2 transition-all duration-200 ${
                        type.selected
                          ? 'bg-orange-50 border-orange-500 text-orange-700 font-medium' 
                          : 'border-gray-300 hover:bg-gray-50 hover:border-gray-400'
                      }`}
                    >
                      {type.label}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="your@email.com"
              />
            </div>
            
            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                  placeholder="Choose a strong password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-3 space-y-2">
                  {/* Strength Bar */}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          passwordStrength.color === 'red' ? 'bg-red-500' :
                          passwordStrength.color === 'yellow' ? 'bg-yellow-500' :
                          passwordStrength.color === 'blue' ? 'bg-blue-500' :
                          'bg-green-500'
                        }`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength.color === 'red' ? 'text-red-600' :
                      passwordStrength.color === 'yellow' ? 'text-yellow-600' :
                      passwordStrength.color === 'blue' ? 'text-blue-600' :
                      'text-green-600'
                    }`}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  
                  {/* Requirements List */}
                  <div className="space-y-1">
                    {passwordStrength.feedback.map((item, index) => (
                      <div key={index} className="flex items-center gap-2 text-xs">
                        {item.met ? (
                          <CheckIcon className="h-3 w-3 text-green-500" />
                        ) : (
                          <XMarkIcon className="h-3 w-3 text-gray-400" />
                        )}
                        <span className={item.met ? 'text-green-600' : 'text-gray-500'}>
                          {item.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Confirm Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={`w-full px-4 py-3 pr-12 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  }`}
                  placeholder="Confirm your password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
              )}
            </div>
            
            {/* Remember Me */}
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                Remember me on this device
              </label>
            </div>
            
            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || passwordStrength.score < 50 || password !== confirmPassword}
              className={`w-full py-3 px-4 rounded-lg text-white font-medium transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-lg hover:shadow-xl ${
                loading || passwordStrength.score < 50 || password !== confirmPassword
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700'
              }`}
            >
              {loading ? 'Creating Account...' : 'Create Account'}
            </button>
          </form>
          
          {/* Divider */}
          <div className="mt-6 mb-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">OR</span>
              </div>
            </div>
          </div>
          
          {/* Social Signup */}
          <div className="space-y-3">
            <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Sign up with Google
            </button>
            
            <button className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
              Sign up with SSO
            </button>
          </div>
          
          {/* Login Link */}
          <div className="mt-8 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimplifiedSignup; 