import React, { useState, useEffect, useCallback } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, callFunction } from '../../firebase/config';
import AddPropertyModal from './AddPropertyModal';
import dataService from '../../services/dataService';
import inviteService from '../../services/firestore/inviteService';
import Button from '../ui/Button';
import { PlusCircleIcon, BuildingOfficeIcon, TicketIcon } from '@heroicons/react/24/outline';
import PropertyCard from './PropertyCard';
import InviteTenantModal from './InviteTenantModal';

const LandlordTicketDashboard = () => {
  const [properties, setProperties] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [contractors, setContractors] = useState([]);
  
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState(null);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState(null);
  
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [recommendedContractors, setRecommendedContractors] = useState([]);
  const [assigningTicket, setAssigningTicket] = useState(false);
  const [isAddPropertyModalOpen, setIsAddPropertyModalOpen] = useState(false);
  const [isInviteTenantModalOpen, setIsInviteTenantModalOpen] = useState(false);
  const [selectedPropertyForInvite, setSelectedPropertyForInvite] = useState(null);

  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) {
      setPropertiesLoading(false);
      setTicketsLoading(false);
      return;
    }

    setPropertiesLoading(true);
    setPropertiesError(null);
    setTickets([]);
    setTicketsLoading(true);
    setTicketsError(null);

    let ticketUnsubscribe = null;

    const handlePropertyData = (propertiesData) => {
      console.log('Properties data received:', propertiesData.length);
      setProperties(propertiesData);
      setPropertiesLoading(false);
      setPropertiesError(null);

      const propertyIds = propertiesData.map(p => p.id);
      if (propertyIds.length > 0) {
        console.log('Properties loaded, now setting up tickets listener for IDs:', propertyIds);
        setTicketsLoading(true);
        setTicketsError(null);

        const ticketsQuery = query(
          collection(db, 'tickets'),
          where('propertyId', 'in', propertyIds),
          orderBy('createdAt', 'desc')
        );

        ticketUnsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
          const ticketsData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date()
          }));
          console.log('Tickets data received:', ticketsData.length);
          setTickets(ticketsData);
          setTicketsLoading(false);
        }, (err) => {
          console.error('Error fetching tickets:', err);
          setTicketsError('Failed to load maintenance tickets.');
          setTickets([]);
          setTicketsLoading(false);
        });

      } else {
        console.log('No properties found, skipping ticket fetch.');
        setTickets([]);
        setTicketsLoading(false);
      }
    };

    const handlePropertyFetchError = (error) => {
      console.error("Error fetching properties: ", error);
      setPropertiesError(error.message || "Failed to load properties.");
      setProperties([]);
      setPropertiesLoading(false);
      setTickets([]);
      setTicketsLoading(false);
    };

    const propertyUnsubscribe = dataService.subscribeToProperties(
      handlePropertyData,
      handlePropertyFetchError
    );

    const landlordId = currentUser.uid;
    const fetchContractors = async () => {
       try {
         const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
         const landlordProfileSnap = await getDoc(landlordProfileRef);
         if (landlordProfileSnap.exists()) {
           const contractorIds = landlordProfileSnap.data().contractors || [];
           if (contractorIds.length > 0) {
             const contractorsDataPromises = contractorIds.map(async (contractorId) => {
               const contractorRef = doc(db, 'users', contractorId);
               const contractorSnap = await getDoc(contractorRef);
               return contractorSnap.exists() ? { id: contractorId, ...contractorSnap.data() } : null;
             });
             const contractorsData = (await Promise.all(contractorsDataPromises)).filter(c => c !== null);
             setContractors(contractorsData);
           }
         }
       } catch (err) {
         console.error('Error fetching contractors:', err);
       }
     };
     fetchContractors();

    return () => {
      console.log('Cleaning up dashboard listeners');
      if (propertyUnsubscribe && typeof propertyUnsubscribe === 'function') {
        propertyUnsubscribe();
      }
      if (ticketUnsubscribe && typeof ticketUnsubscribe === 'function') {
        ticketUnsubscribe();
      }
    };
  }, [currentUser]);

  const handleTicketSelect = async (ticket) => {
    setSelectedTicket(ticket);
    if (ticket.status === 'ready_to_dispatch' && contractors.length > 0) {
      try {
        const matches = contractors.filter(contractor => 
          contractor.specialties?.includes(ticket.issueType)
        );
        setRecommendedContractors(matches);
      } catch (err) {
        console.error('Error finding recommended contractors:', err);
      }
    } else {
      setRecommendedContractors([]);
    }
  };

  const handleAssignContractor = async (contractorId) => {
    if (!selectedTicket) return;
    setAssigningTicket(true);
    try {
      await callFunction('assignContractorToTicket', {
        ticketId: selectedTicket.id,
        contractorId: contractorId
      });
      setAssigningTicket(false);
      setSelectedTicket(null);
    } catch (err) {
      console.error('Error assigning contractor:', err);
      setAssigningTicket(false);
    }
  };

  const handleAddProperty = async (propertyData) => {
    if (!dataService.currentUser) {
        console.error("DataService not configured with current user.");
        throw new Error("Authentication context is missing.");
    }
    try {
        setIsAddPropertyModalOpen(false);
        await dataService.createProperty(propertyData);
        alert('Property added successfully!');
    } catch (err) {
        console.error("Error adding property:", err);
        setPropertiesError("Failed to add property: " + err.message);
        alert(`Failed to add property: ${err.message}`);
    }
  };

  const handleInviteTenantClick = (propertyId, propertyName) => {
    setSelectedPropertyForInvite({ id: propertyId, name: propertyName });
    setIsInviteTenantModalOpen(true);
  };

  const handleSendInvite = async (propertyId, tenantEmail) => {
    if (!propertyId || !tenantEmail) {
        console.error("Missing propertyId or tenantEmail for invite");
        alert("Error: Missing information for invitation.");
        return;
    }
    const propertyName = selectedPropertyForInvite?.name || properties.find(p => p.id === propertyId)?.name || 'Unknown Property';
    const landlordName = currentUser?.displayName || 'Your Landlord';

    try {
        setIsInviteTenantModalOpen(false);
        await inviteService.createInvite({
            propertyId,
            tenantEmail,
            propertyName,
            landlordName
        });
        alert('Tenant invitation sent successfully!');
    } catch (err) {
        console.error("Error sending invite:", err);
        setPropertiesError("Failed to send invite: " + err.message);
        alert("Failed to send invite: " + err.message);
    }
  };

  if (propertiesLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary dark:border-primary-light"></div>
      </div>
    );
  }

  if (propertiesError) {
    return (
      <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h1 className="text-2xl font-bold text-content dark:text-content-dark">Dashboard</h1>
              <Button 
                  variant="primary"
                  onClick={() => setIsAddPropertyModalOpen(true)}
                  icon={<PlusCircleIcon className="w-5 h-5"/>}
              >
                  Add Property
              </Button>
          </div>
           <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger dark:border-red-400 p-4 rounded-md">
              <p className="text-sm text-danger dark:text-red-300">Error loading properties: {propertiesError}</p>
           </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-content dark:text-content-dark">Dashboard</h1>
          <Button 
              variant="primary"
              onClick={() => setIsAddPropertyModalOpen(true)}
              icon={<PlusCircleIcon className="w-5 h-5"/>}
          >
              Add Property
          </Button>
      </div>
      
      <section className="mb-8">
          <h2 className="text-xl font-semibold text-content dark:text-content-dark mb-4 flex items-center">
              <BuildingOfficeIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light"/>
              My Properties
          </h2>
          {propertiesLoading && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map(i => (
                      <div key={i} className="bg-background dark:bg-background-darkSubtle rounded-xl shadow border border-border dark:border-border-dark p-4 animate-pulse">
                          <div className="h-6 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4 mb-3"></div>
                          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-full mb-2"></div>
                          <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded w-1/2 mb-4"></div>
                          <div className="h-8 bg-neutral-200 dark:bg-neutral-700 rounded w-1/3 ml-auto"></div>
                      </div>
                  ))}
              </div>
          )}
          {!propertiesLoading && propertiesError && (
              <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger dark:border-red-400 p-4 rounded-md">
                  <p className="text-sm text-danger dark:text-red-300">Error: {propertiesError}</p>
              </div>
          )}
          {!propertiesLoading && !propertiesError && properties.length === 0 && (
              <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow p-6 text-center border border-border dark:border-border-dark">
                  <p className="text-content-secondary dark:text-content-darkSecondary">No properties found.</p>
                  <Button 
                      variant="primary"
                      onClick={() => setIsAddPropertyModalOpen(true)}
                      icon={<PlusCircleIcon className="w-5 h-5"/>}
                      className="mt-4"
                  >
                      Add Your First Property
                  </Button>
              </div>
          )}
          {!propertiesLoading && !propertiesError && properties.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {properties.map(property => (
                      <PropertyCard 
                          key={property.id}
                          property={property}
                          onInviteTenantClick={handleInviteTenantClick}
                      />
                  ))}
              </div>
          )}
      </section>

      <section>
           <h2 className="text-xl font-semibold text-content dark:text-content-dark mb-4 flex items-center">
               <TicketIcon className="w-6 h-6 mr-2 text-secondary dark:text-secondary-light"/>
               Maintenance Tickets
           </h2>
           {ticketsLoading && (
              <div className="flex justify-center items-center py-8">
                <div className="w-8 h-8 border-t-2 border-b-2 border-secondary dark:border-secondary-light rounded-full animate-spin"></div>
                <span className="ml-2 text-sm text-content-secondary dark:text-content-darkSecondary">Loading tickets...</span>
              </div>
           )}
           {!ticketsLoading && ticketsError && (
              <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger dark:border-red-400 p-4 rounded-md">
                  <p className="text-sm text-danger dark:text-red-300">Error: {ticketsError}</p>
              </div>
           )}
           {!ticketsLoading && !ticketsError && tickets.length === 0 && (
               <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow p-6 text-center border border-border dark:border-border-dark">
                 <p className="text-content-secondary dark:text-content-darkSecondary">No maintenance tickets found for your properties.</p>
               </div>
           )}
           {!ticketsLoading && !ticketsError && tickets.length > 0 && (
               <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow border border-border dark:border-border-dark overflow-hidden">
                   <div className="overflow-x-auto">
                     <table className="min-w-full divide-y divide-border dark:divide-border-dark">
                       <thead className="bg-neutral-50 dark:bg-neutral-800">
                          <tr>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Property</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Issue</th>
                             <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Status</th>
                          </tr>
                       </thead>
                       <tbody className="bg-background dark:bg-background-darkSubtle divide-y divide-border dark:divide-border-dark">
                         {tickets.map((ticket) => (
                            <tr key={ticket.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 cursor-pointer" onClick={() => handleTicketSelect(ticket)}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-content dark:text-content-dark">{ticket.propertyName || 'N/A'}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-content dark:text-content-dark">{ticket.description?.substring(0, 50)}{ticket.description?.length > 50 ? '...' : ''}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm"><span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${ticket.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{ticket.status}</span></td>
                            </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
               </div>
           )}
      </section>

      <AddPropertyModal 
        isOpen={isAddPropertyModalOpen}
        onClose={() => setIsAddPropertyModalOpen(false)}
        onAdd={handleAddProperty} 
      />
      
      <InviteTenantModal
        isOpen={isInviteTenantModalOpen}
        onClose={() => setIsInviteTenantModalOpen(false)}
        onInvite={handleSendInvite}
        propertyId={selectedPropertyForInvite?.id}
        propertyName={selectedPropertyForInvite?.name}
        properties={properties}
      />
    </div>
  );
};

export default LandlordTicketDashboard; 