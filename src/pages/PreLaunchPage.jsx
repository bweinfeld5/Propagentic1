import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import waitlistService from '../services/waitlistService';
import analyticsService from '../services/analyticsService';
import errorHandling from '../utils/errorHandling';

// Orange PropAgentic Logo SVG Component
const PropAgenticLogo = ({ className = "h-16 w-auto" }) => (
  <svg 
    className={className} 
    viewBox="0 0 601.32 389.03" 
    xmlns="http://www.w3.org/2000/svg"
    style={{ filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))' }}
  >
    <path 
      fill="#ee963c" 
      d="M200.75,0c8.12-.06,21.92,4.33,28.82,11.5,43.1,38.91,92.39,74.04,134.87,113.28,8.8,8.83,22.86,18.65,18.95,32.88-2.52,8.87-11.23,17.77-19.21,19.12-7.6,1.87-11.82-4.02-17.2-7.93-35.69-29.69-105.94-93.87-136.97-111.02-10.75-5.78-12.91-6.04-19.97,1.18-43,38.58-93.37,72.88-134.31,112.45-6.48,6.16-8.96,14.69-9.37,23.45-2.83,40.51,2.96,86.05,1.02,127.03-3.49,31.08,59.53,16.9,77.02,18.35,18.07-.02,35.83-1.21,54.03-.76,11.19-.11,21.91-3.59,30.03-11.4,53.96-46.87,118.7-87.21,171.57-134.57,28.31-22.32,19.31-41.53,30.11-70.44,18.57-44.71,78.41-58.38,121.36-43.98,41.83,14.93-17.98,36.2-40.27,51.32-7.92,4.82-16.03,13.06-15.89,22.62.93,17.76,13.96,33.87,25.32,48.02,25.2,25.07,56.99-14.48,84.24-28.97,27.65-12.74,12.96,32.52,8.42,44.75-13.33,34.58-47.21,60.57-84.85,60.06-5.72-.07-11.51-.74-17.12-2.08-22.4-4.88-37.38-23.04-57.83-19.92-8.12,1.15-16.94,6.36-23.92,10.99-51.89,34.15-98.88,86.13-153.72,117.15-3.68,1.84-7.92,4.92-11.02,4.96-14.52.07-129.31.56-180.29.78-27.47.51-44.67,1.5-58.88-20.36-3.14-5.8-3.69-12.57-3.38-19.06,3.16-59.93-6.81-124.64.25-183.7,6.4-18.52,63.89-71.54,115.5-112.69,16.22-12.93,31.86-24.68,45.15-33.82C180.84,7.79,190.15.74,200.1,0h.65Z"
    />
  </svg>
);

const PreLaunchPage = () => {
  const { currentUser } = useAuth();
  const [selectedRole, setSelectedRole] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Enhanced dynamic background animation
  const [backgroundOffset, setBackgroundOffset] = useState(0);
  const [gradientShift, setGradientShift] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setBackgroundOffset(prev => (prev + 0.3) % 360);
      setGradientShift(prev => (prev + 0.1) % 100);
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Track page view on component mount
  useEffect(() => {
    errorHandling.safeAsync(
      () => analyticsService.trackPageView('pre_launch_page', currentUser?.uid || null),
      'Failed to track page view',
      { showToast: false }
    );
  }, [currentUser]);

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
    if (currentUser?.displayName) {
      setName(currentUser.displayName);
    }
  }, [currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedRole) {
      setError('Please select your role');
      return;
    }
    
    if (!name.trim()) {
      setError('Please enter your name');
      return;
    }
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      console.log('Starting waitlist signup for:', email, 'Name:', name, 'Role:', selectedRole);

      // Check if email is already on waitlist
      const isExisting = await waitlistService.checkWaitlistStatus(email);
      
      if (isExisting) {
        setIsSubmitted(true);
        // Track duplicate signup attempt
        await errorHandling.safeAsync(
          () => analyticsService.trackEvent(
            'waitlist_duplicate_attempt', 
            currentUser?.uid || null,
            { email, role: selectedRole, name }
          ),
          'Failed to track duplicate signup',
          { showToast: false }
        );
        return;
      }

      // Add to waitlist using our service
      const result = await waitlistService.addToWaitlist({
        name: name.trim(),
        email,
        role: selectedRole,
        source: 'pre_launch_page',
        userId: currentUser?.uid || null,
        subscribed_to_newsletter: true,
        marketing_consent: true
      });

      console.log('✅ Waitlist signup successful! Result:', result);

      // Track successful signup
      await errorHandling.safeAsync(
        () => analyticsService.trackWaitlistSignup(
          email,
          selectedRole,
          currentUser?.uid || null,
          'pre_launch_page'
        ),
        'Failed to track waitlist signup',
        { showToast: false }
      );

      // Queue pre-launch email directly using Firebase (no authentication required)
      const emailContent = getPreLaunchEmailTemplate(selectedRole, name);
      const emailData = {
        to: email,
        message: {
          subject: emailContent.subject,
          text: emailContent.text,
          html: emailContent.html
        },
        // Additional metadata
        userName: name,
        userRole: selectedRole,
        source: 'waitlist_signup',
        createdAt: serverTimestamp()
      };

      console.log('Queueing pre-launch email with direct Firebase call...');
      console.log('Email data being sent:', JSON.stringify(emailData, null, 2));
      
      try {
        const emailRef = await addDoc(collection(db, 'mail'), emailData);
        console.log('✅ Pre-launch email queued successfully! Document ID:', emailRef.id);
      } catch (emailError) {
        console.error('❌ Email sending failed:', emailError);
        console.error('Email error details:', {
          code: emailError?.code,
          message: emailError?.message,
          details: emailError
        });
        // Don't throw - email is non-critical
      }

      // Add to newsletter subscription
      try {
        const newsletterData = {
          name: name.trim(),
          email: email,
          role: selectedRole,
          source: 'pre_launch',
          subscribedAt: serverTimestamp(),
          status: 'active',
          preferences: {
            marketing: true,
            product_updates: true,
            newsletters: true
          }
        };

        const newsletterRef = await addDoc(collection(db, 'newsletter_subscribers'), newsletterData);
        console.log('✅ Newsletter subscription successful! Document ID:', newsletterRef.id);
      } catch (newsletterError) {
        console.error('❌ Newsletter subscription failed:', newsletterError);
        console.error('Newsletter error details:', {
          code: newsletterError?.code,
          message: newsletterError?.message,
          details: newsletterError
        });
        // Don't throw - newsletter is non-critical
      }

      setIsSubmitted(true);
      
    } catch (error) {
      console.error('PreLaunch Waitlist Error:', error);
      console.error('Error details:', {
        code: error?.code,
        message: error?.message,
        details: error?.details,
        stack: error?.stack
      });
      
      errorHandling.handleError(
        error,
        'Failed to join waitlist',
        {
          userId: currentUser?.uid || null,
          context: { email, role: selectedRole, name },
          errorSource: 'pre_launch_waitlist',
          showToast: false // Use the error state instead
        }
      );
      
      // Set user-friendly error message
      setError(errorHandling.formatFirebaseError(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Enhanced pre-launch email template function with name personalization
  const getPreLaunchEmailTemplate = (role, userName) => {
    const baseContent = {
      landlord: {
        subject: "🏠 You're on the PropAgentic Pre-Launch List!",
        preview: "Get ready to revolutionize your property management",
        greeting: "property owner",
        benefits: [
          "Streamlined tenant communication and maintenance requests",
          "AI-powered rent optimization and market analysis", 
          "Automated contractor vetting and job management",
          "Real-time property performance analytics"
        ],
        cta: "We'll notify you the moment PropAgentic launches for landlords."
      },
      tenant: {
        subject: "🏠 You're on the PropAgentic Pre-Launch List!",
        preview: "Maintenance requests are about to get much easier",
        greeting: "tenant",
        benefits: [
          "Submit maintenance requests instantly with photos",
          "Track repair status in real-time",
          "Direct communication with your landlord and contractors",
          "Rate and review completed work"
        ],
        cta: "We'll notify you when your landlord can invite you to PropAgentic."
      },
      contractor: {
        subject: "🔧 You're on the PropAgentic Pre-Launch List!",
        preview: "Get ready to access quality maintenance jobs",
        greeting: "contractor",
        benefits: [
          "Access to pre-screened maintenance jobs in your area",
          "Secure escrow payments for peace of mind",
          "Build your reputation with verified reviews",
          "Streamlined communication with property managers"
        ],
        cta: "We'll notify you when PropAgentic launches in your service area."
      },
      supporter: {
        subject: "🌟 Thank you for supporting PropAgentic!",
        preview: "Your support means everything to us",
        greeting: "supporter",
        benefits: [
          "Exclusive updates on our development progress",
          "Early access to beta features and testing",
          "Direct input on product features and roadmap",
          "Special recognition in our community"
        ],
        cta: "We'll keep you updated on our journey and invite you to be part of our story."
      }
    };

    const content = baseContent[role] || baseContent.landlord;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
      </head>
      <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f1eb;">
        <div style="max-width: 600px; margin: 0 auto; background-color: white;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to the Future!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">${content.preview}</p>
          </div>
          
          <!-- Main Content -->
          <div style="padding: 40px 30px;">
            <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${userName}! 👋</h2>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
              Thank you for joining the PropAgentic pre-launch waitlist! As a ${content.greeting}, you're among the first to experience the next generation of property management technology.
            </p>
            
            <div style="background: #fef3c7; padding: 25px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0; margin-bottom: 15px;">What's coming your way:</h3>
              <ul style="color: #92400e; margin: 0; padding-left: 20px;">
                ${content.benefits.map(benefit => `<li style="margin-bottom: 8px;">${benefit}</li>`).join('')}
              </ul>
            </div>
            
            <p style="color: #4b5563; line-height: 1.6; margin-bottom: 25px;">
              ${content.cta}
            </p>
            
            <div style="text-align: center; margin: 35px 0;">
              <div style="background: #f97316; color: white; padding: 15px 30px; border-radius: 8px; display: inline-block; font-weight: bold;">
                🚀 Early Access Reserved
              </div>
            </div>
          </div>
          
          <!-- Footer -->
          <div style="background: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">
              © ${new Date().getFullYear()} PropAgentic. All rights reserved.
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Welcome to PropAgentic Pre-Launch!
      
      Hello ${userName}!
      
      Thank you for joining the PropAgentic pre-launch waitlist! As a ${content.greeting}, you're among the first to experience the next generation of property management technology.
      
      What's coming your way:
      ${content.benefits.map(benefit => `• ${benefit}`).join('\n')}
      
      ${content.cta}
      
      Best regards,
      The PropAgentic Team
    `;

    return {
      subject: content.subject,
      html: html,
      text: text
    };
  };

  // Enhanced dynamic background with multiple gradients and effects
  const dynamicBackgroundStyle = {
    background: `
      radial-gradient(circle at ${20 + gradientShift/2}% ${30 + gradientShift/3}%, rgba(249, 115, 22, 0.1) 0%, transparent 50%),
      radial-gradient(circle at ${80 - gradientShift/2}% ${70 - gradientShift/3}%, rgba(234, 88, 12, 0.1) 0%, transparent 50%),
      linear-gradient(${backgroundOffset}deg, #f5f1eb 0%, #f0ede6 25%, #ebe8e1 50%, #f5f1eb 75%, #f0ede6 100%)
    `,
    transition: 'background 0.5s ease',
    minHeight: '100vh',
    position: 'relative'
  };

  // Floating particles effect
  const FloatingParticle = ({ delay, duration, x, y }) => (
    <motion.div
      className="absolute w-2 h-2 bg-orange-200 rounded-full opacity-30"
      animate={{
        y: [y, y - 100, y],
        x: [x, x + 20, x - 20, x],
        opacity: [0.3, 0.6, 0.3]
      }}
      transition={{
        duration: duration,
        delay: delay,
        repeat: Infinity,
        ease: "easeInOut"
      }}
      style={{ left: `${x}%`, top: `${y}%` }}
    />
  );

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={dynamicBackgroundStyle}>
        {/* Floating Particles */}
        {[...Array(12)].map((_, i) => (
          <FloatingParticle 
            key={i}
            delay={i * 0.8}
            duration={8 + i * 0.5}
            x={Math.random() * 100}
            y={Math.random() * 100}
          />
        ))}
        
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center relative z-10"
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl p-8 max-w-md mx-auto border border-orange-100">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {name}!</h2>
            <p className="text-gray-600 mb-4">
              You're officially on our waitlist! We'll notify you when PropAgentic is ready for {selectedRole === 'landlord' ? 'landlords' : selectedRole === 'tenant' ? 'tenants' : selectedRole === 'contractor' ? 'contractors' : 'supporters'}.
            </p>
            <p className="text-sm text-gray-500">
              Keep an eye on your inbox at <strong>{email}</strong>
            </p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={dynamicBackgroundStyle}>
      {/* Floating Particles */}
      {[...Array(15)].map((_, i) => (
        <FloatingParticle 
          key={i}
          delay={i * 0.6}
          duration={10 + i * 0.3}
          x={Math.random() * 100}
          y={Math.random() * 100}
        />
      ))}

      {/* Logo */}
      <motion.div 
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="mb-16 relative z-10"
      >
        <div className="flex items-center justify-center">
          <PropAgenticLogo className="h-20 w-auto" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          className="text-center mt-4"
        >
          <h1 className="text-2xl font-bold text-gray-800">PropAgentic</h1>
          <p className="text-gray-600 text-sm">The Future of Property Management</p>
        </motion.div>
      </motion.div>

      {/* Main Card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
        className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-lg relative z-10 border border-orange-100"
      >
        {/* Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <LockClosedIcon className="w-5 h-5 text-orange-600" />
            <h2 className="text-xl font-semibold text-gray-900">Early Access</h2>
          </div>
          <p className="text-gray-600 text-sm">Join the revolution in property management</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your full name"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white"
              required
            />
          </div>

          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select your role:
            </label>
            <div className="space-y-3">
              {[
                { value: 'landlord', label: 'Landlord / Property Owner', icon: '🏠' },
                { value: 'tenant', label: 'Tenant', icon: '🏡' },
                { value: 'contractor', label: 'Contractor / Service Provider', icon: '🔧' },
                { value: 'supporter', label: 'Supporter / Interested Party', icon: '🌟' }
              ].map((role) => (
                <label key={role.value} className="flex items-center p-3 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 cursor-pointer">
                  <input
                    type="radio"
                    name="role"
                    value={role.value}
                    checked={selectedRole === role.value}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="ml-3 text-xl">{role.icon}</span>
                  <span className="ml-2 text-gray-700 font-medium">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Email Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 rounded-xl p-3"
            >
              <p className="text-sm text-red-600">{error}</p>
            </motion.div>
          )}

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Joining...
              </>
            ) : (
              <>
                <span>Join the Waitlist</span>
                <span className="ml-2">🚀</span>
              </>
            )}
          </motion.button>

          {/* Description */}
          <p className="text-xs text-gray-500 text-center leading-relaxed">
            We'll notify you when PropAgentic is ready for your role. 
            <br />No spam, unsubscribe anytime.
          </p>
        </form>
      </motion.div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="mt-16 relative z-10"
      >
        <p className="text-sm text-gray-600 text-center">
          © 2025 PropAgentic. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default PreLaunchPage; 