import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import ContractorProfileSettings from '../components/contractor/ContractorProfileSettings';

const ContractorProfilePage = () => {
  const { currentUser, userProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if not authenticated or not a contractor
  useEffect(() => {
    if (!authLoading && (!currentUser || userProfile?.userType !== 'contractor')) {
      navigate('/login');
    }
  }, [currentUser, userProfile, authLoading, navigate]);
  
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-12 h-12 border-t-2 border-b-2 border-teal-500 rounded-full animate-spin"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6 p-4">
      {/* Page title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-800">My Profile</h1>
        <button
          onClick={() => navigate('/contractor/dashboard')}
          className="mt-2 sm:mt-0 inline-flex items-center text-sm text-slate-600 hover:text-teal-600"
        >
          <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
          </svg>
          Back to Dashboard
        </button>
      </div>
      
      {/* Contractor profile settings component */}
      <ContractorProfileSettings />
    </div>
  );
};

export default ContractorProfilePage; 