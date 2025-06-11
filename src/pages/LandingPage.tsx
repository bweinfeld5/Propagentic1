import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext.jsx';
import toastService from '../services/toastService';
import waitlistService from '../services/waitlistService';
import analyticsService from '../services/analyticsService';
import errorHandling from '../utils/ErrorHandling';
import validation from '../utils/validation';

// PropAgentic Logo SVG Component
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

interface RadioGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

const RadioGroup: React.FC<RadioGroupProps> = ({ value, onValueChange, children, className = '' }) => {
  return (
    <div className={className}>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child as any, {
            checked: (child.props as any).value === value,
            onChange: () => onValueChange((child.props as any).value),
          });
        }
        return child;
      })}
    </div>
  );
};

interface RadioGroupItemProps {
  value: string;
  id: string;
  checked?: boolean;
  onChange?: () => void;
  className?: string;
}

const RadioGroupItem: React.FC<RadioGroupItemProps> = ({ value, id, checked, onChange, className = '' }) => {
  return (
    <input
      type="radio"
      id={id}
      value={value}
      checked={checked}
      onChange={onChange}
      className={`h-4 w-4 border-orange-500 text-orange-500 focus:ring-orange-500 ${className}`}
    />
  );
};

interface LabelProps {
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}

const Label: React.FC<LabelProps> = ({ htmlFor, children, className = '' }) => {
  return (
    <label htmlFor={htmlFor} className={`block text-sm font-medium ${className}`}>
      {children}
    </label>
  );
};

interface CheckboxProps {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

const Checkbox: React.FC<CheckboxProps> = ({ id, checked, onChange, className = '' }) => {
  return (
    <input
      type="checkbox"
      id={id}
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className={`h-4 w-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500 ${className}`}
    />
  );
};

/**
 * Enhanced Landing page component for PropAgentic early access
 */
const LandingPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [role, setRole] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [emailError, setEmailError] = useState<string>('');
  const [privacyAccepted, setPrivacyAccepted] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

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
      () => analyticsService.trackPageView('early_access_landing', currentUser?.uid || null),
      'Failed to track page view',
      { showToast: false }
    );
  }, [currentUser]);

  // Pre-fill email if user is logged in
  useEffect(() => {
    if (currentUser?.email) {
      setEmail(currentUser.email);
    }
  }, [currentUser]);

  // Validate email on change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    
    // Clear error when field is empty
    if (!newEmail) {
      setEmailError('');
      return;
    }
    
    // Validate email format
    if (!validation.validateEmail(newEmail)) {
      setEmailError('Please enter a valid email address');
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!role) {
      toastService.showErrorToast(
        'Please select a role',
        'Select your role to continue'
      );
      return;
    }

    if (!email) {
      toastService.showErrorToast(
        'Email required',
        'Please enter your email address'
      );
      return;
    }

    // Validate email before submission
    if (!validation.validateEmail(email)) {
      toastService.showErrorToast(
        'Invalid email',
        'Please enter a valid email address'
      );
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!privacyAccepted) {
      toastService.showErrorToast(
        'Privacy policy acceptance required',
        'Please accept our privacy policy to continue'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // Check if email is already on waitlist
      const isExisting = await waitlistService.checkWaitlistStatus(email);
      
      if (isExisting) {
        toastService.showSuccessToast(
          'You\'re already on our list!',
          'We\'ll notify you when PropAgentic is ready for your role.'
        );
        setIsSubmitted(true);
        
        // Track duplicate signup attempt
        await errorHandling.safeAsync(
          () => analyticsService.trackEvent(
            'early_access_duplicate_attempt', 
            currentUser?.uid || null,
            { email, role }
          ),
          'Failed to track duplicate signup',
          { showToast: false }
        );
        
        return;
      }
      
      // Add to waitlist with early access flag
      const result = await waitlistService.addToWaitlist({
        email,
        role,
        source: 'early_access_landing',
        userId: currentUser?.uid || null,
        subscribed_to_newsletter: true,
        marketing_consent: true,
        early_access: true
      });

      // Track successful early access signup
      await errorHandling.safeAsync(
        () => analyticsService.trackWaitlistSignup(
          email,
          role,
          currentUser?.uid || null,
          'early_access_landing'
        ),
        'Failed to track waitlist signup',
        { showToast: false }
      );

      if (result === 'existing') {
        toastService.showSuccessToast(
          'You\'re already on our list!',
          'We\'ll notify you when PropAgentic is ready for your role.'
        );
      } else {
        toastService.showSuccessToast(
          'Welcome to Early Access!',
          'You\'re now on our priority list. We\'ll notify you first when PropAgentic launches.'
        );
      }
      
      setIsSubmitted(true);
    } catch (error) {
      console.error('Early Access Signup Error:', error);
      console.error('Error details:', {
        code: (error as any)?.code,
        message: (error as any)?.message,
        details: (error as any)?.details
      });
      
      errorHandling.handleError(
        error,
        'Failed to join early access',
        {
          userId: currentUser?.uid || null,
          context: { email, role },
          errorSource: 'early_access_signup'
        }
      );
    } finally {
      setIsSubmitting(false);
    }
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
    position: 'relative' as const
  };

  // Floating particles effect
  const FloatingParticle = ({ delay, duration, x, y }: { delay: number; duration: number; x: number; y: number }) => (
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
                                delay={(i || 0) * 0.8}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome to Early Access!</h2>
            <p className="text-gray-600 mb-4">
              You're now on our priority list! We'll notify you first when PropAgentic is ready for {role === 'landlord' ? 'landlords' : role === 'tenant' ? 'tenants' : 'contractors'}.
            </p>
            <p className="text-sm text-gray-500">
              Keep an eye on your inbox at <strong>{email}</strong>
            </p>
            <div className="mt-6 p-4 bg-orange-50 rounded-xl">
              <p className="text-sm text-orange-800 font-medium">
                🚀 Early Access Perks:
              </p>
              <ul className="text-xs text-orange-700 mt-2 space-y-1">
                <li>• First access to new features</li>
                <li>• Priority customer support</li>
                <li>• Exclusive updates and insights</li>
              </ul>
            </div>
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
                              delay={(i || 0) * 0.6}
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
          <p className="text-gray-600 text-sm">You're invited to experience PropAgentic first</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select your role:
            </label>
            <RadioGroup 
              value={role} 
              onValueChange={setRole} 
              className="space-y-3"
            >
              {[
                { value: 'landlord', label: 'Landlord / Property Owner', icon: '🏠' },
                { value: 'tenant', label: 'Tenant', icon: '🏡' },
                { value: 'contractor', label: 'Contractor / Service Provider', icon: '🔧' }
              ].map((item) => (
                <label key={item.value} className="flex items-center p-3 rounded-xl border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all duration-200 cursor-pointer">
                  <RadioGroupItem
                    value={item.value}
                    id={item.value}
                    className="w-4 h-4 text-orange-600 border-gray-300 focus:ring-orange-500"
                  />
                  <span className="ml-3 text-xl">{item.icon}</span>
                  <span className="ml-2 text-gray-700 font-medium">{item.label}</span>
                </label>
              ))}
            </RadioGroup>
          </div>

          {/* Email Input */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-gray-700 text-sm font-medium">
              Email address
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={handleEmailChange}
              className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200 text-gray-900 placeholder-gray-500 bg-white ${
                emailError ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
              }`}
              error={!!emailError}
            />
            {emailError && (
              <p className="text-xs text-red-500 mt-1">{emailError}</p>
            )}
          </div>

          {/* Privacy Policy */}
          <div className="flex items-start space-x-2">
            <div className="flex items-center h-5 mt-1">
              <Checkbox
                id="privacy-policy"
                checked={privacyAccepted}
                onChange={setPrivacyAccepted}
              />
            </div>
            <div className="ml-2">
              <Label htmlFor="privacy-policy" className="text-xs text-gray-700">
                I agree to the{' '}
                <a
                  href="/privacy-policy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-orange-600 hover:text-orange-700 underline"
                >
                  Privacy Policy
                </a>{' '}
                and consent to receiving updates about PropAgentic.
              </Label>
            </div>
          </div>

          {/* Submit Button */}
          <motion.button
            type="submit"
            disabled={isSubmitting || !!emailError || !privacyAccepted}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:from-orange-300 disabled:to-orange-400 text-white font-semibold py-4 px-4 rounded-xl transition-all duration-200 flex items-center justify-center shadow-lg"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                Joining Early Access...
              </>
            ) : (
              <>
                <span>Join Early Access</span>
                <span className="ml-2">🚀</span>
              </>
            )}
          </motion.button>

          {/* Description */}
          <div className="text-center">
            <p className="text-xs text-gray-500 leading-relaxed mb-2">
              Get priority access to PropAgentic when it launches.
            </p>
            <div className="inline-flex items-center gap-2 text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Early Access Privilege
            </div>
          </div>
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
          © {new Date().getFullYear()} PropAgentic. All rights reserved.
        </p>
      </motion.div>
    </div>
  );
};

export default LandingPage; 