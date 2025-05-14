import React from 'react';
import AnimatedBlueprintBackground from '../branding/AnimatedBlueprintBackground';

/**
 * A test component that displays each variant of the blueprint background
 * against different colored divs to check visibility
 */
const BlueprintTest = () => {
  return (
    <div className="min-h-screen w-full">
      <h1 className="text-2xl font-bold p-4 text-center">Blueprint Background Test</h1>
      
      {/* Test 1: Light background */}
      <div className="relative h-64 w-full bg-white border-b border-gray-300">
        <AnimatedBlueprintBackground density="normal" section="test-light" useInlineSvg={true} />
        <div className="relative z-20 p-4">
          <h2 className="font-bold">Test 1: White Background</h2>
          <p>Blueprint with normal density on white background</p>
        </div>
      </div>
      
      {/* Test 2: Gray background */}
      <div className="relative h-64 w-full bg-gray-100 border-b border-gray-300">
        <AnimatedBlueprintBackground density="dense" section="test-gray" useInlineSvg={true} />
        <div className="relative z-20 p-4">
          <h2 className="font-bold">Test 2: Gray Background</h2>
          <p>Blueprint with dense setting on light gray background</p>
        </div>
      </div>
      
      {/* Test 3: Dark background */}
      <div className="relative h-64 w-full bg-gray-800 text-white border-b border-gray-700">
        <AnimatedBlueprintBackground density="sparse" section="test-dark" useInlineSvg={true} />
        <div className="relative z-20 p-4">
          <h2 className="font-bold">Test 3: Dark Background</h2>
          <p>Blueprint with sparse setting on dark background</p>
        </div>
      </div>
      
      {/* Test 4: Colored background */}
      <div className="relative h-64 w-full bg-blue-100 border-b border-blue-200">
        <AnimatedBlueprintBackground density="normal" section="test-color" useInlineSvg={true} />
        <div className="relative z-20 p-4">
          <h2 className="font-bold">Test 4: Colored Background</h2>
          <p>Blueprint with normal density on light blue background</p>
        </div>
      </div>
      
      {/* Test 5: Gradient background (like hero) */}
      <div className="relative h-64 w-full bg-gradient-to-br from-indigo-900/90 via-blue-900/90 to-indigo-800/90 text-white">
        <AnimatedBlueprintBackground density="dense" section="test-gradient" useInlineSvg={true} />
        <div className="relative z-20 p-4">
          <h2 className="font-bold">Test 5: Gradient Background</h2>
          <p>Blueprint with dense setting on gradient background (like hero)</p>
        </div>
      </div>
      
      {/* Debug information */}
      <div className="p-4 bg-yellow-100 border-t border-yellow-200">
        <h2 className="font-bold">Debug Information</h2>
        <p>Check browser console for logging information</p>
        <p>Search the DOM for elements with data-testid="blueprint-grid-overlay" and data-testid="blueprint-details-overlay"</p>
        <p>Inspect CSS applied to these elements in the browser DevTools</p>
      </div>
    </div>
  );
};

export default BlueprintTest; 