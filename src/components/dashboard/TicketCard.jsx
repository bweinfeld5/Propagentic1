import React from 'react';
import { format } from 'date-fns';
import { CheckBadgeIcon, BoltIcon } from '@heroicons/react/24/solid';

const TicketCard = ({ ticket }) => {
  // Extract properties from ticket
  const { 
    description, 
    category, 
    urgency, 
    status, 
    timestamp, 
    photoUrl,
    unitNumber
  } = ticket;

  // Format timestamp if it exists
  const formattedDate = timestamp ? format(timestamp, 'MMM d, yyyy h:mm a') : 'Date unavailable';
  
  // Determine if ticket was auto-classified by AI
  const isAIClassified = status !== 'pending_classification' && (category || urgency);

  // Map urgency level to appropriate color and label
  const getUrgencyBadge = () => {
    if (!urgency) {
      return (
        <span className="px-2 py-1 text-xs font-medium bg-gray-200 text-gray-600 rounded-full">
          Classifying...
        </span>
      );
    }

    const urgencyMap = {
      1: { color: 'bg-green-100 text-green-800', label: 'Low' },
      2: { color: 'bg-blue-100 text-blue-800', label: 'Minor' },
      3: { color: 'bg-yellow-100 text-yellow-800', label: 'Normal' },
      4: { color: 'bg-orange-100 text-orange-800', label: 'Important' },
      5: { color: 'bg-red-100 text-red-800', label: 'Emergency' }
    };

    const { color, label } = urgencyMap[urgency] || urgencyMap[3];
    
    return (
      <span className={`px-2 py-1 text-xs font-medium ${color} rounded-full flex items-center`}>
        <span>{label} Priority (Level {urgency})</span>
      </span>
    );
  };

  // Map status to appropriate color and label
  const getStatusBadge = () => {
    const statusMap = {
      'pending_classification': { color: 'bg-purple-100 text-purple-800', label: 'Classifying' },
      'ready_to_dispatch': { color: 'bg-blue-100 text-blue-800', label: 'Awaiting Assignment' },
      'assigned': { color: 'bg-indigo-100 text-indigo-800', label: 'Assigned' },
      'in_progress': { color: 'bg-yellow-100 text-yellow-800', label: 'In Progress' },
      'completed': { color: 'bg-green-100 text-green-800', label: 'Completed' }
    };

    const { color, label } = statusMap[status] || { 
      color: 'bg-gray-100 text-gray-800', 
      label: status?.replace(/_/g, ' ') || 'Unknown' 
    };
    
    return (
      <span className={`px-2 py-1 text-xs font-medium ${color} rounded-full`}>
        {label}
      </span>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-300">
      <div className="p-5">
        {/* Header with status and urgency */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex space-x-2">
            {getStatusBadge()}
            {getUrgencyBadge()}
          </div>
          
          {/* AI badge if classified */}
          {isAIClassified && (
            <span className="inline-flex items-center text-xs text-propagentic-teal" title="AI Classified">
              <CheckBadgeIcon className="w-4 h-4 mr-1" />
              AI Classified
            </span>
          )}
        </div>
        
        {/* Ticket content */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Classifying...'}
          </h3>
          <p className="text-gray-700 text-sm">{description}</p>
        </div>
        
        {/* Photo thumbnail if available */}
        {photoUrl && (
          <div className="mb-4">
            <img 
              src={photoUrl} 
              alt="Issue" 
              className="w-full h-32 object-cover rounded-md"
            />
          </div>
        )}
        
        {/* Footer with metadata */}
        <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-3 border-t border-gray-100">
          <div>
            {unitNumber && <span>Unit {unitNumber}</span>}
          </div>
          <time dateTime={timestamp?.toISOString()}>{formattedDate}</time>
        </div>
      </div>
    </div>
  );
};

export default TicketCard; 