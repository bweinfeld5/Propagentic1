import React from 'react';
import FaqAccordion from './FaqAccordion';

const faqItems = [
  {
    question: "How quickly can I start using Propagentic?",
    answer: "You can sign up and start using Propagentic in under 5 minutes. Our onboarding process guides you through property setup, and you can immediately begin handling maintenance requests."
  },
  {
    question: "How do contractors get connected to my properties?",
    answer: "You can invite your existing contractors or find new ones through our vetted network. All contractors undergo background checks and verification before joining our platform to ensure quality service."
  },
  {
    question: "Is there a fee for tenants to use the platform?",
    answer: "No, tenants use Propagentic for free. Property owners pay a simple monthly subscription based on the number of units they manage. This creates a better experience for everyone involved."
  },
  {
    question: "How does the AI determine which contractor to assign?",
    answer: "Our AI analyzes the type of maintenance issue, contractor expertise, availability, proximity to the property, and past performance ratings to find the optimal match for each specific request."
  },
  {
    question: "Can I customize communication preferences?",
    answer: "Yes, all users can set their preferred communication methods (app notifications, email, SMS) and frequency. You have complete control over how and when you receive updates."
  },
  {
    question: "What happens if there's an emergency maintenance issue?",
    answer: "Emergency issues are flagged with high priority and immediately sent to available contractors. The system also provides tenants with emergency protocol information while waiting for service."
  },
  {
    question: "How secure is my data on Propagentic?",
    answer: "We use bank-level encryption and security practices to protect all user data. We comply with industry standards for data protection and never share your information with third parties without your consent."
  }
];

const FaqSection = () => {
  return (
    <section className="py-16 md:py-24 bg-propagentic-neutral-light dark:bg-propagentic-slate-dark">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-propagentic-slate-dark dark:text-propagentic-neutral-lightest mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-propagentic-slate dark:text-propagentic-neutral-light max-w-3xl mx-auto">
            Everything you need to know about getting started with Propagentic.
          </p>
        </div>
        
        <div className="max-w-3xl mx-auto">
          <FaqAccordion questions={faqItems} />
        </div>
      </div>
    </section>
  );
};

export default FaqSection; 