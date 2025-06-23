import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../setup';
import jobService from '../../services/firestore/jobService';
import type { Bid } from '../../services/firestore/jobService';

describe('JobService Integration Tests', () => {
  let landlordId: string;
  let contractorId: string;
  let testJobId: string;
  let testBidId: string;

  beforeEach(async () => {
    // Create test users
    const landlordEmail = `landlord-${Date.now()}@test.com`;
    const contractorEmail = `contractor-${Date.now()}@test.com`;
    
    // Create landlord
    const landlordCredential = await createUserWithEmailAndPassword(auth, landlordEmail, 'password123');
    landlordId = landlordCredential.user.uid;
    
    // Create contractor
    const contractorCredential = await createUserWithEmailAndPassword(auth, contractorEmail, 'password123');
    contractorId = contractorCredential.user.uid;
    
    // Update user roles in Firestore
    // Note: In a real test, you'd update the user documents with proper roles
  });

  afterEach(async () => {
    // Clean up test data
    await signOut(auth);
    
    // Clean up jobs
    const jobsSnapshot = await getDocs(collection(db, 'jobs'));
    for (const jobDoc of jobsSnapshot.docs) {
      await deleteDoc(jobDoc.ref);
    }
    
    // Clean up bids
    const bidsSnapshot = await getDocs(collection(db, 'bids'));
    for (const bidDoc of bidsSnapshot.docs) {
      await deleteDoc(bidDoc.ref);
    }
    
    // Clean up users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnapshot.docs) {
      if (userDoc.id === landlordId || userDoc.id === contractorId) {
        await deleteDoc(userDoc.ref);
      }
    }
  });

  describe('Job Creation and Management', () => {
    it('should create a job successfully', async () => {
      const jobData = {
        title: 'Test Job',
        description: 'Test job description',
        category: 'plumbing' as const,
        priority: 'normal' as const,
        status: 'open' as const,
        propertyId: 'test-property-id',
        propertyName: 'Test Property',
        propertyAddress: '123 Test St',
        landlordId,
        landlordName: 'Test Landlord',
        isEmergency: false
      };

      testJobId = await jobService.createJob(jobData);
      expect(testJobId).toBeDefined();

      const job = await jobService.getJob(testJobId);
      expect(job).toBeDefined();
      expect(job?.title).toBe('Test Job');
      expect(job?.landlordId).toBe(landlordId);
    });

    it('should get jobs for landlord', async () => {
      // Create a job first
      const jobData = {
        title: 'Test Job',
        description: 'Test job description',
        category: 'plumbing' as const,
        priority: 'normal' as const,
        status: 'open' as const,
        propertyId: 'test-property-id',
        propertyName: 'Test Property',
        propertyAddress: '123 Test St',
        landlordId,
        landlordName: 'Test Landlord',
        isEmergency: false
      };

      await jobService.createJob(jobData);

      const jobs = await jobService.getJobsForLandlord(landlordId);
      expect(jobs).toHaveLength(1);
      expect(jobs[0].title).toBe('Test Job');
    });
  });

  describe('Bid Management', () => {
    beforeEach(async () => {
      // Create a test job
      const jobData = {
        title: 'Test Job',
        description: 'Test job description',
        category: 'plumbing' as const,
        priority: 'normal' as const,
        status: 'open' as const,
        propertyId: 'test-property-id',
        propertyName: 'Test Property',
        propertyAddress: '123 Test St',
        landlordId,
        landlordName: 'Test Landlord',
        isEmergency: false
      };

      testJobId = await jobService.createJob(jobData);
    });

    it('should create a bid successfully', async () => {
      const bidData = {
        jobId: testJobId,
        contractorId,
        contractorName: 'Test Contractor',
        amount: 500,
        estimatedDuration: '2-3 hours',
        description: 'Test bid description',
        proposedStartDate: new Date(),
        laborCost: 400,
        materialsCost: 100,
        totalCost: 500,
        status: 'pending' as const
      };

      testBidId = await jobService.createBid(bidData);
      expect(testBidId).toBeDefined();

      const bids = await jobService.getBidsForJob(testJobId);
      expect(bids).toHaveLength(1);
      expect(bids[0].contractorId).toBe(contractorId);
      expect(bids[0].amount).toBe(500);
    });

    it('should get bids for contractor', async () => {
      // Create a bid first
      const bidData = {
        jobId: testJobId,
        contractorId,
        contractorName: 'Test Contractor',
        amount: 500,
        estimatedDuration: '2-3 hours',
        description: 'Test bid description',
        proposedStartDate: new Date(),
        laborCost: 400,
        materialsCost: 100,
        totalCost: 500,
        status: 'pending' as const
      };

      await jobService.createBid(bidData);

      const bids = await jobService.getBidsForContractor(contractorId);
      expect(bids).toHaveLength(1);
      expect(bids[0].jobId).toBe(testJobId);
    });
  });

  describe('Job Acceptance/Rejection', () => {
    beforeEach(async () => {
      // Create a test job and bid
      const jobData = {
        title: 'Test Job',
        description: 'Test job description',
        category: 'plumbing' as const,
        priority: 'normal' as const,
        status: 'open' as const,
        propertyId: 'test-property-id',
        propertyName: 'Test Property',
        propertyAddress: '123 Test St',
        landlordId,
        landlordName: 'Test Landlord',
        isEmergency: false
      };

      testJobId = await jobService.createJob(jobData);

      const bidData = {
        jobId: testJobId,
        contractorId,
        contractorName: 'Test Contractor',
        amount: 500,
        estimatedDuration: '2-3 hours',
        description: 'Test bid description',
        proposedStartDate: new Date(),
        laborCost: 400,
        materialsCost: 100,
        totalCost: 500,
        status: 'pending' as const
      };

      testBidId = await jobService.createBid(bidData);
    });

    it('should accept a job by contractor', async () => {
      await jobService.acceptJobByContractor(contractorId, testBidId, testJobId);

      // Verify job status was updated
      const job = await jobService.getJob(testJobId);
      expect(job?.status).toBe('assigned');
      expect(job?.assignedContractorId).toBe(contractorId);

      // Verify bid status was updated
      const bids = await jobService.getBidsForJob(testJobId);
      const acceptedBid = bids.find((bid: Bid) => bid.id === testBidId);
      expect(acceptedBid?.status).toBe('accepted');
    });

    it('should reject a job by contractor', async () => {
      await jobService.rejectJobByContractor(contractorId, testBidId, testJobId);

      // Verify bid status was updated
      const bids = await jobService.getBidsForJob(testJobId);
      const rejectedBid = bids.find((bid: Bid) => bid.id === testBidId);
      expect(rejectedBid?.status).toBe('rejected');
    });
  });
}); 