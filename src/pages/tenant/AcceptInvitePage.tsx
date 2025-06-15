import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { auth } from '../../firebase/config';
import { useAuth } from '../../context/AuthContext';
import inviteService from '../../services/firestore/inviteService';
import { validateInviteCode, redeemInviteCode } from '../../services/inviteCodeService';
import tenantService from '../../services/tenantService';
import Button from '../../components/ui/Button';
import { toast } from 'react-hot-toast';
import { 
  BuildingOffice2Icon, 
  CheckIcon, 
  XMarkIcon,
  ClockIcon,
  EnvelopeIcon,
  KeyIcon
} from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';

interface InviteDetails {
  id?: string;
  propertyName?: string;
  landlordName?: string;
  unitNumber?: string;
  propertyId: string;
  landlordId: string;
  createdAt?: Date;
  expiresAt?: Date;
  type: 'email' | 'code';
}

const AcceptInvitePage: React.FC = () => {
  const { inviteId } = useParams<{ inviteId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [inviteDetails, setInviteDetails] = useState<InviteDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [validatingCode, setValidatingCode] = useState(false);

  // Check if user is logged in
  useEffect(() => {
    if (!currentUser) {
      // Redirect to login with return URL
      navigate(`/login?redirect=/tenant/accept/${inviteId || 'code'}`);
    }
  }, [currentUser, navigate, inviteId]);

  // Load invite details if inviteId is provided
  useEffect(() => {
    const loadInviteDetails = async () => {
      if (!inviteId || !currentUser?.email) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);
        
        // Get pending invites for the current user
        const invites = await inviteService.getPendingInvitesForTenant(currentUser.email);
        const invite = invites.find(inv => inv.id === inviteId);
        
        if (!invite) {
          setError('Invitation not found or has expired');
          return;
        }

        // Check if invite has expired
        if (invite.expiresAt && new Date(invite.expiresAt) < new Date()) {
          setError('This invitation has expired');
          return;
        }

        setInviteDetails({
          id: invite.id,
          propertyName: invite.propertyName,
          landlordName: invite.landlordName,
          unitNumber: invite.unitNumber,
          propertyId: invite.propertyId,
          landlordId: invite.landlordId,
          createdAt: invite.createdAt ? new Date(invite.createdAt) : undefined,
          expiresAt: invite.expiresAt ? new Date(invite.expiresAt) : undefined,
          type: 'email'
        });
      } catch (err) {
        console.error('Error loading invite:', err);
        setError('Failed to load invitation details');
      } finally {
        setLoading(false);
      }
    };

    loadInviteDetails();
  }, [inviteId, currentUser]);

  // Handle manual code validation
  const handleValidateCode = async () => {
    if (!inviteCode.trim()) {
      toast.error('Please enter an invitation code');
      return;
    }

    setValidatingCode(true);
    setError(null);

    try {
      const validation = await validateInviteCode(inviteCode);
      
      if (!validation.isValid) {
        setError(validation.message || 'Invalid invitation code');
        return;
      }

      // Set invite details from code validation
      setInviteDetails({
        propertyName: validation.propertyName,
        propertyId: validation.propertyId!,
        landlordId: validation.landlordId!,
        unitNumber: validation.unitId || undefined,
        type: 'code'
      });

      toast.success('Code validated successfully!');
    } catch (err) {
      console.error('Error validating code:', err);
      setError('Failed to validate invitation code');
    } finally {
      setValidatingCode(false);
    }
  };

  // Handle accepting invitation
  const handleAccept = async () => {
    if (!currentUser?.uid || !inviteDetails) return;

    setProcessing(true);
    setError(null);

    try {
      if (inviteDetails.type === 'email' && inviteDetails.id) {
        // Accept email invitation
        await inviteService.updateInviteStatus(inviteDetails.id, 'accepted', currentUser.uid);
        toast.success('Invitation accepted successfully!');
      } else if (inviteDetails.type === 'code') {
        // Redeem invite code
        const result = await tenantService.redeemInviteCode(inviteCode, currentUser.uid);
        if (result.success) {
          toast.success('Invitation code redeemed successfully!');
        } else {
          throw new Error(result.message || 'Failed to redeem code');
        }
      }

      // Navigate to tenant dashboard
      setTimeout(() => {
        navigate('/tenant/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Error accepting invitation:', err);
      setError(err.message || 'Failed to accept invitation');
      toast.error(err.message || 'Failed to accept invitation');
    } finally {
      setProcessing(false);
    }
  };

  // Handle declining invitation
  const handleDecline = async () => {
    if (!inviteDetails?.id || inviteDetails.type !== 'email') {
      navigate('/tenant/dashboard');
      return;
    }

    setProcessing(true);
    try {
      await inviteService.declineInvite(inviteDetails.id);
      toast.success('Invitation declined');
      navigate('/tenant/dashboard');
    } catch (err) {
      console.error('Error declining invitation:', err);
      toast.error('Failed to decline invitation');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background dark:bg-background-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-primary-subtle dark:bg-primary-darkSubtle">
            <BuildingOffice2Icon className="h-6 w-6 text-primary dark:text-primary-light" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-content dark:text-content-dark">
            Property Invitation
          </h2>
          <p className="mt-2 text-sm text-content-subtle dark:text-content-darkSubtle">
            {inviteId ? 'Review and accept your property invitation' : 'Enter your invitation code'}
          </p>
        </div>

        {error && (
          <div className="mb-6 bg-danger-subtle dark:bg-danger-darkSubtle border-l-4 border-danger dark:border-danger-dark p-4 rounded-md">
            <p className="text-sm text-danger dark:text-danger-dark">{error}</p>
          </div>
        )}

        {/* Show invite details if available */}
        {inviteDetails ? (
          <div className="bg-background-subtle dark:bg-background-darkSubtle shadow rounded-lg p-6 mb-6">
            <h3 className="text-lg font-medium text-content dark:text-content-dark mb-4">
              Invitation Details
            </h3>
            
            <div className="space-y-3">
              <div className="flex items-start">
                <BuildingOffice2Icon className="h-5 w-5 text-content-secondary dark:text-content-darkSecondary mt-0.5 mr-3" />
                <div>
                  <p className="text-sm font-medium text-content dark:text-content-dark">Property</p>
                  <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                    {inviteDetails.propertyName || 'Property Name Not Available'}
                    {inviteDetails.unitNumber && ` - Unit ${inviteDetails.unitNumber}`}
                  </p>
                </div>
              </div>

              {inviteDetails.landlordName && (
                <div className="flex items-start">
                  <EnvelopeIcon className="h-5 w-5 text-content-secondary dark:text-content-darkSecondary mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-content dark:text-content-dark">Invited by</p>
                    <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                      {inviteDetails.landlordName}
                    </p>
                  </div>
                </div>
              )}

              {inviteDetails.createdAt && (
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-content-secondary dark:text-content-darkSecondary mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-content dark:text-content-dark">Sent</p>
                    <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                      {formatDistanceToNow(inviteDetails.createdAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}

              {inviteDetails.expiresAt && (
                <div className="flex items-start">
                  <ClockIcon className="h-5 w-5 text-content-secondary dark:text-content-darkSecondary mt-0.5 mr-3" />
                  <div>
                    <p className="text-sm font-medium text-content dark:text-content-dark">Expires</p>
                    <p className="text-sm text-content-secondary dark:text-content-darkSecondary">
                      {formatDistanceToNow(inviteDetails.expiresAt, { addSuffix: true })}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex space-x-3">
              <Button
                variant="primary"
                onClick={handleAccept}
                isLoading={processing}
                disabled={processing}
                icon={<CheckIcon className="w-4 h-4" />}
                className="flex-1"
              >
                Accept Invitation
              </Button>
              
              {inviteDetails.type === 'email' && (
                <Button
                  variant="outline"
                  onClick={handleDecline}
                  disabled={processing}
                  icon={<XMarkIcon className="w-4 h-4" />}
                >
                  Decline
                </Button>
              )}
            </div>
          </div>
        ) : (
          /* Show code entry form if no invite details */
          <div className="bg-background-subtle dark:bg-background-darkSubtle shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-content dark:text-content-dark mb-4">
              Enter Invitation Code
            </h3>
            
            <div className="space-y-4">
              <div>
                <label htmlFor="invite-code" className="block text-sm font-medium text-content dark:text-content-dark">
                  Invitation Code
                </label>
                <div className="mt-1 relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <KeyIcon className="h-5 w-5 text-content-secondary dark:text-content-darkSecondary" />
                  </div>
                  <input
                    type="text"
                    id="invite-code"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g., ABC123)"
                    className="block w-full pl-10 pr-3 py-2 border border-border dark:border-border-dark rounded-md 
                             bg-background dark:bg-background-dark text-content dark:text-content-dark
                             placeholder-content-secondary dark:placeholder-content-darkSecondary
                             focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                  />
                </div>
                <p className="mt-1 text-xs text-content-subtle dark:text-content-darkSubtle">
                  Enter the invitation code provided by your landlord
                </p>
              </div>

              <Button
                variant="primary"
                onClick={handleValidateCode}
                isLoading={validatingCode}
                disabled={validatingCode || !inviteCode.trim()}
                className="w-full"
              >
                Validate Code
              </Button>
            </div>
          </div>
        )}

        <div className="mt-6 text-center">
          <Button
            variant="link"
            onClick={() => navigate('/tenant/dashboard')}
            className="text-sm"
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AcceptInvitePage;