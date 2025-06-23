import { useRef, useEffect, useCallback } from 'react';

const useSwipeGestures = ({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPullToRefresh,
  threshold = 50,
  pullThreshold = 100,
  velocity = 0.3,
  preventDefaultTouch = false,
  element = null
}) => {
  const startX = useRef(0);
  const startY = useRef(0);
  const startTime = useRef(0);
  const isDragging = useRef(false);
  const elementRef = useRef(null);
  const pullDistance = useRef(0);

  // Get the target element
  const targetElement = element || elementRef.current;

  const handleTouchStart = useCallback((e) => {
    if (preventDefaultTouch) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    startX.current = touch.clientX;
    startY.current = touch.clientY;
    startTime.current = Date.now();
    isDragging.current = true;
    pullDistance.current = 0;
  }, [preventDefaultTouch]);

  const handleTouchMove = useCallback((e) => {
    if (!isDragging.current) return;

    if (preventDefaultTouch) {
      e.preventDefault();
    }

    const touch = e.touches[0];
    const deltaY = touch.clientY - startY.current;
    
    // Handle pull to refresh
    if (onPullToRefresh && deltaY > 0 && window.scrollY === 0) {
      pullDistance.current = Math.min(deltaY, pullThreshold * 2);
      
      // Trigger visual feedback for pull to refresh
      if (pullDistance.current > pullThreshold) {
        // Could emit event for visual feedback
        document.dispatchEvent(new CustomEvent('pullToRefreshActive', {
          detail: { distance: pullDistance.current, threshold: pullThreshold }
        }));
      }
    }
  }, [preventDefaultTouch, onPullToRefresh, pullThreshold]);

  const handleTouchEnd = useCallback((e) => {
    if (!isDragging.current) return;

    const touch = e.changedTouches[0];
    const endX = touch.clientX;
    const endY = touch.clientY;
    const endTime = Date.now();

    const deltaX = endX - startX.current;
    const deltaY = endY - startY.current;
    const deltaTime = endTime - startTime.current;

    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);
    const velocityX = absX / deltaTime;
    const velocityY = absY / deltaTime;

    // Check for pull to refresh
    if (onPullToRefresh && pullDistance.current > pullThreshold) {
      onPullToRefresh();
      document.dispatchEvent(new CustomEvent('pullToRefreshTriggered'));
    }

    // Determine if it's a swipe gesture
    const isSwipe = (absX > threshold || absY > threshold) && 
                   (velocityX > velocity || velocityY > velocity);

    if (isSwipe) {
      // Horizontal swipes
      if (absX > absY) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight(e, { distance: absX, velocity: velocityX });
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft(e, { distance: absX, velocity: velocityX });
        }
      }
      // Vertical swipes
      else {
        if (deltaY > 0 && onSwipeDown) {
          onSwipeDown(e, { distance: absY, velocity: velocityY });
        } else if (deltaY < 0 && onSwipeUp) {
          onSwipeUp(e, { distance: absY, velocity: velocityY });
        }
      }
    }

    // Reset state
    isDragging.current = false;
    pullDistance.current = 0;
    
    // Clear pull to refresh state
    document.dispatchEvent(new CustomEvent('pullToRefreshEnd'));
  }, [
    threshold,
    velocity,
    pullThreshold,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onSwipeDown,
    onPullToRefresh
  ]);

  // Attach event listeners
  useEffect(() => {
    const element = targetElement || document;
    
    if (element) {
      element.addEventListener('touchstart', handleTouchStart, { passive: !preventDefaultTouch });
      element.addEventListener('touchmove', handleTouchMove, { passive: !preventDefaultTouch });
      element.addEventListener('touchend', handleTouchEnd, { passive: !preventDefaultTouch });
      
      return () => {
        element.removeEventListener('touchstart', handleTouchStart);
        element.removeEventListener('touchmove', handleTouchMove);
        element.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [targetElement, handleTouchStart, handleTouchMove, handleTouchEnd, preventDefaultTouch]);

  return {
    ref: elementRef,
    pullDistance: pullDistance.current
  };
};

export default useSwipeGestures;