import React, { useState, useEffect } from 'react';
import {
  ChatBubbleLeftRightIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  Cog6ToothIcon,
  InboxIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

// Import the individual communication components
import MessagingSystem from './MessagingSystem';
import NotificationPreferences from './NotificationPreferences';
import ContractorCommunication from './ContractorCommunication';
import AutomatedNotifications from './AutomatedNotifications';

const CommunicationCenter = ({ userRole = 'landlord', currentUser = {} }) => {
  const [activeTab, setActiveTab] = useState('messages');
  const [notifications, setNotifications] = useState({
    unreadMessages: 3,
    activeAlerts: 2,
    contractorBids: 5,
    pendingActions: 1
  });

  useEffect(() => {
    // Load notification counts and status
    loadNotificationCounts();
  }, []);

  const loadNotificationCounts = () => {
    // Mock notification counts - replace with actual API calls
    setNotifications({
      unreadMessages: 3,
      activeAlerts: 2,
      contractorBids: 5,
      pendingActions: 1
    });
  };

  const navigationTabs = [
    {
      id: 'messages',
      label: 'Messages',
      icon: ChatBubbleLeftRightIcon,
      badge: notifications.unreadMessages,
      description: 'Tenant and contractor conversations'
    },
    {
      id: 'alerts',
      label: 'Smart Alerts',
      icon: BoltIcon,
      badge: notifications.activeAlerts,
      description: 'Automated notifications and escalations'
    },
    {
      id: 'contractors',
      label: 'Contractors',
      icon: WrenchScrewdriverIcon,
      badge: notifications.contractorBids,
      description: 'Job management and contractor communication'
    },
    {
      id: 'preferences',
      label: 'Preferences',
      icon: Cog6ToothIcon,
      badge: null,
      description: 'Notification settings and preferences'
    }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'messages':
        return <MessagingSystem userRole={userRole} currentUser={currentUser} />;
      case 'alerts':
        return <AutomatedNotifications userRole={userRole} />;
      case 'contractors':
        return <ContractorCommunication userRole={userRole} currentUser={currentUser} />;
      case 'preferences':
        return <NotificationPreferences userRole={userRole} onSave={(prefs) => console.log('Saved preferences:', prefs)} />;
      default:
        return <MessagingSystem userRole={userRole} currentUser={currentUser} />;
    }
  };

  const renderSidebar = () => (
    <div className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
            <ChatBubbleLeftRightIcon className="w-6 h-6 text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Communications</h2>
            <p className="text-sm text-gray-600">Phase 1.3 Complete</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <div className="space-y-2">
          {navigationTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-lg text-left transition-colors ${
                activeTab === tab.id
                  ? 'bg-orange-50 text-orange-700 border-r-2 border-orange-500'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <tab.icon className="w-5 h-5" />
                <div>
                  <div className="font-medium">{tab.label}</div>
                  <div className="text-xs text-gray-500">{tab.description}</div>
                </div>
              </div>
              {tab.badge && tab.badge > 0 && (
                <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </nav>

      {/* Status Summary */}
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">System Status</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-green-600">Active</span>
            </div>
          </div>
          
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-500">Unread Messages</span>
              <span className="font-medium text-gray-900">{notifications.unreadMessages}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Active Alerts</span>
              <span className="font-medium text-orange-600">{notifications.activeAlerts}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Pending Bids</span>
              <span className="font-medium text-blue-600">{notifications.contractorBids}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderHeader = () => (
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {navigationTabs.find(tab => tab.id === activeTab)?.label || 'Communication Center'}
          </h1>
          <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
            Phase 1.3 Complete
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 relative">
              <BellIcon className="w-5 h-5" />
              {notifications.activeAlerts > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full"></span>
              )}
            </button>
            
            <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 relative">
              <InboxIcon className="w-5 h-5" />
              {notifications.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-500 rounded-full"></span>
              )}
            </button>
          </div>

          {/* Connection Status */}
          <div className="flex items-center gap-2 px-3 py-1 bg-green-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-green-700">Real-time</span>
          </div>
        </div>
      </div>
      
      {/* Quick Stats Bar */}
      <div className="mt-4 grid grid-cols-4 gap-4">
        <div className="bg-blue-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <ChatBubbleLeftRightIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">Messages</span>
          </div>
          <div className="text-lg font-bold text-blue-900">{notifications.unreadMessages}</div>
          <div className="text-xs text-blue-600">Unread conversations</div>
        </div>
        
        <div className="bg-orange-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <ExclamationTriangleIcon className="w-4 h-4 text-orange-600" />
            <span className="text-sm font-medium text-orange-900">Alerts</span>
          </div>
          <div className="text-lg font-bold text-orange-900">{notifications.activeAlerts}</div>
          <div className="text-xs text-orange-600">Require attention</div>
        </div>
        
        <div className="bg-purple-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <WrenchScrewdriverIcon className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-900">Jobs</span>
          </div>
          <div className="text-lg font-bold text-purple-900">{notifications.contractorBids}</div>
          <div className="text-xs text-purple-600">Pending bids</div>
        </div>
        
        <div className="bg-green-50 p-3 rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircleIcon className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-900">Response</span>
          </div>
          <div className="text-lg font-bold text-green-900">94%</div>
          <div className="text-xs text-green-600">Avg response rate</div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      {renderHeader()}
      
      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        {renderSidebar()}
        
        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CommunicationCenter; 