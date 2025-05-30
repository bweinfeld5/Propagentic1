import React, { useState, useCallback, useMemo } from 'react';
import {
  CheckIcon,
  XMarkIcon,
  ChevronDownIcon,
  DocumentTextIcon,
  TrashIcon,
  PencilIcon,
  ArrowDownTrayIcon,
  TagIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  EnvelopeIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Advanced Bulk Operations System
 * Phase 1.2 Implementation
 */
const BulkOperations = ({ 
  items = [], 
  selectedIds = [], 
  onSelectionChange,
  onBulkAction,
  itemType = 'generic' // properties, tenants, maintenance, documents
}) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);
  const [bulkEditMode, setBulkEditMode] = useState(null);
  const [bulkEditValues, setBulkEditValues] = useState({});

  // Selected items data
  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  // Define available actions based on item type
  const getAvailableActions = useCallback(() => {
    const baseActions = [
      {
        id: 'export',
        label: 'Export Selected',
        icon: ArrowDownTrayIcon,
        color: 'blue',
        description: 'Export selected items to CSV'
      },
      {
        id: 'delete',
        label: 'Delete Selected',
        icon: TrashIcon,
        color: 'red',
        description: 'Permanently delete selected items',
        requiresConfirmation: true
      }
    ];

    switch (itemType) {
      case 'properties':
        return [
          ...baseActions,
          {
            id: 'bulk_edit',
            label: 'Bulk Edit',
            icon: PencilIcon,
            color: 'orange',
            description: 'Edit multiple properties at once'
          },
          {
            id: 'update_status',
            label: 'Update Status',
            icon: TagIcon,
            color: 'green',
            description: 'Change status for selected properties'
          },
          {
            id: 'assign_manager',
            label: 'Assign Manager',
            icon: UserGroupIcon,
            color: 'purple',
            description: 'Assign property manager to selected properties'
          }
        ];
      case 'tenants':
        return [
          ...baseActions,
          {
            id: 'bulk_edit',
            label: 'Bulk Edit',
            icon: PencilIcon,
            color: 'orange',
            description: 'Edit multiple tenant records'
          },
          {
            id: 'send_notice',
            label: 'Send Notice',
            icon: EnvelopeIcon,
            color: 'blue',
            description: 'Send notice to selected tenants'
          },
          {
            id: 'update_rent',
            label: 'Update Rent',
            icon: CurrencyDollarIcon,
            color: 'green',
            description: 'Update rent for selected tenants'
          },
          {
            id: 'schedule_inspection',
            label: 'Schedule Inspection',
            icon: CalendarDaysIcon,
            color: 'purple',
            description: 'Schedule inspections for selected units'
          }
        ];
      case 'maintenance':
        return [
          ...baseActions,
          {
            id: 'bulk_edit',
            label: 'Bulk Edit',
            icon: PencilIcon,
            color: 'orange',
            description: 'Edit multiple maintenance requests'
          },
          {
            id: 'update_status',
            label: 'Update Status',
            icon: TagIcon,
            color: 'green',
            description: 'Change status for selected requests'
          },
          {
            id: 'assign_contractor',
            label: 'Assign Contractor',
            icon: UserGroupIcon,
            color: 'purple',
            description: 'Assign contractor to selected requests'
          },
          {
            id: 'update_priority',
            label: 'Update Priority',
            icon: ExclamationTriangleIcon,
            color: 'red',
            description: 'Change priority for selected requests'
          }
        ];
      case 'documents':
        return [
          ...baseActions,
          {
            id: 'bulk_edit',
            label: 'Bulk Edit',
            icon: PencilIcon,
            color: 'orange',
            description: 'Edit multiple documents'
          },
          {
            id: 'update_tags',
            label: 'Update Tags',
            icon: TagIcon,
            color: 'green',
            description: 'Add/remove tags for selected documents'
          },
          {
            id: 'move_folder',
            label: 'Move to Folder',
            icon: ClipboardDocumentListIcon,
            color: 'purple',
            description: 'Move selected documents to a folder'
          }
        ];
      default:
        return baseActions;
    }
  }, [itemType]);

  // Handle select all/none
  const handleSelectAll = useCallback(() => {
    if (selectedIds.length === items.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(item => item.id));
    }
  }, [items, selectedIds, onSelectionChange]);

  // Handle individual selection
  const handleItemSelection = useCallback((itemId) => {
    if (selectedIds.includes(itemId)) {
      onSelectionChange(selectedIds.filter(id => id !== itemId));
    } else {
      onSelectionChange([...selectedIds, itemId]);
    }
  }, [selectedIds, onSelectionChange]);

  // Handle bulk action execution
  const handleBulkAction = useCallback((action) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else if (action.id === 'bulk_edit') {
      setBulkEditMode(action.id);
    } else {
      executeBulkAction(action);
    }
    setIsActionMenuOpen(false);
  }, []);

  // Execute the bulk action
  const executeBulkAction = useCallback((action) => {
    if (onBulkAction) {
      onBulkAction(action.id, selectedItems, bulkEditValues);
    }
    setBulkEditMode(null);
    setBulkEditValues({});
    setShowConfirmDialog(false);
    setPendingAction(null);
  }, [onBulkAction, selectedItems, bulkEditValues]);

  // Confirm action execution
  const confirmAction = useCallback(() => {
    if (pendingAction) {
      executeBulkAction(pendingAction);
    }
  }, [pendingAction, executeBulkAction]);

  // Get selection statistics
  const selectionStats = useMemo(() => {
    const total = items.length;
    const selected = selectedIds.length;
    const percentage = total > 0 ? Math.round((selected / total) * 100) : 0;
    
    return { total, selected, percentage };
  }, [items.length, selectedIds.length]);

  // Render bulk edit form based on item type
  const renderBulkEditForm = () => {
    switch (itemType) {
      case 'properties':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property Manager</label>
                <select
                  value={bulkEditValues.manager || ''}
                  onChange={(e) => setBulkEditValues(prev => ({ ...prev, manager: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Select Manager</option>
                  <option value="john_doe">John Doe</option>
                  <option value="jane_smith">Jane Smith</option>
                  <option value="mike_wilson">Mike Wilson</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={bulkEditValues.status || ''}
                  onChange={(e) => setBulkEditValues(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Keep Current</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Under Maintenance</option>
                </select>
              </div>
            </div>
          </div>
        );
      case 'tenants':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Rent Amount</label>
                <input
                  type="number"
                  value={bulkEditValues.rent || ''}
                  onChange={(e) => setBulkEditValues(prev => ({ ...prev, rent: e.target.value }))}
                  placeholder="Enter new rent amount"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lease End Date</label>
                <input
                  type="date"
                  value={bulkEditValues.leaseEnd || ''}
                  onChange={(e) => setBulkEditValues(prev => ({ ...prev, leaseEnd: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>
          </div>
        );
      case 'maintenance':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={bulkEditValues.status || ''}
                  onChange={(e) => setBulkEditValues(prev => ({ ...prev, status: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Keep Current</option>
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <select
                  value={bulkEditValues.priority || ''}
                  onChange={(e) => setBulkEditValues(prev => ({ ...prev, priority: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                >
                  <option value="">Keep Current</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned Contractor</label>
              <select
                value={bulkEditValues.contractor || ''}
                onChange={(e) => setBulkEditValues(prev => ({ ...prev, contractor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="">Select Contractor</option>
                <option value="abc_plumbing">ABC Plumbing</option>
                <option value="xyz_hvac">XYZ HVAC</option>
                <option value="elite_electrical">Elite Electrical</option>
              </select>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-center py-8 text-gray-500">
            Bulk edit not available for this item type
          </div>
        );
    }
  };

  if (selectedIds.length === 0) {
    return null;
  }

  return (
    <>
      {/* Bulk Operations Bar */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
        className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-xl shadow-2xl border border-gray-200 z-40"
      >
        <div className="flex items-center gap-4 px-6 py-4">
          {/* Selection Info */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <CheckCircleIcon className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <div className="font-semibold text-gray-900">
                {selectionStats.selected} item{selectionStats.selected !== 1 ? 's' : ''} selected
              </div>
              <div className="text-sm text-gray-600">
                {selectionStats.percentage}% of {selectionStats.total} total
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 border-l border-gray-200 pl-4">
            {/* Quick Actions */}
            <button
              onClick={() => handleBulkAction({ id: 'export', label: 'Export' })}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
              title="Export Selected"
            >
              <ArrowDownTrayIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>

            {/* More Actions Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsActionMenuOpen(!isActionMenuOpen)}
                className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
              >
                <span className="hidden sm:inline">More Actions</span>
                <ChevronDownIcon className={`w-4 h-4 transition-transform ${
                  isActionMenuOpen ? 'rotate-180' : ''
                }`} />
              </button>

              <AnimatePresence>
                {isActionMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    className="absolute bottom-full right-0 mb-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 py-2"
                  >
                    {getAvailableActions().map((action) => (
                      <button
                        key={action.id}
                        onClick={() => handleBulkAction(action)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-center gap-3"
                      >
                        <div className={`p-2 rounded-lg ${
                          action.color === 'red' ? 'bg-red-100' :
                          action.color === 'blue' ? 'bg-blue-100' :
                          action.color === 'green' ? 'bg-green-100' :
                          action.color === 'purple' ? 'bg-purple-100' :
                          'bg-orange-100'
                        }`}>
                          <action.icon className={`w-4 h-4 ${
                            action.color === 'red' ? 'text-red-600' :
                            action.color === 'blue' ? 'text-blue-600' :
                            action.color === 'green' ? 'text-green-600' :
                            action.color === 'purple' ? 'text-purple-600' :
                            'text-orange-600'
                          }`} />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{action.label}</div>
                          <div className="text-sm text-gray-500">{action.description}</div>
                        </div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Clear Selection */}
            <button
              onClick={() => onSelectionChange([])}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Clear Selection"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-100 rounded-b-xl overflow-hidden">
          <div 
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${selectionStats.percentage}%` }}
          />
        </div>
      </motion.div>

      {/* Bulk Edit Modal */}
      <AnimatePresence>
        {bulkEditMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setBulkEditMode(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Bulk Edit</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Editing {selectedIds.length} {itemType}
                    </p>
                  </div>
                  <button
                    onClick={() => setBulkEditMode(null)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <XMarkIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6">
                {renderBulkEditForm()}
              </div>

              <div className="p-6 border-t border-gray-200 flex items-center justify-end gap-3">
                <button
                  onClick={() => setBulkEditMode(null)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => executeBulkAction({ id: bulkEditMode })}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  Apply Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Dialog */}
      <AnimatePresence>
        {showConfirmDialog && pendingAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowConfirmDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-2xl w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-red-100 rounded-full">
                    <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Confirm Action</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                <div className="mb-6">
                  <p className="text-gray-700">
                    Are you sure you want to <strong>{pendingAction.label.toLowerCase()}</strong> {selectedIds.length} selected item{selectedIds.length !== 1 ? 's' : ''}?
                  </p>
                </div>

                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => setShowConfirmDialog(false)}
                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmAction}
                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    {pendingAction.label}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close dropdown */}
      {isActionMenuOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setIsActionMenuOpen(false)}
        />
      )}
    </>
  );
};

export default BulkOperations; 