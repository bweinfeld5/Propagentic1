/**
 * Get role-specific dashboard data
 * @param {string} role - User role (Landlord, Tenant, Contractor)
 * @returns {Object} Dashboard data for the specified role
 */
export const getRoleData = (role) => {
  switch (role) {
    case 'Landlord':
      return {
        role: 'Landlord',
        stats: [
          { label: 'Total Properties', value: '3', change: '+12%' },
          { label: 'Total Units', value: '44', change: '+8%' },
          { label: 'Occupancy Rate', value: '91%', change: '+3%' }
        ],
        requests: [
          {
            id: 1,
            title: 'Leaking faucet in Unit 101',
            unit: '101',
            time: '2 hours ago',
            status: 'New',
            priority: 'Medium'
          },
          {
            id: 2,
            title: 'Broken thermostat',
            unit: '205',
            time: '5 hours ago',
            status: 'Assigned',
            priority: 'High'
          },
          {
            id: 3,
            title: 'Clogged drain in Unit 302',
            unit: '302',
            time: '1 day ago',
            status: 'In Progress',
            priority: 'Medium'
          }
        ],
        tabs: [
          { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { id: 'maintenance', label: 'Maintenance', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
          { id: 'properties', label: 'Properties', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' }
        ]
      };
    case 'Contractor':
      return {
        role: 'Contractor',
        stats: [
          { label: 'New Jobs', value: '3', change: '+25%' },
          { label: 'Active Jobs', value: '2', change: '0%' },
          { label: 'Monthly Revenue', value: '$2.1k', change: '+18%' }
        ],
        requests: [
          {
            id: 1,
            title: 'Plumbing Repair - Unit 101',
            unit: '$85',
            time: '3.5 miles',
            status: 'Available',
            priority: 'Medium'
          },
          {
            id: 2,
            title: 'HVAC Service - Unit 205',
            unit: '$120',
            time: '1.8 miles',
            status: 'Assigned',
            priority: 'High'
          },
          {
            id: 3,
            title: 'Electrical Repair - Unit 302',
            unit: '$95',
            time: '2.2 miles',
            status: 'Available',
            priority: 'Low'
          }
        ],
        tabs: [
          { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { id: 'jobs', label: 'Job Board', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
          { id: 'schedule', label: 'Schedule', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' }
        ]
      };
    case 'Tenant':
      return {
        role: 'Tenant',
        stats: [
          { label: 'Open Requests', value: '1', change: '-2' },
          { label: 'Avg Response', value: '4.2hrs', change: '-65%' },
          { label: 'Satisfaction', value: '98%', change: '+5%' }
        ],
        requests: [
          {
            id: 1,
            title: 'My Leaking Faucet Request',
            unit: 'Unit 4B',
            time: '2 hours ago',
            status: 'In Progress',
            priority: 'Medium'
          },
          {
            id: 2,
            title: 'Thermostat Replacement',
            unit: 'Unit 4B',
            time: '3 days ago',
            status: 'Completed',
            priority: 'High'
          }
        ],
        tabs: [
          { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
          { id: 'requests', label: 'My Requests', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 6h6m-6 4h6' },
          { id: 'payments', label: 'Payments', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' }
        ]
      };
    default:
      return getRoleData('Landlord');
  }
}; 