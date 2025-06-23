import React, { useState, useEffect } from 'react';
import { CheckCircle, Circle, ArrowRight, Star, Trophy, Target, Zap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
  optional: boolean;
  points: number;
  action: () => void;
  helpText?: string;
}

interface UserProgress {
  totalSteps: number;
  completedSteps: number;
  totalPoints: number;
  earnedPoints: number;
  currentLevel: number;
  achievements: string[];
}

const SmartOnboarding: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [progress, setProgress] = useState<UserProgress>({
    totalSteps: 7,
    completedSteps: 0,
    totalPoints: 350,
    earnedPoints: 0,
    currentLevel: 1,
    achievements: []
  });

  const onboardingSteps: OnboardingStep[] = [
    {
      id: 'profile_complete',
      title: 'Complete Your Profile',
      description: 'Add your contact information and preferences',
      icon: <Target className="w-6 h-6" />,
      completed: false,
      optional: false,
      points: 50,
      action: () => navigateToProfile(),
      helpText: 'This helps us provide better service and communication'
    },
    {
      id: 'property_added',
      title: 'Connect to Your Property',
      description: 'Use your invite code to join your property',
      icon: <Circle className="w-6 h-6" />,
      completed: false,
      optional: false,
      points: 75,
      action: () => navigateToPropertySetup(),
      helpText: 'Your landlord should have provided an 8-character invite code'
    },
    {
      id: 'first_request',
      title: 'Submit Your First Request',
      description: 'Try the maintenance request system',
      icon: <Zap className="w-6 h-6" />,
      completed: false,
      optional: false,
      points: 50,
      action: () => navigateToNewRequest(),
      helpText: 'Even a test request helps you learn the system'
    },
    {
      id: 'notification_setup',
      title: 'Set Up Notifications',
      description: 'Choose how you want to be notified about updates',
      icon: <Circle className="w-6 h-6" />,
      completed: false,
      optional: true,
      points: 25,
      action: () => navigateToNotifications(),
      helpText: 'Stay informed about your request status'
    },
    {
      id: 'mobile_app',
      title: 'Install Mobile App',
      description: 'Add PropAgentic to your home screen',
      icon: <Circle className="w-6 h-6" />,
      completed: false,
      optional: true,
      points: 25,
      action: () => showMobileInstallGuide(),
      helpText: 'Access your property dashboard on the go'
    },
    {
      id: 'explore_features',
      title: 'Explore Features',
      description: 'Take a quick tour of the dashboard',
      icon: <Star className="w-6 h-6" />,
      completed: false,
      optional: true,
      points: 25,
      action: () => startFeatureTour(),
      helpText: 'Discover everything PropAgentic can do for you'
    },
    {
      id: 'feedback',
      title: 'Share Feedback',
      description: 'Help us improve your experience',
      icon: <Trophy className="w-6 h-6" />,
      completed: false,
      optional: true,
      points: 100,
      action: () => navigateToFeedback(),
      helpText: 'Your input shapes future features'
    }
  ];

  // Navigation functions
  const navigateToProfile = () => {
    window.location.href = '/profile';
  };

  const navigateToPropertySetup = () => {
    window.location.href = '/property/setup';
  };

  const navigateToNewRequest = () => {
    window.location.href = '/maintenance/new';
  };

  const navigateToNotifications = () => {
    window.location.href = '/settings/notifications';
  };

  const showMobileInstallGuide = () => {
    // Show PWA install prompt
    alert('Mobile install guide would appear here');
  };

  const startFeatureTour = () => {
    // Start interactive tour
    alert('Feature tour would start here');
  };

  const navigateToFeedback = () => {
    window.location.href = '/feedback';
  };

  // Calculate progress
  useEffect(() => {
    const completedSteps = onboardingSteps.filter(step => step.completed).length;
    const earnedPoints = onboardingSteps
      .filter(step => step.completed)
      .reduce((sum, step) => sum + step.points, 0);
    
    const newLevel = Math.floor(earnedPoints / 100) + 1;
    
    setProgress(prev => ({
      ...prev,
      completedSteps,
      earnedPoints,
      currentLevel: newLevel
    }));
  }, [onboardingSteps]);

  const completionPercentage = (progress.completedSteps / progress.totalSteps) * 100;
  const pointsPercentage = (progress.earnedPoints / progress.totalPoints) * 100;

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Welcome to PropAgentic!</h1>
            <p className="text-orange-100">Let's get you set up for success</p>
          </div>
          <div className="text-right">
            <div className="flex items-center space-x-2 mb-2">
              <Trophy className="w-5 h-5" />
              <span className="font-bold">Level {progress.currentLevel}</span>
            </div>
            <p className="text-sm text-orange-100">
              {progress.earnedPoints}/{progress.totalPoints} points
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>{progress.completedSteps} of {progress.totalSteps} steps completed</span>
            <span>{Math.round(completionPercentage)}%</span>
          </div>
          <div className="w-full bg-orange-400/30 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Onboarding Steps */}
      <div className="grid gap-4 md:grid-cols-2">
        {onboardingSteps.map((step, index) => (
          <div
            key={step.id}
            className={`p-6 rounded-xl border-2 transition-all cursor-pointer ${
              step.completed
                ? 'border-green-200 bg-green-50 hover:bg-green-100'
                : step.optional
                ? 'border-blue-200 bg-blue-50 hover:bg-blue-100'
                : 'border-orange-200 bg-orange-50 hover:bg-orange-100'
            }`}
            onClick={step.action}
          >
            <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${
                step.completed 
                  ? 'bg-green-100 text-green-600'
                  : step.optional
                  ? 'bg-blue-100 text-blue-600'
                  : 'bg-orange-100 text-orange-600'
              }`}>
                {step.completed ? <CheckCircle className="w-6 h-6" /> : step.icon}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{step.title}</h3>
                  <div className="flex items-center space-x-2">
                    {step.optional && (
                      <span className="text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">
                        Optional
                      </span>
                    )}
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      +{step.points} pts
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-600 text-sm mb-3">{step.description}</p>
                
                {step.helpText && (
                  <p className="text-xs text-gray-500 bg-gray-100 p-2 rounded">
                    💡 {step.helpText}
                  </p>
                )}
                
                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-gray-500">
                    Step {index + 1} of {onboardingSteps.length}
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Badges */}
      {progress.earnedPoints > 0 && (
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-white">
          <h3 className="font-semibold mb-4 flex items-center">
            <Trophy className="w-5 h-5 mr-2" />
            Your Achievements
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                <Star className="w-6 h-6" />
              </div>
              <p className="text-sm font-medium">Getting Started</p>
              <p className="text-xs text-purple-100">First steps completed</p>
            </div>
            
            {progress.earnedPoints >= 100 && (
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Zap className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">Active User</p>
                <p className="text-xs text-purple-100">100+ points earned</p>
              </div>
            )}
            
            {progress.completedSteps >= 5 && (
              <div className="text-center">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Target className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium">Power User</p>
                <p className="text-xs text-purple-100">5+ steps completed</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-8 text-center">
        <p className="text-gray-600 mb-4">Need help getting started?</p>
        <div className="flex justify-center space-x-4">
          <button className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
            📞 Contact Support
          </button>
          <button className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors">
            📖 View Guide
          </button>
          <button className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
            🎥 Watch Tutorial
          </button>
        </div>
      </div>
    </div>
  );
};

export default SmartOnboarding; 