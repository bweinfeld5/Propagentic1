import React, { useState } from 'react';

export const TwoFactorSetup = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [qrCode, setQrCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const handleSetup = async () => {
    // Mock 2FA setup
    setQrCode('data:image/png;base64,mock-qr-code');
    setStep(2);
  };

  const handleVerify = async () => {
    if (verificationCode === '123456') {
      onComplete(true);
    }
  };

  return (
    <div className='p-6'>
      <h2 className='text-xl font-bold mb-4'>Two-Factor Authentication Setup</h2>
      
      {step === 1 && (
        <div>
          <p className='mb-4'>Enhance your account security with 2FA</p>
          <button 
            onClick={handleSetup}
            className='bg-blue-500 text-white px-4 py-2 rounded'
          >
            Setup 2FA
          </button>
        </div>
      )}
      
      {step === 2 && (
        <div>
          <p className='mb-4'>Scan QR code with your authenticator app</p>
          <div className='mb-4 p-4 border rounded'>
            QR Code: {qrCode.substring(0, 50)}...
          </div>
          <input
            type='text'
            placeholder='Enter verification code'
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            className='border p-2 rounded mb-4 w-full'
          />
          <button 
            onClick={handleVerify}
            className='bg-green-500 text-white px-4 py-2 rounded'
          >
            Verify & Enable
          </button>
        </div>
      )}
    </div>
  );
};

export const AuditLogViewer = ({ logs = [] }) => {
  return (
    <div className='p-4'>
      <h3 className='text-lg font-semibold mb-4'>Security Audit Log</h3>
      <div className='space-y-2'>
        {logs.map((log, index) => (
          <div key={index} className='p-3 border rounded bg-gray-50'>
            <div className='font-medium'>{log.action}</div>
            <div className='text-sm text-gray-600'>
              {log.timestamp} - User: {log.userId}
            </div>
            {log.details && (
              <div className='text-sm text-gray-500'>{log.details}</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
