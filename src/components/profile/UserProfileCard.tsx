import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { profileSchema } from '../../schemas/profileSchemas';
import { ProfileService } from '../../services/profileService';
import { UserProfile } from '../../models/UserProfile';
import { CameraIcon, PencilIcon, ExclamationTriangleIcon } from '@heroicons/react/24/solid';

type ProfileFormData = z.infer<typeof profileSchema>;

interface UserProfileCardProps {
  userId: string;
}

const UserProfileCard: React.FC<UserProfileCardProps> = ({ userId }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    try {
      const unsubscribe = ProfileService.subscribeToProfile(userId, (data) => {
        if (data) {
          const normalizedProfile: UserProfile = {
            uid: data.uid || userId,
            email: data.email || '',
            displayName: data.displayName || data.firstName && data.lastName 
              ? `${data.firstName} ${data.lastName}` 
              : 'User',
            photoURL: data.photoURL,
            role: data.role || data.userType || 'tenant',
            notificationPreferences: data.notificationPreferences,
            createdAt: data.createdAt || new Date(),
            updatedAt: data.updatedAt || new Date(),
          };
          setProfile(normalizedProfile);
          reset({ displayName: normalizedProfile.displayName });
        } else {
          setError('Profile not found. Please try refreshing the page.');
        }
        setIsLoading(false);
      });

      return () => {
        try {
          unsubscribe();
        } catch (err) {
          console.error('Error unsubscribing from profile updates:', err);
        }
      };
    } catch (err) {
      console.error('Error setting up profile subscription:', err);
      setError('Failed to load profile. Please try refreshing the page.');
      setIsLoading(false);
    }
  }, [userId, reset]);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Uploading photo...');
    try {
      const photoURL = await ProfileService.uploadProfilePhoto(userId, file);
      await ProfileService.updateUserProfile(userId, { photoURL });
      toast.success('Profile photo updated!', { id: toastId });
    } catch (error: any) {
      console.error('Photo upload error:', error);
      const errorMessage = error.code === 'storage/unauthorized' 
        ? 'Permission denied. Please check your account permissions.'
        : 'Failed to upload photo. Please try again.';
      toast.error(errorMessage, { id: toastId });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    const toastId = toast.loading('Updating profile...');
    try {
      await ProfileService.updateUserProfile(userId, { displayName: data.displayName });
      toast.success('Profile updated successfully!', { id: toastId });
      setIsEditing(false);
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error.code === 'permission-denied'
        ? 'Permission denied. Please check your account permissions.'
        : 'Failed to update profile. Please try again.';
      toast.error(errorMessage, { id: toastId });
    }
  };

  if (error) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="flex items-center space-x-3 text-red-600">
          <ExclamationTriangleIcon className="h-6 w-6" />
          <div>
            <h3 className="font-medium">Profile Error</h3>
            <p className="text-sm text-red-500">{error}</p>
          </div>
        </div>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading || !profile) {
    return (
      <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
        <div className="animate-pulse flex space-x-4">
          <div className="rounded-full bg-gray-300 dark:bg-gray-600 h-24 w-24"></div>
          <div className="flex-1 space-y-2 py-1">
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
            <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/4"></div>
          </div>
        </div>
      </div>
    );
  }

  const getAvatarUrl = () => {
    if (profile.photoURL) return profile.photoURL;
    
    const name = profile.displayName || 'User';
    const initials = name.split(' ').map(n => n.charAt(0)).join('').toUpperCase().slice(0, 2);
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(initials)}&background=random&color=fff&size=200`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-6">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <div className="relative">
          <img
            src={getAvatarUrl()}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover ring-4 ring-white dark:ring-gray-700"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.displayName || 'User')}&background=random&color=fff&size=200`;
            }}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 bg-blue-600 text-white p-1.5 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-lg"
            aria-label="Change profile photo"
          >
            {isUploading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
            ) : (
              <CameraIcon className="h-4 w-4" />
            )}
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handlePhotoUpload}
            className="hidden"
            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
          />
        </div>
        
        <div className="flex-grow text-center sm:text-left">
          {isEditing ? (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <input
                  {...register('displayName')}
                  className="text-xl font-semibold text-gray-800 dark:text-white bg-gray-100 dark:bg-gray-700 rounded-md px-3 py-2 border focus:border-blue-500 focus:ring-1 focus:ring-blue-500 w-full sm:w-auto"
                  placeholder="Enter your name"
                />
                {errors.displayName && (
                  <p className="text-red-500 text-sm mt-1">{errors.displayName.message}</p>
                )}
              </div>
              <div className="flex space-x-3 justify-center sm:justify-start">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  {isSubmitting ? 'Saving...' : 'Save'}
                </button>
                <button 
                  type="button" 
                  onClick={() => {
                    setIsEditing(false);
                    reset({ displayName: profile.displayName });
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <>
              <div className="flex items-center space-x-2 justify-center sm:justify-start">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {profile.displayName}
                </h2>
                <button
                  onClick={() => setIsEditing(true)}
                  className="text-blue-600 hover:text-blue-700 p-1"
                  aria-label="Edit name"
                >
                  <PencilIcon className="h-4 w-4" />
                </button>
              </div>
              <p className="text-gray-500 dark:text-gray-400 mt-1">{profile.email}</p>
              <div className="mt-2">
                <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  profile.role === 'landlord' ? 'bg-blue-100 text-blue-800' :
                  profile.role === 'tenant' ? 'bg-green-100 text-green-800' :
                  profile.role === 'contractor' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
      
      {isUploading && (
        <div className="mt-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md p-3">
          <p className="text-sm text-blue-700 dark:text-blue-300">Uploading your profile photo...</p>
        </div>
      )}
    </div>
  );
};

export default UserProfileCard; 