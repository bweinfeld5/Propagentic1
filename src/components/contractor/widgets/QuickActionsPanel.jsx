import React, { useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import {
  DocumentArrowUpIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserCircleIcon,
  BellIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

const QuickActionsPanel = ({ onActionClick }) => {
  const { currentUser } = useAuth();

  const primaryActions = [
    {
      id: 'view-jobs',
      title: 'View Jobs',
      description: 'Check new assignments',
      icon: ClipboardDocumentListIcon,
      color: 'bg-blue-500 hover:bg-blue-600',
      action: () => onActionClick?.('jobs')
    },
    {
      id: 'upload-docs',
      title: 'Upload Documents',
      description: 'Add verification documents',
      icon: DocumentArrowUpIcon,
      color: 'bg-emerald-500 hover:bg-emerald-600',
      action: () => onActionClick?.('verification')
    },
    {
      id: 'update-availability',
      title: 'Update Schedule',
      description: 'Set your availability',
      icon: CalendarIcon,
      color: 'bg-purple-500 hover:bg-purple-600',
      action: () => onActionClick?.('availability')
    }
  ];

  const secondaryActions = [
    {
      id: 'messages',
      title: 'Messages',
      count: 3,
      action: () => onActionClick?.('messages')
    },
    {
      id: 'notifications',
      title: 'Notifications',
      count: 2,
      action: () => onActionClick?.('notifications')
    },
    {
      id: 'profile',
      title: 'Edit Profile',
      action: () => onActionClick?.('profile')
    }
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-xl flex items-center justify-center">
            <PlusIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Quick Actions
          </h3>
        </div>
      </div>

      {/* Primary Actions */}
      <div className="space-y-3 mb-6">
        {primaryActions.map((action) => {
          const IconComponent = action.icon;
          return (
            <button
              key={action.id}
              onClick={action.action}
              className={`w-full ${action.color} text-white p-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] group`}
            >
              <div className="flex items-center space-x-3">
                <IconComponent className="w-5 h-5" />
                <div className="flex-1 text-left">
                  <div className="font-medium text-sm">
                    {action.title}
                  </div>
                  <div className="text-xs opacity-90">
                    {action.description}
                  </div>
                </div>
                <ChevronRightIcon className="w-4 h-4 opacity-60 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Secondary Actions */}
      <div className="space-y-2">
        {secondaryActions.map((action) => (
          <button
            key={action.id}
            onClick={action.action}
            className="w-full flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors duration-200"
          >
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {action.title}
            </span>
            <div className="flex items-center space-x-2">
              {action.count && (
                <span className="bg-red-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
                  {action.count}
                </span>
              )}
              <ChevronRightIcon className="w-4 h-4 text-gray-400" />
            </div>
          </button>
        ))}
      </div>

      {/* Status */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
            <span className="text-gray-600 dark:text-gray-300">Available</span>
          </div>
          <span className="text-gray-500 dark:text-gray-400">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel; 