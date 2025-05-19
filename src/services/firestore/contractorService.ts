import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc,
  query,
  where,
  orderBy,
  Timestamp,
  limit
} from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ContractorProfile, ContractorUser } from '../../models/schema';

/**
 * Get a contractor profile by ID
 */
export async function getContractorProfileById(contractorId: string): Promise<ContractorProfile | null> {
  const profileDoc = doc(db, 'contractorProfiles', contractorId);
  const profileSnapshot = await getDoc(profileDoc);
  
  if (profileSnapshot.exists()) {
    const data = profileSnapshot.data();
    return {
      contractorId: profileSnapshot.id,
      userId: data.userId,
      skills: data.skills || [],
      serviceArea: data.serviceArea || '',
      availability: data.availability || true,
      preferredProperties: data.preferredProperties || [],
      rating: data.rating || 0,
      jobsCompleted: data.jobsCompleted || 0,
      companyName: data.companyName
    };
  }
  
  return null;
}

/**
 * Get all contractors for a landlord
 */
export async function getLandlordContractors(landlordId: string): Promise<ContractorProfile[]> {
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (!landlordProfileSnapshot.exists()) {
    return [];
  }
  
  const contractorIds = landlordProfileSnapshot.data().contractors || [];
  
  if (contractorIds.length === 0) {
    return [];
  }
  
  const contractors: ContractorProfile[] = [];
  
  // Batch get all contractors
  for (const contractorId of contractorIds) {
    const contractorSnapshot = await getDoc(doc(db, 'contractorProfiles', contractorId));
    
    if (contractorSnapshot.exists()) {
      const data = contractorSnapshot.data();
      contractors.push({
        contractorId: contractorSnapshot.id,
        userId: data.userId,
        skills: data.skills || [],
        serviceArea: data.serviceArea || '',
        availability: data.availability || true,
        preferredProperties: data.preferredProperties || [],
        rating: data.rating || 0,
        jobsCompleted: data.jobsCompleted || 0,
        companyName: data.companyName
      });
    }
  }
  
  return contractors;
}

/**
 * Search for contractors based on search criteria
 */
export async function searchContractors(
  searchParams: {
    skills?: string[];
    serviceArea?: string;
    minRating?: number;
    availability?: boolean;
  }
): Promise<ContractorProfile[]> {
  // Start with a base query
  const baseQuery = collection(db, 'contractorProfiles');
  
  // Build query based on search parameters
  const queryConstraints = [];
  
  if (searchParams.availability !== undefined) {
    queryConstraints.push(where('availability', '==', searchParams.availability));
  }
  
  if (searchParams.minRating && searchParams.minRating > 0) {
    queryConstraints.push(where('rating', '>=', searchParams.minRating));
  }
  
  // Service area is more complex - for simplicity we'll just filter by exact match
  if (searchParams.serviceArea) {
    queryConstraints.push(where('serviceArea', '==', searchParams.serviceArea));
  }
  
  // Note: Firestore doesn't support querying for array containsAny along with other clauses,
  // so we might need to do the skills filtering in-memory for complex queries
  
  // Apply all the constraints
  const q = queryConstraints.length > 0 
    ? query(baseQuery, ...queryConstraints)
    : query(baseQuery);
  
  const querySnapshot = await getDocs(q);
  let results = querySnapshot.docs.map(doc => {
    const data = doc.data();
    return {
      contractorId: doc.id,
      userId: data.userId || doc.id,
      skills: data.skills || [],
      serviceArea: data.serviceArea || '',
      availability: data.availability || true,
      preferredProperties: data.preferredProperties || [],
      rating: data.rating || 0,
      jobsCompleted: data.jobsCompleted || 0,
      companyName: data.companyName
    } as ContractorProfile;
  });
  
  // If we have skills filter, apply it in-memory
  if (searchParams.skills && searchParams.skills.length > 0) {
    results = results.filter(contractor => {
      // Check if any of the searchParams.skills are in contractor.skills
      return searchParams.skills!.some(skill => 
        contractor.skills.includes(skill)
      );
    });
  }
  
  return results;
}

/**
 * Update a contractor profile
 */
export async function updateContractorProfile(
  contractorId: string,
  profileData: Partial<ContractorProfile>
): Promise<void> {
  const profileRef = doc(db, 'contractorProfiles', contractorId);
  await updateDoc(profileRef, profileData);
}

/**
 * Add a contractor to a landlord's rolodex
 */
export async function addContractorToRolodex(
  landlordId: string,
  contractorId: string
): Promise<void> {
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (landlordProfileSnapshot.exists()) {
    const contractors = landlordProfileSnapshot.data().contractors || [];
    
    // Add the contractor if not already in the list
    if (!contractors.includes(contractorId)) {
      await updateDoc(landlordProfileRef, {
        contractors: [...contractors, contractorId]
      });
    }
  }
}

/**
 * Remove a contractor from a landlord's rolodex
 */
export async function removeContractorFromRolodex(
  landlordId: string,
  contractorId: string
): Promise<void> {
  const landlordProfileRef = doc(db, 'landlordProfiles', landlordId);
  const landlordProfileSnapshot = await getDoc(landlordProfileRef);
  
  if (landlordProfileSnapshot.exists()) {
    const contractors = landlordProfileSnapshot.data().contractors || [];
    
    await updateDoc(landlordProfileRef, {
      contractors: contractors.filter((id: string) => id !== contractorId)
    });
  }
}

/**
 * Update contractor availability
 */
export async function updateContractorAvailability(
  contractorId: string,
  availability: boolean
): Promise<void> {
  const profileRef = doc(db, 'contractorProfiles', contractorId);
  await updateDoc(profileRef, { availability });
}

/**
 * Update contractor skills
 */
export async function updateContractorSkills(
  contractorId: string,
  skills: string[]
): Promise<void> {
  const profileRef = doc(db, 'contractorProfiles', contractorId);
  await updateDoc(profileRef, { skills });
  
  // Also update the user document
  const userRef = doc(db, 'users', contractorId);
  await updateDoc(userRef, { contractorSkills: skills });
}

/**
 * Get recommended contractors for a maintenance ticket
 */
export async function getRecommendedContractors(
  category: string,
  propertyId?: string,
  landlordId?: string,
  limit: number = 3
): Promise<ContractorProfile[]> {
  let contractors: ContractorProfile[] = [];
  
  // If we have a landlordId, first try to get contractors from their rolodex
  if (landlordId) {
    const landlordContractors = await getLandlordContractors(landlordId);
    
    // Filter by category and availability
    const matchingLandlordContractors = landlordContractors.filter(contractor => 
      contractor.skills.includes(category) && contractor.availability
    );
    
    contractors = matchingLandlordContractors;
    
    // If we found enough contractors, return them
    if (contractors.length >= limit) {
      return contractors.slice(0, limit);
    }
  }
  
  // If we didn't find enough contractors in the rolodex, search more broadly
  const moreContractors = await searchContractors({
    skills: [category],
    availability: true
  });
  
  // Filter out contractors we already have
  const existingIds = new Set(contractors.map(c => c.contractorId));
  const additionalContractors = moreContractors.filter(c => !existingIds.has(c.contractorId));
  
  // Combine the lists
  contractors = [...contractors, ...additionalContractors];
  
  // Return up to the limit
  return contractors.slice(0, limit);
} 