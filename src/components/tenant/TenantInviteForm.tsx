import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import inviteCodeService from '../../services/inviteCodeService';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { ExclamationCircleIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toastService from '../../services/toastService';

interface TenantInviteFormProps {
  onInviteValidated: (propertyInfo: {
    propertyId: string;
    propertyName: string;
    unitId?: string | null;
    inviteCode: string;
  }) => void;
  email?: string;
  className?: string;
  showSkip?: boolean;
  onSkip?: () => void;
}

/**
 * Form component for entering and validating invite codes
 */
const TenantInviteForm: React.FC<TenantInviteFormProps> = ({
  onInviteValidated,
  email,
  className = '',
  showSkip = false,
  onSkip
}) => {
  const { currentUser } = useAuth();
  const [inviteCode, setInviteCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Auto-format invite code as user types (uppercase, no spaces)
  const handleInviteCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/\s/g, '');
    setInviteCode(value);
    
    // Clear validation message when user edits the code
    if (validationMessage) {
      setValidationMessage(null);
    }
  };

  // Validate the invite code
  const validateCode = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!inviteCode.trim()) {
      setValidationMessage({
        type: 'error',
        message: 'Please enter an invite code'
      });
      return;
    }

    setIsValidating(true);
    setValidationMessage(null);

    try {
      console.log('🔍 Starting invite code validation for:', inviteCode.trim());
      console.log('🔍 Current user:', currentUser?.uid, currentUser?.email);
      
      const validationResult = await inviteCodeService.validateInviteCode(inviteCode.trim());
      
      console.log('🔍 Validation result:', validationResult);
      
      if (validationResult.isValid) {
        console.log('✅ Code is valid!');
        setValidationMessage({
          type: 'success',
          message: 'Valid invite code!'
        });
        
        // Check if code has email restriction
        if (validationResult.restrictedEmail && email && 
            validationResult.restrictedEmail.toLowerCase() !== email.toLowerCase()) {
          console.log('❌ Email restriction failed:', {
            restrictedEmail: validationResult.restrictedEmail,
            userEmail: email
          });
          setValidationMessage({
            type: 'error',
            message: `This invite code is restricted to ${validationResult.restrictedEmail}`
          });
          return;
        }
        
        console.log('🚀 Notifying parent component with property info');
        // Notify parent component that we have a valid invite code
        onInviteValidated({
          propertyId: validationResult.propertyId!,
          propertyName: validationResult.propertyName || 'Property',
          unitId: validationResult.unitId,
          inviteCode: inviteCode.trim()
        });
      } else {
        console.log('❌ Code validation failed:', validationResult.message);
        setValidationMessage({
          type: 'error',
          message: validationResult.message
        });
      }
    } catch (error: any) {
      console.error('💥 Error validating invite code:', error);
      console.error('💥 Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      setValidationMessage({
        type: 'error',
        message: error.message || 'Error validating invite code. Please try again.'
      });
    } finally {
      setIsValidating(false);
    }
  };

  // Handle skip action
  const handleSkip = () => {
    if (showSkip && onSkip) {
      toastService.showInfoToast(
        'Invite Code Skipped',
        'You can add a property later from your dashboard'
      );
      onSkip();
    }
  };

  return (
    <div className={`${className}`}>
      <form onSubmit={validateCode} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="invite-code" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Enter your invite code
          </label>
          
          <div className="relative">
            <Input
              id="invite-code"
              type="text"
              value={inviteCode}
              onChange={handleInviteCodeChange}
              placeholder="Enter the 8-character code (e.g., ABCD1234)"
              maxLength={12}
              autoComplete="off"
              disabled={isValidating}
              className={`w-full px-4 py-3 font-mono ${
                validationMessage?.type === 'error'
                  ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  : validationMessage?.type === 'success'
                  ? 'border-green-500 focus:border-green-500 focus:ring-green-500'
                  : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
              }`}
              aria-invalid={validationMessage?.type === 'error'}
              aria-describedby={validationMessage ? 'invite-code-feedback' : undefined}
            />
            
            {validationMessage && (
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                {validationMessage.type === 'success' ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ExclamationCircleIcon className="h-5 w-5 text-red-500" />
                )}
              </div>
            )}
          </div>
          
          {validationMessage && (
            <p
              id="invite-code-feedback"
              className={`text-sm ${
                validationMessage.type === 'success' ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {validationMessage.message}
            </p>
          )}
          
          <div className="text-xs space-y-1">
            <p className="text-gray-500 dark:text-gray-400">
            Your invite code should have been provided by your landlord or property manager.
          </p>
            <p className="text-gray-500 dark:text-gray-400">
              If you received an invitation by email, the 8-character code is displayed in the email.
            </p>
          </div>
        </div>
        
        <div className={`flex ${showSkip ? 'justify-between' : 'justify-end'} space-x-4`}>
          {showSkip && (
            <Button
              type="button"
              onClick={handleSkip}
              variant="secondary"
              disabled={isValidating}
              className="px-4 py-2 text-sm"
            >
              Skip for now
            </Button>
          )}
          
          <Button
            type="submit"
            variant="primary"
            isLoading={isValidating}
            className="px-6 py-2"
          >
            {isValidating ? 'Validating...' : 'Validate Code'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default TenantInviteForm; 