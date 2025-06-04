/**
 * ConfirmationDialog Component - PropAgentic Design System
 * 
 * Prevents accidental deletions and critical actions with clear confirmation.
 * Includes various confirmation patterns and accessibility features.
 */

import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { 
  ExclamationTriangleIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
  ShieldExclamationIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import AccessibleButton from './AccessibleButton';
import AccessibleInput from './AccessibleInput';
import AccessibleModal from './AccessibleModal';
import { ScaleIn, FadeIn } from './SafeMotion';
import { darkModeClasses } from '../../design-system/dark-mode';
import { useAccessibility } from '../../design-system/accessibility';

// Predefined confirmation types
const confirmationTypes = {
  delete: {
    icon: TrashIcon,
    title: 'Delete Item',
    description: 'This action cannot be undone. Are you sure you want to delete this item?',
    confirmText: 'Delete',
    confirmVariant: 'danger',
    iconColor: 'text-red-500',
    requiresConfirmation: true
  },
  
  destructive: {
    icon: ExclamationTriangleIcon,
    title: 'Destructive Action',
    description: 'This action will make permanent changes. Are you sure you want to continue?',
    confirmText: 'Continue',
    confirmVariant: 'danger',
    iconColor: 'text-orange-500',
    requiresConfirmation: true
  },
  
  warning: {
    icon: ShieldExclamationIcon,
    title: 'Warning',
    description: 'Please confirm that you want to proceed with this action.',
    confirmText: 'Proceed',
    confirmVariant: 'primary',
    iconColor: 'text-yellow-500',
    requiresConfirmation: false
  },
  
  info: {
    icon: InformationCircleIcon,
    title: 'Confirmation',
    description: 'Please confirm your action.',
    confirmText: 'Confirm',
    confirmVariant: 'primary',
    iconColor: 'text-blue-500',
    requiresConfirmation: false
  },
  
  save: {
    icon: CheckIcon,
    title: 'Save Changes',
    description: 'You have unsaved changes. Do you want to save them before continuing?',
    confirmText: 'Save',
    confirmVariant: 'primary',
    iconColor: 'text-green-500',
    requiresConfirmation: false,
    cancelText: 'Discard',
    showThirdAction: true,
    thirdActionText: 'Cancel'
  }
};

const ConfirmationDialog = ({
  isOpen,
  onClose,
  onConfirm,
  onCancel,
  type = 'warning',
  title,
  description,
  confirmText,
  cancelText = 'Cancel',
  confirmVariant,
  icon: CustomIcon,
  iconColor,
  requiresConfirmation,
  confirmationText = '',
  confirmationPlaceholder = 'Type to confirm',
  showInput = false,
  inputLabel = '',
  inputValue = '',
  onInputChange,
  children,
  loading = false,
  disabled = false,
  size = 'md',
  showThirdAction = false,
  thirdActionText = 'Cancel',
  onThirdAction,
  className = '',
  ...props
}) => {
  const { announce } = useAccessibility();
  const [confirmationInput, setConfirmationInput] = useState('');
  const [isConfirmationValid, setIsConfirmationValid] = useState(false);
  const confirmButtonRef = useRef(null);

  // Get configuration for predefined types
  const config = confirmationTypes[type] || confirmationTypes.warning;
  
  // Use props or fall back to config
  const finalTitle = title || config.title;
  const finalDescription = description || config.description;
  const finalConfirmText = confirmText || config.confirmText;
  const finalConfirmVariant = confirmVariant || config.confirmVariant;
  const finalIcon = CustomIcon || config.icon;
  const finalIconColor = iconColor || config.iconColor;
  const finalRequiresConfirmation = requiresConfirmation !== undefined 
    ? requiresConfirmation 
    : config.requiresConfirmation;
  const finalShowThirdAction = showThirdAction !== undefined 
    ? showThirdAction 
    : config.showThirdAction;
  const finalThirdActionText = thirdActionText || config.thirdActionText;
  const finalCancelText = cancelText !== 'Cancel' 
    ? cancelText 
    : config.cancelText || 'Cancel';

  // Handle confirmation input
  useEffect(() => {
    if (finalRequiresConfirmation && confirmationText) {
      setIsConfirmationValid(
        confirmationInput.trim().toLowerCase() === confirmationText.toLowerCase()
      );
    } else {
      setIsConfirmationValid(true);
    }
  }, [confirmationInput, confirmationText, finalRequiresConfirmation]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setConfirmationInput('');
      announce(`${finalTitle} confirmation dialog opened`, 'assertive');
    }
  }, [isOpen, finalTitle, announce]);

  // Handle confirmation
  const handleConfirm = () => {
    if (!isConfirmationValid || loading || disabled) return;
    
    announce(`${finalTitle} confirmed`, 'polite');
    onConfirm?.();
  };

  // Handle cancellation
  const handleCancel = () => {
    announce(`${finalTitle} cancelled`, 'polite');
    onCancel?.();
    onClose?.();
  };

  // Handle third action (for save dialogs)
  const handleThirdAction = () => {
    announce(`${finalThirdActionText} selected`, 'polite');
    onThirdAction?.();
    onClose?.();
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    setConfirmationInput(value);
    onInputChange?.(value);
  };

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={finalTitle}
      size={size}
      className={className}
      initialFocus={finalRequiresConfirmation ? undefined : confirmButtonRef}
      footer={
        <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
          {/* Cancel/Secondary Button */}
          <AccessibleButton
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            ariaLabel={`Cancel ${finalTitle.toLowerCase()}`}
          >
            {finalCancelText}
          </AccessibleButton>

          {/* Third Action (for save dialogs) */}
          {finalShowThirdAction && (
            <AccessibleButton
              variant="ghost"
              onClick={handleThirdAction}
              disabled={loading}
              ariaLabel={finalThirdActionText}
            >
              {finalThirdActionText}
            </AccessibleButton>
          )}

          {/* Confirm Button */}
          <AccessibleButton
            ref={confirmButtonRef}
            variant={finalConfirmVariant}
            onClick={handleConfirm}
            disabled={!isConfirmationValid || loading || disabled}
            loading={loading}
            loadingText={`${finalConfirmText}...`}
            ariaLabel={`Confirm ${finalTitle.toLowerCase()}`}
          >
            {finalConfirmText}
          </AccessibleButton>
        </div>
      }
      {...props}
    >
      <div className="space-y-4">
        {/* Icon and Description */}
        <FadeIn>
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-full bg-gray-100 dark:bg-gray-800 ${finalIconColor}`}>
              <finalIcon className="h-6 w-6" aria-hidden="true" />
            </div>
            
            <div className="flex-1 pt-1">
              <p className={`text-sm ${darkModeClasses.text.secondary}`}>
                {finalDescription}
              </p>
            </div>
          </div>
        </FadeIn>

        {/* Custom Content */}
        {children && (
          <ScaleIn delay={0.1}>
            <div className={`p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border ${darkModeClasses.border.default}`}>
              {children}
            </div>
          </ScaleIn>
        )}

        {/* Input Field (for forms) */}
        {showInput && (
          <ScaleIn delay={0.2}>
            <AccessibleInput
              label={inputLabel}
              value={inputValue}
              onChange={onInputChange}
              fullWidth
              autoFocus
            />
          </ScaleIn>
        )}

        {/* Confirmation Input */}
        {finalRequiresConfirmation && confirmationText && (
          <ScaleIn delay={0.3}>
            <div className="space-y-2">
              <label 
                htmlFor="confirmation-input"
                className={`block text-sm font-medium ${darkModeClasses.text.primary}`}
              >
                Type "{confirmationText}" to confirm:
              </label>
              <AccessibleInput
                id="confirmation-input"
                type="text"
                value={confirmationInput}
                onChange={handleInputChange}
                placeholder={confirmationPlaceholder}
                fullWidth
                autoFocus
                error={confirmationInput && !isConfirmationValid 
                  ? 'Text does not match. Please type exactly as shown above.' 
                  : undefined
                }
                success={confirmationInput && isConfirmationValid}
                aria-describedby="confirmation-help"
              />
              <p 
                id="confirmation-help"
                className={`text-xs ${darkModeClasses.text.tertiary}`}
              >
                This action cannot be undone. Please type the exact text to proceed.
              </p>
            </div>
          </ScaleIn>
        )}

        {/* Warning for destructive actions */}
        {(type === 'delete' || type === 'destructive') && (
          <ScaleIn delay={0.4}>
            <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <ExclamationTriangleIcon className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-800 dark:text-red-200">
                  Warning: This action is permanent
                </h4>
                <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                  This cannot be undone. Make sure you want to proceed before confirming.
                </p>
              </div>
            </div>
          </ScaleIn>
        )}

        {/* Loading state message */}
        {loading && (
          <FadeIn>
            <div className={`text-center py-2 text-sm ${darkModeClasses.text.secondary}`}>
              Processing your request...
            </div>
          </FadeIn>
        )}
      </div>
    </AccessibleModal>
  );
};

// Hook for managing confirmation dialogs
export const useConfirmationDialog = () => {
  const [dialogState, setDialogState] = useState({
    isOpen: false,
    type: 'warning',
    title: '',
    description: '',
    onConfirm: null,
    onCancel: null,
    options: {}
  });

  const openDialog = (config) => {
    setDialogState({
      isOpen: true,
      ...config
    });
  };

  const closeDialog = () => {
    setDialogState(prev => ({
      ...prev,
      isOpen: false
    }));
  };

  const confirm = (config) => {
    return new Promise((resolve) => {
      openDialog({
        ...config,
        onConfirm: () => {
          closeDialog();
          resolve(true);
        },
        onCancel: () => {
          closeDialog();
          resolve(false);
        }
      });
    });
  };

  return {
    ...dialogState,
    openDialog,
    closeDialog,
    confirm,
    ConfirmationDialog: (props) => (
      <ConfirmationDialog
        {...dialogState}
        {...props}
        onClose={closeDialog}
      />
    )
  };
};

// Preset confirmation functions
export const confirmDelete = (itemName = 'item', onConfirm) => {
  return {
    type: 'delete',
    title: `Delete ${itemName}`,
    description: `Are you sure you want to delete this ${itemName.toLowerCase()}? This action cannot be undone.`,
    confirmationText: 'DELETE',
    requiresConfirmation: true,
    onConfirm
  };
};

export const confirmDestructive = (action = 'action', onConfirm) => {
  return {
    type: 'destructive',
    title: `Confirm ${action}`,
    description: `This ${action.toLowerCase()} will make permanent changes that cannot be undone.`,
    onConfirm
  };
};

export const confirmUnsavedChanges = (onSave, onDiscard) => {
  return {
    type: 'save',
    title: 'Unsaved Changes',
    description: 'You have unsaved changes. What would you like to do?',
    confirmText: 'Save Changes',
    cancelText: 'Discard Changes',
    showThirdAction: true,
    thirdActionText: 'Cancel',
    onConfirm: onSave,
    onCancel: onDiscard
  };
};

ConfirmationDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func,
  onCancel: PropTypes.func,
  type: PropTypes.oneOf(['delete', 'destructive', 'warning', 'info', 'save']),
  title: PropTypes.string,
  description: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmVariant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'ghost', 'outline']),
  icon: PropTypes.elementType,
  iconColor: PropTypes.string,
  requiresConfirmation: PropTypes.bool,
  confirmationText: PropTypes.string,
  confirmationPlaceholder: PropTypes.string,
  showInput: PropTypes.bool,
  inputLabel: PropTypes.string,
  inputValue: PropTypes.string,
  onInputChange: PropTypes.func,
  children: PropTypes.node,
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl']),
  showThirdAction: PropTypes.bool,
  thirdActionText: PropTypes.string,
  onThirdAction: PropTypes.func,
  className: PropTypes.string
};

export default ConfirmationDialog; 