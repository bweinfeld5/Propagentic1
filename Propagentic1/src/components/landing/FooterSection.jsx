import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Logo from '../../assets/images/logo.svg';

const FooterSection = () => {
  const [email, setEmail] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    // This would typically handle the newsletter signup
    console.log('Email submitted:', email);
    setEmail('');
    // Show confirmation message or toast notification
  };
  
  return (
    <footer className="bg-white dark:bg-propagentic-neutral-dark pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          {/* Company Column */}
          <div className="col-span-1 md:col-span-1">
            <img src={Logo} alt="Propagentic Logo" className="h-10 mb-4" />
            <p className="text-propagentic-neutral-dark dark:text-propagentic-neutral-light mb-4">
              Making property management smarter through AI-powered workflows.
            </p>
            <div className="flex space-x-4">
              {/* Social Media Icons */}
              <a href="#" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
                </svg>
              </a>
              <a href="#" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                  <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                  <rect x="2" y="9" width="4" height="12"></rect>
                  <circle cx="4" cy="4" r="2"></circle>
                </svg>
              </a>
            </div>
          </div>
          
          {/* Navigation Columns */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4 text-propagentic-neutral-dark dark:text-white">Platform</h3>
            <ul className="space-y-2">
              <li><Link to="/features" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Features</Link></li>
              <li><Link to="/pricing" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Pricing</Link></li>
              <li><Link to="/integrations" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Integrations</Link></li>
              <li><Link to="/security" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Security</Link></li>
            </ul>
          </div>
          
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4 text-propagentic-neutral-dark dark:text-white">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">About</Link></li>
              <li><Link to="/blog" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Blog</Link></li>
              <li><Link to="/careers" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Careers</Link></li>
              <li><Link to="/contact" className="text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Contact</Link></li>
            </ul>
          </div>
          
          {/* Newsletter Signup */}
          <div className="col-span-1">
            <h3 className="text-lg font-bold mb-4 text-propagentic-neutral-dark dark:text-white">Stay Updated</h3>
            <p className="text-propagentic-neutral-dark dark:text-propagentic-neutral-light mb-4">
              Subscribe to our newsletter for the latest updates and features.
            </p>
            <form onSubmit={handleSubmit} className="flex">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                className="flex-grow px-4 py-2 rounded-l-lg border border-propagentic-neutral dark:border-propagentic-neutral dark:bg-propagentic-neutral-dark dark:text-white focus:outline-none focus:ring-2 focus:ring-propagentic-teal"
                required
              />
              <button
                type="submit"
                className="bg-propagentic-teal text-white px-4 py-2 rounded-r-lg hover:bg-propagentic-teal-dark transition-colors duration-150"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>
            </form>
          </div>
        </div>
        
        {/* Bottom Section */}
        <div className="pt-8 border-t border-propagentic-neutral dark:border-propagentic-neutral flex flex-col md:flex-row justify-between items-center">
          <div className="text-sm text-propagentic-neutral-dark dark:text-propagentic-neutral-light mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Propagentic. All rights reserved.
          </div>
          <div className="flex space-x-6">
            <Link to="/privacy" className="text-sm text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Privacy Policy</Link>
            <Link to="/terms" className="text-sm text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Terms of Service</Link>
            <Link to="/cookies" className="text-sm text-propagentic-neutral-dark hover:text-propagentic-teal dark:text-propagentic-neutral-light dark:hover:text-propagentic-teal-light transition-colors duration-150">Cookie Policy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection; 