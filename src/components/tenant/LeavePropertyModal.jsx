import React, { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';

const LeavePropertyModal = ({ isOpen, onClose, property, onSuccess }) => {
  const { currentUser } = useAuth();
  const [isLeaving, setIsLeaving] = useState(false);
  const [confirmationText, setConfirmationText] = useState('');

  const handleLeaveProperty = async () => {
    if (!currentUser || !property) {
      toast.error('Missing required information');
      return;
    }

    if (confirmationText.toLowerCase() !== 'leave property') {
      toast.error('Please type "leave property" to confirm');
      return;
    }

    setIsLeaving(true);

    try {
      const tenantLeaveProperty = httpsCallable(functions, 'tenantLeaveProperty');
      
      await tenantLeaveProperty({
        propertyId: property.id,
        reason: 'Tenant initiated departure'
      });

      toast.success('Successfully left property');
      
      // Call success callback to refresh data
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error('Error leaving property:', error);
      
      let errorMessage = 'Failed to leave property';
      if (error.code === 'functions/permission-denied') {
        errorMessage = 'You do not have permission to leave this property';
      } else if (error.code === 'functions/not-found') {
        errorMessage = 'Property or tenant relationship not found';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsLeaving(false);
    }
  };

  const resetModal = () => {
    setConfirmationText('');
    setIsLeaving(false);
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  if (!isOpen || !property) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Leave Property
            </h3>
          </div>
          <button
            onClick={handleClose}
            disabled={isLeaving}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Property Info */}
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">
            {property.name || property.address}
          </h4>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {property.address}
          </p>
          {property.landlordName && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              Landlord: {property.landlordName}
            </p>
          )}
        </div>

        {/* Warning */}
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-red-800 dark:text-red-200 mb-2">
                Warning: This action cannot be undone
              </h4>
              <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                <li>• You will lose access to this property</li>
                <li>• Your landlord will be notified</li>
                <li>• You'll need a new invitation to rejoin</li>
                <li>• All property-related data will be updated</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Confirmation Input */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Type "leave property" to confirm:
          </label>
          <input
            type="text"
            value={confirmationText}
            onChange={(e) => setConfirmationText(e.target.value)}
            disabled={isLeaving}
            placeholder="leave property"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        {/* Actions */}
        <div className="flex space-x-3 justify-end">
          <button
            onClick={handleClose}
            disabled={isLeaving}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 
                     bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 
                     rounded-md hover:bg-gray-50 dark:hover:bg-gray-600
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleLeaveProperty}
            disabled={isLeaving || confirmationText.toLowerCase() !== 'leave property'}
            className="px-4 py-2 text-sm font-medium text-white 
                     bg-red-600 hover:bg-red-700 disabled:bg-red-400
                     rounded-md disabled:cursor-not-allowed
                     transition-colors duration-200 flex items-center"
          >
            {isLeaving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Leaving...
              </>
            ) : (
              'Leave Property'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default LeavePropertyModal; 