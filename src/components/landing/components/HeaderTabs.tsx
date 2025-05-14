import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Header navigation tabs for the landing page
 */
const HeaderTabs: React.FC = () => {
  return (
    <nav className="container mx-auto px-6 py-4 relative z-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-white font-bold text-xl">
            Propagentic
          </Link>
        </div>
        <div className="hidden md:flex items-center space-x-8">
          <Link to="/features" className="text-white hover:text-primary-light transition duration-150">Features</Link>
          <Link to="/pricing" className="text-white hover:text-primary-light transition duration-150">Pricing</Link>
          <Link to="/about" className="text-white hover:text-primary-light transition duration-150">About</Link>
        </div>
        <div className="flex items-center space-x-4">
          <Link to="/auth" className="text-white font-medium hover:text-primary-light transition duration-150">Log in</Link>
          <Link to="/auth?tab=signup" className="bg-white text-primary px-4 py-2 rounded-lg hover:bg-gray-100 transform hover:-translate-y-0.5 transition duration-150">Sign up</Link>
        </div>
      </div>
    </nav>
  );
};

export default HeaderTabs; 