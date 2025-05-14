import React, { useState, useEffect, useCallback } from 'react';
import { auth } from '../../firebase/config';
import dataService from '../../services/dataService';
import PropertyCard from './PropertyCard'; // Assuming this exists
import AddPropertyModal from './AddPropertyModal'; // Assuming this exists
import Button from '../ui/Button';
import { HomeIcon, PlusIcon } from '@heroicons/react/24/outline';
import LoadingSkeleton from '../shared/LoadingSkeleton'; // To be created later (Step 5)
import ErrorBoundary from '../shared/ErrorBoundary'; // To be created later (Step 5)
// Import Toast notifications (Step 6)
// import { toast } from 'react-toastify';

const LandlordTicketDashboard = () => { // Rename later if needed
  const [properties, setProperties] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null); // Store error object/message
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setIsLoading(false);
      setError("User not authenticated.");
      return;
    }

    console.log("Setting up properties subscription...");
    setIsLoading(true);
    setError(null); // Clear previous errors
    dataService.configure({ currentUser });

    // --- Attempt to load from cache first ---
    let cacheLoaded = false;
    try {
        const cachedData = localStorage.getItem(`properties_cache_${currentUser.uid}`);
        if (cachedData) {
            const parsed = JSON.parse(cachedData);
            // Optional: Check timestamp for expiry
            // const cacheAge = Date.now() - parsed.timestamp;
            // if (cacheAge < SOME_EXPIRY_TIME) {
                console.log("Using cached properties from localStorage");
                setProperties(parsed.properties);
                setIsLoading(false); // Show cached data immediately
                cacheLoaded = true;
                // Optionally show a toast indicating cached data is used
                // toast.info("Displaying cached properties. Updating in background...", { autoClose: 2000 });
            // }
        }
    } catch (e) {
        console.error("Failed to load properties from cache:", e);
    }

    // --- Set up real-time listener ---
    const unsubscribe = dataService.subscribeToPropertiesMultiField(
      (loadedProperties) => {
        console.log(`Properties data received: ${loadedProperties.length} items.`);
        setProperties(loadedProperties);
        setError(null); // Clear error on successful data load
        setIsLoading(false); // Stop loading indicator

        // --- Cache the loaded data ---
        try {
             localStorage.setItem(`properties_cache_${currentUser.uid}`, JSON.stringify({
                 timestamp: Date.now(),
                 properties: loadedProperties
             }));
        } catch (e) {
             console.warn("Failed to cache properties:", e);
        }
      },
      (err) => {
        console.error("Error subscribing to properties:", err);
        setError(err.message || "Failed to load properties.");
        // Don't set loading false if cache was loaded, allow cached view
        if (!cacheLoaded) {
            setProperties([]); // Clear properties on definite error
            setIsLoading(false);
        }
        // Report error (Step 6)
        // Sentry.captureException(err);
      }
    );

    // Cleanup subscription on unmount
    return () => {
        console.log("Cleaning up properties subscription.");
        if (unsubscribe) {
            unsubscribe();
        }
    };
  }, [currentUser]);

  const handleAddProperty = async (propertyData) => {
     // Add property logic using dataService.createProperty
     try {
         setIsAddModalOpen(false); // Close modal optimistically
         // toast.promise( // Use toast (Step 6)
            await dataService.createProperty(propertyData);
         // , { pending: 'Adding property...', success: 'Property added!', error: 'Failed to add property.' });
         // No need to manually setProperties, listener should update
     } catch (err) {
         console.error("Error adding property:", err);
         setError("Failed to add property: " + err.message);
         // toast.error("Failed to add property: " + err.message); // Step 6
         // Optionally re-open modal or show error within it
     }
  };

  // --- Render Logic ---
  const renderContent = () => {
      // Show skeleton loaders while initially loading and no cache exists
     if (isLoading && !cacheLoaded) {
       return <LoadingSkeleton type="propertyList" count={3} />; // Implement in Step 5
     }

     // Show error message *only* if loading is finished, there's an error, AND no data (not even cached)
     if (!isLoading && error && properties.length === 0) {
        return (
            <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 font-medium">Error Loading Properties</p>
                <p className="text-red-500 text-sm mt-1">{error}</p>
                {/* Optional: Add a retry button */}
            </div>
        );
     }

     // Show empty state if loading is done, no error, and properties array is empty
     if (!isLoading && !error && properties.length === 0) {
       return (
         <div className="text-center py-16 px-4 bg-background-subtle dark:bg-background-darkSubtle rounded-lg border border-border dark:border-border-dark">
           <HomeIcon className="mx-auto h-12 w-12 text-neutral-400 dark:text-neutral-500" />
           <h3 className="mt-2 text-lg font-medium text-content dark:text-content-dark">No Properties Found</h3>
           <p className="mt-1 text-sm text-content-secondary dark:text-content-darkSecondary">
             Add your first property to manage tenants and maintenance.
           </p>
           <div className="mt-6">
             <Button
               variant="primary"
               onClick={() => setIsAddModalOpen(true)}
               icon={<PlusIcon className="w-5 h-5" />}
             >
               Add First Property
             </Button>
           </div>
         </div>
       );
     }

     // Display properties if loaded (cached or live)
     // Even if there's a background error, show the potentially stale data
     return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
             {properties.map((prop) => (
                 <PropertyCard key={prop.id} property={prop} />
             ))}
        </div>
     );
  };

  return (
    // Wrap main content area with ErrorBoundary (Step 5)
    // <ErrorBoundary fallback={<p>Something went wrong displaying the dashboard.</p>}>
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <h1 className="text-2xl font-semibold text-content dark:text-content-dark flex items-center">
                   <HomeIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light"/>
                   My Properties
                </h1>
                {/* Show Add button only if properties exist (empty state has its own) */}
                {!isLoading && properties.length > 0 && (
                     <Button
                       variant="primary"
                       onClick={() => setIsAddModalOpen(true)}
                       icon={<PlusIcon className="w-5 h-5" />}
                     >
                       Add Property
                     </Button>
                )}
            </div>

             {/* Display loading state OR data/empty state/error */}
             {renderContent()}

             {/* Add Property Modal */}
             <AddPropertyModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSave={handleAddProperty}
             />
        </div>
    // </ErrorBoundary>
  );
};

export default LandlordTicketDashboard;