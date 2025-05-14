import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/config';
import Button from '../components/ui/Button';
import { UserCircleIcon, PencilSquareIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const ProfilePage = () => {
  const { currentUser, userProfile, fetchUserProfile } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [landlordData, setLandlordData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({});

  // Redirect if not logged in
  useEffect(() => {
    if (!currentUser && !loading) {
      navigate('/login');
    }
  }, [currentUser, loading, navigate]);

  // Load profile data
  useEffect(() => {
    const loadProfileData = async () => {
      if (!currentUser) {
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const profile = userProfile || await fetchUserProfile(currentUser.uid);
        if (!profile) {
          throw new Error("Failed to fetch user profile.");
        }
        setProfileData(profile);

        if (profile?.userType === 'landlord' || profile?.role === 'landlord') {
          const landlordRef = doc(db, 'landlordProfiles', currentUser.uid);
          const landlordSnap = await getDoc(landlordRef);
          const currentLandlordData = landlordSnap.exists() ? landlordSnap.data() : {};
          setLandlordData(currentLandlordData);
          setEditFormData({ 
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              phoneNumber: profile.phoneNumber || '',
              businessName: currentLandlordData.businessName || '',
          });
        } else {
          setEditFormData({ 
              firstName: profile.firstName || '',
              lastName: profile.lastName || '',
              phoneNumber: profile.phoneNumber || '',
          });
        }
      } catch (err) {
        console.error("Error loading profile data:", err);
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    if(currentUser) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [currentUser, fetchUserProfile]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    if (!currentUser) return;
    setLoading(true);
    setError(null);
    try {
      const userUpdateData = {
        firstName: editFormData.firstName,
        lastName: editFormData.lastName,
        name: `${editFormData.firstName || ''} ${editFormData.lastName || ''}`.trim(),
        phoneNumber: editFormData.phoneNumber,
        updatedAt: new Date()
      };
      const landlordUpdateData = {
        businessName: editFormData.businessName,
        updatedAt: new Date()
      };

      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, userUpdateData);
      console.log('User document updated');

      if (profileData?.userType === 'landlord' || profileData?.role === 'landlord') {
        const landlordRef = doc(db, 'landlordProfiles', currentUser.uid);
        await updateDoc(landlordRef, landlordUpdateData).catch(async (updateError) => {
            console.warn("Failed to update landlord profile, attempting setDoc merge:", updateError);
            await updateDoc(landlordRef, landlordUpdateData, { merge: true });
        });
        console.log('Landlord profile updated/set');
      }
      
      await fetchUserProfile(currentUser.uid);
      
      setIsEditing(false);
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save profile changes.");
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditFormData({
        firstName: profileData?.firstName || '',
        lastName: profileData?.lastName || '',
        phoneNumber: profileData?.phoneNumber || '',
        businessName: landlordData?.businessName || ''
    });
    setIsEditing(false);
  };

  if (loading) {
    return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary dark:border-primary-light"></div>
        </div>
    );
  }

  if (error) {
    return <div className="bg-danger-subtle p-4 rounded text-danger dark:text-red-400">Error: {error}</div>;
  }

  if (!profileData) {
    return <div className="p-6">Could not load user profile data.</div>;
  }

  // Combine data for display
  const displayData = {
      Name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() || profileData.name || '-',
      Email: profileData.email || '-',
      Phone: profileData.phoneNumber || '-',
      Role: profileData.userType || profileData.role || '-',
      ...( (profileData.userType === 'landlord' || profileData.role === 'landlord') && { 'Business Name': landlordData?.businessName || '-' } ),
      'Joined': profileData.createdAt?.toDate ? profileData.createdAt.toDate().toLocaleDateString() : 'N/A' 
  };

  return (
    <div className="max-w-4xl mx-auto bg-background dark:bg-background-darkSubtle rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold text-content dark:text-content-dark flex items-center">
                <UserCircleIcon className="w-6 h-6 mr-2 text-primary dark:text-primary-light"/>
                My Profile
            </h1>
            {!isEditing && (
                <Button 
                    variant="outline"
                    onClick={() => setIsEditing(true)}
                    icon={<PencilSquareIcon className="w-5 h-5"/>}
                >
                    Edit Profile
                </Button>
            )}
        </div>
        
        {isEditing ? (
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">First Name</label>
                    <input type="text" name="firstName" value={editFormData.firstName || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm bg-background-subtle dark:bg-background-dark text-content dark:text-content-dark focus:border-primary focus:ring-primary"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Last Name</label>
                    <input type="text" name="lastName" value={editFormData.lastName || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm bg-background-subtle dark:bg-background-dark text-content dark:text-content-dark focus:border-primary focus:ring-primary"/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Phone Number</label>
                    <input type="tel" name="phoneNumber" value={editFormData.phoneNumber || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm bg-background-subtle dark:bg-background-dark text-content dark:text-content-dark focus:border-primary focus:ring-primary"/>
                </div>
                {(profileData?.userType === 'landlord' || profileData?.role === 'landlord') && (
                     <div>
                        <label className="block text-sm font-medium text-content-secondary dark:text-content-darkSecondary">Business Name</label>
                        <input type="text" name="businessName" value={editFormData.businessName || ''} onChange={handleEditChange} className="mt-1 block w-full rounded-md border-border dark:border-border-dark shadow-sm bg-background-subtle dark:bg-background-dark text-content dark:text-content-dark focus:border-primary focus:ring-primary"/>
                    </div>
                )}
                
                {error && <p className="text-sm text-danger dark:text-red-400">Save Error: {error}</p>}
                
                <div className="flex justify-end space-x-3 pt-4">
                    <Button variant="outline" onClick={handleCancel} disabled={loading}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} isLoading={loading} disabled={loading} icon={<CheckIcon className="w-5 h-5"/>}>
                       Save Changes
                    </Button>
                </div>
            </div>
        ) : (
            <dl className="divide-y divide-border dark:divide-border-dark">
                {Object.entries(displayData).map(([key, value]) => (
                    <div key={key} className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
                        <dt className="text-sm font-medium text-content-secondary dark:text-content-darkSecondary">{key}</dt>
                        <dd className="mt-1 text-sm text-content dark:text-content-dark sm:mt-0 sm:col-span-2">{value || '-'}</dd> 
                    </div>
                ))}
            </dl>
        )}
    </div>
  );
};

export default ProfilePage; 