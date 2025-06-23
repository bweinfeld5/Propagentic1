import * as navigationService from '../../src/services/navigationService';
import { mockProperty } from '../fixtures';
import { vi, describe, it, expect, beforeEach } from 'vitest';

describe('Navigation Service Tests', () => {
  // Mock navigate function
  const mockNavigate = vi.fn();
  
  beforeEach(() => {
    // Clear mocks between tests
    mockNavigate.mockClear(); // Use mockClear for vi.fn()
  });
  
  describe('navigateToMaintenanceForm', () => {
    it('navigates to correct route with propertyId in state', () => {
      // Call the function with a property ID
      navigationService.navigateToMaintenanceForm(mockNavigate, mockProperty.id);
      
      // Check that navigate was called with the correct route and state
      expect(mockNavigate).toHaveBeenCalledWith(
        '/maintenance/new', 
        { state: { propertyId: mockProperty.id } }
      );
    });
    
    it('navigates to correct route without propertyId', () => {
      // Call the function without a property ID
      navigationService.navigateToMaintenanceForm(mockNavigate);
      
      // Check that navigate was called with the correct route and empty state object
      expect(mockNavigate).toHaveBeenCalledWith(
        '/maintenance/new', 
        { state: {} }
      );
    });
    
    it('navigates with additional state data', () => {
      // Additional state to pass
      const additionalState = {
        returnTo: '/tenant/dashboard',
        source: 'dashboard'
      };
      
      // Call the function with a property ID and additional state
      navigationService.navigateToMaintenanceForm(
        mockNavigate, 
        mockProperty.id, 
        additionalState
      );
      
      // Check that navigate was called with the correct route and combined state
      expect(mockNavigate).toHaveBeenCalledWith(
        '/maintenance/new', 
        { 
          state: { 
            propertyId: mockProperty.id,
            returnTo: '/tenant/dashboard',
            source: 'dashboard'
          } 
        }
      );
    });
    
    it('does not navigate if navigate function is not provided', () => {
      // Call the function without a navigate function
      navigationService.navigateToMaintenanceForm(null as any, mockProperty.id);
      
      // Check that mockNavigate was not called
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
  
  describe('navigateToTenantDashboard', () => {
    it('navigates to the tenant dashboard route', () => {
      // Call the function
      navigationService.navigateToTenantDashboard(mockNavigate);
      
      // Check that navigate was called with the correct route
      expect(mockNavigate).toHaveBeenCalledWith('/tenant/dashboard');
    });
    
    it('does not navigate if navigate function is not provided', () => {
      // Call the function without a navigate function
      navigationService.navigateToTenantDashboard(null as any);
      
      // Check that mockNavigate was not called
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
  
  describe('navigateToMaintenanceDetail', () => {
    it('navigates to the correct maintenance detail route with ticket ID', () => {
      const ticketId = 'ticket-123';
      
      // Call the function
      navigationService.navigateToMaintenanceDetail(mockNavigate, ticketId);
      
      // Check that navigate was called with the correct route and state
      expect(mockNavigate).toHaveBeenCalledWith(
        `/maintenance/${ticketId}`, 
        { state: { ticketId } }
      );
    });
    
    it('does not navigate if ticketId is not provided', () => {
      // Call the function without a ticket ID
      navigationService.navigateToMaintenanceDetail(mockNavigate, '' as any);
      
      // Check that mockNavigate was not called
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
  
  describe('navigateToPropertyDetail', () => {
    it('navigates to the correct property detail route', () => {
      // Call the function
      navigationService.navigateToPropertyDetail(mockNavigate, mockProperty.id);
      
      // Check that navigate was called with the correct route
      expect(mockNavigate).toHaveBeenCalledWith(`/property/${mockProperty.id}`);
    });
    
    it('does not navigate if propertyId is not provided', () => {
      // Call the function without a property ID
      navigationService.navigateToPropertyDetail(mockNavigate, '' as any);
      
      // Check that mockNavigate was not called
      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });
}); 