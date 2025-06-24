import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  CheckCircleIcon, 
  ExclamationTriangleIcon, 
  BuildingOfficeIcon,
  QrCodeIcon,
  EnvelopeIcon,
  UserPlusIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';
import Button from '../../components/ui/Button';
import { getFunctions, httpsCallable } from 'firebase/functions';
import toast from 'react-hot-toast';

interface Property {
  id: string;
  name?: string;
  nickname?: string;
  streetAddress?: string;
  landlordName?: string;
  landlordEmail?: string;
}

interface InviteDetails {
  inviteCode: string;
  property: Property;
  expiresAt?: string;
  type: 'email' | 'qr';
  status: 'valid' | 'expired' | 'used' | 'invalid';
}

const InviteAcceptancePage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser, signInWithGoogle, createAccount } = useAuth();
  
  const [loading, setLoading] = useState<boolean>(true);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string>('');
  const [accepting, setAccepting] = useState<boolean>(false);
  const [accepted, setAccepted] = useState<boolean>(false);

  // Check if this came from QR scan
  const fromQR = searchParams.get('source') === 'qr';
  const propertyId = searchParams.get('propertyId');

  useEffect(() => {
    if (code) {
      validateInviteCode(code);
    } else {
      setError('No invite code provided');
      setLoading(false);
    }
  }, [code]);

  const validateInviteCode = async (inviteCode: string) => {
    setLoading(true);
    setError('');

    try {
      const functions = getFunctions();
      const validateInvite = httpsCallable(functions, 'validatePropertyInvite');
      
      const result = await validateInvite({ 
        inviteCode,
        propertyId: propertyId || undefined // Include propertyId for QR codes
      });
      
      const data = result.data as any;
      
      if (data.success && data.invite) {
        setInviteDetails({
          inviteCode,
          property: data.invite.property,
          expiresAt: data.invite.expiresAt,
          type: fromQR ? 'qr' : 'email',
          status: data.invite.status
        });
      } else {
        setError(data.message || 'Invalid or expired invite code');
      }
    } catch (error: any) {
      console.error('Error validating invite:', error);
      setError('Failed to validate invite code. Please check the code and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvite = async () => {
    if (!inviteDetails) return;

    setAccepting(true);
    
    try {
      const functions = getFunctions();
      const acceptInvite = httpsCallable(functions, 'acceptPropertyInvite');
      
      const result = await acceptInvite({
        inviteCode: inviteDetails.inviteCode,
        propertyId: propertyId || inviteDetails.property.id
      });
      
      const data = result.data as any;
      
      if (data.success) {
        setAccepted(true);
        toast.success(
          `🎉 Successfully joined ${inviteDetails.property.name || inviteDetails.property.nickname}!`,
          { duration: 5000 }
        );
        
        // Redirect to tenant dashboard after a delay
        setTimeout(() => {
          navigate('/tenant/dashboard');
        }, 2000);
      } else {
        throw new Error(data.message || 'Failed to accept invite');
      }
    } catch (error: any) {
      console.error('Error accepting invite:', error);
      toast.error(`Failed to accept invite: ${error.message}`);
    } finally {
      setAccepting(false);
    }
  };

  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
      // After successful sign in, accept the invite
      setTimeout(() => {
        handleAcceptInvite();
      }, 1000);
    } catch (error: any) {
      console.error('Error signing in:', error);
      toast.error('Failed to sign in. Please try again.');
    }
  };

  const handleCreateAccount = async () => {
    try {
      await signInWithGoogle(); // Using Google sign-in for account creation
      // After successful account creation, accept the invite
      setTimeout(() => {
        handleAcceptInvite();
      }, 1000);
    } catch (error: any) {
      console.error('Error creating account:', error);
      toast.error('Failed to create account. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg border border-orange-200 max-w-md mx-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Validating Invitation</h3>
          <p className="text-gray-600">Please wait while we verify your invite code...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg border border-red-200 max-w-md mx-4">
          <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Invalid Invitation</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button
            onClick={() => navigate('/')}
            variant="primary"
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  if (accepted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg border border-green-200 max-w-md mx-4">
          <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Welcome!</h3>
          <p className="text-gray-600 mb-6">
            You've successfully joined {inviteDetails?.property.name || inviteDetails?.property.nickname}. 
            You'll be redirected to your dashboard in a moment.
          </p>
          <div className="flex items-center justify-center text-orange-600">
            <span className="text-sm">Redirecting to dashboard</span>
            <ArrowRightIcon className="w-4 h-4 ml-2 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!inviteDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center">
        <div className="text-center bg-white rounded-xl p-8 shadow-lg border border-gray-200 max-w-md mx-4">
          <ExclamationTriangleIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Invitation Found</h3>
          <p className="text-gray-600 mb-6">The invitation link you used doesn't contain valid information.</p>
          <Button
            onClick={() => navigate('/')}
            variant="primary"
            className="w-full"
          >
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100">
      {/* Header */}
      <div className="bg-white border-b border-orange-200 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg mr-3">
                {fromQR ? (
                  <QrCodeIcon className="w-6 h-6 text-orange-600" />
                ) : (
                  <EnvelopeIcon className="w-6 h-6 text-orange-600" />
                )}
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Property Invitation</h1>
                <p className="text-sm text-gray-600">
                  {fromQR ? 'Scanned from QR Code' : 'Received via Email'}
                </p>
              </div>
            </div>
            {currentUser && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Signed in as</p>
                <p className="font-medium text-gray-900">{currentUser.email}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg border border-orange-200 overflow-hidden">
          {/* Property Information */}
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-white">
            <div className="flex items-start">
              <div className="p-3 bg-white/20 rounded-xl mr-4">
                <BuildingOfficeIcon className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  You're Invited to Join
                </h2>
                <h3 className="text-xl font-semibold mb-1">
                  {inviteDetails.property.name || inviteDetails.property.nickname || 'Property'}
                </h3>
                {inviteDetails.property.streetAddress && (
                  <p className="text-orange-100">
                    {inviteDetails.property.streetAddress}
                  </p>
                )}
                {inviteDetails.property.landlordName && (
                  <p className="text-orange-100 mt-2">
                    Managed by {inviteDetails.property.landlordName}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="p-6">
            <div className="mb-6">
              <h4 className="text-lg font-semibold text-gray-900 mb-3">What you'll get access to:</h4>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                  Submit and track maintenance requests
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                  Communicate directly with your landlord
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                  Access important property information
                </li>
                <li className="flex items-center">
                  <CheckCircleIcon className="w-5 h-5 text-green-500 mr-2" />
                  Receive notifications about your property
                </li>
              </ul>
            </div>

            {/* Expiration warning if applicable */}
            {inviteDetails.expiresAt && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <ExclamationTriangleIcon className="w-5 h-5 text-amber-600 mt-0.5 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">Time-Limited Invitation</p>
                    <p className="text-sm text-amber-700 mt-1">
                      This invitation expires on {new Date(inviteDetails.expiresAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div className="space-y-4">
              {currentUser ? (
                <div className="space-y-3">
                  <Button
                    onClick={handleAcceptInvite}
                    variant="primary"
                    isLoading={accepting}
                    disabled={accepting}
                    className="w-full"
                  >
                    {accepting ? 'Accepting Invitation...' : 'Accept Invitation'}
                  </Button>
                  <p className="text-sm text-gray-600 text-center">
                    By accepting, you'll be added as a tenant to this property.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-gray-600 mb-2">To accept this invitation, you need to:</p>
                  </div>
                  
                  <div className="grid grid-cols-1 gap-3">
                    <Button
                      onClick={handleSignIn}
                      variant="primary"
                      className="w-full"
                    >
                      <UserPlusIcon className="w-4 h-4 mr-2" />
                      Sign In & Accept
                    </Button>
                    
                    <Button
                      onClick={handleCreateAccount}
                      variant="secondary"
                      className="w-full"
                    >
                      Create Account & Accept
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <p className="text-xs text-gray-500">
                      We use secure Google authentication. No passwords to remember!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-600 mb-2">
            {fromQR ? 'Scanned QR Code:' : 'Invitation Code:'} 
            <span className="font-mono ml-2 bg-gray-100 px-2 py-1 rounded">
              {inviteDetails.inviteCode}
            </span>
          </p>
          <p className="text-xs text-gray-500">
            Having trouble? Contact your landlord or{' '}
            <button 
              onClick={() => navigate('/support')}
              className="text-orange-600 hover:text-orange-700 underline"
            >
              get support
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default InviteAcceptancePage; 