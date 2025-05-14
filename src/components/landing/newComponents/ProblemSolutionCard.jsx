import React from 'react';
import { SafeMotion } from '../../shared/SafeMotion';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';

/**
 * Problem or Solution Card Component
 * Used in the RoleProblemSolutionSection to display problems and solutions for different roles
 * 
 * Props:
 * - title: Card title
 * - items: Array of text items to display
 * - type: 'problem' or 'solution'
 */
const ProblemSolutionCard = ({ title, items = [], type = 'problem', useAnimations = true }) => {
  // Choose icon based on type
  const CardIcon = () => {
    if (type === 'problem') {
      return (
        <svg className="w-7 h-7 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      );
    } else {
      return (
        <svg className="w-7 h-7 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
  };

  // Determine card styling based on type
  const cardStyle = type === 'problem'
    ? 'bg-amber-50 border-amber-100 dark:bg-amber-900/20 dark:border-amber-800/30'
    : 'bg-green-50 border-green-100 dark:bg-green-900/20 dark:border-green-800/30';

  // Animation settings
  const staggerDelay = 0.1;
  
  // Determine if animations should be used
  const MotionComponent = useAnimations ? SafeMotion.div : 'div';
  
  return (
    <UIComponentErrorBoundary componentName={`${type} Card`}>
      <div className={`rounded-xl overflow-hidden border ${cardStyle} p-6 h-full`}>
        {/* Card header */}
        <div className="flex items-center mb-6">
          <div className={`p-2 rounded-lg ${type === 'problem' ? 'bg-amber-100 dark:bg-amber-800/30' : 'bg-green-100 dark:bg-green-800/30'} mr-3`}>
            <CardIcon />
          </div>
          <h3 className="text-xl font-semibold text-content dark:text-content-dark">
            {title}
          </h3>
        </div>
        
        {/* Card items list */}
        <ul className="space-y-3">
          {items.map((item, index) => (
            <MotionComponent
              key={index}
              initial={useAnimations ? { opacity: 0, x: type === 'problem' ? -20 : 20 } : {}}
              whileInView={useAnimations ? { opacity: 1, x: 0 } : {}}
              transition={useAnimations ? { 
                delay: index * staggerDelay,
                duration: 0.5,
                ease: "easeOut"
              } : {}}
              viewport={useAnimations ? { once: true, margin: "-50px" } : {}}
              className="flex items-start"
            >
              <span className={`flex-shrink-0 inline-flex items-center justify-center w-6 h-6 mr-3 rounded-full ${
                type === 'problem' 
                  ? 'bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200' 
                  : 'bg-green-100 dark:bg-green-800/50 text-green-800 dark:text-green-200'
              }`}>
                {type === 'problem' ? '✕' : '✓'}
              </span>
              <span className="text-content-secondary dark:text-content-darkSecondary">{item}</span>
            </MotionComponent>
          ))}
        </ul>
      </div>
    </UIComponentErrorBoundary>
  );
};

export default ProblemSolutionCard; 