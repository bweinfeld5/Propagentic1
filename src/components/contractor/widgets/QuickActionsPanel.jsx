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
      color: 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800',
      action: () => onActionClick?.('jobs')
    },
    {
      id: 'upload-docs',
      title: 'Upload Documents',
      description: 'Add verification documents',
      icon: DocumentArrowUpIcon,
      color: 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700',
      action: () => onActionClick?.('verification')
    },
    {
      id: 'update-availability',
      title: 'Update Schedule',
      description: 'Set your availability',
      icon: CalendarIcon,
      color: 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800',
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
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl border border-orange-200 p-6 hover:shadow-xl transition-all duration-200 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <PlusIcon className="w-5 h-5 text-orange-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
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
              className={`w-full ${action.color} text-white p-4 rounded-xl transition-all duration-200 transform hover:scale-[1.02] group shadow-lg hover:shadow-xl`}
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
            className="w-full flex items-center justify-between p-3 bg-orange-50 hover:bg-orange-100 rounded-xl transition-colors duration-200"
          >
            <span className="text-sm font-medium text-gray-700">
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
      <div className="mt-6 pt-4 border-t border-orange-200">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span className="text-gray-600">Available</span>
          </div>
          <span className="text-gray-500">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};

export default QuickActionsPanel; 