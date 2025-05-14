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
import { 
  userConverter, 
  createNewUser, 
  createNewTenantUser, 
  createNewLandlordUser, 
  createNewContractorUser,
  createNewLandlordProfile,
  createNewContractorProfile
} from '../../models/converters';

// Collection references
const usersCollection = collection(db, 'users').withConverter(userConverter);
const landlordProfilesCollection = collection(db, 'landlordProfiles');
const contractorProfilesCollection = collection(db, 'contractorProfiles');

/**
 * Get a user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = doc(db, 'users', userId).withConverter(userConverter);
  const userSnapshot = await getDoc(userDoc);
  
  if (userSnapshot.exists()) {
    return userSnapshot.data();
  }
  
  return null;
}

/**
 * Find a user by email
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  const q = query(usersCollection, where('email', '==', email));
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    return querySnapshot.docs[0].data();
  }
  
  return null;
}

/**
 * Create a new user
 */
export async function createUser(
  userId: string,
  role: User['role'],
  name: string,
  email: string,
  phone?: string
): Promise<User> {
  const userRef = doc(db, 'users', userId);
  const userData = createNewUser(userId, role, name, email, phone);
  
  await setDoc(userRef, userData);
  
  // Create role-specific profile if needed
  if (role === 'landlord') {
    await createLandlordProfile(userId);
  } else if (role === 'contractor') {
    await createContractorProfile(userId);
  }
  
  return userData;
}

/**
 * Create a new tenant user
 */
export async function createTenantUser(
  userId: string,
  name: string,
  email: string,
  landlordId: string,
  propertyId: string,
  unitNumber: string,
  phone?: string
): Promise<TenantUser> {
  const userRef = doc(db, 'users', userId);
  const userData = createNewTenantUser(
    userId, 
    name, 
    email, 
    landlordId, 
    propertyId, 
    unitNumber, 
    phone
  );
  
  await setDoc(userRef, userData);
  
  // Add tenant to landlord's profile
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (landlordProfileSnapshot.exists()) {
    await updateDoc(landlordProfileRef, {
      tenants: [...(landlordProfileSnapshot.data().tenants || []), userId]
    });
  }
  
  return userData;
}

/**
 * Create a new landlord user
 */
export async function createLandlordUser(
  userId: string,
  name: string,
  email: string,
  phone?: string
): Promise<LandlordUser> {
  const userRef = doc(db, 'users', userId);
  const userData = createNewLandlordUser(userId, name, email, phone);
  
  await setDoc(userRef, userData);
  
  // Create landlord profile
  await createLandlordProfile(userId);
  
  return userData;
}

/**
 * Create a new contractor user
 */
export async function createContractorUser(
  userId: string,
  name: string,
  email: string,
  skills: string[] = [],
  phone?: string,
  companyId?: string
): Promise<ContractorUser> {
  const userRef = doc(db, 'users', userId);
  const userData = createNewContractorUser(userId, name, email, skills, phone, companyId);
  
  await setDoc(userRef, userData);
  
  // Create contractor profile
  await createContractorProfile(userId, skills);
  
  return userData;
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
 * Create a landlord profile
 */
export async function createLandlordProfile(landlordId: string): Promise<LandlordProfile> {
  const profileRef = doc(db, 'landlordProfiles', landlordId);
  const profileData = createNewLandlordProfile(landlordId);
  
  await setDoc(profileRef, profileData);
  
  return profileData;
}

/**
 * Create a contractor profile
 */
export async function createContractorProfile(
  contractorId: string,
  skills: string[] = [],
  serviceArea: ContractorProfile['serviceArea'] = '',
  companyName?: string
): Promise<ContractorProfile> {
  const profileRef = doc(db, 'contractorProfiles', contractorId);
  const profileData = createNewContractorProfile(contractorId, skills, serviceArea, companyName);
  
  await setDoc(profileRef, profileData);
  
  return profileData;
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
    const tenantSnapshot = await getDoc(doc(db, 'users', tenantId).withConverter(userConverter));
    
    if (tenantSnapshot.exists()) {
      tenants.push(tenantSnapshot.data());
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