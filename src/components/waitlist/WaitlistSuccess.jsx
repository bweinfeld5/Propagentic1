import React from 'react';
import { motion } from 'framer-motion';

const WaitlistSuccess = ({ userProfile, onContinue }) => {
  const nextSteps = [
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Check Your Email",
      description: "We've sent you a welcome email with next steps and early access details."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM4 19h8a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      title: "Complete Your Profile",
      description: "Finish setting up your account to be ready for launch day."
    },
    {
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      title: "Get Early Access",
      description: "You'll be notified as soon as early access opens up."
    }
  ];

  const benefits = [
    "✨ 30% off your first year subscription",
    "🚀 Priority access to beta features", 
    "📞 Direct line to our founding team",
    "🎯 Influence product development"
  ];

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl mx-auto text-center">
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
      >
        <motion.svg
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-10 h-10 text-green-600"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <motion.path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            d="M5 13l4 4L19 7"
          />
        </motion.svg>
      </motion.div>

      {/* Success Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          🎉 Welcome to PropAgentic!
        </h2>
        <p className="text-lg text-gray-600 mb-8">
          You're now on the waitlist and will be among the first to experience 
          the future of property management.
        </p>
      </motion.div>

      {/* Benefits */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="bg-gradient-to-r from-orange-50 to-red-50 rounded-xl p-6 mb-8"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-4">
          Your Early Access Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center text-gray-700">
              <span className="mr-2">{benefit}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Next Steps */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="mb-8"
      >
        <h3 className="text-xl font-bold text-gray-900 mb-6">What's Next?</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {nextSteps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 + index * 0.1 }}
              className="text-center"
            >
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center mx-auto mb-3">
                {step.icon}
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">{step.title}</h4>
              <p className="text-sm text-gray-600">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.8 }}
        className="flex flex-col sm:flex-row gap-4 justify-center"
      >
        {userProfile?.onboardingComplete ? (
          <button
            onClick={onContinue}
            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
          >
            Continue to Dashboard
          </button>
        ) : (
          <button
            onClick={onContinue}
            className="bg-gradient-to-r from-orange-600 to-red-600 text-white px-8 py-3 rounded-lg font-semibold hover:from-orange-700 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
          >
            Complete Profile Setup
          </button>
        )}
        
        <button
          onClick={() => {
            const shareUrl = `${window.location.origin}?ref=${userProfile?.uid || 'waitlist'}`;
            const shareText = "I just joined the PropAgentic waitlist! Join me and get early access to the future of property management.";
            
            if (navigator.share) {
              navigator.share({
                title: 'PropAgentic - Join the Waitlist',
                text: shareText,
                url: shareUrl
              });
            } else {
              // Fallback: copy to clipboard
              navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
              alert('Share link copied to clipboard!');
            }
          }}
          className="border-2 border-orange-600 text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-all duration-300"
        >
          Share with Friends
        </button>
      </motion.div>

      {/* Additional Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 1 }}
        className="mt-8 text-sm text-gray-500"
      >
        <p>
          Questions? Reach out to us at{' '}
          <a href="mailto:hello@propagentic.com" className="text-orange-600 hover:text-orange-700">
            hello@propagentic.com
          </a>
        </p>
        <p className="mt-2">
          Follow us on{' '}
          <a href="#" className="text-orange-600 hover:text-orange-700">Twitter</a>
          {' '}and{' '}
          <a href="#" className="text-orange-600 hover:text-orange-700">LinkedIn</a>
          {' '}for the latest updates.
        </p>
      </motion.div>
    </div>
  );
};

export default WaitlistSuccess; 