import React, { useState } from 'react';
import { acceptInvite } from '../../services/firestore/inviteService';
import Button from '../ui/Button';
import { toast } from 'react-hot-toast';

interface InviteAcceptanceFormProps {
  inviteData: {
    inviteId: string;
    propertyName: string;
    landlordName: string;
    tenantEmail: string;
  };
  onSuccess: (userData: any) => void;
}

export default function InviteAcceptanceForm({ inviteData, onSuccess }: InviteAcceptanceFormProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (!formData.acceptTerms) {
      toast.error('Please accept the terms and conditions');
      return;
    }

    try {
      setLoading(true);
      const result = await acceptInvite({
        inviteCode: inviteData.inviteId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        password: formData.password,
        email: inviteData.tenantEmail
      });
      
      toast.success('Account created successfully!');
      onSuccess(result);
    } catch (error) {
      toast.error((error as Error).message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            First Name
          </label>
          <input
            type="text"
            required
            value={formData.firstName}
            onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Last Name
          </label>
          <input
            type="text"
            required
            value={formData.lastName}
            onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Email
        </label>
        <input
          type="email"
          value={inviteData.tenantEmail}
          disabled
          className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Password
        </label>
        <input
          type="password"
          required
          value={formData.password}
          onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          minLength={6}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Confirm Password
        </label>
        <input
          type="password"
          required
          value={formData.confirmPassword}
          onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-start space-x-3">
        <input
          type="checkbox"
          id="acceptTerms"
          checked={formData.acceptTerms}
          onChange={(e) => setFormData(prev => ({ ...prev, acceptTerms: e.target.checked }))}
          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <label htmlFor="acceptTerms" className="text-sm text-gray-700">
          I accept the{' '}
          <a href="/terms" target="_blank" className="text-blue-600 hover:text-blue-800">
            Terms and Conditions
          </a>{' '}
          and{' '}
          <a href="/privacy" target="_blank" className="text-blue-600 hover:text-blue-800">
            Privacy Policy
          </a>
        </label>
      </div>

      <Button
        type="submit"
        isLoading={loading}
        fullWidth={true}
        variant="primary"
      >
        Create Account & Join Property
      </Button>
    </form>
  );
}