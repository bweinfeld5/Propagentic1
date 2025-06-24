import React from 'react';
import { motion } from 'framer-motion';
import { 
  Sparkles, 
  Clock, 
  Shield, 
  Zap,
  ArrowRight 
} from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
}

export const WelcomeStep: React.FC<WelcomeStepProps> = ({ onNext }) => {
  const features = [
    {
      icon: Zap,
      title: 'Quick & Easy',
      description: 'Submit requests in under 2 minutes'
    },
    {
      icon: Shield,
      title: 'AI-Powered',
      description: 'Smart categorization for faster response'
    },
    {
      icon: Clock,
      title: '24/7 Support',
      description: 'Get help anytime, day or night'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <div className="inline-flex items-center justify-center w-20 h-20 bg-orange-100 dark:bg-orange-900/20 rounded-full mb-4">
          <Sparkles className="w-10 h-10 text-orange-600 dark:text-orange-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          Let's fix that issue!
        </h3>
        <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
          Our AI-powered system will help you submit a maintenance request quickly and get the right help faster.
        </p>
      </motion.div>

      {/* Feature cards */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {features.map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + index * 0.1 }}
            className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
          >
            <feature.icon className="w-6 h-6 text-orange-600 dark:text-orange-400 mb-2" />
            <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-1">
              {feature.title}
            </h4>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {feature.description}
            </p>
          </motion.div>
        ))}
      </motion.div>

      {/* Action button */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="flex justify-center pt-4"
      >
        <button
          onClick={onNext}
          className="inline-flex items-center gap-2 px-6 py-3 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-colors shadow-lg hover:shadow-xl"
        >
          Get Started
          <ArrowRight className="w-5 h-5" />
        </button>
      </motion.div>

      {/* Quick tip */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center"
      >
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 Tip: Have photos ready to upload for faster diagnosis
        </p>
      </motion.div>
    </div>
  );
}; 