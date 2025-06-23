import React from 'react';

export function Skeleton(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={`animate-pulse bg-gray-200 ${props.className ?? ''}`} />;
} 