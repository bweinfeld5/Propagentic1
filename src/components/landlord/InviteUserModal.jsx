import React, { useState } from 'react';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, where, getDocs } from 'firebase/firestore';
import { db, callFunction } from '../../firebase/config';

// Email validation regex
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const MAX_EMAIL_LENGTH = 100;

const InviteUserModal = ({ isOpen, onClose, landlordId, properties }) => {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('tenant');
  const [propertyId, setPropertyId] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [validationError, setValidationError] = useState('');

  if (!isOpen) return null;

  const validateEmail = (email) => {
    if (!email) {
      return 'Email is required';
    }
    
    if (email.length > MAX_EMAIL_LENGTH) {
      return `Email must be less than ${MAX_EMAIL_LENGTH} characters`;
    }
    
    if (!EMAIL_REGEX.test(email)) {
      return 'Please enter a valid email address';
    }
    
    return '';
  };

  const sanitizeEmail = (email) => {
    // Trim and convert to lowercase
    return email.trim().toLowerCase();
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    
    // Validate email
    const error = validateEmail(email);
    if (error) {
      setValidationError(error);
      return;
    }
    
    // For tenants, validate property selection
    if (role === 'tenant' && !propertyId) {
      setValidationError('Please select a property for the tenant');
      return;
    }
    
    setLoading(true);
    setStatus({ type: '', message: '' });
    setValidationError('');

    try {
      // Sanitize email
      const sanitizedEmail = sanitizeEmail(email);
      
      // Check if user with email exists
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('email', '==', sanitizedEmail));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        setStatus({
          type: 'error',
          message: 'User with this email does not exist. Ask them to sign up first.'
        });
        return;
      }
      
      const userDoc = querySnapshot.docs[0];
      const userData = userDoc.data();
      const userId = userDoc.id;
      
      if (userData.role !== role) {
        setStatus({
          type: 'error',
          message: `This user is not registered as a ${role}. Please use the correct role.`
        });
        return;
      }
      
      // User exists with correct role, proceed with invitation
      if (role === 'contractor') {
        // Add contractor to landlord's rolodex
        const landlordRef = doc(db, 'landlordProfiles', landlordId);
        const landlordSnap = await getDoc(landlordRef);
        
        if (!landlordSnap.exists()) {
          throw new Error('Landlord profile not found');
        }
        
        // Check if contractor is already in the landlord's rolodex
        const contractorList = landlordSnap.data().contractors || [];
        if (contractorList.includes(userId)) {
          setStatus({
            type: 'error',
            message: 'This contractor is already in your network'
          });
          return;
        }
        
        // Update landlord profile with new contractor
        await updateDoc(landlordRef, {
          contractors: arrayUnion(userId)
        });
        
        // Add landlord to contractor's clients list (bidirectional relationship)
        const contractorProfileRef = doc(db, 'contractorProfiles', userId);
        const contractorProfileSnap = await getDoc(contractorProfileRef);
        
        if (contractorProfileSnap.exists()) {
          // Update existing contractor profile
          await updateDoc(contractorProfileRef, {
            clients: arrayUnion(landlordId)
          });
        } else {
          // Create new contractor profile if doesn't exist
          await setDoc(contractorProfileRef, {
            uid: userId,
            displayName: userData.displayName,
            email: userData.email,
            specialties: userData.specialties || [],
            clients: [landlordId],
            createdAt: new Date().toISOString()
          });
        }
        
        // Create notification for contractor
        await callFunction('sendNotification', {
          userId: userId,
          title: 'New Connection',
          message: `You've been added to a landlord's network`,
          type: 'connection',
          additionalData: {
            landlordId,
            action: 'added_to_network'
          }
        });
        
        setStatus({
          type: 'success',
          message: `${userData.displayName} has been added to your contractor network`
        });
      } else if (role === 'tenant') {
        // Add tenant to property
        const propertyRef = doc(db, 'properties', propertyId);
        const propertySnap = await getDoc(propertyRef);
        
        if (!propertySnap.exists()) {
          setStatus({
            type: 'error',
            message: 'Selected property does not exist'
          });
          return;
        }
        
        // Check if tenant is already assigned to this property
        const propertyData = propertySnap.data();
        const tenantList = propertyData.tenants || [];
        
        if (tenantList.includes(userId)) {
          setStatus({
            type: 'error',
            message: 'This tenant is already assigned to this property'
          });
          return;
        }
        
        // Update property with new tenant
        await updateDoc(propertyRef, {
          tenants: arrayUnion(userId)
        });
        
        // Update tenant's profile with new property (bidirectional relationship)
        const tenantProfileRef = doc(db, 'tenantProfiles', userId);
        const tenantProfileSnap = await getDoc(tenantProfileRef);
        
        if (tenantProfileSnap.exists()) {
          // Update existing tenant profile
          await updateDoc(tenantProfileRef, {
            properties: arrayUnion(propertyId),
            landlords: arrayUnion(landlordId)
          });
        } else {
          // Create new tenant profile
          await setDoc(tenantProfileRef, {
            uid: userId,
            displayName: userData.displayName,
            email: userData.email,
            properties: [propertyId],
            landlords: [landlordId],
            createdAt: new Date().toISOString()
          });
        }
        
        // Create notification for tenant
        await callFunction('sendNotification', {
          userId: userId,
          title: 'Property Assignment',
          message: `You've been added to ${propertySnap.data().name}`,
          type: 'property',
          additionalData: {
            propertyId,
            propertyName: propertySnap.data().name,
            action: 'added_to_property'
          }
        });
        
        setStatus({
          type: 'success',
          message: `${userData.displayName} has been added to ${propertySnap.data().name}`
        });
      }
      
      // Reset form
      setEmail('');
      setRole('tenant');
      setPropertyId('');
      
      // Close modal after 2 seconds if successful
      if (status.type === 'success') {
        setTimeout(() => {
          onClose();
        }, 2000);
      }
    } catch (err) {
      console.error('Error inviting user:', err);
      setStatus({
        type: 'error',
        message: err.message || 'An error occurred while inviting the user'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen"></span>&#8203;
        
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
            >
              <span className="sr-only">Close</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="sm:flex sm:items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 sm:mx-0 sm:h-10 sm:w-10">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Invite User
              </h3>
              <div className="mt-2">
                <p className="text-sm text-gray-500">
                  Enter the email address of the {role} you want to invite.
                  They must already have a Propagentic account.
                </p>
              </div>
            </div>
          </div>
          
          {status.message && (
            <div className={`mt-4 p-3 rounded-md ${
              status.type === 'error' 
                ? 'bg-red-50 text-red-700 border border-red-200' 
                : 'bg-green-50 text-green-700 border border-green-200'
            }`}>
              {status.message}
            </div>
          )}
          
          <form onSubmit={handleInvite} className="mt-5">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">User Type</label>
                <div className="mt-1 flex space-x-4">
                  <div className="flex items-center">
                    <input
                      id="tenant-role"
                      name="role"
                      type="radio"
                      value="tenant"
                      checked={role === 'tenant'}
                      onChange={() => setRole('tenant')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="tenant-role" className="ml-2 block text-sm text-gray-700">
                      Tenant
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      id="contractor-role"
                      name="role"
                      type="radio"
                      value="contractor"
                      checked={role === 'contractor'}
                      onChange={() => setRole('contractor')}
                      className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor="contractor-role" className="ml-2 block text-sm text-gray-700">
                      Contractor
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <div className="mt-1">
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (validationError) setValidationError('');
                    }}
                    maxLength={MAX_EMAIL_LENGTH}
                    required
                    className={`shadow-sm ${validationError ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'focus:ring-blue-500 focus:border-blue-500 border-gray-300'} block w-full sm:text-sm rounded-md`}
                    placeholder="user@example.com"
                  />
                  {validationError && (
                    <p className="mt-1 text-sm text-red-600">{validationError}</p>
                  )}
                </div>
              </div>
              
              {role === 'tenant' && (
                <div>
                  <label htmlFor="property" className="block text-sm font-medium text-gray-700">
                    Assign to Property <span className="text-red-500">*</span>
                  </label>
                  <div className="mt-1">
                    <select
                      id="property"
                      name="property"
                      value={propertyId}
                      onChange={(e) => {
                        setPropertyId(e.target.value);
                        if (validationError) setValidationError('');
                      }}
                      required
                      className={`block w-full pl-3 pr-10 py-2 text-base ${validationError && !propertyId ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500'} sm:text-sm rounded-md`}
                    >
                      <option value="">Select a property</option>
                      {properties?.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
            
            <div className="mt-6 sm:flex sm:flex-row-reverse">
              <button
                type="submit"
                disabled={loading}
                className={`w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 text-base font-medium text-white focus:outline-none sm:ml-3 sm:w-auto sm:text-sm ${
                  loading 
                    ? 'bg-blue-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {loading ? 'Processing...' : 'Send Invitation'}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InviteUserModal; 