import React from 'react';
import { format } from 'date-fns';

interface JobRequest {
  id: string;
  property: string;
  issue: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
  description?: string;
  estimatedDuration?: string;
}

interface ContractorRequestsTableProps {
  requests: JobRequest[];
  onAcceptRequest?: (requestId: string) => void;
  onViewDetails?: (requestId: string) => void;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const ContractorRequestsTable: React.FC<ContractorRequestsTableProps> = ({
  requests,
  onAcceptRequest,
  onViewDetails,
  showViewAll = true,
  onViewAll
}) => {
  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Recent High-Priority Requests</h2>
          <p className="text-gray-600 text-sm">New requests that require immediate attention.</p>
        </div>
        {showViewAll && (
          <button 
            onClick={onViewAll}
            className="text-orange-600 hover:text-orange-700 font-medium text-sm flex items-center space-x-1 transition-colors"
          >
            <span>View All</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {requests.length === 0 ? (
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm">No high-priority requests at the moment</p>
        </div>
      ) : (
        <div className="overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Property</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Priority</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Date</th>
                <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider pb-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-gray-900">{request.property}</p>
                      <p className="text-sm text-gray-500">{request.issue}</p>
                      {request.description && (
                        <p className="text-xs text-gray-400 mt-1">{request.description}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getPriorityBadge(request.priority)}`}>
                      {request.priority.charAt(0).toUpperCase() + request.priority.slice(1)}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-gray-600">{formatDate(request.date)}</span>
                    {request.estimatedDuration && (
                      <p className="text-xs text-gray-400">{request.estimatedDuration}</p>
                    )}
                  </td>
                  <td className="py-4">
                    <div className="flex space-x-2">
                      {onViewDetails && (
                        <button 
                          onClick={() => onViewDetails(request.id)}
                          className="text-orange-600 hover:text-orange-700 text-sm font-medium transition-colors"
                        >
                          View
                        </button>
                      )}
                      {onAcceptRequest && (
                        <button 
                          onClick={() => onAcceptRequest(request.id)}
                          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Accept
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ContractorRequestsTable; 