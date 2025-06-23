import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { 
  User, 
  TenantUser, 
  LandlordUser, 
  ContractorUser, 
  LandlordProfile,
  ContractorProfile
} from '../../models/schema';

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = doc(db, 'users', userId);
  const userSnapshot = await getDoc(userDoc);
  
  if (userSnapshot.exists()) {
    const data = userSnapshot.data();
    return {
      uid: userSnapshot.id,
      role: data.role,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      linkedTo: data.linkedTo || [],
      createdAt: data.createdAt,
      profileComplete: data.profileComplete || false
    };
  }
  
  return null;
}

/**
 * Find a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const q = query(collection(db, 'users'), where('email', '==', email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const userSnapshot = querySnapshot.docs[0];
    const data = userSnapshot.data();
    return {
      uid: userSnapshot.id,
      role: data.role,
      name: data.name,
      email: data.email,
      phone: data.phone || '',
      linkedTo: data.linkedTo || [],
      createdAt: data.createdAt,
      profileComplete: data.profileComplete || false
    };
  }
  
  return null;
}

/**
 * Create a new user
 */
export async function createUser(
  uid: string,
  role: User['role'],
  name: string,
  email: string,
  phone?: string
): Promise<User> {
  const user: User = {
    uid,
    role,
    name,
    email,
    phone: phone || '',
    linkedTo: [],
    createdAt: Timestamp.now(),
    profileComplete: false
  };
  
  await setDoc(doc(db, 'users', uid), user);
  
  return user;
}

/**
 * Create a new tenant user
 */
export async function createTenantUser(
  uid: string,
  name: string,
  email: string,
  landlordId: string,
  propertyId: string,
  unitNumber: string,
  phone?: string
): Promise<TenantUser> {
  const user: TenantUser = {
    uid,
    role: 'tenant',
    name,
    email,
    phone: phone || '',
    linkedTo: [],
    createdAt: Timestamp.now(),
    profileComplete: false,
    landlordId,
    propertyId,
    unitNumber
  };
  
  await setDoc(doc(db, 'users', uid), user);
  
  return user;
}

/**
 * Create a new landlord user
 */
export async function createLandlordUser(
  uid: string,
  name: string,
  email: string,
  phone?: string
): Promise<LandlordUser> {
  const user: LandlordUser = {
    uid,
    role: 'landlord',
    name,
    email,
    phone: phone || '',
    linkedTo: [],
    createdAt: Timestamp.now(),
    profileComplete: false
  };
  
  await setDoc(doc(db, 'users', uid), user);
  
  return user;
}

/**
 * Create a new contractor user
 */
export async function createContractorUser(
  uid: string,
  name: string,
  email: string,
  skills: string[] = [],
  phone?: string,
  companyId?: string
): Promise<ContractorUser> {
  const user: ContractorUser = {
    uid,
    role: 'contractor',
    name,
    email,
    phone: phone || '',
    linkedTo: [],
    createdAt: Timestamp.now(),
    profileComplete: false,
    contractorSkills: skills,
    companyId
  };
  
  await setDoc(doc(db, 'users', uid), user);
  
  return user;
}

/**
 * Update a user
 */
export async function updateUser(userId: string, userData: Partial<User>): Promise<void> {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    ...userData,
    // Always update the timestamp when updating
    'updatedAt': Timestamp.now()
  });
}

/**
 * Create a new landlord profile
 */
export async function createLandlordProfile(
  landlordId: string
): Promise<LandlordProfile> {
  const profile: LandlordProfile = {
    landlordId,
    userId: landlordId,
    properties: [],
    tenants: [],
    contractors: [],
    invitesSent: []
  };
  
  await setDoc(doc(db, 'landlordProfiles', landlordId), profile);
  
  return profile;
}

/**
 * Create a new contractor profile
 */
export async function createContractorProfile(
  contractorId: string,
  skills: string[] = [],
  serviceArea: ContractorProfile['serviceArea'] = '',
  companyName?: string
): Promise<ContractorProfile> {
  const profile: ContractorProfile = {
    contractorId,
    userId: contractorId,
    skills,
    serviceArea,
    availability: true,
    preferredProperties: [],
    rating: 0,
    jobsCompleted: 0,
    companyName
  };
  
  await setDoc(doc(db, 'contractorProfiles', contractorId), profile);
  
  return profile;
}

/**
 * Get tenants for a landlord
 */
export async function getLandlordTenants(landlordId: string): Promise<User[]> {
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (!landlordProfileSnapshot.exists()) {
    return [];
  }
  
  const tenantIds = landlordProfileSnapshot.data().tenants || [];
  
  if (tenantIds.length === 0) {
    return [];
  }
  
  const tenants: User[] = [];
  
  // Batch get all tenants
  for (const tenantId of tenantIds) {
    const tenantSnapshot = await getDoc(doc(db, 'users', tenantId));
    
    if (tenantSnapshot.exists()) {
      const data = tenantSnapshot.data();
      tenants.push({
        uid: tenantSnapshot.id,
        role: data.role,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        linkedTo: data.linkedTo || [],
        createdAt: data.createdAt,
        profileComplete: data.profileComplete || false
      });
    }
  }
  
  return tenants;
}

/**
 * Link a tenant to a landlord
 */
export async function linkTenantToLandlord(
  tenantId: string,
  landlordId: string,
  propertyId: string,
  unitNumber: string
): Promise<void> {
  // Update tenant document
  const tenantRef = doc(db, 'users', tenantId);
  await updateDoc(tenantRef, {
    landlordId,
    propertyId,
    unitNumber,
    linkedTo: [propertyId]
  });
  
  // Update landlord profile
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (landlordProfileSnapshot.exists()) {
    const tenants = landlordProfileSnapshot.data().tenants || [];
    
    // Add tenant if not already in the list
    if (!tenants.includes(tenantId)) {
      await updateDoc(landlordProfileRef, {
        tenants: [...tenants, tenantId]
      });
    }
  }
  
  // Update property document
  const propertyRef = doc(db, 'properties', propertyId);
  const propertySnapshot = await getDoc(propertyRef);
  
  if (propertySnapshot.exists()) {
    const tenantIds = propertySnapshot.data().tenantIds || [];
    
    // Add tenant if not already in the list
    if (!tenantIds.includes(tenantId)) {
      await updateDoc(propertyRef, {
        tenantIds: [...tenantIds, tenantId]
      });
    }
  }
} 