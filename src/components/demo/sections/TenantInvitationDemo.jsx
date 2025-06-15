import React, { useState, useEffect } from 'react';
import { useDemo } from '../../../context/DemoContext';
import { 
  EnvelopeIcon, 
  UserPlusIcon, 
  CheckCircleIcon,
  DevicePhoneMobileIcon,
  ArrowRightIcon,
  SparklesIcon,
  ClockIcon,
  ShieldCheckIcon,
  HomeIcon,
  PaperAirplaneIcon,
  StarIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

const TenantInvitationDemo = ({ isPlaying, onComplete }) => {
  const { demoData, addTenant, updateMetrics, startSection, completeSection } = useDemo();
  const [currentStep, setCurrentStep] = useState(0);
  const [inviteCode, setInviteCode] = useState('');
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [tenantEmail, setTenantEmail] = useState('michael.chen@email.com');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showTenantView, setShowTenantView] = useState(false);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [tenantInviteTime, setTenantInviteTime] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (isPlaying) {
      startSection('tenantInvitation');
      // Generate a random invite code
      const code = 'DEMO' + Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      setInviteCode(code);
      
      // Auto-select first property if available
      if (demoData.properties.length > 0) {
        setSelectedProperty(demoData.properties[0]);
      }
      
      // Start timer
      const timerInterval = setInterval(() => {
        setTenantInviteTime(prev => prev + 0.1);
      }, 100);
      
      // Auto-progress through steps with proper timing
      const progressTimers = [];
      
      // Step 1: Property Selection (3 seconds)
      progressTimers.push(setTimeout(() => {
        setCurrentStep(1);
      }, 3000));
      
      // Step 2: Email typing simulation (6 seconds)
      progressTimers.push(setTimeout(() => {
        setCurrentStep(2);
        setIsTyping(true);
      }, 6000));
      
      // Step 3: Send invitation (9 seconds)
      progressTimers.push(setTimeout(() => {
        setCurrentStep(3);
        setIsTyping(false);
        setShowSuccess(true);
        setShowEmailPreview(true);
        // Show notification to tenant
        setTimeout(() => setShowNotification(true), 1000);
      }, 9000));
      
      // Step 4: Tenant receives invite (13 seconds)
      progressTimers.push(setTimeout(() => {
        setCurrentStep(4);
        setShowTenantView(true);
        clearInterval(timerInterval);
        updateMetrics({ tenantInviteTime: tenantInviteTime });
      }, 13000));
      
      // Complete demo (18 seconds)
      progressTimers.push(setTimeout(() => {
        // Add tenant to demo data
        addTenant({
          id: 'tenant-1',
          name: 'Michael Chen',
          email: tenantEmail,
          propertyId: selectedProperty?.id,
          joinedAt: new Date()
        });
        updateMetrics({ totalTenants: 1 });
        completeSection('tenantInvitation');
        onComplete();
      }, 18000));
      
      return () => {
        clearInterval(timerInterval);
        progressTimers.forEach(timer => clearTimeout(timer));
      };
    }
  }, [isPlaying, demoData.properties, startSection, completeSection, onComplete, addTenant, updateMetrics, tenantEmail, selectedProperty, tenantInviteTime]);

  const steps = [
    'Select Property',
    'Enter Tenant Email',
    'Send Invitation',
    'Tenant Receives Invite',
    'Tenant Joins Property'
  ];

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8">
      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <motion.div 
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${index <= currentStep 
                    ? 'bg-teal-600 text-white' 
                    : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                  }
                `}
                animate={index === currentStep ? { scale: [1, 1.1, 1] } : {}}
                transition={{ duration: 0.5 }}
              >
                {index < currentStep ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </motion.div>
              {index < steps.length - 1 && (
                <div className={`
                  w-full h-1 mx-2 transition-all duration-500
                  ${index < currentStep 
                    ? 'bg-teal-600' 
                    : 'bg-gray-300 dark:bg-gray-600'
                  }
                `} />
              )}
            </div>
          ))}
        </div>
        <div className="flex justify-between mt-2">
          {steps.map((step, index) => (
            <p key={index} className={`
              text-xs transition-all
              ${index <= currentStep 
                ? 'text-gray-900 dark:text-white font-medium' 
                : 'text-gray-500 dark:text-gray-400'
              }
            `}>
              {step}
            </p>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        {/* Landlord View */}
        <div className={`transition-opacity duration-500 ${showTenantView ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Landlord Dashboard
              </h3>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full text-sm font-medium">
                Landlord View
              </span>
            </div>

            {/* Property Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Property
              </label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {demoData.properties.map((property, index) => (
                  <motion.div
                    key={property.id}
                    className={`
                      p-4 rounded-lg border-2 cursor-pointer transition-all
                      ${selectedProperty?.id === property.id
                        ? 'border-teal-600 bg-teal-50 dark:bg-teal-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                      }
                    `}
                    onClick={() => setSelectedProperty(property)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
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
                      <HomeIcon className="w-5 h-5 text-gray-400" />
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Email Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tenant Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={tenantEmail}
                  onChange={(e) => setTenantEmail(e.target.value)}
                  className={`
                    w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg 
                    bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-all
                    ${isTyping ? 'ring-2 ring-teal-500 border-teal-500' : ''}
                  `}
                  placeholder="tenant@email.com"
                />
                <EnvelopeIcon className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                {isTyping && (
                  <div className="absolute right-3 top-3.5">
                    <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            </div>

            {/* Send Invite Button */}
            <motion.button
              className={`
                w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2
                ${currentStep >= 3
                  ? 'bg-green-600 text-white'
                  : 'bg-teal-600 text-white hover:bg-teal-700'
                }
              `}
              whileTap={{ scale: 0.95 }}
              animate={currentStep === 2 ? { scale: [1, 1.02, 1] } : {}}
            >
              {currentStep >= 3 ? (
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

            {/* Success Message */}
            <AnimatePresence>
              {showSuccess && (
                <motion.div 
                  className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <div className="flex items-start space-x-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-600 dark:text-green-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-300">
                        Invitation sent successfully!
                      </p>
                      <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                        Invite code: <span className="font-mono font-bold">{inviteCode}</span>
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-500 mt-2">
                        Time: {tenantInviteTime.toFixed(1)}s
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email Preview */}
            <AnimatePresence>
              {showEmailPreview && (
                <motion.div 
                  className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-start space-x-3">
                    <EnvelopeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                        Email Preview
                      </p>
                      <div className="text-xs text-blue-700 dark:text-blue-400 mt-2 p-3 bg-white dark:bg-gray-800 rounded border">
                        <p className="font-semibold">To: {tenantEmail}</p>
                        <p className="font-semibold">Subject: Welcome to {selectedProperty?.name}!</p>
                        <p className="mt-2">Hi Michael,</p>
                        <p className="mt-1">You've been invited to join {selectedProperty?.name} on PropAgentic!</p>
                        <p className="mt-1 font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                          Your invite code: {inviteCode}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Tenant View */}
        <div className={`transition-opacity duration-500 ${!showTenantView ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Tenant Mobile View
              </h3>
              <span className="px-3 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-full text-sm font-medium">
                Tenant View
              </span>
              {showNotification && (
                <motion.div
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 500 }}
                >
                  <BellIcon className="w-4 h-4 text-white" />
                </motion.div>
              )}
            </div>

            {/* Mobile Device Frame */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-3xl p-4 mx-auto max-w-xs relative">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {showTenantView ? (
                    <motion.div 
                      className="space-y-4"
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                    >
                      {/* Email Notification */}
                      <motion.div 
                        className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3"
                        initial={{ x: -100, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <EnvelopeIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-800 dark:text-blue-300">
                            New Email
                          </span>
                          <motion.span 
                            className="ml-auto w-2 h-2 bg-blue-600 rounded-full"
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          />
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          You've been invited to join {selectedProperty?.name}!
                        </p>
                      </motion.div>

                      {/* Invite Code Display */}
                      <motion.div 
                        className="bg-gradient-to-r from-teal-500 to-teal-600 rounded-xl p-6 text-white text-center"
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1 }}
                      >
                        <p className="text-sm mb-2">Your Invite Code</p>
                        <motion.p 
                          className="text-3xl font-mono font-bold mb-4"
                          animate={{ scale: [1, 1.05, 1] }}
                          transition={{ delay: 1.5, duration: 0.5 }}
                        >
                          {inviteCode}
                        </motion.p>
                        <p className="text-xs opacity-90">Valid for 7 days</p>
                      </motion.div>

                      {/* Join Button */}
                      <motion.button 
                        className="w-full bg-teal-600 text-white py-3 rounded-lg font-medium flex items-center justify-center space-x-2"
                        initial={{ y: 50, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 1.5 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <span>Join PropAgentic</span>
                        <ArrowRightIcon className="w-4 h-4" />
                      </motion.button>

                      {/* Benefits */}
                      <motion.div 
                        className="space-y-2 pt-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                      >
                        <div className="flex items-center space-x-3">
                          <ClockIcon className="w-5 h-5 text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            60-second signup process
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <ShieldCheckIcon className="w-5 h-5 text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Secure & verified by landlord
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <StarIcon className="w-5 h-5 text-gray-400" />
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            4.8/5 tenant satisfaction
                          </p>
                        </div>
                      </motion.div>
                    </motion.div>
                  ) : (
                    <motion.div 
                      className="flex items-center justify-center h-full"
                      initial={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="text-center">
                        <DevicePhoneMobileIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500 dark:text-gray-400">
                          Waiting for invitation...
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features */}
      <motion.div 
        className="mt-8 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-xl p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center space-x-3 mb-4">
          <SparklesIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Traditional vs PropAgentic
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tenant Onboarding</p>
            <p className="text-sm text-gray-500 line-through">2-3 weeks</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {tenantInviteTime > 0 ? `${tenantInviteTime.toFixed(1)}s` : '60s'}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Paper Forms</p>
            <p className="text-sm text-gray-500 line-through">5-10 forms</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">0</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Manual Processing</p>
            <p className="text-sm text-gray-500 line-through">100%</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">0%</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TenantInvitationDemo; 