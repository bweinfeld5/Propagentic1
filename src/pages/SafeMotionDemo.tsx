import React, { useState } from 'react';
import { MotionTest } from '../components/shared';
import UIComponentErrorBoundary from '../components/shared/UIComponentErrorBoundary';

const SafeMotionDemo = () => {
  const [showMultiple, setShowMultiple] = useState(false);

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">SafeMotion Demo</h1>
      
      <p className="mb-8 text-gray-700">
        This page demonstrates the SafeMotion component working with React 19. 
        SafeMotion provides a compatibility layer for framer-motion, ensuring animations 
        work correctly even with React 19 strict mode and other potential compatibility issues.
      </p>
      
      <div className="mb-8">
        <button 
          onClick={() => setShowMultiple(!showMultiple)}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
        >
          {showMultiple ? 'Show Single Component' : 'Show Multiple Components'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UIComponentErrorBoundary>
          <MotionTest title="Basic Animation Example" />
        </UIComponentErrorBoundary>
        
        {showMultiple && (
          <>
            <UIComponentErrorBoundary>
              <MotionTest title="Slide Animation" />
            </UIComponentErrorBoundary>
            
            <UIComponentErrorBoundary>
              <MotionTest title="Fade Animation" />
            </UIComponentErrorBoundary>
            
            <UIComponentErrorBoundary>
              <MotionTest title="Scale Animation" />
            </UIComponentErrorBoundary>
          </>
        )}
      </div>
      
      <div className="mt-12 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-semibold mb-4">Implementation Notes</h2>
        <ul className="list-disc pl-5 space-y-2">
          <li>SafeMotion is a wrapper around framer-motion that provides fallbacks for compatibility issues.</li>
          <li>It handles React 19 strict mode issues by properly initializing motion components.</li>
          <li>The implementation uses React.forwardRef and proper error handling to ensure robust animation support.</li>
          <li>When framer-motion fails to load or encounters errors, it gracefully falls back to standard HTML elements.</li>
        </ul>
      </div>
    </div>
  );
};

export default SafeMotionDemo; 