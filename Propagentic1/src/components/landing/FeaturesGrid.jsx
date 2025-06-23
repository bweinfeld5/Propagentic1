import React from 'react';
import { 
  DocumentTextIcon, 
  ChatBubbleLeftRightIcon, 
  ChartBarIcon,
  BriefcaseIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';

const FeatureCard = ({ icon, title, description }) => {
  // Making text more visible with stronger contrasting colors
  return (
    <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6 transition-all duration-300 hover:shadow-xl hover:translate-y-[-4px] border border-gray-100 dark:border-gray-600">
      <div className="flex items-center justify-center w-12 h-12 mb-4 rounded-full bg-orange-100 dark:bg-orange-900/30">
        {icon}
      </div>
      <h3 className="text-lg md:text-xl font-semibold mb-3 text-gray-900 dark:text-white">
        {title}
      </h3>
      <p className="text-base text-gray-600 dark:text-gray-300">
        {description}
      </p>
    </div>
  );
};

const FeaturesGrid = () => {
  const features = [
    {
      icon: <DocumentTextIcon className="w-6 h-6 text-orange-500" />,
      title: "AI Request Classification",
      description: "Automatically categorize maintenance requests and prioritize based on urgency and type."
    },
    {
      icon: <ChatBubbleLeftRightIcon className="w-6 h-6 text-orange-500" />,
      title: "Seamless Communication",
      description: "Connect landlords, tenants, and contractors in a unified platform with real-time updates."
    },
    {
      icon: <ChartBarIcon className="w-6 h-6 text-orange-500" />,
      title: "Real-time Tracking",
      description: "Track maintenance requests from submission to completion with transparent status updates."
    },
    {
      icon: <ClipboardDocumentCheckIcon className="w-6 h-6 text-orange-500" />,
      title: "Property Performance Analytics",
      description: "Gain insights into property maintenance costs, frequency, and contractor performance."
    },
    {
      icon: <BriefcaseIcon className="w-6 h-6 text-orange-500" />,
      title: "Mobile Optimized",
      description: "Access the platform from anywhere with our responsive mobile design and native apps."
    },
    {
      icon: <UserGroupIcon className="w-6 h-6 text-orange-500" />,
      title: "Smart Document Management",
      description: "Centralize all property documents, contracts, and receipts for easy access and reference."
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <FeatureCard key={index} {...feature} />
      ))}
    </div>
  );
};

export default FeaturesGrid; 