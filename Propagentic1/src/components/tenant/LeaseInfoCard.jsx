import React from 'react';
import {
  CalendarDaysIcon, 
  CurrencyDollarIcon, 
  ClockIcon 
} from '@heroicons/react/24/outline';

// Mock Data Function (Replace with actual data fetching later)
const getLeaseInfo = () => ({
  rentAmount: 1450.00,
  dueDate: 'June 1, 2024',
  leaseEndDate: 'December 31, 2024',
});

/**
 * LeaseInfoCard Component
 * 
 * Displays key lease and rent information for a tenant.
 */
const LeaseInfoCard = () => {
  const leaseInfo = getLeaseInfo(); // Get mock data

  // Helper to render individual stat items
  const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start space-x-3">
      <div className="mt-1">
        <Icon className="h-5 w-5 text-primary dark:text-primary-light" aria-hidden="true" />
      </div>
      <div>
        <p className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary">{label}</p>
        <p className="text-base font-semibold text-content dark:text-content-dark">{value}</p>
      </div>
    </div>
  );

  return (
    <div className="bg-background dark:bg-background-darkSubtle rounded-lg shadow-sm border border-border dark:border-border-dark p-6">
      <h2 className="text-lg font-medium text-content dark:text-content-dark mb-4">Lease & Rent Details</h2>
      <div className="space-y-4">
        <InfoItem 
          icon={CurrencyDollarIcon} 
          label="Next Rent Payment" 
          value={`$${leaseInfo.rentAmount.toFixed(2)} due on ${leaseInfo.dueDate}`}
        />
        <InfoItem 
          icon={CalendarDaysIcon} 
          label="Lease End Date" 
          value={leaseInfo.leaseEndDate}
        />
        {/* Add more relevant info here if needed */}
      </div>
      {/* Optional: Add a link/button to view full lease or payment history */}
    </div>
  );
};

export default LeaseInfoCard; 