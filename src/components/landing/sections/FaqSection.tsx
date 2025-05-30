import React, { useState } from 'react';
import { SafeMotion, AnimatePresence } from '../../shared/SafeMotion';

// FAQ Accordion Component
const FaqAccordion: React.FC<{ questions: Array<{question: string; answer: string}> }> = ({ questions }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {questions.map((faq, index) => (
        <div 
          key={index} 
          className={`border rounded-lg overflow-hidden transition-all duration-300 ${
            openIndex === index 
              ? 'border-blue-500 bg-white dark:bg-gray-800 shadow-lg' 
              : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
        >
          <button
            onClick={() => toggleFaq(index)}
            className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
            aria-expanded={openIndex === index}
          >
            <span className="text-lg font-medium text-gray-900 dark:text-white">
              {faq.question}
            </span>
            <svg
              className={`w-5 h-5 text-blue-500 transition-transform duration-300 transform ${
                openIndex === index ? 'rotate-180' : 'rotate-0'
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          
          <AnimatePresence initial={false}>
            {openIndex === index && (
              <SafeMotion.div
                key="content"
                initial="collapsed"
                animate="open"
                exit="collapsed"
                variants={{
                  open: { opacity: 1, height: "auto" },
                  collapsed: { opacity: 0, height: 0 }
                }}
                transition={{ duration: 0.3, ease: [0.04, 0.62, 0.23, 0.98] }}
              >
                <div className="px-6 pb-6 pt-2 text-gray-600 dark:text-gray-300">
                  {faq.answer}
                </div>
              </SafeMotion.div>
            )}
          </AnimatePresence>
        </div>
      ))}
    </div>
  );
};

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

const FaqSection: React.FC = () => {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-gray-900">
      <div className="container mx-auto px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
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