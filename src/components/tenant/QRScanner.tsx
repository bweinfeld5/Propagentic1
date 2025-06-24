import React, { useState, useRef, useEffect } from 'react';
import { 
  CameraIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { QrCodeIcon } from '@heroicons/react/24/solid';
import Button from '../ui/Button';

interface QRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (code: string) => void;
  isLoading?: boolean;
  className?: string;
}

export const QRScanner: React.FC<QRScannerProps> = ({
  isOpen,
  onClose,
  onScan,
  isLoading = false,
  className = ''
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>('');
  const [scanning, setScanning] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [lastScanTime, setLastScanTime] = useState<number>(0);
  const scanIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize camera when modal opens
  useEffect(() => {
    if (isOpen) {
      initializeCamera();
    } else {
      cleanup();
    }

    return () => cleanup();
  }, [isOpen]);

  const initializeCamera = async () => {
    setError('');
    try {
      // Check for camera permission
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      
      if (permission.state === 'denied') {
        setError('Camera permission denied. Please enable camera access in your browser settings.');
        return;
      }

      const constraints = {
        video: {
          facingMode: { ideal: 'environment' }, // Use back camera if available
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setPermissionGranted(true);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          startScanning();
        };
      }
    } catch (error: any) {
      console.error('Error accessing camera:', error);
      let errorMessage = 'Failed to access camera.';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Camera permission denied. Please allow camera access and try again.';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera found on this device.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage = 'Camera not supported in this browser.';
      }
      
      setError(errorMessage);
    }
  };

  const startScanning = () => {
    setScanning(true);
    scanIntervalRef.current = setInterval(() => {
      scanForQR();
    }, 500); // Scan every 500ms
  };

  const stopScanning = () => {
    setScanning(false);
    if (scanIntervalRef.current) {
      clearInterval(scanIntervalRef.current);
      scanIntervalRef.current = null;
    }
  };

  const scanForQR = () => {
    if (!videoRef.current || !canvasRef.current || !stream) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) return;

    // Set canvas dimensions to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    try {
      // Get image data for QR code detection
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Note: In a real implementation, you would use a QR code library like jsQR here
      // For this demo, we'll simulate QR detection
      
      // Simulate QR code detection (replace with actual QR library)
      // const code = jsQR(imageData.data, imageData.width, imageData.height);
      
      // For demo purposes, we'll check for a specific pattern or simulate detection
      // In production, integrate with jsQR or similar library
      
    } catch (error) {
      console.error('Error scanning QR code:', error);
    }
  };

  const simulateQRDetection = (mockCode: string) => {
    // Prevent rapid successive scans
    const now = Date.now();
    if (now - lastScanTime < 2000) return; // 2 second cooldown

    setLastScanTime(now);
    stopScanning();
    onScan(mockCode);
  };

  const cleanup = () => {
    stopScanning();
    
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setPermissionGranted(false);
    setError('');
  };

  const handleRetry = () => {
    cleanup();
    setTimeout(() => {
      initializeCamera();
    }, 100);
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-black/90 ${className}`}>
      <div className="w-full max-w-md mx-4">
        {/* Header */}
        <div className="bg-white rounded-t-2xl px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <QrCodeIcon className="w-6 h-6 text-orange-600 mr-2" />
              Scan QR Code
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Scanner Content */}
        <div className="bg-white rounded-b-2xl overflow-hidden">
          {error ? (
            <div className="p-6 text-center">
              <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Camera Error</h4>
              <p className="text-gray-600 mb-6">{error}</p>
              <div className="space-y-3">
                <Button
                  onClick={handleRetry}
                  variant="primary"
                  className="w-full"
                >
                  <ArrowPathIcon className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : !permissionGranted ? (
            <div className="p-6 text-center">
              <CameraIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-semibold text-gray-900 mb-2">Camera Access Required</h4>
              <p className="text-gray-600 mb-6">
                Please allow camera access to scan QR codes. This is required to join properties using QR codes.
              </p>
              <div className="space-y-3">
                <Button
                  onClick={initializeCamera}
                  variant="primary"
                  className="w-full"
                >
                  <CameraIcon className="w-4 h-4 mr-2" />
                  Enable Camera
                </Button>
                <Button
                  onClick={onClose}
                  variant="secondary"
                  className="w-full"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="relative">
              {/* Video Stream */}
              <div className="relative aspect-square bg-black overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  playsInline
                  muted
                />
                
                {/* Scanning Overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="relative">
                    {/* Scanner Frame */}
                    <div className="w-64 h-64 border-2 border-white rounded-2xl relative">
                      {/* Corner indicators */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-lg"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg"></div>
                      
                      {/* Scanning line animation */}
                      {scanning && (
                        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-orange-500 to-transparent animate-pulse"></div>
                      )}
                    </div>
                    
                    {/* Status text */}
                    <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 text-center">
                      <p className="text-white text-sm font-medium">
                        {isLoading ? 'Processing...' : scanning ? 'Scanning for QR code...' : 'Position QR code in the frame'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Hidden canvas for image processing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Control buttons */}
              <div className="p-4 bg-gray-50">
                <div className="space-y-3">
                  {/* Demo button for testing */}
                  <Button
                    onClick={() => simulateQRDetection('INV-DEMO-123456')}
                    variant="outline"
                    className="w-full"
                    disabled={isLoading}
                  >
                    Demo: Simulate QR Scan
                  </Button>
                  
                  <div className="flex gap-3">
                    <Button
                      onClick={handleRetry}
                      variant="secondary"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      <ArrowPathIcon className="w-4 h-4 mr-2" />
                      Retry
                    </Button>
                    <Button
                      onClick={onClose}
                      variant="outline"
                      className="flex-1"
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QRScanner; 