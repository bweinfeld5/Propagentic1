import React from 'react';

const StorySection = () => {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-propagentic-neutral-dark">
      <div className="container mx-auto px-6">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center text-propagentic-neutral-dark dark:text-white mb-6">
            Our Story
          </h2>
          
          <div className="prose prose-lg max-w-none text-propagentic-neutral-dark dark:text-propagentic-neutral-light">
            <p>
              Propagentic was born from a simple frustration: the disconnect between landlords, tenants, and contractors during maintenance emergencies.
            </p>
            
            <p>
              Our founder, Alex Chen, experienced this firsthand while managing several properties. After a late-night pipe burst flooded a tenant's kitchen, Alex spent hours calling contractors who weren't available, while the tenant grew increasingly frustrated with the lack of updates. By the time a plumber was scheduled three days later, what could have been a simple fix had caused significant damage.
            </p>
            
            <p>
              Alex realized there had to be a better way. What if technology could connect these three parties seamlessly? What if AI could match the right contractor to each job automatically? What if everyone involved could track progress in real-time?
            </p>
            
            <div className="flex justify-center my-8">
              <div className="bg-propagentic-neutral-light dark:bg-propagentic-neutral dark:border dark:border-propagentic-neutral rounded-lg p-8 max-w-2xl">
                <blockquote className="italic text-propagentic-neutral-dark dark:text-white mb-4">
                  "The property management industry was stuck in the past, relying on phone calls, emails, and manual processes. We saw an opportunity to use AI to simplify and streamline how maintenance issues are handled, saving time and frustration for everyone involved."
                </blockquote>
                <p className="text-right font-medium text-propagentic-teal dark:text-propagentic-teal-light">
                  — Alex Chen, Founder & CEO
                </p>
              </div>
            </div>
            
            <p>
              In 2021, Alex assembled a team of technologists, property managers, and UX designers who shared his vision. Together, they built the first version of Propagentic, focusing on the most critical pain point: matching the right maintenance professionals to each job quickly and efficiently.
            </p>
            
            <p>
              Today, Propagentic's AI-powered platform handles thousands of maintenance requests each month, connecting property owners with qualified contractors while keeping tenants informed every step of the way. Our machine learning models continuously improve, learning from each interaction to better match contractors with jobs based on specialization, proximity, availability, and performance history.
            </p>
            
            <p>
              But we're just getting started. Our vision extends beyond maintenance management. We're building a comprehensive ecosystem that transforms how properties are managed, making it more efficient, transparent, and satisfying for everyone involved.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default StorySection; 