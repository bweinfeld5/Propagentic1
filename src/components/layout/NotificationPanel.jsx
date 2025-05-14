import React from 'react';
import { XMarkIcon, BellIcon } from '@heroicons/react/24/outline';
import { useNotifications } from '../../context/NotificationContext';
import NotificationList from '../notifications/NotificationList';

const NotificationPanel = ({ isOpen, onClose }) => {
  const { unreadCount } = useNotifications();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 overflow-hidden z-50" role="dialog" aria-modal="true">
      {/* Background overlay */}
      <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

      <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
        <div className="w-screen max-w-md">
          <div className="h-full flex flex-col bg-white shadow-xl overflow-y-auto">
            {/* Header */}
            <div className="px-4 py-6 bg-[#176B5D] sm:px-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium text-white flex items-center">
                  <BellIcon className="h-6 w-6 mr-2" />
                  Notifications
                  {unreadCount > 0 && (
                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                      {unreadCount} new
                    </span>
                  )}
                </h2>
                <div className="ml-3 h-7 flex items-center">
                  <button
                    type="button"
                    className="bg-[#176B5D] rounded-md text-teal-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                    onClick={onClose}
                  >
                    <span className="sr-only">Close panel</span>
                    <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="mt-1">
                <p className="text-sm text-teal-100">
                  Updates about your maintenance requests and property.
                </p>
              </div>
            </div>

            {/* Use the NotificationList component for the content */}
            <div className="flex-1 overflow-y-auto">
              <NotificationList />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel; 