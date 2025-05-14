import React from 'react';

const AboutFounder = () => {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center sm:text-left">
          About the Founder
        </h2>
        
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
          <div className="md:flex">
            {/* Left column - Photo */}
            <div className="md:flex-shrink-0 flex items-center justify-center p-6 bg-gray-50">
              <div className="h-56 w-56 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center overflow-hidden">
                {/* Replace with actual image if available */}
                <svg className="h-32 w-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 20.993V24H0v-2.996A14.977 14.977 0 0112.004 15c4.904 0 9.26 2.354 11.996 5.993zM16.002 8.999a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
            </div>
            
            {/* Right column - Bio */}
            <div className="p-6 md:p-8">
              <h3 className="text-2xl font-bold text-gray-900">Ben Weinfeld</h3>
              <p className="text-teal-600 font-medium mb-4">Founder & CEO, Propagentic</p>
              
              <div className="prose prose-teal text-gray-700 space-y-4">
                <p>
                  Ben is an entrepreneurial business student at Wake Forest University with a 
                  passion for helping founders scale impactful technology. Prior to launching 
                  Propagentic, he built and ran 410 Haulers, a profitable junk removal business 
                  that grew through word-of-mouth, strategic pricing, and operational hustle.
                </p>
                
                <p>
                  He's interned with Techstars and worked in revenue operations at EcoMap 
                  Technologies, where he focused on fundraising, pricing strategy, and 
                  investor relations.
                </p>
                
                <p>
                  At Propagentic, Ben brings a founder's mindset, a deep love for process 
                  design, and a drive to modernize the property management industry through AI. 
                  Whether hauling junk or building SaaS, he's always obsessed with solving 
                  real-world problems.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutFounder; 