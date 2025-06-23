import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import {
  ArrowLeft,
  ArrowRight,
  Home,
  Tool,
  User,
  Calendar,
  MapPin,
  Tag,
  CheckCircle,
  X,
  PlusCircle,
  MessageSquare,
  Clock,
  Settings
} from 'lucide-react';

const OnboardingModal = ({ onClose }) => {
  const { currentUser, userProfile } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState('');
  const [totalSteps, setTotalSteps] = useState(3);

  useEffect(() => {
    if (userProfile?.userType) {
      setUserRole(userProfile.userType);
      
      // Set total steps based on role
      if (userProfile.userType === 'landlord') {
        setTotalSteps(3);
      } else if (userProfile.userType === 'contractor') {
        setTotalSteps(3);
      } else if (userProfile.userType === 'tenant') {
        setTotalSteps(2);
      }
    }
  }, [userProfile]);

  const markOnboardingComplete = async () => {
    if (!currentUser) return;
    
    setLoading(true);
    try {
      const userRef = doc(db, 'users', currentUser.uid);
      await setDoc(userRef, { 
        onboardingComplete: true,
        onboardingCompletedAt: new Date()
      }, { merge: true });
      
      // Close modal after marking complete
      onClose();
    } catch (error) {
      console.error('Error updating onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      markOnboardingComplete();
    }
  };

  const handlePrevious = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const renderLandlordContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
              <Home className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Add Your First Property</h3>
            <p className="text-sm text-gray-500 mb-6">
              Start by adding a property to your portfolio. This will allow you to manage maintenance requests and tenants.
            </p>
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex items-center">
                <PlusCircle className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-sm font-medium">Click "Add Property" from your dashboard</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                You'll need the property address and basic details
              </p>
            </div>
            <img 
              src="/images/onboarding/add-property-demo.jpg" 
              alt="Add property demo"
              className="rounded-lg shadow-sm mx-auto mb-4 max-w-full h-auto"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x200?text=Add+Property+Screen';
              }}
            />
          </div>
        );
      case 2:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
              <User className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Connect With Contractors & Tenants</h3>
            <p className="text-sm text-gray-500 mb-6">
              Invite trusted contractors to your network and add tenants to your properties.
            </p>
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-sm font-medium">Click "Invite User" from your dashboard</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Enter their email and select their role
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="border rounded-lg p-3 bg-blue-50">
                <div className="flex items-center justify-center mb-2">
                  <Tool className="h-4 w-4 text-blue-600 mr-1" />
                  <span className="text-xs font-medium text-blue-800">Contractors</span>
                </div>
                <p className="text-xs text-blue-600">
                  Handle maintenance requests
                </p>
              </div>
              <div className="border rounded-lg p-3 bg-purple-50">
                <div className="flex items-center justify-center mb-2">
                  <Home className="h-4 w-4 text-purple-600 mr-1" />
                  <span className="text-xs font-medium text-purple-800">Tenants</span>
                </div>
                <p className="text-xs text-purple-600">
                  Submit maintenance requests
                </p>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
              <CheckCircle className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">You're All Set!</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your landlord dashboard is ready. Here's what you can do next:
            </p>
            <div className="space-y-3 text-left mb-6">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100">
                    <span className="text-xs font-medium text-green-800">1</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Monitor maintenance requests</p>
                  <p className="text-xs text-gray-500">Review and approve or assign tickets</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100">
                    <span className="text-xs font-medium text-green-800">2</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Manage your properties</p>
                  <p className="text-xs text-gray-500">Add details, tenants, and track occupancy</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-green-100">
                    <span className="text-xs font-medium text-green-800">3</span>
                  </div>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-gray-900">Build your contractor network</p>
                  <p className="text-xs text-gray-500">Find and connect with trusted service providers</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContractorContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
              <Tag className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Set Your Service Categories</h3>
            <p className="text-sm text-gray-500 mb-6">
              Let landlords know what services you provide so they can send relevant jobs your way.
            </p>
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex items-center">
                <Settings className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-sm font-medium">Click "Profile Settings" from your dashboard</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Then select the service categories you offer
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="border rounded-lg p-2 bg-blue-50">
                <p className="text-xs font-medium text-blue-800">Plumbing</p>
              </div>
              <div className="border rounded-lg p-2 bg-blue-50">
                <p className="text-xs font-medium text-blue-800">Electrical</p>
              </div>
              <div className="border rounded-lg p-2 bg-blue-50">
                <p className="text-xs font-medium text-blue-800">HVAC</p>
              </div>
              <div className="border rounded-lg p-2 bg-blue-50">
                <p className="text-xs font-medium text-blue-800">Carpentry</p>
              </div>
              <div className="border rounded-lg p-2 bg-blue-50">
                <p className="text-xs font-medium text-blue-800">Painting</p>
              </div>
              <div className="border rounded-lg p-2 bg-blue-50">
                <p className="text-xs font-medium text-blue-800">Cleaning</p>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
              <MapPin className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Set Your Service Area</h3>
            <p className="text-sm text-gray-500 mb-6">
              Define your preferred service radius and areas to receive geographically relevant jobs.
            </p>
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-sm font-medium">Specify your service area</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Set your home base and maximum distance you'll travel
              </p>
            </div>
            <div className="border rounded border-gray-300 p-3 bg-gray-50 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-700">Service Radius</span>
                <span className="text-sm font-medium text-teal-600">25 miles</span>
              </div>
              <div className="w-full bg-gray-200 rounded h-2">
                <div className="bg-teal-600 h-2 rounded" style={{ width: '60%' }}></div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
              <Calendar className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Set Your Availability</h3>
            <p className="text-sm text-gray-500 mb-6">
              Let landlords know when you're available to take on jobs.
            </p>
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-sm font-medium">Update your working hours</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Also mark days when you're unavailable
              </p>
            </div>
            <div className="border rounded-lg p-3 bg-gray-50 mb-6">
              <div className="grid grid-cols-7 gap-1 text-center">
                <div className="text-xs font-medium text-gray-500">Mon</div>
                <div className="text-xs font-medium text-gray-500">Tue</div>
                <div className="text-xs font-medium text-gray-500">Wed</div>
                <div className="text-xs font-medium text-gray-500">Thu</div>
                <div className="text-xs font-medium text-gray-500">Fri</div>
                <div className="text-xs font-medium text-gray-500">Sat</div>
                <div className="text-xs font-medium text-gray-500">Sun</div>
                
                <div className="bg-green-100 rounded py-1 text-xs text-green-800">9-5</div>
                <div className="bg-green-100 rounded py-1 text-xs text-green-800">9-5</div>
                <div className="bg-green-100 rounded py-1 text-xs text-green-800">9-5</div>
                <div className="bg-green-100 rounded py-1 text-xs text-green-800">9-5</div>
                <div className="bg-green-100 rounded py-1 text-xs text-green-800">9-5</div>
                <div className="bg-yellow-100 rounded py-1 text-xs text-yellow-800">9-12</div>
                <div className="bg-red-100 rounded py-1 text-xs text-red-800">Off</div>
              </div>
            </div>
            <p className="text-sm font-medium text-gray-900">
              You're all set! You'll now receive job requests that match your profile.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderTenantContent = () => {
    switch(step) {
      case 1:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
              <Home className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your Property</h3>
            <p className="text-sm text-gray-500 mb-6">
              Your landlord has added you to a property. Here's what you can see on your dashboard:
            </p>
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="space-y-3">
                <div className="flex items-start">
                  <Home className="h-4 w-4 text-teal-600 mt-0.5 mr-2" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Property Details</span>
                    <p className="text-xs text-gray-500">
                      View information about your property and contact details
                    </p>
                  </div>
                </div>
                <div className="flex items-start">
                  <MessageSquare className="h-4 w-4 text-teal-600 mt-0.5 mr-2" />
                  <div>
                    <span className="text-sm font-medium text-gray-900">Maintenance Requests</span>
                    <p className="text-xs text-gray-500">
                      Submit and track maintenance issues
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-teal-100 mb-4">
              <MessageSquare className="h-6 w-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Submit Maintenance Requests</h3>
            <p className="text-sm text-gray-500 mb-6">
              When something needs fixing, you can easily submit a maintenance request.
            </p>
            <div className="border rounded-lg p-4 bg-gray-50 mb-4">
              <div className="flex items-center">
                <PlusCircle className="h-5 w-5 text-teal-600 mr-2" />
                <span className="text-sm font-medium">Click "New Request" from your dashboard</span>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-7">
                Fill in details and add photos of the issue
              </p>
            </div>
            <div className="border rounded-lg p-3 bg-teal-50 mb-6">
              <h4 className="text-sm font-medium text-teal-800 mb-2">Pro Tips:</h4>
              <ul className="text-xs text-teal-700 text-left space-y-2">
                <li className="flex items-start">
                  <CheckCircle className="h-3.5 w-3.5 text-teal-600 mt-0.5 mr-1 flex-shrink-0" />
                  <span>Be specific about the issue</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-3.5 w-3.5 text-teal-600 mt-0.5 mr-1 flex-shrink-0" />
                  <span>Add clear photos from multiple angles</span>
                </li>
                <li className="flex items-start">
                  <CheckCircle className="h-3.5 w-3.5 text-teal-600 mt-0.5 mr-1 flex-shrink-0" />
                  <span>Indicate the urgency level accurately</span>
                </li>
              </ul>
            </div>
            <p className="text-sm font-medium text-gray-900">
              You're all set! Your dashboard is ready for you to use.
            </p>
          </div>
        );
      default:
        return null;
    }
  };

  const renderContent = () => {
    switch(userRole) {
      case 'landlord':
        return renderLandlordContent();
      case 'contractor':
        return renderContractorContent();
      case 'tenant':
        return renderTenantContent();
      default:
        return (
          <div className="text-center">
            <p>Loading your personalized onboarding experience...</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-center border-b border-gray-200">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Welcome to Propagentic
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
          >
            <span className="sr-only">Close</span>
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-4 py-5 sm:p-6">
          {renderContent()}
        </div>
        <div className="px-4 py-4 sm:px-6 bg-gray-50 flex justify-between">
          <button
            type="button"
            onClick={handlePrevious}
            disabled={step === 1}
            className={`inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 ${step === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Previous
          </button>
          <div className="flex items-center">
            <div className="flex space-x-1">
              {Array.from({ length: totalSteps }).map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 w-2 rounded-full ${idx + 1 <= step ? 'bg-teal-500' : 'bg-gray-300'}`}
                ></div>
              ))}
            </div>
            <span className="ml-2 text-xs text-gray-500">
              Step {step} of {totalSteps}
            </span>
          </div>
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
          >
            {step === totalSteps ? (
              loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Finishing...
                </>
              ) : (
                <>
                  Get Started
                  <CheckCircle className="h-4 w-4 ml-1" />
                </>
              )
            ) : (
              <>
                Next
                <ArrowRight className="h-4 w-4 ml-1" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal; 