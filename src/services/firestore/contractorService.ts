// MIGRATION: Transitioning to standardized service layer
// This file now serves as a compatibility bridge for existing code
// while providing access to the new standardized service

import { ContractorProfile } from '../../models/schema';
import { StandardContractorService } from '../base/StandardContractorService';
import { ServiceMigrationUtility } from '../base/ServiceMigrationUtility';

// Create instance of the new standardized service
const standardContractorService = new StandardContractorService();

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