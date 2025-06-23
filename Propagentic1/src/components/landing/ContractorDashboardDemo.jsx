import React, { useState } from 'react';

const ContractorDashboardDemo = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Sample jobs data
  const jobs = [
    {
      id: 'job-001',
      property: 'Maple Gardens',
      unitNumber: '101',
      title: 'Leaking faucet repair',
      category: 'plumbing',
      urgency: 'medium',
      status: 'new',
      createdAt: '2 hours ago',
      description: 'The bathroom sink faucet is constantly dripping, wasting water and making noise at night.',
      compensation: '$85',
      timeEstimate: '1-2 hours',
      distance: '3.5 miles'
    },
    {
      id: 'job-002',
      property: 'Pine View Apartments',
      unitNumber: '205',
      title: 'Broken thermostat replacement',
      category: 'hvac',
      urgency: 'high',
      status: 'assigned',
      createdAt: '5 hours ago',
      description: 'The thermostat is completely non-responsive. The temperature inside is getting very uncomfortable.',
      compensation: '$120',
      timeEstimate: '1 hour',
      distance: '1.8 miles'
    },
    {
      id: 'job-003',
      property: 'Oakwood Residences',
      unitNumber: '304',
      title: 'Light fixture installation',
      category: 'electrical',
      status: 'in_progress',
      createdAt: '1 day ago',
      description: 'The overhead light in the living room needs replacement.',
      compensation: '$95',
      timeEstimate: '1-2 hours',
      distance: '4.2 miles'
    }
  ];
  
  // Get status badge styling
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
  
  // Format status display text
  const getStatusText = (status) => {
    return status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ');
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
          Contractor Dashboard
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
                <div className="text-xs text-gray-500">Contractor</div>
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
                onClick={() => setActiveTab('jobs')}
                className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === 'jobs' ? 'bg-propagentic-teal text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                Job Board
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === 'history' ? 'bg-propagentic-teal text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Job History
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
          
          {/* Dashboard statistics */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Dashboard</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-propagentic-neutral-light p-4 rounded-lg">
                  <div className="text-sm text-gray-500">New Jobs</div>
                  <div className="text-2xl font-bold">2</div>
                </div>
                <div className="bg-propagentic-neutral-light p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Active Jobs</div>
                  <div className="text-2xl font-bold">1</div>
                </div>
                <div className="bg-propagentic-neutral-light p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Completed This Month</div>
                  <div className="text-2xl font-bold">8</div>
                </div>
              </div>
              <h3 className="text-md font-bold mb-2">Available Jobs Nearby</h3>
              <div className="space-y-3">
                {jobs.filter(job => job.status === 'new' || job.status === 'assigned').map(job => (
                  <div 
                    key={job.id}
                    className="border border-gray-200 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                          {getStatusText(job.status)}
                        </span>
                        <h4 className="text-sm font-medium mt-1">{job.title}</h4>
                        <div className="mt-1 text-xs text-gray-500">
                          {job.property} • Unit {job.unitNumber} • {job.distance} away
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center">
                        <div className="text-xs text-gray-700 mr-2">
                          <span className="font-medium text-propagentic-teal">{job.compensation}</span>
                          <span className="mx-1">•</span>
                          <span>{job.timeEstimate}</span>
                        </div>
                        <button className="bg-propagentic-teal text-white text-xs py-1 px-3 rounded hover:bg-propagentic-teal-dark">
                          {job.status === 'new' ? 'Accept' : 'View'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex justify-center">
                <button className="text-propagentic-teal text-sm font-medium hover:underline">
                  View All Jobs
                </button>
              </div>
            </div>
          )}
          
          {/* Job board tab */}
          {activeTab === 'jobs' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Job Board</h2>
                <div className="flex space-x-2">
                  <select className="text-xs border rounded p-1">
                    <option>All Categories</option>
                    <option>Plumbing</option>
                    <option>Electrical</option>
                    <option>HVAC</option>
                  </select>
                  <select className="text-xs border rounded p-1">
                    <option>Sort: Newest</option>
                    <option>Distance</option>
                    <option>Payment</option>
                  </select>
                </div>
              </div>
              <div className="space-y-3">
                {jobs.map(job => (
                  <div 
                    key={job.id}
                    className="border border-gray-200 p-3 rounded-md hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadge(job.status)}`}>
                          {getStatusText(job.status)}
                        </span>
                        <h4 className="text-sm font-medium mt-1">{job.title}</h4>
                        <div className="mt-1 text-xs text-gray-500">
                          {job.property} • Unit {job.unitNumber} • {job.distance} away
                        </div>
                      </div>
                      <div className="mt-2 sm:mt-0 flex items-center">
                        <div className="text-xs text-gray-700 mr-2">
                          <span className="font-medium text-propagentic-teal">{job.compensation}</span>
                          <span className="mx-1">•</span>
                          <span>{job.timeEstimate}</span>
                        </div>
                        <button className="bg-propagentic-teal text-white text-xs py-1 px-3 rounded hover:bg-propagentic-teal-dark">
                          {job.status === 'new' ? 'Accept' : 'View'}
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

export default ContractorDashboardDemo; 