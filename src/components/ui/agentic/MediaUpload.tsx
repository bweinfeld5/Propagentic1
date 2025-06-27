import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  PhotoIcon,
  CameraIcon,
  CloudArrowUpIcon,
  XMarkIcon,
  EyeIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

interface UploadedFile {
  id: string;
  file: File;
  url: string;
  analysis?: {
    tags: string[];
    confidence: number;
    description: string;
    issues?: string[];
  };
}

interface MediaUploadProps {
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  maxFiles?: number;
  maxFileSize?: number; // in MB
  acceptedTypes?: string[];
  aiAnalysis?: boolean;
  className?: string;
  onAnalysisComplete?: (fileId: string, analysis: any) => void;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  files,
  onFilesChange,
  maxFiles = 5,
  maxFileSize = 10,
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  aiAnalysis = false,
  className = '',
  onAnalysisComplete
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({});
  const [analyzingFiles, setAnalyzingFiles] = useState<Set<string>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate file upload progress
  const simulateUpload = useCallback(async (fileId: string) => {
    for (let progress = 0; progress <= 100; progress += 10) {
      setUploadProgress(prev => ({ ...prev, [fileId]: progress }));
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    // Remove from progress tracking when complete
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileId];
      return newProgress;
    });
  }, []);

  // Simulate AI analysis
  const simulateAIAnalysis = useCallback(async (file: UploadedFile) => {
    if (!aiAnalysis) return;

    setAnalyzingFiles(prev => new Set([...prev, file.id]));
    
    // Simulate analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const mockAnalysis = {
      tags: [['water damage'], ['plumbing issue'], ['urgent repair']][Math.floor(Math.random() * 3)].map(t => t.trim()),
      confidence: Math.floor(Math.random() * 30) + 70,
      description: [
        'Visible water damage on ceiling with potential leak source',
        'Plumbing fixture shows signs of wear and needs attention', 
        'Electrical outlet appears damaged and may be unsafe'
      ][Math.floor(Math.random() * 3)],
      issues: Math.random() > 0.5 ? ['Safety concern identified'] : undefined
    };

    // Update file with analysis
    const updatedFiles = files.map(f => 
      f.id === file.id ? { ...f, analysis: mockAnalysis } : f
    );
    onFilesChange(updatedFiles);
    
    setAnalyzingFiles(prev => {
      const newSet = new Set(prev);
      newSet.delete(file.id);
      return newSet;
    });

    onAnalysisComplete?.(file.id, mockAnalysis);
  }, [files, onFilesChange, aiAnalysis, onAnalysisComplete]);

  const handleFileSelect = useCallback(async (selectedFiles: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      
      // Validate file type
      if (!acceptedTypes.includes(file.type)) {
        alert(`File type ${file.type} not supported`);
        continue;
      }
      
      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        alert(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB`);
        continue;
      }
      
      // Check if we're at the limit
      if (files.length + newFiles.length >= maxFiles) {
        alert(`Maximum ${maxFiles} files allowed`);
        break;
      }
      
      const fileId = `file_${Date.now()}_${i}`;
      const url = URL.createObjectURL(file);
      
      const uploadedFile: UploadedFile = {
        id: fileId,
        file,
        url
      };
      
      newFiles.push(uploadedFile);
      
      // Start upload simulation
      simulateUpload(fileId);
    }
    
    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      onFilesChange(updatedFiles);
      
      // Start AI analysis for each new file
      newFiles.forEach(file => {
        setTimeout(() => simulateAIAnalysis(file), 1000);
      });
    }
  }, [files, onFilesChange, maxFiles, maxFileSize, acceptedTypes, simulateUpload, simulateAIAnalysis]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    onFilesChange(updatedFiles);
    
    // Clean up object URL
    const file = files.find(f => f.id === fileId);
    if (file) {
      URL.revokeObjectURL(file.url);
    }
  }, [files, onFilesChange]);

  const openCamera = useCallback(() => {
    // In a real implementation, this would use MediaDevices API
    alert('Camera functionality would be implemented here');
  }, []);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
          isDragging
            ? 'border-orange-400 bg-orange-50'
            : 'border-[var(--agentic-border)] hover:border-orange-300 bg-[var(--agentic-bg-secondary)]'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="space-y-4">
          <div className="flex justify-center">
            <motion.div
              animate={{ scale: isDragging ? 1.1 : 1 }}
              transition={{ duration: 0.2 }}
            >
              <CloudArrowUpIcon className="w-12 h-12 text-[var(--agentic-text-secondary)]" />
            </motion.div>
          </div>
          
          <div>
            <h3 className="font-medium text-[var(--agentic-text-primary)] mb-2">
              {isDragging ? 'Drop files here' : 'Upload Photos'}
            </h3>
            <p className="text-sm text-[var(--agentic-text-secondary)] mb-4">
              Drag and drop files here, or click to browse
            </p>
            <p className="text-xs text-[var(--agentic-text-secondary)]">
              Supports {acceptedTypes.map(type => type.split('/')[1].toUpperCase()).join(', ')} 
              • Max {maxFileSize}MB each • Up to {maxFiles} files
            </p>
          </div>
          
          <div className="flex justify-center gap-3">
            <button
              type="button"
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
            >
              <PhotoIcon className="w-4 h-4" />
              Choose Files
            </button>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                openCamera();
              }}
              className="px-4 py-2 border border-orange-300 text-orange-700 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-2"
            >
              <CameraIcon className="w-4 h-4" />
              Camera
            </button>
          </div>
        </div>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Uploaded Files */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <h3 className="font-medium text-[var(--agentic-text-primary)]">
              Uploaded Files ({files.length}/{maxFiles})
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map((file, index) => (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative group bg-[var(--agentic-bg-primary)] border border-[var(--agentic-border)] rounded-xl overflow-hidden"
                >
                  {/* Image Preview */}
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={file.url}
                      alt={file.file.name}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Upload Progress */}
                    {uploadProgress[file.id] !== undefined && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-sm font-medium mb-2">Uploading...</div>
                          <div className="w-24 h-2 bg-white/20 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${uploadProgress[file.id]}%` }}
                              className="h-full bg-orange-500"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                      <button
                        onClick={() => window.open(file.url, '_blank')}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                      >
                        <EyeIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => removeFile(file.id)}
                        className="p-2 bg-white/20 backdrop-blur-sm rounded-lg text-white hover:bg-white/30 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* File Info */}
                  <div className="p-3">
                    <div className="text-sm font-medium text-[var(--agentic-text-primary)] truncate">
                      {file.file.name}
                    </div>
                    <div className="text-xs text-[var(--agentic-text-secondary)] mt-1">
                      {(file.file.size / 1024 / 1024).toFixed(1)} MB
                    </div>
                    
                    {/* AI Analysis */}
                    {aiAnalysis && (
                      <div className="mt-2">
                        {analyzingFiles.has(file.id) ? (
                          <div className="flex items-center gap-2 text-blue-600">
                            <SparklesIcon className="w-4 h-4 animate-spin" />
                            <span className="text-xs">Analyzing...</span>
                          </div>
                        ) : file.analysis ? (
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <SparklesIcon className="w-4 h-4 text-green-600" />
                              <span className="text-xs font-medium text-green-700">
                                AI Analysis ({file.analysis.confidence}%)
                              </span>
                            </div>
                            <div className="text-xs text-[var(--agentic-text-secondary)]">
                              {file.analysis.description}
                            </div>
                            {file.analysis.issues && (
                              <div className="flex items-center gap-1 text-orange-600">
                                <ExclamationTriangleIcon className="w-3 h-3" />
                                <span className="text-xs">
                                  {file.analysis.issues.join(', ')}
                                </span>
                              </div>
                            )}
                          </div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MediaUpload;
