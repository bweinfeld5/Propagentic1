import React, { useState, useEffect } from 'react';
import { SafeMotion, AnimatePresence } from '../shared/SafeMotion';

const WorkflowDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [request, setRequest] = useState({
    issue: '',
    description: '',
    unit: '101',
    property: 'Maple Gardens',
    photo: null
  });
  const [aiAnalysis, setAiAnalysis] = useState({
    category: '',
    urgency: '',
    isAnalyzing: false,
    isComplete: false
  });
  const [contractor, setContractor] = useState({
    name: 'Michael Torres',
    rating: 4.9,
    reviews: 127,
    specialty: 'Plumbing',
    matchPercentage: 98,
    isApproved: false,
    hasAccepted: false,
    eta: ''
  });

  // Predefined options
  const issueTypes = ['Leaking faucet', 'Broken thermostat', 'Electrical issue', 'HVAC problem', 'Appliance malfunction'];
  
  // Handle form submission
  const handleSubmitRequest = (e) => {
    e?.preventDefault();
    
    // Update request with default values if empty
    if (!request.issue) setRequest(prev => ({ ...prev, issue: 'Leaking faucet' }));
    if (!request.description) setRequest(prev => ({ 
      ...prev, 
      description: 'The bathroom sink faucet is constantly dripping, wasting water and making noise at night.' 
    }));
    
    // Set photo if not selected
    if (!request.photo) {
      setRequest(prev => ({ 
        ...prev, 
        photo: 'https://www.thespruce.com/thmb/b7OzxmqPsZMmxvcCEpwL32H5cUY=/1500x0/filters:no_upscale():max_bytes(150000):strip_icc()/GettyImages-1205481506-fa5a420e6655457fb46410b7e95a0a84.jpg'
      }));
    }
    
    goToNextStep();
  };

  // AI classification logic
  const performAiAnalysis = () => {
    setAiAnalysis(prev => ({ ...prev, isAnalyzing: true }));
    
    // Simulate AI processing time
    setTimeout(() => {
      // Simple logic to determine category and urgency based on issue type
      let category, urgency;
      
      if (request.issue.toLowerCase().includes('leak') || request.issue.toLowerCase().includes('faucet')) {
        category = 'Plumbing';
        urgency = 'High Priority';
      } else if (request.issue.toLowerCase().includes('thermostat') || request.issue.toLowerCase().includes('heat')) {
        category = 'HVAC';
        urgency = 'Medium Priority';
      } else if (request.issue.toLowerCase().includes('electric')) {
        category = 'Electrical';
        urgency = 'High Priority';
      } else {
        category = 'General Maintenance';
        urgency = 'Medium Priority';
      }
      
      setAiAnalysis({
        category,
        urgency,
        isAnalyzing: false,
        isComplete: true
      });
      
      // Automatically advance after AI completes analysis
      setTimeout(() => {
        if (isAutoPlaying) goToNextStep();
      }, 2000);
    }, 3000);
  };

  // Handle landlord approving contractor
  const handleApproveContractor = () => {
    setContractor(prev => ({ ...prev, isApproved: true }));
    goToNextStep();
  };

  // Handle contractor accepting job
  const handleContractorAccept = () => {
    const currentDate = new Date();
    const tomorrowDate = new Date(currentDate);
    tomorrowDate.setDate(currentDate.getDate() + 1);
    
    const formattedDate = tomorrowDate.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
    
    setContractor(prev => ({ 
      ...prev, 
      hasAccepted: true,
      eta: `${formattedDate}, 9:00 AM - 11:00 AM`
    }));
  };

  // Navigation controls
  const goToNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      // Reset demo if at final step
      resetDemo();
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setRequest({
      issue: '',
      description: '',
      unit: '101',
      property: 'Maple Gardens',
      photo: null
    });
    setAiAnalysis({
      category: '',
      urgency: '',
      isAnalyzing: false,
      isComplete: false
    });
    setContractor({
      name: 'Michael Torres',
      rating: 4.9,
      reviews: 127,
      specialty: 'Plumbing',
      matchPercentage: 98,
      isApproved: false,
      hasAccepted: false,
      eta: ''
    });
    setIsAutoPlaying(false);
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => !prev);
  };

  // Auto-play effect
  useEffect(() => {
    let timer;
    
    if (isAutoPlaying) {
      if (currentStep === 0) {
        timer = setTimeout(() => handleSubmitRequest(), 3000);
      } else if (currentStep === 1) {
        performAiAnalysis();
      } else if (currentStep === 2) {
        timer = setTimeout(() => handleApproveContractor(), 3000);
      } else if (currentStep === 3) {
        timer = setTimeout(() => {
          handleContractorAccept();
          // Reset after showing the complete flow
          setTimeout(resetDemo, 5000);
        }, 3000);
      }
    }
    
    return () => clearTimeout(timer);
  }, [currentStep, isAutoPlaying]);

  // Effect to trigger AI analysis when reaching step 1
  useEffect(() => {
    if (currentStep === 1 && !aiAnalysis.isAnalyzing && !aiAnalysis.isComplete) {
      performAiAnalysis();
    }
  }, [currentStep, aiAnalysis]);

  // Get the appropriate step title
  const getStepTitle = () => {
    switch (currentStep) {
      case 0:
        return 'Tenant Submits Request';
      case 1:
        return 'AI Classifies Issue';
      case 2:
        return 'Landlord Reviews';
      case 3:
        return 'Contractor Responds';
      default:
        return '';
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-xl shadow-lg bg-white overflow-hidden">
      {/* Header with title and steps */}
      <div className="bg-neutral-900/90 backdrop-blur-sm text-white p-4 text-center shadow-md">
        <h2 className="text-xl md:text-2xl font-bold text-white">Propagentic Maintenance Workflow</h2>
      </div>
      
      {/* Progress bar */}
      <div className="relative h-2 bg-gray-200">
        <SafeMotion.div 
          className="absolute h-full bg-teal-600"
          initial={{ width: '0%' }}
          animate={{ width: `${(currentStep / 3) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between px-4 sm:px-8 md:px-16 py-3 border-b">
        {[0, 1, 2, 3].map((step) => (
          <div 
            key={step} 
            className="flex flex-col items-center"
            onClick={() => setCurrentStep(step)}
          >
            <div 
              className={`rounded-full w-8 h-8 flex items-center justify-center mb-1 cursor-pointer font-bold border-2 transition-all duration-200
                ${step === currentStep 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : step < currentStep 
                    ? 'bg-green-100 text-green-800 border-green-500 shadow-sm' 
                    : 'bg-white text-gray-700 border-gray-400 hover:border-gray-500'}`}
            >
              {step < currentStep ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                step + 1
              )}
            </div>
            <span className="text-xs hidden sm:inline text-center text-gray-800 dark:text-gray-200 font-semibold">
              {step === 0 && "Tenant"}
              {step === 1 && "AI"}
              {step === 2 && "Landlord"}
              {step === 3 && "Contractor"}
            </span>
          </div>
        ))}
      </div>
      
      {/* Main content area with step title */}
      <div className="px-4 sm:px-8 md:px-12 py-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
            </div>
            <h3 className="ml-3 text-lg font-bold text-gray-900 dark:text-gray-100">Landlord Dashboard</h3>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={toggleAutoPlay}
              className={`text-sm px-4 py-2 rounded-lg flex items-center font-medium transition-all duration-200 shadow-sm border
                ${isAutoPlaying 
                  ? 'bg-red-500 text-white hover:bg-red-600 border-red-500' 
                  : 'bg-green-500 text-white hover:bg-green-600 border-green-500'}`}
            >
              {isAutoPlaying ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Pause Demo
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  Auto Play
                </>
              )}
            </button>
          </div>
        </div>
      
        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm mb-4">
          <h2 className="text-xl font-bold mb-2 text-neutral-900 dark:text-white">Maintenance Request Details</h2>
          <p className="text-neutral-800 dark:text-neutral-200 mb-2">{request.property} - Unit {request.unit}</p>
          
          <div className="flex flex-wrap gap-2 mb-4">
            {aiAnalysis.urgency && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300">
                {aiAnalysis.urgency}
              </span>
            )}
            {aiAnalysis.category && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                {aiAnalysis.category}
              </span>
            )}
          </div>
          
          {/* Step content */}
          <AnimatePresence mode="wait">
            <SafeMotion.div
              key={currentStep}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="min-h-[400px] sm:min-h-[350px]"
            >
              {/* Step 1: Tenant submits request */}
              {currentStep === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <form onSubmit={handleSubmitRequest}>
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Issue Type</label>
                        <select 
                          className="w-full rounded-md border border-gray-300 p-2 focus:ring-propagentic-teal focus:border-propagentic-teal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                          value={request.issue}
                          onChange={(e) => setRequest({...request, issue: e.target.value})}
                        >
                          <option value="">Select an issue</option>
                          {issueTypes.map((type) => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Description</label>
                        <textarea
                          className="w-full rounded-md border border-gray-300 p-2 focus:ring-propagentic-teal focus:border-propagentic-teal text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800"
                          rows="3"
                          value={request.description}
                          onChange={(e) => setRequest({...request, description: e.target.value})}
                          placeholder="Describe the issue in detail..."
                        ></textarea>
                      </div>
                      
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Photo</label>
                        <div className="border border-dashed border-gray-300 rounded-md p-4 text-center">
                          <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-10 w-10 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">Click to upload or drag and drop</p>
                          <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">PNG, JPG up to 5MB</p>
                        </div>
                      </div>
                      
                      <button
                        type="submit"
                        className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold shadow-md border border-blue-600"
                      >
                        Submit Request
                      </button>
                    </form>
                  </div>
                  
                  <div className="flex items-center justify-center">
                    <div className="text-center p-4 w-full max-w-xs">
                      <div className="rounded-full mx-auto w-16 h-16 bg-gray-200 text-gray-700 flex items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                      <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Report an Issue</h3>
                      <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                        Submit your maintenance request and we'll categorize it automatically using AI.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 2: AI classification */}
              {currentStep === 1 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-lg font-medium mb-2 text-neutral-900 dark:text-white">Issue Description</h4>
                    <div className="bg-neutral-50 dark:bg-neutral-800 p-4 rounded-md mb-4">
                      <p className="text-neutral-800 dark:text-neutral-200">{request.description}</p>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-lg font-medium mb-2 text-neutral-900 dark:text-white">AI Analysis</h4>
                      {aiAnalysis.isAnalyzing ? (
                        <div className="flex flex-col items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-2"></div>
                          <p className="text-sm text-neutral-700 dark:text-neutral-300">Analyzing request...</p>
                        </div>
                      ) : aiAnalysis.isComplete ? (
                        <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 p-4 rounded-md">
                          <div className="flex items-start mb-2">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600 dark:text-green-400 mr-2 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                            <div>
                              <p className="font-medium text-neutral-900 dark:text-white">Analysis Complete</p>
                              <p className="text-sm text-neutral-700 dark:text-neutral-300">Our AI has analyzed your maintenance request.</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-4">
                            <div>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">Category</p>
                              <p className="font-medium text-neutral-800 dark:text-neutral-200">{aiAnalysis.category}</p>
                            </div>
                            <div>
                              <p className="text-sm text-neutral-600 dark:text-neutral-400">Urgency</p>
                              <p className="font-medium text-neutral-800 dark:text-neutral-200">{aiAnalysis.urgency}</p>
                            </div>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium mb-2">Issue Photo</h3>
                    {request.photo && (
                      <img 
                        src={request.photo} 
                        alt="Maintenance issue" 
                        className="w-full h-60 object-cover rounded-md"
                      />
                    )}
                  </div>
                </div>
              )}
              
              {/* Step 3: Landlord notified */}
              {currentStep === 2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="mb-6">
                      <h3 className="text-lg font-medium mb-2">Tenant Information</h3>
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-700">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">Alex Johnson</p>
                          <p className="text-sm text-gray-600">Tenant since June 2023</p>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Issue Details</h3>
                      <p className="text-gray-600 mb-2">{request.issue}</p>
                      <p className="text-gray-700">{request.description}</p>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium">AI-Suggested Contractor</h3>
                        <span className="bg-green-100 text-green-800 text-xs font-medium py-1 px-2 rounded-full">
                          {contractor.matchPercentage}% match
                        </span>
                      </div>
                      
                      <div className="flex items-center mt-3 p-3 border rounded-md">
                        <div className="h-12 w-12 rounded-full bg-gray-300 overflow-hidden">
                          <img 
                            src="https://randomuser.me/api/portraits/men/32.jpg" 
                            alt="Contractor" 
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium">{contractor.name}</p>
                          <p className="text-sm text-gray-600">
                            {contractor.specialty} specialist, {contractor.rating} ★ ({contractor.reviews} reviews)
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-8">
                      <button
                        onClick={handleApproveContractor}
                        className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:bg-green-700 focus:ring-4 focus:ring-green-200 transition-all duration-200 font-semibold shadow-md border border-green-600 mb-3"
                      >
                        Approve Contractor
                      </button>
                      <button
                        className="w-full bg-gray-100 text-gray-800 py-3 px-4 rounded-lg border border-gray-300 hover:bg-gray-200 focus:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-all duration-200 font-medium"
                      >
                        Assign Different Contractor
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Step 4: Contractor accepts */}
              {currentStep === 3 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-2">Request Status</h3>
                      <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                        <div className="flex items-center mb-4">
                          <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <div className="ml-3">
                            <p className="font-semibold text-blue-800">Contractor Assigned</p>
                            <p className="text-sm text-blue-700">{contractor.name} has been approved for this job</p>
                          </div>
                        </div>
                        
                        {contractor.hasAccepted && (
                          <div className="flex items-center">
                            <div className="w-10 h-10 rounded-full bg-green-500 text-white flex items-center justify-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-green-600">Job Accepted</p>
                              <p className="text-sm">Contractor has confirmed and scheduled the visit</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-medium mb-2">Job Details</h3>
                      <div className="bg-white border border-gray-200 rounded-md p-4">
                        <p className="text-sm text-gray-600 mb-1">Issue</p>
                        <p className="font-medium mb-3">{request.issue}</p>
                        <p className="text-sm text-gray-600 mb-1">Category</p>
                        <p className="font-medium mb-3">{aiAnalysis.category}</p>
                        <p className="text-sm text-gray-600 mb-1">Location</p>
                        <p className="font-medium">{request.property}, Unit {request.unit}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="bg-gray-50 border border-gray-200 rounded-md p-4 mb-6">
                      <div className="flex justify-between items-start">
                        <h3 className="text-lg font-medium">Contractor Response</h3>
                        <span className={`${contractor.hasAccepted ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'} text-xs font-medium py-1 px-2 rounded-full`}>
                          {contractor.hasAccepted ? 'Accepted' : 'Pending'}
                        </span>
                      </div>
                      
                      {!contractor.hasAccepted ? (
                        <div className="mt-4">
                          <p className="text-sm text-gray-600 mb-4">The contractor has been notified and will respond shortly.</p>
                          <button
                            onClick={handleContractorAccept}
                            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold shadow-md border border-blue-600"
                          >
                            Simulate Contractor Acceptance
                          </button>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-1">Scheduled Visit</p>
                            <p className="font-medium">{contractor.eta}</p>
                          </div>
                          <div className="mb-4">
                            <p className="text-sm text-gray-600 mb-1">Message from Contractor</p>
                            <p className="italic text-gray-700">
                              "I'll bring the necessary tools and parts to fix the leaking faucet. Please ensure access to the unit is available during the scheduled time."
                            </p>
                          </div>
                          <div className="mt-4 p-3 bg-blue-50 rounded-md">
                            <p className="text-sm text-blue-800 flex items-center">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                              </svg>
                              The tenant has been notified of this appointment
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="mt-auto">
                      <button
                        onClick={resetDemo}
                        className="w-full bg-teal-600 text-white py-3 px-4 rounded-lg hover:bg-teal-700 focus:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all duration-200 font-semibold shadow-md border border-teal-600"
                      >
                        Reset Demo
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </SafeMotion.div>
          </AnimatePresence>
        </div>
      </div>
      
      {/* Navigation controls */}
      <div className="px-4 sm:px-8 md:px-12 py-4 border-t bg-gray-50 flex justify-between">
        <button
          onClick={goToPrevStep}
          className={`px-6 py-3 flex items-center rounded-lg font-semibold transition-all duration-200 border-2 ${
            currentStep > 0 
              ? 'text-gray-700 bg-white border-gray-300 hover:bg-gray-50 hover:border-gray-400 focus:bg-gray-50 focus:ring-4 focus:ring-gray-200 shadow-sm' 
              : 'text-gray-400 bg-gray-100 border-gray-200 cursor-not-allowed'
          }`}
          disabled={currentStep === 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Previous
        </button>
        
        {currentStep < 3 ? (
          <button
            onClick={goToNextStep}
            className="px-6 py-3 flex items-center text-white bg-blue-600 border-2 border-blue-600 rounded-lg hover:bg-blue-700 hover:border-blue-700 focus:bg-blue-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 font-semibold shadow-md"
          >
            Next
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        ) : (
          <button
            onClick={resetDemo}
            className="px-6 py-3 flex items-center text-white bg-teal-600 border-2 border-teal-600 rounded-lg hover:bg-teal-700 hover:border-teal-700 focus:bg-teal-700 focus:ring-4 focus:ring-teal-200 transition-all duration-200 font-semibold shadow-md"
          >
            Start Over
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default WorkflowDemo; 