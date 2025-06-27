import React, { ReactNode } from 'react';
import { cn } from '../../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface AgenticContainerProps {
  children: ReactNode;
  className?: string;
  darkMode?: boolean;
}

export const AgenticContainer: React.FC<AgenticContainerProps> = ({
  children,
  className,
  darkMode = false
}) => {
  return (
    <div
      className={cn(
        'relative min-h-screen overflow-hidden transition-all duration-500',
        darkMode ? 'bg-[#0f0f0f]' : 'bg-gradient-to-br from-gray-50 to-gray-100',
        className
      )}
    >
      {/* Animated background pattern */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-orange-600/5" />
        
        {/* Animated grid pattern */}
        <svg
          className="absolute inset-0 h-full w-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="agentic-grid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M0 32V0h32"
                fill="none"
                stroke={darkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'}
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#agentic-grid)" />
        </svg>

        {/* Floating orbs animation */}
        <motion.div
          className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"
          animate={{
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl"
          animate={{
            x: [0, -50, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {children}
        </AnimatePresence>
      </div>

      {/* Noise texture overlay */}
      <div 
        className="pointer-events-none fixed inset-0 z-20 opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='200' height='200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' /%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}; 