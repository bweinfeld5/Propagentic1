import React, { useState, useEffect } from 'react';

// AI workflow animation steps
const workflowSteps = [
  {
    title: "Report Issue",
    description: "Tenant reports maintenance issue through the app with photo and description",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
      </svg>
    ),
    role: "Tenant",
    time: "00:00"
  },
  {
    title: "AI Analysis",
    description: "AI analyzes the issue using NLP to categorize and determine priority level",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    role: "AI System",
    time: "00:03"
  },
  {
    title: "Contractor Matching",
    description: "AI finds and notifies the best available contractors based on expertise, proximity, and ratings",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    role: "AI System",
    time: "00:08"
  },
  {
    title: "Landlord Notification",
    description: "Landlord receives instant notification with issue details and proposed contractor",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
    ),
    role: "Landlord",
    time: "00:10"
  },
  {
    title: "Contractor Accepts",
    description: "Contractor accepts the job and provides estimated arrival time",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    role: "Contractor",
    time: "00:22"
  },
  {
    title: "Everyone Updated",
    description: "All parties receive real-time updates on job status, ETA, and completion",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    role: "All",
    time: "00:28"
  }
];

const AIExplainerSection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Auto-advance through steps when playing
  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setActiveStep((prev) => {
          const nextStep = (prev + 1) % workflowSteps.length;
          if (nextStep === 0) setIsPlaying(false); // Stop at the end
          return nextStep;
        });
      }, 2000); // Change step every 2 seconds
    }
    return () => clearInterval(timer);
  }, [isPlaying]);

  // Highlight effect when step changes
  useEffect(() => {
    setIsHighlighted(true);
    const timer = setTimeout(() => setIsHighlighted(false), 300);
    return () => clearTimeout(timer);
  }, [activeStep]);

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-propagentic-neutral-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-propagentic-neutral-dark dark:text-white mb-4">
            AI-Powered Workflow
          </h2>
          <p className="text-xl text-propagentic-neutral-dark dark:text-propagentic-neutral-light max-w-3xl mx-auto">
            See how our AI connects tenants, landlords, and contractors in real-time to solve maintenance issues faster.
          </p>
          <div className="mt-6 inline-flex items-center">
            <span className="text-propagentic-teal-light font-semibold">This entire process took only 28 seconds</span>
            <div className="ml-2 h-2 w-2 rounded-full bg-propagentic-teal-light animate-pulse"></div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Steps sidebar */}
          <div className="lg:col-span-2">
            <div className="bg-propagentic-neutral-light dark:bg-propagentic-neutral rounded-xl overflow-hidden shadow-md">
              <div className="p-6">
                <h3 className="text-2xl font-bold text-propagentic-neutral-dark dark:text-white mb-4">How It Works</h3>
                
                <div className="space-y-4">
                  {workflowSteps.map((step, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setActiveStep(index);
                        setIsPlaying(false);
                      }}
                      className={`w-full text-left p-4 rounded-lg transition-colors duration-200 flex items-start ${
                        activeStep === index
                          ? 'bg-propagentic-teal text-white'
                          : 'bg-white dark:bg-propagentic-neutral-dark text-propagentic-neutral-dark dark:text-propagentic-neutral-light hover:bg-propagentic-neutral'
                      }`}
                    >
                      <div className="mr-4 mt-1 flex-shrink-0">
                        <div className="h-6 w-6 rounded-full bg-propagentic-teal-light text-white flex items-center justify-center text-sm">
                          {index + 1}
                        </div>
                      </div>
                      <div>
                        <p className="font-semibold">{step.title}</p>
                        <p className="text-sm opacity-90 mt-1">{step.time}</p>
                      </div>
                    </button>
                  ))}
                </div>
                
                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                      setActiveStep(0);
                      setIsPlaying(true);
                    }}
                    className="flex items-center px-6 py-2 bg-propagentic-teal text-white rounded-lg hover:bg-propagentic-teal-dark transition-colors duration-200"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                    </svg>
                    Watch Demo
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Visualization area */}
          <div className="lg:col-span-3">
            <div className={`bg-white dark:bg-propagentic-neutral-dark border border-propagentic-neutral rounded-xl p-8 shadow-lg transition-all duration-300 ${isHighlighted ? 'transform scale-[1.02]' : ''}`}>
              <div className="flex items-center mb-8">
                <div className={`h-14 w-14 rounded-full flex items-center justify-center ${
                  workflowSteps[activeStep].role === 'AI System' 
                    ? 'bg-propagentic-teal-light'
                    : workflowSteps[activeStep].role === 'Tenant'
                    ? 'bg-blue-500'
                    : workflowSteps[activeStep].role === 'Landlord'
                    ? 'bg-purple-500'
                    : workflowSteps[activeStep].role === 'Contractor'
                    ? 'bg-orange-500'
                    : 'bg-gray-500'
                }`}>
                  <div className="text-white">
                    {workflowSteps[activeStep].icon}
                  </div>
                </div>
                <div className="ml-6">
                  <h3 className="text-2xl font-bold text-propagentic-neutral-dark dark:text-white">{workflowSteps[activeStep].title}</h3>
                  <p className="text-sm text-propagentic-neutral-dark dark:text-propagentic-neutral-light">
                    <span className="inline-block px-2 py-1 rounded-full bg-propagentic-neutral dark:bg-propagentic-neutral-dark text-xs font-medium mr-2">{workflowSteps[activeStep].role}</span>
                    <span>{workflowSteps[activeStep].time}</span>
                  </p>
                </div>
              </div>
              
              <div className="prose prose-lg max-w-none text-propagentic-neutral-dark dark:text-propagentic-neutral-light">
                <p>{workflowSteps[activeStep].description}</p>
              </div>
              
              {/* Visualization illustration */}
              <div className="mt-8 h-64 bg-propagentic-neutral-light dark:bg-propagentic-neutral rounded-lg flex items-center justify-center">
                <div className="text-center">
                  {/* This would ideally be replaced with custom illustrations for each step */}
                  <div className="text-6xl text-propagentic-teal mb-4">{workflowSteps[activeStep].icon}</div>
                  <p className="text-propagentic-neutral-dark dark:text-propagentic-neutral-light">Interactive visualization for {workflowSteps[activeStep].title}</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-8">
                <div className="h-2 w-full bg-propagentic-neutral dark:bg-propagentic-neutral-dark rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-propagentic-teal transition-all duration-500 ease-out"
                    style={{ width: `${((activeStep + 1) / workflowSteps.length) * 100}%` }}
                  ></div>
                </div>
                <div className="mt-2 flex justify-between text-xs text-propagentic-neutral-dark dark:text-propagentic-neutral-light">
                  <span>Start</span>
                  <span>Process Complete</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AIExplainerSection; 