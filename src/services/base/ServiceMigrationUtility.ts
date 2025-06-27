import { BaseFirestoreService, ServiceResult } from './BaseFirestoreService';

/**
 * Service Migration Utility
 * Helps migrate existing services to the new standardized pattern
 */
export class ServiceMigrationUtility {
  /**
   * Convert legacy service result to StandardServiceResult format
   */
  static toLegacyFormat<T>(result: ServiceResult<T>): any {
    if (result.success) {
      return result.data;
    } else {
      throw new Error(result.error || 'Service operation failed');
    }
  }

  /**
   * Convert legacy service call to StandardServiceResult format
   */
  static async fromLegacyCall<T>(
    legacyCall: () => Promise<T>
  ): Promise<ServiceResult<T>> {
    try {
      const data = await legacyCall();
      return {
        success: true,
        data,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      };
    }
  }

  /**
   * Create a compatibility wrapper for existing service functions
   */
  static createCompatibilityWrapper<T>(
    standardServiceFunction: () => Promise<ServiceResult<T>>
  ): () => Promise<T> {
    return async () => {
      const result = await standardServiceFunction();
      return this.toLegacyFormat(result);
    };
  }
}

/**
 * Legacy service compatibility decorator
 * Use this to gradually migrate services without breaking existing code
 */
export function LegacyCompatible(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = async function(...args: any[]) {
    const result = await originalMethod.apply(this, args);
    
    // If the result is already a ServiceResult, return as is
    if (result && typeof result === 'object' && 'success' in result) {
      return result;
    }
    
    // Otherwise, wrap in ServiceResult format
    return {
      success: true,
      data: result,
      timestamp: new Date()
    };
  };

  return descriptor;
}

export default ServiceMigrationUtility; 