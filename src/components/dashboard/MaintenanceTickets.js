import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import TicketCard from './TicketCard';

const MaintenanceTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchTickets = async () => {
      if (!currentUser) return;
      
      try {
        const ticketsRef = collection(db, 'maintenanceRequests');
        const q = query(
          ticketsRef,
          where('submittedBy', '==', currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        
        const querySnapshot = await getDocs(q);
        const ticketList = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() // Convert Firestore timestamp to JS Date
        }));
        
        setTickets(ticketList);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [currentUser]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="spinner"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <h2 className="text-xl font-semibold mb-4">My Maintenance Requests</h2>
        <p className="text-gray-500">You haven't submitted any maintenance requests yet.</p>
        <button 
          className="mt-4 px-4 py-2 bg-propagentic-teal text-white rounded-md hover:bg-teal-600 transition"
          onClick={() => window.location.href = '/maintenance/new'}
        >
          Submit New Request
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-semibold">My Maintenance Requests</h2>
      </div>
      
      <div className="p-4 grid gap-4 md:grid-cols-1 lg:grid-cols-2">
        {tickets.map(ticket => (
          <TicketCard key={ticket.id} ticket={ticket} />
        ))}
      </div>
    </div>
  );
};

export default MaintenanceTickets; 