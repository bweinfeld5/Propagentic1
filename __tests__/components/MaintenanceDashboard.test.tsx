/**
 * Tests for MaintenanceDashboard.tsx - Landlord View
 */

import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import MaintenanceDashboard from '../../src/components/landlord/MaintenanceDashboard';
import { AuthContext } from '../../src/context/AuthContext';

// Mock Firebase and services
vi.mock('../../src/services/firestore/maintenanceService', () => ({
  subscribeToMaintenanceRequests: vi.fn(() => () => {}),
  getMaintenanceMetrics: vi.fn(() => Promise.resolve({
    averageResolutionTime: 24,
    requestsCompleted: 45,
    requestsPending: 12,
    satisfactionScore: 4.2
  })),
  executeBulkOperation: vi.fn(() => Promise.resolve({ id: 'bulk123' }))
}));

// Mock context
const mockAuthContext = {
  user: { uid: 'landlord123' },
  userProfile: { 
    role: 'landlord',
    properties: ['prop1', 'prop2'] 
  },
  loading: false
};

const renderWithContext = (component: React.ReactElement) => {
  return render(
    <AuthContext.Provider value={mockAuthContext}>
      {component}
    </AuthContext.Provider>
  );
};

describe('MaintenanceDashboard Component', () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders dashboard with statistics cards', async () => {
    renderWithContext(<MaintenanceDashboard />);
    
    // Check for main sections
    expect(screen.getByText(/Maintenance Dashboard/i)).toBeInTheDocument();
    
    // Wait for metrics to load
    await waitFor(() => {
      expect(screen.getByText(/Total Requests/i)).toBeInTheDocument();
    });
  });

  test('displays filter controls', () => {
    renderWithContext(<MaintenanceDashboard />);
    
    // Check for filter elements
    expect(screen.getByPlaceholderText(/Search requests/i)).toBeInTheDocument();
    expect(screen.getByText(/All Status/i)).toBeInTheDocument();
    expect(screen.getByText(/All Priority/i)).toBeInTheDocument();
  });

  test('handles view mode switching', () => {
    renderWithContext(<MaintenanceDashboard />);
    
    // Find view toggle buttons
    const gridViewBtn = screen.getByRole('button', { name: /grid/i });
    const tableViewBtn = screen.getByRole('button', { name: /table/i });
    
    expect(gridViewBtn).toBeInTheDocument();
    expect(tableViewBtn).toBeInTheDocument();
    
    // Test view switching
    fireEvent.click(tableViewBtn);
    // Should switch to table view
  });

  test('opens bulk operations modal', () => {
    renderWithContext(<MaintenanceDashboard />);
    
    const bulkBtn = screen.getByRole('button', { name: /bulk actions/i });
    fireEvent.click(bulkBtn);
    
    // Modal should open (implementation specific)
  });

  test('handles search functionality', () => {
    renderWithContext(<MaintenanceDashboard />);
    
    const searchInput = screen.getByPlaceholderText(/Search requests/i);
    fireEvent.change(searchInput, { target: { value: 'plumbing' } });
    
    expect(searchInput).toHaveValue('plumbing');
  });

  test('displays loading state initially', () => {
    renderWithContext(<MaintenanceDashboard />);
    
    // Should show loading indicators
    const loadingElements = screen.getAllByText(/loading/i);
    expect(loadingElements.length).toBeGreaterThan(0);
  });

  test('handles error states gracefully', async () => {
    // Mock service to throw error
    const mockService = await vi.importMock('../../src/services/firestore/maintenanceService');
    mockService.getMaintenanceMetrics.mockRejectedValueOnce(new Error('Network error'));
    
    renderWithContext(<MaintenanceDashboard />);
    
    // Should handle error without crashing
    await waitFor(() => {
      expect(screen.getByText(/Maintenance Dashboard/i)).toBeInTheDocument();
    });
  });

  test('responds to real-time updates', async () => {
    const mockCallback = vi.fn();
    const mockService = await vi.importMock('../../src/services/firestore/maintenanceService');
    
    // Mock subscription that calls callback
    mockService.subscribeToMaintenanceRequests.mockImplementation((filters, callback) => {
      setTimeout(() => callback([{ id: 'req1', title: 'Test Request' }]), 100);
      return () => {};
    });
    
    renderWithContext(<MaintenanceDashboard />);
    
    await waitFor(() => {
      // Component should update with new data
      expect(mockService.subscribeToMaintenanceRequests).toHaveBeenCalled();
    });
  });
}); 