import React, { ErrorInfo } from 'react';

interface UIComponentErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface UIComponentErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary for UI components that provides a fallback UI when a child component throws an error.
 * This prevents the entire application from crashing due to a single component error.
 */
class UIComponentErrorBoundary extends React.Component<
  UIComponentErrorBoundaryProps,
  UIComponentErrorBoundaryState
> {
  constructor(props: UIComponentErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): UIComponentErrorBoundaryState {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log the error to the console
    console.error('UI Component Error:', error);
    console.error('Error Info:', errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || (
        <div className="p-4 bg-red-100 border border-red-300 rounded-md">
          <h3 className="text-lg font-medium text-red-800 mb-2">Component Error</h3>
          <p className="text-sm text-red-700">
            {this.state.error?.message || 'An unexpected error occurred in this component.'}
          </p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default UIComponentErrorBoundary; 