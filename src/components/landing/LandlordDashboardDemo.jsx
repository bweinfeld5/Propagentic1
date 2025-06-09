import React, { useState } from 'react';

const LandlordDashboardDemo = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeRequest, setActiveRequest] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Sample maintenance requests data
  const maintenanceRequests = [
    {
      id: 'req-001',
      title: 'Leaking faucet in Unit 101',
      category: 'plumbing',
      urgency: 'medium',
      unitNumber: '101',
      timestamp: '2 hours ago',
      tenant: 'Alex Johnson',
      status: 'new',
      description: 'The bathroom sink faucet is constantly dripping, wasting water and making noise at night.',
      photoUrl: 'https://www.thespruce.com/thmb/b7OzxmqPsZMmxvcCEpwL32H5cUY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-1205481506-fa5a420e6655457fb46410b7e95a0a84.jpg',
    },
    {
      id: 'req-002',
      title: 'Broken thermostat',
      category: 'hvac',
      urgency: 'high',
      unitNumber: '205',
      timestamp: '5 hours ago',
      tenant: 'Sam Williams',
      status: 'assigned',
      assignedTo: 'Michael T.',
      description: 'The thermostat is completely non-responsive. The temperature inside is getting very uncomfortable.',
      photoUrl: 'https://www.thespruce.com/thmb/XVYE5u_QUBySadlETC5t4h93jsY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/thermostat-iStock-845582664-24b0eb7136ec4ee2abd7c691c3df6e9f.jpg',
    },
    {
      id: 'req-003',
      title: 'Ceiling light fixture flickering',
      category: 'electrical',
      urgency: 'low',
      unitNumber: '304',
      timestamp: '1 day ago',
      tenant: 'Jamie Lee',
      status: 'in_progress',
      assignedTo: 'Robert E.',
      description: 'The overhead light in the living room flickers intermittently, especially when first turned on.',
      photoUrl: 'https://www.thespruce.com/thmb/8MzbY3ZRx-YUh97V3YYUkJjth9M=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/lightbulb-flicker-reasons-4161197-01-5bb3db2746e0fb0051c13a9c.jpg',
    },
  ];
  
  // Sample properties data
  const properties = [
    { id: 'prop-001', name: 'Maple Gardens', address: '123 Maple St', units: 12, occupancyRate: 92 },
    { id: 'prop-002', name: 'Pine View Apartments', address: '456 Pine Ave', units: 24, occupancyRate: 87 },
    { id: 'prop-003', name: 'Oakwood Residences', address: '789 Oak Blvd', units: 8, occupancyRate: 100 },
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
      case 'completed':
        return 'Completed';
      default:
        return 'Unknown';
    }
  };
  
  // Handle clicking on a maintenance request
  const handleRequestClick = (request) => {
    setActiveRequest(request);
  };
  
  // Close request details view
  const closeRequestDetails = () => {
    setActiveRequest(null);
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
          Landlord Dashboard
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
                <div className="text-xs text-gray-500">Landlord</div>
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
                onClick={() => setActiveTab('maintenance')}
                className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === 'maintenance' ? 'bg-propagentic-teal text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Maintenance
              </button>
              <button 
                onClick={() => setActiveTab('properties')}
                className={`w-full flex items-center px-2 py-2 text-sm font-medium rounded-md ${activeTab === 'properties' ? 'bg-propagentic-teal text-white' : 'text-gray-700 hover:bg-gray-200'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                Properties
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
          
          {/* Main content based on active tab */}
          {activeTab === 'dashboard' && (
            <div>
              <h2 className="text-lg font-bold mb-4">Dashboard</h2>
              <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-propagentic-neutral-light p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Total Properties</div>
                  <div className="text-2xl font-bold">3</div>
                </div>
                <div className="bg-propagentic-neutral-light p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Total Units</div>
                  <div className="text-2xl font-bold">44</div>
                </div>
                <div className="bg-propagentic-neutral-light p-4 rounded-lg">
                  <div className="text-sm text-gray-500">Occupancy Rate</div>
                  <div className="text-2xl font-bold">91%</div>
                </div>
              </div>
              <h3 className="text-md font-bold mb-2">Recent Maintenance Requests</h3>
              <div className="space-y-2">
                {maintenanceRequests.slice(0, 2).map(request => (
                  <div 
                    key={request.id}
                    className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleRequestClick(request)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{request.title}</div>
                        <div className="text-sm text-gray-500">Unit {request.unitNumber} • {request.timestamp}</div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                        {getStatusText(request.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {activeTab === 'maintenance' && (
            <div>
              {activeRequest ? (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Request Details</h2>
                    <button 
                      onClick={closeRequestDetails}
                      className="text-sm text-propagentic-teal flex items-center"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to list
                    </button>
                  </div>
                  <div className="bg-propagentic-neutral-light p-4 rounded-lg mb-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-md font-bold">{activeRequest.title}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(activeRequest.status)}`}>
                        {getStatusText(activeRequest.status)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 mb-2">
                      Unit {activeRequest.unitNumber} • Reported by {activeRequest.tenant} • {activeRequest.timestamp}
                    </div>
                    <div className="mb-4">
                      <div className="text-sm font-medium mb-1">Description:</div>
                      <p className="text-sm">{activeRequest.description}</p>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-1">Photo:</div>
                      <img 
                        src={activeRequest.photoUrl} 
                        alt="Maintenance issue" 
                        className="w-full max-h-48 object-cover rounded-md"
                      />
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <button className="bg-propagentic-teal text-white px-3 py-1 rounded-md text-sm">
                      Assign Contractor
                    </button>
                    <button className="border border-propagentic-teal text-propagentic-teal px-3 py-1 rounded-md text-sm">
                      View Property Details
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold">Maintenance Requests</h2>
                    <button className="bg-propagentic-teal text-white px-3 py-1 rounded-md text-sm">
                      + New Request
                    </button>
                  </div>
                  <div className="space-y-2">
                    {maintenanceRequests.map(request => (
                      <div 
                        key={request.id}
                        className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleRequestClick(request)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium">{request.title}</div>
                            <div className="text-sm text-gray-500">Unit {request.unitNumber} • {request.timestamp}</div>
                          </div>
                          <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(request.status)}`}>
                            {getStatusText(request.status)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'properties' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold">Properties</h2>
                <button className="bg-propagentic-teal text-white px-3 py-1 rounded-md text-sm">
                  + Add Property
                </button>
              </div>
              <div className="space-y-3">
                {properties.map(property => (
                  <div 
                    key={property.id}
                    className="border border-gray-200 rounded-md p-3 hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="font-medium">{property.name}</div>
                    <div className="text-sm text-gray-500">{property.address}</div>
                    <div className="flex justify-between items-center mt-2">
                      <div className="text-xs text-gray-500">
                        {property.units} units • {property.occupancyRate}% occupied
                      </div>
                      <button className="text-xs text-propagentic-teal">View Details</button>
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

export default LandlordDashboardDemo; 