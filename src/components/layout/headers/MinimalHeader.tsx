import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../../assets/images/logo.svg';

interface MinimalHeaderProps {
  className?: string;
  showBackToHome?: boolean;
}

/**
 * MinimalHeader - Clean header for auth pages and onboarding
 * 
 * Features:
 * - Minimal design to focus attention on forms
 * - Optional back to home link
 * - Dark mode support
 * - Mobile optimized
 */
const MinimalHeader: React.FC<MinimalHeaderProps> = ({ 
  className = '',
  showBackToHome = true 
}) => {
  return (
    <header className={`bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src={Logo} alt="PropAgentic" className="h-8 w-auto" />
            </Link>
          </div>

          {/* Back to Home Link */}
          {showBackToHome && (
            <div className="flex items-center">
              <Link
                to="/"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white transition-colors duration-150"
              >
                ← Back to Home
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default MinimalHeader; 