import React, { useState, useEffect, useRef } from 'react';
import { Search, Command, Home, Plus, Clock, Settings, LogOut, FileText } from 'lucide-react';

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
  keywords: string[];
  category: 'navigation' | 'actions' | 'recent';
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (path: string) => void;
  recentActions?: string[];
}

const CommandPalette: React.FC<CommandPaletteProps> = ({ 
  isOpen, 
  onClose, 
  onNavigate,
  recentActions = []
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: CommandItem[] = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View your property overview',
      icon: <Home className="w-4 h-4" />,
      action: () => onNavigate('/dashboard'),
      keywords: ['dashboard', 'home', 'overview'],
      category: 'navigation'
    },
    {
      id: 'new-request',
      title: 'Submit New Request',
      subtitle: 'Report a maintenance issue',
      icon: <Plus className="w-4 h-4" />,
      action: () => onNavigate('/maintenance/new'),
      keywords: ['new', 'request', 'maintenance', 'submit', 'issue'],
      category: 'actions'
    },
    {
      id: 'request-history',
      title: 'View Request History',
      subtitle: 'See all your past requests',
      icon: <Clock className="w-4 h-4" />,
      action: () => onNavigate('/requests'),
      keywords: ['history', 'past', 'requests', 'maintenance'],
      category: 'navigation'
    },
    {
      id: 'settings',
      title: 'Account Settings',
      subtitle: 'Manage your preferences',
      icon: <Settings className="w-4 h-4" />,
      action: () => onNavigate('/settings'),
      keywords: ['settings', 'account', 'preferences', 'profile'],
      category: 'navigation'
    },
    {
      id: 'documents',
      title: 'View Documents',
      subtitle: 'Access lease and property docs',
      icon: <FileText className="w-4 h-4" />,
      action: () => onNavigate('/documents'),
      keywords: ['documents', 'lease', 'files', 'papers'],
      category: 'navigation'
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.title.toLowerCase().includes(query.toLowerCase()) ||
    command.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
    command.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
  );

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, filteredCommands.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm">
      <div className="flex items-start justify-center pt-20 px-4">
        <div className="w-full max-w-2xl bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden">
          {/* Search Input */}
          <div className="flex items-center px-4 py-3 border-b border-gray-100">
            <Search className="w-5 h-5 text-gray-400 mr-3" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search commands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder-gray-500"
            />
            <div className="flex items-center space-x-1 text-xs text-gray-400">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Commands List */}
          <div className="max-h-80 overflow-y-auto">
            {filteredCommands.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-500">
                <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                <p>No commands found</p>
              </div>
            ) : (
              <div className="py-2">
                {filteredCommands.map((command, index) => (
                  <div
                    key={command.id}
                    className={`px-4 py-3 cursor-pointer transition-colors ${
                      index === selectedIndex
                        ? 'bg-orange-50 border-r-2 border-orange-500'
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => {
                      command.action();
                      onClose();
                    }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg ${
                        index === selectedIndex ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {command.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium truncate ${
                          index === selectedIndex ? 'text-orange-900' : 'text-gray-900'
                        }`}>
                          {command.title}
                        </p>
                        {command.subtitle && (
                          <p className={`text-sm truncate ${
                            index === selectedIndex ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            {command.subtitle}
                          </p>
                        )}
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {index === selectedIndex ? '↵' : ''}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            <div className="flex items-center justify-between">
              <span>Navigate with ↑↓, select with ↵</span>
              <span>ESC to close</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Hook for global command palette
export const useCommandPalette = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
};

export default CommandPalette; 