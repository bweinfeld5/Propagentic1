import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase/config';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // For testing purposes, add quick login options
  const testUsers = [
    { role: 'landlord', email: 'landlord@test.com', password: 'password123' },
    { role: 'tenant', email: 'tenant@test.com', password: 'password123' },
    { role: 'contractor', email: 'contractor@test.com', password: 'password123' }
  ];

  const handleQuickLogin = (testEmail, testPassword) => {
    setEmail(testEmail);
    setPassword(testPassword);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    try {
      setLoading(true);
      
      // Sign in with Firebase Auth
      await signInWithEmailAndPassword(auth, email, password);
      
      // Get the user's role from their token claims or profile
      // For now, redirect to a general dashboard (you'd normally redirect based on role)
      // Use role-based redirect handled by RoleBasedRedirect component
      navigate('/dashboard');
      
    } catch (err) {
      console.error('Login error:', err);
      
      // Handle specific Firebase auth errors with user-friendly messages
      switch(err.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          setError('Invalid email or password');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed login attempts. Please try again later.');
          break;
        default:
          setError('Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto pt-12 px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Welcome Back</h1>
            <p className="text-gray-600 mt-2">Sign in to your Propagentic account</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="your@email.com"
                />
              </div>
              
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm text-blue-600 hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your password"
                />
              </div>
              
              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium ${
                    loading 
                      ? 'bg-blue-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>
              </div>
            </div>
          </form>
          
          {/* Test User Quick Login Section */}
          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Test Users (For Demo)</span>
              </div>
            </div>
            
            <div className="mt-4 grid grid-cols-3 gap-3">
              {testUsers.map((user) => (
                <button
                  key={user.role}
                  type="button"
                  onClick={() => handleQuickLogin(user.email, user.password)}
                  className="py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have an account?{' '}
              <Link to="/signup" className="text-blue-600 hover:underline">
                Create account
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login; 