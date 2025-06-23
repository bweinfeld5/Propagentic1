import React, { useState, useEffect } from 'react';
import { SafeMotion } from '../../shared/SafeMotion';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';

const steps = [
  {
    title: "Submit Maintenance Request",
    description: "Tenants submit maintenance requests with detailed descriptions, photos, and urgency level through the mobile app or web interface.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-propagentic-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    )
  },
  {
    title: "AI Analysis & Classification",
    description: "Our AI engine analyzes the request, classifies the issue type, determines priority, and recommends the best contractor type for the job.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-propagentic-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    )
  },
  {
    title: "Contractor Matching",
    description: "The system automatically matches the request with the best available contractor based on expertise, proximity, and past performance.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-propagentic-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    )
  },
  {
    title: "Work Execution & Tracking",
    description: "Contractors receive and accept jobs, communicate with tenants, document the work with photos, and mark jobs as complete when finished.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-propagentic-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    )
  },
  {
    title: "Review & Payment",
    description: "Landlords review the completed work, tenants provide feedback, and payments are automatically processed through the platform.",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-propagentic-teal" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    )
  }
];

const EnhancedAIExplainer = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = React.useRef(null);
  
  const handleStepClick = (index) => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    setActiveStep(index);
    setIsPlaying(false);
  };
  
  const handlePlayDemo = () => {
    if (isPlaying) return;
    setIsPlaying(true);
    setActiveStep(0);
    
    let currentStep = 0;
    playIntervalRef.current = setInterval(() => {
      currentStep++;
      if (currentStep >= steps.length) {
        clearInterval(playIntervalRef.current);
        playIntervalRef.current = null;
        setIsPlaying(false);
        return;
      }
      setActiveStep(currentStep);
    }, 3000);
  };
  
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, []);
  
  return (
    <UIComponentErrorBoundary componentName="AI Features Section">
      <section className="py-20 bg-gradient-to-br from-propagentic-teal/5 to-propagentic-blue/5">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-propagentic-slate-dark dark:text-white mb-4">
              How AI Powers Our Platform
            </h2>
            <p className="max-w-2xl mx-auto text-gray-600 dark:text-gray-300">
              PropAgentic leverages advanced artificial intelligence and machine learning
              to streamline property management workflows and deliver actionable insights.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 max-w-5xl mx-auto">
            {steps.map((step, index) => (
              <FeatureCard key={index} feature={step} />
            ))}
          </div>
        </div>
      </section>
    </UIComponentErrorBoundary>
  );
};

const FeatureCard = ({ feature }) => {
  return (
    <UIComponentErrorBoundary componentName={`AI Feature: ${feature.title}`}>
      <SafeMotion.div
        className="relative bg-white dark:bg-propagentic-slate-dark rounded-xl shadow-lg overflow-hidden group"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className="p-6">
          <div className="flex items-center mb-4">
            <div className="p-2 rounded-lg bg-propagentic-teal/10 text-propagentic-teal mr-4 group-hover:bg-propagentic-teal group-hover:text-white transition-colors duration-300 relative z-10">
              {feature.icon}
            </div>
            <h3 className="text-xl font-semibold text-propagentic-slate-dark dark:text-white group-hover:text-propagentic-teal transition-colors duration-300">
              {feature.title}
            </h3>
          </div>
          <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
        </div>

        <SafeMotion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-propagentic-teal origin-left"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewport={{ once: true }}
        />
      </SafeMotion.div>
    </UIComponentErrorBoundary>
  );
};

export default EnhancedAIExplainer; 