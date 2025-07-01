// MIGRATION: Transitioning to standardized service layer
// This file now serves as a compatibility bridge for existing code
// while providing access to the new standardized service

import { ContractorProfile } from '../../models/schema';
import { StandardContractorService } from '../base/StandardContractorService';
import { ServiceMigrationUtility } from '../base/ServiceMigrationUtility';
import { doc, getDoc, collection, query, where, getDocs, documentId, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { ContractorRegistration, ContractorRegistrationFormData, ContractorWaitlistEntry } from '../../models/ContractorRegistration';

// Create instance of the new standardized service
const standardContractorService = new StandardContractorService();

// List of available trades for validation
export const availableTrades = [
  'Plumbing', 'Electrical', 'HVAC', 'Carpentry', 'Painting', 'Roofing',
  'Flooring', 'Landscaping', 'Appliance Repair', 'General Maintenance',
  'Pest Control', 'Cleaning Services', 'Handyman Services'
];

/**
 * LEGACY COMPATIBILITY FUNCTIONS
 * These maintain backward compatibility while using the new service layer
 */

/**
 * Get a contractor profile by ID
 * @deprecated Use standardContractorService.getContractorProfile() instead
 */
export async function getContractorProfileById(contractorId: string): Promise<ContractorProfile | null> {
  const result = await standardContractorService.getContractorProfile(contractorId);
  return ServiceMigrationUtility.toLegacyFormat(result);
}

/**
 * Get all contractors for a landlord
 * @deprecated Use standardContractorService.getLandlordContractors() instead
 */
export async function getLandlordContractors(landlordId: string): Promise<ContractorProfile[]> {
  const result = await standardContractorService.getLandlordContractors(landlordId);
  return ServiceMigrationUtility.toLegacyFormat(result);
}

/**
 * Search for contractors based on search criteria
 * @deprecated Use standardContractorService.searchContractors() instead
 */
export async function searchContractors(
  searchParams: {
    skills?: string[];
    serviceArea?: string;
    minRating?: number;
    availability?: boolean;
  }
): Promise<ContractorProfile[]> {
  const result = await standardContractorService.searchContractors(searchParams);
  if (!result.success || !result.data) {
    throw new Error(result.error || 'Search failed');
  }
  return result.data.items;
}

/**
 * Update a contractor profile
 * @deprecated Use standardContractorService.updateContractorProfile() instead
 */
export async function updateContractorProfile(
  contractorId: string,
  profileData: Partial<ContractorProfile>
): Promise<void> {
  const result = await standardContractorService.updateContractorProfile(contractorId, profileData);
  if (!result.success) {
    throw new Error(result.error || 'Update failed');
  }
}

/**
 * Add a contractor to a landlord's rolodex
 * @deprecated Use standardContractorService.addToLandlordRolodex() instead
 */
export async function addContractorToRolodex(
  landlordId: string,
  contractorId: string
): Promise<void> {
  const result = await standardContractorService.addToLandlordRolodex(landlordId, contractorId);
  if (!result.success) {
    throw new Error(result.error || 'Failed to add contractor to rolodex');
  }
}

/**
 * Remove a contractor from a landlord's rolodex
 * @deprecated Use standardContractorService.removeFromLandlordRolodex() instead
 */
export async function removeContractorFromRolodex(
  landlordId: string,
  contractorId: string
): Promise<void> {
  const result = await standardContractorService.removeFromLandlordRolodex(landlordId, contractorId);
  if (!result.success) {
    throw new Error(result.error || 'Failed to remove contractor from rolodex');
  }
}

/**
 * Update contractor availability
 * @deprecated Use standardContractorService.updateAvailability() instead
 */
export async function updateContractorAvailability(
  contractorId: string,
  availability: boolean
): Promise<void> {
  const result = await standardContractorService.updateAvailability(contractorId, availability);
  if (!result.success) {
    throw new Error(result.error || 'Failed to update availability');
  }
}

/**
 * Update contractor skills
 * @deprecated Use standardContractorService.updateSkills() instead
 */
export async function updateContractorSkills(
  contractorId: string,
  skills: string[]
): Promise<void> {
  const result = await standardContractorService.updateSkills(contractorId, skills);
  if (!result.success) {
    throw new Error(result.error || 'Failed to update skills');
  }
}

/**
 * Get recommended contractors for a job
 * @deprecated Use standardContractorService.getRecommendedContractors() instead
 */
export async function getRecommendedContractors(
  category: string,
  propertyId?: string,
  landlordId?: string,
  limit: number = 3
): Promise<ContractorProfile[]> {
  const result = await standardContractorService.getRecommendedContractors({
    category,
    propertyId,
    landlordId,
    maxResults: limit
  });
  return ServiceMigrationUtility.toLegacyFormat(result);
}

/**
 * Fetches multiple contractor documents from the 'contractors' collection using a list of IDs.
 * @param {string[]} contractorIds - An array of contractor document IDs.
 * @returns {Promise<any[]>} A promise that resolves to an array of contractor objects.
 */
export const getContractorsByIds = async (contractorIds: string[]): Promise<any[]> => {
  // If there are no IDs, return an empty array immediately.
  if (!contractorIds || contractorIds.length === 0) {
    return [];
  }

  const contractors: any[] = [];
  // Firestore 'in' queries are limited to 30 items. Process in chunks if necessary.
  const chunks = [];
  for (let i = 0; i < contractorIds.length; i += 30) {
    chunks.push(contractorIds.slice(i, i + 30));
  }

  try {
    for (const chunk of chunks) {
      if (chunk.length === 0) continue;
      
      // Query the 'contractors' collection.
      const q = query(collection(db, 'contractors'), where(documentId(), 'in', chunk));
      const querySnapshot = await getDocs(q);
      
      querySnapshot.forEach((doc) => {
        contractors.push({ id: doc.id, ...doc.data() });
      });
    }
    console.log(`Successfully fetched ${contractors.length} contractor profiles.`);
    return contractors;

  } catch (error) {
    console.error("Error fetching contractors by IDs:", error);
    // Return an empty array in case of an error to prevent crashes.
    return [];
  }
};

/**
 * Registers a new contractor in Firestore.
 * Creates a simple registration record for initial contact.
 * 
 * @param formData - The contractor registration form data
 * @returns The ID of the newly created contractor registration document
 * @throws Throws an error if the Firestore operation fails
 */
export const registerContractor = async (
  formData: ContractorRegistrationFormData
): Promise<string> => {
  try {
    const registrationData: Omit<ContractorRegistration, 'id' | 'createdAt'> = {
      name: formData.name.trim(),
      phoneNumber: formData.phoneNumber.trim(),
      status: 'pending',
    };

    const docRef = await addDoc(collection(db, 'contractorRegistrations'), {
      ...registrationData,
      createdAt: serverTimestamp(),
    });

    console.log('Contractor registration created with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('Error registering contractor:', error);
    throw new Error('Failed to register. Please try again later.');
  }
};

/**
 * Registers a contractor for the enhanced waitlist with trade selection and experience.
 *
 * @param formData - The contractor's enhanced registration data.
 * @returns The ID of the newly created document.
 */
export const registerContractorForWaitlist = async (
  formData: Omit<ContractorWaitlistEntry, 'id' | 'createdAt' | 'status' | 'source'>
): Promise<string> => {
  try {
    // Basic validation before Firestore write
    if (!formData.name || formData.name.length < 2) {
      throw new Error('Validation Error: Name is required and must be at least 2 characters.');
    }
    if (formData.trades.length === 0) {
      throw new Error('Validation Error: At least one trade must be selected.');
    }

    const waitlistCollection = collection(db, 'contractorWaitlist');

    const newEntry: Omit<ContractorWaitlistEntry, 'id'> = {
      ...formData,
      createdAt: serverTimestamp() as any, // Let Firestore handle the timestamp
      status: 'pending',
      source: 'website-registration',
    };

    const docRef = await addDoc(waitlistCollection, newEntry);
    console.log('Contractor added to waitlist with ID:', docRef.id);
    return docRef.id;

  } catch (error) {
    console.error('Error registering contractor for waitlist:', error);
    // Re-throw the error to be handled by the calling component
    throw new Error('Failed to submit registration. Please try again.');
  }
};

// You may need to add this service to the default export if one exists
const contractorService = {
  // ... any existing functions
  getContractorsByIds,
  getContractorProfileById,
  getLandlordContractors,
  searchContractors,
  updateContractorProfile,
  addContractorToRolodex,
  removeContractorFromRolodex,
  updateContractorAvailability,
  updateContractorSkills,
  getRecommendedContractors,
  registerContractor,
  registerContractorForWaitlist,
};

export default contractorService;

/**
 * RECOMMENDED: Export the new standardized service for new code
 * Use this for all new implementations
 */
export { standardContractorService as contractorService };
export { StandardContractorService } from '../base/StandardContractorService';

/**
 * MIGRATION GUIDE:
 * 
 * OLD WAY:
 * import { getContractorProfileById } from './contractorService';
 * const contractor = await getContractorProfileById(id);
 * 
 * NEW WAY (Option 1 - Recommended):
 * import { contractorService } from './contractorService';
 * const result = await contractorService.getContractorProfile(id);
 * if (result.success) {
 *   const contractor = result.data;
 * }
 * 
 * NEW WAY (Option 2 - For gradual migration):
 * import { StandardContractorService } from '../base/StandardContractorService';
 * const service = new StandardContractorService();
 * const result = await service.getContractorProfile(id);
 */ 