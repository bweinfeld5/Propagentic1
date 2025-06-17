import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  HomeIcon,
  BuildingOfficeIcon,
  UserGroupIcon,
  WrenchScrewdriverIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

// Import Phase 3 components
import ActionFeedback from '../ui/ActionFeedback';
import useActionFeedback from '../../hooks/useActionFeedback';
import useKeyboardShortcuts from '../../hooks/useKeyboardShortcuts';
import KeyboardShortcutsHelp from '../ui/KeyboardShortcutsHelp';
import MobileTable from '../ui/MobileTable';
import SwipeableCard from '../ui/SwipeableCard';
import ContextualHelp, { helpConfigs } from '../ui/ContextualHelp';
import BulkOperations from '../bulk/BulkOperations';

const Phase3Demo = () => {
  const [selectedItems, setSelectedItems] = useState([]);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);
  const [activeDemo, setActiveDemo] = useState('feedback');

  // Setup action feedback
  const {
    feedbackState,
    showSuccess,
    showError,
    showLoading,
    showProgress,
    hideFeedback
  } = useActionFeedback();

  // Sample data for mobile table
  const sampleProperties = [
    {
      id: 1,
      name: 'Sunset Apartments',
      address: '123 Main St',
      units: 24,
      occupied: 22,
      rent: '$1,200',
      status: 'Active'
    },
    {
      id: 2,
      name: 'Ocean View Condos',
      address: '456 Beach Blvd',
      units: 16,
      occupied: 15,
      rent: '$1,800',
      status: 'Active'
    },
    {
      id: 3,
      name: 'Mountain Lodge',
      address: '789 Hill St',
      units: 8,
      occupied: 6,
      rent: '$2,200',
      status: 'Maintenance'
    }
  ];

  const tableColumns = [
    { header: 'Property', accessor: 'name' },
    { header: 'Address', accessor: 'address' },
    { header: 'Units', accessor: 'units' },
    { header: 'Occupied', accessor: 'occupied' },
    { header: 'Rent', accessor: 'rent' },
    { header: 'Status', accessor: 'status' }
  ];

  // Setup keyboard shortcuts
  const shortcuts = useKeyboardShortcuts({
    onOpenSearch: () => showSuccess('Search opened', 'Cmd/Ctrl+K pressed'),
    onShowHelp: () => setShowShortcutsHelp(true),
    onSelectAll: () => {
      setSelectedItems(sampleProperties.map(p => p.id));
      showSuccess('All items selected', 'Use bulk actions below');
    },
    onDeselectAll: () => {
      setSelectedItems([]);
      showSuccess('Selection cleared', 'All items deselected');
    },
    onDeleteSelected: () => {
      if (selectedItems.length > 0) {
        showSuccess('Items deleted', `${selectedItems.length} items removed`, {
          showUndo: true,
          onUndo: () => showSuccess('Deletion undone', 'Items restored')
        });
        setSelectedItems([]);
      }
    },
    customShortcuts: {
      'cmd+shift+d': () => setActiveDemo('feedback'),
      'cmd+shift+t': () => setActiveDemo('table'),
      'cmd+shift+s': () => setActiveDemo('swipe'),
      'cmd+shift+h': () => setActiveDemo('help')
    }
  });

  // Demo actions
  const handleSwipeLeft = (item) => {
    showError('Property deleted', `${item.name} has been removed`, {
      showRetry: true,
      onRetry: () => showSuccess('Property restored', 'Deletion cancelled')
    });
  };

  const handleSwipeRight = (item) => {
    showSuccess('Property archived', `${item.name} moved to archive`, {
      showUndo: true,
      onUndo: () => showSuccess('Archive undone', 'Property restored')
    });
  };

  const handleBulkAction = (action, items) => {
    showLoading('Processing bulk action', `Working on ${items.length} items`);
    
    // Simulate progress
    let progress = 0;
    const interval = setInterval(() => {
      progress += 20;
      showProgress('Bulk operation in progress', progress, `${items.length} items remaining`);
      
      if (progress >= 100) {
        clearInterval(interval);
        showSuccess('Bulk operation complete', `Successfully processed ${items.length} items`);
        setSelectedItems([]);
      }
    }, 500);
  };

  const demoSections = {
    feedback: {
      title: 'Action Feedback System',
      icon: HomeIcon,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Try the different feedback types:
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button
              onClick={() => showSuccess('Success!', 'Operation completed')}
              className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              Success
            </button>
            <button
              onClick={() => showError('Error!', 'Something went wrong', {
                showRetry: true,
                onRetry: () => showSuccess('Retry worked!', 'Operation succeeded')
              })}
              className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
            >
              Error
            </button>
            <button
              onClick={() => showLoading('Loading...', 'Please wait')}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
            >
              Loading
            </button>
            <button
              onClick={() => {
                let progress = 0;
                const interval = setInterval(() => {
                  progress += 25;
                  showProgress('Processing', progress);
                  if (progress >= 100) {
                    clearInterval(interval);
                    showSuccess('Complete!', 'Process finished');
                  }
                }, 500);
              }}
              className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm"
            >
              Progress
            </button>
          </div>
        </div>
      )
    },
    table: {
      title: 'Mobile-Responsive Table',
      icon: BuildingOfficeIcon,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            This table transforms into cards on mobile with touch-friendly interactions:
          </p>
          <MobileTable
            data={sampleProperties}
            columns={tableColumns}
            onRowClick={(item) => showSuccess('Property selected', `Clicked on ${item.name}`)}
            onRowLongPress={(item) => showSuccess('Context menu', `Long pressed ${item.name}`)}
            searchPlaceholder="Search properties..."
          />
        </div>
      )
    },
    swipe: {
      title: 'Swipeable Cards',
      icon: WrenchScrewdriverIcon,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Swipe left to delete, right to archive:
          </p>
          <div className="space-y-3">
            {sampleProperties.map((property) => (
              <SwipeableCard
                key={property.id}
                onSwipeLeft={() => handleSwipeLeft(property)}
                onSwipeRight={() => handleSwipeRight(property)}
                leftAction="delete"
                rightAction="archive"
                className="p-4"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {property.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {property.address}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {property.rent}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {property.occupied}/{property.units} units
                    </p>
                  </div>
                </div>
              </SwipeableCard>
            ))}
          </div>
        </div>
      )
    },
    help: {
      title: 'Contextual Help System',
      icon: QuestionMarkCircleIcon,
      content: (
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-300">
            Hover over or click the help icons to see contextual assistance:
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">Keyboard Shortcuts</h4>
                <ContextualHelp
                  {...helpConfigs.keyboard}
                  trigger="hover"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Learn about available keyboard shortcuts
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">Bulk Operations</h4>
                <ContextualHelp
                  {...helpConfigs.bulk}
                  trigger="click"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                How to select and manage multiple items
              </p>
            </div>
            
            <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <h4 className="font-medium">Mobile Gestures</h4>
                <ContextualHelp
                  {...helpConfigs.mobile}
                  trigger="focus"
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Touch interactions and swipe gestures
              </p>
            </div>
          </div>
        </div>
      )
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Phase 3: UX Polish Demo
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          Experience all the new Phase 3 UX enhancements. Try keyboard shortcuts, mobile gestures, 
          and contextual help features.
        </p>
        
        {/* Quick Actions */}
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            onClick={() => setShowShortcutsHelp(true)}
            className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded text-sm hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            Show Shortcuts (Cmd/Ctrl+/)
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1">
            Try: Cmd/Ctrl+A (select all), Cmd/Ctrl+K (search), G+D (dashboard)
          </span>
        </div>
      </div>

      {/* Demo Navigation */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {Object.entries(demoSections).map(([key, section]) => (
            <button
              key={key}
              onClick={() => setActiveDemo(key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeDemo === key
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <section.icon className="w-4 h-4" />
              {section.title}
            </button>
          ))}
        </div>
      </div>

      {/* Active Demo Content */}
      <motion.div
        key={activeDemo}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6"
      >
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          {demoSections[activeDemo].title}
        </h2>
        {demoSections[activeDemo].content}
      </motion.div>

      {/* Bulk Operations (when items are selected) */}
      {selectedItems.length > 0 && (
        <BulkOperations
          items={sampleProperties}
          selectedIds={selectedItems}
          onSelectionChange={setSelectedItems}
          onBulkAction={handleBulkAction}
          itemType="properties"
        />
      )}

      {/* Action Feedback */}
      <ActionFeedback
        {...feedbackState}
        onClose={hideFeedback}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={showShortcutsHelp}
        onClose={() => setShowShortcutsHelp(false)}
        shortcuts={shortcuts.getAvailableShortcuts()}
      />

      {/* Footer */}
      <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
          🎯 Phase 3 Features Implemented:
        </h3>
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>✅ Smart confirmation dialogs with typing verification</li>
          <li>✅ Action feedback system with undo/retry options</li>
          <li>✅ Comprehensive keyboard shortcuts (25+ shortcuts)</li>
          <li>✅ Mobile-responsive tables with touch interactions</li>
          <li>✅ Swipeable cards with configurable actions</li>
          <li>✅ Contextual help system with progressive disclosure</li>
          <li>✅ Bulk operations with real-time progress tracking</li>
          <li>✅ Advanced animations and micro-interactions</li>
        </ul>
      </div>
    </div>
  );
};

export default Phase3Demo;