// Test fixtures for Tenant Dashboard Backend tests

// Mock property data
export const mockProperty = {
  id: "property-123",
  name: "Sunny Apartments",
  address: {
    street: "123 Main St",
    city: "San Francisco",
    state: "CA",
    zip: "94105"
  },
  landlordId: "landlord-123",
  managerId: "manager-123", 
  photos: ["https://example.com/photo1.jpg", "https://example.com/photo2.jpg"],
  units: [
    {
      id: "unit-1",
      unitNumber: "101",
      floor: 1,
      bedrooms: 2,
      bathrooms: 1,
      tenants: ["tenant-123"]
    },
    {
      id: "unit-2",
      unitNumber: "102",
      floor: 1,
      bedrooms: 1,
      bathrooms: 1,
      tenants: ["tenant-456"]
    }
  ],
  createdAt: new Date("2023-01-01"),
  updatedAt: new Date("2023-01-15")
};

// Mock landlord/manager data
export const mockLandlord = {
  id: "landlord-123",
  displayName: "John Doe",
  email: "john@property.com",
  phone: "555-123-4567",
  userType: "landlord",
  properties: ["property-123", "property-456"]
};

// Mock tenant data
export const mockTenant = {
  id: "tenant-123",
  displayName: "Alice Smith",
  email: "alice@example.com",
  phone: "555-987-6543",
  userType: "tenant",
  properties: [{ id: "property-123", role: "tenant" }],
  propertyId: "property-123",
  unitId: "unit-1"
};

// Mock invite data
export const mockInvite = {
  inviteId: "invite-123",
  tenantEmail: "alice@example.com",
  landlordId: "landlord-123",
  propertyId: "property-123",
  unitNumber: "101",
  status: "pending",
  role: "tenant",
  createdAt: new Date("2023-05-01"),
  expiresAt: new Date("2023-06-01"),
  // These fields will be added by the enhanced service
  propertyName: undefined,
  propertyAddress: undefined,
  propertyPhoto: undefined,
  managerName: undefined,
  managerEmail: undefined,
  managerPhone: undefined,
  unitDetails: undefined
};

// Mock inviteCode data
export const mockInviteCode = {
  id: "code-123",
  code: "ABC123XYZ",
  propertyId: "property-123",
  landlordId: "landlord-123",
  unitId: "unit-1",
  used: false,
  createdAt: new Date("2023-05-01"),
  expiresAt: new Date("2023-06-01"),
  usedBy: null,
  usedAt: null
};

// Mock used inviteCode
export const mockUsedInviteCode = {
  ...mockInviteCode,
  id: "code-456",
  code: "DEF456UVW",
  used: true,
  usedBy: "tenant-456",
  usedAt: new Date("2023-05-15")
};

// Helper function to create Firestore timestamps
export const createTimestamp = (date: Date) => {
  return {
    toDate: () => date,
    toMillis: () => date.getTime(),
    seconds: Math.floor(date.getTime() / 1000),
    nanoseconds: (date.getTime() % 1000) * 1000000
  };
};

// Convert fixtures to Firestore format (with timestamps)
export const firestoreProperty = {
  ...mockProperty,
  createdAt: createTimestamp(mockProperty.createdAt),
  updatedAt: createTimestamp(mockProperty.updatedAt)
};

export const firestoreInvite = {
  ...mockInvite,
  createdAt: createTimestamp(mockInvite.createdAt),
  expiresAt: createTimestamp(mockInvite.expiresAt)
};

export const firestoreInviteCode = {
  ...mockInviteCode,
  createdAt: createTimestamp(mockInviteCode.createdAt),
  expiresAt: createTimestamp(mockInviteCode.expiresAt)
};

export const firestoreUsedInviteCode = {
  ...mockUsedInviteCode,
  createdAt: createTimestamp(mockUsedInviteCode.createdAt),
  expiresAt: createTimestamp(mockUsedInviteCode.expiresAt),
  usedAt: createTimestamp(mockUsedInviteCode.usedAt as Date)
}; 