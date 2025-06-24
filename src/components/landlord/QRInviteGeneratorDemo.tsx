import React, { useState, useEffect } from 'react';
import { 
  QrCodeIcon, 
  LinkIcon, 
  DocumentDuplicateIcon, 
  ArrowPathIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { QRCodeDisplay } from '../qr/QRCodeDisplay';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';

interface Property {
  id: string;
  name?: string;
  nickname?: string;
  streetAddress?: string;
  [key: string]: any;
}

interface QRInviteGeneratorDemoProps {
  selectedPropertyId: string;
  selectedPropertyName: string;
  properties: Property[];
  onInviteCodeGenerated?: (code: string) => void;
  className?: string;
}

export const QRInviteGeneratorDemo: React.FC<QRInviteGeneratorDemoProps> = ({
  selectedPropertyId,
  selectedPropertyName,
  properties,
  onInviteCodeGenerated,
  className = ''
}) => {
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<Date | null>(null);

  // Generate QR code when property changes or when manually triggered
  useEffect(() => {
    if (selectedPropertyId && selectedPropertyName) {
      generateInviteCode();
    }
  }, [selectedPropertyId, selectedPropertyName]);

  const generateInviteCode = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setError('You must be logged in to generate invite codes');
      return;
    }

    if (!selectedPropertyId) {
      setError('Please select a property first');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log('🔧 Generating demo invite code for property:', selectedPropertyId);
      
      // Simulate Firebase Function call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Generate a demo code for testing QR functionality
      const demoCode = `DEMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      console.log('✅ Generated demo invite code:', demoCode);
      
      setInviteCode(demoCode);
      setGeneratedAt(new Date());
      
      // Notify parent component
      onInviteCodeGenerated?.(demoCode);
      
      toast.success('Demo QR invite code generated!');
      toast('⚠️ Demo mode: For testing QR functionality only', {
        duration: 3000,
        icon: '⚠️'
      });
    } catch (err) {
      console.error('❌ Error generating demo invite code:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate demo code';
      setError(errorMessage);
      toast.error(`Demo generation failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = () => {
    generateInviteCode();
  };

  const getInviteUrl = () => {
    const baseUrl = process.env.REACT_APP_QR_BASE_URL || 'https://propagentic.com';
    return `${baseUrl}/invite/${inviteCode}?source=qr&demo=true`;
  };

  if (!selectedPropertyId || !selectedPropertyName) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Property</h3>
        <p className="text-gray-600">
          Choose a property to generate a demo QR code invitation
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating Demo QR Code</h3>
        <p className="text-gray-600">
          Creating demo invite code for {selectedPropertyName}...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Demo Error</h3>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={generateInviteCode}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!inviteCode) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Demo QR Code</h3>
        <p className="text-gray-600 mb-4">
          Create a demo QR code invitation for {selectedPropertyName}
        </p>
        <button
          onClick={generateInviteCode}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto"
        >
          <QrCodeIcon className="w-5 h-5" />
          Generate Demo QR Code
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Demo Warning Banner */}
      <div className="bg-yellow-50 rounded-xl p-4 border border-yellow-200">
        <div className="flex items-center gap-2 text-yellow-800">
          <ExclamationTriangleIcon className="w-5 h-5" />
          <span className="font-semibold">Demo Mode</span>
        </div>
        <p className="text-sm text-yellow-700 mt-1">
          This is a demonstration QR code. Real invite codes require proper Firebase authentication.
        </p>
      </div>

      {/* QR Code Display */}
      <div className="text-center">
        <QRCodeDisplay
          inviteCode={inviteCode}
          propertyName={selectedPropertyName}
          size={200}
          includeText={true}
          downloadable={true}
          style="branded"
        />
      </div>

      {/* Invite Information */}
      <div className="bg-orange-50 rounded-xl p-4 border border-orange-200">
        <h4 className="font-semibold text-orange-900 mb-2 flex items-center">
          <LinkIcon className="w-5 h-5 mr-2" />
          Demo Invite Details
        </h4>
        <div className="space-y-2 text-sm text-orange-800">
          <div className="flex justify-between">
            <span>Property:</span>
            <span className="font-medium">{selectedPropertyName}</span>
          </div>
          <div className="flex justify-between">
            <span>Demo Code:</span>
            <span className="font-mono font-bold">{inviteCode}</span>
          </div>
          <div className="flex justify-between">
            <span>Generated:</span>
            <span>{generatedAt?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Type:</span>
            <span className="text-yellow-600 font-medium">Demo Only</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <button
          onClick={handleRegenerateCode}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Generate New Demo Code
        </button>
        
        <button
          onClick={() => {
            navigator.clipboard.writeText(getInviteUrl());
            toast.success('Demo invite URL copied to clipboard!');
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          <DocumentDuplicateIcon className="w-4 h-4" />
          Copy Demo URL
        </button>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">Demo Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            This QR code demonstrates the visual appearance and functionality
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Scanning will show demo invitation flow
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Real codes require Firebase Functions deployment
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Demo codes work for testing UI/UX only
          </li>
        </ul>
      </div>
    </div>
  );
};

export default QRInviteGeneratorDemo; 