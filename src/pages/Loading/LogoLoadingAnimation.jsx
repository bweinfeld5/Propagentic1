import React from "react";

const LogoLoadingAnimation = () => {
  return (
    <div className="flex justify-center items-center h-screen bg-[#F8F9FC]">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Node 1 */}
        <circle
          cx="100"
          cy="20"
          r="8"
          fill="#094067"
          className="animate-pulse delay-[0ms]"
        />
        {/* Node 2 */}
        <circle
          cx="40"
          cy="170"
          r="8"
          fill="#3DA9FC"
          className="animate-pulse delay-[500ms]"
        />
        {/* Node 3 */}
        <circle
          cx="160"
          cy="170"
          r="8"
          fill="#EF4565"
          className="animate-pulse delay-[1000ms]"
        />

        {/* Connecting Line 1 */}
        <line
          x1="100"
          y1="20"
          x2="40"
          y2="170"
          stroke="#094067"
          strokeWidth="4"
          className="opacity-0 animate-draw delay-[1500ms]"
        />
        {/* Connecting Line 2 */}
        <line
          x1="40"
          y1="170"
          x2="160"
          y2="170"
          stroke="#3DA9FC"
          strokeWidth="4"
          className="opacity-0 animate-draw delay-[2000ms]"
        />
        {/* Connecting Line 3 */}
        <line
          x1="160"
          y1="170"
          x2="100"
          y2="20"
          stroke="#EF4565"
          strokeWidth="4"
          className="opacity-0 animate-draw delay-[2500ms]"
        />
      </svg>
    </div>
  );
};

export default LogoLoadingAnimation;