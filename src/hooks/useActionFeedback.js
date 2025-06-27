import { useState, useCallback } from 'react';

const useActionFeedback = () => {
  const [feedbackState, setFeedbackState] = useState({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    progress: 0,
    showUndo: false,
    showRetry: false,
    position: 'bottom'
  });

  const showFeedback = useCallback((config) => {
    setFeedbackState(prev => ({
      ...prev,
      ...config,
      isOpen: true
    }));
  }, []);

  const showLoading = useCallback((title, message) => {
    showFeedback({
      type: 'loading',
      title,
      message,
      showUndo: false,
      showRetry: false
    });
  }, [showFeedback]);

  const showSuccess = useCallback((title, message, options = {}) => {
    showFeedback({
      type: 'success',
      title,
      message,
      showUndo: options.showUndo || false,
      onUndo: options.onUndo,
      showRetry: false
    });
  }, [showFeedback]);

  const showError = useCallback((title, message, options = {}) => {
    showFeedback({
      type: 'error',
      title,
      message,
      showUndo: false,
      showRetry: options.showRetry || false,
      onRetry: options.onRetry
    });
  }, [showFeedback]);

  const showProgress = useCallback((title, progress, message) => {
    showFeedback({
      type: 'progress',
      title,
      message,
      progress,
      showUndo: false,
      showRetry: false
    });
  }, [showFeedback]);

  const hideFeedback = useCallback(() => {
    setFeedbackState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const updateProgress = useCallback((progress) => {
    setFeedbackState(prev => ({
      ...prev,
      progress
    }));
  }, []);

  const showInfo = useCallback((title, message) => {
    showFeedback({
      type: 'info',
      title,
      message,
      showUndo: false,
      showRetry: false
    });
  }, [showFeedback]);

  return {
    feedbackState,
    showFeedback,
    showLoading,
    showSuccess,
    showError,
    showInfo,
    showProgress,
    hideFeedback,
    updateProgress
  };
};

export default useActionFeedback;