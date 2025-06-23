import React from 'react';
import NewsletterSignup from './NewsletterSignup';

const NewsletterSection = () => {
  return (
    <section className="py-16 md:py-20 bg-propagentic-neutral-lightest dark:bg-propagentic-slate-dark border-t border-propagentic-neutral dark:border-propagentic-neutral-dark">
      <div className="container mx-auto px-6">
        <NewsletterSignup />
      </div>
    </section>
  );
};

export default NewsletterSection; 