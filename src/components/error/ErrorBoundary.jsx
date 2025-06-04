import React from 'react';
import { 
  ExclamationTriangleIcon, 
  ArrowPathIcon,
  BugAntIcon,
  ClipboardDocumentIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to show error UI
    return { 
      hasError: true,
      error: error,
      errorId: Date.now().toString(36) + Math.random().toString(36).substr(2)
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    const errorDetails = {
      error: error,
      errorInfo: errorInfo,
      errorId: this.state.errorId,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
      userId: this.props.userId,
      userRole: this.props.userRole,
      retryCount: this.state.retryCount
    };

    this.setState({ 
      error: error, 
      errorInfo: errorInfo 
    });

    // Report error to monitoring service
    this.reportError(errorDetails);

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
  }

  reportError = async (errorDetails) => {
    try {
      // Import error reporting service dynamically
      const { default: errorReportingService } = await import('../../services/errorReportingService');
      await errorReportingService.reportError(errorDetails);
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
    }

    // Send to Google Analytics if available
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: errorDetails.error.message,
        fatal: this.props.level === 'page',
        error_id: errorDetails.errorId
      });
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  copyErrorDetails = () => {
    const errorText = `
Error ID: ${this.state.errorId}
Error: ${this.state.error?.message}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
URL: ${window.location.href}
User Agent: ${navigator.userAgent}
Timestamp: ${new Date().toISOString()}
    `.trim();

    navigator.clipboard.writeText(errorText).then(() => {
      alert('Error details copied to clipboard');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = errorText;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      alert('Error details copied to clipboard');
    });
  };

  getErrorFallback = () => {
    const { level = 'component', fallback } = this.props;
    const { error, errorId, retryCount } = this.state;

    // Custom fallback component
    if (fallback) {
      return fallback(error, this.handleRetry, errorId);
    }

    // Page-level error (full screen)
    if (level === 'page') {
      return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-md w-full">
            <div className="text-center">
              <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
              <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                Something went wrong
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                We're sorry, but something unexpected happened.
              </p>
              {errorId && (
                <p className="mt-1 text-xs text-gray-500">
                  Error ID: {errorId}
                </p>
              )}
            </div>
            
            <div className="mt-8 space-y-4">
              <Button
                onClick={this.handleRetry}
                variant="primary"
                className="w-full"
              >
                <ArrowPathIcon className="w-4 h-4 mr-2" />
                Try Again
              </Button>
              
              <Button
                onClick={this.handleReload}
                variant="secondary"
                className="w-full"
              >
                Reload Page
              </Button>

              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={this.copyErrorDetails}
                  variant="outline"
                  className="w-full"
                >
                  <ClipboardDocumentIcon className="w-4 h-4 mr-2" />
                  Copy Error Details
                </Button>
              )}
            </div>

            {retryCount > 2 && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <div className="flex">
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Persistent Error
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>This error has occurred multiple times. Please contact support if the problem persists.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      );
    }

    // Component-level error (inline)
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <BugAntIcon className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="text-sm font-medium text-red-800">
              Component Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>This component encountered an error and couldn't render properly.</p>
              {errorId && (
                <p className="mt-1 text-xs">Error ID: {errorId}</p>
              )}
            </div>
            <div className="mt-4">
              <div className="-mx-2 -my-1.5 flex">
                <Button
                  onClick={this.handleRetry}
                  variant="outline"
                  size="sm"
                  className="mr-2"
                >
                  <ArrowPathIcon className="w-3 h-3 mr-1" />
                  Retry
                </Button>
                
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    onClick={this.copyErrorDetails}
                    variant="outline"
                    size="sm"
                  >
                    <ClipboardDocumentIcon className="w-3 h-3 mr-1" />
                    Copy Details
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  render() {
    if (this.state.hasError) {
      return this.getErrorFallback();
    }

    return this.props.children;
  }
}

export default ErrorBoundary; 