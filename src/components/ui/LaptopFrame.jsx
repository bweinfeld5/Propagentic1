import React from 'react';

/**
 * A realistic laptop frame component with proper bezels and styling
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Content to display inside the laptop screen
 * @param {string} props.className - Additional classes for the container
 */
const LaptopFrame = ({ children, className = '' }) => {
  return (
    <div className={`relative ${className}`}>
      {/* Laptop Base/Stand */}
      <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-gradient-to-t from-slate-300 to-slate-200 rounded-t-2xl shadow-lg"></div>
      
      {/* Laptop Screen Frame */}
      <div className="bg-gradient-to-b from-slate-800 via-slate-700 to-slate-800 p-3 rounded-2xl shadow-2xl">
        {/* Screen Bezel */}
        <div className="bg-black p-1 rounded-xl shadow-inner">
          {/* Actual Screen */}
          <div className="bg-white rounded-lg overflow-hidden shadow-lg relative aspect-[16/10]">
            {/* macOS-style Window Controls */}
            <div className="flex items-center justify-between bg-gray-100 px-4 py-2 border-b border-gray-200">
              <div className="flex space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="text-xs font-medium text-gray-600">
                PropAgentic Dashboard
              </div>
              <div className="w-12"></div>
            </div>

            {/* Screen Content */}
            {children}
          </div>
        </div>
      </div>

      {/* Reflection/Glow Effects */}
      <div className="absolute inset-0 bg-gradient-to-t from-blue-500/5 via-transparent to-transparent rounded-2xl pointer-events-none"></div>
    </div>
  );
};

export default LaptopFrame; 