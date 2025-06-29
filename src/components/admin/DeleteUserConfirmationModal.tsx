import React, { useState } from 'react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import adminService from '../../services/adminService';
import toast from 'react-hot-toast';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  role?: string;
  status?: string;
}

interface DeleteUserConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserDeleted: () => void;
}

const DeleteUserConfirmationModal: React.FC<DeleteUserConfirmationModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserDeleted
}) => {
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [deleteType, setDeleteType] = useState<'soft' | 'hard'>('soft');

  const formatUserName = (user: User) => {
    return user.displayName || 
           (user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : '') ||
           user.email.split('@')[0];
  };

  const isConfirmationValid = () => {
    if (!user) return false;
    return confirmationText === user.email || confirmationText.toUpperCase() === 'DELETE';
  };

  const handleDelete = async () => {
    if (!user || !isConfirmationValid()) return;

    setIsLoading(true);

    try {
      if (deleteType === 'soft') {
        await softDeleteUser(user.id);
        toast.success('User account has been deactivated');
      } else {
        await hardDeleteUser(user.id);
        toast.success('User account has been permanently deleted');
      }
      
      onUserDeleted();
      onClose();
      resetModal();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    } finally {
      setIsLoading(false);
    }
  };

  const softDeleteUser = async (userId: string) => {
    await adminService.softDeleteUser(userId);
  };

  const hardDeleteUser = async (userId: string) => {
    await adminService.deleteUser(userId);
  };

  const resetModal = () => {
    setConfirmationText('');
    setDeleteType('soft');
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-full">
              <TrashIcon className="w-6 h-6 text-red-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">
              Delete User Account
            </h2>
          </div>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Warning */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <ExclamationTriangleIcon className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="text-lg font-medium text-red-900 mb-2">
                  Warning: This action has serious consequences
                </h3>
                <p className="text-red-800 mb-3">
                  You are about to delete the account for <strong>{formatUserName(user)}</strong> ({user.email}).
                </p>
                
                <div className="text-sm text-red-700 space-y-1">
                  <p>This will:</p>
                  <ul className="list-disc list-inside ml-2 space-y-1">
                    <li>Remove their access to the PropAgentic platform</li>
                    <li>Prevent them from logging in</li>
                    {deleteType === 'hard' && (
                      <>
                        <li>Permanently delete their user account and profile data</li>
                        <li>Remove their associated properties, maintenance requests, and communications</li>
                        <li><strong>This action cannot be undone</strong></li>
                      </>
                    )}
                    {deleteType === 'soft' && (
                      <>
                        <li>Mark their account as deactivated (can be restored later)</li>
                        <li>Preserve their data for potential account restoration</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Delete Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Deletion Type
            </label>
            <div className="space-y-3">
              <label className="flex items-start gap-3 p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="deleteType"
                  value="soft"
                  checked={deleteType === 'soft'}
                  onChange={(e) => setDeleteType(e.target.value as 'soft' | 'hard')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-gray-900">Deactivate Account (Recommended)</div>
                  <div className="text-sm text-gray-600">
                    Disables access but preserves data. Account can be restored later if needed.
                  </div>
                </div>
              </label>
              
              <label className="flex items-start gap-3 p-3 border border-red-200 rounded-lg cursor-pointer hover:bg-red-50">
                <input
                  type="radio"
                  name="deleteType"
                  value="hard"
                  checked={deleteType === 'hard'}
                  onChange={(e) => setDeleteType(e.target.value as 'soft' | 'hard')}
                  className="mt-1"
                />
                <div>
                  <div className="font-medium text-red-900">Permanently Delete Account</div>
                  <div className="text-sm text-red-700">
                    Completely removes all user data. This action cannot be undone.
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Confirmation Input */}
          <div>
            <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmation Required
            </label>
            <p className="text-sm text-gray-600 mb-3">
              To confirm this action, type the user's email address or the word <strong>DELETE</strong> below:
            </p>
            <input
              type="text"
              id="confirmation"
              value={confirmationText}
              onChange={(e) => setConfirmationText(e.target.value)}
              placeholder={`Type "${user.email}" or "DELETE"`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
            />
            <div className="mt-2 text-xs text-gray-500">
              Expected: <code className="bg-gray-100 px-1 rounded">{user.email}</code> or <code className="bg-gray-100 px-1 rounded">DELETE</code>
            </div>
          </div>

          {/* Data Impact Warning for Hard Delete */}
          {deleteType === 'hard' && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-yellow-900 mb-1">Data Impact Assessment</p>
                  <p className="text-yellow-800 mb-2">
                    This user may have associated data that will also be affected:
                  </p>
                  <ul className="text-yellow-700 text-xs space-y-1">
                    <li>• Properties they manage or rent</li>
                    <li>• Maintenance requests and communications</li>
                    <li>• Payment history and transactions</li>
                    <li>• Contractor work history and ratings</li>
                  </ul>
                  <p className="text-yellow-800 mt-2 font-medium">
                    Consider deactivation instead to preserve data integrity.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={handleDelete}
            disabled={!isConfirmationValid() || isLoading}
            className="min-w-[140px]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                {deleteType === 'soft' ? 'Deactivating...' : 'Deleting...'}
              </div>
            ) : (
              <>
                <TrashIcon className="w-4 h-4 mr-2" />
                {deleteType === 'soft' ? 'Deactivate Account' : 'Delete Permanently'}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserConfirmationModal; 