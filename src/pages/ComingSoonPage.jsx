import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import WaitlistForm from '../components/waitlist/WaitlistForm';
import WaitlistSuccess from '../components/waitlist/WaitlistSuccess';
import HeroSection from '../components/landing/HeroSection';
import FeatureHighlights from '../components/landing/FeatureHighlights';

const ComingSoonPage = () => {
  const { currentUser, userProfile } = useAuth();
  const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState(false);
  const [launchDate] = useState(new Date('2024-06-01')); // Target launch date

  // Check if user has already joined waitlist
  useEffect(() => {
    if (currentUser && userProfile) {
      // Check if user is already in waitlist or has completed onboarding
      setHasJoinedWaitlist(userProfile.onWaitlist || userProfile.onboardingComplete);
    }
  }, [currentUser, userProfile]);

  const handleWaitlistSuccess = () => {
    setHasJoinedWaitlist(true);
    
    // Track conversion event if gtag is available
    if (typeof gtag !== 'undefined') {
      gtag('event', 'waitlist_signup', {
        event_category: 'engagement',
        event_label: 'coming_soon_page'
      });
    }
  };

  const handleContinueToDashboard = () => {
    // Redirect based on user type
    if (userProfile?.userType) {
      const dashboardRoutes = {
        landlord: '/landlord/dashboard',
        tenant: '/tenant/dashboard',
        contractor: '/contractor/dashboard'
      };
      window.location.href = dashboardRoutes[userProfile.userType] || '/dashboard';
    } else {
      window.location.href = '/role-selection';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-red-50 to-yellow-50 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-orange-200/30 to-red-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-yellow-200/30 to-orange-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-red-100/20 to-orange-100/20 rounded-full blur-3xl"></div>
      </div>

      {/* Top Section: Waitlist (Left) + Hero Content (Right) */}
      <section className="relative py-16 lg:py-24 px-6">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-red-500/5"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(251,146,60,0.1),transparent_50%)] bg-[radial-gradient(circle_at_70%_80%,rgba(239,68,68,0.1),transparent_50%)]"></div>
        
        <div className="relative max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[80vh] lg:min-h-[70vh]">
            
            {/* Left Side: Waitlist Form */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="order-2 lg:order-1 flex flex-col justify-center"
            >

              <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 0.2 }}
              >
                {hasJoinedWaitlist ? (
                  <WaitlistSuccess 
                    userProfile={userProfile}
                    onContinue={handleContinueToDashboard}
                  />
                ) : (
                  <WaitlistForm 
                    onSuccess={handleWaitlistSuccess}
                    currentUser={currentUser}
                  />
                )}
              </motion.div>
            </motion.div>

            {/* Right Side: Hero Content */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-center lg:text-left order-1 lg:order-2 flex flex-col justify-center relative"
            >
              {/* Floating decoration */}
              <motion.div 
                animate={{ 
                  y: [0, -10, 0],
                  rotate: [0, 5, 0]
                }}
                transition={{ 
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-orange-200 to-red-200 rounded-full opacity-20 blur-xl"
              ></motion.div>
              <motion.div 
                animate={{ 
                  y: [0, 10, 0],
                  rotate: [0, -5, 0]
                }}
                transition={{ 
                  duration: 5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: 1
                }}
                className="absolute -bottom-8 -left-8 w-32 h-32 bg-gradient-to-tr from-yellow-200 to-orange-200 rounded-full opacity-20 blur-xl"
              ></motion.div>
              
              <div className="relative">
                <div className="mb-8">
                  <span className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-orange-100 to-red-100 text-orange-700 rounded-full text-sm font-semibold shadow-lg border border-orange-200/50">
                    <span className="mr-2">🚀</span>
                    Coming Soon
                  </span>
                </div>
                
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-8">
                  The Future of{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-600 via-red-600 to-orange-700">
                    Property Management
                  </span>{' '}
                  is Here
                </h1>
                
                <p className="text-xl lg:text-2xl text-gray-600 mb-10 leading-relaxed max-w-2xl">
                  PropAgentic revolutionizes how landlords, tenants, and contractors interact. 
                  Streamline maintenance, automate communications, and grow your property business 
                  with AI-powered insights.
                </p>

                {/* Key Benefits */}
                <div className="grid grid-cols-1 gap-6 mb-10">
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">AI-Powered Automation</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Instant Communication</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4"></path>
                      </svg>
                    </div>
                    <span className="text-gray-700 font-medium">Smart Analytics & Insights</span>
                  </div>
                </div>

                {/* Stats Preview */}
                <div className="grid grid-cols-3 gap-4 lg:gap-6 text-center lg:text-left">
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-lg border border-white/30 hover:shadow-xl transition-shadow duration-300">
                    <div className="text-2xl lg:text-3xl font-bold text-orange-600 mb-2">500+</div>
                    <div className="text-xs lg:text-sm text-gray-600 font-medium">Properties Ready</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-lg border border-white/30 hover:shadow-xl transition-shadow duration-300">
                    <div className="text-2xl lg:text-3xl font-bold text-red-600 mb-2">1,200+</div>
                    <div className="text-xs lg:text-sm text-gray-600 font-medium">Early Requests</div>
                  </div>
                  <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 lg:p-6 shadow-lg border border-white/30 hover:shadow-xl transition-shadow duration-300">
                    <div className="text-2xl lg:text-3xl font-bold text-yellow-600 mb-2">50+</div>
                    <div className="text-xs lg:text-sm text-gray-600 font-medium">Contractors</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Feature Highlights */}
      <FeatureHighlights />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <h3 className="text-xl font-bold mb-4">PropAgentic</h3>
              <p className="text-gray-400 mb-4 max-w-md">
                The future of property management is here. Join thousands of landlords, 
                tenants, and contractors who are already building the future with us.
              </p>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">Twitter</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-white transition-colors">
                  <span className="sr-only">LinkedIn</span>
                  <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#features" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Roadmap</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 PropAgentic. All rights reserved. Coming Soon.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ComingSoonPage; 