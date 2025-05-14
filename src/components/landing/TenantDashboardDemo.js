import React, { useState } from 'react';

const TenantDashboardDemo = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Sample maintenance requests data
  const requests = [
    {
      id: 'req-001',
      title: 'Leaking faucet in bathroom',
      category: 'plumbing',
      urgency: 'medium',
      status: 'new',
      createdAt: '2 hours ago',
      description: 'The bathroom sink faucet is constantly dripping, wasting water and making noise at night.',
      photos: 1
    },
    {
      id: 'req-002',
      title: 'Broken thermostat',
      category: 'hvac',
      urgency: 'high',
      status: 'assigned',
      createdAt: '5 hours ago',
      description: 'The thermostat is completely non-responsive. The temperature inside is getting very uncomfortable.',
      assignedTo: 'Michael T.',
      scheduledFor: 'Today, 3-5 PM',
      photos: 2
    },
    {
      id: 'req-003',
      title: 'Ceiling light fixture flickering',
      category: 'electrical',
      urgency: 'low',
      status: 'completed',
      createdAt: '1 week ago',
      completedAt: '5 days ago',
      description: 'The overhead light in the living room flickers intermittently, especially when first turned on.',
      completedBy: 'Robert E.',
      photos: 1
    }
  ];
  
  // Get status badge styling based on status
  const getStatusBadge = (status) => {
    switch(status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'scheduled':
        return 'bg-orange-100 text-orange-800';  
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Get status display text
  const getStatusText = (status) => {
    switch(status) {
      case 'new':
        return 'New';
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'scheduled':
        return 'Scheduled';
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };
  
  return (
    <div className="bg-white shadow rounded-lg border border-gray-200 overflow-hidden">
      {/* Dashboard header */}
      <div className="bg-propagentic-neutral dark:bg-propagentic-neutral-dark h-8 flex items-center px-4">
        <div className="flex space-x-2">
          <div className="h-3 w-3 rounded-full bg-red-500"></div>
          <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
          <div className="h-3 w-3 rounded-full bg-green-500"></div>
        </div>
        <div className="mx-auto text-xs text-propagentic-neutral-dark dark:text-propagentic-neutral-light font-medium">
          Tenant Dashboard
        </div>
      </div>
      
      {/* Dashboard content */}
      <div className="flex">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-1/4 bg-propagentic-neutral-light dark:bg-propagentic-neutral border-r border-gray-200 p-4">
            <div className="flex items-center mb-6">
              <div className="h-8 w-8 rounded-full bg-propagentic-teal text-white flex items-center justify-center text-sm font-bold">P</div>
              <div className="ml-2">
                <div className="text-sm font-medium">Propagentic Demo</div>
                <div className="text-xs text-gray-500">Tenant</div>
              </div>
            </div>
            
            <nav className="space-y-1">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === 'dashboard' ? 'bg-propagentic-teal text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Dashboard
              </button>
              <button 
                onClick={() => setActiveTab('new_request')}
                className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === 'new_request' ? 'bg-propagentic-teal text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                New Request
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === 'history' ? 'bg-propagentic-teal text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Request History
              </button>
              <button 
                onClick={() => setActiveTab('profile')}
                className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === 'profile' ? 'bg-propagentic-teal text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </button>
            </nav>
          </div>
        )}
        
        {/* Main content */}
        <div className={`${sidebarOpen ? 'w-3/4' : 'w-full'} bg-white dark:bg-propagentic-neutral-dark p-4`}>
          {/* Toggle sidebar button */}
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="mb-4 text-sm text-propagentic-teal flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
            {sidebarOpen ? 'Hide Sidebar' : 'Show Sidebar'}
          </button>
          
          {/* Dashboard view */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Dashboard</h2>
              
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-propagentic-neutral-light p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Active Requests</div>
                  <div className="text-2xl font-bold">2</div>
                </div>
                <div className="bg-propagentic-neutral-light p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Scheduled Visits</div>
                  <div className="text-2xl font-bold">1</div>
                </div>
                <div className="bg-propagentic-neutral-light p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Completed This Month</div>
                  <div className="text-2xl font-bold">3</div>
                </div>
              </div>
              
              <h3 className="text-md font-bold mb-2">Recent Maintenance Requests</h3>
              <div className="space-y-3">
                {requests.slice(0, 2).map(request => (
                  <div 
                    key={request.id}
                    className="border border-gray-200 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                        <h4 className="text-sm font-medium mt-1">{request.title}</h4>
                        <div className="mt-1 text-xs text-gray-500">
                          Submitted {request.createdAt}
                          {request.scheduledFor && ` • Scheduled for ${request.scheduledFor}`}
                        </div>
                      </div>
                      <div>
                        <button className="text-propagentic-teal text-xs hover:underline">
                          View Details
                        </button>
                      </div>
                    </div>
                    {request.status === 'assigned' && (
                      <div className="mt-2 text-xs bg-yellow-50 p-2 rounded">
                        <span className="font-medium">Update:</span> Contractor {request.assignedTo} will arrive {request.scheduledFor.toLowerCase()}.
                      </div>
                    )}
                  </div>
                ))}
              </div>
              
              <div className="mt-6">
                <button
                  onClick={() => setActiveTab('new_request')}
                  className="bg-propagentic-teal text-white px-4 py-2 rounded text-sm font-medium hover:bg-propagentic-teal-dark"
                >
                  Submit New Request
                </button>
              </div>
            </div>
          )}
          
          {/* New Request form */}
          {activeTab === 'new_request' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Submit Maintenance Request</h2>
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Issue Title</label>
                  <input
                    type="text"
                    placeholder="Brief description of the issue"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                      <option>Select category</option>
                      <option>Plumbing</option>
                      <option>Electrical</option>
                      <option>HVAC</option>
                      <option>Appliance</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select className="w-full p-2 border border-gray-300 rounded-md shadow-sm">
                      <option>Normal</option>
                      <option>Urgent</option>
                      <option>Emergency</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    placeholder="Please provide details about the issue"
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm h-24"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Upload Photos</label>
                  <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                    <div className="flex justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <p className="text-sm text-gray-500 mt-2">Drag and drop photos or click to upload</p>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    className="bg-propagentic-teal text-white px-4 py-2 rounded text-sm font-medium hover:bg-propagentic-teal-dark"
                  >
                    Submit Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="border border-gray-300 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* History view */}
          {activeTab === 'history' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Request History</h2>
                <div className="flex space-x-2">
                  <select className="text-xs border rounded p-1">
                    <option>All Statuses</option>
                    <option>Active</option>
                    <option>Completed</option>
                  </select>
                  <select className="text-xs border rounded p-1">
                    <option>Sort: Newest</option>
                    <option>Oldest</option>
                  </select>
                </div>
              </div>
              
              <div className="space-y-3">
                {requests.map(request => (
                  <div 
                    key={request.id}
                    className="border border-gray-200 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(request.status)}`}>
                          {getStatusText(request.status)}
                        </span>
                        <h4 className="text-sm font-medium mt-1">{request.title}</h4>
                        <div className="mt-1 text-xs text-gray-500">
                          Submitted {request.createdAt}
                          {request.completedAt && ` • Completed ${request.completedAt}`}
                        </div>
                      </div>
                      <div className="flex items-start">
                        {request.photos > 0 && (
                          <div className="text-xs text-gray-500 mr-3">
                            <span className="flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {request.photos}
                            </span>
                          </div>
                        )}
                        <button className="text-propagentic-teal text-xs hover:underline">
                          View Details
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* AI badge */}
      <div className="absolute top-3 right-3 bg-propagentic-teal-light text-white text-xs px-2 py-1 rounded-full flex items-center">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        AI-Powered
      </div>
    </div>
  );
};

export default TenantDashboardDemo; 