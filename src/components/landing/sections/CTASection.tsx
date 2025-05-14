import React, { useState } from 'react';
import { SafeMotion } from '../../shared/SafeMotion';
import { UIComponentErrorBoundary } from '../../shared/ErrorBoundary';
import AnimatedBlueprintBackground from '../../branding/AnimatedBlueprintBackground';

interface CTASectionProps {
  // Optional props for customization
  title?: string;
  subtitle?: string;
  buttonText?: string;
  backgroundImageUrl?: string;
}

/**
 * Call-to-Action section with lead capture form
 */
const CTASection: React.FC<CTASectionProps> = ({
  title = "Ready to transform your property management?",
  subtitle = "Get started with Propagentic today and see the difference our platform can make for your business.",
  buttonText = "Start Free Trial",
  backgroundImageUrl = "/images/cta-background.jpg"
}) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [company, setCompany] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Simple validation
    if (!email || !name) {
      setError('Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }

    try {
      // In a real implementation, this would send data to a backend API
      // For now, we'll simulate success after a brief delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Success scenario
      setIsSubmitted(true);
      setEmail('');
      setName('');
      setCompany('');
    } catch (err) {
      setError('There was a problem submitting the form. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <UIComponentErrorBoundary componentName="CTASection">
      <section 
        className="py-16 md:py-24 relative overflow-hidden bg-gradient-to-br from-primary to-primary-dark"
        style={{
          backgroundImage: `url(${backgroundImageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundBlendMode: 'overlay'
        }}
      >
        {/* Blueprint Background - positioned with absolute */}
        <div className="absolute inset-0 z-1 overflow-hidden">
          <AnimatedBlueprintBackground density="dense" section="cta" useInlineSvg={true} />
        </div>
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-primary/80 dark:bg-primary-dark/90"></div>
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <SafeMotion.div 
              className="text-center mb-10 md:mb-16"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
                {title}
              </h2>
              <p className="text-xl text-white/90 max-w-3xl mx-auto">
                {subtitle}
              </p>
            </SafeMotion.div>

            <SafeMotion.div
              className="bg-white dark:bg-neutral-800 rounded-xl shadow-xl p-8 md:p-10"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.2 }}
            >
              {!isSubmitted ? (
                <>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-6 text-center">
                    Start your 14-day free trial
                  </h3>
                  
                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-500 rounded-lg">
                      {error}
                    </div>
                  )}
                  
                  <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                      <div>
                        <label htmlFor="name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-neutral-700 dark:text-white"
                          placeholder="John Smith"
                          required
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                          Work Email <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="email"
                          id="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-neutral-700 dark:text-white"
                          placeholder="you@company.com"
                          required
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label htmlFor="company" className="block text-sm font-medium text-neutral-700 dark:text-neutral-200 mb-2">
                          Company Name
                        </label>
                        <input
                          type="text"
                          id="company"
                          value={company}
                          onChange={(e) => setCompany(e.target.value)}
                          className="w-full px-4 py-3 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary dark:bg-neutral-700 dark:text-white"
                          placeholder="Your company"
                        />
                      </div>
                    </div>

                    <div className="flex flex-col items-center">
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`w-full md:w-auto px-8 py-3 bg-primary hover:bg-primary-dark text-white font-medium rounded-lg transition-colors flex items-center justify-center ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                      >
                        {isSubmitting ? (
                          <>
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing
                          </>
                        ) : buttonText}
                      </button>
                      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-4">
                        No credit card required. By signing up, you agree to our 
                        <a href="/terms" className="text-primary hover:underline ml-1">
                          Terms of Service
                        </a> and 
                        <a href="/privacy" className="text-primary hover:underline ml-1">
                          Privacy Policy
                        </a>.
                      </p>
                    </div>
                  </form>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-neutral-900 dark:text-white mb-4">
                    Thank you for your interest!
                  </h3>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-8">
                    We've sent an email with instructions to get started with your free trial.
                  </p>
                  <button
                    onClick={() => setIsSubmitted(false)}
                    className="text-primary hover:text-primary-dark transition-colors"
                  >
                    Submit another request
                  </button>
                </div>
              )}
            </SafeMotion.div>

            <div className="mt-12 flex flex-wrap justify-center items-center gap-8 text-white/80">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>No credit card required</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </UIComponentErrorBoundary>
  );
};

export default CTASection; 