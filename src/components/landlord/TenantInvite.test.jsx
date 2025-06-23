import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TenantsPage from '../../pages/landlord/TenantsPage';
import { api } from '../../services/api';
import dataService from '../../services/dataService';
import { auth } from '../../firebase/config';
import toast from 'react-hot-toast';

// Mock dependencies
jest.mock('../../services/api');
jest.mock('../../services/dataService');
jest.mock('../../firebase/config', () => ({
  auth: {
    currentUser: {
      uid: 'test-landlord-id',
      displayName: 'Test Landlord',
    },
  },
  db: {},
}));
jest.mock('react-hot-toast');

const mockProperties = [
  { id: 'prop1', name: 'Sunnyvale Apartment', streetAddress: '123 Main St' },
  { id: 'prop2', nickname: 'Downtown Condo', streetAddress: '456 Center St' },
];

describe('Tenant Invitation Workflow', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
    
    // Mock the implementation of dataService to return properties
    dataService.getPropertiesForCurrentLandlord.mockResolvedValue(mockProperties);
    
    // Mock the api.create for invites
    api.create.mockResolvedValue('new-invite-id');
  });

  test('should open the invite modal, allow filling the form, and send the invitation', async () => {
    render(<TenantsPage />);

    // 1. Wait for properties to load and find the "Invite Tenant" button
    const inviteButton = await screen.findByRole('button', { name: /invite tenant/i });
    expect(inviteButton).toBeInTheDocument();
    expect(inviteButton).not.toBeDisabled();

    // 2. Click the invite button to open the modal
    fireEvent.click(inviteButton);

    // 3. Verify the modal is open
    const modalTitle = await screen.findByText('Invite a Tenant');
    expect(modalTitle).toBeInTheDocument();

    // 4. Fill out the form in the modal
    // Select a property
    const propertySelect = screen.getByLabelText(/select property/i);
    fireEvent.change(propertySelect, { target: { value: 'prop1' } });

    // Enter tenant's email
    const emailInput = screen.getByLabelText(/tenant's email/i);
    fireEvent.change(emailInput, { target: { value: 'test.tenant@example.com' } });

    // 5. Submit the form
    const sendButton = screen.getByRole('button', { name: /send invitation/i });
    fireEvent.click(sendButton);

    // 6. Assert that the API was called with the correct data
    await waitFor(() => {
      expect(api.create).toHaveBeenCalledTimes(1);
      expect(api.create).toHaveBeenCalledWith(
        'invites',
        expect.objectContaining({
          tenantEmail: 'test.tenant@example.com',
          propertyId: 'prop1',
          landlordId: 'test-landlord-id',
          propertyName: 'Sunnyvale Apartment',
          status: 'pending',
        }),
        expect.anything(), // The Zod schema
        'test-landlord-id'
      );
    });

    // 7. Assert that a success toast was shown
    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Tenant invitation sent successfully!');
    });
  });

  test('should show an error toast if sending the invitation fails', async () => {
    // Mock a failure from the api.create call
    const errorMessage = 'Network error';
    api.create.mockRejectedValue(new Error(errorMessage));
    
    render(<TenantsPage />);

    // Open the modal and fill the form
    const inviteButton = await screen.findByRole('button', { name: /invite tenant/i });
    fireEvent.click(inviteButton);
    const propertySelect = screen.getByLabelText(/select property/i);
    fireEvent.change(propertySelect, { target: { value: 'prop2' } });
    const emailInput = screen.getByLabelText(/tenant's email/i);
    fireEvent.change(emailInput, { target: { value: 'failed.tenant@example.com' } });
    
    // Submit the form
    const sendButton = screen.getByRole('button', { name: /send invitation/i });
    fireEvent.click(sendButton);
    
    // Assert that an error toast was shown
    await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith(errorMessage);
    });
  });
}); 