import React from 'react';
import { Building, Check, X } from 'lucide-react';
import Button from './ui/Button';
import { toast } from 'react-hot-toast';
import { InviteCode as Invite } from '../models';

// Updated interface to be compatible with the Invite type
interface InvitationBannerProps {
  invite: Invite;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

const InvitationBanner: React.FC<InvitationBannerProps> = ({ 
  invite, 
  onAccept, 
  onDecline 
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      await onAccept(invite.id);
      toast.success('Invitation accepted successfully!');
    } catch (error) {
      console.error('Error accepting invitation:', error);
      toast.error('Failed to accept invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDecline = async () => {
    try {
      setIsProcessing(true);
      await onDecline(invite.id);
      toast('Invitation declined');
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error('Failed to decline invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="bg-pa-blue-50 rounded-lg p-6 shadow-sm border border-pa-blue-600/20 mb-6">
      <div className="flex items-start gap-4">
        <div className="rounded-full bg-white p-2 flex-shrink-0">
          <Building className="h-6 w-6 text-pa-blue-600" />
        </div>
        
        <div className="flex-grow">
          <h3 className="text-lg font-semibold font-display text-gray-900">
            Property Invitation
          </h3>
          
          <div className="mt-2 space-y-1 text-gray-700">
            <p><span className="font-medium">Property:</span> {invite.propertyName || 'Unknown Property'}</p>
            {invite.unitId && <p><span className="font-medium">Unit:</span> {invite.unitId}</p>}
          </div>
          
          <div className="mt-4 flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="bg-pa-orange-500 hover:bg-pa-orange-600 focus:ring-2 focus:ring-pa-orange-500 focus:ring-offset-2"
            >
              <Check className="mr-2 h-4 w-4" />
              Accept
            </Button>
            
            <Button
              onClick={handleDecline}
              disabled={isProcessing}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 focus:ring-2 focus:ring-pa-orange-500 focus:ring-offset-2"
            >
              <X className="mr-2 h-4 w-4" />
              Decline
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvitationBanner; 