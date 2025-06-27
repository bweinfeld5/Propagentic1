/**
 * Demo Data Service - Provides realistic demo data for showcasing PropAgentic features
 * This service simulates real property management scenarios without affecting production data
 */

import { serverTimestamp } from 'firebase/firestore';

/**
 * Get demo property details by property ID
 * @param {string} propertyId - Demo property ID
 * @returns {Object|null} Property details or null if not found
 */
export const getDemoProperty = (propertyId) => {
  const demoProperties = {
    'demo-luxury-highrise': {
      id: 'demo-luxury-highrise',
      name: 'Skyline Towers',
      nickname: 'Skyline Towers - Unit 2401',
      streetAddress: '123 Downtown Plaza',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94105',
      unitNumber: '2401',
      type: 'apartment',
      bedrooms: 2,
      bathrooms: 2,
      squareFeet: 1200,
      rent: 4500,
      deposit: 4500,
      petPolicy: 'Cats allowed with deposit',
      amenities: [
        'Gym & Fitness Center',
        'Rooftop Pool & Spa',
        '24/7 Concierge Service',
        'Rooftop Deck with City Views',
        'In-unit Washer/Dryer',
        'Stainless Steel Appliances',
        'Hardwood Floors',
        'Floor-to-ceiling Windows'
      ],
      landlord: {
        name: 'Premium Properties LLC',
        email: 'management@premiumprops.com',
        phone: '(415) 555-0123'
      },
      manager: {
        name: 'Sarah Chen',
        email: 'sarah.chen@premiumprops.com',
        phone: '(415) 555-0124',
        role: 'Property Manager'
      },
      description: 'Luxury high-rise apartment in the heart of downtown San Francisco with stunning city views and premium amenities.',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'
      ],
      leaseStart: '2024-01-01',
      leaseEnd: '2024-12-31',
      emergencyContact: '(415) 555-HELP'
    },
    
    'demo-family-home': {
      id: 'demo-family-home',
      name: 'Maple Street Family Home',
      nickname: 'Maple Street House',
      streetAddress: '456 Maple Street',
      city: 'Palo Alto',
      state: 'CA',
      zipCode: '94301',
      unitNumber: null,
      type: 'house',
      bedrooms: 3,
      bathrooms: 2.5,
      squareFeet: 1800,
      rent: 5200,
      deposit: 5200,
      petPolicy: 'Pet-friendly with yard access',
      amenities: [
        'Private Backyard',
        '2-Car Garage',
        'Modern Kitchen with Island',
        'In-unit Laundry Room',
        'Hardwood Floors',
        'Central Air & Heating',
        'Dishwasher',
        'Garden Space'
      ],
      landlord: {
        name: 'Johnson Family Properties',
        email: 'rentals@johnsonprops.com',
        phone: '(650) 555-0156'
      },
      manager: {
        name: 'Mike Johnson',
        email: 'mike@johnsonprops.com',
        phone: '(650) 555-0157',
        role: 'Owner/Manager'
      },
      description: 'Spacious family home in quiet Palo Alto neighborhood, perfect for families with children. Walking distance to top-rated schools.',
      images: [
        'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800',
        'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
      ],
      leaseStart: '2024-02-01',
      leaseEnd: '2025-01-31',
      emergencyContact: '(650) 555-HELP'
    },
    
    'demo-student-housing': {
      id: 'demo-student-housing',
      name: 'University Commons',
      nickname: 'University Commons - Room 3B',
      streetAddress: '789 College Ave',
      city: 'Berkeley',
      state: 'CA',
      zipCode: '94720',
      unitNumber: '3B',
      type: 'student',
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 400,
      rent: 1800,
      deposit: 1000,
      petPolicy: 'No pets allowed',
      amenities: [
        'Study Rooms',
        'High-Speed WiFi',
        'Shared Kitchen',
        'Bike Storage',
        'Laundry Facility',
        'Common Areas',
        'Security Access',
        'Near Campus'
      ],
      landlord: {
        name: 'Campus Living Solutions',
        email: 'housing@campusliving.com',
        phone: '(510) 555-0189'
      },
      manager: {
        name: 'Jennifer Park',
        email: 'jennifer@campusliving.com',
        phone: '(510) 555-0190',
        role: 'Student Housing Coordinator'
      },
      description: 'Modern student housing just minutes from UC Berkeley campus. Perfect for students seeking a convenient and safe living environment.',
      images: [
        'https://images.unsplash.com/photo-1555854877-bab0e564b8d5?w=800',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
      ],
      leaseStart: '2024-08-15',
      leaseEnd: '2025-05-15',
      emergencyContact: '(510) 555-HELP'
    },
    
    'demo-urban-loft': {
      id: 'demo-urban-loft',
      name: 'Industrial Loft',
      nickname: 'Industrial Loft - Unit 5',
      streetAddress: '321 Industrial Way',
      city: 'Oakland',
      state: 'CA',
      zipCode: '94607',
      unitNumber: '5',
      type: 'loft',
      bedrooms: 1,
      bathrooms: 1,
      squareFeet: 900,
      rent: 2800,
      deposit: 2800,
      petPolicy: 'Pets welcome',
      amenities: [
        'High Ceilings (14ft)',
        'Exposed Brick Walls',
        'Modern Kitchen',
        'Assigned Parking',
        'Industrial Windows',
        'Concrete Floors',
        'Open Floor Plan',
        'Artist-Friendly Space'
      ],
      landlord: {
        name: 'Urban Spaces Inc',
        email: 'leasing@urbanspaces.com',
        phone: '(510) 555-0234'
      },
      manager: {
        name: 'Alex Rivera',
        email: 'alex@urbanspaces.com',
        phone: '(510) 555-0235',
        role: 'Leasing Manager'
      },
      description: 'Unique loft space in converted warehouse with industrial charm and modern amenities. Perfect for artists and creative professionals.',
      images: [
        'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'
      ],
      leaseStart: '2024-03-01',
      leaseEnd: '2025-02-28',
      emergencyContact: '(510) 555-HELP'
    },
    
    'demo-budget-friendly': {
      id: 'demo-budget-friendly',
      name: 'Affordable Gardens',
      nickname: 'Affordable Gardens - Apt 12',
      streetAddress: '654 Garden Lane',
      city: 'San Jose',
      state: 'CA',
      zipCode: '95112',
      unitNumber: '12',
      type: 'apartment',
      bedrooms: 2,
      bathrooms: 1,
      squareFeet: 750,
      rent: 2200,
      deposit: 1100,
      petPolicy: 'Pet-friendly community',
      amenities: [
        'Community Garden Access',
        'On-site Laundry',
        'Covered Parking',
        'Pet-Friendly',
        'Playground',
        'BBQ Area',
        'Package Service',
        'Responsive Maintenance'
      ],
      landlord: {
        name: 'Community Housing Partners',
        email: 'info@communityhousing.org',
        phone: '(408) 555-0267'
      },
      manager: {
        name: 'Maria Gonzalez',
        email: 'maria@communityhousing.org',
        phone: '(408) 555-0268',
        role: 'Community Manager'
      },
      description: 'Affordable housing in a family-friendly community with garden access and great amenities. Perfect for budget-conscious renters.',
      images: [
        'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800',
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
      ],
      leaseStart: '2024-01-15',
      leaseEnd: '2024-12-31',
      emergencyContact: '(408) 555-HELP'
    }
  };
  
  return demoProperties[propertyId] || null;
};

/**
 * Get demo maintenance tickets for a property
 * @param {string} propertyId - Demo property ID
 * @param {string} tenantId - Tenant ID (for filtering)
 * @returns {Array} Array of demo maintenance tickets
 */
export const getDemoMaintenanceTickets = (propertyId, tenantId) => {
  const baseTickets = {
    'demo-luxury-highrise': [
      {
        id: 'demo-ticket-1',
        issueTitle: 'Air Conditioning Not Cooling Properly',
        description: 'The AC unit in the living room is running but not cooling the apartment effectively. Temperature stays around 78°F even when set to 68°F.',
        status: 'pending',
        urgency: 'medium',
        category: 'HVAC',
        submittedBy: tenantId,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        photoUrl: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400',
        propertyId: propertyId,
        unitNumber: '2401'
      },
      {
        id: 'demo-ticket-2',
        issueTitle: 'Dishwasher Leak',
        description: 'Small water leak under the dishwasher. Noticed water pooling on the kitchen floor after running a cycle.',
        status: 'in-progress',
        urgency: 'high',
        category: 'Plumbing',
        submittedBy: tenantId,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        assignedTo: 'Mike\'s Plumbing Services',
        estimatedCompletion: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Tomorrow
        propertyId: propertyId,
        unitNumber: '2401'
      },
      {
        id: 'demo-ticket-3',
        issueTitle: 'Elevator Button Malfunction',
        description: 'The button for floor 24 in the main elevator is not responding consistently. Sometimes need to press multiple times.',
        status: 'done',
        urgency: 'low',
        category: 'Building Systems',
        submittedBy: tenantId,
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
        completedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        resolution: 'Elevator technician replaced the button panel. Issue resolved.',
        propertyId: propertyId,
        unitNumber: '2401'
      }
    ],
    
    'demo-family-home': [
      {
        id: 'demo-ticket-4',
        issueTitle: 'Backyard Sprinkler System Issue',
        description: 'Two sprinkler heads in the backyard are not working. The grass in those areas is starting to brown.',
        status: 'pending',
        urgency: 'medium',
        category: 'Landscaping',
        submittedBy: tenantId,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        photoUrl: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400',
        propertyId: propertyId
      },
      {
        id: 'demo-ticket-5',
        issueTitle: 'Garage Door Remote Not Working',
        description: 'The garage door remote stopped working yesterday. The door can still be opened manually from inside.',
        status: 'done',
        urgency: 'medium',
        category: 'Electrical',
        submittedBy: tenantId,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        resolution: 'Replaced remote battery and reprogrammed the opener. Working perfectly now.',
        propertyId: propertyId
      }
    ],
    
    'demo-student-housing': [
      {
        id: 'demo-ticket-6',
        issueTitle: 'WiFi Connection Issues in Room',
        description: 'Internet connection is very slow and frequently drops in my room. Other students report similar issues on this floor.',
        status: 'in-progress',
        urgency: 'high',
        category: 'Technology',
        submittedBy: tenantId,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        assignedTo: 'Campus IT Services',
        estimatedCompletion: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
        propertyId: propertyId,
        unitNumber: '3B'
      }
    ],
    
    'demo-urban-loft': [
      {
        id: 'demo-ticket-7',
        issueTitle: 'Industrial Window Seal Issue',
        description: 'One of the large industrial windows has a broken seal and lets in cold air. Can feel a draft near the window.',
        status: 'pending',
        urgency: 'medium',
        category: 'Windows',
        submittedBy: tenantId,
        createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
        propertyId: propertyId,
        unitNumber: '5'
      }
    ],
    
    'demo-budget-friendly': [
      {
        id: 'demo-ticket-8',
        issueTitle: 'Washing Machine Not Draining',
        description: 'The washing machine in the laundry room is not draining properly. Water remains in the drum after the cycle completes.',
        status: 'pending',
        urgency: 'high',
        category: 'Appliances',
        submittedBy: tenantId,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        propertyId: propertyId,
        unitNumber: '12'
      },
      {
        id: 'demo-ticket-9',
        issueTitle: 'Community Garden Gate Lock',
        description: 'The lock on the community garden gate is sticking and difficult to open. Need to jiggle the key several times.',
        status: 'done',
        urgency: 'low',
        category: 'Security',
        submittedBy: tenantId,
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        resolution: 'Maintenance team lubricated and adjusted the lock mechanism. Gate now opens smoothly.',
        propertyId: propertyId,
        unitNumber: '12'
      }
    ]
  };
  
  return baseTickets[propertyId] || [];
};

/**
 * Get demo notifications for a tenant
 * @param {string} tenantId - Tenant ID
 * @param {string} propertyId - Property ID for context
 * @returns {Array} Array of demo notifications
 */
export const getDemoNotifications = (tenantId, propertyId) => {
  const property = getDemoProperty(propertyId);
  if (!property) return [];
  
  return [
    {
      id: 'demo-notif-1',
      title: 'Maintenance Request Update',
      message: `Your maintenance request for "${property.nickname}" has been assigned to a contractor.`,
      type: 'ticket_update',
      status: 'unread',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      relatedData: {
        ticketId: 'demo-ticket-2',
        propertyId: propertyId
      }
    },
    {
      id: 'demo-notif-2',
      title: 'AI Analysis Complete',
      message: 'Your maintenance request has been automatically categorized as "Plumbing" with high urgency.',
      type: 'request_completed',
      status: 'unread',
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      relatedData: {
        ticketId: 'demo-ticket-2',
        category: 'Plumbing',
        urgency: 'high'
      }
    },
    {
      id: 'demo-notif-3',
      title: 'Welcome to PropAgentic Demo!',
      message: `Welcome to ${property.name}! This is a demo property showcasing PropAgentic's features.`,
      type: 'property_invite',
      status: 'read',
      createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
      relatedData: {
        propertyId: propertyId
      }
    }
  ];
};

/**
 * Check if a property ID is a demo property
 * @param {string} propertyId - Property ID to check
 * @returns {boolean} True if it's a demo property
 */
export const isDemoProperty = (propertyId) => {
  return propertyId && propertyId.startsWith('demo-');
};

/**
 * Get all available demo properties for showcase
 * @returns {Array} Array of demo property summaries
 */
export const getAllDemoProperties = () => {
  return [
    {
      id: 'demo-luxury-highrise',
      name: 'Skyline Towers - Unit 2401',
      code: 'DEMO2024',
      type: 'Luxury High-Rise',
      description: 'Downtown San Francisco luxury apartment with city views'
    },
    {
      id: 'demo-family-home',
      name: 'Maple Street Family Home',
      code: 'FAMILY01',
      type: 'Family House',
      description: 'Spacious Palo Alto family home with yard'
    },
    {
      id: 'demo-student-housing',
      name: 'University Commons - Room 3B',
      code: 'STUDENT1',
      type: 'Student Housing',
      description: 'Modern student housing near UC Berkeley'
    },
    {
      id: 'demo-urban-loft',
      name: 'Industrial Loft - Unit 5',
      code: 'LOFT2024',
      type: 'Urban Loft',
      description: 'Converted warehouse loft in Oakland'
    },
    {
      id: 'demo-budget-friendly',
      name: 'Affordable Gardens - Apt 12',
      code: 'BUDGET99',
      type: 'Budget-Friendly',
      description: 'Affordable San Jose apartment with garden access'
    }
  ];
};

export default {
  getDemoProperty,
  getDemoMaintenanceTickets,
  getDemoNotifications,
  isDemoProperty,
  getAllDemoProperties
}; 