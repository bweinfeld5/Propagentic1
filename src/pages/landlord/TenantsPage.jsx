import React, { useState, useEffect } from 'react';
import { auth, db } from '../../firebase/config'; // Import auth and db
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'; // Import Firestore functions
import dataService from '../../services/dataService'; 
import Button from '../../components/ui/Button'; 
import { UserPlusIcon, UsersIcon } from '@heroicons/react/24/outline'; 
// Assuming a TenantTable or TenantCard component will be created or exists
// import TenantTable from '../../components/landlord/TenantTable'; 
import InviteTenantModal from '../../components/landlord/InviteTenantModal'; // Reuse invite modal
import { api } from '../../services/api'; // Import the new API service
import { CreateInviteSchema } from '../../schemas/inviteSchema'; // Import the Zod schema
import toast from 'react-hot-toast'; // Import toast

const TenantsPage = () => {
  const [tenants, setTenants] = useState([]);
  const [tenantsLoading, setTenantsLoading] = useState(true);
  const [tenantsError, setTenantsError] = useState(null);
  
  // State for Invite Tenant Modal (reused logic)
  const [isInviteTenantModalOpen, setIsInviteTenantModalOpen] = useState(false);
  const [selectedPropertyForInvite, setSelectedPropertyForInvite] = useState(null); // Need properties to invite
  const [properties, setProperties] = useState([]); // Need properties list for inviting

  // Fetch Tenants Effect
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setTenantsLoading(false);
      setTenantsError("User not authenticated.");
      return;
    }

    // Configure dataService (if not done globally)
    dataService.configure({ isDemoMode: false, currentUser });

    setTenantsLoading(true);
    setTenantsError(null);

    // Fetch properties first to allow inviting tenants
    const fetchProperties = async () => {
        try {
            const props = await dataService.getPropertiesForCurrentLandlord();
            setProperties(props);
            return props.map(p => p.id); // Return property IDs
        } catch (propError) {
            console.error("Error fetching properties for tenant page:", propError);
            setTenantsError("Could not load properties to fetch tenants.");
            setTenantsLoading(false);
            return [];
        }
    };

    const fetchTenants = async (propertyIds) => {
        if (propertyIds.length === 0) {
            setTenants([]);
            setTenantsLoading(false);
            return;
        }
        try {
            // Assuming dataService needs adjustment or new method getTenantsForLandlord
            // For now, fetch per property (inefficient for many properties)
            let allTenants = [];
            for (const propId of propertyIds) {
                const propTenants = await dataService.getTenantsForProperty(propId);
                // Add property info to tenant object for display
                const propertyName = properties.find(p => p.id === propId)?.name || 'Unknown Property';
                allTenants.push(...propTenants.map(t => ({ ...t, propertyName })));
            }
            console.log('Tenants data received:', allTenants.length);
            setTenants(allTenants);
        } catch (error) {
            console.error("Error fetching tenants: ", error);
            setTenantsError(error.message || "Failed to load tenants.");
            setTenants([]);
        } finally {
            setTenantsLoading(false);
        }
    };

    // Chain fetches: Properties -> Tenants
    fetchProperties().then(fetchTenants);

    // No cleanup needed for one-time fetches
  }, []);

   // Handle Inviting Tenant (Open Modal)
   const handleInviteTenant = () => {
    if (properties.length === 0) {
        alert("Please add a property before inviting a tenant.");
        return;
    }
    // For MVP, maybe invite without selecting property first, or prompt selection?
    // Simplest: Invite to the first property? Or require selection.
    // Let's assume we prompt/select in a real UI, but for now, maybe disable or invite to first prop?
    // Setting null propertyId for now, modal needs update or we add a property selector.
    setSelectedPropertyForInvite(null); // Or properties[0] ?
    setIsInviteTenantModalOpen(true);
   };

  // Create Invite Record (Reused from PropertiesPage)
  const handleSendInvite = async (propertyId, tenantEmail) => {
     if (!propertyId) {
       // Alert handled within modal now
       console.error("Property ID missing in handleSendInvite");
       toast.error("Property ID is missing. Please select a property.");
       throw new Error("Property ID missing");
     }

     const currentUser = auth.currentUser;
     if (!currentUser) {
       toast.error("You must be logged in to send invites.");
       throw new Error("User not authenticated");
     }
     const landlordId = currentUser.uid;

     // Optional: Get property name and landlord name for better invite data
     const selectedProperty = properties.find(p => p.id === propertyId);
     const propertyName = selectedProperty?.name || 'Unknown Property';
     const landlordName = currentUser?.displayName || 'Your Landlord';

     const inviteData = {
        tenantEmail,
        propertyId,
        landlordId,
        propertyName,
        landlordName,
        // unitNumber: selectedProperty?.unitNumber || undefined, // Add if available and needed by schema/modal
     };

     try {
       // Use the api service with Zod schema
       await api.create('invites', inviteData, CreateInviteSchema, landlordId);
       console.log('Invite creation initiated via api.create.');
       toast.success('Tenant invitation sent successfully!');
     } catch (error) {
       console.error("Error creating invite record:", error);
       // Check if it's an ApiError with a message, otherwise use a generic one
       const errorMessage = error?.message || "Failed to send invitation.";
       toast.error(errorMessage);
       throw error; 
     }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-2xl font-semibold text-content dark:text-content-dark flex items-center">
           <UsersIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light"/>
           Tenant Management
        </h1>
        <Button 
            variant="primary"
            onClick={handleInviteTenant}
            icon={<UserPlusIcon className="w-5 h-5"/>}
            disabled={properties.length === 0} // Disable if no properties exist
        >
            Invite Tenant
        </Button>
      </div>

      {/* Tenant List Section */}
      {tenantsLoading && (
          <div className="text-center py-10">
             <p>Loading tenants...</p>
             {/* Add spinner? */}
          </div>
      )}
      {!tenantsLoading && tenantsError && (
          <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger dark:border-red-400 p-4 rounded-md">
              <p className="text-sm text-danger dark:text-red-300">Error: {tenantsError}</p>
               {/* Optional: Add retry button */}
          </div>
      )}
      {!tenantsLoading && !tenantsError && tenants.length === 0 && (
          <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow p-8 text-center border border-border dark:border-border-dark mt-8">
              <UsersIcon className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-500 mb-4" />
              <h3 className="text-lg font-medium text-content dark:text-content-dark">No Tenants Found</h3>
              <p className="text-sm text-content-secondary dark:text-content-darkSecondary mt-1 mb-4">
                  {properties.length > 0 
                    ? "Invite your first tenant to a property."
                    : "Add a property first, then invite tenants."
                  }
               </p>
              <Button 
                  variant="primary"
                  onClick={handleInviteTenant}
                  icon={<UserPlusIcon className="w-5 h-5"/>}
                  disabled={properties.length === 0}
              >
                  Invite Tenant
              </Button>
          </div>
      )}
      {!tenantsLoading && !tenantsError && tenants.length > 0 && (
          <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow overflow-hidden border border-border dark:border-border-dark">
             {/* TODO: Implement TenantTable or TenantCard list */}
             <table className="min-w-full divide-y divide-border dark:divide-border-dark">
                <thead className="bg-neutral-50 dark:bg-neutral-800">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Property</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Status</th> 
                    </tr>
                </thead>
                <tbody className="bg-background dark:bg-background-darkSubtle divide-y divide-border dark:divide-border-dark">
                    {tenants.map(tenant => (
                        <tr key={tenant.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-content dark:text-content-dark">{tenant.name || tenant.displayName || 'N/A'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary dark:text-content-darkSecondary">{tenant.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary dark:text-content-darkSecondary">{tenant.propertyName || 'N/A'}</td>
                             <td className="px-6 py-4 whitespace-nowrap text-sm"><span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-success-subtle text-success-dark">Active</span></td> {/* Placeholder status */} 
                        </tr>
                    ))}
                </tbody>
             </table>
          </div>
      )}

      {/* Reused Invite Tenant Modal */}
      {/* Need to enhance modal to allow property selection if selectedPropertyForInvite is null */}
      <InviteTenantModal
        isOpen={isInviteTenantModalOpen}
        onClose={() => setIsInviteTenantModalOpen(false)}
        onInvite={handleSendInvite} // Use the updated handler name
        propertyId={selectedPropertyForInvite?.id} // Might be null, modal needs to handle this
        propertyName={selectedPropertyForInvite?.name}
        properties={properties}
      />
    </div>
  );
};

export default TenantsPage; 