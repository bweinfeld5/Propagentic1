import React from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-background-subtle dark:bg-background-darkSubtle border-t border-border dark:border-border-dark py-10">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-lg font-semibold mb-4 text-content dark:text-content-dark">Propagentic</h3>
            <p className="text-content-secondary dark:text-content-darkSecondary mb-4">
              Modern property management solutions powered by AI.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-content dark:text-content-dark">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-content-secondary dark:text-content-darkSecondary hover:text-primary">Home</Link></li>
              <li><Link to="/about" className="text-content-secondary dark:text-content-darkSecondary hover:text-primary">About</Link></li>
              <li><Link to="/contact" className="text-content-secondary dark:text-content-darkSecondary hover:text-primary">Contact</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-content dark:text-content-dark">Resources</h3>
            <ul className="space-y-2">
              <li><Link to="/blog" className="text-content-secondary dark:text-content-darkSecondary hover:text-primary">Blog</Link></li>
              <li><Link to="/faq" className="text-content-secondary dark:text-content-darkSecondary hover:text-primary">FAQ</Link></li>
              <li><Link to="/support" className="text-content-secondary dark:text-content-darkSecondary hover:text-primary">Support</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-content dark:text-content-dark">Legal</h3>
            <ul className="space-y-2">
              <li><Link to="/privacy" className="text-content-secondary dark:text-content-darkSecondary hover:text-primary">Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-content-secondary dark:text-content-darkSecondary hover:text-primary">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border dark:border-border-dark mt-8 pt-8 text-center text-content-secondary dark:text-content-darkSecondary">
          <p>© {new Date().getFullYear()} Propagentic. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 