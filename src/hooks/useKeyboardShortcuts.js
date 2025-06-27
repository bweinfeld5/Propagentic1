import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

// Global keyboard shortcuts configuration
const KEYBOARD_SHORTCUTS = {
  // Global shortcuts
  'cmd+k': 'Open global search',
  'ctrl+k': 'Open global search',
  'cmd+/': 'Show keyboard shortcuts help',
  'ctrl+/': 'Show keyboard shortcuts help',
  'escape': 'Close modal/cancel action',
  
  // Navigation shortcuts
  'g+d': 'Go to dashboard',
  'g+p': 'Go to properties',
  'g+t': 'Go to tenants',
  'g+m': 'Go to maintenance',
  'g+s': 'Go to settings',
  'g+r': 'Go to reports',
  
  // Action shortcuts
  'cmd+n': 'Create new (context-aware)',
  'ctrl+n': 'Create new (context-aware)',
  'cmd+s': 'Save current form',
  'ctrl+s': 'Save current form',
  'cmd+enter': 'Submit form',
  'ctrl+enter': 'Submit form',
  'cmd+z': 'Undo last action',
  'ctrl+z': 'Undo last action',
  
  // Bulk operations
  'cmd+a': 'Select all',
  'ctrl+a': 'Select all',
  'cmd+shift+a': 'Deselect all',
  'ctrl+shift+a': 'Deselect all',
  'delete': 'Delete selected items',
  'backspace': 'Delete selected items',
  
  // Quick actions
  'cmd+1': 'Switch to first tab',
  'ctrl+1': 'Switch to first tab',
  'cmd+2': 'Switch to second tab',
  'ctrl+2': 'Switch to second tab',
  'cmd+3': 'Switch to third tab',
  'ctrl+3': 'Switch to third tab',
  'cmd+4': 'Switch to fourth tab',
  'ctrl+4': 'Switch to fourth tab',
  
  // Search and filter
  'cmd+f': 'Focus search field',
  'ctrl+f': 'Focus search field',
  'cmd+shift+f': 'Advanced search',
  'ctrl+shift+f': 'Advanced search',
  
  // View toggles
  'cmd+shift+d': 'Toggle dark mode',
  'ctrl+shift+d': 'Toggle dark mode',
  'cmd+shift+s': 'Toggle sidebar',
  'ctrl+shift+s': 'Toggle sidebar'
};

const useKeyboardShortcuts = ({
  onOpenSearch,
  onShowHelp,
  onToggleDarkMode,
  onToggleSidebar,
  onSelectAll,
  onDeselectAll,
  onDeleteSelected,
  onCreateNew,
  onSave,
  onSubmit,
  onUndo,
  onSwitchTab,
  onFocusSearch,
  onAdvancedSearch,
  customShortcuts = {},
  disabled = false,
  context = 'global'
}) => {
  const navigate = useNavigate();
  const sequenceRef = useRef('');
  const sequenceTimeoutRef = useRef(null);

  // Helper function to normalize key combinations
  const normalizeKey = useCallback((event) => {
    const parts = [];
    
    if (event.ctrlKey || event.metaKey) {
      parts.push(event.metaKey ? 'cmd' : 'ctrl');
    }
    if (event.shiftKey) {
      parts.push('shift');
    }
    if (event.altKey) {
      parts.push('alt');
    }
    
    // Handle special keys
    let key = event.key.toLowerCase();
    if (key === ' ') key = 'space';
    if (key === 'arrowup') key = 'up';
    if (key === 'arrowdown') key = 'down';
    if (key === 'arrowleft') key = 'left';
    if (key === 'arrowright') key = 'right';
    
    parts.push(key);
    
    return parts.join('+');
  }, []);

  // Handle key sequences (like 'g+d' for navigation)
  const handleKeySequence = useCallback((key) => {
    // Clear previous timeout
    if (sequenceTimeoutRef.current) {
      clearTimeout(sequenceTimeoutRef.current);
    }
    
    // Add to sequence
    sequenceRef.current += key;
    
    // Check for matches
    const sequence = sequenceRef.current;
    const matchingShortcuts = Object.keys(KEYBOARD_SHORTCUTS).filter(shortcut => 
      shortcut.startsWith(sequence)
    );
    
    if (matchingShortcuts.length === 1 && matchingShortcuts[0] === sequence) {
      // Exact match found - execute the action
      executeShortcut(sequence);
      sequenceRef.current = '';
    } else if (matchingShortcuts.length === 0) {
      // No matches - reset sequence
      sequenceRef.current = '';
    } else {
      // Partial match - wait for more keys
      sequenceTimeoutRef.current = setTimeout(() => {
        sequenceRef.current = '';
      }, 1000);
    }
  }, []);

  // Execute a keyboard shortcut
  const executeShortcut = useCallback((shortcut) => {
    switch (shortcut) {
      // Global shortcuts
      case 'cmd+k':
      case 'ctrl+k':
        onOpenSearch?.();
        break;
      case 'cmd+/':
      case 'ctrl+/':
        onShowHelp?.();
        break;
      case 'escape':
        // Let browser handle escape for now
        break;
        
      // Navigation
      case 'g+d':
        navigate('/dashboard'); // Role-based redirect handled by RoleBasedRedirect
        break;
      case 'g+p':
        navigate('/properties');
        break;
      case 'g+t':
        navigate('/tenants');
        break;
      case 'g+m':
        navigate('/maintenance');
        break;
      case 'g+s':
        navigate('/settings');
        break;
      case 'g+r':
        navigate('/reports');
        break;
        
      // Actions
      case 'cmd+n':
      case 'ctrl+n':
        onCreateNew?.(context);
        break;
      case 'cmd+s':
      case 'ctrl+s':
        onSave?.();
        break;
      case 'cmd+enter':
      case 'ctrl+enter':
        onSubmit?.();
        break;
      case 'cmd+z':
      case 'ctrl+z':
        onUndo?.();
        break;
        
      // Bulk operations
      case 'cmd+a':
      case 'ctrl+a':
        onSelectAll?.();
        break;
      case 'cmd+shift+a':
      case 'ctrl+shift+a':
        onDeselectAll?.();
        break;
      case 'delete':
      case 'backspace':
        onDeleteSelected?.();
        break;
        
      // Tab switching
      case 'cmd+1':
      case 'ctrl+1':
        onSwitchTab?.(0);
        break;
      case 'cmd+2':
      case 'ctrl+2':
        onSwitchTab?.(1);
        break;
      case 'cmd+3':
      case 'ctrl+3':
        onSwitchTab?.(2);
        break;
      case 'cmd+4':
      case 'ctrl+4':
        onSwitchTab?.(3);
        break;
        
      // Search
      case 'cmd+f':
      case 'ctrl+f':
        onFocusSearch?.();
        break;
      case 'cmd+shift+f':
      case 'ctrl+shift+f':
        onAdvancedSearch?.();
        break;
        
      // View toggles
      case 'cmd+shift+d':
      case 'ctrl+shift+d':
        onToggleDarkMode?.();
        break;
      case 'cmd+shift+s':
      case 'ctrl+shift+s':
        onToggleSidebar?.();
        break;
        
      default:
        // Check custom shortcuts
        if (customShortcuts[shortcut]) {
          customShortcuts[shortcut]();
        }
        break;
    }
  }, [
    navigate,
    onOpenSearch,
    onShowHelp,
    onToggleDarkMode,
    onToggleSidebar,
    onSelectAll,
    onDeselectAll,
    onDeleteSelected,
    onCreateNew,
    onSave,
    onSubmit,
    onUndo,
    onSwitchTab,
    onFocusSearch,
    onAdvancedSearch,
    customShortcuts,
    context
  ]);

  // Main keyboard event handler
  const handleKeyDown = useCallback((event) => {
    if (disabled) return;
    
    // Don't interfere with form inputs unless it's a global shortcut
    if (event.target.tagName === 'INPUT' || 
        event.target.tagName === 'TEXTAREA' || 
        event.target.contentEditable === 'true') {
      
      // Only allow certain global shortcuts in form fields
      const key = normalizeKey(event);
      const globalShortcuts = ['cmd+k', 'ctrl+k', 'cmd+/', 'ctrl+/', 'escape'];
      
      if (!globalShortcuts.includes(key)) {
        return;
      }
    }
    
    const key = normalizeKey(event);
    
    // Check for immediate shortcuts (with modifiers)
    if (key.includes('cmd') || key.includes('ctrl') || key.includes('alt')) {
      const matchingShortcuts = Object.keys(KEYBOARD_SHORTCUTS).filter(shortcut => 
        shortcut === key
      );
      
      if (matchingShortcuts.length > 0) {
        event.preventDefault();
        executeShortcut(key);
        return;
      }
    }
    
    // Handle sequences for simple keys
    if (!event.ctrlKey && !event.metaKey && !event.altKey && !event.shiftKey) {
      const simpleKey = event.key.toLowerCase();
      if (simpleKey.match(/^[a-z0-9]$/)) {
        event.preventDefault();
        handleKeySequence(simpleKey);
        return;
      }
    }
    
    // Handle special keys
    if (['delete', 'backspace', 'escape'].includes(event.key.toLowerCase())) {
      const matchingShortcuts = Object.keys(KEYBOARD_SHORTCUTS).filter(shortcut => 
        shortcut === event.key.toLowerCase()
      );
      
      if (matchingShortcuts.length > 0) {
        event.preventDefault();
        executeShortcut(event.key.toLowerCase());
      }
    }
  }, [disabled, normalizeKey, executeShortcut, handleKeySequence]);

  // Set up event listeners
  useEffect(() => {
    if (disabled) return;
    
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (sequenceTimeoutRef.current) {
        clearTimeout(sequenceTimeoutRef.current);
      }
    };
  }, [handleKeyDown, disabled]);

  // Return available shortcuts for help display
  const getAvailableShortcuts = useCallback(() => {
    return { ...KEYBOARD_SHORTCUTS, ...customShortcuts };
  }, [customShortcuts]);

  return {
    shortcuts: KEYBOARD_SHORTCUTS,
    getAvailableShortcuts,
    executeShortcut
  };
};

export default useKeyboardShortcuts;