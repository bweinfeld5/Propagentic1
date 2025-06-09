import React from 'react';

const TeamSection = () => {
  return (
    <section className="py-16 md:py-24 bg-white dark:bg-propagentic-neutral-dark">
      <div className="container mx-auto px-6">
        <div className="max-w-4xl mx-auto mb-16 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-propagentic-neutral-dark dark:text-white mb-6">
            Meet Our Founder
          </h2>
          <p className="text-lg text-propagentic-neutral-dark dark:text-propagentic-neutral-light max-w-2xl mx-auto">
            The vision and drive behind Propagentic's mission to transform property management
          </p>
        </div>
        
        <div className="max-w-4xl mx-auto">
          <div className="bg-white dark:bg-propagentic-neutral rounded-xl shadow-lg overflow-hidden">
            <div className="md:flex">
              <div className="md:flex-shrink-0 md:w-1/3">
                <div className="h-full md:h-96 bg-propagentic-neutral-light dark:bg-propagentic-neutral-dark relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden border-4 border-white dark:border-propagentic-neutral shadow-lg">
                      <img
                        src="/ben-weinfeld.jpg"
                        alt="Ben Weinfeld"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://ui-avatars.com/api/?name=Ben+Weinfeld&background=1E6F68&color=fff&size=256";
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 md:p-10 md:w-2/3">
                <div className="uppercase tracking-wide text-sm text-propagentic-teal font-semibold">Founder & CEO</div>
                <h3 className="mt-1 text-2xl font-bold text-propagentic-neutral-dark dark:text-white">Ben Weinfeld</h3>
                
                <div className="mt-6 prose prose-lg max-w-none text-propagentic-neutral-dark dark:text-propagentic-neutral-light">
                  <p>
                    Ben founded Propagentic out of a lifelong proximity to real estate and a deep curiosity for the power of automation. Growing up in a family deeply embedded in the industry—his father leading Kittredge Properties and his brother working in asset management at AXA Investment Managers—Ben witnessed firsthand the behind-the-scenes strain of managing buildings and tenants.
                  </p>
                  <p>
                    Even on family vacations, it wasn't uncommon to see his dad stepping away to answer urgent calls about leaking pipes or malfunctioning HVAC units. The stress of coordinating contractors on short notice and keeping tenants happy was a recurring burden. Those moments stuck with Ben.
                  </p>
                  <p>
                    Now a business student at Wake Forest University with experience at Techstars and EcoMap Technologies, Ben is blending his entrepreneurial drive with his passion for AI to modernize the property management experience. Propagentic is his answer to the chaos he grew up watching—streamlining maintenance communication between landlords, tenants, and contractors through smart, AI-powered workflows.
                  </p>
                  <p>
                    From hauling junk in high school to scaling SaaS, Ben's mission remains constant: solve real problems with practical, human-centered technology.
                  </p>
                </div>
              </div>
            </div>
          </div>
        
          <div className="mt-16 text-center">
            <div className="max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-propagentic-neutral-dark dark:text-white mb-6">
                Join Us On Our Journey
              </h3>
              <p className="text-lg text-propagentic-neutral-dark dark:text-propagentic-neutral-light mb-8">
                We're building a team of passionate individuals who want to revolutionize property management. 
                If you're excited about AI, real estate tech, or just solving real problems, we'd love to hear from you.
              </p>
              <a href="/careers" className="inline-block bg-propagentic-teal text-white px-6 py-3 rounded-lg font-medium hover:bg-propagentic-teal-dark transform hover:-translate-y-0.5 transition duration-150">
                See Open Positions
              </a>
            </div>
            
            <div className="mt-12 flex justify-center space-x-6">
              <a href="https://www.linkedin.com/in/benweinfeld/" target="_blank" rel="noopener noreferrer" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
              <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TeamSection; 