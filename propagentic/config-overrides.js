module.exports = function override(config) {
  // Add resolve fallbacks for problematic modules
  config.resolve = {
    ...config.resolve,
    fallback: {
      ...config.resolve.fallback,
      "react-dom/server": false,
      "child_process": false
    }
  };
  return config;
};
