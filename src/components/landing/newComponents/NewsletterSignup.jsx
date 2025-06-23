import React, { useState } from 'react';
import { SafeMotion } from "../../shared/SafeMotion";

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      // Reset after 5 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setEmail('');
      }, 5000);
    }, 1500);
  };

  return (
    <div className="max-w-3xl mx-auto text-center">
      <h3 className="text-2xl font-bold text-propagentic-slate-dark dark:text-propagentic-neutral-lightest mb-4">
        Stay updated with Propagentic
      </h3>
      <p className="text-propagentic-slate dark:text-propagentic-neutral-light mb-6">
        Get the latest news, product updates, and property management tips delivered to your inbox.
      </p>
      
      {isSubmitted ? (
        <SafeMotion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-propagentic-success bg-opacity-10 text-propagentic-success dark:text-propagentic-success px-4 py-3 rounded-lg mb-6"
        >
          Thank you for subscribing! We'll keep you updated.
        </SafeMotion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center mb-2">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`flex-grow px-4 py-3 rounded-lg border focus:outline-none focus:ring-2 focus:ring-propagentic-teal focus:border-transparent transition-colors duration-200 ${
              error 
              ? 'border-propagentic-error' 
              : 'border-propagentic-neutral dark:border-propagentic-neutral-dark'
            } bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark text-propagentic-slate-dark dark:text-propagentic-neutral-lightest placeholder-propagentic-neutral-medium`}
            disabled={isSubmitting}
          />
          <SafeMotion.button
            type="submit"
            className="bg-propagentic-teal text-propagentic-neutral-lightest px-6 py-3 rounded-lg font-medium hover:bg-propagentic-teal-dark transition duration-200 disabled:opacity-70 focus:outline-none focus:ring-2 focus:ring-propagentic-teal focus:ring-offset-2 dark:focus:ring-offset-propagentic-slate-dark"
            disabled={isSubmitting}
            whileTap={{ scale: 0.98 }}
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-propagentic-neutral-lightest" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Subscribing...
              </span>
            ) : (
              'Subscribe'
            )}
          </SafeMotion.button>
        </form>
      )}
      
      {error && (
        <SafeMotion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-propagentic-error mt-1 text-left sm:text-center"
        >
          {error}
        </SafeMotion.p>
      )}
      
      <p className="text-sm text-propagentic-neutral-medium mt-3">
        We respect your privacy. Unsubscribe at any time.
      </p>
    </div>
  );
};

export default NewsletterSignup; 