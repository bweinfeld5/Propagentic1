import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import WaitlistForm from '../waitlist/WaitlistForm';
import WaitlistSuccess from '../waitlist/WaitlistSuccess';
import { useAuth } from '../../context/AuthContext';
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

const HeroSection = ({ launchDate }) => {
  const { currentUser, userProfile } = useAuth();
  const [selectedRole, setSelectedRole] = useState('Landlord');
  const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  // Check if user has already joined waitlist
  useEffect(() => {
    if (currentUser && userProfile) {
      setHasJoinedWaitlist(userProfile.onWaitlist || userProfile.onboardingComplete);
    }
  }, [currentUser, userProfile]);

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

  // Simple role change
  const handleRoleChange = useCallback((role) => {
    setSelectedRole(role);
    localStorage.setItem('preferredRole', role);
  }, []);

  const handleWaitlistSuccess = () => {
    setHasJoinedWaitlist(true);
    
    // Track conversion event if gtag is available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'waitlist_signup', {
        event_category: 'engagement',
        event_label: 'hero_section'
      });
    }
  };

  // Load saved role
  useEffect(() => {
    const savedRole = localStorage.getItem('preferredRole');
    if (savedRole && ['Landlord', 'Contractor', 'Tenant'].includes(savedRole)) {
      setSelectedRole(savedRole);
    }
  }, []);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(launchDate) - +new Date();
      
      if (difference > 0) {
        setTimeLeft({
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60)
        });
      }
    };

    const timer = setInterval(calculateTimeLeft, 1000);
    calculateTimeLeft(); // Initial calculation

    return () => clearInterval(timer);
  }, [launchDate]);

  const currentContent = roleContent[selectedRole];

  return (
    <div className="relative overflow-hidden min-h-screen bg-gradient-to-br from-gray-600 via-gray-700 to-gray-800">
      
      {/* Top Section: Waitlist (Left) + Header/Navigation (Right) */}
      <div className="relative z-20 w-full">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 pt-4 pb-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
            
            {/* Left Side: Waitlist Form (Takes up most space on desktop) */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="lg:col-span-8 xl:col-span-9"
            >
              {hasJoinedWaitlist ? (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">
                  <WaitlistSuccess />
                  <div className="mt-4 text-center">
                    <Link 
                      to="/how-it-works" 
                      className="inline-flex items-center text-orange-600 hover:text-orange-700 font-semibold transition-colors duration-200 text-sm sm:text-base"
                    >
                      <span>Learn More About PropAgentic</span>
                      <span className="ml-2">→</span>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8">
                  <div className="text-center mb-4 sm:mb-6">
                    <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 mb-2">
                      🚀 Join the PropAgentic Waitlist
                    </h2>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Be among the first to experience the future of property management
                    </p>
                  </div>
                  <WaitlistForm 
                    onSuccess={handleWaitlistSuccess} 
                    currentUser={currentUser}
                    compact={true}
                  />
                </div>
              )}
            </motion.div>

            {/* Right Side: Header/Navigation */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-4 xl:col-span-3"
            >
              <div className="flex flex-col items-center lg:items-end space-y-4">
                {/* PropAgentic Logo */}
                <Link to="/" className="text-white text-xl sm:text-2xl font-bold tracking-tight hover:opacity-80 transition-opacity">
                  propagentic
                </Link>
                
                {/* Navigation Links */}
                <div className="flex flex-col sm:flex-row lg:flex-col items-center space-y-2 sm:space-y-0 sm:space-x-4 lg:space-x-0 lg:space-y-2">
                  {currentUser ? (
                    <div className="flex flex-col items-center lg:items-end space-y-2 text-center lg:text-right">
                      <span className="text-sm text-white/90">
                        Welcome, {userProfile?.firstName || currentUser.email}
                      </span>
                      <Link
                        to="/dashboard"
                        className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-all duration-200 border border-white/20"
                      >
                        Go to Dashboard
                      </Link>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row lg:flex-col items-center space-y-2 sm:space-y-0 sm:space-x-3 lg:space-x-0 lg:space-y-2">
                      <Link
                        to="/login"
                        className="text-white/90 hover:text-white text-sm font-medium transition-colors px-3 py-1"
                      >
                        Sign In
                      </Link>
                      <Link
                        to="/signup"
                        className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-white/30 transition-all duration-200 border border-white/20"
                      >
                        Sign Up
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Main Hero Content */}
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 relative z-10">
        <div className="max-w-7xl mx-auto">
          
          {/* Hero Headline Section */}
          <div className="text-center mb-8 lg:mb-12">
            {/* Role Selector */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex justify-center gap-1 mb-8 sm:mb-10"
            >
              <div className="flex bg-white/20 backdrop-blur-sm p-1 rounded-xl border border-white/20">
                {['Landlord', 'Tenant', 'Contractor'].map((role) => (
                  <button
                    key={role}
                    onClick={() => handleRoleChange(role)}
                    className={`px-4 sm:px-6 lg:px-8 py-2 sm:py-3 text-sm sm:text-base font-semibold transition-all duration-200 ease-out focus:outline-none rounded-lg ${
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
            </motion.div>

            {/* Main Headline */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="mb-8"
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold text-white leading-tight mb-4 sm:mb-6">
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
              
              <p className="text-sm sm:text-base lg:text-lg font-semibold text-white/90 max-w-2xl mx-auto" style={{textShadow: '0 2px 4px rgba(0,0,0,0.5)'}}>
                {currentContent.description}
              </p>
            </motion.div>
          </div>

          {/* Dashboard Demo Section */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.8 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-20 items-center mb-12 sm:mb-16 lg:mb-20"
          >
            {/* Left: Additional Info */}
            <div className="text-center lg:text-left order-2 lg:order-1">
              <div className="space-y-6">
                {/* Key Benefits */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4">
                  <div className="flex items-center justify-center lg:justify-start space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-white font-medium text-sm sm:text-base">AI-Powered Automation</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                    <span className="text-white font-medium text-sm sm:text-base">Instant Communication</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-3 p-4 bg-white/10 backdrop-blur-sm rounded-lg sm:col-span-2 lg:col-span-1 xl:col-span-2">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4"></path>
                      </svg>
                    </div>
                    <span className="text-white font-medium text-sm sm:text-base">Smart Analytics & Insights</span>
                  </div>
                </div>

                {/* Learn More Link */}
                <div className="pt-4">
                  <Link 
                    to="/how-it-works" 
                    className="inline-flex items-center text-white/90 hover:text-white font-medium transition-colors duration-200 text-sm sm:text-base"
                  >
                    <span>See How It Works</span>
                    <span className="ml-2">→</span>
                  </Link>
                </div>
              </div>
            </div>
            
            {/* Right: Dashboard Demo */}
            <div className="order-1 lg:order-2">
              <div className="relative max-w-2xl mx-auto lg:max-w-none">
                <Suspense fallback={<DashboardSkeleton />}>
                  <div className="relative z-10">
                    <EnhancedDashboardDemo role={selectedRole} />
                  </div>
                </Suspense>
                  
                {/* Floating testimonial */}
                <div className="absolute -top-2 sm:-top-4 -right-2 sm:-right-4 lg:-right-8 bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-2xl w-64 sm:w-72 lg:w-80 xl:w-96 transform rotate-1 z-20 border border-gray-100">
                  <p className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold text-gray-800 leading-tight">
                    "Tickets closed 3x faster since switching!"
                  </p>
                  <div className="absolute -bottom-3 left-6 sm:left-8 w-6 h-6 bg-white transform rotate-45 border-r border-b border-gray-100"></div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Bottom Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.0 }}
            className="mb-12 sm:mb-16 lg:mb-20"
          >
            <div className="bg-white/95 backdrop-blur-sm p-6 sm:p-8 lg:p-12 xl:p-16 rounded-2xl shadow-2xl border border-white/20 max-w-4xl mx-auto">
              <blockquote className="italic text-gray-900 mb-6 sm:mb-8 text-lg sm:text-xl lg:text-2xl xl:text-3xl leading-relaxed font-medium text-center">
                "We solved more issues in 2 weeks with PropAgentic than all of last quarter."
              </blockquote>
              <div className="flex items-center justify-center">
                <div className="h-12 w-12 sm:h-16 sm:w-16 lg:h-20 lg:w-20 rounded-full bg-orange-300 mr-4 sm:mr-6 flex-shrink-0"></div>
                <div className="text-center sm:text-left">
                  <p className="font-bold text-gray-900 text-lg sm:text-xl lg:text-2xl">Rachel T.</p>
                  <p className="text-base sm:text-lg lg:text-xl text-gray-700">Regional Property Manager</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      
      {/* Trust section */}
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