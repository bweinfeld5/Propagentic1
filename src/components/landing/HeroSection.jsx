import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { UnifiedHeader } from '../layout/headers';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import TrustedByCarousel from './TrustedByCarousel';
import { HeartIcon } from '@heroicons/react/24/outline';

// Simple dashboard demo loader
const EnhancedDashboardDemo = lazy(() => import('./EnhancedDashboardDemo'));

// Simple loading skeleton
const DashboardSkeleton = () => (
  <div className="relative max-w-4xl mx-auto animate-pulse">
    <div className="bg-gray-300 rounded-lg aspect-[16/10] p-4">
      <div className="bg-gray-200 rounded h-full p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="grid grid-cols-3 gap-3 mt-6">
          <div className="h-16 bg-gray-300 rounded"></div>
          <div className="h-16 bg-gray-300 rounded"></div>
          <div className="h-16 bg-gray-300 rounded"></div>
        </div>
        <div className="h-32 bg-gray-300 rounded mt-6"></div>
      </div>
    </div>
  </div>
);

// Simple email validation
const validateEmail = (email) => {
  if (!email) return ['Email address is required'];
  if (!email.includes('@')) return ['Email must contain @ symbol'];
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return ['Please enter a valid email address'];
  return [];
};

const HeroSection = () => {
  const [selectedRole, setSelectedRole] = useState('Landlord');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState('');
  const [emailErrors, setEmailErrors] = useState([]);
  const [hasInteracted, setHasInteracted] = useState(false);
  
  // Simple role content
  const roleContent = useMemo(() => ({
    Landlord: {
      headline: "No more midnight",
      highlightWord: "maintenance",
      endingWords: "calls",
      tagline: "Property management that actually works.",
      description: "Work orders auto-route to vetted pros while you sleep.",
      ctaText: "Start managing smarter"
    },
    Tenant: {
      headline: "Repairs in",
      highlightWord: "one",
      endingWords: "tap",
      tagline: "Rental experience made simple.",
      description: "Snap a photo → track status → get it fixed, hassle-free.",
      ctaText: "Make renting easier"
    },
    Contractor: {
      headline: "Skip bidding—jobs",
      highlightWord: "already",
      endingWords: "approved",
      tagline: "More jobs, better matches.",
      description: "Pre-priced work orders land directly in your queue.",
      ctaText: "Join our network"
    }
  }), []);

  // Simple email submission
  const handleEmailSubmit = useCallback(async (e) => {
    e.preventDefault();
    setHasInteracted(true);
    
    const errors = validateEmail(email);
    setEmailErrors(errors);
    
    if (errors.length > 0) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('');

    try {
      await addDoc(collection(db, 'mail'), {
        to: email,
        message: {
          subject: 'Welcome to Propagentic - You\'re In!',
          text: `Thanks for your interest in Propagentic! We'll keep you updated on our latest features.`
        },
        metadata: {
          source: 'hero_section',
          role: selectedRole.toLowerCase(),
          timestamp: new Date().toISOString()
        }
      });

      setSubmitStatus('success');
      setEmail('');
      setEmailErrors([]);
      setHasInteracted(false);
      
      setTimeout(() => setSubmitStatus(''), 5000);

    } catch (error) {
      console.error('Error subscribing:', error);
      setSubmitStatus('error');
      setEmailErrors(['Unable to subscribe. Please try again later.']);
    } finally {
      setIsSubmitting(false);
    }
  }, [email, selectedRole]);

  // Simple role change
  const handleRoleChange = useCallback((role) => {
    setSelectedRole(role);
    localStorage.setItem('preferredRole', role);
  }, []);

  // Simple email change
  const handleEmailChange = useCallback((e) => {
    const value = e.target.value;
    setEmail(value);
    
    if (hasInteracted && value) {
      const errors = validateEmail(value);
      setEmailErrors(errors);
      if (errors.length === 0) setSubmitStatus('');
    }
  }, [hasInteracted]);

  // Load saved role
  useEffect(() => {
    const savedRole = localStorage.getItem('preferredRole');
    if (savedRole && ['Landlord', 'Contractor', 'Tenant'].includes(savedRole)) {
      setSelectedRole(savedRole);
    }
  }, []);

  const currentContent = roleContent[selectedRole];

  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800">
      <UnifiedHeader variant="marketing" />
      
      {/* Simple main content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 md:py-24 relative z-10">
        <div className="flex flex-col lg:flex-row items-center max-w-7xl mx-auto gap-12 lg:gap-20">
          
          {/* Left Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            {/* Simple Role Selector */}
            <div className="flex justify-center lg:justify-start gap-1 mb-10 sm:mb-12">
              <div className="flex bg-white/20 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                {['Landlord', 'Tenant', 'Contractor'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`px-6 sm:px-8 py-3 text-sm sm:text-base font-semibold transition-all duration-200 ease-out focus:outline-none rounded-lg ${
                      selectedRole === role
                        ? 'bg-white text-gray-700 shadow-lg'
                        : 'text-white hover:text-white/90 hover:bg-white/10'
                    }`}
                    aria-pressed={selectedRole === role}
                    aria-label={`Select ${role} view`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            {/* Simple Content */}
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
                {currentContent.headline}
                {currentContent.highlightWord && (
                  <>
                    {' '}
                    <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 bg-clip-text text-transparent font-bold">
                      {currentContent.highlightWord}
                    </span>
                    {currentContent.endingWords && ` ${currentContent.endingWords}`}
                  </>
                )}
              </h1>
              
              <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-white/95 mb-3 sm:mb-4">
                {currentContent.tagline}
              </h2>
              
              <p className="text-sm sm:text-base font-semibold text-white mb-8 sm:mb-10 max-w-lg mx-auto lg:mx-0" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                {currentContent.description}
              </p>
            </div>
            
            {/* Simple Email Form */}
            <div className="mb-8 sm:mb-10">
              {submitStatus === 'success' ? (
                <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 px-6 py-4 rounded-xl mb-6 shadow-sm" role="alert">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 11-16 0 8 8 0 0116 0zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <div>
                      <span className="font-semibold">You're on the list!</span>
                      <p className="text-sm mt-1">Check your email for confirmation.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleEmailSubmit} className="space-y-4">
                  <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto lg:mx-0">
                    <div className="flex-1">
                      <label htmlFor="email-input" className="sr-only">Work email address</label>
                      <input
                        id="email-input"
                        type="email"
                        value={email}
                        onChange={handleEmailChange}
                        placeholder="Work email"
                        className={`w-full px-4 py-3 rounded-xl bg-white text-gray-900 placeholder-gray-400 border-2 focus:outline-none focus:ring-0 transition-all duration-200 ${
                          emailErrors.length > 0 && hasInteracted
                            ? 'border-red-400 focus:border-red-500' 
                            : email && emailErrors.length === 0 && hasInteracted
                            ? 'border-emerald-400 focus:border-emerald-500'
                            : 'border-gray-100 focus:border-orange-300'
                        }`}
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting || (hasInteracted && emailErrors.length > 0)}
                      className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 sm:px-10 py-3 rounded-xl font-semibold hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent shadow-lg disabled:opacity-70 disabled:cursor-not-allowed transition-all duration-200"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center justify-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="hidden sm:inline">Joining...</span>
                          <span className="sm:hidden">...</span>
                        </span>
                      ) : (
                        <>
                          <span className="hidden sm:inline">{currentContent.ctaText}</span>
                          <span className="sm:hidden">Get Started</span>
                          <span className="ml-2">→</span>
                        </>
                      )}
                    </button>
                  </div>
                  
                  {/* Simple error messages */}
                  {emailErrors.length > 0 && hasInteracted && (
                    <div className="space-y-1" role="alert">
                      {emailErrors.map((error, index) => (
                        <p key={index} className="text-red-200 text-sm flex items-center">
                          <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                          {error}
                        </p>
                      ))}
                    </div>
                  )}
                </form>
              )}
              
              {/* Simple secondary action */}
              <div className="mt-6">
                <Link 
                  to="/how-it-works" 
                  className="inline-flex items-center text-white/90 hover:text-white font-medium transition-colors duration-200"
                >
                  <span>See How It Works</span>
                  <span className="ml-2">→</span>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Right Content - Dashboard Demo */}
          <div className="w-full lg:w-1/2">
            <div className="relative max-w-4xl mx-auto">
              <Suspense fallback={<DashboardSkeleton />}>
                <div className="relative z-10">
                  <EnhancedDashboardDemo role={selectedRole} />
                </div>
              </Suspense>
                
              {/* Simple testimonial */}
              <div className="absolute -top-4 sm:-top-8 -right-4 sm:-right-8 bg-white rounded-2xl p-6 sm:p-8 shadow-2xl w-72 sm:w-80 lg:w-96 transform rotate-1 z-20 border border-gray-100">
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-800 leading-tight">
                  "Tickets closed 3x faster since switching!"
                </p>
                <div className="absolute -bottom-3 left-8 w-6 h-6 bg-white transform rotate-45 border-r border-b border-gray-100"></div>
              </div>
            </div>
            
            {/* Simple testimonial quote */}
            <div className="mt-12 sm:mt-16 bg-white/95 p-8 sm:p-12 lg:p-16 rounded-2xl shadow-2xl border border-white/20 max-w-6xl mx-auto">
              <blockquote className="italic text-gray-900 mb-6 sm:mb-8 text-xl sm:text-2xl lg:text-3xl leading-relaxed font-medium">
                "We solved more issues in 2 weeks with Propagentic than all of last quarter."
              </blockquote>
              <div className="flex items-center">
                <div className="h-16 w-16 sm:h-20 sm:w-20 lg:h-24 lg:w-24 rounded-full bg-orange-300 mr-6 flex-shrink-0"></div>
                <div>
                  <p className="font-bold text-gray-900 text-xl sm:text-2xl lg:text-3xl">Rachel T.</p>
                  <p className="text-lg sm:text-xl lg:text-2xl text-gray-700">Regional Property Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Simple trust section */}
      <section className="container mx-auto px-4 sm:px-6 py-6 relative z-10 max-w-full">
        <div className="text-center mb-6">
          <p className="text-white/80 text-sm sm:text-base mb-2 font-medium inline-flex items-center justify-center">
            Trusted by everyday investors and contractors alike
            <HeartIcon className="w-4 h-4 text-red-400 ml-2" aria-hidden="true" />
          </p>
        </div>
        <div className="max-w-full overflow-hidden">
          <TrustedByCarousel />
        </div>
      </section>
    </div>
  );
};

export default HeroSection; 