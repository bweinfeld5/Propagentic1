import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import StatusPill from '../components/ui/StatusPill';

const DemoPage = () => {
  const [activeView, setActiveView] = useState('landlord');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeSidebar, setActiveSidebar] = useState(true);
  
  // Sample data
  const properties = [
    { id: 1, name: 'Sunset Apartments', units: 24, occupancyRate: 92 },
    { id: 2, name: 'Riverwood Complex', units: 16, occupancyRate: 94 },
    { id: 3, name: 'Highland Residences', units: 4, occupancyRate: 75 }
  ];
  
  const maintenanceRequests = [
    { id: 101, title: 'Leaking faucet in Unit 101', unit: 'Unit 101', property: 'Sunset Apartments', timeAgo: '2 hours ago', status: 'New', priority: 'Medium' },
    { id: 102, title: 'Broken thermostat', unit: 'Unit 205', property: 'Sunset Apartments', timeAgo: '5 hours ago', status: 'Assigned', priority: 'High' },
    { id: 103, title: 'Light fixture not working', unit: 'Unit 302', property: 'Riverwood Complex', timeAgo: '1 day ago', status: 'In Progress', priority: 'Low' },
    { id: 104, title: 'Refrigerator not cooling', unit: 'Unit 103', property: 'Sunset Apartments', timeAgo: '2 days ago', status: 'Completed', priority: 'High' }
  ];
  
  return (
    <div className="min-h-screen bg-gray-100 dark:bg-propagentic-slate-dark">
      {/* Header with browser-like UI */}
      <div className="bg-gray-800 text-white p-3 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
          <div className="ml-4 text-lg font-medium">PropAgentic Demo</div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1 bg-teal-500 rounded-full text-sm">AI-Powered</div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setActiveView('landlord')} 
              className={`px-3 py-1 rounded ${activeView === 'landlord' ? 'bg-white text-gray-800' : 'text-gray-300 hover:text-white'}`}
            >
              Landlord View
            </button>
            <button 
              onClick={() => setActiveView('tenant')} 
              className={`px-3 py-1 rounded ${activeView === 'tenant' ? 'bg-white text-gray-800' : 'text-gray-300 hover:text-white'}`}
            >
              Tenant View
            </button>
          </div>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex h-screen">
        {/* Sidebar */}
        <div className={`${activeSidebar ? 'w-64' : 'w-20'} bg-white dark:bg-propagentic-slate transition-all duration-300 shadow-md flex flex-col`}>
          <div className="p-4 flex items-center border-b border-gray-200 dark:border-gray-700">
            <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
              {activeSidebar ? 'P' : ''}
            </div>
            {activeSidebar && (
              <div className="ml-4 overflow-hidden">
                <div className="font-bold truncate">PropAgentic Demo</div>
                <div className="text-sm text-gray-600 dark:text-gray-400 truncate">{activeView === 'landlord' ? 'Landlord' : 'Tenant'}</div>
              </div>
            )}
          </div>
          
          <button 
            className="absolute left-64 top-20 bg-white dark:bg-propagentic-slate p-1 rounded-r-md border border-l-0 border-gray-200 dark:border-gray-700"
            onClick={() => setActiveSidebar(!activeSidebar)}
          >
            <svg className="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {activeSidebar ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
              )}
            </svg>
          </button>
          
          <nav className="flex-1 py-4">
            <ul className="space-y-1">
              <li>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className={`flex items-center w-full px-4 py-3 ${
                    activeTab === 'dashboard' 
                      ? 'bg-teal-500 text-white' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-propagentic-slate-dark'
                  } ${!activeSidebar && 'justify-center'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"></path>
                  </svg>
                  {activeSidebar && <span className="ml-3">Dashboard</span>}
                </button>
              </li>
              <li>
                <button
                  onClick={() => setActiveTab('maintenance')}
                  className={`flex items-center w-full px-4 py-3 ${
                    activeTab === 'maintenance' 
                      ? 'bg-teal-500 text-white' 
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-propagentic-slate-dark'
                  } ${!activeSidebar && 'justify-center'}`}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                  {activeSidebar && <span className="ml-3">Maintenance</span>}
                </button>
              </li>
              {activeView === 'landlord' && (
                <li>
                  <button
                    onClick={() => setActiveTab('properties')}
                    className={`flex items-center w-full px-4 py-3 ${
                      activeTab === 'properties' 
                        ? 'bg-teal-500 text-white' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-propagentic-slate-dark'
                    } ${!activeSidebar && 'justify-center'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                    </svg>
                    {activeSidebar && <span className="ml-3">Properties</span>}
                  </button>
                </li>
              )}
              {activeView === 'tenant' && (
                <li>
                  <button
                    onClick={() => setActiveTab('payments')}
                    className={`flex items-center w-full px-4 py-3 ${
                      activeTab === 'payments' 
                        ? 'bg-teal-500 text-white' 
                        : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-propagentic-slate-dark'
                    } ${!activeSidebar && 'justify-center'}`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {activeSidebar && <span className="ml-3">Payments</span>}
                  </button>
                </li>
              )}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            {activeSidebar ? (
              <div className="flex items-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <div className="text-sm font-medium">Demo User</div>
                  <div className="text-xs text-gray-500">demo@propagentic.com</div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <div className={`flex-1 p-6 overflow-auto ${activeSidebar ? 'ml-64' : 'ml-20'} transition-all duration-300`}>
          {activeTab === 'dashboard' && (
            <>
              <h1 className="text-2xl font-bold mb-6">Dashboard</h1>
              
              {/* Stats cards */}
              {activeView === 'landlord' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="bg-white dark:bg-propagentic-slate p-6 rounded-lg shadow">
                    <div className="text-gray-600 dark:text-gray-400">Total Properties</div>
                    <div className="text-5xl font-bold mt-2">3</div>
                  </div>
                  <div className="bg-white dark:bg-propagentic-slate p-6 rounded-lg shadow">
                    <div className="text-gray-600 dark:text-gray-400">Total Units</div>
                    <div className="text-5xl font-bold mt-2">44</div>
                  </div>
                  <div className="bg-white dark:bg-propagentic-slate p-6 rounded-lg shadow">
                    <div className="text-gray-600 dark:text-gray-400">Occupancy Rate</div>
                    <div className="text-5xl font-bold mt-2">91%</div>
                  </div>
                </div>
              )}
              
              {activeView === 'tenant' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white dark:bg-propagentic-slate p-6 rounded-lg shadow">
                    <div className="text-gray-600 dark:text-gray-400">Next Rent Payment</div>
                    <div className="text-3xl font-bold mt-2">May 1, 2023</div>
                    <div className="text-gray-500 dark:text-gray-400 mt-1">$1,450.00</div>
                  </div>
                  <div className="bg-white dark:bg-propagentic-slate p-6 rounded-lg shadow">
                    <div className="text-gray-600 dark:text-gray-400">Lease Ends</div>
                    <div className="text-3xl font-bold mt-2">Oct 31, 2023</div>
                    <div className="text-gray-500 dark:text-gray-400 mt-1">180 days remaining</div>
                  </div>
                </div>
              )}
              
              {/* Recent maintenance requests */}
              <h2 className="text-xl font-bold mb-4">
                {activeView === 'landlord' ? 'Recent Maintenance Requests' : 'My Maintenance Requests'}
              </h2>
              <div className="bg-white dark:bg-propagentic-slate rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 text-gray-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"></path>
                    </svg>
                    <span className="font-medium">Filter</span>
                  </div>
                  <button className="px-4 py-2 bg-propagentic-teal text-white rounded hover:bg-teal-600 transition-colors">
                    {activeView === 'landlord' ? 'View All Requests' : 'New Request'}
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-propagentic-slate-dark">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Issue</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Submitted</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-propagentic-slate divide-y divide-gray-200 dark:divide-gray-700">
                      {maintenanceRequests.filter(req => activeView === 'tenant' ? (req.unit === 'Unit 101') : true).map((request) => (
                        <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-propagentic-slate-dark">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">{request.title}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">ID: REQ-{request.id}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-white">{request.unit}</div>
                            {activeView === 'landlord' && (
                              <div className="text-sm text-gray-500 dark:text-gray-400">{request.property}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{request.timeAgo}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusPill status={request.status} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              request.priority === 'High' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' :
                              request.priority === 'Medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                              'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                            }`}>
                              {request.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-propagentic-teal hover:text-teal-600 dark:hover:text-teal-400">
                              {activeView === 'landlord' ? 'Manage' : 'View Details'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
          
          {activeTab === 'maintenance' && (
            <>
              <h1 className="text-2xl font-bold mb-6">Maintenance</h1>
              <div className="bg-white dark:bg-propagentic-slate p-6 rounded-lg shadow mb-6">
                <p className="text-gray-700 dark:text-gray-300">
                  {activeView === 'landlord' 
                    ? 'Manage all maintenance requests across your properties. Create, assign, and track the status of each request.'
                    : 'Create and track maintenance requests for your unit. Get updates on the status of your requests.'
                  }
                </p>
              </div>
              
              {/* Maintenance content would go here */}
              <div className="bg-propagentic-neutral-light dark:bg-propagentic-slate-dark p-8 rounded-lg text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">This is a demo view</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">The maintenance management interface would appear here in the full application.</p>
                <button className="px-4 py-2 bg-propagentic-teal text-white rounded hover:bg-teal-600 transition-colors">
                  {activeView === 'landlord' ? 'Create New Ticket' : 'Submit Request'}
                </button>
              </div>
            </>
          )}
          
          {activeTab === 'properties' && activeView === 'landlord' && (
            <>
              <h1 className="text-2xl font-bold mb-6">Properties</h1>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {properties.map(property => (
                  <div key={property.id} className="bg-white dark:bg-propagentic-slate rounded-lg shadow overflow-hidden">
                    <div className="h-40 bg-propagentic-neutral-light dark:bg-propagentic-slate-dark flex items-center justify-center">
                      <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
                      </svg>
                    </div>
                    <div className="p-4">
                      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{property.name}</h3>
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-3">
                        <span>{property.units} Units</span>
                        <span>{property.occupancyRate}% Occupied</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-4">
                        <div className="bg-propagentic-teal h-2.5 rounded-full" style={{ width: `${property.occupancyRate}%` }}></div>
                      </div>
                      <button className="w-full py-2 bg-propagentic-teal text-white rounded hover:bg-teal-600 transition-colors">
                        Manage Property
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex justify-center">
                <button className="px-6 py-3 bg-white dark:bg-propagentic-slate text-propagentic-teal border border-propagentic-teal rounded-lg hover:bg-propagentic-neutral-light transition-colors flex items-center">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                  </svg>
                  Add New Property
                </button>
              </div>
            </>
          )}
          
          {activeTab === 'payments' && activeView === 'tenant' && (
            <>
              <h1 className="text-2xl font-bold mb-6">Payments</h1>
              
              <div className="bg-white dark:bg-propagentic-slate rounded-lg shadow overflow-hidden mb-8">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Upcoming Payments</h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
                    <div>
                      <div className="text-lg font-medium text-gray-900 dark:text-white">Next Rent Payment</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">May 1, 2023 (Due in 12 days)</div>
                    </div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">$1,450.00</div>
                  </div>
                  <button className="w-full py-3 bg-propagentic-teal text-white rounded-lg hover:bg-teal-600 transition-colors">
                    Make Payment
                  </button>
                </div>
              </div>
              
              <div className="bg-white dark:bg-propagentic-slate rounded-lg shadow overflow-hidden">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-lg font-medium text-gray-900 dark:text-white">Payment History</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-propagentic-slate-dark">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Apr 1, 2023</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Monthly Rent</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">$1,450.00</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Paid
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Mar 1, 2023</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Monthly Rent</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">$1,450.00</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Paid
                          </span>
                        </td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Feb 1, 2023</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">Monthly Rent</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">$1,450.00</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                            Paid
                          </span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Demo footer */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 p-4 shadow-md flex justify-between items-center">
        <div className="text-sm text-gray-600 dark:text-gray-400">
          This is a demo of the PropAgentic dashboard. The actual product may vary.
        </div>
        <div className="flex space-x-4">
          <Link to="/new" className="text-propagentic-teal hover:text-teal-600 dark:hover:text-teal-400">
            Back to Landing Page
          </Link>
          <Link to="/pricing" className="px-4 py-2 bg-propagentic-teal text-white rounded hover:bg-teal-600 transition-colors">
            View Pricing
          </Link>
        </div>
      </div>
    </div>
  );
};

export default DemoPage; 