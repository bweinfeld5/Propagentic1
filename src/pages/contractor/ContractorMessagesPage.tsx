import React from 'react';
import { useAuth } from '../../context/AuthContext';
import MessagingInterface from '../../components/messaging/MessagingInterface';
import StartConversationButton from '../../components/messaging/StartConversationButton';
import {
  ChatBubbleLeftRightIcon,
  UserGroupIcon,
  BuildingOfficeIcon,
  ArrowLeftIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

const ContractorMessagesPage: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/contractor/dashboard')}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title="Back to Dashboard"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                  <ChatBubbleLeftRightIcon className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                  <p className="text-sm text-gray-600">
                    Communicate with landlords and property managers
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-sm text-gray-600">
                Logged in as <span className="font-medium">{currentUser?.email}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Quick Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              
              <div className="space-y-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <BuildingOfficeIcon className="w-6 h-6 text-blue-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Message Landlord</h3>
                      <p className="text-sm text-gray-600">Start a conversation with a property owner</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Use the message button next to landlords in job listings or property details to start conversations.
                  </p>
                  <button 
                    className="w-full px-4 py-2 bg-gray-300 text-gray-500 text-sm font-medium rounded-lg cursor-not-allowed"
                    disabled
                  >
                    Browse Jobs to Message Landlords
                  </button>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <UserGroupIcon className="w-6 h-6 text-green-600" />
                    <div>
                      <h3 className="font-medium text-gray-900">Support</h3>
                      <p className="text-sm text-gray-600">Need help with the platform?</p>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mb-3">
                    Contact our support team for assistance with jobs, payments, or technical issues.
                  </p>
                  <button className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors">
                    Contact Support
                  </button>
                </div>
              </div>

              {/* Messaging Tips */}
              <div className="mt-6 bg-orange-50 rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">💡 Messaging Tips</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Be professional and clear</li>
                  <li>• Include property details</li>
                  <li>• Respond promptly to messages</li>
                  <li>• Use photos when helpful</li>
                  <li>• Ask clarifying questions</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Messaging Interface */}
          <div className="lg:col-span-3">
            <MessagingInterface
              height="h-[700px]"
              showHeader={false}
              showNewConversationButton={false}
              fullWidth={true}
            />
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">How to Start Conversations</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Browse Jobs</h3>
              <p className="text-sm text-gray-600">
                Visit the jobs section and find opportunities that interest you.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl font-bold text-orange-600">2</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Message Landlord</h3>
              <p className="text-sm text-gray-600">
                Click the message button next to landlord details to start a conversation.
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg mx-auto mb-3 flex items-center justify-center">
                <span className="text-xl font-bold text-green-600">3</span>
              </div>
              <h3 className="font-medium text-gray-900 mb-2">Discuss Details</h3>
              <p className="text-sm text-gray-600">
                Communicate about job requirements, timelines, and pricing.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContractorMessagesPage; 