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
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        Payment Account Setup
      </h4>

      <p className="text-gray-600 mb-6">
        Set up your payment account to receive payments for completed jobs. This process is secure and handled by Stripe.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-medium">Payment Setup Notice</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {accountStatus.isEnabled ? (
          <div className="flex items-center p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <svg
              className="h-5 w-5 mr-3 text-green-600"
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">Your payment account is active and ready to receive payments</span>
          </div>
        ) : accountStatus.needsRefresh ? (
          <div>
            <p className="text-gray-600 mb-4">
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