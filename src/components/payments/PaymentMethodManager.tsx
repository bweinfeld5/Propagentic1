import React, { useState, useEffect } from 'react';
import {
  CreditCardIcon,
  BanknotesIcon,
  PlusIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ShieldCheckIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { paymentService, PaymentMethod as BasePaymentMethod } from '../../services/paymentService';
import { useAuth } from '../../context/AuthContext';

// Extend the base PaymentMethod with UI-specific fields
interface PaymentMethod extends BasePaymentMethod {
  isVerified?: boolean;
  createdAt?: Date;
  accountType?: 'checking' | 'savings';
}

interface PaymentMethodManagerProps {
  onPaymentMethodAdded?: (paymentMethod: PaymentMethod) => void;
}

const PaymentMethodManager: React.FC<PaymentMethodManagerProps> = ({
  onPaymentMethodAdded
}) => {
  const { currentUser } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addingType, setAddingType] = useState<'card' | 'bank_account'>('card');
  const [error, setError] = useState<string | null>(null);
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  
  // Form states
  const [cardData, setCardData] = useState({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const [bankData, setBankData] = useState({
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking' as 'checking' | 'savings',
    accountHolderName: ''
  });

  const [showCvv, setShowCvv] = useState(false);
  const [showAccountNumber, setShowAccountNumber] = useState(false);

  useEffect(() => {
    if (currentUser) {
      loadPaymentMethods();
    }
  }, [currentUser]);

  const loadPaymentMethods = async () => {
    if (!currentUser) return;
    
    try {
      setLoading(true);
      const response = await paymentService.getPaymentMethods(currentUser.uid);
      
      // Map service response to local interface
      const mappedMethods: PaymentMethod[] = (response.paymentMethods || []).map(method => ({
        ...method,
        isVerified: true, // Assume verified for demo
        createdAt: new Date(),
        accountType: method.type === 'bank_account' ? 'checking' as const : undefined
      }));
      
      setPaymentMethods(mappedMethods);
      setError(null);
    } catch (err) {
      console.error('Error loading payment methods:', err);
      setError('Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = async () => {
    if (!currentUser) return;
    
    try {
      setProcessingAction('add_card');
      setError(null);

      // Validate form
      if (!cardData.number || !cardData.expiry || !cardData.cvc || !cardData.name) {
        throw new Error('All card fields are required');
      }

      // Create setup intent for new card
      const setupIntentResponse = await paymentService.createSetupIntent(currentUser.uid);
      
      // In a real implementation, you would use Stripe.js to handle the card details
      // For now, we'll simulate success
      console.log('Setup intent created:', setupIntentResponse.clientSecret);
      
      // Simulate adding the card
      const newCard: PaymentMethod = {
        id: `card_${Date.now()}`,
        type: 'card',
        last4: cardData.number.slice(-4),
        brand: 'visa', // Would be determined by Stripe
        expiryMonth: parseInt(cardData.expiry.split('/')[0]),
        expiryYear: parseInt(`20${cardData.expiry.split('/')[1]}`),
        isDefault: paymentMethods.length === 0,
        isVerified: true,
        createdAt: new Date()
      };

      setPaymentMethods(prev => [...prev, newCard]);
      onPaymentMethodAdded?.(newCard);
      setShowAddModal(false);
      
      // Reset form
      setCardData({
        number: '',
        expiry: '',
        cvc: '',
        name: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add card');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleAddBankAccount = async () => {
    if (!currentUser) return;
    
    try {
      setProcessingAction('add_bank');
      setError(null);

      // Validate form
      if (!bankData.routingNumber || !bankData.accountNumber || !bankData.accountHolderName) {
        throw new Error('All bank account fields are required');
      }

      // In a real implementation, you would verify the bank account
      // For now, we'll simulate success
      const newBankAccount: PaymentMethod = {
        id: `bank_${Date.now()}`,
        type: 'bank_account',
        last4: bankData.accountNumber.slice(-4),
        bankName: 'Example Bank', // Would be determined by routing number
        accountType: bankData.accountType,
        isDefault: paymentMethods.length === 0,
        isVerified: false, // Bank accounts need verification
        createdAt: new Date()
      };

      setPaymentMethods(prev => [...prev, newBankAccount]);
      onPaymentMethodAdded?.(newBankAccount);
      setShowAddModal(false);
      
      // Reset form
      setBankData({
        routingNumber: '',
        accountNumber: '',
        accountType: 'checking',
        accountHolderName: ''
      });
    } catch (err: any) {
      setError(err.message || 'Failed to add bank account');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleSetDefault = async (paymentMethodId: string) => {
    if (!currentUser) return;
    
    try {
      setProcessingAction(`set_default_${paymentMethodId}`);
      await paymentService.setDefaultPaymentMethod(currentUser.uid, paymentMethodId);
      
      // Update local state
      setPaymentMethods(prev => prev.map(pm => ({
        ...pm,
        isDefault: pm.id === paymentMethodId
      })));
    } catch (err) {
      console.error('Error setting default payment method:', err);
      setError('Failed to set default payment method');
    } finally {
      setProcessingAction(null);
    }
  };

  const handleRemove = async (paymentMethodId: string) => {
    if (!currentUser) return;
    
    if (!window.confirm('Are you sure you want to remove this payment method?')) {
      return;
    }
    
    try {
      setProcessingAction(`remove_${paymentMethodId}`);
      await paymentService.removePaymentMethod(currentUser.uid, paymentMethodId);
      
      // Remove from local state
      setPaymentMethods(prev => prev.filter(pm => pm.id !== paymentMethodId));
    } catch (err) {
      console.error('Error removing payment method:', err);
      setError('Failed to remove payment method');
    } finally {
      setProcessingAction(null);
    }
  };

  const formatCardNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add spaces every 4 digits
    return digits.replace(/(\d{4})(?=\d)/g, '$1 ').slice(0, 19);
  };

  const formatExpiry = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '');
    // Add slash after 2 digits
    if (digits.length >= 2) {
      return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
    }
    return digits;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Payment Methods</h2>
          <p className="text-gray-600">Manage your cards and bank accounts for payments</p>
        </div>
        <Button variant="primary" onClick={() => setShowAddModal(true)}>
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        </div>
      )}

      {/* Payment Methods List */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          {paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <CreditCardIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
              <p className="text-gray-600 mb-4">Add a credit card or bank account to make payments</p>
              <Button variant="primary" onClick={() => setShowAddModal(true)}>
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {method.type === 'card' ? (
                          <CreditCardIcon className="w-6 h-6 text-gray-600" />
                        ) : (
                          <BanknotesIcon className="w-6 h-6 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium text-gray-900">
                            {method.type === 'card' 
                              ? `${method.brand?.toUpperCase()} ****${method.last4}`
                              : `${method.bankName || 'Bank'} ****${method.last4}`
                            }
                          </h4>
                          {method.isDefault && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              Default
                            </span>
                          )}
                          {method.isVerified && (
                            <ShieldCheckIcon className="w-4 h-4 text-green-500" />
                          )}
                        </div>
                        <div className="text-sm text-gray-600">
                          {method.type === 'card' && method.expiryMonth && method.expiryYear && (
                            <span>Expires {method.expiryMonth.toString().padStart(2, '0')}/{method.expiryYear}</span>
                          )}
                          {method.type === 'bank_account' && method.accountType && (
                            <span className="capitalize">{method.accountType} account</span>
                          )}
                          {!method.isVerified && (
                            <span className="text-yellow-600 ml-2">• Verification required</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {!method.isDefault && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSetDefault(method.id)}
                          disabled={processingAction !== null}
                        >
                          {processingAction === `set_default_${method.id}` ? 'Setting...' : 'Set Default'}
                        </Button>
                      )}
                      <button
                        onClick={() => handleRemove(method.id)}
                        disabled={processingAction !== null}
                        className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Payment Method Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={() => setShowAddModal(false)} />
            
            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              {/* Header */}
              <div className="bg-white px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add Payment Method</h3>
              </div>

              {/* Content */}
              <div className="px-6 py-4">
                {/* Type Selection */}
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">Payment Type</label>
                  <div className="flex gap-3">
                    <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                      addingType === 'card' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="card"
                        checked={addingType === 'card'}
                        onChange={(e) => setAddingType(e.target.value as 'card')}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <CreditCardIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <div className="font-medium">Credit/Debit Card</div>
                      </div>
                    </label>
                    <label className={`flex-1 p-4 border rounded-lg cursor-pointer transition-colors ${
                      addingType === 'bank_account' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                    }`}>
                      <input
                        type="radio"
                        value="bank_account"
                        checked={addingType === 'bank_account'}
                        onChange={(e) => setAddingType(e.target.value as 'bank_account')}
                        className="sr-only"
                      />
                      <div className="text-center">
                        <BanknotesIcon className="w-8 h-8 mx-auto mb-2 text-gray-600" />
                        <div className="font-medium">Bank Account</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Card Form */}
                {addingType === 'card' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
                      <input
                        type="text"
                        value={cardData.number}
                        onChange={(e) => setCardData(prev => ({ ...prev, number: formatCardNumber(e.target.value) }))}
                        placeholder="1234 5678 9012 3456"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={19}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Expiry Date</label>
                        <input
                          type="text"
                          value={cardData.expiry}
                          onChange={(e) => setCardData(prev => ({ ...prev, expiry: formatExpiry(e.target.value) }))}
                          placeholder="MM/YY"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          maxLength={5}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">CVC</label>
                        <input
                          type="text"
                          value={cardData.cvc}
                          onChange={(e) => setCardData(prev => ({ ...prev, cvc: e.target.value.replace(/\D/g, '') }))}
                          placeholder="123"
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          maxLength={4}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Cardholder Name</label>
                      <input
                        type="text"
                        value={cardData.name}
                        onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Full name as it appears on card"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}

                {/* Bank Account Form */}
                {addingType === 'bank_account' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Holder Name</label>
                      <input
                        type="text"
                        value={bankData.accountHolderName}
                        onChange={(e) => setBankData(prev => ({ ...prev, accountHolderName: e.target.value }))}
                        placeholder="Full name on account"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Routing Number</label>
                      <input
                        type="text"
                        value={bankData.routingNumber}
                        onChange={(e) => setBankData(prev => ({ ...prev, routingNumber: e.target.value.replace(/\D/g, '') }))}
                        placeholder="9-digit routing number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        maxLength={9}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Number</label>
                      <input
                        type="text"
                        value={bankData.accountNumber}
                        onChange={(e) => setBankData(prev => ({ ...prev, accountNumber: e.target.value.replace(/\D/g, '') }))}
                        placeholder="Account number"
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                      <select
                        value={bankData.accountType}
                        onChange={(e) => setBankData(prev => ({ ...prev, accountType: e.target.value as any }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="checking">Checking</option>
                        <option value="savings">Savings</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowAddModal(false)}
                  disabled={processingAction !== null}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={addingType === 'card' ? handleAddCard : handleAddBankAccount}
                  disabled={processingAction !== null}
                >
                  {processingAction ? 'Adding...' : 'Add Payment Method'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodManager; 