import React from 'react';
import { Link } from 'react-router-dom';
import HeroSection from './HeroSection';
import WorkflowDemo from './WorkflowDemo';
import Logo from '../../assets/images/logo.svg';
import FeaturesGrid from './FeaturesGrid';
import CompetitorMatrix from './CompetitorMatrix';
import Testimonials from './Testimonials';
import PricingSection from './PricingSection';
import AboutFounder from '../about/AboutFounder';
import AIExplainerSection from './AIExplainerSection';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-propagentic-neutral-dark">
      {/* 1. Hero section with navigation and role selector */}
      <HeroSection />
      
      {/* Stripe transition to workflow demo */}
      <div className="stripe-transition stripe-transition-orange section-morph"></div>
      
      {/* 2. Interactive workflow demo section */}
      <section className="py-16 md:py-24 bg-shift-orange wave-transition">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              See It In Action
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto">
              Our interactive demo shows you how Propagentic streamlines maintenance workflows from request to completion.
            </p>
          </div>
          <div className="mt-8">
            <WorkflowDemo />
          </div>
        </div>
      </section>
      
      {/* Stripe transition to features */}
      <div className="stripe-transition stripe-transition-orange section-morph"></div>
      
      {/* 3. Features section */}
      <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Powerful Features For Everyone
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Our platform offers dedicated tools for landlords, tenants, and contractors to streamline property maintenance.
            </p>
          </div>
          
          {/* Include the features grid component */}
          <FeaturesGrid />
        </div>
      </section>
      
      {/* Wave transition to AI explainer */}
      <div className="wave-transition"></div>
      
      {/* 4. How Propagentic Works - 4-part workflow */}
      <div className="bg-white dark:bg-propagentic-neutral-dark section-morph">
        <AIExplainerSection />
      </div>
      
      {/* Stripe transition to comparison */}
      <div className="stripe-transition stripe-transition-blue section-morph"></div>
      
      {/* 5. Comparison matrix section */}
      <section className="py-16 md:py-24 bg-slate-100 dark:bg-slate-800">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-4">
              How We Compare to Legacy Tools
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto">
              See how Propagentic stacks up against traditional property management solutions like AppFolio and Buildium.
            </p>
          </div>
          
          {/* Include the competitor matrix component */}
          <CompetitorMatrix />
        </div>
      </section>
      
      {/* Diagonal transition to testimonials */}
      <div className="diagonal-divider bg-white"></div>
      
      {/* 6. Testimonials section */}
      <section className="py-16 md:py-24 bg-white dark:bg-gray-900">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Customers Say
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
              Don't just take our word for it. Here's what property managers, landlords, and contractors have to say.
            </p>
          </div>
          
          {/* Include the testimonials component */}
          <Testimonials />
        </div>
      </section>
      
      {/* Stripe transition to pricing */}
      <div className="stripe-transition section-morph"></div>
      
      {/* 7. Pricing section */}
      <div className="section-morph">
        <PricingSection />
      </div>
      
      {/* Wave transition to about founder */}
      <div className="wave-transition"></div>
      
      {/* 8. About Founder section */}
      <div className="section-morph">
        <AboutFounder />
      </div>
      
      {/* Stripe transition to CTA */}
      <div className="stripe-transition stripe-transition-orange section-morph"></div>
      
      {/* 9. CTA section */}
      <section className="py-16 md:py-24 bg-shift-orange">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Ready to transform your property management?
          </h2>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-6">
            <Link to="/signup" className="bg-white text-orange-700 px-8 py-4 rounded-lg font-medium hover:bg-gray-100 transform hover:-translate-y-0.5 transition duration-300 text-center hover-lift">
              Get Started Free
            </Link>
            <Link to="/demo" className="border-2 border-white text-white px-8 py-4 rounded-lg font-medium hover:bg-white hover:bg-opacity-20 transform hover:-translate-y-0.5 transition duration-300 text-center hover-lift">
              Schedule a Demo
            </Link>
          </div>
        </div>
      </section>
      
      {/* Diagonal transition to footer */}
      <div className="diagonal-divider" style={{ color: '#1e293b' }}></div>
      
      {/* 10. Footer */}
      <footer className="bg-propagentic-slate-dark text-white py-12 section-morph">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-8 md:mb-0">
              <img src={Logo} alt="Propagentic Logo" className="h-10" />
              <p className="mt-4 text-propagentic-neutral-light max-w-md">
                AI-powered property maintenance platform connecting landlords, tenants, and contractors.
              </p>
            </div>
            <div className="flex flex-col md:flex-row space-y-8 md:space-y-0 md:space-x-16">
              <div>
                <h3 className="font-semibold mb-4">Platform</h3>
                <ul className="space-y-2">
                  <li><Link to="/features" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200">Features</Link></li>
                  <li><Link to="/pricing" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200">Pricing</Link></li>
                  <li><Link to="/security" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200">Security</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Company</h3>
                <ul className="space-y-2">
                  <li><Link to="/about" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200">About</Link></li>
                  <li><Link to="/blog" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200">Blog</Link></li>
                  <li><Link to="/contact" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200">Contact</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-4">Legal</h3>
                <ul className="space-y-2">
                  <li><Link to="/privacy" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200">Privacy</Link></li>
                  <li><Link to="/terms" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200">Terms</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-propagentic-slate mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-propagentic-neutral-light text-sm">
              &copy; {new Date().getFullYear()} Propagentic. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="https://twitter.com" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200" target="_blank" rel="noopener noreferrer">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="https://linkedin.com" className="text-propagentic-neutral-light hover:text-white transition-colors duration-200" target="_blank" rel="noopener noreferrer">
                <span className="sr-only">LinkedIn</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.397-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage; 