import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

const PricingTier = ({ title, price, description, features, highlighted = false, ctaText }) => {
  return (
    <div 
      className={`rounded-2xl shadow-lg p-6 h-full flex flex-col transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl
        ${highlighted 
          ? 'bg-gradient-to-b from-orange-50 to-white dark:from-gray-800 dark:to-gray-900 border-2 border-orange-500 relative overflow-hidden' 
          : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700'}`}
    >
      {highlighted && (
        <div className="absolute -right-12 top-8 bg-orange-500 text-white px-12 py-1 transform rotate-45 text-sm font-medium">
          Popular
        </div>
      )}
      
      <div className="mb-6">
        <h3 className={`text-xl font-bold mb-4 ${highlighted ? 'text-orange-600 dark:text-orange-400' : 'text-gray-900 dark:text-white'}`}>
          {title}
        </h3>
        <div className="flex items-baseline mb-4">
          <span className="text-4xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            ${price}
          </span>
          <span className="ml-2 text-gray-500 dark:text-gray-400 font-medium">
            /month
          </span>
        </div>
        <p className="text-gray-600 dark:text-gray-300 text-sm border-b border-gray-100 dark:border-gray-700 pb-6">
          {description}
        </p>
      </div>
      
      <div className="mt-auto">
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckCircleIcon className={`h-5 w-5 mr-2 flex-shrink-0 ${highlighted ? 'text-orange-500' : 'text-gray-400'}`} />
              <span className="text-gray-600 dark:text-gray-300 text-sm">
                {feature}
              </span>
            </li>
          ))}
        </ul>
        
        <Link 
          to="/signup" 
          className={`w-full py-3 rounded-lg font-medium transition-all duration-200 flex items-center justify-center ${
            highlighted 
              ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg hover:from-orange-600 hover:to-orange-700' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-600'
          }`}
        >
          {ctaText}
        </Link>
      </div>
    </div>
  );
};

const PricingSection = () => {
  const pricingTiers = [
    {
      title: 'Starter',
      price: '29',
      description: 'Perfect for individual landlords managing a few properties',
      features: [
        'Up to 5 properties',
        'Tenant maintenance request portal', 
        'Basic AI categorization', 
        'Email notifications', 
        'Contractor directory'
      ],
      ctaText: 'Start Free Trial'
    },
    {
      title: 'Pro',
      price: '79',
      description: 'Ideal for property managers with multiple units',
      features: [
        'Up to 20 properties', 
        'Advanced AI request analysis', 
        'Smart contractor matching', 
        'Real-time status tracking', 
        'Payment processing',
        'Tenant & contractor mobile apps'
      ],
      highlighted: true,
      ctaText: 'Get Pro Account'
    },
    {
      title: 'Enterprise',
      price: '199',
      description: 'For large property management firms and portfolios',
      features: [
        'Unlimited properties', 
        'Custom AI model training', 
        'Advanced analytics dashboard', 
        'White-label tenant portal', 
        'API access',
        'Dedicated account manager',
        'Custom integrations'
      ],
      ctaText: 'Contact Sales'
    }
  ];
  
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-6">
        <div className="text-center mb-12">
          <div className="inline-block bg-orange-100 dark:bg-orange-900/30 rounded-full px-4 py-1 text-orange-600 dark:text-orange-400 text-sm font-medium mb-3">
            Transparent Pricing
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            Choose Your Perfect Plan
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            Select the plan that works best for your property management needs
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <PricingTier 
              key={index}
              title={tier.title}
              price={tier.price}
              description={tier.description}
              features={tier.features}
              highlighted={tier.highlighted}
              ctaText={tier.ctaText}
            />
          ))}
        </div>
        
        <div className="mt-12 text-center">
          <div className="inline-flex items-center px-4 py-2 bg-orange-50 dark:bg-gray-800 rounded-full">
            <svg className="h-5 w-5 text-orange-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
              All plans include a 14-day free trial. No credit card required.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 