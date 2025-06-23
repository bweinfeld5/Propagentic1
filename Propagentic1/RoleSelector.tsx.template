import React from 'react';

// TypeScript interface for component props
interface RoleSelectorProps {
  roles: string[];
  selectedRole: string;
  onSelectRole: (role: string) => void;
  variant?: 'light' | 'dark';
}

/**
 * Role selector component to toggle between different user roles
 * Used in the hero section and potentially other places
 */
const RoleSelector: React.FC<RoleSelectorProps> = ({
  roles,
  selectedRole,
  onSelectRole,
  variant = 'light'
}) => {
  // Tailwind class conditions based on variant
  const getButtonClasses = (role: string) => {
    const isSelected = selectedRole === role;
    
    // Base classes
    const baseClasses = "px-4 py-2 text-sm font-medium focus:z-10 focus:outline-none transition-colors duration-200";
    
    // Light variant (for dark backgrounds)
    if (variant === 'light') {
      return `${baseClasses} ${
        isSelected
          ? 'bg-white text-primary shadow-md'
          : 'bg-primary-light/30 text-white hover:bg-primary-light/50'
      }`;
    }
    
    // Dark variant (for light backgrounds)
    return `${baseClasses} ${
      isSelected
        ? 'bg-primary text-white shadow-md'
        : 'bg-gray-100 text-gray-700 dark:bg-neutral-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-neutral-600'
    }`;
  };

  return (
    <div className="inline-flex rounded-md shadow-sm overflow-hidden">
      {roles.map((role) => (
        <button
          key={role}
          onClick={() => onSelectRole(role)}
          className={getButtonClasses(role)}
          aria-pressed={selectedRole === role}
          aria-label={`Select ${role} role`}
        >
          {role}
        </button>
      ))}
    </div>
  );
};

export default RoleSelector; 