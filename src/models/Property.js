/**
 * Property Model - PropAgentic
 * 
 * Defines property data structure and Firebase converters
 */

// Property data structure
export const PropertyType = {
  APARTMENT: 'apartment',
  HOUSE: 'house',
  CONDO: 'condo',
  COMMERCIAL: 'commercial',
  TOWNHOUSE: 'townhouse',
  STUDIO: 'studio'
};

export const PropertyStatus = {
  OCCUPIED: 'occupied',
  VACANT: 'vacant',
  MAINTENANCE: 'maintenance',
  MARKETING: 'marketing',
  UNAVAILABLE: 'unavailable'
};

// Property interface (TypeScript-style for documentation)
export const PropertySchema = {
  id: 'string',
  name: 'string',
  description: 'string',
  type: 'PropertyType',
  status: 'PropertyStatus',
  
  // Address
  address: {
    street: 'string',
    city: 'string',
    state: 'string',
    zipCode: 'string',
    country: 'string',
    coordinates: {
      lat: 'number',
      lng: 'number'
    }
  },
  
  // Property details
  bedrooms: 'number',
  bathrooms: 'number',
  squareFootage: 'number',
  yearBuilt: 'number',
  lotSize: 'number',
  
  // Financial
  monthlyRent: 'number',
  securityDeposit: 'number',
  propertyValue: 'number',
  monthlyExpenses: 'number',
  
  // Photos and documents
  photos: ['string'], // URLs
  documents: ['string'], // URLs
  
  // Relationships
  tenantId: 'string|null', // Legacy field
  tenants: ['string'], // Array of tenant user IDs
  leaseId: 'string|null',
  
  // Amenities
  amenities: ['string'],
  petPolicy: {
    allowed: 'boolean',
    deposit: 'number',
    restrictions: 'string'
  },
  
  // Management
  ownerId: 'string',
  managementCompany: 'string|null',
  
  // Timestamps
  createdAt: 'timestamp',
  updatedAt: 'timestamp',
  
  // Additional metadata
  featured: 'boolean',
  notes: 'string'
};

// Default property values
export const createDefaultProperty = (ownerId) => ({
  name: '',
  description: '',
  type: PropertyType.APARTMENT,
  status: PropertyStatus.VACANT,
  
  address: {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    coordinates: null
  },
  
  bedrooms: 1,
  bathrooms: 1,
  squareFootage: null,
  yearBuilt: null,
  lotSize: null,
  
  monthlyRent: 0,
  securityDeposit: 0,
  propertyValue: 0,
  monthlyExpenses: 0,
  
  photos: [],
  documents: [],
  
  tenantId: null,
  tenants: [], // Array of tenant user IDs
  leaseId: null,
  
  amenities: [],
  petPolicy: {
    allowed: false,
    deposit: 0,
    restrictions: ''
  },
  
  ownerId,
  managementCompany: null,
  
  featured: false,
  notes: ''
});

// Firebase converter
export const propertyConverter = {
  toFirestore: (property) => {
    const { id, ...propertyData } = property;
    return {
      ...propertyData,
      updatedAt: new Date()
    };
  },
  
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    return {
      id: snapshot.id,
      ...data,
      createdAt: data.createdAt?.toDate(),
      updatedAt: data.updatedAt?.toDate()
    };
  }
};

// Validation helpers
export const validateProperty = (property) => {
  const errors = {};
  
  if (!property.name?.trim()) {
    errors.name = 'Property name is required';
  }
  
  if (!property.address?.street?.trim()) {
    errors['address.street'] = 'Street address is required';
  }
  
  if (!property.address?.city?.trim()) {
    errors['address.city'] = 'City is required';
  }
  
  if (!property.address?.state?.trim()) {
    errors['address.state'] = 'State is required';
  }
  
  if (!property.address?.zipCode?.trim()) {
    errors['address.zipCode'] = 'ZIP code is required';
  }
  
  if (property.monthlyRent < 0) {
    errors.monthlyRent = 'Monthly rent must be positive';
  }
  
  if (property.bedrooms < 0) {
    errors.bedrooms = 'Bedrooms must be positive';
  }
  
  if (property.bathrooms < 0) {
    errors.bathrooms = 'Bathrooms must be positive';
  }
  
  return errors;
};

// Property utility functions
export const formatPropertyAddress = (property) => {
  const { address } = property;
  if (!address) return 'No address';
  
  const parts = [
    address.street,
    address.city,
    address.state,
    address.zipCode
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const formatPropertyRent = (property) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0
  }).format(property.monthlyRent);
};

export const getPropertyStatusColor = (status) => {
  const colors = {
    [PropertyStatus.OCCUPIED]: 'success',
    [PropertyStatus.VACANT]: 'warning',
    [PropertyStatus.MAINTENANCE]: 'danger',
    [PropertyStatus.MARKETING]: 'info',
    [PropertyStatus.UNAVAILABLE]: 'secondary'
  };
  
  return colors[status] || 'secondary';
};

export const getPropertyTypeLabel = (type) => {
  const labels = {
    [PropertyType.APARTMENT]: 'Apartment',
    [PropertyType.HOUSE]: 'House',
    [PropertyType.CONDO]: 'Condominium',
    [PropertyType.COMMERCIAL]: 'Commercial',
    [PropertyType.TOWNHOUSE]: 'Townhouse',
    [PropertyType.STUDIO]: 'Studio'
  };
  
  return labels[type] || type;
};

export default {
  PropertyType,
  PropertyStatus,
  PropertySchema,
  createDefaultProperty,
  propertyConverter,
  validateProperty,
  formatPropertyAddress,
  formatPropertyRent,
  getPropertyStatusColor,
  getPropertyTypeLabel
}; 