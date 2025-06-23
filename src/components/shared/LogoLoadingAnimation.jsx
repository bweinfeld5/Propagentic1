import React, { useEffect, useRef } from "react";

const LogoLoadingAnimation = ({ finishLoading }) => {
  const lottieRef = useRef(null);

  useEffect(() => {
    // Add event listener to the dotlottie-wc element for completion
    const lottieElement = lottieRef.current;
    
    if (lottieElement) {
      lottieElement.addEventListener('complete', () => {
        finishLoading();
      });
    }
    
    // Fallback timer in case animation doesn't trigger complete
    const timer = setTimeout(() => {
      finishLoading();
    }, 3000);
    
    return () => {
      clearTimeout(timer);
      if (lottieElement) {
        lottieElement.removeEventListener('complete', finishLoading);
      }
    };
  }, [finishLoading]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-center items-center bg-gradient-to-br from-blue-600 via-indigo-500 to-purple-700">
      {/* Subtle background pattern for depth */}
      <div className="absolute inset-0 opacity-10">
        <div className="h-full w-full" style={{
          backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(255, 255, 255, .1) 25%, rgba(255, 255, 255, .1) 26%, transparent 27%, transparent 74%, rgba(255, 255, 255, .1) 75%, rgba(255, 255, 255, .1) 76%, transparent 77%, transparent)',
          backgroundSize: '50px 50px'
        }}></div>
      </div>
      
      {/* Larger animation container */}
      <div className="w-96 h-96 relative mb-6">
        <dotlottie-wc
          ref={lottieRef}
          src="https://lottie.host/0784755f-b0f4-42d0-aa41-a89036254edd/cgdG084kxl.lottie"
          autoplay
          loop={false}
          style={{ width: '100%', height: '100%' }}
        ></dotlottie-wc>
      </div>
      
      {/* Enhanced typography for the brand name - replace SafeMotion with regular div */}
      <div
        className="relative"
        style={{ 
          opacity: 1,
          transform: 'translateY(0)'
        }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-white font-display tracking-wide">
          Propagentic
        </h1>
        <div className="mt-2 text-lg text-white/80 text-center">
          Modern Property Management
        </div>
      </div>
    </div>
  );
};

export default LogoLoadingAnimation;
