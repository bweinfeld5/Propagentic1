import React, { useState, useEffect } from 'react';
import QRCode from 'react-qr-code';
import { 
  ArrowDownTrayIcon, 
  DocumentDuplicateIcon, 
  CheckIcon,
  ExclamationTriangleIcon 
} from '@heroicons/react/24/outline';
import { qrCodeService, QRStyle, InviteQRResult } from '../../services/qrCodeService';
import toast from 'react-hot-toast';

interface QRCodeDisplayProps {
  inviteCode: string;
  propertyName: string;
  size?: number;
  includeText?: boolean;
  downloadable?: boolean;
  style?: QRStyle;
  className?: string;
  onQRGenerated?: (result: InviteQRResult) => void;
}

export const QRCodeDisplay: React.FC<QRCodeDisplayProps> = ({
  inviteCode,
  propertyName,
  size = 200,
  includeText = true,
  downloadable = true,
  style = 'minimal',
  className = '',
  onQRGenerated
}) => {
  const [qrResult, setQrResult] = useState<InviteQRResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Generate QR code on mount or when props change
  useEffect(() => {
    generateQRCode();
  }, [inviteCode, propertyName, style, size]);

  const generateQRCode = async () => {
    try {
      setLoading(true);
      setError(null);

      const result = await qrCodeService.generateInviteQR(
        inviteCode,
        propertyName,
        {
          width: size,
          ...(style === 'branded' && {
            color: {
              dark: '#ea580c', // PropAgentic orange
              light: '#fff7ed'
            }
          })
        }
      );

      setQrResult(result);
      onQRGenerated?.(result);
    } catch (err) {
      console.error('Error generating QR code:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate QR code');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyUrl = async () => {
    if (!qrResult) return;

    try {
      await navigator.clipboard.writeText(qrResult.inviteUrl);
      setCopied(true);
      toast.success('Invite URL copied to clipboard!');
      
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying to clipboard:', err);
      toast.error('Failed to copy URL');
    }
  };

  const handleDownload = async (format: 'png' | 'svg' = 'png') => {
    if (!qrResult) return;

    try {
      setDownloading(true);
      
      const blob = await qrCodeService.generateDownloadableQR(
        inviteCode,
        format,
        { width: size * 2 } // Higher resolution for download
      );

      // Create download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `PropAgentic-Invite-${inviteCode}-${propertyName.replace(/\s+/g, '-')}.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`QR code downloaded as ${format.toUpperCase()}`);
    } catch (err) {
      console.error('Error downloading QR code:', err);
      toast.error('Failed to download QR code');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center ${className}`}>
        <div 
          className="animate-spin rounded-full border-b-2 border-orange-500 mb-4"
          style={{ width: size / 4, height: size / 4 }}
        />
        <p className="text-sm text-gray-600">Generating QR code...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center text-center ${className}`}>
        <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={generateQRCode}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!qrResult) {
    return null;
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* QR Code Display */}
      <div className={`
        p-4 bg-white rounded-xl border-2 shadow-lg
        ${style === 'branded' ? 'border-orange-200 bg-gradient-to-br from-white to-orange-50' : 'border-gray-200'}
      `}>
        <QRCode
          value={qrResult.inviteUrl}
          size={size}
          style={{ height: "auto", maxWidth: "100%", width: "100%" }}
          viewBox={`0 0 256 256`}
          fgColor={style === 'branded' ? '#ea580c' : '#000000'}
          bgColor={style === 'branded' ? '#fff7ed' : '#ffffff'}
        />
      </div>

      {/* Property Information */}
      {includeText && (
        <div className="mt-4 text-center">
          <h3 className="font-semibold text-gray-900">{propertyName}</h3>
          <p className="text-sm text-gray-600 mt-1">Invite Code: {inviteCode}</p>
          <p className="text-xs text-gray-500 mt-1">
            Scan to join this property
          </p>
        </div>
      )}

      {/* Action Buttons */}
      {downloadable && (
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {/* Copy URL Button */}
          <button
            onClick={handleCopyUrl}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors text-sm"
          >
            {copied ? (
              <>
                <CheckIcon className="w-4 h-4 text-green-600" />
                Copied!
              </>
            ) : (
              <>
                <DocumentDuplicateIcon className="w-4 h-4" />
                Copy URL
              </>
            )}
          </button>

          {/* Download PNG Button */}
          <button
            onClick={() => handleDownload('png')}
            disabled={downloading}
            className="flex items-center gap-2 px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            {downloading ? 'Downloading...' : 'PNG'}
          </button>

          {/* Download SVG Button */}
          <button
            onClick={() => handleDownload('svg')}
            disabled={downloading}
            className="flex items-center gap-2 px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors text-sm disabled:opacity-50"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            SVG
          </button>
        </div>
      )}

      {/* QR Code URL for debugging (dev only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 break-all">
            QR URL: {qrResult.inviteUrl}
          </p>
        </div>
      )}
    </div>
  );
};

export default QRCodeDisplay; 