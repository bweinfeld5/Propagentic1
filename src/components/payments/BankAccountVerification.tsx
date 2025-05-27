import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStripe } from '../../firebase/stripeConfig';
import { callFunction } from '../../firebase/config';
import Button from '../ui/Button';

interface BankAccountVerificationProps {
  onComplete?: () => void;
}

const BankAccountVerification: React.FC<BankAccountVerificationProps> = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bankAccount, setBankAccount] = useState<{
    last4: string;
    bankName: string;
    status: 'new' | 'verified' | 'verification_failed' | 'verification_pending';
  } | null>(null);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchBankAccountStatus();
    }
  }, [currentUser]);

  const fetchBankAccountStatus = async () => {
    try {
      const result = await callFunction('getStripeBankAccountStatus', {
        userId: currentUser?.uid
      }) as {
        bankAccount: {
          last4: string;
          bankName: string;
          status: 'new' | 'verified' | 'verification_failed' | 'verification_pending';
        } | null;
      };

      if (result.bankAccount) {
        setBankAccount(result.bankAccount);
        if (result.bankAccount.status === 'verified') {
          onComplete?.();
        }
      }
    } catch (err) {
      console.error('Error fetching bank account status:', err);
      const errorMessage = (err as any)?.message || '';
      if (errorMessage.includes('internal') || errorMessage.includes('CORS') || errorMessage.includes('net::ERR_FAILED')) {
        setError('Payment functions are being deployed. Please skip this step for now and return later to complete payment setup.');
      } else {
        setError('Failed to fetch bank account status');
      }
    }
  };

  const handleAddBankAccount = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get the bank account token setup link from our backend
      const { setupUrl } = await callFunction('createBankAccountSetupLink', {
        userId: currentUser?.uid,
        returnUrl: `${window.location.origin}/contractor/onboarding/bank/return`,
        refreshUrl: `${window.location.origin}/contractor/onboarding/bank/refresh`
      }) as { setupUrl: string };

      // Redirect to Stripe's bank account setup
      window.location.href = setupUrl;
    } catch (err) {
      console.error('Error setting up bank account:', err);
      setError('Failed to set up bank account. Please try again.');
      setLoading(false);
    }
  };

  const handleVerifyMicroDeposits = async () => {
    setLoading(true);
    setError(null);

    try {
      const amount1 = prompt('Enter the first micro-deposit amount (e.g., 0.32):');
      const amount2 = prompt('Enter the second micro-deposit amount (e.g., 0.45):');

      if (!amount1 || !amount2) {
        setError('Please enter both micro-deposit amounts');
        setLoading(false);
        return;
      }

      await callFunction('verifyBankAccountMicroDeposits', {
        userId: currentUser?.uid,
        amounts: [parseFloat(amount1), parseFloat(amount2)]
      });

      await fetchBankAccountStatus();
    } catch (err) {
      console.error('Error verifying micro-deposits:', err);
      setError('Failed to verify micro-deposits. Please check the amounts and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderBankAccountStatus = () => {
    if (!bankAccount) {
      return (
        <div>
          <p className="text-content-secondary dark:text-content-darkSecondary mb-4">
            Add your bank account to receive payments for completed jobs.
          </p>
          <div className="space-y-3">
            <Button
              variant="primary"
              onClick={handleAddBankAccount}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Add Bank Account'}
            </Button>
            
            {error && error.includes('being deployed') && (
              <Button
                variant="secondary"
                onClick={() => {
                  setBankAccount({ last4: '0000', bankName: 'Setup Pending', status: 'verified' });
                  onComplete?.();
                }}
                className="w-full"
              >
                Skip for Now (Return Later)
              </Button>
            )}
          </div>
        </div>
      );
    }

    switch (bankAccount.status) {
      case 'verified':
        return (
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
            <span>Bank account verified: {bankAccount.bankName} (****{bankAccount.last4})</span>
          </div>
        );

      case 'verification_pending':
        return (
          <div>
            <p className="text-content-secondary dark:text-content-darkSecondary mb-4">
              Two small deposits have been made to your account. Once you see them, enter the amounts here to verify your account.
            </p>
            <Button
              variant="primary"
              onClick={handleVerifyMicroDeposits}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Verifying...' : 'Verify Micro-deposits'}
            </Button>
          </div>
        );

      case 'verification_failed':
        return (
          <div>
            <p className="text-error mb-4">
              Bank account verification failed. Please try adding your account again.
            </p>
            <Button
              variant="primary"
              onClick={handleAddBankAccount}
              disabled={loading}
              className="w-full"
            >
              {loading ? 'Processing...' : 'Try Again'}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-background-darkSubtle rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-content dark:text-content-dark mb-4">
        Bank Account Verification
      </h2>

      {error && (
        <div className="mb-4 bg-error/10 border-l-4 border-error text-error p-4 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {renderBankAccountStatus()}
      </div>
    </div>
  );
};

export default BankAccountVerification; 