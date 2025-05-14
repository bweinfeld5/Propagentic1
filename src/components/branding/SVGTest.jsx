import React from 'react';

/**
 * SVGTest - A component to test different SVG rendering methods
 */
const SVGTest = () => {
  return (
    <div className="p-8">
      <h2 className="text-2xl font-bold mb-6">SVG Rendering Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Method 1: Direct public URL */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Method 1: Direct Public URL</h3>
          <div 
            style={{ 
              width: '300px', 
              height: '300px', 
              backgroundImage: 'url(/assets/blueprint-grid.svg)',
              backgroundRepeat: 'repeat',
              border: '1px solid #ccc'
            }} 
          />
        </div>
        
        {/* Method 2: Using IMG tag */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Method 2: IMG Tag</h3>
          <img 
            src="/assets/blueprint-details.svg" 
            alt="Blueprint Details" 
            style={{ width: '300px', height: '300px', border: '1px solid #ccc' }} 
          />
        </div>
        
        {/* Method 3: Inline SVG */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Method 3: Inline SVG</h3>
          <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg" style={{ border: '1px solid #ccc' }}>
            <rect width="100%" height="100%" fill="#f0f0f0" />
            <circle cx="150" cy="150" r="50" fill="#3DA9FC" opacity="0.4" />
            <rect x="50" y="50" width="80" height="80" stroke="#3DA9FC" fill="none" strokeWidth="1" opacity="0.3" />
            <rect x="180" y="180" width="60" height="60" stroke="#EF4565" fill="none" strokeWidth="1" opacity="0.3" />
          </svg>
        </div>
        
        {/* Method 4: Background Image in CSS */}
        <div className="border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Method 4: Background in CSS</h3>
          <div className="blueprint-grid-bg" style={{ width: '300px', height: '300px', border: '1px solid #ccc' }} />
          <style jsx>{`
            .blueprint-grid-bg {
              background-image: url('/assets/blueprint-grid.svg');
              background-repeat: repeat;
              background-size: auto;
            }
          `}</style>
        </div>
      </div>
    </div>
  );
};

export default SVGTest; 