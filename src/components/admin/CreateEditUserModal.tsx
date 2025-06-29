import React, { useState, useEffect } from 'react';
import {
  XMarkIcon,
  UserPlusIcon,
  PencilIcon,
  EnvelopeIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { useAuth } from '../../context/AuthContext';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

interface User {
  id?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  userType?: string;
  status?: string;
  phone?: string;
  profileComplete?: boolean;
  emailVerified?: boolean;
}

interface CreateEditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user?: User | null;
  onUserSaved: () => void;
}

const CreateEditUserModal: React.FC<CreateEditUserModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserSaved
}) => {
  const { currentUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'tenant',
    status: 'pending',
    phone: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const isEditing = !!user?.id;

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen) {
      if (user) {
        setFormData({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          role: user.role || 'tenant',
          status: user.status || 'pending',
          phone: user.phone || ''
        });
      } else {
        setFormData({
          firstName: '',
          lastName: '',
          email: '',
          role: 'tenant',
          status: 'pending',
          phone: ''
        });
      }
      setErrors({});
    }
  }, [isOpen, user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.role) {
      newErrors.role = 'Role is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      if (isEditing) {
        // Update existing user
        await updateUser();
      } else {
        // Create new user
        await createUser();
      }
      
      onUserSaved();
      onClose();
      toast.success(isEditing ? 'User updated successfully' : 'User created successfully');
    } catch (error: any) {
      console.error('Error saving user:', error);
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'create'} user`);
    } finally {
      setIsLoading(false);
    }
  };

  const createUser = async () => {
    await adminService.createUser({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      role: formData.role as any,
      phone: formData.phone
    });
  };

  const updateUser = async () => {
    if (!user?.id) return;

    await adminService.updateUser({
      uid: user.id,
      firstName: formData.firstName,
      lastName: formData.lastName,
      role: formData.role,
      status: formData.status,
      phone: formData.phone
    });
  };

  const sendInvitationEmail = async (email: string, firstName: string) => {
    try {
      await adminService.sendInvitationEmail(email, firstName);
    } catch (error) {
      console.error('Error sending invitation email:', error);
      toast.error('User created but failed to send invitation email');
    }
  };

  const handleResendInvitation = async () => {
    if (!user?.email || !user?.firstName) return;

    setIsLoading(true);
    try {
      await sendInvitationEmail(user.email, user.firstName);
    } catch (error) {
      console.error('Error resending invitation:', error);
      toast.error('Failed to resend invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendPasswordReset = async () => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      await adminService.sendPasswordReset(user.email);
    } catch (error) {
      console.error('Error sending password reset:', error);
      toast.error('Failed to send password reset email');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            {isEditing ? (
              <PencilIcon className="w-6 h-6 text-blue-600" />
            ) : (
              <UserPlusIcon className="w-6 h-6 text-green-600" />
            )}
            <h2 className="text-xl font-semibold text-gray-900">
              {isEditing ? 'Edit User' : 'Create New User'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* First Name */}
          <div>
            <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
              First Name *
            </label>
            <input
              type="text"
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className={`w-full border ${errors.firstName ? 'border-red-300' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              placeholder="Enter first name"
            />
            {errors.firstName && (
              <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>
            )}
          </div>

          {/* Last Name */}
          <div>
            <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
              Last Name *
            </label>
            <input
              type="text"
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className={`w-full border ${errors.lastName ? 'border-red-300' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              placeholder="Enter last name"
            />
            {errors.lastName && (
              <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className={`w-full border ${errors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent`}
              placeholder="Enter email address"
              disabled={isEditing} // Don't allow email changes for existing users
            />
            {errors.email && (
              <p className="text-red-600 text-sm mt-1">{errors.email}</p>
            )}
          </div>

          {/* Phone */}
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              placeholder="Enter phone number"
            />
          </div>

          {/* Role */}
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              id="role"
              value={formData.role}
              onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
              className={`w-full border ${errors.role ? 'border-red-300' : 'border-gray-300'} rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent`}
            >
              <option value="tenant">Tenant</option>
              <option value="landlord">Landlord</option>
              <option value="contractor">Contractor</option>
              <option value="admin">Admin</option>
            </select>
            {errors.role && (
              <p className="text-red-600 text-sm mt-1">{errors.role}</p>
            )}
          </div>

          {/* Status (only for editing) */}
          {isEditing && (
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
              >
                <option value="pending">Pending Invite</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          )}

          {/* Administrative Actions (only for editing) */}
          {isEditing && user && (
            <div className="border-t border-gray-200 pt-4">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Administrative Actions</h3>
              <div className="space-y-2">
                {user.status === 'pending' && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendInvitation}
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2"
                  >
                    <EnvelopeIcon className="w-4 h-4" />
                    Resend Invitation Email
                  </Button>
                )}
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendPasswordReset}
                  disabled={isLoading}
                  className="w-full flex items-center justify-center gap-2"
                >
                  <ExclamationTriangleIcon className="w-4 h-4" />
                  Send Password Reset Email
                </Button>
              </div>
            </div>
          )}

          {/* Info for new users */}
          {!isEditing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <CheckCircleIcon className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium">What happens next:</p>
                  <ul className="mt-1 list-disc list-inside space-y-1">
                    <li>User account will be created with "Pending Invite" status</li>
                    <li>An invitation email will be sent automatically</li>
                    <li>User can set their password and complete onboarding</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  {isEditing ? 'Updating...' : 'Creating...'}
                </div>
              ) : (
                isEditing ? 'Update User' : 'Create User'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateEditUserModal; 