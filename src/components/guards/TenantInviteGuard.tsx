import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import InviteCodeWall from '../auth/InviteCodeWall';
import { shouldAllowAppAccess, isTenantNeedingInvite } from '../../utils/tenantValidation';

interface TenantInviteGuardProps {
  children: React.ReactNode;
}

/**
 * Guard component that blocks tenant access until they provide a valid invite code
 */
const TenantInviteGuard: React.FC<TenantInviteGuardProps> = ({ children }) => {
  const { currentUser, userProfile, loading, refreshUserData } = useAuth();
  const [shouldShowWall, setShouldShowWall] = useState(false);
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      // Wait for auth to finish loading
      if (loading) return;
      
      // If no user, allow access (will show login/register)
      if (!currentUser) {
        setShouldShowWall(false);
        setIsCheckingProfile(false);
        return;
      }

      // If no profile yet, wait for it to load
      if (!userProfile) {
        return;
      }

      // Check if tenant needs invite code
      const needsInvite = isTenantNeedingInvite(userProfile);
      const allowAccess = shouldAllowAppAccess(userProfile);

      console.log('TenantInviteGuard check:', {
        userType: userProfile.userType,
        role: userProfile.role,
        propertyId: userProfile.propertyId,
        landlordId: userProfile.landlordId,
        needsInvite,
        allowAccess
      });

      setShouldShowWall(needsInvite);
      setIsCheckingProfile(false);
    };

    checkAccess();
  }, [currentUser, userProfile, loading]);

  // Handle successful invite validation
  const handleInviteValidated = async () => {
    console.log('Invite validated, refreshing user data...');
    
    try {
      // Refresh user data to get updated profile
      await refreshUserData();
      
      // Re-check access after a short delay to ensure data is updated
      setTimeout(() => {
        if (userProfile && shouldAllowAppAccess(userProfile)) {
          setShouldShowWall(false);
        }
      }, 1000);
    } catch (error) {
      console.error('Error refreshing user data after invite validation:', error);
    }
  };

  // Show loading while checking profile
  if (isCheckingProfile) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Show invite wall if tenant needs invite code
  if (shouldShowWall) {
    return <InviteCodeWall onInviteValidated={handleInviteValidated} />;
  }

  // Allow access to the app
  return <>{children}</>;
};

export default TenantInviteGuard; 