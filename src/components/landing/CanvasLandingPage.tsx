import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ChevronDownIcon,
  CheckCircleIcon,
  StarIcon,
  ArrowRightIcon,
  PlayIcon,
  UsersIcon,
  HomeIcon,
  WrenchScrewdriverIcon
} from '@heroicons/react/24/outline';

// Import Canvas components
import CanvasCard from '../ui/canvas/CanvasCard';
import CanvasButton from '../ui/canvas/CanvasButton';
import CanvasBadge from '../ui/canvas/CanvasBadge';
import { canvasDesignSystem } from '../../styles/canvasDesignSystem';

interface SectionRef {
  hero: HTMLElement | null;
  solutions: HTMLElement | null;
  features: HTMLElement | null;
  testimonials: HTMLElement | null;
  cta: HTMLElement | null;
}

const CanvasLandingPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<'landlord' | 'tenant' | 'contractor'>('landlord');
  const [activeSection, setActiveSection] = useState('hero');
  const [scrollY, setScrollY] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Refs for sections
  const sectionRefs = useRef<SectionRef>({
    hero: null,
    solutions: null,
    features: null,
    testimonials: null,
    cta: null
  });

  // Role content configuration
  const roleContent = {
    landlord: {
      headline: "Take control of your properties with automation, insights, and streamlined workflows.",
      benefits: [
        "Automated maintenance routing",
        "Real-time property insights", 
        "Vetted contractor network",
        "Tenant communication portal"
      ],
      icon: <HomeIcon className="w-8 h-8" />,
      color: "bg-primary-500",
      gradient: "from-primary-400 to-primary-600"
    },
    tenant: {
      headline: "Submit maintenance requests instantly and track progress in real-time.",
      benefits: [
        "One-tap maintenance requests",
        "Photo-based issue reporting",
        "Real-time status updates",
        "Direct landlord communication"
      ],
      icon: <UsersIcon className="w-8 h-8" />,
      color: "bg-success-500", 
      gradient: "from-success-400 to-success-600"
    },
    contractor: {
      headline: "Get matched with pre-approved jobs that fit your skills and schedule.",
      benefits: [
        "Pre-priced job opportunities",
        "Smart job matching",
        "Instant payment processing",
        "Professional reputation building"
      ],
      icon: <WrenchScrewdriverIcon className="w-8 h-8" />,
      color: "bg-warning-500",
      gradient: "from-warning-400 to-warning-600"
    }
  };

  // Smooth scroll to section
  const scrollToSection = useCallback((sectionId: string) => {
    const element = sectionRefs.current[sectionId as keyof SectionRef];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Handle role change with smooth transition
  const handleRoleChange = useCallback((role: typeof selectedRole) => {
    if (role === selectedRole || isTransitioning) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedRole(role);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 300);
    }, 150);
  }, [selectedRole, isTransitioning]);

  // Fixed scroll tracking and section detection
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setScrollY(currentScrollY);
      
      // Improved section detection using scroll position
      const sections = Object.entries(sectionRefs.current);
      const viewportHeight = window.innerHeight;
      const scrollPosition = currentScrollY + viewportHeight * 0.3; // Trigger point at 30% from top
      
      let newActiveSection = 'hero'; // default
      
      for (const [sectionId, element] of sections) {
        if (element) {
          const rect = element.getBoundingClientRect();
          const elementTop = rect.top + currentScrollY;
          const elementHeight = rect.height;
          const elementBottom = elementTop + elementHeight;
          
          // Check if we're in this section's range
          if (scrollPosition >= elementTop && scrollPosition < elementBottom) {
            newActiveSection = sectionId;
            break;
          }
        }
      }
      
      // Only update if section actually changed
      if (newActiveSection !== activeSection) {
        console.log('🔄 Section changed:', activeSection, '→', newActiveSection);
        setActiveSection(newActiveSection);
      }
    };

    // Throttle scroll events for better performance
    let ticking = false;
    const throttledScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    // Call once to set initial state
    handleScroll();
    
    return () => window.removeEventListener('scroll', throttledScroll);
  }, [activeSection]);

  // Fixed Intersection Observer for scroll animations
  useEffect(() => {
    setMounted(true);
    
    const observerOptions = {
      threshold: 0.15, // Trigger when 15% visible
      rootMargin: '-5% 0px -5% 0px' // Slight margin to prevent early triggering
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-canvas-slide-in');
          console.log('✨ Animating element:', entry.target.className);
        }
      });
    }, observerOptions);

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      const animatedElements = document.querySelectorAll('.animate-on-scroll');
      console.log('🎯 Found animated elements:', animatedElements.length);
      
      animatedElements.forEach((el) => {
        observer.observe(el);
      });
    }, 100);

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, [mounted]);

  // Debug logging for activeSection changes
  useEffect(() => {
    console.log('🎨 Active section changed to:', activeSection);
  }, [activeSection]);

  // Helper function to get background style
  const getBackgroundStyle = useCallback(() => {
    switch (activeSection) {
      case 'hero':
        return 'linear-gradient(135deg, rgb(55, 65, 81) 0%, rgb(75, 85, 99) 50%, rgb(107, 114, 128) 100%)';
      case 'solutions':
        // Use the selected role's gradient
        const role = roleContent[selectedRole];
        if (role.gradient.includes('primary')) {
          return 'linear-gradient(135deg, rgb(59, 130, 246) 0%, rgb(37, 99, 235) 50%, rgb(29, 78, 216) 100%)';
        } else if (role.gradient.includes('success')) {
          return 'linear-gradient(135deg, rgb(34, 197, 94) 0%, rgb(22, 163, 74) 50%, rgb(21, 128, 61) 100%)';
        } else if (role.gradient.includes('warning')) {
          return 'linear-gradient(135deg, rgb(245, 158, 11) 0%, rgb(217, 119, 6) 50%, rgb(180, 83, 9) 100%)';
        }
        break;
      case 'features':
        return 'linear-gradient(135deg, rgb(249, 250, 251) 0%, rgb(255, 255, 255) 50%, rgb(243, 244, 246) 100%)';
      case 'testimonials':
        return 'linear-gradient(135deg, rgb(239, 246, 255) 0%, rgb(219, 234, 254) 50%, rgb(191, 219, 254) 100%)';
      case 'cta':
        return 'linear-gradient(135deg, rgb(55, 65, 81) 0%, rgb(75, 85, 99) 50%, rgb(107, 114, 128) 100%)';
      default:
        return 'linear-gradient(135deg, rgb(55, 65, 81) 0%, rgb(75, 85, 99) 50%, rgb(107, 114, 128) 100%)';
    }
  }, [activeSection, selectedRole]);

  return (
    <div className="relative overflow-hidden">
      {/* Fixed background with smooth transitions */}
      <div 
        className="fixed inset-0 bg-transition"
        style={{
          background: getBackgroundStyle(),
          transition: 'background 1s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        {/* Animated particles */}
        <div className="absolute inset-0 overflow-hidden opacity-20">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                width: `${Math.random() * 4 + 2}px`,
                height: `${Math.random() * 4 + 2}px`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            />
          ))}
        </div>
      </div>

      {/* Debug info - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="fixed top-20 right-4 z-50 bg-black/70 text-white p-3 rounded-lg text-xs font-mono">
          <div>Active: <span className="text-green-300">{activeSection}</span></div>
          <div>Role: <span className="text-blue-300">{selectedRole}</span></div>
          <div>Scroll: <span className="text-yellow-300">{Math.round(scrollY)}px</span></div>
        </div>
      )}

      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass border-b border-white/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="text-xl font-bold text-white">
              Propagentic
            </Link>
            
            <div className="hidden md:flex space-x-8">
              {['Hero', 'Solutions', 'Features', 'Testimonials'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section.toLowerCase())}
                  className={`text-sm font-medium transition-all duration-300 ${
                    activeSection === section.toLowerCase()
                      ? 'text-white bg-white/20 px-3 py-1 rounded-full'
                      : 'text-white/70 hover:text-white/90 hover:bg-white/10 px-3 py-1 rounded-full'
                  }`}
                >
                  {section}
                </button>
              ))}
            </div>
            
            <CanvasButton variant="outline" size="sm" className="border-white/30 text-white hover:bg-white/10">
              Get Started
            </CanvasButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section 
        ref={(el) => (sectionRefs.current.hero = el)}
        className="relative min-h-screen flex items-center justify-center text-center"
        data-section="hero"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div 
            className={`transition-all duration-500 ease-out animate-on-scroll ${
              !isTransitioning ? 'opacity-100 translate-y-0' : 'opacity-70 translate-y-2'
            }`}
          >
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
              Property Management
              <span className="block bg-gradient-to-r from-orange-300 to-red-300 bg-clip-text text-transparent">
                Made Simple
              </span>
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed animate-on-scroll" style={{ animationDelay: '0.2s' }}>
              Connect landlords, tenants, and contractors with AI-powered workflows that make property maintenance effortless.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-on-scroll" style={{ animationDelay: '0.4s' }}>
              <CanvasButton variant="primary" size="lg" className="px-8 py-4 hover-lift">
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </CanvasButton>
              <CanvasButton variant="ghost" size="lg" className="text-white border-white/30 hover:bg-white/10 px-8 py-4">
                <PlayIcon className="w-5 h-5 mr-2" />
                Watch Demo
              </CanvasButton>
            </div>
          </div>
          
          <button
            onClick={() => scrollToSection('solutions')}
            className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/70 hover:text-white transition-all duration-300 animate-bounce"
          >
            <ChevronDownIcon className="w-6 h-6" />
          </button>
        </div>
      </section>

      {/* Solutions Section */}
      <section 
        ref={(el) => (sectionRefs.current.solutions = el)}
        className="relative min-h-screen flex items-center"
        data-section="solutions"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Solutions For Every Role
            </h2>
            <p className="text-lg text-white/90 max-w-3xl mx-auto mb-12">
              Propagentic addresses unique pain points for everyone involved in the property maintenance ecosystem.
            </p>
            
            {/* Role Selector */}
            <div className="flex flex-wrap justify-center gap-3 mb-12">
              {(['landlord', 'tenant', 'contractor'] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => handleRoleChange(role)}
                  disabled={isTransitioning}
                  className={`px-6 py-3 rounded-full text-sm font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-transparent disabled:opacity-75 ${
                    selectedRole === role
                      ? 'bg-white text-neutral-800 shadow-lg transform scale-105'
                      : 'bg-white/20 text-white hover:bg-white/30'
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    {roleContent[role].icon}
                    <span className="capitalize">{role}s</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
          
          {/* Role Content */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div 
              className={`transition-all duration-500 ease-out animate-on-scroll ${
                !isTransitioning ? 'opacity-100 translate-x-0' : 'opacity-70 translate-x-4'
              }`}
              style={{ animationDelay: '0.2s' }}
            >
              <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 capitalize">
                For {selectedRole}s & Property Managers
              </h3>
              <p className="text-lg text-white/90 mb-8 leading-relaxed">
                {roleContent[selectedRole].headline}
              </p>
              
              <div className="space-y-4 mb-8">
                {roleContent[selectedRole].benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-white flex-shrink-0" />
                    <span className="text-white/90">{benefit}</span>
                  </div>
                ))}
              </div>
              
              <CanvasButton variant="secondary" size="lg" className="bg-white text-neutral-800 hover:bg-white/90">
                Learn More
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </CanvasButton>
            </div>
            
            <div className="relative animate-on-scroll" style={{ animationDelay: '0.4s' }}>
              <div style={{ animationDelay: `${0 * 100}ms` }}>
                <CanvasCard className="p-8 transform rotate-1 hover:rotate-0 transition-transform duration-300 card-hover">
                  <div className="text-center">
                    <div className={`w-16 h-16 rounded-full ${roleContent[selectedRole].color} flex items-center justify-center mx-auto mb-4 text-white`}>
                      {roleContent[selectedRole].icon}
                    </div>
                    <h4 className="text-xl font-semibold text-neutral-800 mb-4">
                      {selectedRole === 'landlord' ? 'Property Dashboard' : 
                       selectedRole === 'tenant' ? 'Maintenance Portal' : 
                       'Job Management'}
                    </h4>
                    <p className="text-neutral-600 text-sm">
                      Experience the difference with our intuitive, role-specific interface designed for your workflow.
                    </p>
                  </div>
                </CanvasCard>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section 
        ref={(el) => (sectionRefs.current.features = el)}
        className="relative min-h-screen flex items-center"
        data-section="features"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-800 mb-6">
              Powerful Features
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              Everything you need to streamline property maintenance and improve tenant satisfaction.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                title: "AI-Powered Routing",
                description: "Automatically match maintenance requests with the best available contractors",
                icon: "🤖"
              },
              {
                title: "Real-Time Tracking",
                description: "Monitor job progress from request to completion with live updates",
                icon: "📍"
              },
              {
                title: "Smart Analytics",
                description: "Get insights into maintenance patterns and property performance",
                icon: "📊"
              },
              {
                title: "Secure Payments",
                description: "Automated invoicing and payment processing for all parties",
                icon: "💳"
              },
              {
                title: "Mobile First",
                description: "Full functionality on any device, optimized for mobile workflows",
                icon: "📱"
              },
              {
                title: "24/7 Support",
                description: "Round-the-clock assistance when you need it most",
                icon: "🔧"
              }
            ].map((feature, index) => (
              <div
                key={index}
                className="animate-on-scroll"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CanvasCard className="hover:scale-105 transition-transform duration-300 card-hover">
                  <div className="text-center">
                    <div className="text-4xl mb-4">{feature.icon}</div>
                    <h3 className="text-xl font-semibold text-neutral-800 mb-3">
                      {feature.title}
                    </h3>
                    <p className="text-neutral-600 text-sm leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </CanvasCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section 
        ref={(el) => (sectionRefs.current.testimonials = el)}
        className="relative min-h-screen flex items-center"
        data-section="testimonials"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-16 animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-neutral-800 mb-6">
              Trusted by Property Professionals
            </h2>
            <p className="text-lg text-neutral-600 max-w-3xl mx-auto">
              See what property managers, landlords, and contractors are saying about Propagentic.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                quote: "Propagentic cut our maintenance response time from days to hours. Our tenants are happier and our properties stay in better condition.",
                author: "Sarah Chen",
                role: "Property Manager",
                rating: 5
              },
              {
                quote: "As a contractor, I love getting pre-qualified jobs that match my skills. No more wasted time on quotes that go nowhere.",
                author: "Mike Rodriguez", 
                role: "Licensed Contractor",
                rating: 5
              },
              {
                quote: "Finally, a simple way to report issues and actually see them get fixed quickly. The photo feature is brilliant.",
                author: "Jessica Park",
                role: "Tenant",
                rating: 5
              }
            ].map((testimonial, index) => (
              <div
                key={index}
                className="animate-on-scroll"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <CanvasCard className="card-hover">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <StarIcon key={i} className="w-5 h-5 text-warning-500 fill-current" />
                    ))}
                  </div>
                  <blockquote className="text-neutral-700 mb-6 italic">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-neutral-200 rounded-full mr-4"></div>
                    <div>
                      <div className="font-semibold text-neutral-800">{testimonial.author}</div>
                      <div className="text-sm text-neutral-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CanvasCard>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section 
        ref={(el) => (sectionRefs.current.cta = el)}
        className="relative min-h-screen flex items-center"
        data-section="cta"
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="animate-on-scroll">
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your Property Management?
            </h2>
            <p className="text-lg text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of property professionals who have streamlined their maintenance workflows with Propagentic.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-on-scroll" style={{ animationDelay: '0.2s' }}>
              <CanvasButton variant="secondary" size="lg" className="bg-white text-neutral-800 hover:bg-white/90 px-10 py-4 hover-lift">
                Start Free Trial
                <ArrowRightIcon className="w-5 h-5 ml-2" />
              </CanvasButton>
              <CanvasButton variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 px-8 py-4">
                Schedule Demo
              </CanvasButton>
            </div>
            
            <div className="flex flex-wrap justify-center gap-8 text-white/70 text-sm animate-on-scroll" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CanvasLandingPage; 