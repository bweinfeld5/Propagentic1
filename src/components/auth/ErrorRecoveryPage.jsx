import React from 'react';
import { AlertTriangle, RefreshCw, Home, Mail, Shield, Route } from 'lucide-react';
import Button from '../ui/Button';

/**
 * Error recovery page component for handling various authentication and routing errors
 */
const ErrorRecoveryPage = ({ 
  error, 
  type = 'general', 
  onRetry, 
  onGoHome, 
  canRetry = true, 
  retryCount = 0 
}) => {
  // Get appropriate icon and styling based on error type
  const getErrorConfig = () => {
    switch (type) {
      case 'auth':
        return {
          icon: Shield,
          title: 'Authentication Error',
          bgColor: 'bg-red-50',
          iconColor: 'text-red-500',
          borderColor: 'border-red-200'
        };
      case 'profile':
        return {
          icon: AlertTriangle,
          title: 'Profile Data Error',
          bgColor: 'bg-yellow-50',
          iconColor: 'text-yellow-500',
          borderColor: 'border-yellow-200'
        };
      case 'routing':
        return {
          icon: Route,
          title: 'Navigation Error',
          bgColor: 'bg-blue-50',
          iconColor: 'text-blue-500',
          borderColor: 'border-blue-200'
        };
      default:
        return {
          icon: AlertTriangle,
          title: 'Something went wrong',
          bgColor: 'bg-gray-50',
          iconColor: 'text-gray-500',
          borderColor: 'border-gray-200'
        };
    }
  };

  const config = getErrorConfig();
  const IconComponent = config.icon;

  // Get contextual help message based on error type
  const getHelpMessage = () => {
    switch (type) {
      case 'auth':
        return 'This usually happens when there\'s an issue with your login session. Try refreshing the page or logging in again.';
      case 'profile':
        return 'Your profile data seems to have an issue. We can try to recover it automatically, or you can contact support for help.';
      case 'routing':
        return 'There was a problem navigating to the requested page. This might be a temporary issue.';
      default:
        return 'An unexpected error occurred. Please try again or contact support if the problem persists.';
    }
  };

  // Get recovery suggestions based on error type
  const getRecoverySuggestions = () => {
    const suggestions = [];

    switch (type) {
      case 'auth':
        suggestions.push('Clear your browser cache and cookies');
        suggestions.push('Try logging out and logging back in');
        suggestions.push('Check your internet connection');
        break;
      case 'profile':
        suggestions.push('Try the automatic recovery option');
        suggestions.push('Log out and log back in to refresh your profile');
        suggestions.push('Contact support if the issue persists');
        break;
      case 'routing':
        suggestions.push('Refresh the page');
        suggestions.push('Try navigating to the page again');
        suggestions.push('Clear your browser cache');
        break;
      default:
        suggestions.push('Refresh the page');
        suggestions.push('Try again in a few minutes');
        suggestions.push('Check your internet connection');
        break;
    }

    return suggestions;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${config.bgColor}`}>
          <IconComponent className={`h-6 w-6 ${config.iconColor}`} aria-hidden="true" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          {config.title}
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          {getHelpMessage()}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className={`bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10 border ${config.borderColor}`}>
          {/* Error Message */}
          <div className={`rounded-md ${config.bgColor} p-4 mb-6`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className={`h-5 w-5 ${config.iconColor}`} aria-hidden="true" />
              </div>
              <div className="ml-3">
                <h3 className={`text-sm font-medium ${config.iconColor.replace('text-', 'text-').replace('-500', '-800')}`}>
                  Error Details
                </h3>
                <div className={`mt-2 text-sm ${config.iconColor.replace('text-', 'text-').replace('-500', '-700')}`}>
                  <p>{error}</p>
                  {retryCount > 0 && (
                    <p className="mt-1 text-xs">
                      Attempt {retryCount} of 3
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-4">
            {canRetry && onRetry && (
              <Button
                onClick={onRetry}
                variant="primary"
                className="w-full flex justify-center items-center"
                disabled={retryCount >= 3}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {retryCount >= 3 ? 'Maximum attempts reached' : 'Try to recover'}
              </Button>
            )}

            <Button
              onClick={onGoHome}
              variant="secondary"
              className="w-full flex justify-center items-center"
            >
              <Home className="h-4 w-4 mr-2" />
              Go to homepage
            </Button>

            <Button
              onClick={() => window.location.href = 'mailto:support@propagentic.com'}
              variant="outline"
              className="w-full flex justify-center items-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              Contact support
            </Button>
          </div>

          {/* Recovery Suggestions */}
          <div className="mt-8">
            <h4 className="text-sm font-medium text-gray-900 mb-3">
              Troubleshooting suggestions:
            </h4>
            <ul className="text-sm text-gray-600 space-y-2">
              {getRecoverySuggestions().map((suggestion, index) => (
                <li key={index} className="flex items-start">
                  <span className="flex-shrink-0 h-1.5 w-1.5 rounded-full bg-gray-400 mt-2 mr-3" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>

          {/* Additional Information */}
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              If this problem continues, please include this error message when contacting support.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Need immediate help?{' '}
            <a
              href="mailto:support@propagentic.com"
              className="font-medium text-primary hover:text-primary-dark"
            >
              Email our support team
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ErrorRecoveryPage; 