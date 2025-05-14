import React, { useState, useEffect, useRef } from 'react';
import { SafeMotion, AnimatePresence } from '../../shared/SafeMotion';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import Button from '../../ui/Button';
import { 
  CheckIcon, 
  PlayIcon, 
  PauseIcon,
  PhotoIcon,
  PencilSquareIcon,
  UsersIcon,
  CurrencyDollarIcon,
  CogIcon,
  ArrowRightOnRectangleIcon as LogoutIcon,
  UserCircleIcon,
  QuestionMarkCircleIcon,
  InformationCircleIcon,
  BriefcaseIcon,
  ClockIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const EnhancedInteractiveDemo = () => {
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
  const autoPlayIntervalRef = useRef(null);

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
    setIsAutoPlaying(false); // Pause on manual interaction
    if (currentStep < 3) {
      setCurrentStep(prevStep => prevStep + 1);
    } else {
      resetDemo();
    }
  };

  const goToPrevStep = () => {
    setIsAutoPlaying(false); // Pause on manual interaction
    if (currentStep > 0) {
      setCurrentStep(prevStep => prevStep - 1);
    }
  };

  const handleStepIndicatorClick = (step) => {
    setIsAutoPlaying(false); // Pause on manual interaction
    setCurrentStep(step);
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
    if (autoPlayIntervalRef.current) { // Clear interval on reset
      clearTimeout(autoPlayIntervalRef.current);
    }
  };

  const toggleAutoPlay = () => {
    setIsAutoPlaying(prev => !prev);
  };

  // Auto-play effect
  useEffect(() => {
    if (isAutoPlaying) {
       if (autoPlayIntervalRef.current) clearTimeout(autoPlayIntervalRef.current);
      
      if (currentStep === 0) {
        autoPlayIntervalRef.current = setTimeout(() => handleSubmitRequest(), 3000);
      } else if (currentStep === 1) {
        performAiAnalysis(); // This handles its own timeout for next step
      } else if (currentStep === 2) {
        autoPlayIntervalRef.current = setTimeout(() => handleApproveContractor(), 3000);
      } else if (currentStep === 3) {
        autoPlayIntervalRef.current = setTimeout(() => {
          handleContractorAccept();
          // Reset after showing the complete flow
          setTimeout(resetDemo, 5000);
        }, 3000);
      }
    } else {
       if (autoPlayIntervalRef.current) {
         clearTimeout(autoPlayIntervalRef.current);
       }
    }
    
    // Cleanup function
    return () => {
      if (autoPlayIntervalRef.current) {
        clearTimeout(autoPlayIntervalRef.current);
      }
    };
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
    <UIComponentErrorBoundary componentName="Interactive Demo">
      <div className="w-full max-w-5xl mx-auto rounded-xl shadow-lg bg-background dark:bg-background-dark overflow-hidden border border-border dark:border-border-dark">
        {/* Header */} 
        <div className="bg-gradient-to-r from-primary to-primary-light text-white p-5 text-center rounded-t-xl dark:from-primary-dark dark:to-primary">
          <h2 className="text-xl md:text-2xl font-semibold">Propagentic Maintenance Workflow</h2>
        </div>
        
        {/* Step Indicators */} 
        <div className="flex items-center justify-between px-4 sm:px-8 md:px-16 py-4 border-b border-border dark:border-border-dark bg-background-subtle dark:bg-background-darkSubtle relative">
          {/* Connecting Line - Background */} 
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-border dark:bg-border-dark transform -translate-y-1/2 z-0 mx-4 sm:mx-8 md:mx-16"></div>
          
          {/* Progress Line - Foreground */}
          <SafeMotion.div 
            className="absolute top-1/2 left-0 h-0.5 bg-primary transform -translate-y-1/2 z-10 mx-4 sm:mx-8 md:mx-16"
            initial={{ width: '0%' }}
            animate={{ width: `${(currentStep / 3) * 100}%` }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
          
          {[0, 1, 2, 3].map((step) => {
            // Define labels for aria-label
            const stepLabels = ["Step 1: Submit Request", "Step 2: AI Classify", "Step 3: Landlord Review", "Step 4: Contractor Respond"];
            return (
              <UIComponentErrorBoundary key={step} componentName={`Step ${step + 1} Indicator`}>
                {/* Added z-index, role, and aria-label */}
                <div 
                  className="flex flex-col items-center cursor-pointer group relative z-20"
                  onClick={() => handleStepIndicatorClick(step)}
                  role="button" // Added role
                  aria-label={`Go to ${stepLabels[step]}`} // Added aria-label
                  tabIndex={0} // Make focusable for keyboard users
                  onKeyPress={(e) => { if (e.key === 'Enter' || e.key === ' ') handleStepIndicatorClick(step); }} // Keyboard activation
                >
                  <SafeMotion.div
                    // Animate scale for active step
                    initial={false}
                    animate={{ scale: step === currentStep ? 1.1 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className={`rounded-full w-9 h-9 flex items-center justify-center mb-1.5 transition-all duration-200 border-2 font-medium text-sm shadow-sm relative ${
                      step === currentStep
                        // Active Step Style
                        ? 'bg-primary border-primary text-white'
                        : step < currentStep
                        // Completed Step Style
                        ? 'bg-success border-success text-success-content'
                        // Future Step Style
                        : 'bg-background dark:bg-background-darkSubtle border-border dark:border-border-dark text-content-subtle dark:text-content-darkSubtle group-hover:border-primary/70 group-hover:text-primary/70'
                    }`}
                  >
                    {step < currentStep ? (
                      <CheckIcon className="h-5 w-5" />
                    ) : ( step + 1 )}
                  </SafeMotion.div>
                  {/* Adjusted text style for clarity */}
                  <span className={`text-xs font-semibold hidden sm:inline text-center transition-colors duration-200 ${
                      step === currentStep ? 'text-primary dark:text-primary-light' : 'text-content-subtle dark:text-content-darkSubtle group-hover:text-primary/80 dark:group-hover:text-primary-light/80'
                    }`}>
                    {step === 0 && "Submit"}
                    {step === 1 && "Classify"} 
                    {step === 2 && "Review"} 
                    {step === 3 && "Respond"} 
                  </span>
                </div>
              </UIComponentErrorBoundary>
            )
          })}
        </div>
        
        {/* Auto-Play Progress Bar */} 
        {isAutoPlaying && (
          <div className="relative h-1 bg-border dark:bg-border-dark mx-4 sm:mx-8 md:mx-16 -mt-px"> {/* Position below indicators */} 
            <SafeMotion.div
              className="absolute top-0 left-0 bottom-0 bg-success"
              key={currentStep} // Re-trigger animation on step change
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3, ease: 'linear' }} // Duration matches typical step delay
            />
          </div>
        )}

        {/* Main Content Area */} 
        <div className="px-4 sm:px-8 md:px-12 py-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-content dark:text-content-dark">{getStepTitle()}</h3>
            <Button
                onClick={toggleAutoPlay}
                variant={isAutoPlaying ? "danger" : "success"}
                size="sm"
                icon={isAutoPlaying ? <PauseIcon className="h-4 w-4" /> : <PlayIcon className="h-4 w-4" />}
              >
              {isAutoPlaying ? "Pause" : "Auto Play"}
            </Button>
          </div>

          {/* Step Content Container */} 
          <div className="bg-background-subtle dark:bg-background-darkSubtle rounded-xl p-6 border border-border dark:border-border-dark shadow-inner min-h-[450px]">
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
                <UIComponentErrorBoundary componentName="Tenant Submit Step">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Form */} 
                    <div className="space-y-4">
                      <form onSubmit={handleSubmitRequest} className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-content dark:text-content-dark mb-1">Issue Type</label>
                          <select
                            className="w-full rounded-lg border border-border dark:border-border-dark p-2.5 focus:ring-primary focus:border-primary bg-background dark:bg-background-dark text-content dark:text-content-dark"
                            value={request.issue}
                            onChange={(e) => setRequest({...request, issue: e.target.value})}
                          >
                            <option value="">Select an issue</option>
                            {issueTypes.map((type) => (<option key={type} value={type}>{type}</option>))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-content dark:text-content-dark mb-1">Description</label>
                          <textarea
                            className="w-full rounded-lg border border-border dark:border-border-dark p-2.5 focus:ring-primary focus:border-primary bg-background dark:bg-background-dark text-content dark:text-content-dark"
                            rows="4"
                            value={request.description}
                            onChange={(e) => setRequest({...request, description: e.target.value})}
                            placeholder="Describe the issue in detail..."
                          ></textarea>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-content dark:text-content-dark mb-1">Photo (Optional)</label>
                          {/* Enhanced Dropzone */}
                          <div 
                            className="border-2 border-dashed border-border dark:border-border-dark rounded-lg p-6 text-center bg-background dark:bg-background-dark hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 cursor-pointer transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary" 
                            tabIndex={0} // Make focusable
                            role="button" // Indicate interactivity
                            aria-label="Upload or drag and drop photo"
                            onKeyPress={(e) => { /* Add simulated file picker on Enter/Space if desired */ }}
                          >
                            <PhotoIcon className="mx-auto h-10 w-10 text-neutral-400 dark:text-neutral-500 group-hover:text-primary transition-colors duration-200" />
                            <p className="mt-1 text-sm text-content-secondary dark:text-content-darkSecondary">Click to upload or drag and drop</p>
                            <p className="mt-1 text-xs text-content-subtle dark:text-content-darkSubtle">PNG, JPG up to 5MB</p>
                          </div>
                        </div>
                        <Button type="submit" variant="primary" fullWidth>Submit Request</Button>
                      </form>
                    </div>
                    {/* Info Panel */} 
                    <div className="flex items-center justify-center bg-background-subtle dark:bg-background-dark rounded-xl p-6 border border-border dark:border-border-dark">
                      <div className="text-center">
                        <div className="rounded-full mx-auto w-16 h-16 bg-primary/10 text-primary flex items-center justify-center mb-4">
                          <PencilSquareIcon className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-medium text-content dark:text-content-dark">Report an Issue Easily</h3>
                        <p className="mt-2 text-sm text-content-secondary dark:text-content-darkSecondary">Quickly submit your maintenance request with details and photos. Our AI takes care of the rest.</p>
                      </div>
                    </div>
                  </div>
                </UIComponentErrorBoundary>
              )}
              {/* Step 2: AI Classification */} 
              {currentStep === 1 && (
                <UIComponentErrorBoundary componentName="AI Classification Step">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                    {/* Left Column: Details */} 
                    <div className="space-y-4">
                      {/* Issue Description */} 
                      <div>
                        <h3 className="text-lg font-medium text-content dark:text-content-dark mb-2">Issue Description</h3>
                        <div className="bg-background dark:bg-background-dark p-4 rounded-lg border border-border dark:border-border-dark min-h-[100px]">
                          <p className="text-content-secondary dark:text-content-darkSecondary">{request.description || "No description provided."}</p>
                        </div>
                      </div>
                      {/* AI Analysis */} 
                      <div>
                        <h3 className="text-lg font-medium text-content dark:text-content-dark mb-2">AI Analysis</h3>
                        {aiAnalysis.isAnalyzing ? (
                          <div className="flex flex-col items-center justify-center py-8 bg-background dark:bg-background-dark rounded-lg border border-border dark:border-border-dark">
                            {/* Custom AI Brain/Network Animation */}
                            <SafeMotion.div
                              animate={{ scale: [1, 1.1, 1], opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              className="mb-3"
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 21v-1.5M15.75 3v1.5m3.75 3.75H21m-18 0h1.5m15 3.75H21m-18 0h1.5m15 3.75H21m-3.75 3.75v-1.5m-8.25 1.5v-1.5m4.5-10.5a3 3 0 11-6 0 3 3 0 016 0zM12 6.75a3 3 0 110 6 3 3 0 010-6zM12 17.25a3 3 0 110-6 3 3 0 010 6z" />
                              </svg>
                            </SafeMotion.div>
                            {/* <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-propagentic-teal mb-3"></div> */}
                            <p className="text-sm text-content-secondary dark:text-content-darkSecondary font-medium">AI Analyzing Request...</p>
                          </div>
                          ) : aiAnalysis.isComplete ? (
                          <div className="bg-success-subtle dark:bg-success-darkSubtle border border-success/20 p-4 rounded-lg">
                            <div className="flex items-start mb-3">
                              <div className="w-8 h-8 rounded-full bg-success text-success-content flex items-center justify-center flex-shrink-0 mr-3">
                                <CheckIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-success dark:text-emerald-300">Analysis Complete</p>
                                <p className="text-sm text-content-secondary dark:text-content-darkSecondary">Request classified and prioritized.</p>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                              <div>
                                <p className="text-content-secondary dark:text-content-darkSecondary">Category:</p>
                                <p className="font-medium text-content dark:text-content-dark">{aiAnalysis.category}</p>
                              </div>
                              <div>
                                <p className="text-content-secondary dark:text-content-darkSecondary">Urgency:</p>
                                <p className="font-medium text-content dark:text-content-dark">{aiAnalysis.urgency}</p>
                              </div>
                            </div>
                          </div>
                          ) : <div className="py-8 text-center text-content-subtle dark:text-content-darkSubtle">Analysis Pending...</div>}
                      </div>
                    </div>
                    {/* Right Column: Photo */} 
                    <div>
                      <h3 className="text-lg font-medium text-content dark:text-content-dark mb-2">Issue Photo</h3>
                      {request.photo ? (
                      <img src={request.photo} alt="Maintenance issue" className="w-full h-auto max-h-[300px] object-contain rounded-lg border border-border dark:border-border-dark bg-background dark:bg-background-dark p-1"/>
                      ) : (
                      <div className="w-full h-[300px] bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-400 dark:text-neutral-600 border border-border dark:border-border-dark">
                        <PhotoIcon className="h-12 w-12" />
                        <span className="ml-2">No Photo Provided</span>
                      </div>
                      )}
                    </div>
                  </div>
                </UIComponentErrorBoundary>
              )}
              {/* Step 3: Landlord notified */} 
              {currentStep === 2 && (
                <UIComponentErrorBoundary componentName="Landlord Notification Step">
                  {/* Use flex layout for better spacing control */}
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                    {/* Left column: Tenant Info, Issue Details */}
                    <div className="w-full lg:w-1/2 space-y-5">
                      {/* Tenant Info Card */}
                      <div>
                        <h3 className="text-lg font-medium text-content dark:text-content-dark mb-2">Tenant Information</h3>
                        {/* Added subtle background tint */}
                        <div className="flex items-center bg-background dark:bg-background-dark p-4 rounded-xl border border-border dark:border-border-dark shadow-sm">
                          <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                            <UserGroupIcon className="h-6 w-6" />
                          </div>
                          <div className="ml-4">
                            <p className="font-semibold text-content dark:text-content-dark">Alex Johnson</p>
                            <p className="text-sm text-content-secondary dark:text-content-darkSecondary">Tenant since June 2023</p>
                          </div>
                        </div>
                      </div>
                      {/* Issue Details Card */} 
                      <div>
                        <h3 className="text-lg font-medium text-content dark:text-content-dark mb-2">Issue Details</h3>
                        {/* Added subtle background tint */}
                        <div className="bg-background dark:bg-background-dark p-4 rounded-xl border border-border dark:border-border-dark shadow-sm space-y-2 text-sm">
                          <p><span className="font-medium text-content-secondary dark:text-content-darkSecondary">Issue:</span> <span className="text-content dark:text-content-dark">{request.issue}</span></p>
                          <p><span className="font-medium text-content-secondary dark:text-content-darkSecondary">Description:</span> <span className="text-content dark:text-content-dark">{request.description}</span></p>
                          <p><span className="font-medium text-content-secondary dark:text-content-darkSecondary">AI Category:</span> <span className="text-content dark:text-content-dark">{aiAnalysis.category}</span></p>
                          <p><span className="font-medium text-content-secondary dark:text-content-darkSecondary">AI Urgency:</span> <span className="text-content dark:text-content-dark">{aiAnalysis.urgency}</span></p>
                        </div>
                      </div>
                    </div>
                    {/* Right column: Suggested Contractor, Actions */} 
                    {/* Added subtle background tint to the whole column container */}
                    <div className="w-full lg:w-1/2 space-y-5 bg-background-subtle dark:bg-background-dark p-5 rounded-xl border border-border dark:border-border-dark shadow-sm">
                      {/* Contractor Card */} 
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-medium text-content dark:text-content-dark">AI-Suggested Contractor</h3>
                          <span className="bg-success-subtle text-success dark:bg-success-darkSubtle dark:text-emerald-300 text-xs font-semibold py-1 px-2.5 rounded-full border border-success/20">
                          {contractor.matchPercentage}% Match
                          </span>
                        </div>
                        {/* Removed redundant inner card background */}
                        <div className="flex items-center p-4 rounded-xl border border-border dark:border-border-dark bg-background dark:bg-background-darkSubtle">
                          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white dark:border-background-dark ring-1 ring-border dark:ring-border-dark">
                            <img src="https://randomuser.me/api/portraits/men/32.jpg" alt="Contractor" className="h-full w-full object-cover"/>
                          </div>
                          <div className="ml-4">
                            <p className="font-semibold text-content dark:text-content-dark">{contractor.name}</p>
                            <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                               {contractor.specialty} • {contractor.rating} ★ ({contractor.reviews} reviews)
                            </p>
                          </div>
                        </div>
                      </div>
                      {/* Action Buttons */} 
                      <div className="space-y-3 pt-3 border-t border-border dark:border-border-dark"> {/* Added top border */} 
                        <Button variant="success" onClick={handleApproveContractor} fullWidth>
                           Approve Suggested Contractor
                        </Button>
                        <Button variant="secondary" onClick={() => alert('Assign Different Contractor clicked!')} fullWidth>
                           Assign Different Contractor
                        </Button>
                      </div>
                    </div>
                  </div>
                </UIComponentErrorBoundary>
              )}
              {/* Step 4: Contractor accepts */} 
              {currentStep === 3 && (
                <UIComponentErrorBoundary componentName="Contractor Acceptance Step">
                  {/* Use flex layout for better spacing control */}
                  <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                    {/* Left column: Status, Job Details */} 
                    {/* Added subtle background tint to the whole column container */}
                    <div className="w-full lg:w-1/2 space-y-5 bg-background-subtle dark:bg-background-dark p-5 rounded-xl border border-border dark:border-border-dark shadow-sm">
                      {/* Status Card */} 
                      <div>
                        <h3 className="text-lg font-medium text-content dark:text-content-dark mb-2">Request Status</h3>
                        {/* Removed redundant inner card background */}
                        <div className="bg-background dark:bg-background-darkSubtle p-4 rounded-xl border border-border dark:border-border-dark space-y-4">
                          {/* Assigned Status */}
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0 mr-3">
                              <BriefcaseIcon className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="font-semibold text-primary dark:text-primary-light">Contractor Assigned</p>
                              <p className="text-sm text-content-secondary dark:text-content-darkSecondary">{contractor.name} approved</p>
                            </div>
                          </div>
                          {/* Accepted Status (Conditional) */}
                          {contractor.hasAccepted && (
                            <div className="flex items-center border-t border-border dark:border-border-dark pt-4">
                              <div className="w-8 h-8 rounded-full bg-success text-success-content flex items-center justify-center flex-shrink-0 mr-3">
                                <CheckIcon className="h-5 w-5" />
                              </div>
                              <div>
                                <p className="font-semibold text-success dark:text-emerald-300">Job Accepted & Scheduled</p>
                                <p className="text-sm text-content-secondary dark:text-content-darkSecondary">Visit scheduled for: {contractor.eta}</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Job Details Card */} 
                      <div>
                        <h3 className="text-lg font-medium text-content dark:text-content-dark mb-2">Job Details Recap</h3>
                        {/* Removed redundant inner card background */}
                        <div className="bg-background dark:bg-background-darkSubtle p-4 rounded-xl border border-border dark:border-border-dark shadow-sm space-y-2 text-sm">
                          <p><span className="font-medium text-content-secondary dark:text-content-darkSecondary">Issue:</span> <span className="text-content dark:text-content-dark">{request.issue}</span></p>
                          <p><span className="font-medium text-content-secondary dark:text-content-darkSecondary">Location:</span> <span className="text-content dark:text-content-dark">{request.property}, Unit {request.unit}</span></p>
                          <p><span className="font-medium text-content-secondary dark:text-content-darkSecondary">Assigned:</span> <span className="text-content dark:text-content-dark">{contractor.name}</span></p>
                        </div>
                      </div>
                    </div>
                    {/* Right column: Contractor Response / Actions */} 
                    <div className="w-full lg:w-1/2 space-y-6 flex flex-col">
                      {/* Contractor Response Card */}
                      <div className="bg-background dark:bg-background-darkSubtle p-4 rounded-xl border border-border dark:border-border-dark shadow-sm flex-grow flex flex-col"> {/* Added flex flex-col */} 
                        <div className="flex justify-between items-start mb-3">
                          <h3 className="text-lg font-medium text-content dark:text-content-dark">Contractor Response</h3>
                          <span className={`${contractor.hasAccepted ? 'bg-success-subtle text-success dark:bg-success-darkSubtle dark:text-emerald-300 border-success/20' : 'bg-warning-subtle text-amber-700 dark:bg-warning-darkSubtle dark:text-amber-300 border-warning/20'} text-xs font-semibold py-1 px-2.5 rounded-full border`}>
                          {contractor.hasAccepted ? 'Accepted' : 'Pending Acceptance'}
                          </span>
                        </div>
                        {!contractor.hasAccepted ? (
                          <div className="text-center py-10 flex flex-col items-center justify-center h-full flex-grow"> {/* Added flex-grow */} 
                            <div className="animate-pulse text-neutral-400 dark:text-neutral-500 mb-4">
                              <ClockIcon className="h-12 w-12" />
                            </div>
                            <p className="text-sm text-content-secondary dark:text-content-darkSecondary mb-6">Waiting for {contractor.name} to accept the job...</p>
                            <Button variant="secondary" onClick={handleContractorAccept}>
                               Simulate Contractor Acceptance
                            </Button>
                          </div>
                          ) : (
                          <div className="space-y-4 flex-grow"> {/* Added flex-grow */} 
                            <div>
                              <p className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary mb-1">Scheduled Visit:</p>
                              <p className="font-semibold text-content dark:text-content-dark">{contractor.eta}</p>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary mb-1">Message from Contractor:</p>
                              <p className="italic text-content-secondary dark:text-content-darkSecondary text-sm bg-background-subtle dark:bg-background-dark p-3 rounded-md border border-border dark:border-border-dark">
                                 "Confirmed. I'll bring the necessary tools and parts to fix the leaking faucet. Please ensure access to the unit is available during the scheduled time. Thanks!"
                              </p>
                            </div>
                            <div className="mt-4 p-3 bg-info-subtle dark:bg-info-darkSubtle rounded-lg border border-info/20">
                              <p className="text-sm text-info dark:text-blue-300 flex items-center">
                                <InformationCircleIcon className="h-4 w-4 mr-2 flex-shrink-0" />
                                Tenant Alex Johnson has been notified of this appointment.
                              </p>
                            </div>
                          </div>
                          )}
                      </div>
                      {/* Reset Button */} 
                      <div className="mt-auto pt-4">
                        <Button onClick={resetDemo} fullWidth variant="outline">Reset Demo</Button>
                      </div>
                    </div>
                  </div>
                </UIComponentErrorBoundary>
              )}
            </SafeMotion.div>
          </div>
        </div>

        {/* Navigation Controls */} 
        <div className="border-t border-border dark:border-border-dark bg-background-subtle dark:bg-background-darkSubtle px-6 py-4 flex justify-between">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={goToPrevStep}
            disabled={currentStep === 0}
            className={currentStep === 0 ? 'opacity-50 cursor-not-allowed' : ''}
          >
            Previous Step
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={goToNextStep}
          >
            {currentStep === 3 ? 'Restart Demo' : 'Next Step'}
          </Button>
        </div>
      </div>
    </UIComponentErrorBoundary>
  );
};

export default EnhancedInteractiveDemo;