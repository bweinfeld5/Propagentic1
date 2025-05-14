import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/images/logo.svg';
import LandlordDashboardDemo from './LandlordDashboardDemo';
import ContractorDashboardDemo from './ContractorDashboardDemo';
import TenantDashboardDemo from './TenantDashboardDemo';

const HeroSection = () => {
  const [selectedRole, setSelectedRole] = useState('Landlord');
  
  // Role-based content
  const roleContent = {
    Landlord: {
      headline: "Cut maintenance response times by 65%",
      description: "Verified contractors. Real-time tracking. Done in a click.",
      image: "landlord-dashboard.png"
    },
    Contractor: {
      headline: "Get matched with more jobs — instantly",
      description: "Verified contractors. Real-time tracking. Done in a click.",
      image: "contractor-dashboard.png"
    },
    Tenant: {
      headline: "Submit & track issues in real time",
      description: "Verified contractors. Real-time tracking. Done in a click.",
      image: "tenant-dashboard.png"
    }
  };

  // Save role preference to localStorage
  useEffect(() => {
    localStorage.setItem('preferredRole', selectedRole);
  }, [selectedRole]);
  
  // Load preferred role from localStorage on initial load
  useEffect(() => {
    const savedRole = localStorage.getItem('preferredRole');
    if (savedRole && ['Landlord', 'Contractor', 'Tenant'].includes(savedRole)) {
      setSelectedRole(savedRole);
    }
  }, []);
  
  // Animation for the "See How It Works" arrow
  const [isHovered, setIsHovered] = useState(false);
  
  // Dashboard transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  // Handle role change with animation
  const handleRoleChange = (role) => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedRole(role);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 300);
  };

  // Add scroll state for navbar effect
  const [isScrolled, setIsScrolled] = useState(false);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="relative overflow-hidden min-h-screen">
      {/* Enhanced gradient background - made stronger and positioned to be behind all content */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-700 opacity-95"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-400/40 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-indigo-700/50 to-transparent"></div>
        
        {/* Added subtle grid pattern for texture */}
        <div className="absolute inset-0 opacity-10">
          <div className="h-full w-full" style={{
            backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px'
          }}></div>
        </div>
      </div>
      
      {/* Glassy Navigation Bar */}
      <div className={`
        sticky top-0 z-50 w-full 
        transition-all duration-300 ease-in-out 
        ${isScrolled 
          ? 'backdrop-blur-md bg-white/10 shadow-lg border-b border-white/20' // More visible when scrolled
          : 'backdrop-blur-sm bg-transparent' // More transparent when at top
        }
      `}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <img src={Logo} alt="Propagentic Logo" className="h-8" />
            </div>
            
            <div className="hidden md:flex space-x-8">
              <Link to="/" className="text-white hover:text-white/80 font-medium">
                Home
              </Link>
              <Link to="/pricing" className="text-white hover:text-white/80 font-medium">
                Pricing
              </Link>
              <Link to="/about" className="text-white hover:text-white/80 font-medium">
                About
              </Link>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link to="/login" className="text-white hover:text-white/80 font-medium">
                Log In
              </Link>
              <Link to="/signup" className={`
                bg-white/10 px-4 py-2 rounded-md font-medium 
                ${isScrolled 
                  ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md' 
                  : 'backdrop-blur-md hover:bg-white/20 text-white'
                } 
                transition duration-300
              `}>
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hero Content */}
      <div className="container mx-auto px-8 pt-16 pb-24 md:py-24 relative z-10">
        <div className="flex flex-col md:flex-row items-center max-w-7xl mx-auto">
          <div className="md:w-1/2 md:pr-16">
            {/* Large role selector cards - without icons */}
            <div className="flex flex-wrap gap-4 mb-10">
              {['Landlord', 'Contractor', 'Tenant'].map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  className={`flex items-center justify-center px-8 py-4 rounded-xl transition-all duration-300 ${
                    selectedRole === role
                      ? 'bg-white text-indigo-900 shadow-lg transform scale-105'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <span className="font-medium">{role}</span>
                </button>
              ))}
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-6">
              {roleContent[selectedRole].headline}
            </h1>
            <p className="text-xl text-white mb-10 max-w-xl">
              {roleContent[selectedRole].description}
            </p>
            
            {/* Email input and CTA buttons */}
            <div className="mb-8">
              <form className="flex flex-col sm:flex-row gap-3 mb-6">
                <input
                  type="email"
                  placeholder="Work email"
                  className="px-4 py-3 rounded-lg bg-white text-indigo-900 placeholder-indigo-400 border border-indigo-100 focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <button
                  type="submit"
                  className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-indigo-500 transition duration-150 shadow-md flex items-center justify-center"
                >
                  <span>Get Started Free</span>
                  <span className="ml-2">✅</span>
                </button>
              </form>
              
              <Link 
                to="/how-it-works" 
                className="inline-flex items-center border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 transition duration-150"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
              >
                <span>See How It Works</span>
                <span className={`ml-2 transition-transform duration-300 ${isHovered ? 'translate-x-1' : ''}`}>→</span>
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2 mt-12 md:mt-0">
            <div className="relative">
              {/* Adding depth to the dashboard mockup with custom transition */}
              <div className="relative transform perspective-1000 hover:scale-105 transition-transform duration-500 shadow-2xl rounded-xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-xl"></div>
                
                {/* Dashboard with custom transition */}
                <div className={`relative z-10 transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
                  {selectedRole === 'Landlord' && <LandlordDashboardDemo />}
                  {selectedRole === 'Contractor' && <ContractorDashboardDemo />}
                  {selectedRole === 'Tenant' && <TenantDashboardDemo />}
                </div>
                
                {/* Floating testimonial bubble */}
                <div className="absolute -top-10 -right-5 bg-white rounded-lg p-3 shadow-lg w-52 transform rotate-2 z-20">
                  <p className="text-sm font-medium text-gray-800">
                    "Tickets closed 3x faster since switching!"
                  </p>
                  <div className="absolute -bottom-2 left-6 w-4 h-4 bg-white transform rotate-45"></div>
                </div>
                
                {/* Activity pulse indicator */}
                <div className="absolute top-5 right-5 flex items-center">
                  <span className="relative flex h-3 w-3 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                  <span className="text-xs text-white bg-black/30 px-2 py-1 rounded-full">Live Data</span>
                </div>
              </div>
            </div>
            
            {/* Testimonial Quote */}
            <div className="mt-8 bg-white p-6 rounded-lg shadow-lg border border-indigo-100">
              <p className="italic text-indigo-900 mb-4">
                "We solved more issues in 2 weeks with Propagentic than all of last quarter."
              </p>
              <div className="flex items-center">
                <div className="h-10 w-10 rounded-full bg-indigo-300 mr-3"></div>
                <div>
                  <p className="font-semibold text-indigo-900">Rachel T.</p>
                  <p className="text-sm text-indigo-700/80">Regional Property Manager</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Trust badges/logos with improved contrast */}
      <div className="container mx-auto px-6 py-8 relative z-10">
        <p className="text-center text-white text-sm mb-6">Trusted by forward-thinking property managers</p>
        <div className="flex flex-wrap justify-center gap-8 items-center">
          <div className="h-8 w-32 bg-white/20 rounded-md"></div>
          <div className="h-8 w-24 bg-white/20 rounded-md"></div>
          <div className="h-8 w-36 bg-white/20 rounded-md"></div>
          <div className="h-8 w-28 bg-white/20 rounded-md"></div>
        </div>
      </div>
      
      {/* Security Badges with improved visibility */}
      <div className="container mx-auto px-6 py-8 flex flex-wrap justify-center gap-6 relative z-10">
        <div className="flex items-center space-x-2 text-sm text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>GDPR-Compliant</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>SOC2-Ready</span>
        </div>
        <div className="flex items-center space-x-2 text-sm text-white">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span>Firebase Secured</span>
        </div>
      </div>
      
      {/* Wave divider - adding more contrast for the wave */}
      <div className="absolute bottom-0 left-0 right-0 z-10">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full">
          <path fill="#ffffff" fillOpacity="1" d="M0,96L80,106.7C160,117,320,139,480,154.7C640,171,800,181,960,165.3C1120,149,1280,107,1360,85.3L1440,64L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"></path>
        </svg>
      </div>
    </div>
  );
};

export default HeroSection; 