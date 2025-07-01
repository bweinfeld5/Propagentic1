import React from 'react';

const AboutFounder = () => {
  return (
    <section className="py-16 md:py-24 bg-gradient-to-b from-white to-orange-50 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-block bg-orange-100 dark:bg-orange-900/30 rounded-full px-4 py-1 text-orange-600 dark:text-orange-400 text-sm font-medium mb-3 border border-orange-200 dark:border-orange-800">
            Our Story
          </div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
            About the Founder
          </h2>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden transform transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]">
          <div className="md:flex">
            {/* Left column - Photo */}
            <div className="md:flex-shrink-0 flex items-center justify-center p-8 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-gray-800 dark:to-gray-700">
              <div className="h-56 w-56 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-600 shadow-xl">
                {/* Replace with actual image if available */}
                <svg className="h-32 w-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            
            {/* Right column - Bio */}
            <div className="p-8 md:p-10">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Ben Weinfeld</h3>
              <p className="text-orange-600 dark:text-orange-400 font-medium mb-6 text-lg">Founder & CEO, Propagentic</p>
              
              <div className="prose prose-slate dark:prose-invert max-w-none space-y-4">
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Ben is an entrepreneurial business student at Wake Forest University with a 
                  passion for helping founders scale impactful technology. Prior to launching 
                  Propagentic, he built and ran 410 Haulers, a profitable junk removal business 
                  that grew through word-of-mouth, strategic pricing, and operational hustle.
                </p>
                
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  He's interned with Techstars and worked in revenue operations at EcoMap 
                  Technologies, where he focused on fundraising, pricing strategy, and 
                  investor relations.
                </p>
                
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  At Propagentic, Ben brings a founder's mindset, a deep love for process 
                  design, and a drive to modernize the property management industry through AI. 
                  Whether hauling junk or building SaaS, he's always obsessed with solving 
                  real-world problems.
                </p>
              </div>
              
              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <a href="https://linkedin.com/in/benweinfeld" target="_blank" rel="noopener noreferrer" 
                  className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                  <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.397-2.586 7-2.777 7 2.476v6.759z"/>
                  </svg>
                  Connect on LinkedIn
                </a>
                <a href="mailto:ben@propagentic.com" 
                   className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-lg text-gray-700 dark:text-white bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Contact Ben
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutFounder; 