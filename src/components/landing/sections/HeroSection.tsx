import React, { useState, useEffect, useMemo } from 'react';
import { SafeMotion, AnimatePresence } from '../../shared/SafeMotion';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import AnimatedBlueprintBackground from '../../branding/AnimatedBlueprintBackground';
import Lottie from 'lottie-react';
import weldingSpark from '../../../assets/lottie/welding-spark.json';

// Import images for role icons
import landlordIcon from '../../../assets/icons/landlord-icon.svg';
import tenantIcon from '../../../assets/icons/tenant-icon.svg';
import contractorIcon from '../../../assets/icons/contractor-icon.svg';
import logo from '../../../assets/images/logo.svg';

interface HeroSectionProps {
  title?: string;
  subtitle?: string;
  ctaText?: string;
  ctaLink?: string;
  secondaryCtaText?: string;
  secondaryCtaLink?: string;
}

/**
 * Stripe-inspired hero section component
 */
const HeroSection: React.FC<HeroSectionProps> = ({
  ctaText = "Start now",
  ctaLink = "/signup",
  secondaryCtaText = "Contact sales",
  secondaryCtaLink = "/contact",
}) => {
  // Track selected role for personalized content
  const [selectedRole, setSelectedRole] = useState<'Landlord' | 'Tenant' | 'Contractor'>('Landlord');
  const [email, setEmail] = useState('');
  
  // Content specific to each role
  const roleContent = useMemo(() => ({
    Landlord: {
      headline1: "Property",
      headline2: "infrastructure",
      headline3: "to scale your business",
      description: "Join thousands of property managers that use Propagentic to streamline operations, automate maintenance workflows, and boost tenant satisfaction.",
      dashboardImage: "/assets/dashboard-preview.png",
      ctaText: "Start managing properties",
    },
    Contractor: {
      headline1: "Service",
      headline2: "infrastructure",
      headline3: "to grow your business",
      description: "Find new clients, manage schedules efficiently, and get paid faster with our integrated contractor platform.",
      dashboardImage: "/assets/dashboard-preview.png",
      ctaText: "Join our network",
    },
    Tenant: {
      headline1: "Rental",
      headline2: "experience",
      headline3: "reimagined",
      description: "Submit maintenance requests, pay rent, and communicate with your landlord—all through one simple, modern interface.",
      dashboardImage: "/assets/dashboard-preview.png",
      ctaText: "Make renting easier",
    }
  }), []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission
    window.location.href = `${ctaLink}?email=${encodeURIComponent(email)}&role=${selectedRole.toLowerCase()}`;
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        staggerChildren: 0.1,
        duration: 0.5
      }
    }
  };
  
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  // Helper function to render nav tab
  const renderNavTab = (label: string, isActive: boolean, onClick: () => void) => (
    <button
      className={`px-4 py-2 text-sm font-medium transition-colors ${
        isActive 
          ? 'text-white' 
          : 'text-white/70 hover:text-white'
      }`}
      onClick={onClick}
    >
      {label}
    </button>
  );

  return (
    <UIComponentErrorBoundary componentName="HeroSection">
      <div className="relative min-h-screen w-full overflow-hidden">
        {/* Gradient background with blueprint integration */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/95 via-blue-900/95 to-indigo-800/95 z-0"></div>
        
        {/* Blueprint background with blend mode for integration with gradient */}
        <div className="absolute inset-0 z-[1] overflow-hidden w-full h-full pointer-events-none mix-blend-overlay">
          <AnimatedBlueprintBackground 
            density="dense" 
            section="hero"
            useInlineSvg={true}
          />
        </div>
        
        {/* Shimmer effect overlay */}
        <div className="absolute inset-0 z-[2] bg-gradient-to-tr from-transparent via-cyan-500/5 to-transparent opacity-70 pointer-events-none"></div>
        
        {/* Subtle grid pattern for additional depth */}
        <div className="absolute inset-0 z-[2] opacity-10 pointer-events-none" 
             style={{ 
               backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
               backgroundSize: '20px 20px' 
             }}>
        </div>
        
        {/* Content container */}
        <div className="relative z-10 min-h-screen w-full pt-16">
          {/* Main promotional banner like Stripe */}
          <div className="container mx-auto px-6 pt-28 pb-32 md:pt-36 md:pb-40">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
              <div>
                {/* Small role selector tabs */}
                <div className="mb-6 inline-flex rounded-full bg-white/15 backdrop-blur-sm p-1 shadow-md">
                  {['Landlord', 'Tenant', 'Contractor'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setSelectedRole(role as 'Landlord' | 'Tenant' | 'Contractor')}
                      className={`px-6 py-3 text-sm font-medium rounded-full transition-colors ${
                        selectedRole === role
                          ? 'bg-white text-indigo-900 shadow-md'
                          : 'text-white hover:bg-white/20'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
                
                <SafeMotion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <SafeMotion.div
                      key={selectedRole}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      {/* Stripe-like headline with multiple parts */}
                      <SafeMotion.h1 
                        className="text-6xl md:text-7xl font-bold text-white mb-6 leading-tight"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          type: 'spring',
                          stiffness: 300,
                          damping: 24,
                          delay: 0.1
                        }}
                      >
                        {roleContent[selectedRole].headline1}{' '}
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-indigo-300">
                          {roleContent[selectedRole].headline2}
                        </span>
                        <br/>
                        {roleContent[selectedRole].headline3}
                      </SafeMotion.h1>
                      
                      <SafeMotion.p 
                        className="text-xl text-white/80 max-w-xl mb-10"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ 
                          type: 'spring',
                          stiffness: 300,
                          damping: 24,
                          delay: 0.2
                        }}
                      >
                        {roleContent[selectedRole].description}
                      </SafeMotion.p>
                      
                      {/* Email input and CTA button */}
                      <form 
                        onSubmit={handleSubmit}
                        className="flex flex-col sm:flex-row gap-3 max-w-md"
                      >
                        <input
                          type="email"
                          placeholder="Email address"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="bg-white rounded-md px-4 py-3 flex-grow text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          required
                        />
                        <button
                          type="submit"
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium rounded-md px-8 py-3 transition-colors shadow-md"
                        >
                          {ctaText} →
                        </button>
                      </form>
                    </SafeMotion.div>
                  </AnimatePresence>
                </SafeMotion.div>
              </div>
              
              {/* Dashboard Preview with floating metrics */}
              <div className="relative mx-auto w-full max-w-3xl mt-12 md:mt-16">
                {/* Laptop Frame */}
                <div className="relative mx-auto w-full aspect-[16/10] transform hover:scale-[1.02] transition-transform duration-300 ease-in-out">
                  {/* Laptop body */}
                  <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-gray-300 to-gray-100 dark:from-gray-700 dark:to-gray-900 shadow-2xl overflow-hidden">
                    {/* Screen bezel */}
                    <div className="absolute inset-[3%] rounded-lg bg-black overflow-hidden flex flex-col shadow-inner border border-gray-700">
                      {/* Browser bar */}
                      <div className="h-7 bg-gray-800 flex items-center px-3">
                        <div className="flex space-x-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <div className="mx-auto bg-gray-700 rounded-md w-1/2 h-4"></div>
                      </div>
                      {/* Actual dashboard display */}
                      <div className="flex-1 relative bg-gray-100 dark:bg-gray-900">
                        {/* Adding a fallback UI for when the image cannot be loaded */}
                        <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-white p-4">
                          <div className="text-center">
                            <h3 className="text-xl font-semibold mb-2">{selectedRole} Dashboard</h3>
                            <p className="text-sm text-gray-300 mb-4">Smart property management for {selectedRole}s</p>
                            
                            {/* Mock dashboard UI with role-specific colors */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-gray-700 rounded p-2">
                                <div className={`w-full h-2 ${
                                  selectedRole === 'Landlord' ? 'bg-blue-500' : 
                                  selectedRole === 'Tenant' ? 'bg-green-500' : 
                                  'bg-purple-500'
                                } rounded mb-1`}></div>
                                <div className="w-3/4 h-2 bg-gray-500 rounded"></div>
                              </div>
                              <div className="bg-gray-700 rounded p-2">
                                <div className={`w-full h-2 ${
                                  selectedRole === 'Landlord' ? 'bg-indigo-500' : 
                                  selectedRole === 'Tenant' ? 'bg-teal-500' : 
                                  'bg-amber-500'
                                } rounded mb-1`}></div>
                                <div className="w-2/3 h-2 bg-gray-500 rounded"></div>
                              </div>
                              <div className="bg-gray-700 rounded p-2">
                                <div className={`w-full h-2 ${
                                  selectedRole === 'Landlord' ? 'bg-cyan-500' : 
                                  selectedRole === 'Tenant' ? 'bg-emerald-500' : 
                                  'bg-pink-500'
                                } rounded mb-1`}></div>
                                <div className="w-1/2 h-2 bg-gray-500 rounded"></div>
                              </div>
                              <div className="bg-gray-700 rounded p-2">
                                <div className={`w-full h-2 ${
                                  selectedRole === 'Landlord' ? 'bg-sky-500' : 
                                  selectedRole === 'Tenant' ? 'bg-lime-500' : 
                                  'bg-orange-500'
                                } rounded mb-1`}></div>
                                <div className="w-4/5 h-2 bg-gray-500 rounded"></div>
                              </div>
                            </div>
                            
                            {/* Mock table */}
                            <div className="bg-gray-700 rounded p-2">
                              <div className="grid grid-cols-3 gap-1 mb-1">
                                <div className="h-2 bg-gray-500 rounded"></div>
                                <div className="h-2 bg-gray-500 rounded"></div>
                                <div className="h-2 bg-gray-500 rounded"></div>
                              </div>
                              <div className="grid grid-cols-3 gap-1 mb-1">
                                <div className="h-2 bg-gray-600 rounded"></div>
                                <div className="h-2 bg-gray-600 rounded"></div>
                                <div className="h-2 bg-gray-600 rounded"></div>
                              </div>
                              <div className="grid grid-cols-3 gap-1">
                                <div className="h-2 bg-gray-600 rounded"></div>
                                <div className="h-2 bg-gray-600 rounded"></div>
                                <div className="h-2 bg-gray-600 rounded"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Laptop base */}
                  <div className="absolute -bottom-[3%] left-[10%] right-[10%] h-[4%] bg-gradient-to-br from-gray-300 to-gray-100 dark:from-gray-700 dark:to-gray-900 rounded-b-xl shadow-2xl"></div>
                  
                  {/* Reflection effect */}
                  <div className="absolute inset-0 rounded-xl bg-white opacity-5 mix-blend-overlay"></div>
                </div>

                {/* Floating Metrics - Keep these positioned relative to the laptop frame */}
                <SafeMotion.div
                  className="absolute -left-4 md:-left-10 top-1/4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-[180px]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                >
                  <div className="flex items-center mb-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                    <p className="text-xs font-medium">New Maintenance Request</p>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300">Leak in Unit 302. Tenant reports water damage.</p>
                </SafeMotion.div>

                <SafeMotion.div
                  className="absolute -right-4 md:-right-10 top-1/3 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-[180px]"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7, duration: 0.5 }}
                >
                  <div className="flex items-start">
                    <div className="bg-blue-100 dark:bg-blue-900 p-2 rounded mr-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Tenant Satisfaction</p>
                      <p className="text-lg font-bold">94%</p>
                      <p className="text-xs text-green-500">↑ 12% from last month</p>
                    </div>
                  </div>
                </SafeMotion.div>

                <SafeMotion.div
                  className="absolute -left-4 md:-left-10 bottom-1/4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-3 max-w-[180px]"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.9, duration: 0.5 }}
                >
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs font-medium">Average Response</p>
                      <p className="text-sm font-bold">4.2 hours</p>
                    </div>
                  </div>
                </SafeMotion.div>
              </div>
            </div>
          </div>
          
          {/* Announcement banner - like Stripe Sessions */}
          <div className="container mx-auto flex justify-center mb-8">
            <div className="bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm inline-flex items-center">
              <span className="mr-2">New AI-powered maintenance workflow</span>
              <span className="font-medium">Request a demo →</span>
            </div>
          </div>
        </div>
        
        
        {/* Welding spark animation at bottom */}
        <div className="absolute bottom-4 right-8 z-10">
          <Lottie 
            animationData={weldingSpark} 
            loop={false} 
            style={{ width: 80, height: 80 }}
            aria-hidden="true"
          />
        </div>
        
        {/* Glow effects */}
        <div className="absolute -z-10 -top-[10%] -left-[20%] w-[140%] h-[140%] bg-gradient-to-br from-blue-400/20 via-transparent to-purple-400/20 blur-3xl"></div>
        <div className="absolute -z-10 -bottom-[20%] -right-[30%] w-[140%] h-[140%] bg-gradient-to-tl from-indigo-500/30 via-transparent to-teal-400/20 blur-3xl"></div>
        <div className="absolute -z-10 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-gradient-to-tl from-blue-600/10 via-indigo-600/20 to-purple-500/10 blur-3xl opacity-70"></div>
      </div>
    </UIComponentErrorBoundary>
  );
};

export default HeroSection; 