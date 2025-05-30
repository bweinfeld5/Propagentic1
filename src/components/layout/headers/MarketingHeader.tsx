import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline';
import Logo from '../../../assets/images/logo.svg';

interface MarketingHeaderProps {
  className?: string;
}

/**
 * MarketingHeader - Clean, modern header for public website
 * 
 * Features:
 * - Glassmorphism effect that adapts to scroll
 * - Mobile-first responsive design
 * - Consistent auth routing (/auth?tab=*)
 * - Smooth animations and transitions
 */
const MarketingHeader: React.FC<MarketingHeaderProps> = ({ className = '' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Track scroll for glassmorphism effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Navigation items
  const navigationItems = [
    { name: 'Home', href: '/', current: location.pathname === '/' },
    { name: 'Pricing', href: '/pricing', current: location.pathname === '/pricing' },
    { name: 'About', href: '/about', current: location.pathname === '/about' },
    { name: 'Demo', href: '/demo', current: location.pathname === '/demo' },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ease-in-out ${className} ${
      isScrolled 
        ? 'backdrop-blur-md bg-white/10 shadow-lg border-b border-white/20' 
        : 'backdrop-blur-sm bg-transparent'
    }`}>
      <div className="container mx-auto px-6">
        <div className="flex justify-between items-center h-16 md:h-18">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={Logo} alt="PropAgentic Logo" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`relative text-sm font-medium transition-colors duration-200 ${
                  item.current
                    ? 'text-white'
                    : 'text-white/80 hover:text-white'
                }`}
              >
                {item.name}
                {item.current && (
                  <span className="absolute -bottom-6 left-0 right-0 h-0.5 bg-white rounded-full" />
                )}
              </Link>
            ))}
          </nav>

          {/* Auth Buttons - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            <Link
              to="/login"
              className="text-white/80 hover:text-white font-medium transition-colors duration-200"
            >
              Log In
            </Link>
            <Link
              to="/signup"
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium border border-white/20 transition-all duration-200"
            >
              Sign Up
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-200"
              aria-expanded={isMobileMenuOpen}
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="h-6 w-6" />
              ) : (
                <Bars3Icon className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/10 backdrop-blur-md rounded-lg mt-2 border border-white/20">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${
                    item.current
                      ? 'text-white bg-white/20'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
              
              {/* Mobile Auth Buttons */}
              <div className="pt-4 border-t border-white/20 space-y-2">
                <Link
                  to="/login"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-200"
                >
                  Log In
                </Link>
                <Link
                  to="/signup"
                  className="block px-3 py-2 rounded-md text-base font-medium bg-white/10 backdrop-blur-md hover:bg-white/20 text-white border border-white/20 transition-all duration-200"
                >
                  Sign Up
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default MarketingHeader; 