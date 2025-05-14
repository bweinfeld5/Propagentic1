import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../context/NotificationContext';
import {
  CheckCircleIcon,
  BellAlertIcon,
  InformationCircleIcon,
  ExclamationTriangleIcon,
  XMarkIcon,
  CheckIcon,
  ArrowTopRightOnSquareIcon,
  UserCircleIcon,
  WrenchScrewdriverIcon,
  HomeIcon,
  TicketIcon
} from '@heroicons/react/24/outline';

const NotificationCard = ({ notification }) => {
  const { markAsRead, deleteNotification } = useNotifications();
  const navigate = useNavigate();

  // Get appropriate icon based on notification type
  const getTypeIcon = () => {
    switch (notification.uiType) {
      case 'success':
        return <CheckCircleIcon className="h-6 w-6 text-green-500" />;
      case 'warning':
        return <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500" />;
      case 'error':
        return <XMarkIcon className="h-6 w-6 text-red-500" />;
      case 'info':
      default:
        return <InformationCircleIcon className="h-6 w-6 text-blue-500" />;
    }
  };

  // Get appropriate action icon based on notification type
  const getActionIcon = () => {
    switch (notification.type) {
      case 'invitation':
        return <UserCircleIcon className="h-5 w-5 text-indigo-500" />;
      case 'assignment':
      case 'new_assignment':
        return <WrenchScrewdriverIcon className="h-5 w-5 text-teal-500" />;
      case 'status_change':
      case 'classified':
        return <TicketIcon className="h-5 w-5 text-blue-500" />;
      case 'request_completed':
        return <CheckIcon className="h-5 w-5 text-green-500" />;
      case 'high_urgency':
        return <BellAlertIcon className="h-5 w-5 text-red-500" />;
      case 'new_request':
        return <HomeIcon className="h-5 w-5 text-gray-500" />;
      default:
        return <ArrowTopRightOnSquareIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  // Handle clicking the notification
  const handleClick = () => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate based on notification type
    if (notification.data?.ticketId) {
      navigate(`/tickets/${notification.data.ticketId}`);
    } else if (notification.type === 'invitation' && notification.data?.invitationId) {
      navigate(`/invitations/${notification.data.invitationId}`);
    } else if (notification.data?.propertyId) {
      navigate(`/properties/${notification.data.propertyId}`);
    }
  };

  // Get appropriate primary action button based on notification type
  const getActionButton = () => {
    switch (notification.type) {
      case 'invitation':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/invitations/${notification.data?.invitationId}`);
            }}
            className="px-3 py-1 text-xs font-medium rounded-full bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
          >
            View Invitation
          </button>
        );
      case 'assignment':
      case 'new_assignment':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tickets/${notification.data?.ticketId}`);
            }}
            className="px-3 py-1 text-xs font-medium rounded-full bg-teal-50 text-teal-700 hover:bg-teal-100"
          >
            View Job
          </button>
        );
      case 'high_urgency':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tickets/${notification.data?.ticketId}`);
            }}
            className="px-3 py-1 text-xs font-medium rounded-full bg-red-50 text-red-700 hover:bg-red-100"
          >
            Urgent: View
          </button>
        );
      case 'status_change':
      case 'classified':
      case 'new_request':
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/tickets/${notification.data?.ticketId}`);
            }}
            className="px-3 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-700 hover:bg-blue-100"
          >
            View Details
          </button>
        );
      default:
        if (notification.data?.ticketId) {
          return (
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/tickets/${notification.data.ticketId}`);
              }}
              className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              View
            </button>
          );
        }
        return null;
    }
  };

  return (
    <div 
      onClick={handleClick}
      className={`
        p-4 hover:bg-gray-50 cursor-pointer transition-colors
        ${notification.read ? '' : 'bg-teal-50'}
      `}
    >
      <div className="flex items-start">
        <div className="flex-shrink-0">{getTypeIcon()}</div>
        
        <div className="ml-3 flex-1">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-gray-900">
                {notification.title}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                {notification.data?.message || notification.message}
              </p>
            </div>
            
            <div className="ml-4 flex-shrink-0 flex flex-col items-end">
              <p className="text-xs text-gray-500">
                {notification.time}
              </p>
              
              {!notification.read && (
                <span className="mt-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-teal-100 text-teal-800">
                  New
                </span>
              )}
            </div>
          </div>
          
          {/* Action buttons */}
          <div className="mt-3 flex justify-between items-center">
            <div className="flex items-center">
              {getActionIcon()}
              {notification.data?.category && (
                <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                  {notification.data.category}
                </span>
              )}
              {notification.data?.urgency && (
                <span className={`
                  ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium
                  ${notification.data.urgency >= 4 
                    ? 'bg-red-100 text-red-800' 
                    : notification.data.urgency >= 3 
                      ? 'bg-yellow-100 text-yellow-800' 
                      : 'bg-green-100 text-green-800'
                  }
                `}>
                  Priority {notification.data.urgency}
                </span>
              )}
            </div>
            
            <div className="flex space-x-2">
              {!notification.read && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    markAsRead(notification.id);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Mark read
                </button>
              )}
              
              {getActionButton()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCard; 