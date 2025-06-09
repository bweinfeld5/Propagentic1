import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, query, where, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import RequestForm from '../components/tenant/RequestForm';
import RequestHistory from '../components/tenant/RequestHistory';
import HeaderBar from '../components/layout/HeaderBar';
import NotificationPanel from '../components/layout/NotificationPanel';
import { Toaster, toast } from 'react-hot-toast';
import { BellIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import dataService from '../services/dataService';

const TenantDashboard = () => {
  const { currentUser, userProfile } = useAuth();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [notificationPanelOpen, setNotificationPanelOpen] = useState(false);
  const [permissionError, setPermissionError] = useState(false);

  // Redirect if not a tenant or not logged in
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userProfile && userProfile.userType !== 'tenant') {
      navigate(`/${userProfile.userType}`);
    }
  }, [currentUser, userProfile, navigate]);

  // Create useEffect for configuration and initial data loading
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (userProfile) {
      // Configure data service with correct user type
      console.log('Configuring data service for tenant dashboard');
      dataService.configure({ 
        isDemoMode: false, 
        currentUser,
        userType: userProfile.userType || userProfile.role || 'tenant' // Explicitly set tenant type
      });
    }

    const fetchTickets = async () => {
      try {
        // First try to fetch tickets using getDocs instead of onSnapshot
        // This can help identify if it's a permissions issue
        const q = query(
          collection(db, 'tickets'),
          where('submittedBy', '==', currentUser.uid),
          orderBy('createdAt', 'desc')
        );
        
        await getDocs(q);
        
        // If we get here, we have permission, so set up the real-time listener
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const ticketData = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate()
            }));
            setTickets(ticketData);
            setLoading(false);
            setPermissionError(false);
          },
          (error) => {
            console.error('Error fetching tickets:', error);
            
            // Check if it's a permission error
            if (error.code === 'permission-denied') {
              setPermissionError(true);
              toast.error('You do not have permission to view maintenance requests');
            } else {
              toast.error('Failed to load your maintenance requests');
            }
            
            setLoading(false);
          }
        );
        
        return () => unsubscribe();
      } catch (error) {
        console.error('Error in initial ticket fetch:', error);
        
        // Check if it's a permission error
        if (error.code === 'permission-denied') {
          setPermissionError(true);
          toast.error('You do not have permission to view maintenance requests');
        } else {
          toast.error('Failed to load your maintenance requests');
        }
        
        setLoading(false);
        return () => {}; // Return empty cleanup function
      }
    };
    
    if (currentUser && userProfile) {
      fetchTickets();
    }
  }, [currentUser, userProfile, navigate]);

  // Handle form submission success
  const handleRequestSuccess = () => {
  // COMPONENT_TRACE_LOGGER
  console.log('COMPONENT_LOADED: TenantDashboard.jsx');
  // Save to local storage for debugging
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('LAST_COMPONENT_LOADED', 'TenantDashboard.jsx');
      localStorage.setItem('LAST_COMPONENT_LOAD_TIME', new Date().toISOString());
    } catch (e) {
      console.error('Could not write to localStorage');
    }
  }

    toast.success('Maintenance request submitted successfully!');
  };

  // Filter tickets
  const filteredTickets = filter === 'all' 
    ? tickets 
    : tickets.filter(ticket => ticket.status === filter);

  if (!currentUser || !userProfile) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-16 h-16 border-4 border-t-teal-600 border-b-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toaster position="top-right" />
      
      {/* Notification Panel */}
      <NotificationPanel 
        isOpen={notificationPanelOpen} 
        onClose={() => setNotificationPanelOpen(false)} 
      />
      
      {/* Main Content */}
      <div>
        {/* Header Bar with filter options */}
        <HeaderBar filter={filter} setFilter={setFilter} />
        
        {/* Mobile Notification Button */}
        <div className="md:hidden fixed bottom-4 right-4 z-20">
          <button
            type="button"
            className="p-3 rounded-full bg-[#176B5D] text-white shadow-lg hover:bg-teal-700 focus:outline-none"
            onClick={() => setNotificationPanelOpen(true)}
          >
            <BellIcon className="h-6 w-6" />
          </button>
        </div>
        
        {/* Content Area */}
        <main className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {permissionError ? (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <ExclamationCircleIcon className="h-5 w-5 text-yellow-400" aria-hidden="true" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-yellow-800">
                      Permission Issue Detected
                    </h3>
                    <div className="mt-2 text-sm text-yellow-700">
                      <p>
                        You do not have permission to view maintenance requests. This is likely due to a configuration issue with Firestore security rules.
                      </p>
                      <p className="mt-2">
                        Please contact your administrator and ask them to update the Firestore security rules to allow tenants to view tickets they've submitted.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* New Maintenance Request Form */}
                <div className="lg:col-span-1">
                  <RequestForm 
                    onSuccess={handleRequestSuccess} 
                    currentUser={currentUser}
                    userProfile={userProfile}
                  />
                </div>
                
                {/* Maintenance Request History */}
                <div className="lg:col-span-2">
                  <RequestHistory 
                    tickets={filteredTickets} 
                    loading={loading} 
                    filter={filter}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TenantDashboard; 