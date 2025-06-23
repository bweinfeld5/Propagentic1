import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { collection, getDocs, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { db, auth } from '../setup';
import ContractorJobNotificationService from '../../services/firestore/contractorJobNotificationService';

describe('ContractorJobNotificationService Integration Tests', () => {
  let notificationService: ContractorJobNotificationService;
  let landlordId: string;
  let contractorId: string;

  beforeEach(async () => {
    notificationService = new ContractorJobNotificationService();
    
    // Create test users
    const landlordEmail = `landlord-${Date.now()}@test.com`;
    const contractorEmail = `contractor-${Date.now()}@test.com`;
    
    // Create landlord
    const landlordCredential = await createUserWithEmailAndPassword(auth, landlordEmail, 'password123');
    landlordId = landlordCredential.user.uid;
    
    // Create contractor
    const contractorCredential = await createUserWithEmailAndPassword(auth, contractorEmail, 'password123');
    contractorId = contractorCredential.user.uid;
  });

  afterEach(async () => {
    // Clean up test data
    await signOut(auth);
    
    // Clean up notifications
    const notificationsSnapshot = await getDocs(collection(db, 'jobNotifications'));
    for (const notificationDoc of notificationsSnapshot.docs) {
      await deleteDoc(notificationDoc.ref);
    }
    
    // Clean up general notifications
    const generalNotificationsSnapshot = await getDocs(collection(db, 'notifications'));
    for (const notificationDoc of generalNotificationsSnapshot.docs) {
      await deleteDoc(notificationDoc.ref);
    }
    
    // Clean up preferences
    const preferencesSnapshot = await getDocs(collection(db, 'jobNotificationPreferences'));
    for (const preferenceDoc of preferencesSnapshot.docs) {
      await deleteDoc(preferenceDoc.ref);
    }
    
    // Clean up users
    const usersSnapshot = await getDocs(collection(db, 'users'));
    for (const userDoc of usersSnapshot.docs) {
      if (userDoc.id === landlordId || userDoc.id === contractorId) {
        await deleteDoc(userDoc.ref);
      }
    }
  });

  describe('Notification Creation', () => {
    it('should create bid accepted notifications', async () => {
      const jobId = 'test-job-id';
      const bidId = 'test-bid-id';
      const propertyId = 'test-property-id';
      const propertyName = 'Test Property';
      const jobTitle = 'Test Job';
      const amount = 500;

      await notificationService.createBidAcceptedNotification(
        jobId,
        bidId,
        contractorId,
        'Test Contractor',
        landlordId,
        'Test Landlord',
        propertyId,
        propertyName,
        jobTitle,
        amount
      );

      // Check landlord notifications
      const landlordNotifications = await notificationService.getJobNotifications(landlordId);
      expect(landlordNotifications).toHaveLength(1);
      expect(landlordNotifications[0].type).toBe('bid_accepted');
      expect(landlordNotifications[0].userId).toBe(landlordId);

      // Check contractor notifications
      const contractorNotifications = await notificationService.getJobNotifications(contractorId);
      expect(contractorNotifications).toHaveLength(1);
      expect(contractorNotifications[0].type).toBe('job_assigned');
      expect(contractorNotifications[0].userId).toBe(contractorId);
    });

    it('should create bid rejected notifications', async () => {
      const jobId = 'test-job-id';
      const bidId = 'test-bid-id';
      const propertyId = 'test-property-id';
      const propertyName = 'Test Property';
      const jobTitle = 'Test Job';
      const reason = 'Too expensive';

      await notificationService.createBidRejectedNotification(
        jobId,
        bidId,
        contractorId,
        'Test Contractor',
        landlordId,
        'Test Landlord',
        propertyId,
        propertyName,
        jobTitle,
        reason
      );

      // Check contractor notifications
      const contractorNotifications = await notificationService.getJobNotifications(contractorId);
      expect(contractorNotifications).toHaveLength(1);
      expect(contractorNotifications[0].type).toBe('bid_rejected');
      expect(contractorNotifications[0].userId).toBe(contractorId);
    });
  });

  describe('Notification Management', () => {
    beforeEach(async () => {
      // Create a test notification
      const jobId = 'test-job-id';
      const bidId = 'test-bid-id';
      const propertyId = 'test-property-id';
      const propertyName = 'Test Property';
      const jobTitle = 'Test Job';
      const amount = 500;

      await notificationService.createBidAcceptedNotification(
        jobId,
        bidId,
        contractorId,
        'Test Contractor',
        landlordId,
        'Test Landlord',
        propertyId,
        propertyName,
        jobTitle,
        amount
      );
    });

    it('should get job notifications for user', async () => {
      const notifications = await notificationService.getJobNotifications(landlordId);
      expect(notifications).toHaveLength(1);
      expect(notifications[0].userId).toBe(landlordId);
    });

    it('should get unread notifications only', async () => {
      const unreadNotifications = await notificationService.getJobNotifications(landlordId, true);
      expect(unreadNotifications).toHaveLength(1);
      expect(unreadNotifications[0].read).toBe(false);
    });

    it('should mark notification as read', async () => {
      const notifications = await notificationService.getJobNotifications(landlordId);
      const notificationId = notifications[0].id;
      
      if (notificationId) {
        await notificationService.markJobNotificationAsRead(notificationId);
        
        const updatedNotifications = await notificationService.getJobNotifications(landlordId);
        const updatedNotification = updatedNotifications.find(n => n.id === notificationId);
        expect(updatedNotification?.read).toBe(true);
      }
    });

    it('should mark all notifications as read', async () => {
      await notificationService.markAllJobNotificationsAsRead(landlordId);
      
      const notifications = await notificationService.getJobNotifications(landlordId);
      expect(notifications.every(n => n.read)).toBe(true);
    });

    it('should get unread count', async () => {
      const unreadCount = await notificationService.getUnreadCount(landlordId);
      expect(unreadCount).toBe(1);
    });
  });

  describe('Notification Preferences', () => {
    it('should create default preferences', async () => {
      await notificationService.createDefaultPreferences(landlordId);
      
      const preferences = await notificationService.getNotificationPreferences(landlordId);
      expect(preferences).toBeDefined();
      expect(preferences?.userId).toBe(landlordId);
      expect(preferences?.bidUpdates).toBe(true);
      expect(preferences?.emailNotifications).toBe(true);
    });

    it('should update notification preferences', async () => {
      await notificationService.createDefaultPreferences(landlordId);
      
      await notificationService.updateNotificationPreferences(landlordId, {
        bidUpdates: false,
        emailNotifications: false
      });
      
      const preferences = await notificationService.getNotificationPreferences(landlordId);
      expect(preferences?.bidUpdates).toBe(false);
      expect(preferences?.emailNotifications).toBe(false);
    });

    it('should check if user should receive notifications', async () => {
      await notificationService.createDefaultPreferences(landlordId);
      
      const shouldReceive = await notificationService.shouldReceiveNotification(landlordId);
      expect(shouldReceive).toBe(true);
    });
  });
}); 