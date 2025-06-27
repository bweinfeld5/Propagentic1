import React from 'react';
import PropTypes from 'prop-types';
import { format } from 'date-fns';
import { ChevronDownIcon, ChevronUpIcon, TrashIcon } from '@heroicons/react/24/solid';

const RequestCard = ({ ticket, expanded, toggleExpand, onDelete }) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent expanding the card
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async (e) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(ticket.id);
      setShowDeleteConfirm(false);
    } catch (error) {
      console.error('Error deleting request:', error);
      // You could add a toast notification here
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending_classification':
        return 'bg-yellow-100 text-yellow-800';
      case 'ready_to_dispatch':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-indigo-100 text-indigo-800';
      case 'in_progress':
        return 'bg-purple-100 text-purple-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'classification_failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status text
  const getStatusText = (status) => {
    switch (status) {
      case 'pending_classification':
        return 'Pending Classification';
      case 'ready_to_dispatch':
        return 'Ready to Dispatch';
      case 'assigned':
        return 'Assigned';
      case 'in_progress':
        return 'In Progress';
      case 'completed':
        return 'Completed';
      case 'classification_failed':
        return 'Classification Failed';
      default:
        return status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  // Get urgency badge color
  const getUrgencyBadge = (urgency) => {
    switch (urgency) {
      case 'low':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden group">
      <div 
        className="px-6 py-4 flex justify-between items-center cursor-pointer hover:bg-gray-50 relative"
        onClick={toggleExpand}
      >
        <div className="flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-1">
            <h3 className="text-lg font-semibold text-gray-900 mr-2">{ticket.issueTitle}</h3>
            <div className="flex items-center space-x-2 mt-1 sm:mt-0">
              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(ticket.status)}`}>
                {getStatusText(ticket.status)}
              </span>
              {ticket.urgency && (
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getUrgencyBadge(ticket.urgency)}`}>
                  {ticket.urgency.charAt(0).toUpperCase() + ticket.urgency.slice(1)}
                </span>
              )}
            </div>
          </div>
          <p className="text-sm text-gray-500">
            {ticket.createdAt 
              ? format(ticket.createdAt, 'MMM d, yyyy, h:mm a')
              : 'Recently submitted'}
          </p>
        </div>
        
        {/* Delete Button - Shows on hover */}
        <div className="flex items-center space-x-2 ml-4">
          <button
            onClick={handleDeleteClick}
            className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full hover:bg-red-100 text-red-600 hover:text-red-700"
            title="Delete request"
          >
            <TrashIcon className="h-5 w-5" />
          </button>
          
          <div>
            {expanded ? (
              <ChevronUpIcon className="h-5 w-5 text-gray-500" />
            ) : (
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            )}
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="px-6 py-4 bg-red-50 border-t border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-medium text-red-800">Delete this maintenance request?</h4>
              <p className="text-xs text-red-600 mt-1">This action cannot be undone.</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={handleCancelDelete}
                disabled={isDeleting}
                className="px-3 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {expanded && (
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-1">Description</h4>
              <p className="text-sm text-gray-900 whitespace-pre-line">{ticket.description}</p>
              
              <h4 className="text-sm font-medium text-gray-500 mt-4 mb-1">Unit Number</h4>
              <p className="text-sm text-gray-900">{ticket.unitNumber || 'Not specified'}</p>
            </div>
            
            <div>
              {ticket.photoUrl && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Photo</h4>
                  <img
                    src={ticket.photoUrl}
                    alt="Issue"
                    className="h-48 w-full object-cover rounded-md"
                  />
                </div>
              )}
              
              {ticket.category && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Category</h4>
                  <p className="text-sm text-gray-900">{ticket.category}</p>
                </div>
              )}
              
              {ticket.assignedTo && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Assigned To</h4>
                  <p className="text-sm text-gray-900">{ticket.assignedTo}</p>
                </div>
              )}
            </div>
          </div>
          
          {ticket.status === 'classification_failed' && (
            <div className="mt-4 p-3 bg-red-50 rounded-md">
              <p className="text-sm text-red-700">
                Classification failed. Please contact support if this persists.
              </p>
            </div>
          )}
          
          {ticket.status === 'completed' && ticket.completedAt && (
            <div className="mt-4 border-t border-gray-200 pt-4">
              <p className="text-sm text-gray-500">
                Completed on: {format(ticket.completedAt.toDate(), 'MMM d, yyyy, h:mm a')}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

RequestCard.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.string.isRequired,
    issueTitle: PropTypes.string.isRequired,
    description: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    createdAt: PropTypes.instanceOf(Date),
    photoUrl: PropTypes.string,
    urgency: PropTypes.string,
    category: PropTypes.string,
    unitNumber: PropTypes.string,
    assignedTo: PropTypes.string,
    completedAt: PropTypes.object,
  }).isRequired,
  expanded: PropTypes.bool.isRequired,
  toggleExpand: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired
};

export default RequestCard; 