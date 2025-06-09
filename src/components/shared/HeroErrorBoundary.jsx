import React from 'react';
import { Link } from 'react-router-dom';

/**
 * Enhanced error boundary for hero section components
 * Provides graceful degradation with branded fallback UI
 */
class HeroErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('Hero section error:', error, errorInfo);
    
    // Store error details for potential display
    this.setState({
      error,
      errorInfo
    });

    // Report to error tracking service if available
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'exception', {
        description: error.toString(),
        fatal: false
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // Determine the type of fallback based on props
      const { fallbackType = 'default', className = '' } = this.props;

      // Minimal fallback for dashboard components
      if (fallbackType === 'dashboard') {
        return (
          <div className={`bg-gray-100 rounded-lg p-6 text-center ${className}`}>
            <div className="animate-pulse space-y-4">
              <div className="h-4 bg-gray-300 rounded w-3/4 mx-auto"></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="h-12 bg-gray-300 rounded"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
                <div className="h-12 bg-gray-300 rounded"></div>
              </div>
              <div className="h-24 bg-gray-300 rounded"></div>
            </div>
            <p className="text-sm text-gray-600 mt-4">Dashboard preview temporarily unavailable</p>
          </div>
        );
      }

      // Animation fallback
      if (fallbackType === 'animation') {
        return (
          <div className={`${className}`}>
            {/* Return static content instead of animation */}
            <div className="opacity-80">
              {this.props.staticFallback || <div className="w-full h-full bg-white/10 rounded"></div>}
            </div>
          </div>
        );
      }

      // Main hero section fallback
      return (
        <div className={`bg-gradient-to-br from-primary-600 via-primary-500 to-primary-400 text-white p-8 rounded-lg text-center ${className}`}>
          <div className="max-w-md mx-auto">
            <svg 
              className="w-16 h-16 mx-auto mb-4 text-white/80" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
              />
            </svg>
            
            <h2 className="text-2xl font-bold mb-4">Welcome to Propagentic</h2>
            <p className="mb-6 text-white/90">
              AI-powered property management that actually works. 
              Some features are temporarily unavailable, but you can still get started.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link 
                to="/signup"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors duration-200"
              >
                Get Started
              </Link>
              <Link 
                to="/how-it-works" 
                className="border border-white text-white px-6 py-3 rounded-lg font-medium hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-primary-600 transition-colors"
              >
                Learn More
              </Link>
            </div>
            
            {/* Optional retry button for development */}
            {process.env.NODE_ENV === 'development' && (
              <button 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="mt-4 text-sm text-white/70 hover:text-white underline"
              >
                Try Again (Dev)
              </button>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default HeroErrorBoundary; 