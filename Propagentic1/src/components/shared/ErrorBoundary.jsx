import React from 'react';

/**
 * ErrorBoundary - Component to catch and handle React errors
 * 
 * This component catches errors in its child component tree and displays
 * a fallback UI instead of crashing the entire application.
 */
class ErrorBoundary extends React.Component {
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
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
    
    // If onError callback is provided, call it with the error details
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  resetError = () => {
    this.setState({ 
      hasError: false,
      error: null,
      errorInfo: null
    });
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      if (this.props.fallback) {
        // If a fallback component is provided, use it
        return typeof this.props.fallback === 'function'
          ? this.props.fallback({ 
              error: this.state.error, 
              errorInfo: this.state.errorInfo,
              reset: this.resetError
            })
          : this.props.fallback;
      }

      const isDevelopment = process.env.NODE_ENV === 'development';

      return (
        <div className="p-4 border border-red-200 rounded-md bg-red-50 text-red-800">
          <h2 className="text-lg font-semibold mb-2">Something went wrong</h2>
          <p className="mb-4">We're sorry, but there was an error rendering this component.</p>
          
          {isDevelopment && this.state.error && (
            <div className="mt-4">
              <p className="font-semibold">Error details (only visible in development):</p>
              <pre className="mt-2 p-3 bg-red-100 rounded text-sm overflow-auto max-h-40">
                {this.state.error.toString()}
              </pre>
              {this.state.errorInfo && (
                <details className="mt-2">
                  <summary className="cursor-pointer">Component Stack</summary>
                  <pre className="mt-2 p-3 bg-red-100 rounded text-sm overflow-auto max-h-40">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </details>
              )}
            </div>
          )}

          {this.props.showReset !== false && (
            <button
              onClick={this.resetError}
              className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            >
              Try Again
            </button>
          )}
        </div>
      );
    }

    // Render children if there's no error
    return this.props.children; 
  }
}

/**
 * Component-specific error boundary for UI components
 */
export const UIComponentErrorBoundary = ({ children, componentName = 'Component' }) => {
  return (
    <ErrorBoundary
      fallback={({ reset }) => (
        <div className="p-3 border border-amber-200 rounded bg-amber-50 text-amber-800">
          <p className="text-sm">Unable to render {componentName}.</p>
          <button 
            onClick={reset}
            className="mt-2 px-3 py-1 text-xs bg-amber-100 border border-amber-300 rounded hover:bg-amber-200 transition-colors"
          >
            Retry
          </button>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default ErrorBoundary; 