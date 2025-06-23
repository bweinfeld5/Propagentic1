import React, { createContext, useContext, useState } from 'react';

// Create a context for demo mode
const DemoModeContext = createContext({
  isDemo: false,
  toggleDemo: () => {}
});

// Custom hook to use demo mode context
export const useDemoMode = () => useContext(DemoModeContext);

// Provider component
export const DemoModeProvider = ({ children }) => {
  const [isDemo, setIsDemo] = useState(false);

  const toggleDemo = () => setIsDemo(prev => !prev);

  return (
    <DemoModeContext.Provider value={{ isDemo, toggleDemo }}>
      {children}
    </DemoModeContext.Provider>
  );
};

export default DemoModeProvider;
