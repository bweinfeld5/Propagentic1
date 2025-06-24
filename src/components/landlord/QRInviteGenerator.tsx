import React, { useState, useEffect } from 'react';
import { 
  QrCodeIcon, 
  LinkIcon, 
  DocumentDuplicateIcon, 
  CheckIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { QRCodeDisplay } from '../qr/QRCodeDisplay';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { auth } from '../../firebase/config';
import { inviteCodeServiceLocal } from '../../services/inviteCodeServiceLocal';
import toast from 'react-hot-toast';

interface Property {
  id: string;
  name?: string;
  nickname?: string;
  streetAddress?: string;
  [key: string]: any;
}

interface QRInviteGeneratorProps {
  selectedPropertyId: string;
  selectedPropertyName: string;
  properties: Property[];
  onInviteCodeGenerated?: (code: string) => void;
  className?: string;
}

export const QRInviteGenerator: React.FC<QRInviteGeneratorProps> = ({
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
      console.log('🔧 Generating invite code for property:', selectedPropertyId);
      
      // Use Firebase Functions instead of direct Firestore write
      const functions = getFunctions();
      const generateInviteCodeFunction = httpsCallable(functions, 'generateInviteCode');
      
      const result = await generateInviteCodeFunction({
        propertyId: selectedPropertyId,
        expirationDays: 7
      });

      const data = result.data as any;
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to create invite code');
      }

      const code = data.inviteCode.code;
      console.log('✅ Generated invite code:', code);
      
      setInviteCode(code);
      setGeneratedAt(new Date());
      
      // Notify parent component
      onInviteCodeGenerated?.(code);
      
      toast.success('QR invite code generated successfully!');
    } catch (err) {
      console.error('❌ Error generating invite code:', err);
      
      // Check if this is a CORS, permission, or Firebase error - use local fallback
      let errorMessage = 'Failed to generate invite code';
      let shouldUseFallback = false;
      
      if (err instanceof Error) {
        if (err.message.includes('unauthenticated') || 
            err.message.includes('permission') ||
            err.message.includes('Missing or insufficient permissions') ||
            err.message.includes('auth') ||
            err.message.includes('UNAUTHENTICATED') ||
            err.message.includes('CORS') ||
            err.message.includes('Failed to fetch') ||
            err.message.includes('internal') ||
            (err as any).code === 'functions/internal') {
          
          console.log('🔧 Firebase Functions issue detected - using local fallback service');
          shouldUseFallback = true;
        } else {
          errorMessage = err.message;
        }
      }
      
      if (shouldUseFallback) {
        try {
          // Use local invite code service for development
          console.log('🔧 Attempting local invite code generation...');
          const localResult = await inviteCodeServiceLocal.generateInviteCode(selectedPropertyId, 7);
          
          if (localResult.success) {
            console.log('✅ Generated local invite code:', localResult.code);
            setInviteCode(localResult.code);
            setGeneratedAt(new Date());
            
            // Notify parent component
            onInviteCodeGenerated?.(localResult.code);
            
            toast.success('QR code generated (local mode)!');
            toast('⚠️ Using local service - codes valid for this session only', {
              duration: 4000,
              icon: '⚠️'
            });
          } else {
            throw new Error('Local service failed');
          }
        } catch (localErr) {
          console.error('❌ Local service also failed:', localErr);
          // Final fallback: simple demo code
          const demoCode = `DEMO${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
          
          console.log('✅ Generated demo invite code:', demoCode);
          setInviteCode(demoCode);
          setGeneratedAt(new Date());
          
          // Notify parent component
          onInviteCodeGenerated?.(demoCode);
          
          toast.success('Demo QR code generated!');
          toast('⚠️ Demo mode: For testing QR functionality only', {
            duration: 4000,
            icon: '⚠️'
          });
        }
      } else {
        setError(errorMessage);
        toast.error(`Failed to generate invite code: ${errorMessage}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateCode = () => {
    generateInviteCode();
  };

  const getInviteUrl = () => {
    const baseUrl = process.env.REACT_APP_QR_BASE_URL || 'https://propagentic.com';
    return `${baseUrl}/invite/${inviteCode}`;
  };

  if (!selectedPropertyId || !selectedPropertyName) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <QrCodeIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Property</h3>
        <p className="text-gray-600">
          Choose a property to generate a QR code invitation
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generating QR Code</h3>
        <p className="text-gray-600">
          Creating invite code for {selectedPropertyName}...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error</h3>
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
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate QR Code</h3>
        <p className="text-gray-600 mb-4">
          Create a QR code invitation for {selectedPropertyName}
        </p>
        <button
          onClick={generateInviteCode}
          className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2 mx-auto"
        >
          <QrCodeIcon className="w-5 h-5" />
          Generate QR Code
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
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
          Invite Details
        </h4>
        <div className="space-y-2 text-sm text-orange-800">
          <div className="flex justify-between">
            <span>Property:</span>
            <span className="font-medium">{selectedPropertyName}</span>
          </div>
          <div className="flex justify-between">
            <span>Invite Code:</span>
            <span className="font-mono font-bold">{inviteCode}</span>
          </div>
          <div className="flex justify-between">
            <span>Generated:</span>
            <span>{generatedAt?.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span>Expires:</span>
            <span>
              {generatedAt 
                ? new Date(generatedAt.getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()
                : 'In 7 days'
              }
            </span>
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
          Generate New Code
        </button>
        
        <button
          onClick={() => {
            navigator.clipboard.writeText(getInviteUrl());
            toast.success('Invite URL copied to clipboard!');
          }}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
        >
          <DocumentDuplicateIcon className="w-4 h-4" />
          Copy URL
        </button>
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
        <h4 className="font-semibold text-blue-900 mb-2">How to Use</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Share the QR code with your tenant via email, text, or print
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Tenant scans the code with their phone camera
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            They'll be directed to join your property instantly
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Code expires in 7 days for security
          </li>
        </ul>
      </div>
    </div>
  );
};

export default QRInviteGenerator; 