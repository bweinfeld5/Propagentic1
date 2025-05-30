import React from 'react';
// Remove the CSS import since it's not available
// import { DeviceFrame } from 'react-device-frame';
// import 'react-device-frame/dist/index.css';

interface RealisticLaptopProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * A highly realistic MacBook Pro laptop component that mimics professional product photography
 * Features sophisticated aluminum gradients, 3D perspective, and realistic materials
 */
const RealisticLaptop: React.FC<RealisticLaptopProps> = ({ children, className = '' }) => {
  return (
    <div className={`${className} relative`}>
      {/* Main laptop container with 3D perspective */}
      <div className="relative mx-auto transform-gpu transition-transform duration-500 hover:scale-[1.02] hover:-translate-y-1 group">
        
        {/* Multiple shadow layers for realism */}
        <div className="absolute inset-0 transform translate-y-6 translate-x-2">
          {/* Ambient shadow */}
          <div className="absolute inset-0 bg-black/15 blur-3xl rounded-2xl scale-110"></div>
          {/* Contact shadow */}
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-6 bg-black/25 blur-xl rounded-full"></div>
        </div>

        {/* Laptop assembly */}
        <div className="relative aspect-[4/3] max-w-md mx-auto">
          
          {/* Laptop base/keyboard deck */}
          <div className="absolute bottom-0 left-0 right-0 h-8 transform -skew-x-2 origin-bottom">
            {/* Main aluminum surface */}
            <div className="h-full bg-gradient-to-br from-slate-300 via-slate-200 to-slate-350 dark:from-slate-600 dark:via-slate-500 dark:to-slate-650 rounded-2xl relative overflow-hidden shadow-2xl">
              
              {/* Brushed aluminum texture overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50 dark:via-white/15"></div>
              
              {/* Keyboard area */}
              <div className="absolute inset-x-3 top-1 bottom-1 bg-gradient-to-b from-slate-400/20 to-slate-600/30 dark:from-slate-700/40 dark:to-slate-800/40 rounded-lg">
                {/* Keyboard key pattern */}
                <div className="absolute inset-1 opacity-40">
                  <div className="grid grid-cols-16 gap-px h-full">
                    {Array.from({ length: 80 }).map((_, i) => (
                      <div key={i} className="bg-slate-600/25 dark:bg-slate-800/30 rounded-[1px]"></div>
                    ))}
                  </div>
                </div>
                
                {/* Trackpad */}
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-6 h-1.5 bg-slate-500/30 dark:bg-slate-700/40 rounded-sm border border-slate-500/30"></div>
              </div>

              {/* Edge highlights */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"></div>
              <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500/50 to-transparent"></div>
            </div>
          </div>

          {/* Screen assembly */}
          <div className="absolute top-0 left-0 right-0 bottom-8 transform -skew-x-1 origin-bottom">
            {/* Screen back/lid */}
            <div className="relative h-full bg-gradient-to-br from-slate-300 via-slate-250 to-slate-400 dark:from-slate-600 dark:via-slate-550 dark:to-slate-700 rounded-t-2xl shadow-2xl overflow-hidden">
              
              {/* Aluminum finish on lid */}
              <div className="absolute inset-0 bg-gradient-to-br from-slate-100/50 via-transparent to-slate-600/30 rounded-t-2xl"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-60"></div>
              
              {/* Apple logo area (subtle) */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2.5 bg-slate-500/25 dark:bg-slate-700/30 rounded-sm opacity-60"></div>

              {/* Screen bezel and display */}
              <div className="absolute inset-2 bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-xl shadow-inner border border-slate-700/60 overflow-hidden">
                
                {/* Screen surface effects */}
                <div className="absolute inset-0 bg-gradient-to-br from-slate-600/8 via-transparent to-slate-900/15 rounded-xl"></div>
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-slate-300/3 to-transparent rounded-xl"></div>
                
                {/* Browser window */}
                <div className="relative h-full flex flex-col rounded-xl overflow-hidden">
                  
                  {/* macOS title bar */}
                  <div className="h-5 bg-gradient-to-b from-slate-750 to-slate-800 flex items-center px-2 border-b border-slate-600/40 shrink-0">
                    {/* Traffic light buttons */}
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-red-400 to-red-600 shadow-sm ring-1 ring-red-700/20"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 shadow-sm ring-1 ring-yellow-700/20"></div>
                      <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-br from-green-400 to-green-600 shadow-sm ring-1 ring-green-700/20"></div>
                    </div>
                    
                    {/* URL bar */}
                    <div className="flex-1 mx-2">
                      <div className="h-1.5 bg-slate-650 rounded-sm mx-auto w-3/5 opacity-70"></div>
                    </div>
                  </div>
                  
                  {/* Screen content area */}
                  <div className="flex-1 relative overflow-hidden bg-white dark:bg-slate-900">
                    {/* LCD depth and anti-glare effects */}
                    <div className="absolute inset-0 bg-gradient-to-b from-slate-900/3 to-transparent pointer-events-none z-10"></div>
                    
                    {/* Main content */}
                    <div className="relative h-full w-full">
                      {children}
                    </div>
                    
                    {/* Screen surface reflections */}
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-100/3 via-transparent to-slate-900/8 pointer-events-none z-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-blue-200/2 to-transparent pointer-events-none z-10"></div>
                  </div>
                </div>
              </div>

              {/* Screen edge lighting */}
              <div className="absolute top-2 left-2 right-2 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full"></div>
              <div className="absolute bottom-2 left-2 right-2 h-px bg-gradient-to-r from-transparent via-slate-600/40 to-transparent"></div>
              
              {/* Hinge detail */}
              <div className="absolute bottom-0 left-4 right-4 h-0.5 bg-gradient-to-r from-slate-400 via-slate-350 to-slate-400 dark:from-slate-700 dark:via-slate-650 dark:to-slate-700"></div>
            </div>
          </div>

          {/* Environmental lighting and highlights */}
          <div className="absolute inset-0 bg-gradient-to-tr from-blue-200/4 via-transparent to-purple-200/4 rounded-2xl pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-bl from-transparent via-slate-200/8 to-transparent rounded-2xl pointer-events-none"></div>
          
          {/* Top edge highlight */}
          <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-full"></div>
        </div>

        {/* Hover glow effect */}
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/0 via-purple-400/0 to-blue-400/0 rounded-2xl transition-all duration-500 group-hover:from-blue-400/3 group-hover:via-purple-400/3 group-hover:to-blue-400/3 pointer-events-none opacity-0 group-hover:opacity-100"></div>
      </div>

      {/* Ambient environment lighting */}
      <div className="absolute -inset-8 bg-gradient-to-br from-blue-500/3 via-transparent to-purple-500/3 blur-2xl -z-10 opacity-70"></div>
    </div>
  );
};

export default RealisticLaptop; 