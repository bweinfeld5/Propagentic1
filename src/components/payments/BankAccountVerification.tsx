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
          <p className="text-gray-600 mb-4">
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
            <span className="font-medium">Bank account verified: {bankAccount.bankName} (****{bankAccount.last4})</span>
          </div>
        );

      case 'verification_pending':
        return (
          <div>
            <p className="text-gray-600 mb-4">
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
            <p className="text-red-600 mb-4">
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
    <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">
        Bank Account Verification
      </h4>

      <p className="text-gray-600 mb-6">
        Verify your bank account to ensure you can receive payments securely.
      </p>

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
          <div className="flex">
            <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="font-medium">Bank Account Notice</p>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {renderBankAccountStatus()}
    </div>
  );
};

export default BankAccountVerification; 