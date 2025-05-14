import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import dataService from '../../services/dataService';
import Button from '../../components/ui/Button';
import { TicketIcon } from '@heroicons/react/24/outline';
import StatusPill from '../../components/ui/StatusPill';

const MaintenancePage = () => {
  const [tickets, setTickets] = useState([]);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [ticketsError, setTicketsError] = useState(null);
  const [properties, setProperties] = useState([]); // Needed to fetch tickets and maybe display property names
  const [selectedTicket, setSelectedTicket] = useState(null);
  // const [contractors, setContractors] = useState([]); // If assignment is needed

  useEffect(() => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setTicketsLoading(false);
      setTicketsError("User not authenticated.");
      return;
    }

    dataService.configure({ currentUser });
    setTicketsLoading(true);
    setTicketsError(null);
    let ticketsUnsubscribe = null;

    const fetchProperties = async () => {
      try {
        const props = await dataService.getPropertiesForCurrentLandlord();
        setProperties(props); // Store full property info
        return props.map(p => p.id);
      } catch (propError) {
        console.error("Error fetching properties for maintenance page:", propError);
        setTicketsError("Could not load properties to fetch maintenance tickets.");
        setTicketsLoading(false);
        return [];
      }
    };

    const setupTicketListener = (propertyIds) => {
      if (propertyIds.length === 0) {
        setTickets([]);
        setTicketsLoading(false);
        return;
      }

      console.log('Setting up tickets listener for Maintenance Page, Property IDs:', propertyIds);

      // Firestore 'in' query limit is 10
      if (propertyIds.length > 10) {
        console.warn("Fetching tickets for more than 10 properties, results might be incomplete due to Firestore limits. MVP scope: showing first 10 properties' tickets.");
      }
      const queryablePropertyIds = propertyIds.slice(0, 10);

      const ticketsQuery = query(
        collection(db, 'tickets'),
        where('propertyId', 'in', queryablePropertyIds),
        orderBy('createdAt', 'desc')
      );

      ticketsUnsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
        const ticketsData = snapshot.docs.map(doc => {
          const property = properties.find(p => p.id === doc.data().propertyId); // Find matching property
          return {
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate() : new Date(),
            propertyName: property?.name || 'Unknown' // Add property name
          };
        });
        console.log('Maintenance Page: Tickets data received:', ticketsData.length);
        setTickets(ticketsData);
        setTicketsLoading(false);
      }, (err) => {
        console.error('Error fetching tickets for Maintenance Page:', err);
        setTicketsError('Failed to load maintenance tickets.');
        setTickets([]);
        setTicketsLoading(false);
      });
    };

    fetchProperties().then(setupTicketListener);

    return () => {
      if (ticketsUnsubscribe && typeof ticketsUnsubscribe === 'function') {
        ticketsUnsubscribe();
      }
    };
  }, []);

  const handleTicketSelect = (ticket) => {
    console.log("Selected Ticket:", ticket);
    setSelectedTicket(ticket);
    alert(`Selected ticket: ${ticket.id} - ${ticket.description?.substring(0, 30)}... Detail view not implemented yet.`);
    // TODO: Implement detailed view/modal
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-content dark:text-content-dark flex items-center">
          <TicketIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light" />
          Maintenance Tickets
        </h1>
      </div>

      {ticketsLoading && (
        <div className="text-center py-10">
          <p className="text-content-secondary dark:text-content-darkSecondary">Loading tickets...</p>
        </div>
      )}
      {!ticketsLoading && ticketsError && (
        <div className="bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger dark:border-red-400 p-4 rounded-md">
          <p className="text-sm text-danger dark:text-red-300">Error: {ticketsError}</p>
        </div>
      )}
      {!ticketsLoading && !ticketsError && tickets.length === 0 && (
        <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow p-8 text-center border border-border dark:border-border-dark mt-8">
          <TicketIcon className="w-12 h-12 mx-auto text-neutral-400 dark:text-neutral-500 mb-4" />
          <h3 className="text-lg font-medium text-content dark:text-content-dark">No Maintenance Tickets Found</h3>
          <p className="text-sm text-content-secondary dark:text-content-darkSecondary mt-1">
            No maintenance tickets have been submitted for your properties yet.
          </p>
        </div>
      )}
      {!ticketsLoading && !ticketsError && tickets.length > 0 && (
        <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow overflow-hidden border border-border dark:border-border-dark">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border dark:divide-border-dark">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Issue</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Property</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-content-secondary dark:text-content-darkSecondary uppercase tracking-wider">Urgency</th>
                  <th className="relative px-6 py-3"><span className="sr-only">View</span></th>
                </tr>
              </thead>
              <tbody className="bg-background dark:bg-background-darkSubtle divide-y divide-border dark:divide-border-dark">
                {tickets.map(ticket => (
                  <tr key={ticket.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-content dark:text-content-dark" title={ticket.description}>{ticket.description?.substring(0, 50)}{ticket.description?.length > 50 ? '...' : ''}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary dark:text-content-darkSecondary">{ticket.propertyName || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-content-secondary dark:text-content-darkSecondary">{ticket.createdAt?.toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusPill status={ticket.status || 'unknown'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <StatusPill status={ticket.urgencyLevel || 'normal'} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="xs" onClick={() => handleTicketSelect(ticket)}>View</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* TODO: Implement ticket detail view/modal logic triggered by handleTicketSelect */}
        </div>
      )}
    </div>
  );
};

export default MaintenancePage; 