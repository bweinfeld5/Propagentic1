import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  XMarkIcon,
  MagnifyingGlassIcon,
  CommandLineIcon,
  GlobeAltIcon,
  ArrowsRightLeftIcon,
  CursorArrowRaysIcon,
  BoltIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import AccessibleModal from './AccessibleModal';

const KeyboardShortcutsHelp = ({ isOpen, onClose, shortcuts = {} }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Organize shortcuts by category
  const organizedShortcuts = useMemo(() => {
    const categories = {
      global: {
        title: 'Global',
        icon: GlobeAltIcon,
        shortcuts: {}
      },
      navigation: {
        title: 'Navigation',
        icon: ArrowsRightLeftIcon,
        shortcuts: {}
      },
      actions: {
        title: 'Actions',
        icon: BoltIcon,
        shortcuts: {}
      },
      selection: {
        title: 'Selection',
        icon: CursorArrowRaysIcon,
        shortcuts: {}
      },
      tabs: {
        title: 'Tabs',
        icon: AdjustmentsHorizontalIcon,
        shortcuts: {}
      },
      search: {
        title: 'Search',
        icon: MagnifyingGlassIcon,
        shortcuts: {}
      }
    };

    Object.entries(shortcuts).forEach(([key, description]) => {
      if (key.includes('cmd+k') || key.includes('ctrl+k') || key.includes('cmd+/') || key.includes('ctrl+/') || key.includes('escape')) {
        categories.global.shortcuts[key] = description;
      } else if (key.startsWith('g+')) {
        categories.navigation.shortcuts[key] = description;
      } else if (key.includes('cmd+n') || key.includes('ctrl+n') || key.includes('cmd+s') || key.includes('ctrl+s') || 
                 key.includes('cmd+enter') || key.includes('ctrl+enter') || key.includes('cmd+z') || key.includes('ctrl+z')) {
        categories.actions.shortcuts[key] = description;
      } else if (key.includes('cmd+a') || key.includes('ctrl+a') || key.includes('delete') || key.includes('backspace')) {
        categories.selection.shortcuts[key] = description;
      } else if (key.includes('cmd+1') || key.includes('ctrl+1') || key.includes('cmd+2') || key.includes('ctrl+2') ||
                 key.includes('cmd+3') || key.includes('ctrl+3') || key.includes('cmd+4') || key.includes('ctrl+4')) {
        categories.tabs.shortcuts[key] = description;
      } else if (key.includes('cmd+f') || key.includes('ctrl+f') || key.includes('cmd+shift+f') || key.includes('ctrl+shift+f')) {
        categories.search.shortcuts[key] = description;
      } else {
        categories.actions.shortcuts[key] = description;
      }
    });

    return categories;
  }, [shortcuts]);

  // Filter shortcuts based on search query
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return organizedShortcuts;

    const filtered = {};
    Object.entries(organizedShortcuts).forEach(([categoryKey, category]) => {
      const filteredShortcuts = {};
      Object.entries(category.shortcuts).forEach(([key, description]) => {
        if (
          key.toLowerCase().includes(searchQuery.toLowerCase()) ||
          description.toLowerCase().includes(searchQuery.toLowerCase())
        ) {
          filteredShortcuts[key] = description;
        }
      });

      if (Object.keys(filteredShortcuts).length > 0) {
        filtered[categoryKey] = {
          ...category,
          shortcuts: filteredShortcuts
        };
      }
    });

    return filtered;
  }, [organizedShortcuts, searchQuery]);

  // Format keyboard shortcut for display
  const formatShortcut = (shortcut) => {
    return shortcut
      .split('+')
      .map(key => {
        switch (key) {
          case 'cmd':
            return '⌘';
          case 'ctrl':
            return 'Ctrl';
          case 'shift':
            return '⇧';
          case 'alt':
            return '⌥';
          case 'enter':
            return '↵';
          case 'escape':
            return 'Esc';
          case 'space':
            return 'Space';
          case 'delete':
            return 'Del';
          case 'backspace':
            return '⌫';
          default:
            return key.toUpperCase();
        }
      });
  };

  const KeyShortcut = ({ shortcut }) => {
    const keys = formatShortcut(shortcut);
    
    return (
      <div className="flex items-center gap-1">
        {keys.map((key, index) => (
          <React.Fragment key={index}>
            <kbd className="px-2 py-1 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="text-gray-400 dark:text-gray-500 text-xs">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    );
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title="Keyboard Shortcuts"
      size="lg"
      className="keyboard-shortcuts-help"
    >
      <div className="space-y-6">
        {/* Search */}
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search shortcuts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {/* Shortcuts by Category */}
        <div className="space-y-6 max-h-96 overflow-y-auto">
          <AnimatePresence>
            {Object.entries(filteredCategories).map(([categoryKey, category]) => (
              <motion.div
                key={categoryKey}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-3"
              >
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200 dark:border-gray-700">
                  <category.icon className="w-5 h-5 text-orange-500" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {category.title}
                  </h3>
                </div>
                
                <div className="grid gap-2">
                  {Object.entries(category.shortcuts).map(([key, description]) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {description}
                      </span>
                      <KeyShortcut shortcut={key} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* No results message */}
        {Object.keys(filteredCategories).length === 0 && searchQuery && (
          <div className="text-center py-8">
            <CommandLineIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">
              No shortcuts found for "{searchQuery}"
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 dark:text-blue-200 mb-2">
            💡 Tips
          </h4>
          <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
            <li>• Press <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">Cmd/Ctrl + K</kbd> to quickly open search</li>
            <li>• Use <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">G</kbd> followed by a letter to navigate (e.g., G + D for Dashboard)</li>
            <li>• Most shortcuts work globally, even when typing in forms</li>
            <li>• Press <kbd className="px-1 py-0.5 bg-blue-100 dark:bg-blue-800 rounded text-xs">Esc</kbd> to close modals and cancel actions</li>
          </ul>
        </div>
      </div>
    </AccessibleModal>
  );
};

export default KeyboardShortcutsHelp;