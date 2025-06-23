import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../../firebase/config';

const CreateLandlordProfile = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        // Check if user exists in Firestore
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const userData = userSnap.data();
          
          // Only proceed if user is a landlord
          if (userData.role !== 'landlord') {
            navigate(`/${userData.role}/dashboard`);
            return;
          }
          
          // Check if landlord profile already exists
          const landlordProfileRef = doc(db, 'landlordProfiles', user.uid);
          const landlordProfileSnap = await getDoc(landlordProfileRef);
          
          if (!landlordProfileSnap.exists()) {
            // Create landlord profile if it doesn't exist
            await setDoc(landlordProfileRef, {
              uid: user.uid,
              displayName: userData.displayName || user.displayName,
              email: userData.email || user.email,
              phoneNumber: userData.phoneNumber || null,
              contractors: [],
              properties: [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
            
            console.log('Landlord profile created successfully');
          }
          
          // Redirect to landlord dashboard
          navigate('/landlord/dashboard');
        } else {
          // User document doesn't exist
          setError('User profile not found');
          navigate('/login');
        }
      } catch (err) {
        console.error('Error creating landlord profile:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Setting up your landlord profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 max-w-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error creating profile</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button 
                onClick={() => navigate('/login')}
                className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
              >
                Return to login
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null; // Component doesn't render anything when successful
};

export default CreateLandlordProfile; 