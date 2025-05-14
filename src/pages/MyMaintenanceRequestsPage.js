import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MaintenanceTickets from '../components/dashboard/MaintenanceTickets';

const MyMaintenanceRequestsPage = () => {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">My Maintenance Requests</h1>
        <Link
          to="/maintenance/new"
          className="inline-flex items-center px-4 py-2 bg-propagentic-teal text-white rounded-md hover:bg-teal-600 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 mr-2"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
              clipRule="evenodd"
            />
          </svg>
          New Request
        </Link>
      </div>

      <MaintenanceTickets />
    </div>
  );
};

export default MyMaintenanceRequestsPage; 