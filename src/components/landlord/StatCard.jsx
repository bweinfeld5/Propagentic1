import React from 'react';

/**
 * StatCard Component
 * 
 * A reusable card for displaying statistics.
 * 
 * @param {string} title - The title of the statistic
 * @param {string|number} value - The value to display
 * @param {React.ComponentType} icon - Icon component to display
 * @param {string} variant - Color variant ('primary', 'secondary', 'success', 'warning', 'danger', 'info', 'neutral') - default: 'primary'
 */
const StatCard = ({ title, value, icon: Icon, variant = 'primary' }) => {

  // Define styles based on variant
  const variantStyles = {
    primary:   { iconBg: 'bg-primary/10', iconText: 'text-primary dark:text-primary-light', valueText: 'text-primary dark:text-primary-light' },
    secondary: { iconBg: 'bg-secondary/10', iconText: 'text-secondary dark:text-secondary-light', valueText: 'text-secondary dark:text-secondary-light' },
    success:   { iconBg: 'bg-success-subtle dark:bg-success-darkSubtle', iconText: 'text-success dark:text-emerald-300', valueText: 'text-success dark:text-emerald-300' },
    warning:   { iconBg: 'bg-warning-subtle dark:bg-warning-darkSubtle', iconText: 'text-amber-600 dark:text-amber-300', valueText: 'text-amber-600 dark:text-amber-300' },
    danger:    { iconBg: 'bg-danger-subtle dark:bg-danger-darkSubtle', iconText: 'text-danger dark:text-red-400', valueText: 'text-danger dark:text-red-400' },
    info:      { iconBg: 'bg-info-subtle dark:bg-info-darkSubtle', iconText: 'text-info dark:text-blue-300', valueText: 'text-info dark:text-blue-300' },
    neutral:   { iconBg: 'bg-neutral-100 dark:bg-neutral-700', iconText: 'text-content-secondary dark:text-content-darkSecondary', valueText: 'text-content dark:text-content-dark' },
  };

  const styles = variantStyles[variant] || variantStyles.neutral; // Default to neutral if variant is invalid

  return (
    // Use theme colors for card background, border, shadow
    <div className="bg-background dark:bg-background-darkSubtle rounded-xl shadow-sm border border-border dark:border-border-dark p-6 transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          {/* Use theme text colors */}
          <p className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary truncate">{title}</p>
          <p className={`mt-1 text-3xl font-semibold ${styles.valueText}`}>{value}</p>
        </div>
        {/* Use variant colors for icon background/text */}
        <div className={`${styles.iconBg} p-3 rounded-full`}>
          {Icon && <Icon className={`w-6 h-6 ${styles.iconText}`} />}
        </div>
      </div>
    </div>
  );
};

export default StatCard; 