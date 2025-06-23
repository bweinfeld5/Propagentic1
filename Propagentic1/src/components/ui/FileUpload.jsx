/**
 * FileUpload Component - PropAgentic UI
 * 
 * File upload component with drag and drop functionality
 */

import React, { useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { CloudArrowUpIcon, DocumentIcon } from '@heroicons/react/24/outline';

const FileUpload = ({ 
  onFileSelect,
  accept = '*/*',
  multiple = false,
  maxSize = 10 * 1024 * 1024, // 10MB default
  className = '',
  disabled = false,
  error = false,
  children,
  ...props 
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileInput = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (!files.length) return;
    
    // Filter files by size and type
    const validFiles = files.filter(file => {
      if (maxSize && file.size > maxSize) return false;
      if (accept !== '*/*' && !file.type.match(accept)) return false;
      return true;
    });

    if (onFileSelect) {
      onFileSelect(multiple ? validFiles : validFiles[0]);
    }
  };

  const openFileDialog = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const baseClasses = 'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors';
  const stateClasses = error 
    ? 'border-red-300 bg-red-50 dark:border-red-600 dark:bg-red-900/20' 
    : isDragOver 
      ? 'border-blue-400 bg-blue-50 dark:border-blue-500 dark:bg-blue-900/20'
      : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500';
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';
  
  const classes = [
    baseClasses,
    stateClasses,
    disabledClasses,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={openFileDialog}
      {...props}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        multiple={multiple}
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />
      
      {children || (
        <div className="space-y-2">
          <CloudArrowUpIcon className={`mx-auto h-12 w-12 ${
            error ? 'text-red-400' : 'text-gray-400'
          }`} />
          <div className="text-sm">
            <span className={`font-medium ${
              error ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'
            }`}>
              Click to upload
            </span>
            <span className={`${
              error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {' '}or drag and drop
            </span>
          </div>
          <p className={`text-xs ${
            error ? 'text-red-500 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'
          }`}>
            {accept === '*/*' ? 'Any file type' : accept} up to {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}
    </div>
  );
};

FileUpload.propTypes = {
  onFileSelect: PropTypes.func,
  accept: PropTypes.string,
  multiple: PropTypes.bool,
  maxSize: PropTypes.number,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  error: PropTypes.bool,
  children: PropTypes.node
};

export default FileUpload; 