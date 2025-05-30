import React from 'react';
import NavigationSidebar from './NavigationSidebar';
import StatusBadge from '../ui/StatusBadge';

/**
 * Main dashboard content component
 * @param {Object} props - Component props
 * @param {Object} props.data - Dashboard data including stats, requests, and tabs
 * @param {string} props.activeTab - ID of the active tab
 * @param {Function} props.onTabChange - Function called when tab changes
 */
const DashboardContent = ({ data, activeTab, onTabChange }) => {
  // Priority styling
  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase() || '';
    
    switch (priorityLower) {
      case 'high':
        return 'text-red-600';
      case 'medium':
        return 'text-primary';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="flex h-full max-h-96 overflow-hidden">
      {/* Sidebar */}
      <div className="w-1/4 flex-shrink-0">
        <NavigationSidebar 
          tabs={data.tabs} 
          activeTab={activeTab} 
          onTabChange={onTabChange}
          role={data.role}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 bg-white overflow-hidden">
        <div className="p-4 h-full overflow-y-auto">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">Dashboard</h2>
              
              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                {data.stats.map((stat, index) => (
                  <div key={index} className="bg-primary-50 p-3 rounded-lg">
                    <div className="text-xs text-gray-600">{stat.label}</div>
                    <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                    <div className="text-xs text-primary">{stat.change}</div>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {data.role === 'Contractor' ? 'Available Jobs' : 'Recent Activity'}
                </h3>
                <div className="space-y-2">
                  {data.requests.slice(0, 2).map((request) => (
                    <div 
                      key={request.id} 
                      className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {request.title}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.unit} • {request.time}
                          </div>
                        </div>
                        <StatusBadge status={request.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Other Tabs */}
          {activeTab !== 'dashboard' && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-gray-900">
                {data.tabs.find(tab => tab.id === activeTab)?.label}
              </h2>
              
              <div className="space-y-2">
                {data.requests.map((request) => (
                  <div 
                    key={request.id} 
                    className="border border-gray-200 rounded-lg p-3 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.title}
                        </div>
                        <div className="text-xs text-gray-500">
                          {request.unit} • {request.time}
                        </div>
                        <span className={`text-xs ${getPriorityColor(request.priority)}`}>
                          {request.priority} Priority
                        </span>
                      </div>
                      <div className="flex flex-col items-end space-y-1">
                        <StatusBadge status={request.status} />
                        {data.role === 'Contractor' && (
                          <button 
                            className="text-xs bg-primary text-white px-2 py-1 rounded hover:bg-primary-dark transition-colors"
                            aria-label={`Accept job: ${request.title}`}
                          >
                            Accept
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Activity Indicator */}
      <div className="absolute top-12 right-4 flex items-center bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
        <span className="text-xs text-gray-600">Live</span>
      </div>

      {/* AI Badge */}
      <div className="absolute top-12 left-4 bg-primary/90 backdrop-blur-sm text-white px-2 py-1 rounded-full flex items-center">
        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-xs font-medium">AI-Powered</span>
      </div>
    </div>
  );
};

export default DashboardContent; 