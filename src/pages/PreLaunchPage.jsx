import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import { db } from '../firebase/config';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import waitlistService from '../services/waitlistService';
import analyticsService from '../services/analyticsService';
import errorHandling from '../utils/ErrorHandling';

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
    // NOTE: This function will be migrated to unified service in future update
    const subject = `Welcome to PropAgentic, ${userName}! 🏠`;
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ee963c;">Welcome to PropAgentic!</h2>
        <p>Hi ${userName},</p>
        <p>Thank you for joining our waitlist as a ${role}! We're excited to have you on board.</p>
        <p>We'll keep you updated on our launch progress and let you know as soon as PropAgentic is ready for you.</p>
        <p>Best regards,<br>The PropAgentic Team</p>
      </div>
    `;
    
    const text = `Welcome to PropAgentic!\n\nHi ${userName},\n\nThank you for joining our waitlist as a ${role}! We're excited to have you on board.\n\nWe'll keep you updated on our launch progress and let you know as soon as PropAgentic is ready for you.\n\nBest regards,\nThe PropAgentic Team`;
    
    return { subject, html, text };
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: `
          linear-gradient(
            ${45 + backgroundOffset}deg, 
            #ee963c ${gradientShift}%, 
            #f59e0b ${20 + gradientShift}%, 
            #ea580c ${40 + gradientShift}%, 
            #dc2626 ${60 + gradientShift}%, 
            #c2410c ${80 + gradientShift}%
          )
        `
      }}
    >
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-10">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-white rounded-full"
            style={{
              width: Math.random() * 100 + 50,
              height: Math.random() * 100 + 50,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              x: [0, Math.random() * 200 - 100],
              y: [0, Math.random() * 200 - 100],
              scale: [1, Math.random() * 0.5 + 0.8],
              opacity: [0.1, Math.random() * 0.3 + 0.1],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <motion.div 
        className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 w-full max-w-md relative z-10"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <PropAgenticLogo className="h-16 w-auto mx-auto mb-4" />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Coming Soon
            </h1>
            <p className="text-gray-600">
              Join the waitlist to be the first to know when PropAgentic launches!
            </p>
          </motion.div>
        </div>

        {!isSubmitted ? (
          <motion.form 
            onSubmit={handleSubmit} 
            className="space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.6 }}
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                I am a:
              </label>
              <div className="grid grid-cols-1 gap-3">
                {[
                  { value: 'landlord', label: 'Landlord', icon: '🏠' },
                  { value: 'tenant', label: 'Tenant', icon: '🏡' },
                  { value: 'contractor', label: 'Contractor', icon: '🔧' }
                ].map((role) => (
                  <motion.button
                    key={role.value}
                    type="button"
                    onClick={() => setSelectedRole(role.value)}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                      selectedRole === role.value
                        ? 'border-orange-500 bg-orange-50 text-orange-900'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{role.icon}</span>
                      <span className="font-medium">{role.label}</span>
                    </div>
                  </motion.button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
                placeholder="Enter your email"
                required
              />
            </div>

            {error && (
              <motion.div 
                className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {error}
              </motion.div>
            )}

            <motion.button
              type="submit"
              disabled={isSubmitting || !selectedRole || !name.trim() || !email}
              className={`w-full py-4 rounded-xl font-semibold text-lg transition-all duration-200 ${
                isSubmitting || !selectedRole || !name.trim() || !email
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-orange-500 to-red-500 text-white hover:from-orange-600 hover:to-red-600 shadow-lg hover:shadow-xl'
              }`}
              whileHover={!isSubmitting && selectedRole && name.trim() && email ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting && selectedRole && name.trim() && email ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Joining Waitlist...</span>
                </div>
              ) : (
                'Join Waitlist'
              )}
            </motion.button>
          </motion.form>
        ) : (
          <motion.div 
            className="text-center space-y-4"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">You're on the list!</h2>
            <p className="text-gray-600">
              Thank you for joining our waitlist. We'll notify you as soon as PropAgentic is ready!
            </p>
            <div className="pt-4">
              <p className="text-sm text-gray-500">
                Keep an eye on your inbox for updates and exclusive early access.
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};

export default PreLaunchPage; 