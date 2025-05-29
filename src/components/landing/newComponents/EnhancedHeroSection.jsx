import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { SafeMotion, AnimatePresence } from '../../shared/SafeMotion';
import EnhancedRoleSelector from './EnhancedRoleSelector';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import Button from '../../ui/Button';

// Define role-specific sub-headlines
const roleSubheadlines = {
  Landlord: "Effortlessly manage properties, track maintenance, communicate with tenants, and handle payments – all in one place.",
  Tenant: "Easily submit maintenance requests, pay rent online, and communicate with your landlord through a simple, modern interface.",
  Contractor: "Receive job requests, manage schedules, submit invoices, and get paid faster by connecting directly with landlords.",
};

const EnhancedHeroSection = () => {
  const [selectedRole, setSelectedRole] = useState('Landlord');
  const roles = ['Landlord', 'Tenant', 'Contractor'];
  
  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { 
        when: "beforeChildren",
        staggerChildren: 0.2,
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
  
  // For scroll indicator animation
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY <= 100);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  // Memoize particle styles to avoid recalculation on every render
  const particles = useMemo(() => {
    const numParticles = 15; // Reduced particle count
    return [...Array(numParticles)].map((_, i) => ({
      id: i,
      style: {
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        width: `${Math.random() * 15 + 5}px`, // Slightly smaller max size
        height: `${Math.random() * 15 + 5}px`, // Slightly smaller max size
      },
      animate: {
        y: [0, Math.random() * 30 - 15],
        x: [0, Math.random() * 30 - 15],
        scale: [1, Math.random() * 0.5 + 0.7, 1], // Less drastic scaling
      },
      transition: {
        duration: Math.random() * 6 + 6, // Slightly slower animation
        repeat: Infinity,
        repeatType: 'reverse',
        ease: "easeInOut" // Smoother easing
      }
    }));
  }, []); // Empty dependency array ensures this runs only once
  
  return (
    <UIComponentErrorBoundary componentName="Hero Section">
      <div className="relative">
        {/* Background - Updated for Light/Dark Theme */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-dark via-primary to-primary-light dark:from-neutral-900 dark:to-neutral-800 overflow-hidden">
          {/* Particles - Updated Color */}
          <div className="absolute inset-0 overflow-hidden opacity-15">
            {particles.map((particle) => (
              <SafeMotion.div
                key={particle.id}
                className="absolute rounded-full bg-primary-light dark:bg-primary/50"
                style={particle.style}
                initial={false}
                animate={particle.animate}
                transition={particle.transition}
              />
            ))}
          </div>
        </div>
        
        {/* Hero content */}
        <div className="relative pt-32 pb-24 md:pt-40 md:pb-32">
          <div className="container mx-auto px-6">
            <SafeMotion.div
              className="text-center max-w-4xl mx-auto"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <SafeMotion.h1 
                className="text-4xl md:text-6xl font-bold text-white mb-6"
                variants={itemVariants}
              >
                Property Management <span className="text-primary-light">Reimagined</span> with AI
              </SafeMotion.h1>
              
              <div className="min-h-[100px] md:min-h-[120px] mb-12 flex items-center justify-center">
                <AnimatePresence mode="wait">
                  <SafeMotion.p 
                    key={selectedRole}
                    className="text-xl md:text-2xl text-neutral-100 max-w-3xl mx-auto"
                    variants={itemVariants}
                    initial="hidden"
                    animate="visible"
                    exit={{ opacity: 0, y: -20, transition: { duration: 0.15 } }}
                  >
                    {roleSubheadlines[selectedRole]}
                  </SafeMotion.p>
                </AnimatePresence>
              </div>
              
              <SafeMotion.div
                variants={itemVariants}
                className="mb-16"
              >
                <EnhancedRoleSelector
                  roles={roles}
                  selectedRole={selectedRole}
                  setSelectedRole={setSelectedRole}
                />
              </SafeMotion.div>
              
              <SafeMotion.div 
                className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-6 justify-center"
                variants={itemVariants}
              >
                <Button 
                  to={`/signup?role=${selectedRole.toLowerCase()}`}
                  variant="light"
                  size="lg"
                  className="px-10 py-4 font-semibold"
                >
                  Get Started Free
                </Button>
                <Button 
                  to="/demo" 
                  variant="outline-inverse"
                  size="lg"
                  className="px-8 py-4 font-medium"
                >
                  Watch Demo
                </Button>
              </SafeMotion.div>
            </SafeMotion.div>
          </div>
        </div>
        
        <SafeMotion.div 
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white flex flex-col items-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: isVisible ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          <span className="text-sm mb-3">Scroll to explore</span>
          <SafeMotion.div
            className="w-3 h-3 bg-primary-light rounded-full shadow-lg"
            animate={{
              scale: [1, 1.5, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </SafeMotion.div>
      </div>
    </UIComponentErrorBoundary>
  );
};

export default EnhancedHeroSection; 