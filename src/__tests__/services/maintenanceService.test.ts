/**
 * Tests for maintenanceService.ts - Phase 2 Maintenance Components
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';

// Mock Firebase completely
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(() => Promise.resolve({ exists: () => false, data: () => null })),
  collection: vi.fn(() => ({
    withConverter: vi.fn(() => ({}))
  })),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    set: vi.fn(),
    commit: vi.fn(() => Promise.resolve())
  })),
  runTransaction: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  arrayUnion: vi.fn(),
  increment: vi.fn(),
  Timestamp: {
    now: vi.fn(() => new Date()),
    fromDate: vi.fn((date: Date) => date)
  }
}));

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({}))
}));

vi.mock('../../src/firebase/config', () => ({
  db: {},
  auth: {},
  storage: {}
}));

describe('MaintenanceService - Phase 2 Tests', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test that the service module loads without error
  test('service module loads successfully', async () => {
    const { maintenanceService } = await import('../../services/firestore/maintenanceService');
    expect(maintenanceService).toBeDefined();
  });

  describe('Real-time Listeners', () => {
    test('subscribeToMaintenanceRequests returns unsubscribe function', async () => {
      const { maintenanceService } = await import('../../services/firestore/maintenanceService');
      const mockCallback = vi.fn();
      const mockOnError = vi.fn();
      
      const unsubscribe = maintenanceService.subscribeToMaintenanceRequests(
        { propertyIds: ['prop1'] },
        mockCallback,
        mockOnError
      );
      
      expect(typeof unsubscribe).toBe('function');
    });

    test('contractor job subscriptions work', async () => {
      const { maintenanceService } = await import('../../services/firestore/maintenanceService');
      const mockCallback = vi.fn();
      
      const unsubscribe = await maintenanceService.subscribeToContractorJobs(
        'contractor123',
        mockCallback
      );
      
      expect(typeof unsubscribe).toBe('function');
    });
  });

  describe('Metrics Calculation', () => {
    test('getMaintenanceMetrics returns proper structure', async () => {
      const { maintenanceService } = await import('../../services/firestore/maintenanceService');
      const metrics = await maintenanceService.getMaintenanceMetrics();
      
      expect(metrics).toHaveProperty('averageResolutionTime');
      expect(metrics).toHaveProperty('requestsCompleted');
      expect(metrics).toHaveProperty('requestsPending');
      expect(metrics).toHaveProperty('satisfactionScore');
      expect(typeof metrics.averageResolutionTime).toBe('number');
    });
  });

  describe('Job Management Stubs', () => {
    test('assignContractor stub works', async () => {
      const { maintenanceService } = await import('../../services/firestore/maintenanceService');
      
      await expect(
        maintenanceService.assignContractor('req123', 'contractor456')
      ).resolves.not.toThrow();
    });

    test('acceptJob stub works', async () => {
      const { maintenanceService } = await import('../../services/firestore/maintenanceService');
      
      await expect(
        maintenanceService.acceptJob('req123', 'contractor456')
      ).resolves.not.toThrow();
    });

    test('uploadProgressPhotos returns array', async () => {
      const { maintenanceService } = await import('../../services/firestore/maintenanceService');
      const mockFiles = [new File(['test'], 'test.jpg', { type: 'image/jpeg' })];
      const mockProgress = vi.fn();
      
      const urls = await maintenanceService.uploadProgressPhotos(
        'req123',
        mockFiles,
        mockProgress
      );
      
      expect(Array.isArray(urls)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    test('getMaintenanceRequest handles invalid IDs', async () => {
      const { maintenanceService } = await import('../../services/firestore/maintenanceService');
      
      const result = await maintenanceService.getMaintenanceRequest('invalid-id');
      expect(result).toBeNull();
    });
  });
}); 