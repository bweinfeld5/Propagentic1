import React, { useState, useRef, useEffect } from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import {
  TrashIcon,
  ArchiveBoxIcon,
  CheckIcon,
  XMarkIcon,
  HeartIcon,
  StarIcon
} from '@heroicons/react/24/outline';
import useSwipeGestures from '../../hooks/useSwipeGestures';

const SwipeableCard = ({
  children,
  onSwipeLeft,
  onSwipeRight,
  leftAction = 'delete',
  rightAction = 'archive',
  leftThreshold = 100,
  rightThreshold = 100,
  disabled = false,
  className = '',
  swipeEnabled = true,
  showHints = true
}) => {
  const [isRevealed, setIsRevealed] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState(null);
  const cardRef = useRef(null);
  const x = useMotionValue(0);
  const opacity = useTransform(x, [-200, -100, 0, 100, 200], [0.3, 1, 1, 1, 0.3]);
  const scale = useTransform(x, [-200, -100, 0, 100, 200], [0.9, 1, 1, 1, 0.9]);

  // Action configurations
  const actionConfig = {
    delete: {
      icon: TrashIcon,
      color: 'bg-red-500',
      text: 'Delete',
      textColor: 'text-white'
    },
    archive: {
      icon: ArchiveBoxIcon,
      color: 'bg-blue-500',
      text: 'Archive',
      textColor: 'text-white'
    },
    favorite: {
      icon: HeartIcon,
      color: 'bg-pink-500',
      text: 'Favorite',
      textColor: 'text-white'
    },
    star: {
      icon: StarIcon,
      color: 'bg-yellow-500',
      text: 'Star',
      textColor: 'text-white'
    },
    approve: {
      icon: CheckIcon,
      color: 'bg-green-500',
      text: 'Approve',
      textColor: 'text-white'
    },
    reject: {
      icon: XMarkIcon,
      color: 'bg-red-500',
      text: 'Reject',
      textColor: 'text-white'
    }
  };

  const leftConfig = actionConfig[leftAction] || actionConfig.delete;
  const rightConfig = actionConfig[rightAction] || actionConfig.archive;

  // Handle swipe gestures
  useSwipeGestures({
    onSwipeLeft: (e, { distance, velocity }) => {
      if (!swipeEnabled || disabled) return;
      
      if (distance > leftThreshold) {
        setSwipeDirection('left');
        x.set(-300);
        setTimeout(() => {
          onSwipeLeft?.(e, { distance, velocity });
          reset();
        }, 200);
      } else {
        reset();
      }
    },
    onSwipeRight: (e, { distance, velocity }) => {
      if (!swipeEnabled || disabled) return;
      
      if (distance > rightThreshold) {
        setSwipeDirection('right');
        x.set(300);
        setTimeout(() => {
          onSwipeRight?.(e, { distance, velocity });
          reset();
        }, 200);
      } else {
        reset();
      }
    },
    threshold: 30,
    velocity: 0.3,
    element: cardRef.current
  });

  const reset = () => {
    x.set(0);
    setSwipeDirection(null);
    setIsRevealed(false);
  };

  // Handle drag
  const handleDrag = (event, info) => {
    if (!swipeEnabled || disabled) return;
    
    const offset = info.offset.x;
    setIsRevealed(Math.abs(offset) > 50);
    
    // Provide haptic feedback when reaching threshold
    if (Math.abs(offset) > leftThreshold || Math.abs(offset) > rightThreshold) {
      if (navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  };

  const handleDragEnd = (event, info) => {
    if (!swipeEnabled || disabled) return;
    
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    
    // Determine if swipe should complete
    const shouldCompleteLeft = offset < -leftThreshold || velocity < -500;
    const shouldCompleteRight = offset > rightThreshold || velocity > 500;
    
    if (shouldCompleteLeft) {
      setSwipeDirection('left');
      onSwipeLeft?.(event, { distance: Math.abs(offset), velocity: Math.abs(velocity) });
    } else if (shouldCompleteRight) {
      setSwipeDirection('right');
      onSwipeRight?.(event, { distance: Math.abs(offset), velocity: Math.abs(velocity) });
    } else {
      reset();
    }
  };

  // Background action indicators
  const LeftAction = () => (
    <div className={`absolute inset-y-0 left-0 flex items-center justify-start pl-6 ${leftConfig.color} rounded-l-lg`}>
      <div className="flex items-center gap-2">
        <leftConfig.icon className={`w-6 h-6 ${leftConfig.textColor}`} />
        <span className={`font-medium ${leftConfig.textColor}`}>
          {leftConfig.text}
        </span>
      </div>
    </div>
  );

  const RightAction = () => (
    <div className={`absolute inset-y-0 right-0 flex items-center justify-end pr-6 ${rightConfig.color} rounded-r-lg`}>
      <div className="flex items-center gap-2">
        <span className={`font-medium ${rightConfig.textColor}`}>
          {rightConfig.text}
        </span>
        <rightConfig.icon className={`w-6 h-6 ${rightConfig.textColor}`} />
      </div>
    </div>
  );

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Background Actions */}
      {isRevealed && (
        <>
          <LeftAction />
          <RightAction />
        </>
      )}
      
      {/* Main Card */}
      <motion.div
        ref={cardRef}
        style={{ x, opacity, scale }}
        drag={swipeEnabled && !disabled ? "x" : false}
        dragConstraints={{ left: -300, right: 300 }}
        dragElastic={0.1}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        className={`relative bg-white dark:bg-gray-800 rounded-lg shadow-sm ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-grab active:cursor-grabbing'
        }`}
        whileTap={{ scale: swipeEnabled && !disabled ? 0.98 : 1 }}
        animate={{
          x: swipeDirection === 'left' ? -300 : swipeDirection === 'right' ? 300 : 0
        }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
      >
        {children}
        
        {/* Swipe Hints */}
        {showHints && swipeEnabled && !disabled && !isRevealed && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Left hint */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-30">
              <div className="flex items-center gap-1">
                <div className="w-1 h-8 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-1 h-6 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-4 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
            
            {/* Right hint */}
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-30">
              <div className="flex items-center gap-1">
                <div className="w-1 h-4 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-1 h-6 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-1 h-8 bg-gray-400 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
      
      {/* Touch instruction overlay for first use */}
      {showHints && swipeEnabled && !disabled && (
        <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 pointer-events-none">
          <div className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs px-2 py-1 rounded opacity-60">
            Swipe left or right for actions
          </div>
        </div>
      )}
    </div>
  );
};

export default SwipeableCard;