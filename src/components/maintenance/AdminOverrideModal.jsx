import React, { useState } from 'react';
import PropTypes from 'prop-types';

/**
 * Modal for admin override of ticket status and assignment
 * Allows admins to change status, reassign contractors, and adjust urgency
 */
const AdminOverrideModal = ({ isOpen, onClose, ticketId, ticketData, onSubmit }) => {
  const [status, setStatus] = useState(ticketData?.status || '');
  const [urgency, setUrgency] = useState(ticketData?.urgency || 1);
  const [contractorId, setContractorId] = useState(ticketData?.assignedTo || '');
  const [reason, setReason] = useState('');
  const [overrideType, setOverrideType] = useState('status'); // 'status', 'contractor', 'urgency'
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Available statuses for override
  const availableStatuses = [
    { id: 'new', label: 'New' },
    { id: 'ready_to_dispatch', label: 'Ready to Dispatch' },
    { id: 'pending_acceptance', label: 'Pending Acceptance' },
    { id: 'assigned', label: 'Assigned' },
    { id: 'in_progress', label: 'In Progress' },
    { id: 'on_hold', label: 'On Hold' },
    { id: 'parts_needed', label: 'Parts Needed' },
    { id: 'completed', label: 'Completed' },
    { id: 'canceled', label: 'Canceled' }
  ];
  
  // Dummy contractor data (in real app, would be fetched from database)
  const availableContractors = [
    { id: 'contractor1', name: 'John Smith', specialties: ['plumbing'] },
    { id: 'contractor2', name: 'Sarah Johnson', specialties: ['electrical'] },
    { id: 'contractor3', name: 'Mike Davis', specialties: ['hvac', 'general'] }
  ];
  
  // Reset the form when opening the modal
  React.useEffect(() => {
    if (isOpen && ticketData) {
      setStatus(ticketData.status || '');
      setUrgency(ticketData.urgency || 1);
      setContractorId(ticketData.assignedTo || '');
      setReason('');
      setOverrideType('status');
    }
  }, [isOpen, ticketData]);
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form data
    if (
      (overrideType === 'status' && !status) ||
      (overrideType === 'contractor' && !contractorId) ||
      !reason
    ) {
      alert('Please fill out all required fields');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Prepare submission data based on override type
      let submissionData = {
        ticketId,
        reason
      };
      
      if (overrideType === 'status') {
        submissionData.newStatus = status;
      } else if (overrideType === 'contractor') {
        submissionData.newContractorId = contractorId;
      } else if (overrideType === 'urgency') {
        submissionData.urgency = urgency;
      }
      
      // Submit the data
      await onSubmit(overrideType, submissionData);
      
      // Close modal on success
      onClose();
      
    } catch (error) {
      console.error('Error submitting override:', error);
      alert('Failed to submit override. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Modal backdrop click handler
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Admin Override</h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6">
          {/* Override Type Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              What would you like to override?
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              <div>
                <input 
                  type="radio" 
                  id="override-status" 
                  name="override-type" 
                  value="status"
                  checked={overrideType === 'status'}
                  onChange={() => setOverrideType('status')}
                  className="sr-only"
                />
                <label 
                  htmlFor="override-status"
                  className={`block w-full py-2 px-3 text-center rounded-md cursor-pointer border ${
                    overrideType === 'status' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Status
                </label>
              </div>
              <div>
                <input 
                  type="radio" 
                  id="override-contractor" 
                  name="override-type" 
                  value="contractor"
                  checked={overrideType === 'contractor'}
                  onChange={() => setOverrideType('contractor')}
                  className="sr-only"
                />
                <label 
                  htmlFor="override-contractor"
                  className={`block w-full py-2 px-3 text-center rounded-md cursor-pointer border ${
                    overrideType === 'contractor' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Contractor
                </label>
              </div>
              <div>
                <input 
                  type="radio" 
                  id="override-urgency" 
                  name="override-type" 
                  value="urgency"
                  checked={overrideType === 'urgency'}
                  onChange={() => setOverrideType('urgency')}
                  className="sr-only"
                />
                <label 
                  htmlFor="override-urgency"
                  className={`block w-full py-2 px-3 text-center rounded-md cursor-pointer border ${
                    overrideType === 'urgency' 
                      ? 'bg-blue-50 border-blue-500 text-blue-700' 
                      : 'border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Urgency
                </label>
              </div>
            </div>
          </div>
          
          {/* Status Override */}
          {overrideType === 'status' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="status">
                New Status
              </label>
              
              <select
                id="status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a status</option>
                {availableStatuses.map(statusOption => (
                  <option key={statusOption.id} value={statusOption.id}>
                    {statusOption.label}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Contractor Override */}
          {overrideType === 'contractor' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="contractor">
                Reassign to Contractor
              </label>
              
              <select
                id="contractor"
                value={contractorId}
                onChange={(e) => setContractorId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              >
                <option value="">Select a contractor</option>
                {availableContractors.map(contractor => (
                  <option key={contractor.id} value={contractor.id}>
                    {contractor.name} - {contractor.specialties.join(', ')}
                  </option>
                ))}
              </select>
            </div>
          )}
          
          {/* Urgency Override */}
          {overrideType === 'urgency' && (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Urgency Level (1-5)
              </label>
              
              <div className="flex items-center">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={urgency}
                  onChange={(e) => setUrgency(parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="ml-3 text-lg font-medium text-blue-600 min-w-[1.5rem] text-center">
                  {urgency}
                </span>
              </div>
              
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Low</span>
                <span>Medium</span>
                <span>High</span>
              </div>
            </div>
          )}
          
          {/* Reason for Override */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="reason">
              Reason for Override
            </label>
            
            <textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              rows={3}
              placeholder="Provide a reason for this override"
              required
            />
          </div>
          
          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 rounded-md text-white font-medium ${
                isSubmitting
                  ? 'bg-blue-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {isSubmitting ? 'Processing...' : 'Submit Override'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

AdminOverrideModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  ticketId: PropTypes.string.isRequired,
  ticketData: PropTypes.shape({
    status: PropTypes.string,
    urgency: PropTypes.number,
    assignedTo: PropTypes.string
  }),
  onSubmit: PropTypes.func.isRequired
};

export default AdminOverrideModal; 