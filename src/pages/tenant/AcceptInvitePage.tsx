import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { validateInviteCode } from '../../services/firestore/inviteService';
import InviteAcceptanceForm from '../../components/tenant/InviteAcceptanceForm';
import LoadingFallback from '../../components/ui/LoadingFallback';

export default function AcceptInvitePage() {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const [inviteData, setInviteData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (inviteCode) {
      validateInvite();
    }
  }, [inviteCode]);

  const validateInvite = async () => {
    if (!inviteCode) {
      setError('No invite code provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await validateInviteCode(inviteCode);
      setInviteData(data);
    } catch (err) {
      setError((err as Error).message || 'Invalid or expired invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptSuccess = (userData: any) => {
    // Redirect to onboarding
    navigate('/tenant/onboarding', { 
      state: { userData, inviteData } 
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingFallback title="Validating invitation..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Invalid Invitation</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button 
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Go to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-md mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              You're Invited!
            </h1>
            <p className="text-gray-600">
              {inviteData?.landlordName} has invited you to join{' '}
              <span className="font-semibold">{inviteData?.propertyName}</span> on PropAgentic
            </p>
          </div>
          
          <InviteAcceptanceForm 
            inviteData={inviteData}
            onSuccess={handleAcceptSuccess}
          />
        </div>
      </div>
    </div>
  );
}