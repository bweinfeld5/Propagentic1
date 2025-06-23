/**
 * Demo data for the PropAgentic application
 * This data is used when the application is in demo mode or when Firebase is unavailable
 */

// Demo properties data
export const demoProperties = [
  {
    id: 'prop-001',
    name: 'Sunset Apartments',
    nickname: 'Sunset Apartments',
    streetAddress: '123 Sunset Blvd',
    city: 'Los Angeles',
    state: 'CA',
    zip: '90210',
    units: 20,
    occupancyRate: 95,
    isOccupied: true,
    numberOfUnits: 20,
    occupiedUnits: 19,
    landlordId: 'landlord-001',
    tenants: ['tenant-001', 'tenant-002', 'tenant-003'],
    createdAt: new Date(2023, 0, 15)
  },
  {
    id: 'prop-002',
    name: 'Ocean View Condos',
    nickname: 'Ocean View',
    streetAddress: '456 Beach Road',
    city: 'Malibu',
    state: 'CA',
    zip: '90265',
    units: 15,
    occupancyRate: 87,
    isOccupied: true,
    numberOfUnits: 15,
    occupiedUnits: 13,
    landlordId: 'landlord-001',
    tenants: ['tenant-004', 'tenant-005'],
    createdAt: new Date(2023, 2, 10)
  },
  {
    id: 'prop-003',
    name: 'Downtown Lofts',
    nickname: 'DT Lofts',
    streetAddress: '789 Main Street',
    city: 'San Francisco',
    state: 'CA',
    zip: '94105',
    units: 9,
    occupancyRate: 91,
    isOccupied: true,
    numberOfUnits: 9,
    occupiedUnits: 8,
    landlordId: 'landlord-001',
    tenants: ['tenant-006'],
    createdAt: new Date(2023, 4, 22)
  }
];

// Demo maintenance ticket data
export const demoTickets = [
  {
    id: 'ticket-001',
    title: 'Leaking faucet in Unit 101',
    description: 'The bathroom sink faucet is leaking constantly and causing water damage to the cabinet below.',
    status: 'new',
    priority: 'medium',
    category: 'plumbing',
    location: 'Sunset Apartments, Unit 101',
    propertyId: 'prop-001',
    tenantId: 'tenant-001',
    assignedTo: null,
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000), // 8 hours ago
    updatedAt: new Date(Date.now() - 8 * 60 * 60 * 1000)
  },
  {
    id: 'ticket-002',
    title: 'Broken thermostat in Unit 205',
    description: 'The thermostat is not responding and the temperature cannot be controlled.',
    status: 'assigned',
    priority: 'high',
    category: 'hvac',
    location: 'Ocean View Condos, Unit 205',
    propertyId: 'prop-002',
    tenantId: 'tenant-004',
    assignedTo: 'contractor-001',
    assignedName: 'Mike Thompson',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    id: 'ticket-003',
    title: 'Ceiling fan not working',
    description: 'The ceiling fan in the living room is not turning on. I have checked the breaker and it is not tripped.',
    status: 'in_progress',
    priority: 'low',
    category: 'electrical',
    location: 'Downtown Lofts, Unit 304',
    propertyId: 'prop-003',
    tenantId: 'tenant-006',
    assignedTo: 'contractor-002',
    assignedName: 'Sarah Johnson',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  },
  {
    id: 'ticket-004',
    title: 'Kitchen sink clogged',
    description: 'Kitchen sink is completely clogged and will not drain at all.',
    status: 'completed',
    priority: 'medium',
    category: 'plumbing',
    location: 'Sunset Apartments, Unit 103',
    propertyId: 'prop-001',
    tenantId: 'tenant-003',
    assignedTo: 'contractor-001',
    assignedName: 'Mike Thompson',
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    updatedAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000) // 8 days ago
  }
];

// Demo tenant data
export const demoTenants = [
  {
    id: 'tenant-001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '123-456-7890',
    propertyId: 'prop-001',
    unitNumber: '101',
    leaseStartDate: new Date(2023, 0, 1),
    leaseEndDate: new Date(2023, 11, 31),
    rentAmount: 1500,
    userType: 'tenant'
  },
  {
    id: 'tenant-002',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '123-456-7891',
    propertyId: 'prop-001',
    unitNumber: '102',
    leaseStartDate: new Date(2023, 1, 1),
    leaseEndDate: new Date(2024, 0, 31),
    rentAmount: 1550,
    userType: 'tenant'
  },
  {
    id: 'tenant-003',
    firstName: 'Michael',
    lastName: 'Johnson',
    email: 'michael.johnson@example.com',
    phone: '123-456-7892',
    propertyId: 'prop-001',
    unitNumber: '103',
    leaseStartDate: new Date(2023, 2, 1),
    leaseEndDate: new Date(2024, 1, 28),
    rentAmount: 1450,
    userType: 'tenant'
  },
  {
    id: 'tenant-004',
    firstName: 'Emily',
    lastName: 'Brown',
    email: 'emily.brown@example.com',
    phone: '123-456-7893',
    propertyId: 'prop-002',
    unitNumber: '205',
    leaseStartDate: new Date(2023, 3, 1),
    leaseEndDate: new Date(2024, 2, 31),
    rentAmount: 2200,
    userType: 'tenant'
  },
  {
    id: 'tenant-005',
    firstName: 'David',
    lastName: 'Wilson',
    email: 'david.wilson@example.com',
    phone: '123-456-7894',
    propertyId: 'prop-002',
    unitNumber: '207',
    leaseStartDate: new Date(2023, 4, 1),
    leaseEndDate: new Date(2024, 3, 30),
    rentAmount: 2150,
    userType: 'tenant'
  },
  {
    id: 'tenant-006',
    firstName: 'Jessica',
    lastName: 'Taylor',
    email: 'jessica.taylor@example.com',
    phone: '123-456-7895',
    propertyId: 'prop-003',
    unitNumber: '304',
    leaseStartDate: new Date(2023, 5, 1),
    leaseEndDate: new Date(2024, 4, 31),
    rentAmount: 3100,
    userType: 'tenant'
  }
];

// Demo contractor data
export const demoContractors = [
  {
    id: 'contractor-001',
    firstName: 'Mike',
    lastName: 'Thompson',
    email: 'mike.thompson@example.com',
    phone: '123-456-7896',
    specialties: ['plumbing', 'general'],
    rating: 4.8,
    completedJobs: 57,
    userType: 'contractor'
  },
  {
    id: 'contractor-002',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@example.com',
    phone: '123-456-7897',
    specialties: ['electrical', 'hvac'],
    rating: 4.9,
    completedJobs: 43,
    userType: 'contractor'
  },
  {
    id: 'contractor-003',
    firstName: 'Robert',
    lastName: 'Garcia',
    email: 'robert.garcia@example.com',
    phone: '123-456-7898',
    specialties: ['carpentry', 'painting'],
    rating: 4.7,
    completedJobs: 32,
    userType: 'contractor'
  }
];

// Demo landlord data
export const demoLandlords = [
  {
    id: 'landlord-001',
    firstName: 'Benjamin',
    lastName: 'Weinfeld',
    email: 'benjamin.weinfeld@example.com',
    phone: '123-456-7899',
    properties: ['prop-001', 'prop-002', 'prop-003'],
    userType: 'landlord',
    onboardingComplete: true
  }
];

// Demo notifications
export const demoNotifications = [
  {
    id: 'notification-001',
    title: 'New maintenance request',
    description: 'John Doe has submitted a new maintenance request for Unit 101',
    status: 'unread',
    type: 'maintenance',
    userId: 'landlord-001',
    relatedId: 'ticket-001',
    createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 hours ago
  },
  {
    id: 'notification-002',
    title: 'Maintenance request assigned',
    description: 'Your maintenance request for the broken thermostat has been assigned to Mike Thompson',
    status: 'unread',
    type: 'maintenance',
    userId: 'tenant-004',
    relatedId: 'ticket-002',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    id: 'notification-003',
    title: 'New job assignment',
    description: 'You have been assigned to fix a broken thermostat at Ocean View Condos, Unit 205',
    status: 'read',
    type: 'job',
    userId: 'contractor-001',
    relatedId: 'ticket-002',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
  },
  {
    id: 'notification-004',
    title: 'Lease ending soon',
    description: 'Your lease for Unit 101 at Sunset Apartments will end in 30 days',
    status: 'unread',
    type: 'lease',
    userId: 'tenant-001',
    relatedId: 'tenant-001',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
  }
];

// Demo users (combined data for authentication)
export const demoUsers = [
  {
    uid: 'landlord-001',
    email: 'benjamin.weinfeld@example.com',
    role: 'landlord',
  userType: 'landlord',
    firstName: 'Benjamin',
    lastName: 'Weinfeld',
    phone: '123-456-7899',
    onboardingComplete: true
  },
  {
    uid: 'tenant-001',
    email: 'john.doe@example.com',
    role: 'tenant',
    userType: 'tenant',
    firstName: 'John',
    lastName: 'Doe',
    phone: '123-456-7890',
    onboardingComplete: true,
    propertyId: 'prop-001',
    unitNumber: '101'
  },
  {
    uid: 'contractor-001',
    email: 'mike.thompson@example.com',
    role: 'contractor',
    userType: 'contractor',
    firstName: 'Mike',
    lastName: 'Thompson',
    phone: '123-456-7896',
    onboardingComplete: true,
    specialties: ['plumbing', 'general']
  }
];

/**
 * Get demo user by uid
 * @param {string} uid - User ID
 * @returns {Object|null} - User object or null if not found
 */
export const getDemoUser = (uid) => {
  return demoUsers.find(user => user.uid === uid) || null;
};

/**
 * Get demo user by email
 * @param {string} email - User email
 * @returns {Object|null} - User object or null if not found
 */
export const getDemoUserByEmail = (email) => {
  return demoUsers.find(user => user.email === email) || null;
};

/**
 * Get properties for a landlord
 * @param {string} landlordId - Landlord ID
 * @returns {Array} - Array of property objects
 */
export const getDemoPropertiesForLandlord = (landlordId) => {
  return demoProperties.filter(property => property.landlordId === landlordId);
};

/**
 * Get property by ID
 * @param {string} propertyId - Property ID
 * @returns {Object|null} - Property object or null if not found
 */
export const getDemoPropertyById = (propertyId) => {
  return demoProperties.find(property => property.id === propertyId) || null;
};

/**
 * Get tickets for a property
 * @param {string} propertyId - Property ID
 * @returns {Array} - Array of ticket objects
 */
export const getDemoTicketsForProperty = (propertyId) => {
  return demoTickets.filter(ticket => ticket.propertyId === propertyId);
};

/**
 * Get tickets for a tenant
 * @param {string} tenantId - Tenant ID
 * @returns {Array} - Array of ticket objects
 */
export const getDemoTicketsForTenant = (tenantId) => {
  return demoTickets.filter(ticket => ticket.tenantId === tenantId);
};

/**
 * Get tickets for a contractor
 * @param {string} contractorId - Contractor ID
 * @returns {Array} - Array of ticket objects
 */
export const getDemoTicketsForContractor = (contractorId) => {
  return demoTickets.filter(ticket => ticket.assignedTo === contractorId);
};

/**
 * Get tenants for a property
 * @param {string} propertyId - Property ID
 * @returns {Array} - Array of tenant objects
 */
export const getDemoTenantsForProperty = (propertyId) => {
  return demoTenants.filter(tenant => tenant.propertyId === propertyId);
};

/**
 * Get notifications for a user
 * @param {string} userId - User ID
 * @returns {Array} - Array of notification objects
 */
export const getDemoNotificationsForUser = (userId) => {
  return demoNotifications.filter(notification => notification.userId === userId);
};

/**
 * Get properties for a tenant based on TenantIds included in properties
 * @param {string} tenantId - Tenant ID
 * @returns {Array} - Array of property objects
 */
export const getDemoPropertiesForTenant = (tenantId) => {
  return demoProperties.filter(p => p.tenants?.includes(tenantId));
}; 