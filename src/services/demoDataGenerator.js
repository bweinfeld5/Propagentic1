// Demo data generator for PropAgentic pitch deck demo

export const generateBulkProperties = (count) => {
  const properties = [];
  const propertyTypes = ['Apartment Building', 'Single Family Home', 'Duplex', 'Condo', 'Townhouse'];
  const streets = ['Oak Street', 'Maple Avenue', 'Pine Road', 'Elm Way', 'Cedar Lane'];
  const cities = ['San Francisco, CA', 'Oakland, CA', 'Berkeley, CA', 'San Jose, CA', 'Palo Alto, CA'];
  
  for (let i = 0; i < count; i++) {
    properties.push({
      id: `bulk-property-${i + 1}`,
      name: `${propertyTypes[i % propertyTypes.length]} ${i + 1}`,
      address: `${Math.floor(Math.random() * 9000) + 1000} ${streets[i % streets.length]}, ${cities[i % cities.length]}`,
      type: propertyTypes[i % propertyTypes.length].toLowerCase().replace(' ', '-'),
      units: Math.floor(Math.random() * 20) + 1,
      yearBuilt: 2015 + Math.floor(Math.random() * 9),
      squareFootage: Math.floor(Math.random() * 3000) + 1000,
      rentAmount: Math.floor(Math.random() * 3000) + 1500,
      photos: [`https://source.unsplash.com/800x600/?property,${i + 1}`],
      amenities: ['Parking', 'Laundry', 'Pet Friendly'],
      createdAt: new Date()
    });
  }
  
  return properties;
};

export const generateDemoData = () => {
  return {
    landlord: {
      id: 'demo-landlord-1',
      name: 'Robert Johnson',
      email: 'robert.johnson@demo.propagentic.com',
      phone: '(555) 123-4567',
      company: 'Johnson Properties LLC',
      profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=robert',
      joinedDate: '2023-01-15',
      properties: []
    },
    
    properties: [
      // Pre-populate with demo properties for landlord selection
      {
        id: 'demo-property-1',
        name: 'Sunset Ridge Apartments',
        address: '123 Main Street, San Francisco, CA 94105',
        type: 'multi-family',
        units: 12,
        yearBuilt: 2018,
        squareFeet: 15000,
        amenities: ['Gym', 'Pool', 'Parking', 'Laundry'],
        photos: [
          'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800',
          'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800',
          'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'
        ],
        monthlyRent: 2500,
        occupancyRate: 92,
        addedDate: new Date().toISOString()
      },
      {
        id: 'demo-property-2',
        name: 'Apartment Building 1',
        address: '4779 Oak Street, San Francisco, CA',
        type: 'apartment-building',
        units: 8,
        yearBuilt: 2020,
        squareFeet: 12000,
        amenities: ['Parking', 'Laundry'],
        photos: ['https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800'],
        monthlyRent: 2200,
        occupancyRate: 88,
        addedDate: new Date().toISOString()
      },
      {
        id: 'demo-property-3',
        name: 'Single Family Home 2',
        address: '9965 Maple Avenue, Oakland, CA',
        type: 'single-family',
        units: 1,
        yearBuilt: 2019,
        squareFeet: 2500,
        amenities: ['Garden', 'Storage'],
        photos: ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'],
        monthlyRent: 3200,
        occupancyRate: 100,
        addedDate: new Date().toISOString()
      },
      {
        id: 'demo-property-4',
        name: 'Duplex 3',
        address: '9330 Pine Road, Berkeley, CA',
        type: 'duplex',
        units: 2,
        yearBuilt: 2017,
        squareFeet: 3000,
        amenities: ['Parking', 'Laundry'],
        photos: ['https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800'],
        monthlyRent: 2800,
        occupancyRate: 100,
        addedDate: new Date().toISOString()
      },
      {
        id: 'demo-property-5',
        name: 'Condo 4',
        address: '6493 Elm Way, San Jose, CA',
        type: 'condo',
        units: 1,
        yearBuilt: 2021,
        squareFeet: 1800,
        amenities: ['Parking', 'Laundry'],
        photos: ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800'],
        monthlyRent: 2600,
        occupancyRate: 100,
        addedDate: new Date().toISOString()
      },
      {
        id: 'demo-property-6',
        name: 'Townhouse 5',
        address: '1287 Cedar Lane, Palo Alto, CA',
        type: 'townhouse',
        units: 1,
        yearBuilt: 2022,
        squareFeet: 2200,
        amenities: ['Garden', 'Storage'],
        photos: ['https://images.unsplash.com/photo-1518780664697-55e3ad937233?w=800'],
        monthlyRent: 3800,
        occupancyRate: 100,
        addedDate: new Date().toISOString()
      }
    ],
    
    tenants: [
      // Pre-populate with one demo tenant
      {
        id: 'demo-tenant-1',
        name: 'Sarah Johnson',
        email: 'sarah.johnson@demo.propagentic.com',
        phone: '(555) 987-6543',
        profilePhoto: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sarah',
        propertyId: 'demo-property-1',
        unit: '3B',
        leaseStart: '2023-06-01',
        leaseEnd: '2024-05-31',
        monthlyRent: 2500,
        paymentStatus: 'current',
        joinedDate: '2023-05-28'
      }
    ],
    
    maintenanceRequests: [
      // Pre-populate with sample maintenance requests
      {
        id: 'demo-request-1',
        tenantId: 'demo-tenant-1',
        propertyId: 'demo-property-1',
        unit: '3B',
        category: 'plumbing',
        priority: 'medium',
        status: 'completed',
        title: 'Leaky faucet in kitchen',
        description: 'The kitchen faucet has been dripping for the past few days.',
        photos: ['https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=400'],
        submittedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        responseTime: 45 * 60 * 1000, // 45 minutes in milliseconds
        completedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        satisfaction: 5
      },
      {
        id: 'demo-request-2',
        tenantId: 'demo-tenant-1',
        propertyId: 'demo-property-1',
        unit: '3B',
        category: 'electrical',
        priority: 'low',
        status: 'in-progress',
        title: 'Bedroom light flickering',
        description: 'The overhead light in the master bedroom flickers occasionally.',
        photos: [],
        submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        responseTime: 2 * 60 * 60 * 1000, // 2 hours in milliseconds
        satisfaction: null
      }
    ],
    
    invitations: []
  };
};



// Generate demo maintenance categories
export const maintenanceCategories = [
  { id: 'plumbing', label: 'Plumbing', icon: '🚰' },
  { id: 'electrical', label: 'Electrical', icon: '💡' },
  { id: 'hvac', label: 'HVAC', icon: '❄️' },
  { id: 'appliances', label: 'Appliances', icon: '🔧' },
  { id: 'structural', label: 'Structural', icon: '🏠' },
  { id: 'pest', label: 'Pest Control', icon: '🐛' },
  { id: 'other', label: 'Other', icon: '📋' }
];

// Generate demo vendor list
export const generateVendors = () => [
  { id: 'vendor-1', name: 'Quick Fix Plumbing', specialty: 'plumbing', rating: 4.8, responseTime: '< 1 hour' },
  { id: 'vendor-2', name: 'Bright Spark Electric', specialty: 'electrical', rating: 4.9, responseTime: '< 2 hours' },
  { id: 'vendor-3', name: 'Cool Breeze HVAC', specialty: 'hvac', rating: 4.7, responseTime: '< 4 hours' },
  { id: 'vendor-4', name: 'All-Pro Maintenance', specialty: 'general', rating: 4.6, responseTime: '< 3 hours' }
];

// Generate response templates
export const maintenanceResponseTemplates = [
  {
    id: 'template-1',
    title: 'Immediate Response',
    message: "Hi {tenantName}, I've received your maintenance request. I'll send someone to look at this issue tomorrow morning between 9-11 AM. Is this time convenient for you?"
  },
  {
    id: 'template-2',
    title: 'Schedule Repair',
    message: "Hi {tenantName}, Thank you for reporting this issue. I've scheduled our {vendorType} technician to visit on {date} at {time}. They'll text you 30 minutes before arrival."
  },
  {
    id: 'template-3',
    title: 'Need More Info',
    message: "Hi {tenantName}, I've reviewed your request. Could you please provide a bit more detail about {issue}? This will help me send the right technician. Thanks!"
  }
];

// Competitor comparison data for demo
export const competitorData = {
  propagentic: {
    name: 'PropAgentic',
    setupTime: '2 minutes',
    responseTime: '12 minutes',
    price: '$15-30/property',
    features: ['Mobile-first', 'Real-time updates', 'AI categorization', 'Instant notifications'],
    satisfaction: 4.7
  },
  competitors: [
    {
      name: 'BuildiumPro',
      setupTime: '2-3 weeks',
      responseTime: '47 hours',
      price: '$50-100/property',
      features: ['Desktop only', 'Daily email updates', 'Manual categorization', 'Email only'],
      satisfaction: 3.1
    },
    {
      name: 'AppFolio',
      setupTime: '1-2 weeks',
      responseTime: '24 hours',
      price: '$75-150/property',
      features: ['Mobile app', 'Hourly updates', 'Basic categorization', 'Email + SMS'],
      satisfaction: 3.5
    }
  ]
}; 