import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeftIcon, PlayIcon, PauseIcon, ArrowPathIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import { 
  EnvelopeIcon, 
  UserPlusIcon, 
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon,
  HomeIcon,
  PaperAirplaneIcon,
  StarIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  ExclamationTriangleIcon,
  CameraIcon,
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { generateDemoData } from '../../services/demoDataGenerator';

const PitchDeckDemo = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [demoStartTime, setDemoStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  
  // Demo data
  const [demoData, setDemoData] = useState(null);
  
  // Landlord onboarding states
  const [propertiesAdded, setPropertiesAdded] = useState(0);
  const [setupTime, setSetupTime] = useState(0);
  
  // Tenant invitation states
  const [inviteCode, setInviteCode] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [tenantEmail, setTenantEmail] = useState('michael.chen@email.com');
  const [inviteSent, setInviteSent] = useState(false);
  const [tenantJoined, setTenantJoined] = useState(false);
  const [inviteTime, setInviteTime] = useState(0);
  
  // Maintenance workflow states - All 7 processes
  const [workOrderSubmitted, setWorkOrderSubmitted] = useState(false);
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiClassified, setAiClassified] = useState(false);
  const [contractorMatched, setContractorMatched] = useState(false);
  const [paymentProcessed, setPaymentProcessed] = useState(false);
  const [trackingActive, setTrackingActive] = useState(false);
  const [dispatchSent, setDispatchSent] = useState(false);
  const [bookkeepingComplete, setBookkeepingComplete] = useState(false);
  const [maintenanceTime, setMaintenanceTime] = useState(0);

  // Initialize demo data
  useEffect(() => {
    const data = generateDemoData();
    setDemoData(data);
    if (data.properties.length > 0) {
      setSelectedProperty(data.properties[0]);
    }
  }, []);

  // Timer effect
  useEffect(() => {
    if (isPlaying && demoStartTime) {
      const timer = setInterval(() => {
        setElapsedTime((Date.now() - demoStartTime) / 1000);
      }, 100);
      return () => clearInterval(timer);
    }
  }, [isPlaying, demoStartTime]);

  // Demo progression
  useEffect(() => {
    if (!isPlaying || !demoData) return;

    const timers = [];

    // Phase 1: Landlord Onboarding (0-8s)
    timers.push(setTimeout(() => setCurrentPhase(1), 1000));
    timers.push(setTimeout(() => setPropertiesAdded(1), 2000));
    timers.push(setTimeout(() => setPropertiesAdded(2), 3500));
    timers.push(setTimeout(() => setPropertiesAdded(3), 5000));
    timers.push(setTimeout(() => setSetupTime(6.3), 6300));

    // Phase 2: Tenant Invitation (8-18s)
    timers.push(setTimeout(() => {
      setCurrentPhase(2);
      const code = 'PROP' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setInviteCode(code);
    }, 8000));
    
    timers.push(setTimeout(() => setInviteSent(true), 11000));
    timers.push(setTimeout(() => setTenantJoined(true), 15000));
    timers.push(setTimeout(() => setInviteTime(7.2), 15200));

    // Phase 3: Maintenance Workflow - Correct Order & Realistic Timing (18-45s)
    // Real timing: Process 1: Immediate, Process 2: ~2 mins, Process 3: ~5 mins, 
    // Process 6: ~15 mins, Process 5: ~30 mins, Process 4: ~2 hours, Process 7: ~2.5 hours
    timers.push(setTimeout(() => {
      setCurrentPhase(3);
      setWorkOrderSubmitted(true); // Process 1: Work Order Submission (Immediate)
    }, 18000));
    
    timers.push(setTimeout(() => setAiClassifying(true), 19000)); // Process 2: AI Classification starts (30s delay)
    timers.push(setTimeout(() => {
      setAiClassifying(false);
      setAiClassified(true); // Process 2 complete (~2 minutes in real time)
    }, 22000));
    
    timers.push(setTimeout(() => setContractorMatched(true), 25000)); // Process 3: Smart Contractor Matching (~5 minutes real time)
    timers.push(setTimeout(() => setDispatchSent(true), 28000)); // Process 6: Automated Dispatch (~15 minutes real time)
    timers.push(setTimeout(() => setTrackingActive(true), 32000)); // Process 5: Real-Time Tracking (~30 minutes real time)
    timers.push(setTimeout(() => setPaymentProcessed(true), 38000)); // Process 4: Payment (~2 hours real time)
    timers.push(setTimeout(() => {
      setBookkeepingComplete(true); // Process 7: Bookkeeping (~2.5 hours real time)
      setMaintenanceTime(2.5); // Show 2.5 hours in results
    }, 42000));

    // End demo
    timers.push(setTimeout(() => {
      setIsPlaying(false);
      setCurrentPhase(4);
    }, 45000));

    return () => timers.forEach(timer => clearTimeout(timer));
  }, [isPlaying, demoData]);

  const handlePlayPause = () => {
    if (!isPlaying && !demoStartTime) {
      setDemoStartTime(Date.now());
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentPhase(0);
    setDemoStartTime(null);
    setElapsedTime(0);
    setPropertiesAdded(0);
    setSetupTime(0);
    setInviteCode('');
    setInviteSent(false);
    setTenantJoined(false);
    setInviteTime(0);
    setWorkOrderSubmitted(false);
    setAiClassifying(false);
    setAiClassified(false);
    setContractorMatched(false);
    setPaymentProcessed(false);
    setTrackingActive(false);
    setDispatchSent(false);
    setBookkeepingComplete(false);
    setMaintenanceTime(0);
  };

  if (!demoData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-t-teal-600 border-b-teal-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/')}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <ArrowLeftIcon className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  PropAgentic Investor Demo
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Complete Property Management Workflow
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {elapsedTime.toFixed(1)}s
              </div>
              
              <button
                onClick={handlePlayPause}
                className="flex items-center space-x-2 px-4 py-2 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
              >
                {isPlaying ? <PauseIcon className="h-5 w-5" /> : <PlayIcon className="h-5 w-5" />}
                <span>{isPlaying ? 'Pause' : 'Play'} Demo</span>
              </button>

              <button
                onClick={handleReset}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                title="Reset Demo"
              >
                <ArrowPathIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Indicator */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-8 py-4">
            {['Setup', 'Invite', 'Maintain', 'Results'].map((phase, index) => (
              <div key={phase} className="flex items-center space-x-2">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                  ${currentPhase > index ? 'bg-teal-600 text-white' : 
                    currentPhase === index ? 'bg-teal-100 text-teal-600 border-2 border-teal-600' :
                    'bg-gray-200 text-gray-500'}
                `}>
                  {currentPhase > index ? <CheckCircleIcon className="h-5 w-5" /> : index + 1}
                </div>
                <span className={`text-sm font-medium ${currentPhase >= index ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>
                  {phase}
                </span>
                {index < 3 && (
                  <ArrowRightIcon className={`h-4 w-4 ${currentPhase > index ? 'text-teal-600' : 'text-gray-300'}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-12 gap-8">
          
          {/* Phase 1: Landlord Onboarding */}
          <motion.div 
            className={`col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-500 ${
              currentPhase >= 1 ? 'ring-2 ring-orange-500' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Setup Properties
              </h3>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full text-sm font-medium">
                Phase 1
              </span>
            </div>

            <div className="space-y-4">
              {demoData.properties.slice(0, 3).map((property, index) => (
                <motion.div
                  key={property.id}
                  className={`
                    p-4 rounded-lg border-2 transition-all
                    ${index < propertiesAdded
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                    }
                  `}
                  initial={{ opacity: 0.3 }}
                  animate={{ 
                    opacity: index < propertiesAdded ? 1 : 0.3,
                    scale: index < propertiesAdded ? 1 : 0.95
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {property.name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {property.address}
                      </p>
                    </div>
                    {index < propertiesAdded && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500 }}
                      >
                        <CheckCircleIcon className="w-6 h-6 text-green-600" />
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {setupTime > 0 && (
              <motion.div 
                className="mt-4 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
              >
                <div className="flex items-center space-x-2">
                  <ClockIcon className="w-5 h-5 text-orange-600" />
                  <span className="text-sm font-medium text-orange-800 dark:text-orange-300">
                    Setup completed in {setupTime}s
                  </span>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Phase 2: Tenant Invitation */}
          <motion.div 
            className={`col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-500 ${
              currentPhase >= 2 ? 'ring-2 ring-teal-500' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Invite Tenant
              </h3>
              <span className="px-3 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-full text-sm font-medium">
                Phase 2
              </span>
            </div>

            {/* Property Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Property
              </label>
              <div className={`
                p-3 rounded-lg border-2 transition-all
                ${selectedProperty ? 'border-teal-500 bg-teal-50 dark:bg-teal-900/20' : 'border-gray-200'}
              `}>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedProperty?.name || 'Select Property'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedProperty?.address}
                </p>
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tenant Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={tenantEmail}
                  className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                  readOnly
                />
                <EnvelopeIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              </div>
            </div>

            {/* Send Button */}
            <motion.button
              className={`
                w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2
                ${inviteSent
                  ? 'bg-green-600 text-white'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
                }
              `}
              animate={currentPhase === 2 && !inviteSent ? { scale: [1, 1.02, 1] } : {}}
              transition={{ repeat: 3, duration: 0.5 }}
            >
              {inviteSent ? (
                <>
                  <CheckCircleIcon className="w-5 h-5" />
                  <span>Invitation Sent!</span>
                </>
              ) : (
                <>
                  <PaperAirplaneIcon className="w-5 h-5" />
                  <span>Send Invitation</span>
                </>
              )}
            </motion.button>

            {/* Mobile Preview */}
            {inviteSent && (
              <motion.div 
                className="mt-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl p-3">
                  <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                    <DevicePhoneMobileIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                      Michael's Phone
                    </p>
                    
                    {tenantJoined ? (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-2"
                      >
                        <div className="bg-teal-500 text-white rounded-lg p-3">
                          <p className="text-sm font-medium">Welcome!</p>
                          <p className="text-xs">Code: {inviteCode}</p>
                        </div>
                        <p className="text-xs text-green-600 font-medium">
                          ✓ Joined in {inviteTime}s
                        </p>
                      </motion.div>
                    ) : (
                      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                        <BellIcon className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                        <p className="text-xs text-blue-700 dark:text-blue-300">
                          New Invitation
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Phase 3: Complete Maintenance Workflow - All 7 Processes */}
          <motion.div 
            className={`col-span-4 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 transition-all duration-500 ${
              currentPhase >= 3 ? 'ring-2 ring-red-500' : ''
            }`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                PropAgentic Process
              </h3>
              <span className="px-3 py-1 bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 rounded-full text-sm font-medium">
                Phase 3
              </span>
            </div>

            <div className="space-y-3">
              {/* Process 1: Work Order Submission */}
              <motion.div 
                className={`
                  p-3 rounded-lg border-2 transition-all
                  ${workOrderSubmitted ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200'}
                `}
                animate={workOrderSubmitted ? { scale: [1, 1.02, 1] } : {}}
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                    1
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Work Order Submission
                    </p>
                    {workOrderSubmitted && (
                      <p className="text-xs text-red-600 mt-0.5">
                        ✓ Electrical outlet issue reported (Instant)
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Process 2: AI Classification */}
              {workOrderSubmitted && (
                <motion.div 
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${aiClassifying ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 
                      aiClassified ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                      'border-gray-200'}
                  `}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                      2
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        AI Classification
                      </p>
                      {aiClassifying ? (
                        <p className="text-xs text-purple-600 mt-0.5">
                          <span className="animate-pulse">Analyzing issue...</span>
                        </p>
                      ) : aiClassified ? (
                        <p className="text-xs text-green-600 mt-0.5">
                          ✓ Priority: Medium | Cost: $150 | Category: Electrical (2 min)
                        </p>
                      ) : null}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Process 3: Smart Contractor Matching */}
              {aiClassified && (
                <motion.div 
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${contractorMatched ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200'}
                  `}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                      3
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Smart Contractor Matching
                      </p>
                      {contractorMatched && (
                        <p className="text-xs text-blue-600 mt-0.5">
                          ✓ Elite Electric (4.9★, 2mi away, available) (5 min)
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Process 6: Automated Dispatch */}
              {contractorMatched && (
                <motion.div 
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${dispatchSent ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-200'}
                  `}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                      6
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Automated Dispatch
                      </p>
                      {dispatchSent && (
                        <p className="text-xs text-indigo-600 mt-0.5">
                          ✓ Work order sent, contractor accepted (15 min)
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Process 5: Real-Time Tracking */}
              {dispatchSent && (
                <motion.div 
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${trackingActive ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-900/20' : 'border-gray-200'}
                  `}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                      5
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Real-Time Tracking
                      </p>
                      {trackingActive && (
                        <div className="flex items-center space-x-2 mt-0.5">
                          <MapPinIcon className="w-3 h-3 text-cyan-600 animate-pulse" />
                          <p className="text-xs text-cyan-600">
                            Contractor en route, live GPS tracking (30 min)
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Process 4: Streamlined Payment */}
              {trackingActive && (
                <motion.div 
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${paymentProcessed ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200'}
                  `}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                      4
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Streamlined Payment
                      </p>
                      {paymentProcessed && (
                        <p className="text-xs text-emerald-600 mt-0.5">
                          ✓ Work completed, $150 auto-paid to contractor (2 hrs)
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Process 7: Automated Bookkeeping */}
              {paymentProcessed && (
                <motion.div 
                  className={`
                    p-3 rounded-lg border-2 transition-all
                    ${bookkeepingComplete ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200'}
                  `}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                >
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-orange-100 text-orange-600 text-sm font-bold">
                      7
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        Automated Bookkeeping
                      </p>
                      {bookkeepingComplete && (
                        <p className="text-xs text-amber-600 mt-0.5">
                          ✓ Expense recorded, tax categorized, reports updated (2.5 hrs)
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Total Time */}
            {bookkeepingComplete && (
              <motion.div 
                className="mt-4 p-3 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Total Process Time:
                  </span>
                  <span className="text-lg font-bold text-orange-600 dark:text-orange-400">
                    {maintenanceTime} hrs
                  </span>
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Traditional process: 3-7 days
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>

        {/* Results Summary */}
        {currentPhase >= 4 && (
          <motion.div 
            className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Traditional vs PropAgentic
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                See the dramatic improvement in speed and efficiency
              </p>
            </div>
            
            <div className="grid grid-cols-3 gap-8">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Property Setup
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 line-through">2-3 weeks</p>
                  <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                    {setupTime}s
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    99.9% faster
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Tenant Onboarding
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 line-through">3-5 days</p>
                  <p className="text-3xl font-bold text-teal-600 dark:text-teal-400">
                    {inviteTime}s
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    100% digital
                  </p>
                </div>
              </div>
              
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Maintenance Process
                </p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 line-through">2-5 days</p>
                  <p className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {maintenanceTime} hrs
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Fully automated
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-4 gap-4 text-center">
              <div>
                <CreditCardIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Instant Payments
                </p>
              </div>
              <div>
                <MapPinIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Live Tracking
                </p>
              </div>
              <div>
                <ChartBarIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Auto Bookkeeping
                </p>
              </div>
              <div>
                <SparklesIcon className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  AI-Powered
                </p>
              </div>
            </div>

            <div className="mt-8 text-center">
              <motion.button
                className="inline-flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:scale-105 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate('/signup')}
              >
                <span>Start Your Free Trial</span>
                <ArrowRightIcon className="w-5 h-5" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
};

export default PitchDeckDemo; 