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

interface BulkOperationsProps {
  items?: any[];
  selectedIds?: string[];
  onSelectionChange?: (ids: string[]) => void;
  onBulkAction: (action: string, ids: string[], data?: any) => void;
  itemType?: 'properties' | 'tenants' | 'maintenance' | 'documents' | 'generic';
}

/**
 * Advanced Bulk Operations System
 * Phase 1.2 Implementation
 */
const BulkOperations: React.FC<BulkOperationsProps> = ({ 
  items = [], 
  selectedIds = [], 
  onSelectionChange,
  onBulkAction,
  itemType = 'generic'
}) => {
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingAction, setPendingAction] = useState<any>(null);
  const [bulkEditMode, setBulkEditMode] = useState<string | null>(null);
  const [bulkEditValues, setBulkEditValues] = useState<any>({});

  // Selected items data
  const selectedItems = useMemo(() => 
    items.filter(item => selectedIds.includes(item.id)),
    [items, selectedIds]
  );

  const executeBulkAction = useCallback((action: { id: string }) => {
    if (onBulkAction) {
      onBulkAction(action.id, selectedIds, bulkEditValues);
    }
    setBulkEditMode(null);
    setBulkEditValues({});
    setShowConfirmDialog(false);
    setPendingAction(null);
  }, [onBulkAction, selectedIds, bulkEditValues]);

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
    if (onSelectionChange) {
        if (selectedIds.length === items.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(items.map(item => item.id));
        }
    }
  }, [items, selectedIds, onSelectionChange]);

  // Handle individual selection
  const handleItemSelection = useCallback((itemId: string) => {
    if (onSelectionChange) {
        if (selectedIds.includes(itemId)) {
            onSelectionChange(selectedIds.filter(id => id !== itemId));
        } else {
            onSelectionChange([...selectedIds, itemId]);
        }
    }
  }, [selectedIds, onSelectionChange]);

  // Handle bulk action execution
  const handleBulkActionClick = useCallback((action: any) => {
    if (action.requiresConfirmation) {
      setPendingAction(action);
      setShowConfirmDialog(true);
    } else if (action.id === 'bulk_edit') {
      setBulkEditMode(action.id);
    } else {
      executeBulkAction(action);
    }
    setIsActionMenuOpen(false);
  }, [executeBulkAction]);

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

  const handleBulkEditChange = (field: string, value: any) => {
    setBulkEditValues((prev: any) => ({ ...prev, [field]: value }));
  };

  const renderBulkEditForm = () => {
    // ... form rendering logic
    return <div>Bulk edit form for {itemType}</div>;
  };

  if (!selectedIds || selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-4xl p-4 z-50">
      {/* ... JSX ... */}
    </div>
  );
};

export default BulkOperations; 