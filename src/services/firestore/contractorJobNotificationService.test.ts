import { describe, it, expect, beforeEach } from 'vitest';
import ContractorJobNotificationService from './contractorJobNotificationService';

describe('ContractorJobNotificationService', () => {
  let service: ContractorJobNotificationService;

  beforeEach(() => {
    service = new ContractorJobNotificationService();
  });

  it('should have createBidAcceptedNotification method', () => {
    expect(typeof service.createBidAcceptedNotification).toBe('function');
  });

  it('should have createBidRejectedNotification method', () => {
    expect(typeof service.createBidRejectedNotification).toBe('function');
  });

  it('should have getJobNotifications method', () => {
    expect(typeof service.getJobNotifications).toBe('function');
  });

  it('should have subscribeToJobNotifications method', () => {
    expect(typeof service.subscribeToJobNotifications).toBe('function');
  });

  it('should have markJobNotificationAsRead method', () => {
    expect(typeof service.markJobNotificationAsRead).toBe('function');
  });

  it('should have markAllJobNotificationsAsRead method', () => {
    expect(typeof service.markAllJobNotificationsAsRead).toBe('function');
  });

  it('should have deleteJobNotification method', () => {
    expect(typeof service.deleteJobNotification).toBe('function');
  });

  it('should have getNotificationPreferences method', () => {
    expect(typeof service.getNotificationPreferences).toBe('function');
  });

  it('should have updateNotificationPreferences method', () => {
    expect(typeof service.updateNotificationPreferences).toBe('function');
  });

  it('should have createDefaultPreferences method', () => {
    expect(typeof service.createDefaultPreferences).toBe('function');
  });

  it('should have getUnreadCount method', () => {
    expect(typeof service.getUnreadCount).toBe('function');
  });

  it('should have shouldReceiveNotification method', () => {
    expect(typeof service.shouldReceiveNotification).toBe('function');
  });
}); 