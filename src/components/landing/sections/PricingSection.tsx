import React, { useState } from 'react';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import { SafeMotion } from '../../shared/SafeMotion';
import AnimatedBlueprintBackground from '../../branding/AnimatedBlueprintBackground';

interface PricingFeature {
  id: string;
  title: string;
  includedIn: ('starter' | 'professional' | 'enterprise')[];
}

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: {
    monthly: number;
    annually: number;
  };
  priceUnit: string;
  buttonText: string;
  buttonLink: string;
  isPopular?: boolean;
  features: string[];
}

interface PricingSectionProps {
  title?: string;
  subtitle?: string;
  plans?: PricingPlan[];
  features?: PricingFeature[];
  backgroundClass?: string;
}

/**
 * Pricing section component that showcases subscription options
 */
const PricingSection: React.FC<PricingSectionProps> = ({
  title = "Simple, Transparent Pricing",
  subtitle = "Choose the plan that's right for your property management business",
  plans = defaultPlans,
  features = defaultFeatures,
  backgroundClass = "bg-white dark:bg-gray-900",
}) => {
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'annually'>('monthly');

  const toggleBillingPeriod = () => {
    setBillingPeriod(billingPeriod === 'monthly' ? 'annually' : 'monthly');
  };

  const discount = 20; // Annual discount percentage

  return (
    <UIComponentErrorBoundary componentName="PricingSection">
      <section id="pricing" className={`py-24 relative overflow-hidden ${backgroundClass.replace('bg-white', 'bg-white/95').replace('dark:bg-gray-900', 'dark:bg-gray-900/95')}`}>
        {/* Blueprint Background - positioned with absolute */}
        <div className="absolute inset-0 z-1 overflow-hidden">
          <AnimatedBlueprintBackground density="normal" section="pricing" useInlineSvg={true} />
        </div>
        
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <SafeMotion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center max-w-3xl mx-auto mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
              {title}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              {subtitle}
            </p>

            <div className="mt-10 inline-flex items-center p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
              <button
                className={`py-2 px-4 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'monthly'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => setBillingPeriod('monthly')}
              >
                Monthly
              </button>
              <button
                className={`py-2 px-4 rounded-full text-sm font-medium transition-all ${
                  billingPeriod === 'annually'
                    ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
                onClick={() => setBillingPeriod('annually')}
              >
                Annually{' '}
                <span className="text-primary">Save {discount}%</span>
              </button>
            </div>
          </SafeMotion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <SafeMotion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`
                  rounded-2xl overflow-hidden shadow-lg border transform transition-all hover:scale-[1.02] hover:shadow-xl
                  ${plan.isPopular 
                    ? 'border-primary md:-mt-4 md:mb-4 relative z-10' 
                    : 'border-gray-200 dark:border-gray-700'
                  }
                `}
              >
                {plan.isPopular && (
                  <div className="absolute top-0 right-0 bg-primary text-white text-xs uppercase font-bold py-1 px-3 rounded-bl-lg">
                    Most Popular
                  </div>
                )}
                
                <div className={`p-8 ${plan.isPopular ? 'bg-white dark:bg-gray-800' : 'bg-white dark:bg-gray-800'}`}>
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {plan.name}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-6 h-12">
                    {plan.description}
                  </p>
                  
                  <div className="mb-6">
                    <div className="flex items-end">
                      <span className="text-4xl font-bold text-gray-900 dark:text-white">
                        ${billingPeriod === 'monthly' 
                          ? plan.price.monthly 
                          : plan.price.annually}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        /{plan.priceUnit}
                      </span>
                    </div>
                    {billingPeriod === 'annually' && (
                      <p className="text-primary text-sm mt-2">
                        {discount}% off with annual billing
                      </p>
                    )}
                  </div>
                  
                  <a 
                    href={plan.buttonLink} 
                    className={`
                      block text-center py-3 px-6 rounded-lg font-medium transition-colors
                      ${plan.isPopular 
                        ? 'bg-primary hover:bg-primary-dark text-white' 
                        : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white'
                      }
                    `}
                  >
                    {plan.buttonText}
                  </a>
                </div>
                
                <div className="p-8 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                  <p className="font-medium text-gray-900 dark:text-white mb-4">
                    Included features:
                  </p>
                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start">
                        <svg 
                          className="h-5 w-5 text-primary mt-0.5 mr-3 flex-shrink-0" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24" 
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth="2" 
                            d="M5 13l4 4L19 7" 
                          />
                        </svg>
                        <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </SafeMotion.div>
            ))}
          </div>

          <SafeMotion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-16 bg-gray-50 dark:bg-gray-800 rounded-xl p-8 md:p-10 text-center max-w-4xl mx-auto shadow-sm"
          >
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Need a custom solution for your enterprise?
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-2xl mx-auto">
              We offer tailored solutions for large property management companies with custom requirements. Our enterprise plans include dedicated support, custom integrations, and personalized onboarding.
            </p>
            <a
              href="#contact"
              className="inline-flex items-center bg-primary hover:bg-primary-dark text-white font-medium py-3 px-8 rounded-lg transition-colors"
            >
              Contact us for enterprise pricing
              <svg
                className="ml-2 h-5 w-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </a>
          </SafeMotion.div>
        </div>
      </section>
    </UIComponentErrorBoundary>
  );
};

const defaultPlans: PricingPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small property portfolios',
    price: {
      monthly: 49,
      annually: 39,
    },
    priceUnit: 'month',
    buttonText: 'Get started',
    buttonLink: '/signup?plan=starter',
    features: [
      'Up to 25 units',
      'Online rent collection',
      'Maintenance requests',
      'Basic reporting',
      'Tenant portal',
      'Document storage (10GB)',
      'Email support',
      'Mobile app access',
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Ideal for growing property businesses',
    price: {
      monthly: 99,
      annually: 79,
    },
    priceUnit: 'month',
    buttonText: 'Get started',
    buttonLink: '/signup?plan=professional',
    isPopular: true,
    features: [
      'Up to 100 units',
      'All Starter features',
      'Owner portal',
      'Advanced reporting',
      'Accounting integration',
      'Document storage (50GB)',
      'Email & phone support',
      'Custom branding',
      'API access',
      'Tenant screening',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'For large property management companies',
    price: {
      monthly: 199,
      annually: 159,
    },
    priceUnit: 'month',
    buttonText: 'Get started',
    buttonLink: '/signup?plan=enterprise',
    features: [
      'Unlimited units',
      'All Professional features',
      'Dedicated account manager',
      'Custom integrations',
      'White-label solution',
      'Document storage (Unlimited)',
      'Priority 24/7 support',
      'Bulk operations',
      'Advanced analytics',
      'Multiple user roles',
      'Vendor management portal',
    ],
  },
];

const defaultFeatures: PricingFeature[] = [
  {
    id: 'feature1',
    title: 'Online rent collection',
    includedIn: ['starter', 'professional', 'enterprise'],
  },
  {
    id: 'feature2',
    title: 'Maintenance management',
    includedIn: ['starter', 'professional', 'enterprise'],
  },
  {
    id: 'feature3',
    title: 'Tenant portal',
    includedIn: ['starter', 'professional', 'enterprise'],
  },
  {
    id: 'feature4',
    title: 'Owner portal',
    includedIn: ['professional', 'enterprise'],
  },
  {
    id: 'feature5',
    title: 'Accounting integration',
    includedIn: ['professional', 'enterprise'],
  },
  {
    id: 'feature6',
    title: 'API access',
    includedIn: ['professional', 'enterprise'],
  },
  {
    id: 'feature7',
    title: 'White-label solution',
    includedIn: ['enterprise'],
  },
  {
    id: 'feature8',
    title: 'Custom integrations',
    includedIn: ['enterprise'],
  },
];

export default PricingSection; 