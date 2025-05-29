import React from 'react';
import logoIcon from '../../assets/images/logo-icon.svg';

export const PropAgenticMark: React.FC<{ size?: number; className?: string }> = ({ 
  size = 24, 
  className = '' 
}) => (
  <img
    src={logoIcon}
    alt="PropAgentic"
    width={size}
    height={size}
    className={`object-contain ${className}`}
    style={{ width: size, height: size }}
  />
); 