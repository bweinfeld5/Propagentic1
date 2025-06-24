import React from 'react';

const BulkOperations = ({ items, selectedIds, onSelectionChange, onBulkAction, itemType }) => {
  // Placeholder component for bulk operations
  // In a real implementation, this would handle bulk actions like delete, export, etc.
  
  if (!selectedIds || selectedIds.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg border border-gray-200 p-4 z-40">
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {selectedIds.length} {itemType} selected
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => onBulkAction('export', items.filter(item => selectedIds.includes(item.id)))}
            className="px-3 py-1 text-xs bg-orange-100 text-orange-700 rounded hover:bg-orange-200 transition-colors"
          >
            Export
          </button>
          <button
            onClick={() => onBulkAction('delete', items.filter(item => selectedIds.includes(item.id)))}
            className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
          >
            Delete
          </button>
          <button
            onClick={() => onSelectionChange([])}
            className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations; 