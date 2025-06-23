const classifyMaintenanceRequest = (description) => {
  if (description.toLowerCase().includes('pipe burst') || description.toLowerCase().includes('major leak')) {
    return { urgency: 'high', category: 'plumbing' };
  }
  if (description.toLowerCase().includes('flickering light')) {
    return { urgency: 'medium', category: 'electrical' };
  }
  return { urgency: 'low', category: 'general' };
};

export { classifyMaintenanceRequest }; 