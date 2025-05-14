import React from 'react';
import { Link } from 'react-router-dom';

const PricingTier = ({ title, price, description, features, highlighted = false, ctaText }) => {
  return (
    <div className={`rounded-xl shadow-lg p-8 h-full flex flex-col ${highlighted ? 'bg-propagentic-teal-light dark:bg-propagentic-teal border-propagentic-teal' : 'bg-white dark:bg-propagentic-slate border-transparent'}`}>
      <div className="mb-6">
        <h3 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-propagentic-slate-dark dark:text-white' : 'text-propagentic-slate-dark dark:text-white'}`}>
          {title}
        </h3>
        <div className="flex items-end mb-4">
          <span className={`text-4xl font-bold ${highlighted ? 'text-propagentic-slate-dark dark:text-white' : 'text-propagentic-slate-dark dark:text-white'}`}>
            ${price}
          </span>
          <span className={`ml-2 ${highlighted ? 'text-propagentic-slate-dark dark:text-propagentic-neutral-light' : 'text-propagentic-slate dark:text-propagentic-neutral-light'}`}>
            /month
          </span>
        </div>
        <p className={`${highlighted ? 'text-propagentic-slate-dark dark:text-white' : 'text-propagentic-slate dark:text-propagentic-neutral-light'}`}>
          {description}
        </p>
      </div>
      
      <div className="mt-auto">
        <ul className="space-y-3 mb-8">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <div className={`rounded-full p-1 mr-3 mt-0.5 ${highlighted ? 'bg-white text-propagentic-teal' : 'bg-propagentic-teal-light dark:bg-propagentic-teal text-white'}`}>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span className={`${highlighted ? 'text-propagentic-slate-dark dark:text-white' : 'text-propagentic-slate dark:text-propagentic-neutral-light'}`}>
                {feature}
              </span>
            </li>
          ))}
        </ul>
        
        <Link 
          to="/signup" 
          className={`w-full py-3 rounded-lg font-medium transition-all duration-150 flex items-center justify-center ${
            highlighted 
              ? 'bg-white text-propagentic-teal hover:bg-propagentic-neutral hover:-translate-y-0.5 transform' 
              : 'bg-propagentic-teal text-white hover:bg-propagentic-teal-dark hover:-translate-y-0.5 transform'
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
    <section className="py-16 md:py-24 bg-propagentic-neutral-light dark:bg-propagentic-slate-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-propagentic-slate-dark dark:text-white mb-4">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-propagentic-slate dark:text-propagentic-neutral-light max-w-3xl mx-auto">
            Choose the plan that works best for your property management needs
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
          <p className="text-propagentic-slate dark:text-propagentic-neutral-light">
            All plans include a 14-day free trial. No credit card required.
          </p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection; 