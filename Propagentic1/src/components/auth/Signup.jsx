import React, { useState } from 'react';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase/config';
import { Link, useNavigate } from 'react-router-dom';

const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('tenant');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();

  // Additional fields for contractors
  const [specialties, setSpecialties] = useState([]);
  const [companyName, setCompanyName] = useState('');
  
  // Specialties options for contractors
  const specialtyOptions = [
    'plumbing', 'electrical', 'hvac', 'carpentry', 
    'painting', 'roofing', 'landscaping', 'general'
  ];

  const handleSpecialtyChange = (e) => {
    const { value, checked } = e.target;
    if (checked) {
      setSpecialties([...specialties, value]);
    } else {
      setSpecialties(specialties.filter(specialty => specialty !== value));
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    
    // Reset error
    setError(null);
    
    // Validation
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // Additional validation for contractors
    if (role === 'contractor' && specialties.length === 0) {
      setError('Please select at least one specialty');
      return;
    }
    
    try {
      setLoading(true);
      
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        email, 
        password
      );
      
      // Update profile with display name
      await updateProfile(userCredential.user, { displayName });
      
      // Prepare user data based on role
      const userData = {
        uid: userCredential.user.uid,
        email,
        displayName,
        role,
        phoneNumber: phoneNumber || null,
        createdAt: new Date().toISOString(),
        notificationPreferences: {
          email: true,
          push: true,
          categories: getDefaultCategoriesByRole(role)
        }
      };
      
      // Add role-specific data
      if (role === 'contractor') {
        userData.specialties = specialties;
        userData.companyName = companyName || null;
        userData.verified = false; // Contractors need verification
      } else if (role === 'landlord') {
        userData.properties = [];
      } else if (role === 'tenant') {
        userData.properties = [];
        userData.leases = [];
      }
      
      // Save user data to Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      
      // Redirect to appropriate dashboard
      navigate(`/${role}/dashboard`);
      
    } catch (err) {
      console.error('Sign up error:', err);
      setError(err.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };
  
  // Returns default notification categories based on user role
  const getDefaultCategoriesByRole = (userRole) => {
    switch (userRole) {
      case 'tenant':
        return {
          maintenance: true,
          payments: true,
          property: true,
          announcements: true
        };
      case 'landlord':
        return {
          maintenance: true,
          payments: true,
          tenants: true,
          contractors: true,
          property: true
        };
      case 'contractor':
        return {
          jobs: true,
          payments: true,
          reviews: true
        };
      default:
        return {};
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-full max-w-md mx-auto pt-12 px-6">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Create an Account</h1>
            <p className="text-gray-600 mt-2">Join Propagentic to manage your properties</p>
          </div>
          
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSignUp}>
            <div className="space-y-6">
              {/* User Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  I am a:
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <input 
                      type="radio" 
                      id="role-tenant" 
                      name="role" 
                      value="tenant"
                      checked={role === 'tenant'}
                      onChange={() => setRole('tenant')}
                      className="sr-only"
                    />
                    <label 
                      htmlFor="role-tenant"
                      className={`block w-full py-2 px-3 text-center rounded-md cursor-pointer border ${
                        role === 'tenant' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Tenant
                    </label>
                  </div>
                  <div>
                    <input 
                      type="radio" 
                      id="role-landlord" 
                      name="role" 
                      value="landlord"
                      checked={role === 'landlord'}
                      onChange={() => setRole('landlord')}
                      className="sr-only"
                    />
                    <label 
                      htmlFor="role-landlord"
                      className={`block w-full py-2 px-3 text-center rounded-md cursor-pointer border ${
                        role === 'landlord' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Landlord
                    </label>
                  </div>
                  <div>
                    <input 
                      type="radio" 
                      id="role-contractor" 
                      name="role" 
                      value="contractor"
                      checked={role === 'contractor'}
                      onChange={() => setRole('contractor')}
                      className="sr-only"
                    />
                    <label 
                      htmlFor="role-contractor"
                      className={`block w-full py-2 px-3 text-center rounded-md cursor-pointer border ${
                        role === 'contractor' 
                          ? 'bg-blue-50 border-blue-500 text-blue-700' 
                          : 'border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      Contractor
                    </label>
                  </div>
                </div>
              </div>
              
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="John Doe"
                />
              </div>
              
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="(555) 123-4567"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Min. 6 characters"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Confirm your password"
                />
              </div>
              
              {/* Contractor-specific fields */}
              {role === 'contractor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Company Name (optional)
                    </label>
                    <input
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Your company name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Specialties (select all that apply)
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {specialtyOptions.map((specialty) => (
                        <div key={specialty} className="flex items-start">
                          <input
                            id={`specialty-${specialty}`}
                            name="specialties"
                            type="checkbox"
                            value={specialty}
                            checked={specialties.includes(specialty)}
                            onChange={handleSpecialtyChange}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded mt-1"
                          />
                          <label
                            htmlFor={`specialty-${specialty}`}
                            className="ml-2 block text-sm text-gray-700 capitalize"
                          >
                            {specialty}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
              
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
                  {loading ? 'Creating account...' : 'Create Account'}
                </button>
              </div>
            </div>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUp; 