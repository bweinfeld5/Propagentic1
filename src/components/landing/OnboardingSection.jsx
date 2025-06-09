import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const OnboardingSection = () => {
  const [selectedRole, setSelectedRole] = useState('Landlord');
  
  // Define onboarding steps for each role
  const onboardingSteps = {
    Landlord: [
      { id: 1, name: 'Create Account', completed: true },
      { id: 2, name: 'Add Property', completed: false },
      { id: 3, name: 'Invite Tenants', completed: false },
      { id: 4, name: 'Connect Contractors', completed: false },
      { id: 5, name: 'Activate AI Routing', completed: false }
    ],
    Tenant: [
      { id: 1, name: 'Create Account', completed: true },
      { id: 2, name: 'Join Property', completed: false },
      { id: 3, name: 'Complete Profile', completed: false },
      { id: 4, name: 'Report First Issue', completed: false }
    ],
    Contractor: [
      { id: 1, name: 'Create Account', completed: true },
      { id: 2, name: 'Add Services', completed: false },
      { id: 3, name: 'Set Availability', completed: false },
      { id: 4, name: 'Add Service Areas', completed: false },
      { id: 5, name: 'Receive First Job', completed: false }
    ]
  };

  // Badges and achievements for each role
  const roleBadges = {
    Landlord: [
      { name: 'Property Pro', description: 'Add your first 3 properties', icon: '🏢' },
      { name: 'Efficiency Master', description: 'Resolve a request in under 24 hours', icon: '⚡' },
      { name: 'Team Builder', description: 'Connect with 5+ contractors', icon: '👥' }
    ],
    Tenant: [
      { name: 'Clear Communicator', description: 'Submit a detailed maintenance request with photos', icon: '📸' },
      { name: 'Quick Responder', description: 'Respond to all messages within 2 hours', icon: '⏱️' },
      { name: 'Model Tenant', description: 'Receive 5-star rating from your landlord', icon: '⭐' }
    ],
    Contractor: [
      { name: 'Speed Demon', description: 'Accept and complete a job in the same day', icon: '🔥' },
      { name: 'Top Provider', description: 'Maintain a 4.8+ rating for 10 jobs', icon: '🏆' },
      { name: 'Maintenance Guru', description: 'Complete jobs in 5 different categories', icon: '🧰' }
    ]
  };

  return (
    <section className="py-16 md:py-24 bg-white dark:bg-propagentic-neutral-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-propagentic-neutral-dark dark:text-white mb-4">
            Quick & Easy Setup
          </h2>
          <p className="text-xl text-propagentic-neutral-dark dark:text-propagentic-neutral-light max-w-3xl mx-auto">
            Your journey with Propagentic is simple and straightforward. Get up and running in minutes.
          </p>
        </div>
        
        {/* Role Selector Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex rounded-md shadow-sm overflow-hidden">
            {['Landlord', 'Tenant', 'Contractor'].map((role) => (
              <button
                key={role}
                onClick={() => setSelectedRole(role)}
                className={`px-5 py-2.5 font-medium ${
                  selectedRole === role
                    ? 'bg-propagentic-teal text-white'
                    : 'bg-propagentic-neutral text-propagentic-neutral-dark hover:bg-propagentic-neutral-light'
                } focus:z-10 focus:outline-none transition-colors duration-200`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
          {/* Onboarding Steps */}
          <div>
            <div className="bg-white dark:bg-propagentic-neutral rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-propagentic-neutral-dark dark:text-white mb-6">
                {selectedRole} Onboarding
              </h3>
              
              <div className="mt-8 relative">
                {/* Progress bar */}
                <div className="absolute left-7 top-0 bottom-6 w-1 bg-propagentic-neutral dark:bg-propagentic-neutral-dark"></div>
                
                {/* Steps */}
                <div className="space-y-8">
                  {onboardingSteps[selectedRole].map((step, index) => (
                    <div key={step.id} className="flex items-start">
                      <div className="relative flex items-center justify-center">
                        <div className={`h-14 w-14 rounded-full flex items-center justify-center z-10 ${
                          step.completed 
                            ? 'bg-propagentic-teal text-white' 
                            : 'bg-white dark:bg-propagentic-neutral border-2 border-propagentic-neutral dark:border-propagentic-neutral-dark text-propagentic-neutral-dark'
                        }`}>
                          {step.completed ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : (
                            <span className="text-lg font-bold">{step.id}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-6 pt-3">
                        <h4 className={`text-lg font-semibold ${
                          step.completed ? 'text-propagentic-teal' : 'text-propagentic-neutral-dark dark:text-white'
                        }`}>
                          {step.name}
                        </h4>
                        <p className="mt-1 text-propagentic-neutral-dark dark:text-propagentic-neutral-light">
                          {step.completed ? 'Completed' : 'Coming up next'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="mt-6 text-center">
              <Link 
                to={`/signup?role=${selectedRole.toLowerCase()}`}
                className="inline-flex items-center px-6 py-3 bg-propagentic-teal text-white rounded-lg font-medium hover:bg-propagentic-teal-dark transition-colors duration-200"
              >
                Start {selectedRole} Onboarding
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </div>
          </div>
          
          {/* Achievements */}
          <div>
            <div className="bg-white dark:bg-propagentic-neutral rounded-xl shadow-lg p-8">
              <h3 className="text-2xl font-bold text-propagentic-neutral-dark dark:text-white mb-6">
                Unlock Achievements
              </h3>
              <p className="text-propagentic-neutral-dark dark:text-propagentic-neutral-light mb-8">
                Earn badges and rewards as you use Propagentic. Show off your expertise and gain recognition.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {roleBadges[selectedRole].map((badge, index) => (
                  <div key={index} className="bg-propagentic-neutral-light dark:bg-propagentic-neutral-dark rounded-lg p-4 flex items-center">
                    <div className="h-12 w-12 rounded-full bg-white dark:bg-propagentic-neutral flex items-center justify-center text-2xl">
                      {badge.icon}
                    </div>
                    <div className="ml-4">
                      <h4 className="font-semibold text-propagentic-neutral-dark dark:text-white">{badge.name}</h4>
                      <p className="text-sm text-propagentic-neutral-dark dark:text-propagentic-neutral-light">{badge.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 bg-propagentic-teal-light/20 rounded-lg p-4 border-l-4 border-propagentic-teal">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-propagentic-teal" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-propagentic-teal">
                      <span className="font-bold">Pro Tip:</span> Complete your profile to unlock your first achievement.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* First 5 Properties Free Banner */}
        <div className="mt-16 bg-gradient-to-r from-propagentic-teal to-propagentic-teal-light rounded-xl p-8 shadow-lg">
          <div className="text-center">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              First 5 Properties Managed for Free
            </h3>
            <p className="text-white text-lg mb-6 max-w-3xl mx-auto">
              Start with our free tier and upgrade only when you need to. No credit card required to get started.
            </p>
            <Link 
              to="/signup" 
              className="inline-block bg-white text-propagentic-teal-dark px-8 py-3 rounded-lg font-medium hover:bg-propagentic-neutral-light transform hover:-translate-y-0.5 transition duration-150 text-center"
            >
              Start Free Trial
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnboardingSection; 