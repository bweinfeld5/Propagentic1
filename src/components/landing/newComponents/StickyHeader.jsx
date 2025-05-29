import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SafeMotion } from '../../shared/SafeMotion';
import { useAuth } from '../../../context/AuthContext';
import Logo from '../../../assets/images/logo.svg';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import Button from '../../ui/Button';

const HeaderTabs = () => {
  const { currentUser } = useAuth();
  const [isSticky, setIsSticky] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      setIsSticky(window.scrollY >= 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <UIComponentErrorBoundary componentName="Header Navigation">
      <SafeMotion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isSticky
            ? 'bg-background/80 dark:bg-background-dark/80 backdrop-blur-md shadow-md border-b border-border dark:border-border-dark'
            : 'bg-transparent'
        }`}
        initial={{ y: 0 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link to="/propagentic/new" className="flex items-center space-x-2">
              <img src={Logo} alt="Propagentic Logo" className="h-8 w-auto" />
              <span
                className={`text-xl font-bold transition-colors duration-300 ${
                  isSticky ? 'text-content dark:text-content-dark' : 'text-white'
                }`}
              >
                Propagentic
              </span>
            </Link>
            
            <div className="flex items-center space-x-8">
              <nav className="hidden md:flex items-center space-x-6">
                <NavLink to="/propagentic/new" isSticky={isSticky}>Home</NavLink>
                <NavLink to="/pricing" isSticky={isSticky}>Pricing</NavLink>
                <NavLink to="/about" isSticky={isSticky}>About</NavLink>
                <NavLink to="/demo" isSticky={isSticky}>Demo</NavLink>
              </nav>
              
              <div className="flex items-center space-x-4">
                {currentUser ? (
                  <Button 
                    to="/dashboard"
                    variant={isSticky ? 'primary' : 'outline-inverse'}
                    size="sm"
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Link 
                      to="/login" 
                      className="text-white/90 hover:text-white font-medium transition-colors duration-200"
                    >
                      Log In
                    </Link>
                    <Link 
                      to="/signup" 
                      className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium border border-white/20 transition-all duration-200"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </SafeMotion.header>
    </UIComponentErrorBoundary>
  );
};

const NavLink = ({ to, children, isSticky }) => (
  <Link
    to={to}
    className={`text-sm font-medium transition-colors duration-200 ${
      isSticky 
        ? 'text-content-secondary dark:text-content-darkSecondary hover:text-primary dark:hover:text-primary-light' 
        : 'text-white hover:opacity-80'
    }`}
  >
    {children}
  </Link>
);

export default HeaderTabs; 