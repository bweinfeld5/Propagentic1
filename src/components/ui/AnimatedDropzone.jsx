import React, { useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { motion } from 'framer-motion';
import { SafeMotion, AnimatePresence } from '../shared/SafeMotion';

/**
 * AnimatedDropzone Component
 * 
 * A visually appealing file dropzone with animations for file upload functionality.
 * Supports drag and drop, file selection, and displays preview thumbnails.
 */
const AnimatedDropzone = ({
  onFilesAccepted,
  maxFiles = 5,
  maxSize = 5242880, // 5MB
  acceptedFileTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
  label = 'Drop files here or click to browse',
  description = 'Accept JPG, PNG, WebP up to 5MB',
  className = '',
  disabled = false
}) => {
  const [files, setFiles] = useState([]);
  const [isDragActive, setIsDragActive] = useState(false);
  const [rejectedFiles, setRejectedFiles] = useState([]);
  const fileInputRef = useRef(null);
  
  const onDrop = useCallback((acceptedFiles, rejected) => {
    if (disabled) return;
    
    // Handle accepted files
    const newFiles = [...files];
    
    // Filter out files that exceed the max count
    const filesToAdd = acceptedFiles.slice(0, maxFiles - newFiles.length);
    
    filesToAdd.forEach(file => {
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        file.preview = URL.createObjectURL(file);
      } else {
        file.preview = null;
      }
      
      newFiles.push(file);
    });
    
    setFiles(newFiles);
    
    // Process rejected files
    if (rejected && rejected.length > 0) {
      const newRejectedFiles = [...rejectedFiles];
      rejected.forEach(file => {
        newRejectedFiles.push({
          file: file,
          reason: file.size > maxSize ? 'File too large' : 'Unsupported file type'
        });
      });
      setRejectedFiles(newRejectedFiles);
      
      // Auto-clear rejected files after 3 seconds
      setTimeout(() => {
        setRejectedFiles([]);
      }, 3000);
    }
    
    // Call the callback with the updated file list
    if (onFilesAccepted && filesToAdd.length > 0) {
      onFilesAccepted(newFiles);
    }
  }, [files, rejectedFiles, disabled, maxFiles, maxSize, onFilesAccepted]);
  
  // Remove a file from the list
  const removeFile = (index) => {
    if (disabled) return;
    
    const newFiles = [...files];
    
    // Clean up preview URL to avoid memory leaks
    if (newFiles[index].preview) {
      URL.revokeObjectURL(newFiles[index].preview);
    }
    
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    // Notify parent of the change
    if (onFilesAccepted) {
      onFilesAccepted(newFiles);
    }
  };
  
  // Handle drag events
  const onDragOver = useCallback((e) => {
    e.preventDefault();
    if (disabled) return;
    setIsDragActive(true);
  }, [disabled]);
  
  const onDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);
  
  // Handle the drop event
  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragActive(false);
      if (disabled) return;
      
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Filter accepted files
      const accepted = droppedFiles.filter(file => 
        acceptedFileTypes.includes(file.type) && file.size <= maxSize
      );
      
      // Filter rejected files
      const rejected = droppedFiles.filter(file => 
        !acceptedFileTypes.includes(file.type) || file.size > maxSize
      );
      
      onDrop(accepted, rejected);
    },
    [acceptedFileTypes, maxSize, onDrop, disabled]
  );
  
  // Handle file input change
  const handleChange = useCallback(
    (e) => {
      if (disabled) return;
      
      const selectedFiles = Array.from(e.target.files);
      
      // Filter accepted files
      const accepted = selectedFiles.filter(file => 
        acceptedFileTypes.includes(file.type) && file.size <= maxSize
      );
      
      // Filter rejected files
      const rejected = selectedFiles.filter(file => 
        !acceptedFileTypes.includes(file.type) || file.size > maxSize
      );
      
      onDrop(accepted, rejected);
      
      // Reset file input
      e.target.value = null;
    },
    [acceptedFileTypes, maxSize, onDrop, disabled]
  );
  
  // Open file dialog when clicking on the dropzone
  const openFileDialog = () => {
    if (disabled) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  // Format file size for display
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };
  
  // Get appropriate icon based on file type
  const getFileIcon = (file) => {
    if (file.type.startsWith('image/')) {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    }
    
    if (file.type === 'application/pdf') {
      return (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      );
    }
    
    return (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };
  
  return (
    <div className={`${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="sr-only"
        accept={acceptedFileTypes.join(',')}
        onChange={handleChange}
        disabled={disabled || files.length >= maxFiles}
      />
      
      {/* Dropzone Area */}
      <motion.div
        className={`relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-propagentic-teal bg-propagentic-teal/5' : 'border-gray-300 dark:border-gray-600'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50 dark:hover:bg-gray-800/30'}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
        whileHover={!disabled ? { scale: 1.01 } : {}}
        whileTap={!disabled ? { scale: 0.99 } : {}}
      >
        <div className="space-y-3">
          <svg
            className={`mx-auto h-12 w-12 ${
              isDragActive ? 'text-propagentic-teal' : 'text-gray-400'
            }`}
            stroke="currentColor"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
          <div className="text-sm">
            <motion.label
              className={`font-medium ${
                isDragActive ? 'text-propagentic-teal' : 'text-gray-700 dark:text-gray-300'
              }`}
            >
              {label}
            </motion.label>
            <p className="text-gray-500 dark:text-gray-400 mt-1">{description}</p>
          </div>
        </div>
        
        {/* File Count Indicator */}
        {files.length > 0 && (
          <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-propagentic-teal text-white">
            {files.length} / {maxFiles}
          </span>
        )}
      </motion.div>
      
      {/* File Preview Section */}
      {files.length > 0 && (
        <div className="mt-4">
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <AnimatePresence>
              {files.map((file, index) => (
                <motion.li
                  key={`${file.name}-${index}`}
                  className="relative bg-white dark:bg-propagentic-slate-dark rounded-lg border border-gray-200 dark:border-gray-700 p-3"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3 }}
                  layout
                >
                  <div className="flex items-start space-x-3">
                    {/* Show image preview or file icon */}
                    <div className="flex-shrink-0 h-12 w-12 rounded overflow-hidden bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      {file.preview ? (
                        <img
                          src={file.preview}
                          alt={file.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="text-gray-500 dark:text-gray-400">
                          {getFileIcon(file)}
                        </div>
                      )}
                    </div>
                    
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {file.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatFileSize(file.size)}
                      </p>
                    </div>
                    
                    {/* Remove button */}
                    <div className="flex-shrink-0">
                      <motion.button
                        type="button"
                        className="inline-flex items-center p-1 border border-transparent rounded-full shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFile(index);
                        }}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </motion.button>
                    </div>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        </div>
      )}
      
      {/* Rejected Files Alert */}
      <AnimatePresence>
        {rejectedFiles.length > 0 && (
          <motion.div
            className="mt-4 p-3 rounded-md bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Some files couldn't be uploaded:
                </h3>
                <div className="mt-2 text-sm text-red-700 dark:text-red-300">
                  <ul className="list-disc pl-5 space-y-1">
                    {rejectedFiles.map((rejected, index) => (
                      <li key={index}>
                        {rejected.file.name} - {rejected.reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

AnimatedDropzone.propTypes = {
  onFilesAccepted: PropTypes.func,
  maxFiles: PropTypes.number,
  maxSize: PropTypes.number,
  acceptedFileTypes: PropTypes.array,
  label: PropTypes.string,
  description: PropTypes.string,
  className: PropTypes.string,
  disabled: PropTypes.bool
};

export default AnimatedDropzone; 