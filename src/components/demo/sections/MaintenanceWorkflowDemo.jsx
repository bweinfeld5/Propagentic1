import React, { useState, useEffect } from 'react';
import { useDemo } from '../../../context/DemoContext';
import {
  WrenchScrewdriverIcon,
  CameraIcon,
  BoltIcon,
  ClockIcon,
  CheckCircleIcon,
  ChatBubbleLeftRightIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ArrowUpIcon,
  SparklesIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const MaintenanceWorkflowDemo = ({ isPlaying, onComplete }) => {
  const { demoData, updateMetrics, startSection, completeSection } = useDemo();
  const [currentStep, setCurrentStep] = useState(0);
  const [showTenantSubmission, setShowTenantSubmission] = useState(false);
  const [showLandlordNotification, setShowLandlordNotification] = useState(false);
  const [showAIAnalysis, setShowAIAnalysis] = useState(false);
  const [requestId] = useState('REQ-' + Math.floor(Math.random() * 10000).toString().padStart(4, '0'));
  const [responseTime, setResponseTime] = useState(0);

  useEffect(() => {
    if (isPlaying) {
      startSection('maintenanceWorkflow');
      
      // Start response time counter
      const responseInterval = setInterval(() => {
        setResponseTime(prev => prev + 1);
      }, 100);
      
      // Auto-progress through steps
      const timer = setTimeout(() => {
        if (currentStep < 5) {
          setCurrentStep(currentStep + 1);
          
          if (currentStep === 0) {
            setShowTenantSubmission(true);
          } else if (currentStep === 1) {
            setShowAIAnalysis(true);
          } else if (currentStep === 2) {
            setShowLandlordNotification(true);
            clearInterval(responseInterval); // Stop counting
            updateMetrics({ maintenanceResponseTime: responseTime / 10 }); // Convert to seconds
          }
        } else {
          completeSection('maintenanceWorkflow');
          onComplete();
        }
      }, 2500);
      
      return () => {
        clearTimeout(timer);
        clearInterval(responseInterval);
      };
    }
  }, [isPlaying, currentStep, startSection, completeSection, onComplete, updateMetrics, responseTime]);

  const steps = [
    'Tenant Reports Issue',
    'AI Analysis',
    'Landlord Notified',
    'Issue Assigned',
    'Updates Sent',
    'Issue Resolved'
  ];

  return (
    <div className="h-full bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-2xl p-8">
      {/* Progress Steps */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={index} className="flex items-center">
              <div className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all
                ${index <= currentStep 
                  ? 'bg-teal-600 text-white' 
                  : 'bg-gray-300 dark:bg-gray-600 text-gray-500'
                }
              `}>
                {index < currentStep ? (
                  <CheckCircleIcon className="w-6 h-6" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < steps.length - 1 && (
                <div className={`
                  w-full h-0.5 mx-1 transition-all
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

      <div className="grid grid-cols-2 gap-6">
        {/* Tenant Mobile View */}
        <div className={`transition-opacity ${showLandlordNotification ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Tenant Mobile App
              </h3>
              <span className="px-3 py-1 bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300 rounded-full text-sm font-medium">
                <DevicePhoneMobileIcon className="inline w-4 h-4 mr-1" />
                Tenant View
              </span>
            </div>

            {/* Mobile Device Frame */}
            <div className="bg-gray-100 dark:bg-gray-700 rounded-3xl p-4 mx-auto max-w-xs">
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 min-h-[450px]">
                {showTenantSubmission ? (
                  <div className="space-y-4">
                    {/* Issue Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        What's the issue?
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <button className="p-3 rounded-lg border-2 border-red-500 bg-red-50 dark:bg-red-900/20">
                          <BoltIcon className="w-6 h-6 text-red-600 dark:text-red-400 mx-auto mb-1" />
                          <p className="text-xs font-medium text-red-700 dark:text-red-300">Electrical</p>
                        </button>
                        <button className="p-3 rounded-lg border border-gray-200 dark:border-gray-600">
                          <WrenchScrewdriverIcon className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <p className="text-xs text-gray-600 dark:text-gray-400">Plumbing</p>
                        </button>
                      </div>
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                        rows={3}
                        value="Power outlet in kitchen not working. Tried resetting breaker but still no power."
                        readOnly
                      />
                    </div>

                    {/* Photo Upload */}
                    <div>
                      <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center">
                        <CameraIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600 dark:text-gray-400">Photo attached</p>
                        <div className="mt-2 w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded mx-auto" />
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button className={`
                      w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center space-x-2
                      ${currentStep >= 1 
                        ? 'bg-green-600 text-white' 
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                      }
                    `}>
                      {currentStep >= 1 ? (
                        <>
                          <CheckCircleIcon className="w-5 h-5" />
                          <span>Submitted!</span>
                        </>
                      ) : (
                        <>
                          <ArrowUpIcon className="w-5 h-5" />
                          <span>Submit Request</span>
                        </>
                      )}
                    </button>

                    {/* Success Message */}
                    {currentStep >= 1 && (
                      <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <p className="text-sm font-medium text-green-800 dark:text-green-300">
                          Request #{requestId} submitted
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400 mt-1">
                          Estimated response: 15 minutes
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <WrenchScrewdriverIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-500 dark:text-gray-400">
                        Ready to report an issue
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Landlord Desktop View */}
        <div className={`transition-opacity ${!showLandlordNotification ? 'opacity-50' : 'opacity-100'}`}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Landlord Dashboard
              </h3>
              <span className="px-3 py-1 bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300 rounded-full text-sm font-medium">
                <ComputerDesktopIcon className="inline w-4 h-4 mr-1" />
                Landlord View
              </span>
            </div>

            {showLandlordNotification ? (
              <div className="space-y-4">
                {/* Real-time Notification */}
                <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg animate-pulse">
                  <div className="flex items-start space-x-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-medium text-red-800 dark:text-red-300">
                        New Maintenance Request
                      </p>
                      <p className="text-sm text-red-700 dark:text-red-400 mt-1">
                        Electrical issue at {demoData.properties[0]?.name}
                      </p>
                      <p className="text-xs text-red-600 dark:text-red-500 mt-2">
                        Response time: {(responseTime / 10).toFixed(1)}s
                      </p>
                    </div>
                  </div>
                </div>

                {/* AI Analysis */}
                {showAIAnalysis && (
                  <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-4">
                    <div className="flex items-start space-x-3">
                      <SparklesIcon className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-purple-800 dark:text-purple-300">
                          AI Analysis Complete
                        </p>
                        <ul className="text-sm text-purple-700 dark:text-purple-400 mt-2 space-y-1">
                          <li>• Priority: <span className="font-semibold">High</span></li>
                          <li>• Category: Electrical Safety</li>
                          <li>• Estimated cost: $150-$300</li>
                          <li>• Recommended: Licensed electrician</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                )}

                {/* Request Details */}
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Request #{requestId}
                    </h4>
                    <span className="text-xs text-gray-500">
                      {currentStep >= 3 ? 'Assigned' : 'Pending'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Tenant:</span> Michael Chen
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Unit:</span> Apt 4B
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Issue:</span> Power outlet not working
                    </p>
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex space-x-2">
                    <button className={`
                      flex-1 py-2 rounded-lg font-medium text-sm transition-all
                      ${currentStep >= 3 
                        ? 'bg-green-600 text-white' 
                        : 'bg-teal-600 text-white hover:bg-teal-700'
                      }
                    `}>
                      {currentStep >= 3 ? 'Assigned to Contractor' : 'Assign'}
                    </button>
                    <button className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                      <ChatBubbleLeftRightIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Communication Thread */}
                {currentStep >= 4 && (
                  <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Updates
                    </p>
                    <div className="space-y-2">
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <p className="font-medium">System: Contractor notified</p>
                        <p>ETA: Tomorrow 2-4 PM</p>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        <p className="font-medium">Tenant: Auto-notified via SMS</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-[400px]">
                <div className="text-center">
                  <ClockIcon className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">
                    Monitoring for new requests...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Business Impact */}
      <div className="mt-6 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-4">
          <CheckCircleIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
            Traditional vs PropAgentic
          </h4>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Response Time</p>
            <p className="text-sm text-gray-500 line-through">2-3 days</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">
              {responseTime > 0 ? `${(responseTime / 10).toFixed(1)}s` : '< 1 min'}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Phone Calls</p>
            <p className="text-sm text-gray-500 line-through">5-7 calls</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">0 calls</p>
          </div>
          <div>
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Tenant Satisfaction</p>
            <p className="text-sm text-gray-500 line-through">3.2/5</p>
            <p className="text-lg font-bold text-green-600 dark:text-green-400">4.8/5</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceWorkflowDemo; 