import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getSchemaForRole, validateProfileData } from '../schemas/profileSchema';
import { ProfileService } from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';

interface UseProfileFormOptions {
  role: string;
  defaultValues?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

export const useProfileForm = ({ role, defaultValues, onSuccess, onError }: UseProfileFormOptions) => {
  const { currentUser } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const schema = getSchemaForRole(role);
  
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: defaultValues || {},
    mode: 'onBlur', // Validate on blur for better UX
  });

  const { handleSubmit, formState: { errors, isDirty, isValid }, reset, watch } = form;

  // Watch all form values for change detection
  const watchedValues = watch();

  const onSubmit = useCallback(async (data: any) => {
    if (!currentUser) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate data before submission
      const validation = validateProfileData(data, role);
      if (!validation.success) {
        console.error('Validation errors:', validation.error);
        toast.error('Please check your form data and try again');
        return;
      }

      // Update profile using ProfileService
      await ProfileService.updateProfile(currentUser, validation.data);
      
      // Reset form dirty state
      reset(data);
      
      toast.success('Profile updated successfully');
      
      // Call success callback
      onSuccess?.(data);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile. Please try again.');
      onError?.(error);
    } finally {
      setIsSubmitting(false);
    }
  }, [currentUser, role, reset, onSuccess, onError]);

  const handleReset = useCallback(() => {
    reset(defaultValues || {});
  }, [reset, defaultValues]);

  const hasChanges = isDirty;
  const canSubmit = isValid && hasChanges && !isSubmitting;

  return {
    ...form,
    onSubmit: handleSubmit(onSubmit),
    handleReset,
    isSubmitting,
    hasChanges,
    canSubmit,
    watchedValues,
    errors,
  };
};

// Hook specifically for landlord profiles
export const useLandlordProfileForm = (defaultValues?: any, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
  return useProfileForm({
    role: 'landlord',
    defaultValues,
    ...callbacks,
  });
};

// Hook specifically for tenant profiles
export const useTenantProfileForm = (defaultValues?: any, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
  return useProfileForm({
    role: 'tenant',
    defaultValues,
    ...callbacks,
  });
};

// Hook specifically for contractor profiles
export const useContractorProfileForm = (defaultValues?: any, callbacks?: { onSuccess?: (data: any) => void; onError?: (error: any) => void }) => {
  return useProfileForm({
    role: 'contractor',
    defaultValues,
    ...callbacks,
  });
};
