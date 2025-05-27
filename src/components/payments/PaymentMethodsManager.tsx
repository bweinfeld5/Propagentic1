import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStripe } from '../../firebase/stripeConfig';
import { callFunction } from '../../firebase/config';
import Button from '../ui/Button';

interface PaymentMethod {
  id: string;
  type: string;
  last4: string;
  brand?: string;
  bankName?: string;
  isDefault: boolean;
  expiryMonth?: number;
  expiryYear?: number;
}

interface PaymentMethodsManagerProps {
  onComplete?: () => void;
}

const PaymentMethodsManager: React.FC<PaymentMethodsManagerProps> = ({ onComplete }) => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    if (currentUser?.uid) {
      fetchPaymentMethods();
    }
  }, [currentUser]);

  const fetchPaymentMethods = async () => {
    try {
      const result = await callFunction('getStripePaymentMethods', {
        userId: currentUser?.uid
      }) as { paymentMethods: PaymentMethod[] };

      setPaymentMethods(result.paymentMethods || []);
    } catch (err) {
      console.error('Error fetching payment methods:', err);
      const errorMessage = (err as any)?.message || '';
      if (errorMessage.includes('internal') || errorMessage.includes('CORS') || errorMessage.includes('net::ERR_FAILED')) {
        setError('Payment functions are being deployed. Please skip this step for now and return later to complete payment setup.');
      } else {
        setError('Failed to fetch payment methods');
      }
    }
  };

  const handleAddPaymentMethod = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get setup intent client secret from our backend
      const { clientSecret } = await callFunction('createSetupIntent', {
        userId: currentUser?.uid
      }) as { clientSecret: string };

      // Initialize Stripe
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe is not properly configured');
      }

      // Redirect to Stripe's payment method setup
      const { error: setupError } = await stripe.confirmSetup({
        clientSecret,
        confirmParams: {
          return_url: `${window.location.origin}/contractor/payment-methods/return`
        }
      });

      if (setupError) {
        throw setupError;
      }
    } catch (err) {
      console.error('Error adding payment method:', err);
      setError('Failed to add payment method. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefaultPaymentMethod = async (paymentMethodId: string) => {
    setLoading(true);
    setError(null);

    try {
      await callFunction('setDefaultPaymentMethod', {
        userId: currentUser?.uid,
        paymentMethodId
      });

      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error setting default payment method:', err);
      setError('Failed to set default payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleRemovePaymentMethod = async (paymentMethodId: string) => {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await callFunction('removePaymentMethod', {
        userId: currentUser?.uid,
        paymentMethodId
      });

      await fetchPaymentMethods();
    } catch (err) {
      console.error('Error removing payment method:', err);
      setError('Failed to remove payment method');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentMethodItem = (method: PaymentMethod) => {
    const isCard = method.type === 'card';
    const isBankAccount = method.type === 'bank_account';

    return (
      <div
        key={method.id}
        className={`flex items-center justify-between p-4 border rounded-lg ${
          method.isDefault ? 'border-primary' : 'border-border dark:border-border-dark'
        }`}
      >
        <div className="flex items-center space-x-4">
          {/* Icon based on payment method type */}
          <div className="text-content-secondary dark:text-content-darkSecondary">
            {isCard ? (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h.01M11 15h.01M15 15h.01M19 15h.01M7 12h.01M11 12h.01M15 12h.01M19 12h.01M3 10h18M3 6h18" />
              </svg>
            ) : (
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
              </svg>
            )}
          </div>

          {/* Payment method details */}
          <div>
            {isCard && (
              <div className="text-content dark:text-content-dark">
                {method.brand} •••• {method.last4}
                <span className="text-sm text-content-secondary dark:text-content-darkSecondary ml-2">
                  Expires {method.expiryMonth}/{method.expiryYear}
                </span>
              </div>
            )}
            {isBankAccount && (
              <div className="text-content dark:text-content-dark">
                {method.bankName} •••• {method.last4}
              </div>
            )}
            {method.isDefault && (
              <span className="text-sm text-primary dark:text-primary-light">
                Default payment method
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2">
          {!method.isDefault && (
            <Button
              variant="outline"
              onClick={() => handleSetDefaultPaymentMethod(method.id)}
              disabled={loading}
              className="text-sm"
            >
              Set as Default
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => handleRemovePaymentMethod(method.id)}
            disabled={loading || method.isDefault}
            className="text-sm text-error hover:text-error-dark"
          >
            Remove
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-background-darkSubtle rounded-lg shadow p-6">
      <h2 className="text-2xl font-bold text-content dark:text-content-dark mb-4">
        Payment Methods
      </h2>

      {error && (
        <div className="mb-4 bg-error/10 border-l-4 border-error text-error p-4 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <p className="text-content-secondary dark:text-content-darkSecondary">
            No payment methods added yet.
          </p>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map(renderPaymentMethodItem)}
          </div>
        )}

        <div className="space-y-3 mt-4">
          <Button
            variant="primary"
            onClick={handleAddPaymentMethod}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Processing...' : 'Add Payment Method'}
          </Button>
          
          {error && error.includes('being deployed') && (
            <Button
              variant="secondary"
              onClick={() => {
                setPaymentMethods([{ id: 'temp', type: 'card', last4: '0000', brand: 'Setup Pending', isDefault: true }]);
                onComplete?.();
              }}
              className="w-full"
            >
              Skip for Now (Return Later)
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PaymentMethodsManager; 