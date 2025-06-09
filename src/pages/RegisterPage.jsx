import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { getAuthErrorMessage } from '../utils/authHelpers';

const RegisterPage = ({ initialRole, isPremium }) => {
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: initialRole || 'tenant',
    companyName: '',
    specialties: [],
    rememberMe: false
  });

  const [formState, setFormState] = useState({
    loading: false,
    error: '',
    success: false,
    showPassword: false,
    showConfirmPassword: false,
    validationErrors: {},
    hasInteracted: false
  });

  const { register, fetchUserProfile } = useAuth();
  const navigate = useNavigate();

  // Specialty options for contractors
  const specialtyOptions = [
    { id: 'plumbing', label: 'Plumbing' },
    { id: 'electrical', label: 'Electrical' },
    { id: 'hvac', label: 'HVAC' },
    { id: 'carpentry', label: 'Carpentry' },
    { id: 'painting', label: 'Painting' },
    { id: 'roofing', label: 'Roofing' },
    { id: 'landscaping', label: 'Landscaping' },
    { id: 'general', label: 'General' }
  ];

  // Real-time validation
  const validateField = useCallback((field, value) => {
    switch (field) {
      case 'fullName':
        return value.length < 2 ? 'Name must be at least 2 characters' : '';
      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return !emailRegex.test(value) ? 'Please enter a valid email address' : '';
      case 'password':
        if (value.length < 6) return 'Password must be at least 6 characters';
        return '';
      case 'confirmPassword':
        return value !== formData.password ? 'Passwords do not match' : '';
      case 'specialties':
        return formData.role === 'contractor' && value.length === 0 ? 'Select at least one specialty' : '';
      default:
        return '';
    }
  }, [formData.password, formData.role]);

  // Handle input changes with validation
  const handleInputChange = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    if (formState.hasInteracted) {
      const error = validateField(field, value);
      setFormState(prev => ({
        ...prev,
        validationErrors: { ...prev.validationErrors, [field]: error }
      }));
    }
  }, [formState.hasInteracted, validateField]);

  // Handle role change with animation
  const handleRoleChange = useCallback((newRole) => {
    setFormData(prev => ({ 
      ...prev, 
      role: newRole, 
      companyName: '', 
      specialties: [] 
    }));
  }, []);

  // Handle specialty toggle
  const handleSpecialtyToggle = useCallback((specialtyId) => {
    setFormData(prev => ({
      ...prev,
      specialties: prev.specialties.includes(specialtyId)
        ? prev.specialties.filter(id => id !== specialtyId)
        : [...prev.specialties, specialtyId]
    }));
  }, []);

  // Submit handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, hasInteracted: true }));

    // Validate all fields
    const errors = {};
    errors.fullName = validateField('fullName', formData.fullName);
    errors.email = validateField('email', formData.email);
    errors.password = validateField('password', formData.password);
    errors.confirmPassword = validateField('confirmPassword', formData.confirmPassword);
    errors.specialties = validateField('specialties', formData.specialties);

    const hasErrors = Object.values(errors).some(error => error !== '');
    setFormState(prev => ({ ...prev, validationErrors: errors }));

    if (hasErrors) return;

    setFormState(prev => ({ ...prev, loading: true, error: '', success: false }));

    try {
      const userCredential = await register(
        formData.email, 
        formData.password, 
        formData.role, 
        {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber || null,
          companyName: formData.role === 'contractor' ? formData.companyName : null,
          specialties: formData.role === 'contractor' ? formData.specialties : null,
          isPremium
        }
      );

      await fetchUserProfile(userCredential.user.uid);
      setFormState(prev => ({ ...prev, success: true }));

      // Redirect after success animation
      setTimeout(() => {
        const redirectPath = formData.role === 'landlord' ? '/landlord-onboarding' :
                           formData.role === 'contractor' ? '/contractor-onboarding' : 
                           '/onboarding';
        navigate(redirectPath);
      }, 1500);

    } catch (error) {
      setFormState(prev => ({ 
        ...prev, 
        error: error.message || 'Failed to create account. Please try again.',
        success: false 
      }));
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  };

  const { loading, error, success, showPassword, showConfirmPassword, validationErrors } = formState;

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
          {/* Success state */}
          {success && (
            <div className="bg-white rounded-xl shadow-2xl p-8 text-center animate-in fade-in duration-500">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account created!</h2>
              <p className="text-gray-600">Redirecting to your dashboard...</p>
            </div>
          )}

          {/* Main form */}
          {!success && (
            <div className="bg-white rounded-xl shadow-2xl p-8 backdrop-blur-sm border border-white/20">
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Create your account</h1>
                <p className="text-gray-600">Join PropAgentic to manage your properties</p>
              </div>

              {/* Error message */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm animate-in slide-in-from-top duration-300">
                  {error}
                </div>
              )}

              {/* Premium indicator */}
              {isPremium && (
                <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
                  <strong>Premium Account:</strong> Enhanced features included
                </div>
              )}

              {/* Role selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">I am a:</label>
                <div className="grid grid-cols-3 gap-3">
                  {['tenant', 'landlord', 'contractor'].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => handleRoleChange(role)}
                      className={`py-3 px-4 text-sm font-medium rounded-lg border-2 transition-all duration-200 ${
                        formData.role === role
                          ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-md transform scale-105'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    value={formData.fullName}
                    onChange={(e) => handleInputChange('fullName', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      validationErrors.fullName ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="John Doe"
                  />
                  {validationErrors.fullName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.fullName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                      validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                    }`}
                    placeholder="your@email.com"
                  />
                  {validationErrors.email && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div>
                  <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number <span className="text-gray-400">(optional)</span>
                  </label>
                  <input
                    id="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                    placeholder="(555) 123-4567"
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={formData.password}
                      onChange={(e) => handleInputChange('password', e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                        validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                      }`}
                      placeholder="Min. 6 characters"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setFormState(prev => ({ ...prev, showPassword: !showPassword }))}
                    >
                      {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {validationErrors.password && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={formData.confirmPassword}
                      onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                      className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 ${
                        validationErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-gray-50'
                      }`}
                      placeholder="Confirm your password"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                      onClick={() => setFormState(prev => ({ ...prev, showConfirmPassword: !showConfirmPassword }))}
                    >
                      {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    </button>
                  </div>
                  {validationErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Contractor-specific fields with smooth animation */}
                {formData.role === 'contractor' && (
                  <div className="space-y-6 animate-in slide-in-from-top duration-500">
                    {/* Company Name */}
                    <div>
                      <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Company Name <span className="text-gray-400">(optional)</span>
                      </label>
                      <input
                        id="companyName"
                        type="text"
                        value={formData.companyName}
                        onChange={(e) => handleInputChange('companyName', e.target.value)}
                        className="w-full px-4 py-3 border border-gray-300 bg-gray-50 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
                        placeholder="Your company name"
                      />
                    </div>

                    {/* Specialties */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Specialties <span className="text-gray-400">(select all that apply)</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        {specialtyOptions.map((specialty) => (
                          <label
                            key={specialty.id}
                            className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                          >
                            <input
                              type="checkbox"
                              checked={formData.specialties.includes(specialty.id)}
                              onChange={() => handleSpecialtyToggle(specialty.id)}
                              className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                            />
                            <span className="ml-3 text-sm text-gray-700">{specialty.label}</span>
                          </label>
                        ))}
                      </div>
                      {validationErrors.specialties && (
                        <p className="mt-2 text-sm text-red-600">{validationErrors.specialties}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Remember me */}
                <div className="flex items-center">
                  <input
                    id="rememberMe"
                    type="checkbox"
                    checked={formData.rememberMe}
                    onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                    className="h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                  />
                  <label htmlFor="rememberMe" className="ml-3 text-sm text-gray-700">
                    Remember me on this device
                  </label>
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
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating account...
                    </span>
                  ) : (
                    'Create Account'
                  )}
                </button>

                {/* OR divider */}
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-gray-50 text-gray-500">OR</span>
                  </div>
                </div>

                {/* Social authentication */}
                <div className="space-y-3">
                  <button
                    type="button"
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Sign up with Google
                  </button>

                  <button
                    type="button"
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                  >
                    <svg className="w-5 h-5 mr-3" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                    </svg>
                    Sign up with SSO
                  </button>
                </div>
              </form>

              {/* Sign in link */}
              <div className="mt-8 text-center">
                <p className="text-sm text-gray-600">
                  Already have an account?{' '}
                  <Link 
                    to="/login" 
                    className="font-medium text-orange-600 hover:text-orange-500 transition-colors duration-200"
                  >
                    Sign in
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
          )}
        </div>
      </div>
    </div>
  );
};

export default RegisterPage; 