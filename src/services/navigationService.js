/**
 * Navigation Service - Helper functions for standardized navigation in the application
 */

/**
 * Navigate to the maintenance request form with a pre-selected property
 * @param {Object} navigate - React Router navigate function from useNavigate hook
 * @param {string} propertyId - Optional property ID to pre-select
 * @param {Object} additionalState - Optional additional state to pass to the route
 */
export const navigateToMaintenanceForm = (navigate, propertyId = null, additionalState = {}) => {
  if (!navigate) {
    console.error('Navigation function is required');
    return;
  }

  // Build navigation state with property ID and any additional state
  const navigationState = {
    ...additionalState,
    ...(propertyId ? { propertyId } : {})
  };
  
  // Navigate to the maintenance form with state
  navigate('/maintenance/new', { state: navigationState });
};

/**
 * Navigate to the tenant dashboard
 * @param {Object} navigate - React Router navigate function from useNavigate hook
 */
export const navigateToTenantDashboard = (navigate) => {
  if (!navigate) {
    console.error('Navigation function is required');
    return;
  }
  
  navigate('/tenant/dashboard');
};

/**
 * Navigate to view a maintenance request detail
 * @param {Object} navigate - React Router navigate function from useNavigate hook
 * @param {string} ticketId - Maintenance ticket ID
 */
export const navigateToMaintenanceDetail = (navigate, ticketId) => {
  if (!navigate || !ticketId) {
    console.error('Navigation function and ticket ID are required');
    return;
  }
  
  navigate(`/maintenance/${ticketId}`, { state: { ticketId } });
};

/**
 * Navigate to property detail page
 * @param {Object} navigate - React Router navigate function from useNavigate hook
 * @param {string} propertyId - Property ID
 */
export const navigateToPropertyDetail = (navigate, propertyId) => {
  if (!navigate || !propertyId) {
    console.error('Navigation function and property ID are required');
    return;
  }
  
  navigate(`/property/${propertyId}`);
};

// Export all navigation functions as a default object for convenience
export default {
  navigateToMaintenanceForm,
  navigateToTenantDashboard,
  navigateToMaintenanceDetail,
  navigateToPropertyDetail
}; 