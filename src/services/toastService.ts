/**
 * Toast Service - PropAgentic
 * 
 * Centralized toast notification service for consistent user feedback
 */

// This is a placeholder implementation that will be replaced with a proper toast library
// like react-hot-toast as mentioned in the code standards

interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
  variant?: 'default' | 'destructive' | 'success';
}

/**
 * Show a toast notification
 */
export const showToast = (options: ToastOptions) => {
  // This is a temporary implementation
  // In a real implementation, this would use react-hot-toast or similar
  console.log(`TOAST: ${options.variant || 'default'} - ${options.title}${options.description ? ': ' + options.description : ''}`);
  
  // For now, we'll use alert for immediate feedback
  if (options.variant === 'destructive') {
    window.alert(`Error: ${options.title}${options.description ? '\n' + options.description : ''}`);
  } else {
    window.alert(`${options.title}${options.description ? '\n' + options.description : ''}`);
  }
};

/**
 * Show a success toast
 */
export const showSuccessToast = (title: string, description?: string) => {
  showToast({
    title,
    description,
    variant: 'success',
    duration: 3000,
  });
};

/**
 * Show an error toast
 */
export const showErrorToast = (title: string, description?: string) => {
  showToast({
    title,
    description,
    variant: 'destructive',
    duration: 5000,
  });
};

const toastService = {
  showToast,
  showSuccessToast,
  showErrorToast,
};

export default toastService; 