import React from 'react';
import PropTypes from 'prop-types';

/**
 * Banner displayed when a maintenance ticket is escalated
 * Provides clear visibility for high-priority or SLA-violating tickets
 */
const EscalationBanner = ({ ticket, onResolve }) => {
  // Skip rendering if ticket is not escalated
  if (!ticket.escalated) {
    return null;
  }
  
  // Determine escalation reason and styling
  const getEscalationDetails = () => {
    const meta = ticket.meta || {};
    const reason = meta.escalationReason || 'Ticket has been escalated';
    
    // Determine severity level
    let severity = 'warning'; // default
    
    if (ticket.urgency >= 5 || (meta.rejectionCount && meta.rejectionCount >= 2)) {
      severity = 'critical';
    } else if (ticket.urgency >= 4 || ticket.status === 'needs_manual_assignment') {
      severity = 'high';
    }
    
    // Determine icon and colors based on severity
    let icon;
    let bgColor;
    let borderColor;
    let textColor;
    
    switch (severity) {
      case 'critical':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
        bgColor = 'bg-red-50';
        borderColor = 'border-red-500';
        textColor = 'text-red-700';
        break;
      
      case 'high':
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.395 2.553a1 1 0 00-1.45-.385c-.345.23-.614.558-.822.88-.214.33-.403.713-.57 1.116-.334.804-.614 1.768-.84 2.734a31.365 31.365 0 00-.613 3.58 2.64 2.64 0 01-.945-1.067c-.328-.68-.398-1.534-.398-2.654A1 1 0 005.05 6.05 6.981 6.981 0 003 11a7 7 0 1011.95-4.95c-.592-.591-.98-.985-1.348-1.467-.363-.476-.724-1.063-1.207-2.03zM12.12 15.12A3 3 0 017 13s.879.5 2.5.5c0-1 .5-4 1.25-4.5.5 1 .786 1.293 1.371 1.879A2.99 2.99 0 0113 13a2.99 2.99 0 01-.879 2.121z" clipRule="evenodd" />
          </svg>
        );
        bgColor = 'bg-orange-50';
        borderColor = 'border-orange-500';
        textColor = 'text-orange-700';
        break;
        
      default: // warning
        icon = (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
        bgColor = 'bg-yellow-50';
        borderColor = 'border-yellow-500';
        textColor = 'text-yellow-700';
    }
    
    return { reason, icon, bgColor, borderColor, textColor, severity };
  };
  
  const { reason, icon, bgColor, borderColor, textColor, severity } = getEscalationDetails();
  
  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = timestamp instanceof Date 
      ? timestamp 
      : new Date(timestamp);
    
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };
  
  const escalatedAt = ticket.meta?.escalatedAt 
    ? formatTime(ticket.meta.escalatedAt) 
    : 'Unknown time';
  
  return (
    <div className={`rounded-md ${bgColor} p-4 mb-6 border-l-4 ${borderColor}`}>
      <div className="flex items-start">
        <div className={`flex-shrink-0 ${textColor}`}>
          {icon}
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className={`text-sm font-medium ${textColor}`}>
            {severity === 'critical' ? 'CRITICAL ESCALATION' : 
              severity === 'high' ? 'HIGH PRIORITY ESCALATION' : 
              'ESCALATED TICKET'}
          </h3>
          
          <div className={`mt-2 text-sm ${textColor}`}>
            <p>
              {reason}
              <span className="block text-xs mt-1">Escalated at: {escalatedAt}</span>
            </p>
          </div>
          
          {/* Display additional information for SLA violations */}
          {ticket.meta?.slaViolation && (
            <div className="mt-2 text-sm border-t border-yellow-200 pt-2">
              <p>
                <span className="font-medium">SLA Violation:</span> Ticket exceeded {ticket.meta.slaThreshold} minute response time for urgency level {ticket.urgency}.
              </p>
            </div>
          )}
          
          {/* Action buttons */}
          <div className="mt-4">
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => onResolve(ticket.id, 'acknowledged')}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md ${textColor} bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                Acknowledge
              </button>
              
              <button
                type="button"
                onClick={() => onResolve(ticket.id, 'resolved')}
                className={`inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white ${
                  severity === 'critical' ? 'bg-red-700 hover:bg-red-800' :
                  severity === 'high' ? 'bg-orange-700 hover:bg-orange-800' :
                  'bg-yellow-700 hover:bg-yellow-800'
                } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500`}
              >
                Resolve Escalation
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

EscalationBanner.propTypes = {
  ticket: PropTypes.shape({
    id: PropTypes.string.isRequired,
    escalated: PropTypes.bool,
    urgency: PropTypes.number,
    status: PropTypes.string,
    meta: PropTypes.shape({
      escalatedAt: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
      escalationReason: PropTypes.string,
      rejectionCount: PropTypes.number,
      slaViolation: PropTypes.bool,
      slaThreshold: PropTypes.number
    })
  }).isRequired,
  onResolve: PropTypes.func.isRequired
};

export default EscalationBanner; 