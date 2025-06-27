import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  ArrowDownTrayIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ShareIcon
} from '@heroicons/react/24/outline';
import { pwaInstallManager, isPWA, isMobile } from '../../utils/pwaUtils';

const PWAInstallBanner = ({ 
  className = '',
  onInstall,
  onDismiss,
  persistDismissal = true,
  showInstructions = true 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installInstructions, setInstallInstructions] = useState(null);
  const [showInstructionModal, setShowInstructionModal] = useState(false);

  useEffect(() => {
    // Don't show if already running as PWA
    if (isPWA()) {
      return;
    }

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed && persistDismissal) {
      return;
    }

    // Set up PWA manager listener
    const handlePWAEvent = (event, data) => {
      if (event === 'installable') {
        setIsVisible(true);
        setInstallInstructions(pwaInstallManager.getInstallInstructions());
      } else if (event === 'installed') {
        setIsVisible(false);
        onInstall?.();
      }
    };

    pwaInstallManager.addListener(handlePWAEvent);

    // Check if already installable
    if (pwaInstallManager.canInstall()) {
      setIsVisible(true);
      setInstallInstructions(pwaInstallManager.getInstallInstructions());
    }

    return () => {
      pwaInstallManager.removeListener(handlePWAEvent);
    };
  }, [onInstall, persistDismissal]);

  const handleInstall = async () => {
    try {
      setIsInstalling(true);
      
      if (pwaInstallManager.canInstall()) {
        await pwaInstallManager.showInstallPrompt();
      } else {
        // Show manual instructions for unsupported browsers
        setShowInstructionModal(true);
      }
    } catch (error) {
      console.error('Error installing PWA:', error);
      // Fallback to manual instructions
      setShowInstructionModal(true);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    
    if (persistDismissal) {
      localStorage.setItem('pwa-install-dismissed', 'true');
    }
    
    onDismiss?.();
  };

  const getPlatformIcon = () => {
    if (!installInstructions) return <DevicePhoneMobileIcon className="w-6 h-6" />;
    
    switch (installInstructions.platform) {
      case 'iOS':
        return <span className="text-2xl">🍎</span>;
      case 'Android':
        return <span className="text-2xl">🤖</span>;
      default:
        return <ComputerDesktopIcon className="w-6 h-6" />;
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Install Banner */}
      <div className={`bg-gradient-to-r from-blue-600 to-purple-600 text-white ${className}`}>
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3 flex-1">
            {getPlatformIcon()}
            
            <div className="flex-1">
              <h3 className="font-semibold text-sm">
                Install PropAgentic App
              </h3>
              <p className="text-xs text-blue-100">
                Get the full experience with offline access and notifications
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {showInstructions && (
              <button
                onClick={() => setShowInstructionModal(true)}
                className="text-blue-100 hover:text-white text-xs underline"
              >
                How?
              </button>
            )}
            
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-white text-blue-600 px-3 py-1 rounded-lg text-sm font-medium hover:bg-blue-50 transition-colors disabled:opacity-50 flex items-center gap-1"
            >
              {isInstalling ? (
                <>
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  Installing...
                </>
              ) : (
                <>
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  Install
                </>
              )}
            </button>

            <button
              onClick={handleDismiss}
              className="text-blue-100 hover:text-white p-1"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Installation Instructions Modal */}
      {showInstructionModal && installInstructions && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                {getPlatformIcon()}
                <h2 className="text-lg font-semibold text-gray-900">
                  Install on {installInstructions.platform}
                </h2>
              </div>
              <button
                onClick={() => setShowInstructionModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3 mb-6">
              {installInstructions.steps.map((step, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                    {index + 1}
                  </div>
                  <p className="text-gray-700 text-sm">{step}</p>
                </div>
              ))}
            </div>

            {installInstructions.platform === 'iOS' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
                <div className="flex items-center gap-2">
                  <ShareIcon className="w-5 h-5 text-yellow-600" />
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Use Safari browser for installation
                  </p>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowInstructionModal(false)}
                className="flex-1 px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
              {pwaInstallManager.canInstall() && (
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Install Now
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PWAInstallBanner; 