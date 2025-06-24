import React, { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { 
  Upload, 
  Camera, 
  X, 
  FileImage, 
  CheckCircle2,
  Eye,
  Sparkles,
  Zap,
  Info
} from 'lucide-react';

interface MediaStepProps {
  images: File[];
  onChange: (images: File[]) => void;
  category?: string;
}

export const MediaStep: React.FC<MediaStepProps> = ({
  images,
  onChange,
  category
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});
  const [analyzingImages, setAnalyzingImages] = useState<Set<string>>(new Set());
  const [imageAnalysis, setImageAnalysis] = useState<Record<string, {
    confidence: number;
    detectedIssues: string[];
    suggestions: string[];
  }>>({});
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const maxFiles = 5;
  const maxFileSize = 10 * 1024 * 1024; // 10MB
  const acceptedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  // Simulate AI analysis
  const analyzeImage = useCallback((file: File) => {
    const fileName = file.name;
    setAnalyzingImages(prev => new Set([...prev, fileName]));
    
    setTimeout(() => {
      const mockAnalysis = {
        confidence: Math.floor(Math.random() * 30) + 70,
        detectedIssues: [
          category === 'plumbing' ? 'Water staining visible' : '',
          category === 'electrical' ? 'Outlet damage detected' : '',
          category === 'hvac' ? 'Air vent obstruction' : '',
          'Good lighting for assessment'
        ].filter(Boolean),
        suggestions: [
          'Image quality is good for analysis',
          'Consider adding a close-up photo',
          'Multiple angles would be helpful'
        ]
      };
      
      setImageAnalysis(prev => ({ ...prev, [fileName]: mockAnalysis }));
      setAnalyzingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    }, 2000);
  }, [category]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  }, [images]);

  const handleFileSelection = (newFiles: File[]) => {
    const validFiles = newFiles.filter(file => {
      if (!acceptedTypes.includes(file.type)) {
        alert(`${file.name} is not a supported image format`);
        return false;
      }
      if (file.size > maxFileSize) {
        alert(`${file.name} is too large. Maximum size is 10MB`);
        return false;
      }
      return true;
    });

    if (images.length + validFiles.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} images`);
      return;
    }

    const updatedImages = [...images, ...validFiles];
    onChange(updatedImages);

    // Simulate upload progress and analyze images
    validFiles.forEach(file => {
      const fileName = file.name;
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          analyzeImage(file);
        }
        setUploadProgress(prev => ({ ...prev, [fileName]: progress }));
      }, 200);
    });
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFileSelection(files);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
    
    // Clean up related state
    const removedFile = images[index];
    if (removedFile) {
      const fileName = removedFile.name;
      setUploadProgress(prev => {
        const newProgress = { ...prev };
        delete newProgress[fileName];
        return newProgress;
      });
      setImageAnalysis(prev => {
        const newAnalysis = { ...prev };
        delete newAnalysis[fileName];
        return newAnalysis;
      });
      setAnalyzingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(fileName);
        return newSet;
      });
    }
  };

  const openPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    setPreviewImage(url);
  };

  const closePreview = () => {
    if (previewImage) {
      URL.revokeObjectURL(previewImage);
    }
    setPreviewImage(null);
  };

  return (
    <div className="space-y-6">
      {/* Upload area */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`relative border-2 border-dashed rounded-xl p-8 transition-all duration-200 ${
          isDragOver
            ? 'border-orange-400 bg-orange-50 dark:bg-orange-900/10'
            : 'border-gray-300 dark:border-gray-600 hover:border-orange-300 dark:hover:border-orange-600'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="text-center">
          <motion.div
            animate={{ 
              scale: isDragOver ? 1.1 : 1,
              rotate: isDragOver ? 5 : 0
            }}
            className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center"
          >
            <Upload className="w-8 h-8 text-gray-600 dark:text-gray-400" />
          </motion.div>
          
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Upload Photos
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Drag and drop images here, or click to select files
          </p>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2"
            >
              <FileImage className="w-4 h-4" />
              Choose Files
            </button>
            <button
              onClick={() => {
                // In a real app, this would open camera
                alert('Camera feature would open here');
              }}
              className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          <div className="mt-4 text-xs text-gray-500 dark:text-gray-500">
            Supported formats: JPEG, PNG, WebP • Max size: 10MB • Max files: {maxFiles}
          </div>
        </div>
      </motion.div>

      {/* Uploaded images */}
      {images.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
              Uploaded Images ({images.length}/{maxFiles})
            </h4>
            {images.length > 0 && (
              <button
                onClick={() => onChange([])}
                className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                Remove All
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((file, index) => {
              const fileName = file.name;
              const progress = uploadProgress[fileName] || 0;
              const isAnalyzing = analyzingImages.has(fileName);
              const analysis = imageAnalysis[fileName];
              const imageUrl = URL.createObjectURL(file);
              
              return (
                <motion.div
                  key={`${fileName}-${index}`}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700"
                >
                  {/* Image preview */}
                  <div className="aspect-square relative overflow-hidden">
                    <img
                      src={imageUrl}
                      alt={fileName}
                      className="w-full h-full object-cover"
                    />
                    
                    {/* Progress overlay */}
                    {progress < 100 && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-16 h-16 rounded-full border-4 border-white/30 border-t-white animate-spin" />
                        <span className="absolute text-white text-sm font-medium">
                          {Math.round(progress)}%
                        </span>
                      </div>
                    )}
                    
                    {/* AI Analysis overlay */}
                    {isAnalyzing && (
                      <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                        <div className="text-center text-white">
                          <Sparkles className="w-6 h-6 mx-auto mb-1 animate-pulse" />
                          <span className="text-xs">AI Analyzing...</span>
                        </div>
                      </div>
                    )}
                    
                    {/* Action buttons */}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <button
                        onClick={() => openPreview(file)}
                        className="p-1 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      >
                        <Eye className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => removeImage(index)}
                        className="p-1 bg-black/50 text-white rounded-full hover:bg-red-500 transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  
                  {/* File info and analysis */}
                  <div className="p-3">
                    <div className="text-xs text-gray-600 dark:text-gray-400 mb-2 truncate">
                      {fileName}
                    </div>
                    
                    {analysis && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3 h-3 text-green-600 dark:text-green-400" />
                          <span className="text-xs font-medium text-green-600 dark:text-green-400">
                            {analysis.confidence}% Analysis Complete
                          </span>
                        </div>
                        
                        {analysis.detectedIssues.length > 0 && (
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Detected:</span>
                            <ul className="mt-1 space-y-0.5">
                              {analysis.detectedIssues.slice(0, 2).map((issue, i) => (
                                <li key={i} className="flex items-start gap-1">
                                  <CheckCircle2 className="w-2 h-2 text-green-500 mt-0.5 flex-shrink-0" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Helpful tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl border border-blue-200 dark:border-blue-800"
      >
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
          <div>
            <h5 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
              Tips for better photos
            </h5>
            <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
              <li>• Take photos in good lighting</li>
              <li>• Show the issue from multiple angles</li>
              <li>• Include close-up and wide shots</li>
              <li>• Capture any error messages or model numbers</li>
              {category === 'plumbing' && <li>• Show water damage or staining if present</li>}
              {category === 'electrical' && <li>• Avoid touching damaged electrical components</li>}
              {category === 'hvac' && <li>• Include photos of thermostat settings</li>}
            </ul>
          </div>
        </div>
      </motion.div>

      {/* Skip option */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="text-center"
      >
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Photos are optional but help our team prepare better for your service call.
        </p>
      </motion.div>

      {/* Image preview modal */}
      {previewImage && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={closePreview}
        >
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="relative max-w-4xl max-h-full"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={closePreview}
              className="absolute top-4 right-4 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
};
