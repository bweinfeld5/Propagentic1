import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, updateDoc, setDoc, getFirestore, runTransaction, increment, limit, startAfter } from 'firebase/firestore';
import { db, auth, callFunction } from '../../firebase/config';
import TenantRequestForm from './TenantRequestForm';
import NotificationPreferences from '../notifications/NotificationPreferences';

// FeedbackForm moved to a separate file for better organization
import FeedbackForm from '../maintenance/FeedbackForm';

const ITEMS_PER_PAGE = 5; // Number of tickets to load per page

const TenantDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showTicketForm, setShowTicketForm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  // Pagination state
  const [lastVisible, setLastVisible] = useState(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  // Refs to store unsubscribe functions
  const unsubscribeRefs = useRef({});
  // Filter state
  const [statusFilter, setStatusFilter] = useState('all');
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    const tenantId = currentUser.uid;
    
    // Fetch properties where this tenant is assigned
    const fetchProperties = async () => {
      try {
        // Query properties where tenants array contains this tenant's ID
        // Add limit to prevent excessive data fetching
        const propertiesRef = collection(db, 'properties');
        const propertyQuery = query(
          propertiesRef, 
          where('tenants', 'array-contains', tenantId),
          limit(10) // Limit to 10 properties max
        );
        
        const unsubscribeProperties = onSnapshot(propertyQuery, (snapshot) => {
          const propertiesData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          setProperties(propertiesData);
          
          // Set first property as selected by default if not already selected
          if (propertiesData.length > 0 && !selectedProperty) {
            setSelectedProperty(propertiesData[0]);
          }
          
          // Clear any previous ticket subscription
          if (unsubscribeRefs.current.tickets) {
            unsubscribeRefs.current.tickets();
          }
          
          // Initialize ticket fetching
          fetchTickets(tenantId);
        }, (err) => {
          console.error('Error fetching properties:', err);
          setError('Failed to load properties');
          setLoading(false);
        });
        
        // Store unsubscribe function
        unsubscribeRefs.current.properties = unsubscribeProperties;
      } catch (err) {
        console.error('Error setting up property subscription:', err);
        setError('Failed to load properties');
        setLoading(false);
      }
    };
    
    const fetchTickets = (tenantId) => {
      // Build query based on status filter
      let ticketsQuery;
      const ticketsRef = collection(db, 'tickets');
      
      if (statusFilter !== 'all') {
        ticketsQuery = query(
          ticketsRef,
          where('tenantId', '==', tenantId),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        ticketsQuery = query(
          ticketsRef,
          where('tenantId', '==', tenantId),
          orderBy('createdAt', 'desc'),
          limit(ITEMS_PER_PAGE)
        );
      }
      
      const unsubscribeTickets = onSnapshot(ticketsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const ticketsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate() || new Date()
          }));
          
          setTickets(ticketsData);
          // Store the last document for pagination
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setHasMore(snapshot.docs.length >= ITEMS_PER_PAGE);
        } else {
          setTickets([]);
          setHasMore(false);
        }
        setLoading(false);
      }, (err) => {
        console.error('Error fetching tickets:', err);
        setError('Failed to load maintenance tickets');
        setLoading(false);
      });
      
      // Store unsubscribe function
      unsubscribeRefs.current.tickets = unsubscribeTickets;
    };
    
    fetchProperties();
    
    // Cleanup function to unsubscribe from all listeners when component unmounts
    return () => {
      Object.values(unsubscribeRefs.current).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [selectedProperty, statusFilter]);

  // Function to load more tickets
  const loadMoreTickets = async () => {
    if (!lastVisible || loadingMore || !hasMore) return;
    
    setLoadingMore(true);
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    try {
      const tenantId = currentUser.uid;
      const ticketsRef = collection(db, 'tickets');
      
      // Build query based on status filter
      let nextQuery;
      if (statusFilter !== 'all') {
        nextQuery = query(
          ticketsRef,
          where('tenantId', '==', tenantId),
          where('status', '==', statusFilter),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        );
      } else {
        nextQuery = query(
          ticketsRef,
          where('tenantId', '==', tenantId),
          orderBy('createdAt', 'desc'),
          startAfter(lastVisible),
          limit(ITEMS_PER_PAGE)
        );
      }
      
      const snapshot = await getDocs(nextQuery);
      
      if (!snapshot.empty) {
        const newTickets = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate() || new Date(),
          updatedAt: doc.data().updatedAt?.toDate() || new Date()
        }));
        
        setTickets(currentTickets => [...currentTickets, ...newTickets]);
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= ITEMS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more tickets:', err);
      setError('Failed to load more tickets');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleCreateTicket = () => {
    if (!selectedProperty) {
      setError('Please select a property first');
      return;
    }
    
    setShowTicketForm(true);
  };

  const handleProvideFeedback = (ticket) => {
    setSelectedTicket(ticket);
    setShowFeedbackForm(true);
  };

  const renderTicketStatus = (status) => {
    const statusMap = {
      pending_classification: { color: 'gray', text: 'Pending Classification' },
      ready_to_dispatch: { color: 'yellow', text: 'Finding Contractor' },
      pending_acceptance: { color: 'yellow', text: 'Pending Contractor' },
      accepted: { color: 'blue', text: 'Contractor Assigned' },
      in_progress: { color: 'blue', text: 'In Progress' },
      completed: { color: 'green', text: 'Completed' },
      rejected: { color: 'red', text: 'Rejected' },
      escalated: { color: 'red', text: 'Escalated' }
    };
    
    const style = statusMap[status] || { color: 'gray', text: status?.replace(/_/g, ' ') };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium 
        ${style.color === 'yellow' ? 'bg-yellow-100 text-yellow-800' :
          style.color === 'blue' ? 'bg-blue-100 text-blue-800' :
          style.color === 'green' ? 'bg-green-100 text-green-800' :
          style.color === 'red' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'}`}
      >
        {style.text}
      </span>
    );
  };

  // Render urgency badge
  const renderUrgencyBadge = (urgency) => {
    const urgencyMap = {
      low: { color: 'green', text: 'Low' },
      normal: { color: 'blue', text: 'Normal' },
      high: { color: 'red', text: 'High' },
    };
    
    const style = urgencyMap[urgency] || { color: 'blue', text: 'Normal' };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
        ${style.color === 'green' ? 'bg-green-100 text-green-800' :
          style.color === 'blue' ? 'bg-blue-100 text-blue-800' :
          style.color === 'red' ? 'bg-red-100 text-red-800' :
          'bg-gray-100 text-gray-800'}`}
      >
        {style.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">My Dashboard</h1>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
          </svg>
          <h3 className="mt-2 text-lg font-medium text-gray-900">No Properties Assigned</h3>
          <p className="mt-1 text-sm text-gray-500">
            You haven't been assigned to any properties yet. Please contact your landlord.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Dashboard</h1>
      
      {error && (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-3">My Properties</h2>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <ul className="divide-y divide-gray-200">
              {properties.map(property => (
                <li 
                  key={property.id} 
                  className={`px-6 py-4 hover:bg-gray-50 cursor-pointer ${
                    selectedProperty?.id === property.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedProperty(property)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{property.name}</p>
                      <p className="text-xs text-gray-500">{property.address}</p>
                    </div>
                    {selectedProperty?.id === property.id && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Selected
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
      
      <div className="mb-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 gap-4">
          <h2 className="text-lg font-medium text-gray-900">Maintenance Requests</h2>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
            {/* Status filter */}
            <div className="inline-flex items-center">
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mr-2">
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              >
                <option value="all">All Tickets</option>
                <option value="pending_classification">Pending</option>
                <option value="ready_to_dispatch">Ready to Dispatch</option>
                <option value="pending_acceptance">Awaiting Contractor</option>
                <option value="accepted">Accepted</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <button
              onClick={handleCreateTicket}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full justify-center sm:w-auto"
            >
              New Request
            </button>
          </div>
        </div>
        
        {showTicketForm ? (
          <div className="mb-6">
            <TenantRequestForm 
              propertyId={selectedProperty?.id}
              propertyName={selectedProperty?.name}
            />
            <div className="mt-4 text-right">
              <button
                onClick={() => setShowTicketForm(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : showFeedbackForm && selectedTicket ? (
          <div className="mb-6">
            <FeedbackForm 
              ticketId={selectedTicket.id}
              contractorId={selectedTicket.contractorId}
              contractorName={selectedTicket.contractorName}
              onClose={() => {
                setShowFeedbackForm(false);
                setSelectedTicket(null);
              }}
            />
          </div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-6 text-center">
            <p className="text-gray-500">No maintenance requests found.</p>
            <p className="text-sm text-gray-400 mt-2">
              Click "New Request" to submit a maintenance request.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Issue
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Property
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Urgency
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th scope="col" className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {tickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {ticket.issueType?.replace('_', ' ') || 'Unknown'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{ticket.propertyName || 'Unknown'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderUrgencyBadge(ticket.urgencyLevel)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {renderTicketStatus(ticket.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {ticket.createdAt.toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {ticket.status === 'completed' && !ticket.feedback ? (
                          <button
                            onClick={() => handleProvideFeedback(ticket)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Rate Work
                          </button>
                        ) : (
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => {
                              setSelectedTicket(ticket);
                              // Open ticket details if needed
                            }}
                          >
                            View
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination controls */}
            {hasMore && (
              <div className="px-6 py-4 border-t border-gray-200">
                <button 
                  onClick={loadMoreTickets}
                  disabled={loadingMore}
                  className={`w-full sm:w-auto flex justify-center items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loadingMore ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {loadingMore ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-gray-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </>
                  ) : 'Load More'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      
      {selectedTicket && !showFeedbackForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Request Details</h3>
            <button 
              onClick={() => setSelectedTicket(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Issue Type</h4>
              <p className="mt-1 text-gray-900 capitalize">{selectedTicket.issueType?.replace('_', ' ')}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Description</h4>
              <p className="mt-1 text-gray-900">{selectedTicket.description}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Urgency</h4>
              <p className="mt-1">{renderUrgencyBadge(selectedTicket.urgencyLevel)}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <p className="mt-1">{renderTicketStatus(selectedTicket.status)}</p>
            </div>
            
            {selectedTicket.contractorName && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Assigned Contractor</h4>
                <p className="mt-1 text-gray-900">{selectedTicket.contractorName}</p>
              </div>
            )}
            
            {selectedTicket.photos?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Photos</h4>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {selectedTicket.photos.map((photo, idx) => (
                    <a 
                      key={idx} 
                      href={photo} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block"
                    >
                      <img 
                        src={photo} 
                        alt={`Ticket photo ${idx+1}`} 
                        className="h-24 w-full object-cover rounded-md"
                      />
                    </a>
                  ))}
                </div>
              </div>
            )}
            
            {selectedTicket.progressUpdates?.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Progress Updates</h4>
                <div className="mt-2 space-y-3">
                  {selectedTicket.progressUpdates.map((update, idx) => (
                    <div key={idx} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="text-sm text-gray-900">{update.message}</p>
                      <div className="flex items-center mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div 
                            className="bg-blue-600 h-2.5 rounded-full" 
                            style={{ width: `${update.progressPercent}%` }}
                          ></div>
                        </div>
                        <span className="ml-2 text-xs text-gray-500">{update.progressPercent}%</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(update.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Settings/Preferences Section */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-medium text-gray-900">Settings & Preferences</h2>
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {showSettings ? 'Hide Settings' : 'Show Settings'}
          </button>
        </div>
        
        {showSettings && (
          <div className="bg-white rounded-lg shadow">
            <NotificationPreferences />
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantDashboard; 