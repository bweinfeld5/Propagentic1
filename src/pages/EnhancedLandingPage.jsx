import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './EnhancedLandingPage.css';

// Import error handling and compatibility components
import ErrorBoundary from '../components/shared/ErrorBoundary';
import { SafeMotionDiv } from '../components/shared/SafeMotion';
import { checkMotionCompatibility } from '../utils/compatibilityChecks';

// Simple static fallback component for when animations can't be used
const SimpleLandingContent = () => (
  <div className="landing-container-static">
    <div className="hero-section-static">
      <h1>Welcome to PropAgentic</h1>
      <h2>Modern Property Management Made Simple</h2>
      <p>
        The complete solution for property owners, tenants, and contractors.
        Streamline your property management with our powerful tools.
      </p>
      <div className="cta-buttons">
        <Link to="/login" className="btn btn-primary btn-large">
          Get Started
        </Link>
        <Link to="/contact" className="btn btn-secondary btn-large">
          Contact Us
        </Link>
      </div>
    </div>
    
    <div className="features-section">
      <div className="feature-card-static">
        <div className="feature-icon">🏠</div>
        <h3>Property Management</h3>
        <p>Easily manage all your properties in one place with advanced tracking and reporting tools.</p>
      </div>
      <div className="feature-card-static">
        <div className="feature-icon">📝</div>
        <h3>Maintenance Requests</h3>
        <p>Streamline the entire maintenance workflow from request to completion.</p>
      </div>
      <div className="feature-card-static">
        <div className="feature-icon">💰</div>
        <h3>Rent Collection</h3>
        <p>Automate rent collection and keep track of all your payments in one central dashboard.</p>
      </div>
    </div>
    
    <div className="testimonials-section-static">
      <h2>What Our Customers Say</h2>
      <div className="testimonials-container">
        <div className="testimonial-card-static">
          <p>"PropAgentic has completely transformed how I manage my rental properties. The time saved is incredible!"</p>
          <div className="author">- Sarah Johnson, Property Owner</div>
        </div>
        <div className="testimonial-card-static">
          <p>"As a tenant, I love how easy it is to submit maintenance requests and pay rent online. Great experience!"</p>
          <div className="author">- Michael Chen, Tenant</div>
        </div>
      </div>
    </div>
    
    <div className="cta-section-static">
      <h2>Ready to streamline your property management?</h2>
      <div className="cta-buttons">
        <Link to="/register" className="btn btn-primary">
          Start Free Trial
        </Link>
      </div>
    </div>
    
    <footer className="landing-footer">
      <p>© {new Date().getFullYear()} PropAgentic. All rights reserved.</p>
      <div className="footer-links">
        <Link to="/privacy">Privacy Policy</Link>
        <Link to="/terms">Terms of Service</Link>
        <Link to="/contact">Contact</Link>
      </div>
    </footer>
  </div>
);

// Enhanced animation-enabled landing page
const EnhancedLandingPage = () => {
  const [isCompatible, setIsCompatible] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if the browser is compatible with our animations
    const checkCompatibility = async () => {
      try {
        const compatible = await checkMotionCompatibility();
        setIsCompatible(compatible);
      } catch (error) {
        console.error("Error checking motion compatibility:", error);
        setIsCompatible(false);
      } finally {
        // Add a small delay to prevent flash of loading screen
        setTimeout(() => setIsLoading(false), 300);
      }
    };

    checkCompatibility();
  }, []);

  // Show loading spinner while checking compatibility
  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading experience...</p>
      </div>
    );
  }

  // If not compatible, show static version
  if (!isCompatible) {
    return <SimpleLandingContent />;
  }

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.2
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { type: 'spring', stiffness: 300, damping: 24 }
    }
  };

  // Enhanced version with animations
  return (
    <ErrorBoundary fallback={<SimpleLandingContent />}>
      <SafeMotionDiv
        className="landing-container"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Hero Section */}
        <ErrorBoundary fallback={<div className="hero-section-static">
          <h1>Welcome to PropAgentic</h1>
          <h2>Modern Property Management Made Simple</h2>
          <p>The complete solution for property owners, tenants, and contractors.</p>
          <div className="cta-buttons">
            <Link to="/login" className="btn btn-primary btn-large">Get Started</Link>
            <Link to="/contact" className="btn btn-secondary btn-large">Contact Us</Link>
          </div>
        </div>}>
          <SafeMotionDiv className="hero-section" variants={itemVariants}>
            <motion.h1 variants={itemVariants}>Welcome to PropAgentic</motion.h1>
            <motion.h2 variants={itemVariants}>Modern Property Management Made Simple</motion.h2>
            <motion.p variants={itemVariants}>
              The complete solution for property owners, tenants, and contractors.
              Streamline your property management with our powerful tools.
            </motion.p>
            <motion.div className="cta-buttons" variants={itemVariants}>
              <Link to="/login" className="btn btn-primary btn-large">
                Get Started
              </Link>
              <Link to="/contact" className="btn btn-secondary btn-large">
                Contact Us
              </Link>
            </motion.div>
          </SafeMotionDiv>
        </ErrorBoundary>

        {/* Features Section */}
        <ErrorBoundary fallback={
          <div className="features-section">
            {[
              { icon: "🏠", title: "Property Management", description: "Easily manage all your properties in one place with advanced tracking and reporting tools." },
              { icon: "📝", title: "Maintenance Requests", description: "Streamline the entire maintenance workflow from request to completion." },
              { icon: "💰", title: "Rent Collection", description: "Automate rent collection and keep track of all your payments in one central dashboard." }
            ].map((feature, index) => (
              <div key={index} className="feature-card-static">
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        }>
          <motion.div className="features-section" variants={containerVariants}>
            {[
              { icon: "🏠", title: "Property Management", description: "Easily manage all your properties in one place with advanced tracking and reporting tools." },
              { icon: "📝", title: "Maintenance Requests", description: "Streamline the entire maintenance workflow from request to completion." },
              { icon: "💰", title: "Rent Collection", description: "Automate rent collection and keep track of all your payments in one central dashboard." }
            ].map((feature, index) => (
              <SafeMotionDiv
                key={index}
                className="feature-card"
                variants={itemVariants}
                whileHover={{ y: -5, boxShadow: "0 8px 30px rgba(0,0,0,0.12)" }}
              >
                <div className="feature-icon">{feature.icon}</div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </SafeMotionDiv>
            ))}
          </motion.div>
        </ErrorBoundary>

        {/* Testimonials Section */}
        <ErrorBoundary fallback={
          <div className="testimonials-section-static">
            <h2>What Our Customers Say</h2>
            <div className="testimonials-container">
              <div className="testimonial-card-static">
                <p>"PropAgentic has completely transformed how I manage my rental properties. The time saved is incredible!"</p>
                <div className="author">- Sarah Johnson, Property Owner</div>
              </div>
              <div className="testimonial-card-static">
                <p>"As a tenant, I love how easy it is to submit maintenance requests and pay rent online. Great experience!"</p>
                <div className="author">- Michael Chen, Tenant</div>
              </div>
            </div>
          </div>
        }>
          <SafeMotionDiv className="testimonials-section" variants={itemVariants}>
            <motion.h2 variants={itemVariants}>What Our Customers Say</motion.h2>
            <motion.div className="testimonials-container" variants={containerVariants}>
              <SafeMotionDiv className="testimonial-card" variants={itemVariants}>
                <p>"PropAgentic has completely transformed how I manage my rental properties. The time saved is incredible!"</p>
                <div className="author">- Sarah Johnson, Property Owner</div>
              </SafeMotionDiv>
              <SafeMotionDiv className="testimonial-card" variants={itemVariants}>
                <p>"As a tenant, I love how easy it is to submit maintenance requests and pay rent online. Great experience!"</p>
                <div className="author">- Michael Chen, Tenant</div>
              </SafeMotionDiv>
            </motion.div>
          </SafeMotionDiv>
        </ErrorBoundary>

        {/* CTA Section */}
        <ErrorBoundary fallback={
          <div className="cta-section-static">
            <h2>Ready to streamline your property management?</h2>
            <div className="cta-buttons">
              <Link to="/register" className="btn btn-primary">Start Free Trial</Link>
            </div>
          </div>
        }>
          <SafeMotionDiv
            className="cta-section"
            variants={itemVariants}
            whileInView={{ scale: [0.95, 1], opacity: [0, 1] }}
            viewport={{ once: true }}
          >
            <motion.h2 variants={itemVariants}>Ready to streamline your property management?</motion.h2>
            <motion.div className="cta-buttons" variants={itemVariants}>
              <Link to="/register" className="btn btn-primary">
                Start Free Trial
              </Link>
            </motion.div>
          </SafeMotionDiv>
        </ErrorBoundary>

        {/* Footer */}
        <ErrorBoundary fallback={
          <footer className="landing-footer">
            <p>© {new Date().getFullYear()} PropAgentic. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </footer>
        }>
          <motion.footer className="landing-footer" variants={itemVariants}>
            <p>© {new Date().getFullYear()} PropAgentic. All rights reserved.</p>
            <div className="footer-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/contact">Contact</Link>
            </div>
          </motion.footer>
        </ErrorBoundary>
      </SafeMotionDiv>
    </ErrorBoundary>
  );
};

export default EnhancedLandingPage; 