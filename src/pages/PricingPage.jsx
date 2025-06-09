import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/solid';
import FooterSection from '../components/landing/FooterSection';
import Button from '../components/ui/Button';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

const PricingPage = () => {
  const location = useLocation();
  const [billingCycle, setBillingCycle] = useState('monthly');
  const [audienceTab, setAudienceTab] = useState('landlords');
  const [calculatorValues, setCalculatorValues] = useState({
    units: 25,
    requests: 10,
  });
  const [showContactForm, setShowContactForm] = useState(false);
  const [showDemoForm, setShowDemoForm] = useState(false);
  
  // Check for state parameters from redirects
  useEffect(() => {
    if (location.state?.openContactForm) {
      setShowContactForm(true);
    }
    if (location.state?.openDemoForm) {
      setShowDemoForm(true);
    }
  }, [location.state]);
  
  // Calculate annual discount (save 20%)
  const getAnnualPrice = (monthlyPrice) => {
    return (monthlyPrice * 12 * 0.8).toFixed(0);
  };

  // Calculate estimated savings
  const calculateSavings = () => {
    const { units, requests } = calculatorValues;
    const timePerRequest = 1.5; // hours
    const hourlyRate = 35; // dollars
    
    const monthlyRequests = requests * units / 12;
    const timeSaved = monthlyRequests * timePerRequest;
    const moneySaved = timeSaved * hourlyRate;
    
    return {
      timeSaved: timeSaved.toFixed(1),
      moneySaved: moneySaved.toFixed(0)
    };
  };

  const savings = calculateSavings();

  // TODO: Integrate contact/demo form submission logic
  const handleContactSubmit = (e) => { e.preventDefault(); alert('Contact form submitted!'); setShowContactForm(false); };
  const handleDemoSubmit = (e) => { e.preventDefault(); alert('Demo request submitted!'); setShowDemoForm(false); };

  const plans = [
    // Define plans using theme colors
  ];

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <div className="py-16 md:py-24 bg-background-subtle dark:bg-background-darkSubtle">
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-content dark:text-content-dark mb-4">
              Simple, Transparent Pricing
            </h1>
          <p className="text-xl text-content-secondary dark:text-content-darkSecondary max-w-3xl mx-auto mb-10">
            Choose the plan that fits your needs. Upgrade, downgrade, or cancel anytime.
          </p>
          
          {/* Billing Cycle Toggle - Use theme colors */}
          <div className="inline-flex max-w-lg mx-auto mb-12 bg-neutral-100 dark:bg-neutral-800 rounded-full shadow-md p-1.5 border border-border dark:border-border-dark">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`w-1/2 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                billingCycle === 'monthly'
                  ? 'bg-background dark:bg-background-dark text-primary shadow'
                  : 'text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annually')}
              className={`w-1/2 px-6 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
                billingCycle === 'annually'
                  ? 'bg-background dark:bg-background-dark text-primary shadow'
                  : 'text-content-secondary dark:text-content-darkSecondary hover:bg-neutral-200 dark:hover:bg-neutral-700'
              }`}
            >
              Annual Billing (Save 20%)
            </button>
        </div>

          {/* Pricing Tiers - TODO: Refactor with actual plans and theme colors */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Placeholder Plan Cards - Need actual content and styling */}
            <div className="border border-border dark:border-border-dark rounded-lg p-6 bg-background dark:bg-background-darkSubtle shadow-lg">
              <h3 className="text-lg font-semibold mb-2 text-content dark:text-content-dark">Basic</h3>
              <p className="text-3xl font-bold mb-4 text-content dark:text-content-dark">$19 <span className="text-sm font-normal text-content-secondary dark:text-content-darkSecondary">/mo</span></p>
              <ul className="space-y-2 text-left mb-6 text-content-secondary dark:text-content-darkSecondary">
                <li className="flex items-center"><CheckIcon className="w-5 h-5 text-success mr-2"/> Feature 1</li>
                <li className="flex items-center"><CheckIcon className="w-5 h-5 text-success mr-2"/> Feature 2</li>
                </ul>
              <Button variant="outline" fullWidth>Choose Plan</Button>
            </div>
            <div className="border-2 border-primary rounded-lg p-6 bg-background dark:bg-background-darkSubtle shadow-2xl relative">
              <span className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-white px-3 py-1 rounded-full text-xs font-semibold">Most Popular</span>
              <h3 className="text-lg font-semibold mb-2 text-primary dark:text-primary-light">Pro</h3>
              <p className="text-3xl font-bold mb-4 text-content dark:text-content-dark">$49 <span className="text-sm font-normal text-content-secondary dark:text-content-darkSecondary">/mo</span></p>
              <ul className="space-y-2 text-left mb-6 text-content-secondary dark:text-content-darkSecondary">
                <li className="flex items-center"><CheckIcon className="w-5 h-5 text-success mr-2"/> Feature 1</li>
                <li className="flex items-center"><CheckIcon className="w-5 h-5 text-success mr-2"/> Feature 2</li>
                <li className="flex items-center"><CheckIcon className="w-5 h-5 text-success mr-2"/> Feature 3</li>
                </ul>
              <Button variant="primary" fullWidth>Choose Plan</Button>
            </div>
            <div className="border border-border dark:border-border-dark rounded-lg p-6 bg-background dark:bg-background-darkSubtle shadow-lg">
              <h3 className="text-lg font-semibold mb-2 text-content dark:text-content-dark">Enterprise</h3>
              <p className="text-xl font-bold mb-4 text-content dark:text-content-dark">Custom</p>
              <ul className="space-y-2 text-left mb-6 text-content-secondary dark:text-content-darkSecondary">
                <li className="flex items-center"><CheckIcon className="w-5 h-5 text-success mr-2"/> All Pro Features</li>
                <li className="flex items-center"><CheckIcon className="w-5 h-5 text-success mr-2"/> Dedicated Support</li>
                <li className="flex items-center"><CheckIcon className="w-5 h-5 text-success mr-2"/> Custom Integrations</li>
                </ul>
              <Button variant="outline" fullWidth onClick={() => setShowContactForm(true)}>Contact Sales</Button>
            </div>
          </div>
        </div>
      </div>

      {/* Contact Sales Modal Placeholder - Need theme */}
      {showContactForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-background dark:bg-background-darkSubtle rounded-xl shadow-xl max-w-md w-full p-6 border border-border dark:border-border-dark relative">
            <Button variant="ghost" size="sm" onClick={() => setShowContactForm(false)} className="!absolute top-2 right-2 !p-1" icon={<XMarkIcon className="w-5 h-5"/>} aria-label="Close"/>
            <h3 className="text-xl font-bold text-content dark:text-content-dark mb-4">Contact Sales</h3>
            <form onSubmit={handleContactSubmit} className="space-y-4">
              {/* Form Fields - Need Theme Styling */} 
              {/* ... Name, Email, Company, Message ... */}
              <Button type="submit" variant="primary" fullWidth>Send Message</Button>
            </form>
          </div>
        </div>
      )}

      {/* Request Demo Modal Placeholder - Need theme */}
      {showDemoForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
           <div className="bg-background dark:bg-background-darkSubtle rounded-xl shadow-xl max-w-md w-full p-6 border border-border dark:border-border-dark relative">
              <Button variant="ghost" size="sm" onClick={() => setShowDemoForm(false)} className="!absolute top-2 right-2 !p-1" icon={<XMarkIcon className="w-5 h-5"/>} aria-label="Close"/>
              <h3 className="text-xl font-bold text-content dark:text-content-dark mb-4">Schedule a Demo</h3>
              <form onSubmit={handleDemoSubmit} className="space-y-4">
                {/* Form Fields - Need Theme Styling */}
                {/* ... Name, Email, Company, Role, Date/Time ... */}
                 <Button type="submit" variant="primary" fullWidth>Request Demo</Button>
             </form>
          </div>
        </div>
      )}

      <FooterSection />
    </div>
  );
};

export default PricingPage; 