import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { SafeMotion } from '../../shared/SafeMotion';

// Fixed AnimatedStat component
const AnimatedStat: React.FC<{
  value: number;
  suffix?: string;
  label: string;
}> = ({ value, suffix = '', label }) => {
  const [count, setCount] = useState(0);
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      const duration = 2000; // 2 seconds animation
      const frameDuration = 1000 / 60; // 60fps
      const totalFrames = Math.round(duration / frameDuration);
      
      let frame = 0;
      const counter = setInterval(() => {
        frame++;
        const progress = easeOutQuad(frame / totalFrames);
        const currentCount = Math.round(progress * value);
        
        if (frame === totalFrames) {
          clearInterval(counter);
          setCount(value);
        } else {
          setCount(currentCount);
        }
      }, frameDuration);
      
      return () => clearInterval(counter);
    }
  }, [inView, value]);
  
  // Easing function for a more natural animation
  function easeOutQuad(x: number): number {
    return 1 - (1 - x) * (1 - x);
  }

  return (
    <SafeMotion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.5 }}
      className="text-center p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg"
    >
      <div className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-gray-600 dark:text-gray-300 font-medium">
        {label}
      </div>
    </SafeMotion.div>
  );
};

const StatsSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Making Property Management Easier
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Thousands of property owners, tenants, and contractors trust Propagentic for their daily operations.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-4xl mx-auto">
          <AnimatedStat value={65} suffix="%" label="Time saved on maintenance requests" />
          <AnimatedStat value={3500} label="Property units managed" />
          <AnimatedStat value={98} suffix="%" label="Customer satisfaction" />
        </div>
      </div>
    </section>
  );
};

export default StatsSection; 