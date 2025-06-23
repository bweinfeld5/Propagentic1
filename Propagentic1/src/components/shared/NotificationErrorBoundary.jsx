import React, { Component } from 'react';

/**
 * Error boundary specifically for notification components
 * Prevents notification errors from breaking the entire UI
 */
class NotificationErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can log the error to an error reporting service
    console.error('NotificationErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // If the error is a NotificationProvider error, render nothing
      // This prevents UI from breaking when notification context is missing
      if (this.state.error?.message?.includes('NotificationProvider')) {
        console.warn('Notification component error suppressed:', this.state.error.message);
        return null;
      }
      
      // For other errors, you can render a fallback UI
      return (
        <div className="hidden">
          {/* Hidden fallback UI for notification errors */}
        </div>
      );
    }

    return this.props.children;
  }
}

export default NotificationErrorBoundary; 