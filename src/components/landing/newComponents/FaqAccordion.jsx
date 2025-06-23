import React, { useState } from 'react';
import { SafeMotion, AnimatePresence } from "../../shared/SafeMotion";

const FaqAccordion = ({ questions }) => {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="space-y-4">
      {questions.map((faq, index) => (
        <div 
          key={index} 
          className={`border rounded-lg overflow-hidden transition-all duration-300 ${
            openIndex === index 
              ? 'border-propagentic-teal bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark shadow-card' 
              : 'border-propagentic-neutral dark:border-propagentic-neutral-dark bg-propagentic-neutral-lightest dark:bg-propagentic-neutral-dark hover:border-propagentic-neutral-medium'
          }`}
        >
          <button
            onClick={() => toggleFaq(index)}
            className="w-full px-6 py-4 text-left flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-propagentic-teal"
            aria-expanded={openIndex === index}
          >
            <span className="text-lg font-medium text-propagentic-slate-dark dark:text-propagentic-neutral-lightest">
              {faq.question}
            </span>
            <svg
              className={`w-5 h-5 text-propagentic-teal transition-transform duration-300 transform ${
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
                <div className="px-6 pb-6 pt-2 text-propagentic-slate dark:text-propagentic-neutral-light">
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

export default FaqAccordion; 