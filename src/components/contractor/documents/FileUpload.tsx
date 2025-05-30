import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../../firebase/config';
import { DocumentIcon, XMarkIcon } from '@heroicons/react/24/outline';
import Button from '../../ui/Button';

interface FileUploadProps {
  onUploadComplete: (url: string, metadata: FileMetadata) => void;
  onUploadError: (error: string) => void;
  allowedFileTypes?: string[];
  maxFileSize?: number; // in bytes
  userId: string;
  documentType: 'license' | 'certification' | 'insurance' | 'other';
}

interface FileMetadata {
  name: string;
  type: string;
  size: number;
  lastModified: number;
  expirationDate?: Date;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onUploadComplete,
  onUploadError,
  allowedFileTypes = ['application/pdf', 'image/jpeg', 'image/png'],
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  userId,
  documentType
}) => {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      if (file.size > maxFileSize) {
        onUploadError(`File size exceeds ${maxFileSize / 1024 / 1024}MB limit`);
        return;
      }
      if (!allowedFileTypes.includes(file.type)) {
        onUploadError('File type not supported');
        return;
      }
      setSelectedFile(file);
    }
  }, [maxFileSize, allowedFileTypes, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxFiles: 1
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    const timestamp = Date.now();
    const storageRef = ref(storage, `documents/${userId}/${documentType}/${timestamp}_${selectedFile.name}`);
    const uploadTask = uploadBytesResumable(storageRef, selectedFile);

    uploadTask.on('state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setUploadProgress(progress);
      },
      (error) => {
        setIsUploading(false);
        onUploadError('Upload failed: ' + error.message);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          const metadata: FileMetadata = {
            name: selectedFile.name,
            type: selectedFile.type,
            size: selectedFile.size,
            lastModified: selectedFile.lastModified
          };
          onUploadComplete(downloadURL, metadata);
          setIsUploading(false);
          setSelectedFile(null);
          setUploadProgress(0);
        } catch (error) {
          onUploadError('Failed to get download URL');
          setIsUploading(false);
        }
      }
    );
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setUploadProgress(0);
  };

  return (
    <div className="w-full">
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-primary bg-primary/5 dark:border-primary-light dark:bg-primary-dark/10' 
              : 'border-border dark:border-border-dark hover:border-primary dark:hover:border-primary-light'
            }`}
        >
          <input {...getInputProps()} />
          <DocumentIcon className="w-12 h-12 mx-auto text-content-secondary dark:text-content-darkSecondary mb-4" />
          <p className="text-content dark:text-content-dark font-medium">
            {isDragActive
              ? 'Drop the file here'
              : 'Drag and drop a file here, or click to select'}
          </p>
          <p className="text-sm text-content-secondary dark:text-content-darkSecondary mt-2">
            Supported formats: PDF, JPEG, PNG (max {maxFileSize / 1024 / 1024}MB)
          </p>
        </div>
      ) : (
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <DocumentIcon className="w-6 h-6 text-content-secondary dark:text-content-darkSecondary mr-3" />
              <div>
                <p className="text-content dark:text-content-dark font-medium">{selectedFile.name}</p>
                <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)}MB
                </p>
              </div>
            </div>
            <button
              onClick={handleCancel}
              className="text-content-secondary dark:text-content-darkSecondary hover:text-error dark:hover:text-error-light"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
          
          {isUploading ? (
            <div>
              <div className="h-2 bg-background-subtle dark:bg-background-darkSubtle rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary dark:bg-primary-light transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary mt-2 text-center">
                Uploading... {Math.round(uploadProgress)}%
              </p>
            </div>
          ) : (
            <Button
              onClick={handleUpload}
              variant="primary"
              className="w-full"
            >
              Upload File
            </Button>
          )}
        </div>
      )}
    </div>
  );
};

export default FileUpload; 