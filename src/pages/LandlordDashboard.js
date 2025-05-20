import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useConnection } from '../context/ConnectionContext';
import { useDemoMode } from '../context/DemoModeContext';
import dataService from '../services/dataService';
import { captureError, withAsyncErrorTracking } from '../utils/errorTracker';

import OverviewCards from '../components/landlord/OverviewCards';
import RequestFeed from '../components/landlord/RequestFeed';
import PropertyTable from '../components/landlord/PropertyTable';
import TenantTable from '../components/landlord/TenantTable';
import InviteTenantModal from '../components/landlord/InviteTenantModal';
import Button from '../components/ui/Button';

const LandlordDashboard = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const { isOnline, isFirestoreAvailable } = useConnection();
  const { isDemoMode } = useDemoMode();
  const navigate = useNavigate();

  const [properties, setProperties] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [tenants, setTenants] = useState([]); // Assuming you fetch tenants separately or derive from properties/tickets
  const [loadingData, setLoadingData] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');
  const [error, setError] = useState(null);
  const [ticketLoadingError, setTicketLoadingError] = useState(null);
  const [propertiesLoaded, setPropertiesLoaded] = useState(false);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);

  // Improved auth and user role check with error handling
  useEffect(() => {
    console.log('[AuthEffect] Running: authLoading:', authLoading, 'currentUser:', !!currentUser, 'userProfile:', userProfile ? userProfile.userType : 'null');

    if (authLoading) {
      console.log('[AuthEffect] Waiting for auth to load...');
      return; 
    }

    if (!currentUser) {
      console.log('[AuthEffect] No current user, navigating to login.');
      navigate('/login');
      return;
    }

    // Wait for userProfile to be loaded
    if (!userProfile) {
      console.log('[AuthEffect] User exists, but profile not yet loaded, waiting...');
      // It's possible setLoadingData(true) should not be here if profile is not yet ready
      // We want to avoid triggering data fetches with an incomplete profile.
      return;
    }
    
    // Check if user is a landlord
    const userType = userProfile.userType || userProfile.role;
    console.log('[AuthEffect] User and profile loaded. User type:', userType);

    if (userType !== 'landlord') {
      console.error(`[AuthEffect] User has invalid role for landlord dashboard: ${userType || 'undefined'}`);
      setError(`You don't have landlord permissions. Your role: ${userType || 'undefined'}.`);
      navigate('/login'); // Or a more appropriate page like /unauthorized
      return;
    }
    
    // If we get here, we have a valid landlord user - configure data service
    console.log('[AuthEffect] Configuring data service for landlord.');
    dataService.configure({ 
      isDemoMode, 
      currentUser, // currentUser already has uid, email, etc.
      userType: 'landlord' // Explicitly pass 'landlord'
    });
    
    console.log('[AuthEffect] Setting loadingData to true to trigger data fetch.');
    setLoadingData(true); // This will trigger the property and ticket fetching effects
    setError(null); // Clear any previous errors
  }, [currentUser, userProfile, authLoading, navigate, isDemoMode]);

  // Helper function to load properties from localStorage cache
  const loadFromCache = () => {
    try {
      const cachedData = localStorage.getItem('landlord_properties_cache');
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.userId === currentUser.uid) {
          console.log('Using cached properties from localStorage');
          setProperties(parsed.properties);
          setPropertiesLoaded(true);
          setLoadingData(false);
          
          // Show cache notification
          setError(`Using cached data from ${new Date(parsed.timestamp).toLocaleString()}. Some information may be outdated.`);
          return true;
        }
      }
    } catch (e) {
      console.error('Failed to load from cache:', e);
    }
    return false;
  };

  // Modified error handler that tries cache before showing error
  const handlePropertyError = (error) => {
    console.error("Error fetching properties: ", error);
    captureError(error, 'LandlordDashboard.fetchProperties');
    
    // Try to load from cache before showing error
    if (!loadFromCache()) {
      setError(error.message || "Failed to load properties. Please try refreshing the page.");
      setProperties([]);
    }
    
    setLoadingData(false);
    setPropertiesLoaded(false);
  };

  // Add an effect to save properties to localStorage whenever they change
  useEffect(() => {
    if (properties.length > 0 && currentUser) {
      try {
        localStorage.setItem('landlord_properties_cache', JSON.stringify({
          userId: currentUser.uid,
          timestamp: Date.now(),
          properties: properties
        }));
        console.log('Properties cached to localStorage');
      } catch (e) {
        console.error('Failed to cache properties:', e);
      }
    }
  }, [properties, currentUser?.uid]);

  // Fetch properties using the data service - Modified to depend on userProfile AND loadingData
  useEffect(() => {
    console.log('[PropertiesEffect] Running: authLoading:', authLoading, 'currentUser:', !!currentUser, 'userProfile:', userProfile ? userProfile.userType : 'null', 'loadingData:', loadingData);
    // Skip if auth isn't complete or not in data loading phase
    if (authLoading || !loadingData) {
      console.log('[PropertiesEffect] Skipping: Auth loading or not in data loading phase.');
      return;
    }
    
    // Skip if we don't have a user or valid profile yet
    if (!currentUser || !userProfile) {
      console.log('[PropertiesEffect] Skipping: No current user or user profile.');
      return;
    }
    
    // Skip if user doesn't have landlord role (already checked in AuthEffect, but good for safety)
    const userType = userProfile.userType || userProfile.role;
    if (userType !== 'landlord') {
      console.log('[PropertiesEffect] Skipping: User is not a landlord.');
      return;
    }
        
    // Reset states
    setError(null);
    setPropertiesLoaded(false); // Ensure this is reset before fetch
    console.log('[PropertiesEffect] Proceeding to fetch properties.');

    const fetchProperties = withAsyncErrorTracking(async () => {
      try {
        console.log('Fetching properties for landlord:', currentUser.uid);
        // Subscribe to properties with real-time updates
        const unsubscribe = dataService.subscribeToProperties(
          // Success callback
          (propertiesData) => {
            console.log('Properties data received:', propertiesData.length);
            setProperties(propertiesData);
            setLoadingData(false);
            setPropertiesLoaded(true); // Signal that properties are loaded for ticket loading dependency
          },
          // Error callback using our new handler
          handlePropertyError
        );

        // Return the unsubscribe function for cleanup
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up properties listener: ", error);
        captureError(error, 'LandlordDashboard.fetchProperties');
        
        // Use our error handler
        handlePropertyError(error);
        
        // Return a no-op cleanup function
        return () => {};
      }
    }, 'LandlordDashboard.fetchProperties');

    // Execute the fetch function and store the unsubscribe
    const unsubscribe = fetchProperties();
    
    // Cleanup the subscription when the component unmounts
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser, userProfile, authLoading, loadingData, isDemoMode]);

  // Fetch maintenance tickets - update to depend on propertiesLoaded
  useEffect(() => {
    console.log('[TicketsEffect] Running: currentUser:', !!currentUser, 'propertiesLoaded:', propertiesLoaded);
    if (!currentUser || !propertiesLoaded) {
      console.log('[TicketsEffect] Skipping: No current user or properties not loaded.');
      return; 
    }
    
    setTicketsLoading(true);
    setTicketLoadingError(null);
    
    const fetchTickets = withAsyncErrorTracking(async () => {
      try {
        console.log('Properties loaded, now fetching tickets');
        // Use data service to get tickets for current user
        const ticketsData = await dataService.getTicketsForCurrentUser();
        console.log(`Successfully loaded ${ticketsData.length} tickets`);
        setTickets(ticketsData);
        setTicketsLoading(false);
      } catch (error) {
        console.error("Error fetching tickets: ", error);
        captureError(error, 'LandlordDashboard.fetchTickets');
        setTicketLoadingError("Failed to load maintenance tickets. Please try again.");
        setTickets([]);
        setTicketsLoading(false);
      }
    }, 'LandlordDashboard.fetchTickets');

    fetchTickets();
  }, [currentUser, propertiesLoaded, isDemoMode]); // Add propertiesLoaded as a dependency

  // Fetch tenants data 
  useEffect(() => {
    console.log('[TenantsEffect] Running: currentUser:', !!currentUser, 'properties.length:', properties.length);
    if (!currentUser || properties.length === 0) {
      console.log('[TenantsEffect] Skipping: No current user or no properties.');
      return;
    }
    
    const fetchTenants = withAsyncErrorTracking(async () => {
      try {
        // Temporarily: Get tenants for all properties
        // This can be optimized later to get tenants only for specific properties
        const tenantsData = [];
        
        // For each property, get its tenants
        for (const property of properties) {
          if (property.id) {
            const propertyTenants = await dataService.getTenantsForProperty(property.id);
            tenantsData.push(...propertyTenants);
          }
        }
        
        setTenants(tenantsData);
      } catch (error) {
        console.error("Error fetching tenants: ", error);
        captureError(error, 'LandlordDashboard.fetchTenants');
        // Set empty array on error to prevent rendering issues
        setTenants([]);
      } finally {
        // Ensure loading state is updated regardless of success/failure
        setLoadingData(false);
      }
    }, 'LandlordDashboard.fetchTenants');

    // Only fetch tenants if we have properties
    if (properties.length > 0) {
      fetchTenants();
    }
  }, [currentUser, properties, isDemoMode]);

  const handleAssignContractor = (ticketId) => {
    console.log("Assign contractor for ticket:", ticketId);
    // TODO: Implement modal to select contractor
  };

  // Property filter handlers
  const filteredProperties = activeFilter === 'all' 
    ? properties 
    : activeFilter === 'vacant' 
      ? properties.filter(p => !p.isOccupied)
      : properties.filter(p => p.isOccupied);

  // Calculate stats for OverviewCards
  const dashboardStats = {
    totalProperties: properties.length,
    activeTenants: tenants.length,
    openRequests: tickets.filter(t => t.status !== 'completed' && t.status !== 'cancelled').length,
    occupancyRate: properties.length 
      ? Math.round((properties.filter(p => p.isOccupied).length / properties.length) * 100) 
      : 0
  };

  // Display loading indicator until authentication and data are ready
  if (authLoading || loadingData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle zero properties condition with helpful UI
  if (properties.length === 0 && !loadingData && !error) {
    return (
      <div className="space-y-6 p-1 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between">
          <h1 className="text-2xl font-semibold text-slate-800">Landlord Dashboard</h1>
          <p className="text-sm text-slate-500">Welcome, {userProfile?.firstName || 'Landlord'}</p>
        </div>
        
        <div className="bg-white rounded-xl shadow-md p-8 text-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto text-teal-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          <h2 className="text-xl font-medium text-gray-900 mb-2">No Properties Found</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-6">
            You don't have any properties in your account yet. Let's add your first property to get started.
          </p>
          <div className="space-y-3 max-w-md mx-auto">
            <button 
              onClick={() => navigate('/properties/add')}
              className="w-full py-2.5 px-4 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Add Your First Property
            </button>
            
            {!isDemoMode && (
              <button 
                onClick={() => {
                  const toggleDemoMode = window.confirm("Would you like to view demo data to see how the dashboard works?");
                  if (toggleDemoMode) {
                    navigate('/settings?enableDemo=true');
                  }
                }}
                className="w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                View Demo Dashboard
              </button>
            )}
            
            <button 
              onClick={() => {
                const fileInput = document.createElement('input');
                fileInput.type = 'file';
                fileInput.accept = '.json';
                fileInput.onchange = (event) => {
                  const file = event.target.files[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      try {
                        const properties = JSON.parse(e.target.result);
                        if (Array.isArray(properties)) {
                          // Import each property
                          const importProperties = async () => {
                            setLoadingData(true);
                            try {
                              for (const property of properties) {
                                const { id, ...propertyData } = property;
                                await dataService.createProperty(propertyData);
                              }
                              alert(`Successfully imported ${properties.length} properties`);
                              window.location.reload();
                            } catch (error) {
                              alert(`Error importing properties: ${error.message}`);
                              setLoadingData(false);
                            }
                          };
                          importProperties();
                        } else {
                          alert('Invalid property data format');
                        }
                      } catch (error) {
                        alert(`Error parsing file: ${error.message}`);
                      }
                    };
                    reader.readAsText(file);
                  }
                };
                fileInput.click();
              }}
              className="w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              Import Properties
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1 md:p-4">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">Landlord Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome back, {userProfile?.firstName || 'Landlord'}</p>
      </div>
      
      {/* Display error if present */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Failed to load properties</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setLoadingData(true);
                      setError(null);
                      setTimeout(() => {
                        // Force re-mount/re-fetch
                        const user = {...currentUser};
                        dataService.configure({
                          isDemoMode,
                          currentUser: user
                        });
                        // Force useEffect to run again
                        navigate('/dashboard', { replace: true });
                      }, 100);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Retry Loading Properties
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoadingData(true);
                      setError(null);
                      // Enable demo mode to see the UI
                      if (isDemoMode) {
                        window.location.reload();
                      } else {
                        const toggleDemoMode = window.confirm("Would you like to load demo data to view the application features?");
                        if (toggleDemoMode) {
                          navigate('/settings?enableDemo=true');
                        } else {
                          window.location.reload();
                        }
                      }
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {isDemoMode ? "Refresh Page" : "Use Demo Data"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Display offline mode indicator if applicable */}
      {!isOnline && (
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 mb-4 rounded" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">You are currently in offline mode. Some features may be limited.</p>
              <p className="text-xs mt-1">Changes will be synchronized when you're back online.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Display demo mode indicator if applicable */}
      {isDemoMode && (
        <div className="bg-indigo-100 border-l-4 border-indigo-500 text-indigo-700 p-4 mb-4 rounded" role="alert">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium">You are viewing demo data. Changes will not be saved.</p>
            </div>
          </div>
        </div>
      )}
      
      {/* 1. Overview Cards Panel */}
      <section aria-labelledby="overview-heading">
        <h2 id="overview-heading" className="sr-only">Dashboard Overview</h2>
        <OverviewCards stats={dashboardStats} />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 2. Maintenance Request Feed */}
        <section aria-labelledby="maintenance-heading" className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-md p-5 h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 id="maintenance-heading" className="text-lg font-medium text-gray-900">Maintenance Requests</h2>
              {!ticketsLoading && !ticketLoadingError && (
                <span className="px-3 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                  {tickets.filter(t => t.status !== 'completed').length} Open
                </span>
              )}
            </div>
            
            {/* Show ticket loading error if present */}
            {ticketLoadingError && (
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-amber-700">{ticketLoadingError}</p>
                    <button 
                      onClick={() => {
                        setTicketsLoading(true);
                        setTicketLoadingError(null);
                        // Force a re-fetch by toggling the state
                        setPropertiesLoaded(false);
                        setTimeout(() => setPropertiesLoaded(true), 100);
                      }}
                      className="mt-2 text-xs font-medium text-amber-700 hover:text-amber-900 underline"
                    >
                      Retry Loading Tickets
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Show loading state */}
            {ticketsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-t-2 border-b-2 border-teal-500 rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-gray-500">Loading maintenance requests...</span>
              </div>
            ) : (
              // Show tickets or empty state
              tickets.length > 0 ? (
                <RequestFeed requests={tickets} onAssignContractor={handleAssignContractor} />
              ) : (
                <div className="text-center py-8 px-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance requests</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    You don't have any maintenance requests yet.
                  </p>
                </div>
              )
            )}
          </div>
        </section>

        {/* Quick Actions Panel */}
        <section aria-labelledby="actions-heading" className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-md p-5 h-full">
            <h2 id="actions-heading" className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full py-2.5 px-4 bg-teal-600 text-white rounded-lg shadow hover:bg-teal-700 transition-colors flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
                Add New Property
              </button>
              <Button
                variant="primary"
                onClick={() => setInviteModalOpen(true)}
              >
                Invite Tenant
              </Button>
              <button className="w-full py-2.5 px-4 bg-white border border-gray-300 text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                Generate Report
              </button>
            </div>

            {/* Recent Activity */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">Recent Activity</h3>
              <div className="space-y-3">
                {tickets.slice(0, 3).map((ticket, index) => (
                  <div key={index} className="flex items-start space-x-3 border-l-2 border-blue-500 pl-3 py-1">
                    <div className="flex-grow">
                      <p className="text-sm font-medium text-gray-900 truncate">{ticket.title || 'Maintenance Request'}</p>
                      <p className="text-xs text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      ticket.status === 'completed' ? 'bg-green-100 text-green-800' : 
                      ticket.status === 'in-progress' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {ticket.status || 'New'}
                    </span>
                  </div>
                ))}

                {/* Show placeholder if no tickets */}
                {tickets.length === 0 && (
                  <div className="text-center py-3 text-gray-500 text-sm">
                    No recent activity
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* 3. Property Management Table */}
      <section aria-labelledby="properties-heading" className="bg-white rounded-xl shadow-md p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <h2 id="properties-heading" className="text-lg font-medium text-gray-900">Properties</h2>
          <div className="mt-2 sm:mt-0 flex space-x-2">
            <button 
              onClick={() => setActiveFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                activeFilter === 'all' 
                  ? 'bg-teal-100 text-teal-800' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              All
            </button>
            <button 
              onClick={() => setActiveFilter('vacant')}
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                activeFilter === 'vacant' 
                  ? 'bg-amber-100 text-amber-800' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Vacant
            </button>
            <button 
              onClick={() => setActiveFilter('occupied')}
              className={`px-3 py-1 text-xs font-medium rounded-full ${
                activeFilter === 'occupied' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              Fully Occupied
            </button>
          </div>
        </div>
        <PropertyTable properties={filteredProperties} />
      </section>

      {/* 4. Tenant Management Section */}
      <section aria-labelledby="tenants-heading" className="bg-white rounded-xl shadow-md p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <h2 id="tenants-heading" className="text-lg font-medium text-gray-900">Tenants</h2>
          <div className="relative mt-2 sm:mt-0">
            <input 
              type="text" 
              placeholder="Search tenants..." 
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-teal-500 focus:border-teal-500 w-full sm:w-64"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>
        <TenantTable tenants={tenants} />
      </section>

      {/* Toast notification container */}
      <div aria-live="assertive" className="fixed inset-0 flex items-end px-4 py-6 pointer-events-none sm:p-6 sm:items-start z-50">
        <div className="w-full flex flex-col items-center space-y-4 sm:items-end">
          {/* Toast notifications would be rendered here */}
        </div>
      </div>

      <InviteTenantModal
        isOpen={isInviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        properties={properties}
        onInviteSuccess={() => {
          setInviteModalOpen(false);
          refreshTenants();
        }}
      />
    </div>
  );
};

export default LandlordDashboard;