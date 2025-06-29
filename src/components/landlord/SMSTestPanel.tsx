import React, { useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';
import Button from '../ui/Button';

interface SMSTestPanelProps {
  className?: string;
}

const SMSTestPanel: React.FC<SMSTestPanelProps> = ({ className = '' }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState('Test message from PropAgentic!');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendTestSMS = async () => {
    if (!phoneNumber || !message) {
      toast.error('Please provide both phone number and message');
      return;
    }

    setIsLoading(true);
    try {
      const functions = getFunctions();
      const sendTestSMS = httpsCallable(functions, 'sendTestSMS');
      
      const result = await sendTestSMS({
        phoneNumber: phoneNumber,
        message: message
      });

      const data = result.data as any;
      if (data.success) {
        toast.success('SMS sent successfully!');
        console.log('SMS SID:', data.messageSid);
      } else {
        toast.error('Failed to send SMS');
      }
    } catch (error: any) {
      console.error('Error sending test SMS:', error);
      toast.error(error.message || 'Failed to send SMS');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        📱 Test SMS Notifications
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Phone Number
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="+1234567890"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Include country code (e.g., +1 for US)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Message
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            placeholder="Enter your test message..."
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {message.length}/160 characters
          </p>
        </div>

        <Button
          onClick={handleSendTestSMS}
          disabled={isLoading || !phoneNumber || !message}
          className="w-full"
        >
          {isLoading ? 'Sending...' : 'Send Test SMS'}
        </Button>
      </div>

      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Note:</strong> SMS costs apply. Each message costs approximately $0.012.
          Contractors will automatically receive welcome SMS when added to your network.
        </p>
      </div>
    </div>
  );
};

export default SMSTestPanel; 