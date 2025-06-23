import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import ContractorJobNotificationCenter from './components/notifications/ContractorJobNotificationCenter';

const NotificationDemo: React.FC = () => {
  const { currentUser } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [demoMessage, setDemoMessage] = useState('');

  const handleUnreadCountChange = (count: number) => {
    setUnreadCount(count);
  };

  const showDemoMessage = (message: string) => {
    setDemoMessage(message);
    setTimeout(() => setDemoMessage(''), 3000);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">
          Real-Time Notification System Demo
        </h1>

        {/* Demo Message */}
        {demoMessage && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800">{demoMessage}</p>
          </div>
        )}

        {/* Notification Center */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Job Notifications</h2>
            <p className="text-gray-600">
              Real-time notifications for contractor job actions
            </p>
          </div>
          <ContractorJobNotificationCenter 
            onUnreadCountChange={handleUnreadCountChange}
          />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-blue-800">Unread Notifications</h3>
            <p className="text-2xl font-bold text-blue-900">{unreadCount}</p>
          </div>
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-green-800">User Status</h3>
            <p className="text-2xl font-bold text-green-900">
              {currentUser ? 'Authenticated' : 'Not Authenticated'}
            </p>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg">
            <h3 className="text-sm font-medium text-purple-800">System Status</h3>
            <p className="text-2xl font-bold text-purple-900">Active</p>
          </div>
        </div>

        {/* Features Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Real-Time Features
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Instant notification delivery
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Bid acceptance/rejection alerts
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Job assignment confirmations
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Priority-based notification system
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Filter by notification type
              </li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-3">
              Notification Types
            </h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                <strong>Bid Accepted:</strong> Contractor accepts a job
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-2"></span>
                <strong>Bid Rejected:</strong> Contractor rejects a job
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                <strong>Job Assigned:</strong> Contractor gets assigned
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                <strong>Job Completed:</strong> Work is finished
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                <strong>Bid Submitted:</strong> New bid received
              </li>
            </ul>
          </div>
        </div>

        {/* How to Use */}
        <div className="mt-6 bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-yellow-900 mb-2">
            How to Test the System
          </h3>
          <div className="text-sm text-yellow-800 space-y-1">
            <p>1. Click the notification bell icon to open the notification center</p>
            <p>2. Use the filter tabs to view different notification types</p>
            <p>3. Mark notifications as read or delete them</p>
            <p>4. Notifications update in real-time when contractors accept/reject jobs</p>
          </div>
        </div>

        {/* Technical Details */}
        <div className="mt-6 bg-gray-100 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Technical Implementation
          </h3>
          <div className="text-sm text-gray-700 space-y-1">
            <p><strong>Backend:</strong> Firebase Cloud Functions with Firestore transactions</p>
            <p><strong>Real-time:</strong> Firestore onSnapshot listeners</p>
            <p><strong>Frontend:</strong> React hooks with TypeScript</p>
            <p><strong>Notifications:</strong> Dual collection system (jobNotifications + notifications)</p>
            <p><strong>Security:</strong> User-based filtering and validation</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationDemo; 