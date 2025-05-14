import React from 'react';
import { useAuth } from '../context/AuthContext';
import NotificationList from '../components/notifications/NotificationList';
import { BellAlertIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../context/NotificationContext';

const NotificationsPage = () => {
  const { currentUser, userProfile } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  // Redirect if not logged in
  if (!currentUser) {
    navigate('/login');
    return null;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Page header */}
        <div className="px-4 py-4 sm:px-0 mb-6 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="mr-4 p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-white"
            >
              <ArrowLeftIcon className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center">
                Notifications
                <BellAlertIcon className="ml-2 h-6 w-6 text-yellow-500" />
              </h1>
              <p className="mt-1 text-sm text-gray-600">
                View and manage your notifications
              </p>
            </div>
          </div>
        </div>

        {/* Notifications overview */}
        <div className="mb-6 px-4 sm:px-0">
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Total Notifications
                  </dt>
                  <dd className="mt-1 text-3xl font-semibold text-gray-900">
                    {notifications.length}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Recent Activity
                  </dt>
                  <dd className="mt-1 text-xl font-medium text-gray-900">
                    {notifications.length > 0 ? (
                      notifications[0].time
                    ) : (
                      <span className="text-gray-500">No recent activity</span>
                    )}
                  </dd>
                </div>
                
                <div>
                  <dt className="text-sm font-medium text-gray-500">
                    Your Role
                  </dt>
                  <dd className="mt-1 text-xl font-medium text-gray-900 capitalize">
                    {userProfile?.userType || 'User'}
                  </dd>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Notification list */}
        <div className="px-4 sm:px-0">
          <NotificationList />
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage; 