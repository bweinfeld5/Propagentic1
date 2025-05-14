import React, { createContext, useContext, useState } from 'react';
import StatusListener from './StatusListener';

// Create notification context
const NotificationContext = createContext({
  show: () => {},
  notifications: [],
  clearNotification: () => {}
});

/**
 * Custom hook to use notifications
 */
export const useNotifications = () => useContext(NotificationContext);

/**
 * Toast Notification Component
 */
const Toast = ({ notification, onClose }) => {
  const { title, description, status, id } = notification;
  
  const bgColor = status === 'success' ? 'bg-green-50 border-green-500' :
                 status === 'error' ? 'bg-red-50 border-red-500' :
                 status === 'info' ? 'bg-blue-50 border-blue-500' :
                 status === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                 'bg-gray-50 border-gray-500';
  
  const textColor = status === 'success' ? 'text-green-800' :
                   status === 'error' ? 'text-red-800' :
                   status === 'info' ? 'text-blue-800' :
                   status === 'warning' ? 'text-yellow-800' :
                   'text-gray-800';
                   
  const iconColor = status === 'success' ? 'text-green-500' :
                   status === 'error' ? 'text-red-500' :
                   status === 'info' ? 'text-blue-500' :
                   status === 'warning' ? 'text-yellow-500' :
                   'text-gray-500';

  return (
    <div className={`rounded-md border-l-4 p-4 ${bgColor}`}>
      <div className="flex">
        <div className="flex-shrink-0">
          {status === 'success' && (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          )}
          {status === 'error' && (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
          {status === 'info' && (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4a1 1 0 102 0V7zm-1 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
            </svg>
          )}
          {status === 'warning' && (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          {!status && (
            <svg className={`h-5 w-5 ${iconColor}`} viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="ml-3">
          <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
          {description && <div className={`mt-2 text-sm ${textColor}`}>{description}</div>}
        </div>
        <div className="ml-auto pl-3">
          <div className="-mx-1.5 -my-1.5">
            <button
              onClick={() => onClose(id)}
              className={`inline-flex rounded-md p-1.5 ${textColor} hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-50 focus:ring-gray-600`}
            >
              <span className="sr-only">Dismiss</span>
              <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Notification Provider Component
 */
export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  
  // Function to add a notification
  const show = ({ title, description, status = 'default', duration = 5000 }) => {
    const id = Date.now().toString();
    const newNotification = {
      id,
      title,
      description,
      status
    };
    
    setNotifications(prevNotifications => [...prevNotifications, newNotification]);
    
    // Auto-dismiss after duration
    if (duration !== null) {
      setTimeout(() => {
        clearNotification(id);
      }, duration);
    }
    
    return id;
  };
  
  // Function to remove a notification
  const clearNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // Context value
  const value = {
    show,
    notifications,
    clearNotification
  };
  
  return (
    <NotificationContext.Provider value={value}>
      {children}
      
      {/* Status listener for real-time updates */}
      <StatusListener 
        toastManager={{ show }}
        onStatusUpdate={(ticket) => {
          console.log('Ticket status updated:', ticket);
          // Add additional handling if needed
        }}
      />
      
      {/* Toast notification container */}
      {notifications.length > 0 && (
        <div className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
          <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className="max-w-sm w-full pointer-events-auto"
              >
                <Toast 
                  notification={notification} 
                  onClose={clearNotification}
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider; 