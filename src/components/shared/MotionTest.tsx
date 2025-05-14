'use client';

import React, { useState } from 'react';
import { SafeMotion, AnimatePresence } from './SafeMotion';

interface MotionTestProps {
  title?: string;
}

export const MotionTest: React.FC<MotionTestProps> = ({ title = 'Motion Test' }) => {
  const [isVisible, setIsVisible] = useState(true);

  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  return (
    <div className="p-4 bg-white rounded shadow-md">
      <h2 className="text-xl font-bold mb-4">{title}</h2>
      
      <button 
        onClick={toggleVisibility}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
      >
        {isVisible ? 'Hide' : 'Show'}
      </button>
      
      <div className="mt-4 overflow-hidden">
        <AnimatePresence mode="wait">
          {isVisible && (
            <SafeMotion.div
              key="motion-test"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gray-100 p-4 rounded"
            >
              <p className="mb-2">This is a test of SafeMotion with React 19</p>
              <p>The component should animate in and out smoothly</p>
            </SafeMotion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-2">Motion Hover Effect</h3>
        <SafeMotion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 400, damping: 17 }}
          className="bg-green-500 text-white p-4 rounded cursor-pointer text-center"
        >
          Hover Over Me
        </SafeMotion.div>
      </div>
    </div>
  );
};

export default MotionTest; 