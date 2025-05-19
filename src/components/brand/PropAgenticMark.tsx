import React from 'react';

export const PropAgenticMark: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {/* house outline */}
    <path d="M3 10.5L12 3l9 7.5V21H3z" />
    {/* inner P */}
    <path d="M9 18V9h4a3 3 0 0 1 0 6h-4" />
  </svg>
); 