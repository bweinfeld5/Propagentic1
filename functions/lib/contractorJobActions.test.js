import { initializeApp, applicationDefault } from 'firebase-admin/app';

try {
  initializeApp({
    credential: applicationDefault(),
  });
} catch (e) {
  // Ignore if already initialized
}

import { describe, it, expect } from 'vitest';

describe('contractorJobActions Cloud Functions', () => {
  // Import after Firebase is initialized
  const contractorJobActions = require('./contractorJobActions.js');

  it('should export contractorAcceptJob as a function', () => {
    expect(typeof contractorJobActions.contractorAcceptJob).toBe('function');
  });

  it('should export contractorRejectJob as a function', () => {
    expect(typeof contractorJobActions.contractorRejectJob).toBe('function');
  });

  it('should export getContractorBidsForJob as a function', () => {
    expect(typeof contractorJobActions.getContractorBidsForJob).toBe('function');
  });
}); 