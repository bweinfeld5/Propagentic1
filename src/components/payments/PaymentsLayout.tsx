import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  BanknotesIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  ClockIcon,
  ChartBarIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';

interface PaymentsLayoutProps {
  children: React.ReactNode;
  userRole: 'landlord' | 'contractor';
  initialTab?: string;
}

const PaymentsLayout: React.FC<PaymentsLayoutProps> = ({
  children,
  userRole,
  initialTab = 'overview'
}) => {
  const { currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);

  const landlordTabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: ChartBarIcon,
      description: 'Payment dashboard and summary'
    },
    {
      id: 'escrow',
      label: 'Escrow Accounts',
      icon: BanknotesIcon,
      description: 'Manage escrow accounts and releases'
    },
    {
      id: 'disputes',
      label: 'Disputes',
      icon: ExclamationTriangleIcon,
      description: 'Handle payment disputes'
    },
    {
      id: 'payment-methods',
      label: 'Payment Methods',
      icon: CreditCardIcon,
      description: 'Manage cards and bank accounts'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Cog6ToothIcon,
      description: 'Payment preferences and configuration'
    }
  ];

  const contractorTabs = [
    {
      id: 'overview',
      label: 'Overview',
      icon: ChartBarIcon,
      description: 'Payment dashboard and earnings'
    },
    {
      id: 'escrow',
      label: 'Escrow & Releases',
      icon: BanknotesIcon,
      description: 'View escrow status and request releases'
    },
    {
      id: 'disputes',
      label: 'Disputes',
      icon: ExclamationTriangleIcon,
      description: 'Manage payment disputes'
    },
    {
      id: 'payment-methods',
      label: 'Payment Methods',
      icon: CreditCardIcon,
      description: 'Manage payout methods'
    }
  ];

  const tabs = userRole === 'landlord' ? landlordTabs : contractorTabs;

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // In a real implementation, this would trigger navigation
    // For now, we'll just update the active state
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {userRole === 'landlord' ? 'Payment Management' : 'Payments & Earnings'}
                </h1>
                <p className="mt-2 text-gray-600">
                  {userRole === 'landlord' 
                    ? 'Manage escrow accounts, releases, and payment disputes'
                    : 'Track earnings, request releases, and manage payment methods'
                  }
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Logged in as</div>
                  <div className="font-medium text-gray-900">
                    {currentUser?.displayName || currentUser?.email}
                  </div>
                  <div className="text-sm text-gray-500 capitalize">{userRole}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8" aria-label="Tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon
                    className={`-ml-0.5 mr-2 h-5 w-5 transition-colors ${
                      isActive ? 'text-blue-500' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                    aria-hidden="true"
                  />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Content Hint */}
        <div className="mb-6">
          <div className="text-sm text-gray-600">
            {tabs.find(t => t.id === activeTab)?.description}
          </div>
        </div>

        {/* Content Area */}
        <div className="space-y-6">
          {children}
        </div>
      </main>

      {/* Quick Actions Sidebar (Optional) */}
      <div className="fixed bottom-6 right-6">
        <div className="flex flex-col gap-3">
          {userRole === 'contractor' && (
            <button className="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors">
              <ClockIcon className="w-6 h-6" />
              <span className="sr-only">Request Release</span>
            </button>
          )}
          
          {userRole === 'landlord' && (
            <button className="p-3 bg-green-600 text-white rounded-full shadow-lg hover:bg-green-700 transition-colors">
              <BanknotesIcon className="w-6 h-6" />
              <span className="sr-only">Create Escrow</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentsLayout; 