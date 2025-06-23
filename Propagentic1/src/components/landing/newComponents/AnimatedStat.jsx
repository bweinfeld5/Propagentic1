import React, { useState, useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { SafeMotion } from "../../shared/SafeMotion";

const AnimatedStat = ({ value, suffix = '', label }) => {
  const [count, setCount] = useState(0);
  const controls = useAnimation();
  const [ref, inView] = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (inView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: { duration: 0.5 }
      });
      
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
  }, [inView, value, controls]);
  
  // Easing function for a more natural animation
  function easeOutQuad(x) {
    return 1 - (1 - x) * (1 - x);
  }

  return (
    <SafeMotion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={controls}
      className="text-center p-6 bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark rounded-lg shadow-card"
    >
      <div className="text-4xl font-bold text-propagentic-teal mb-2">
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-propagentic-slate dark:text-propagentic-neutral-light">
        {label}
      </div>
    </SafeMotion.div>
  );
};

export default AnimatedStat;
