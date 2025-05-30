import React, { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { storage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import Button from '../ui/Button';

interface W9FormUploadProps {
  onComplete?: (downloadUrl: string) => void;
}

const W9FormUpload: React.FC<W9FormUploadProps> = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'complete' | 'error'>('idle');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      console.log('[W9Upload] File selected:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      // Reset previous state
      setError(null);
      setUploadProgress(0);
      setUploadStatus('idle');
      setDownloadUrl(null);
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowedTypes.includes(selectedFile.type)) {
        console.error('[W9Upload] Invalid file type:', selectedFile.type);
        setError(`Please upload a PDF, JPG, or PNG file. Received: ${selectedFile.type}`);
        return;
      }
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (selectedFile.size > maxSize) {
        console.error('[W9Upload] File too large:', selectedFile.size);
        setError(`File size must be less than 5MB. Current size: ${(selectedFile.size / 1024 / 1024).toFixed(2)}MB`);
        return;
      }
      
      setFile(selectedFile);
      console.log('[W9Upload] File validation passed');
    }
  };

  const handleUpload = async () => {
    if (!file || !currentUser) {
      console.error('[W9Upload] Missing file or user:', { file: !!file, currentUser: !!currentUser });
      setError('Missing file or user authentication');
      return;
    }

    console.log('[W9Upload] Starting upload process...');
    setLoading(true);
    setError(null);
    setUploadProgress(0);
    setUploadStatus('uploading');

    try {
      // Create a unique filename to avoid conflicts
      const timestamp = Date.now();
      const fileName = `w9-${timestamp}-${file.name}`;
      const w9Ref = ref(storage, `contractors/${currentUser.uid}/w9/${fileName}`);
      
      console.log('[W9Upload] Upload reference created:', w9Ref.fullPath);

      // Use uploadBytesResumable for progress tracking
      const uploadTask = uploadBytesResumable(w9Ref, file);
      
      return new Promise<void>((resolve, reject) => {
        uploadTask.on('state_changed',
          // Progress function
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
            console.log('[W9Upload] Upload progress:', `${progress.toFixed(1)}%`);
            
            switch (snapshot.state) {
              case 'paused':
                console.log('[W9Upload] Upload is paused');
                break;
              case 'running':
                console.log('[W9Upload] Upload is running');
                break;
            }
          },
          // Error function
          (error) => {
            console.error('[W9Upload] Upload error:', error);
            let errorMessage = 'Failed to upload W9 form. ';
            
            switch (error.code) {
              case 'storage/unauthorized':
                errorMessage += 'You do not have permission to upload files.';
                break;
              case 'storage/canceled':
                errorMessage += 'Upload was canceled.';
                break;
              case 'storage/quota-exceeded':
                errorMessage += 'Storage quota exceeded.';
                break;
              case 'storage/invalid-format':
                errorMessage += 'Invalid file format.';
                break;
              case 'storage/unauthenticated':
                errorMessage += 'Please sign in and try again.';
                break;
              default:
                errorMessage += `Error: ${error.message}`;
            }
            
            setError(errorMessage);
            setUploadStatus('error');
            reject(error);
          },
          // Success function
          async () => {
            try {
              console.log('[W9Upload] Upload completed, getting download URL...');
              console.log('[W9Upload] Upload ref path:', uploadTask.snapshot.ref.fullPath);
              console.log('[W9Upload] Upload ref bucket:', uploadTask.snapshot.ref.bucket);
              
              // Add a small delay to ensure upload is fully committed
              await new Promise(resolve => setTimeout(resolve, 1000));
              
              const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('[W9Upload] Download URL obtained successfully:', downloadUrl);
              
              // Verify the URL is valid
              if (!downloadUrl || !downloadUrl.startsWith('https://')) {
                throw new Error('Invalid download URL received');
              }
              
              setDownloadUrl(downloadUrl);
              setUploadStatus('complete');
              
              // Call the onComplete callback with the download URL
              console.log('[W9Upload] Calling onComplete callback with URL:', downloadUrl);
              onComplete?.(downloadUrl);
              console.log('[W9Upload] Upload process completed successfully - onComplete called');
              
              resolve();
            } catch (urlError) {
              console.error('[W9Upload] Error getting download URL:', urlError);
              const error = urlError as any; // Type assertion for error handling
              console.error('[W9Upload] Error details:', {
                code: error?.code || 'unknown',
                message: error?.message || 'Unknown error',
                stack: error?.stack || 'No stack trace'
              });
              setError(`Upload completed but failed to get download URL: ${error?.message || 'Unknown error'}. Please try again.`);
              setUploadStatus('error');
              reject(urlError);
            }
          }
        );
      });

    } catch (err) {
      console.error('[W9Upload] Upload initialization error:', err);
      setError('Failed to start upload. Please check your connection and try again.');
      setUploadStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const resetUpload = () => {
    setFile(null);
    setError(null);
    setUploadProgress(0);
    setUploadStatus('idle');
    setDownloadUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        W-9 Form Upload
      </h4>

      <div className="space-y-4">
        <p className="text-gray-600">
          Please upload a completed W-9 form. This is required for tax purposes.
          You can download a blank W-9 form from the{' '}
          <a
            href="https://www.irs.gov/pub/irs-pdf/fw9.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="text-orange-600 hover:text-orange-700 underline font-medium"
          >
            IRS website
          </a>
          .
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div>
                <p className="font-medium">Upload Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {uploadStatus === 'complete' && downloadUrl && (
          <div className="bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-green-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">✅ W-9 Form Uploaded Successfully</p>
                <p className="text-sm mt-1">Your tax document has been securely stored.</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".pdf,.jpg,.jpeg,.png"
            className="hidden"
          />

          <div className="flex flex-col space-y-4">
            <Button
              variant="outline"
              onClick={triggerFileInput}
              disabled={loading || uploadStatus === 'complete'}
              className="w-full"
            >
              {uploadStatus === 'complete' 
                ? '✅ File Uploaded' 
                : file 
                  ? 'Change File' 
                  : 'Select W-9 Form'
              }
            </Button>

            {file && uploadStatus !== 'complete' && (
              <div className="bg-gray-50 border border-gray-200 p-3 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 truncate flex-1 mr-2">
                    📄 {file.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </span>
                </div>
              </div>
            )}

            {uploadStatus === 'uploading' && (
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">
                    Uploading...
                  </span>
                  <span className="text-sm font-medium text-orange-600">
                    {uploadProgress.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-orange-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="primary"
                onClick={handleUpload}
                disabled={!file || loading || uploadStatus === 'complete'}
                className="flex-1"
              >
                {loading 
                  ? 'Uploading...' 
                  : uploadStatus === 'complete'
                    ? '✅ Uploaded'
                    : 'Upload W-9 Form'
                }
              </Button>
              
              {(file || uploadStatus === 'complete') && (
                <Button
                  variant="outline"
                  onClick={resetUpload}
                  disabled={loading}
                  className="px-4"
                >
                  Reset
                </Button>
              )}
            </div>
          </div>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
            <strong>Debug Info:</strong>
            <div>Status: {uploadStatus}</div>
            <div>Progress: {uploadProgress.toFixed(1)}%</div>
            <div>User: {currentUser?.uid ? 'Authenticated' : 'Not authenticated'}</div>
            <div>File: {file ? file.name : 'None selected'}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default W9FormUpload; 