import React, { useState } from 'react';
import PropTypes from 'prop-types';
import RequestCard from './RequestCard';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import maintenanceRequestService from '../../services/maintenanceRequestService';

const RequestHistory = ({ tickets, loading, filter }) => {
  const [expandedTicketId, setExpandedTicketId] = useState(null);
  const { currentUser } = useAuth();

  // Toggle expanded ticket
  const toggleExpand = (ticketId) => {
    setExpandedTicketId(expandedTicketId === ticketId ? null : ticketId);
  };

  // Handle delete request
  const handleDeleteRequest = async (requestId) => {
    if (!currentUser) {
      toast.error('You must be logged in to delete requests');
      return;
    }

    try {
      await maintenanceRequestService.deleteMaintenanceRequest(requestId, currentUser.uid);
      toast.success('Maintenance request deleted successfully');
    } catch (error) {
      console.error('Error deleting maintenance request:', error);
      toast.error('Failed to delete maintenance request. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-10 h-10 border-4 border-t-teal-600 border-b-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 text-center">
        <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">No maintenance requests</h3>
        <p className="mt-1 text-sm text-gray-500">
          {filter === 'all' 
            ? "You haven't submitted any maintenance requests yet."
            : `You don't have any requests with '${filter}' status.`}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {tickets.map(ticket => (
        <RequestCard 
          key={ticket.id} 
          ticket={ticket} 
          expanded={expandedTicketId === ticket.id}
          toggleExpand={() => toggleExpand(ticket.id)}
          onDelete={handleDeleteRequest}
        />
      ))}
    </div>
  );
};

RequestHistory.propTypes = {
  tickets: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    issueTitle: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.instanceOf(Date),
    photoUrl: PropTypes.string,
    urgency: PropTypes.string,
    category: PropTypes.string,
  })).isRequired,
  loading: PropTypes.bool.isRequired,
  filter: PropTypes.string.isRequired
};

export default RequestHistory; 