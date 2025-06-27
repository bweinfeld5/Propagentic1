import { where, orderBy, limit } from 'firebase/firestore';
import { BaseFirestoreService, ServiceResult, PaginatedResult } from './BaseFirestoreService';
import { ContractorProfile } from '../../models/schema';
import { contractorProfileConverter } from '../../models/converters';

/**
 * Contractor search parameters interface
 */
interface ContractorSearchParams {
  skills?: string[];
  serviceArea?: string;
  minRating?: number;
  availability?: boolean;
  maxDistance?: number;
  priceRange?: {
    min: number;
    max: number;
  };
}

/**
 * Contractor recommendation parameters
 */
interface ContractorRecommendationParams {
  category: string;
  propertyId?: string;
  landlordId?: string;
  maxResults?: number;
  excludeIds?: string[];
}

/**
 * Standardized Contractor Service
 * Extends BaseFirestoreService with contractor-specific operations
 */
export class StandardContractorService extends BaseFirestoreService<ContractorProfile> {
  constructor() {
    super('contractorProfiles', contractorProfileConverter);
    
    // Configure caching for contractor data (longer TTL due to less frequent changes)
    this.configureCaching({
      enabled: true,
      ttl: 10 * 60 * 1000, // 10 minutes
      maxSize: 200
    });
  }

  // =============================================
  // CONTRACTOR-SPECIFIC OPERATIONS
  // =============================================

  /**
   * Get contractor profile by ID with enhanced data
   */
  async getContractorProfile(contractorId: string): Promise<ServiceResult<ContractorProfile | null>> {
    return await this.getById(contractorId);
  }

  /**
   * Create a new contractor profile
   */
  async createContractorProfile(
    contractorData: Omit<ContractorProfile, 'contractorId' | 'createdAt' | 'updatedAt'>,
    contractorId?: string
  ): Promise<ServiceResult<ContractorProfile>> {
    const profileData = {
      ...contractorData,
      contractorId: contractorId || '', // Will be set by Firestore if not provided
      rating: contractorData.rating || 0,
      jobsCompleted: contractorData.jobsCompleted || 0,
      availability: contractorData.availability !== undefined ? contractorData.availability : true,
      skills: contractorData.skills || [],
      preferredProperties: contractorData.preferredProperties || []
    };

    return await this.create(profileData, contractorId);
  }

  /**
   * Update contractor profile
   */
  async updateContractorProfile(
    contractorId: string,
    updates: Partial<ContractorProfile>
  ): Promise<ServiceResult<ContractorProfile>> {
    return await this.update(contractorId, updates);
  }

  /**
   * Search contractors with advanced filtering
   */
  async searchContractors(
    searchParams: ContractorSearchParams,
    pagination?: { limit?: number; page?: number }
  ): Promise<ServiceResult<PaginatedResult<ContractorProfile>>> {
    try {
      const filters = [];

      // Basic availability filter
      if (searchParams.availability !== undefined) {
        filters.push(where('availability', '==', searchParams.availability));
      }

      // Rating filter
      if (searchParams.minRating && searchParams.minRating > 0) {
        filters.push(where('rating', '>=', searchParams.minRating));
      }

      // Service area filter (exact match for now - could be enhanced with geo queries)
      if (searchParams.serviceArea) {
        filters.push(where('serviceArea', '==', searchParams.serviceArea));
      }

      // Add ordering by rating (descending) and jobs completed
      const paginationOptions = {
        limit: pagination?.limit || 20,
        orderBy: [
          { field: 'rating', direction: 'desc' as const },
          { field: 'jobsCompleted', direction: 'desc' as const }
        ]
      };

      // Get filtered results
      const result = await this.list(filters, paginationOptions);

      if (!result.success || !result.data) {
        return result;
      }

      // Apply in-memory filtering for complex criteria
      let filteredItems = result.data.items;

      // Skills filtering (in-memory due to Firestore limitations)
      if (searchParams.skills && searchParams.skills.length > 0) {
        filteredItems = filteredItems.filter(contractor => {
          return searchParams.skills!.some(skill => 
            contractor.skills.includes(skill)
          );
        });
      }

      // Price range filtering
      if (searchParams.priceRange && 'hourlyRate' in filteredItems[0]) {
        filteredItems = filteredItems.filter(contractor => {
          const rate = (contractor as any).hourlyRate;
          if (!rate) return true; // Include contractors without rates
          
          return rate >= searchParams.priceRange!.min && 
                 rate <= searchParams.priceRange!.max;
        });
      }

      return {
        success: true,
        data: {
          ...result.data,
          items: filteredItems,
          totalCount: filteredItems.length
        },
        timestamp: new Date(),
        cached: result.cached
      };
    } catch (error) {
      return this.handleError('searchContractors', error);
    }
  }

  /**
   * Get contractors for a specific landlord
   */
  async getLandlordContractors(landlordId: string): Promise<ServiceResult<ContractorProfile[]>> {
    try {
      // First get the landlord profile to get contractor IDs
      // This would need to be adapted based on your landlord profile structure
      const landlordContractorIds = await this.getLandlordContractorIds(landlordId);
      
      if (landlordContractorIds.length === 0) {
        return {
          success: true,
          data: [],
          timestamp: new Date()
        };
      }

      // Batch get contractor profiles
      const contractorResults = await Promise.all(
        landlordContractorIds.map(id => this.getById(id))
      );

      const contractors = contractorResults
        .filter(result => result.success && result.data)
        .map(result => result.data!);

      return {
        success: true,
        data: contractors,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('getLandlordContractors', error);
    }
  }

  /**
   * Get recommended contractors for a job
   */
  async getRecommendedContractors(
    params: ContractorRecommendationParams
  ): Promise<ServiceResult<ContractorProfile[]>> {
    try {
      let contractors: ContractorProfile[] = [];

      // First try to get contractors from landlord's rolodex if provided
      if (params.landlordId) {
        const landlordResult = await this.getLandlordContractors(params.landlordId);
        if (landlordResult.success && landlordResult.data) {
          // Filter by category and availability
          const matchingContractors = landlordResult.data.filter(contractor => 
            contractor.skills.includes(params.category) && 
            contractor.availability &&
            !params.excludeIds?.includes(contractor.contractorId)
          );
          contractors = matchingContractors;
        }
      }

      // If we need more contractors, search broadly
      const maxResults = params.maxResults || 3;
      if (contractors.length < maxResults) {
        const searchResult = await this.searchContractors({
          skills: [params.category],
          availability: true
        }, {
          limit: maxResults * 2 // Get more to filter from
        });

        if (searchResult.success && searchResult.data) {
          // Filter out existing contractors and excluded IDs
          const existingIds = new Set(contractors.map(c => c.contractorId));
          const excludeIds = new Set(params.excludeIds || []);
          
          const additionalContractors = searchResult.data.items.filter(c => 
            !existingIds.has(c.contractorId) && !excludeIds.has(c.contractorId)
          );
          
          contractors = [...contractors, ...additionalContractors];
        }
      }

      // Sort by rating and limit results
      contractors.sort((a, b) => {
        // Primary sort: rating (descending)
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        // Secondary sort: jobs completed (descending)
        return b.jobsCompleted - a.jobsCompleted;
      });

      const result = contractors.slice(0, maxResults);

      return {
        success: true,
        data: result,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('getRecommendedContractors', error);
    }
  }

  /**
   * Update contractor availability
   */
  async updateAvailability(
    contractorId: string, 
    availability: boolean
  ): Promise<ServiceResult<ContractorProfile>> {
    return await this.update(contractorId, { availability });
  }

  /**
   * Update contractor skills
   */
  async updateSkills(
    contractorId: string, 
    skills: string[]
  ): Promise<ServiceResult<ContractorProfile>> {
    return await this.update(contractorId, { skills });
  }

  /**
   * Update contractor rating after job completion
   */
  async updateRating(
    contractorId: string,
    newRating: number,
    incrementJobsCompleted: boolean = false
  ): Promise<ServiceResult<ContractorProfile>> {
    try {
      const currentResult = await this.getById(contractorId, false);
      
      if (!currentResult.success || !currentResult.data) {
        return {
          success: false,
          error: 'Contractor not found',
          timestamp: new Date()
        };
      }

      const contractor = currentResult.data;
      
      // Calculate new average rating
      const totalRatings = contractor.jobsCompleted || 0;
      const currentRating = contractor.rating || 0;
      const newAverageRating = totalRatings === 0 
        ? newRating
        : ((currentRating * totalRatings) + newRating) / (totalRatings + 1);

      const updates: Partial<ContractorProfile> = {
        rating: Math.round(newAverageRating * 100) / 100 // Round to 2 decimal places
      };

      if (incrementJobsCompleted) {
        updates.jobsCompleted = (contractor.jobsCompleted || 0) + 1;
      }

      return await this.update(contractorId, updates);
    } catch (error) {
      return this.handleError('updateRating', error);
    }
  }

  /**
   * Get contractors by skill set
   */
  async getContractorsBySkills(
    skills: string[],
    availability: boolean = true
  ): Promise<ServiceResult<ContractorProfile[]>> {
    const searchResult = await this.searchContractors({
      skills,
      availability
    });

    if (!searchResult.success || !searchResult.data) {
      return {
        success: false,
        error: searchResult.error || 'Failed to search contractors',
        timestamp: new Date()
      };
    }

    return {
      success: true,
      data: searchResult.data.items,
      timestamp: new Date(),
      cached: searchResult.cached
    };
  }

  // =============================================
  // LANDLORD RELATIONSHIP MANAGEMENT
  // =============================================

  /**
   * Add contractor to landlord's rolodex
   */
  async addToLandlordRolodex(
    landlordId: string,
    contractorId: string
  ): Promise<ServiceResult<void>> {
    try {
      // This would need to be implemented based on your landlord profile structure
      // For now, return a placeholder
      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('addToLandlordRolodex', error);
    }
  }

  /**
   * Remove contractor from landlord's rolodex
   */
  async removeFromLandlordRolodex(
    landlordId: string,
    contractorId: string
  ): Promise<ServiceResult<void>> {
    try {
      // This would need to be implemented based on your landlord profile structure
      // For now, return a placeholder
      return {
        success: true,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('removeFromLandlordRolodex', error);
    }
  }

  // =============================================
  // ANALYTICS & METRICS
  // =============================================

  /**
   * Get contractor performance metrics
   */
  async getContractorMetrics(contractorId: string): Promise<ServiceResult<any>> {
    try {
      const contractorResult = await this.getById(contractorId);
      
      if (!contractorResult.success || !contractorResult.data) {
        return {
          success: false,
          error: 'Contractor not found',
          timestamp: new Date()
        };
      }

      const contractor = contractorResult.data;
      
      // Calculate metrics
      const metrics = {
        rating: contractor.rating || 0,
        jobsCompleted: contractor.jobsCompleted || 0,
        availability: contractor.availability,
        skillsCount: contractor.skills?.length || 0,
        preferredPropertiesCount: contractor.preferredProperties?.length || 0,
        // Add more metrics as needed
        performanceScore: this.calculatePerformanceScore(contractor)
      };

      return {
        success: true,
        data: metrics,
        timestamp: new Date()
      };
    } catch (error) {
      return this.handleError('getContractorMetrics', error);
    }
  }

  // =============================================
  // PRIVATE HELPER METHODS
  // =============================================

  private async getLandlordContractorIds(landlordId: string): Promise<string[]> {
    // This would need to query the landlord profile
    // Placeholder implementation
    return [];
  }

  private calculatePerformanceScore(contractor: ContractorProfile): number {
    // Simple performance score calculation
    const ratingWeight = 0.4;
    const jobsWeight = 0.3;
    const availabilityWeight = 0.2;
    const skillsWeight = 0.1;

    const ratingScore = (contractor.rating || 0) / 5; // Normalize to 0-1
    const jobsScore = Math.min((contractor.jobsCompleted || 0) / 100, 1); // Normalize to 0-1, cap at 100 jobs
    const availabilityScore = contractor.availability ? 1 : 0;
    const skillsScore = Math.min((contractor.skills?.length || 0) / 10, 1); // Normalize to 0-1, cap at 10 skills

    return (
      ratingScore * ratingWeight +
      jobsScore * jobsWeight +
      availabilityScore * availabilityWeight +
      skillsScore * skillsWeight
    ) * 100; // Convert to 0-100 scale
  }
}

// Export singleton instance
export const contractorService = new StandardContractorService();
export default contractorService; 