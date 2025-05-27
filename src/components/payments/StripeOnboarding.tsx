import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStripe, isStripeConfigured } from '../../firebase/stripeConfig';
import { callFunction } from '../../firebase/config';
import Button from '../ui/Button';

interface StripeOnboardingProps {
  onComplete?: () => void;
}

const StripeOnboarding: React.FC<StripeOnboardingProps> = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accountStatus, setAccountStatus] = useState<{
    isEnabled: boolean;
    needsOnboarding: boolean;
    needsRefresh: boolean;
  }>({
    isEnabled: false,
    needsOnboarding: true,
    needsRefresh: false
  });

  // Check Stripe account status on mount and after onboarding
  useEffect(() => {
    if (currentUser?.uid) {
      checkAccountStatus();
    }
  }, [currentUser]);

  const checkAccountStatus = async () => {
    try {
      const result = await callFunction('getStripeAccountStatus', {
        userId: currentUser?.uid
      }) as {
        isEnabled: boolean;
        needsOnboarding: boolean;
        needsRefresh: boolean;
      };
      
      setAccountStatus({
        isEnabled: result.isEnabled,
        needsOnboarding: result.needsOnboarding,
        needsRefresh: result.needsRefresh
      });

      if (result.isEnabled && !result.needsOnboarding && !result.needsRefresh) {
        onComplete?.();
      }
    } catch (err) {
      console.error('Error checking account status:', err);
      // Check if this is a CORS or function not found error
      const errorMessage = (err as any)?.message || '';
      if (errorMessage.includes('internal') || errorMessage.includes('CORS') || errorMessage.includes('net::ERR_FAILED')) {
        setError('Payment functions are being deployed. Please skip this step for now and return later to complete payment setup.');
      } else {
        setError('Failed to check account status. Please try again.');
      }
    }
  };

  const handleStartOnboarding = async () => {
    if (!isStripeConfigured()) {
      setError('Stripe is not properly configured');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create or get Stripe Connect account link
      const { accountLinkUrl } = await callFunction('createStripeAccountLink', {
        userId: currentUser?.uid,
        returnUrl: `${window.location.origin}/contractor/onboarding/stripe/return`,
        refreshUrl: `${window.location.origin}/contractor/onboarding/stripe/refresh`
      }) as { accountLinkUrl: string };

      // Redirect to Stripe Connect onboarding
      window.location.href = accountLinkUrl;
    } catch (err) {
      console.error('Error starting onboarding:', err);
      const errorMessage = (err as any)?.message || '';
      if (errorMessage.includes('internal') || errorMessage.includes('CORS') || errorMessage.includes('net::ERR_FAILED')) {
        setError('Payment functions are being deployed. Please skip this step for now and return later to complete payment setup.');
      } else {
        setError('Failed to start onboarding process. Please try again.');
      }
      setLoading(false);
    }
  };

  const handleRefreshAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      const { accountLinkUrl } = await callFunction('refreshStripeAccount', {
        userId: currentUser?.uid,
        returnUrl: `${window.location.origin}/contractor/onboarding/stripe/return`,
        refreshUrl: `${window.location.origin}/contractor/onboarding/stripe/refresh`
      }) as { accountLinkUrl: string };

      window.location.href = accountLinkUrl;
    } catch (err) {
      console.error('Error refreshing account:', err);
      setError('Failed to refresh account. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-background-darkSubtle rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-content dark:text-content-dark mb-4">
        Payment Account Setup
      </h2>

      {error && (
        <div className="mb-4 bg-error/10 border-l-4 border-error text-error p-4 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {accountStatus.isEnabled ? (
          <div className="flex items-center text-success">
            <svg
              className="h-5 w-5 mr-2"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            <span>Your payment account is active</span>
          </div>
        ) : accountStatus.needsRefresh ? (
          <div>
            <p className="text-content-secondary dark:text-content-darkSecondary mb-4">
              Your account needs attention. Please complete the verification process to receive payments.
            </p>
            <Button
              variant="primary"
              onClick={handleRefreshAccount}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Complete Verification'}
            </Button>
          </div>
        ) : (
          <div>
            <p className="text-content-secondary dark:text-content-darkSecondary mb-4">
              Set up your payment account to receive payments for completed jobs. This process is secure and handled by Stripe.
            </p>
            <div className="space-y-3">
              <Button
                variant="primary"
                onClick={handleStartOnboarding}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Processing...' : 'Set Up Payment Account'}
              </Button>
              
              {error && error.includes('being deployed') && (
                <Button
                  variant="secondary"
                  onClick={() => {
                    setAccountStatus(prev => ({ ...prev, isEnabled: true }));
                    onComplete?.();
                  }}
                  className="w-full"
                >
                  Skip for Now (Return Later)
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StripeOnboarding; 