import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../../lib/utils';
import { 
  Search, 
  X, 
  Command,
  ArrowRight,
  Clock,
  Star,
  Hash,
  FileText,
  Camera,
  AlertCircle
} from 'lucide-react';

export interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  category?: string;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: CommandItem[];
  placeholder?: string;
  recentCommands?: string[];
  onCommandExecute?: (command: CommandItem) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  commands,
  placeholder = "Type a command or search...",
  recentCommands = [],
  onCommandExecute
}) => {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Filter commands based on search
  const filteredCommands = commands.filter(command => {
    const searchLower = search.toLowerCase();
    return (
      command.title.toLowerCase().includes(searchLower) ||
      command.subtitle?.toLowerCase().includes(searchLower) ||
      command.keywords?.some(keyword => keyword.toLowerCase().includes(searchLower))
    );
  });

  // Group commands by category
  const groupedCommands = filteredCommands.reduce((acc, command) => {
    const category = command.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(command);
    return acc;
  }, {} as Record<string, CommandItem[]>);

  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      inputRef.current?.focus();
    }
  }, [isOpen]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev < filteredCommands.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => 
            prev > 0 ? prev - 1 : filteredCommands.length - 1
          );
          break;
        case 'Enter':
          e.preventDefault();
          if (filteredCommands[selectedIndex]) {
            executeCommand(filteredCommands[selectedIndex]);
          }
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredCommands, selectedIndex]);

  const executeCommand = (command: CommandItem) => {
    command.action();
    onCommandExecute?.(command);
    onClose();
  };

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'navigation':
        return <ArrowRight className="w-4 h-4" />;
      case 'actions':
        return <Command className="w-4 h-4" />;
      case 'recent':
        return <Clock className="w-4 h-4" />;
      case 'favorites':
        return <Star className="w-4 h-4" />;
      default:
        return <Hash className="w-4 h-4" />;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Command palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: "spring", duration: 0.2 }}
            className="fixed inset-x-0 top-20 z-50 mx-auto max-w-2xl"
          >
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-800 overflow-hidden">
              {/* Search input */}
              <div className="relative border-b border-gray-200 dark:border-gray-800">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder={placeholder}
                  className="w-full pl-12 pr-12 py-4 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:outline-none"
                />
                <button
                  onClick={onClose}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>
              </div>

              {/* Command list */}
              <div 
                ref={listRef}
                className="max-h-[400px] overflow-y-auto py-2"
              >
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No commands found</p>
                    <p className="text-sm mt-1">Try a different search term</p>
                  </div>
                ) : (
                  Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                    <div key={category}>
                      {/* Category header */}
                      <div className="px-4 py-2 flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                        {getCategoryIcon(category)}
                        {category}
                      </div>

                      {/* Category commands */}
                      {categoryCommands.map((command, index) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        const isSelected = globalIndex === selectedIndex;

                        return (
                          <motion.button
                            key={command.id}
                            onMouseEnter={() => setSelectedIndex(globalIndex)}
                            onClick={() => executeCommand(command)}
                            className={cn(
                              "w-full px-4 py-3 flex items-center gap-3 transition-colors",
                              isSelected
                                ? "bg-orange-50 dark:bg-orange-900/20"
                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                            )}
                          >
                            {/* Command icon */}
                            <div className={cn(
                              "p-2 rounded-lg",
                              isSelected
                                ? "bg-orange-100 text-orange-600 dark:bg-orange-800 dark:text-orange-400"
                                : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                            )}>
                              {command.icon || <FileText className="w-4 h-4" />}
                            </div>

                            {/* Command info */}
                            <div className="flex-1 text-left">
                              <div className="font-medium text-gray-900 dark:text-gray-100">
                                {command.title}
                              </div>
                              {command.subtitle && (
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  {command.subtitle}
                                </div>
                              )}
                            </div>

                            {/* Shortcut */}
                            {command.shortcut && (
                              <div className="text-xs text-gray-400 dark:text-gray-500">
                                <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded">
                                  {command.shortcut}
                                </kbd>
                              </div>
                            )}

                            {/* Selection indicator */}
                            {isSelected && (
                              <ArrowRight className="w-4 h-4 text-orange-500" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="border-t border-gray-200 dark:border-gray-800 px-4 py-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↑</kbd>
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↓</kbd>
                    Navigate
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">↵</kbd>
                    Select
                  </span>
                  <span className="flex items-center gap-1">
                    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded">esc</kbd>
                    Close
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Command className="w-3 h-3" />
                  <span>Command Palette</span>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}; 