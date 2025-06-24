import React from 'react';
import { Building, Check, X, MapPin, Calendar } from 'lucide-react';
import Button from './ui/Button';
import { toast } from 'react-hot-toast';
import { PropertyInvitation } from '../services/firestore/propertyInvitationService';

interface PropertyInvitationBannerProps {
  invitation: PropertyInvitation;
  onAccept: (id: string) => Promise<void>;
  onDecline: (id: string) => Promise<void>;
}

const PropertyInvitationBanner: React.FC<PropertyInvitationBannerProps> = ({ 
  invitation, 
  onAccept, 
  onDecline 
}) => {
  const [isProcessing, setIsProcessing] = React.useState(false);

  const handleAccept = async () => {
    try {
      setIsProcessing(true);
      await onAccept(invitation.id);
      toast.success('Property invitation accepted successfully!');
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
      await onDecline(invitation.id);
      toast('Property invitation declined');
    } catch (error) {
      console.error("Error declining invitation:", error);
      toast.error('Failed to decline invitation');
    } finally {
      setIsProcessing(false);
    }
  };

  // Format expiration date
  const formatExpirationDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Calculate days until expiration
  const getDaysUntilExpiration = (expiresAt: Date) => {
    const now = new Date();
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const daysUntilExpiration = getDaysUntilExpiration(invitation.expiresAt);
  const isExpiringSoon = daysUntilExpiration <= 2;

  return (
    <div className={`rounded-lg p-6 shadow-sm border mb-6 ${
      isExpiringSoon 
        ? 'bg-amber-50 border-amber-200' 
        : 'bg-blue-50 border-blue-200'
    }`}>
      <div className="flex items-start gap-4">
        <div className={`rounded-full p-2 flex-shrink-0 ${
          isExpiringSoon ? 'bg-amber-100' : 'bg-white'
        }`}>
          <Building className={`h-6 w-6 ${
            isExpiringSoon ? 'text-amber-600' : 'text-blue-600'
          }`} />
        </div>
        
        <div className="flex-grow">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold font-display text-gray-900">
              Property Invitation
            </h3>
            {isExpiringSoon && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                <Calendar className="w-3 h-3 mr-1" />
                Expires in {daysUntilExpiration} day{daysUntilExpiration !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          
          <div className="space-y-2 text-gray-700">
            <div className="flex items-center gap-2">
              <Building className="w-4 h-4 text-gray-500" />
              <span className="font-medium">Property:</span>
              <span>{invitation.propertyName || 'Property Details Available After Acceptance'}</span>
            </div>
            
            {invitation.propertyAddress && (
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span className="font-medium">Address:</span>
                <span>{invitation.propertyAddress}</span>
              </div>
            )}
            
            {invitation.unitId && (
              <div className="flex items-center gap-2">
                <span className="font-medium">Unit:</span>
                <span>{invitation.unitId}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <span className="font-medium">From:</span>
              <span>{invitation.landlordEmail}</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Calendar className="w-4 h-4" />
              <span>Expires on {formatExpirationDate(invitation.expiresAt)}</span>
            </div>
          </div>
          
          <div className="mt-4 flex gap-3">
            <Button
              onClick={handleAccept}
              disabled={isProcessing}
              className="bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 text-white"
            >
              <Check className="mr-2 h-4 w-4" />
              {isProcessing ? 'Accepting...' : 'Accept Invitation'}
            </Button>
            
            <Button
              onClick={handleDecline}
              disabled={isProcessing}
              variant="outline"
              className="text-gray-700 border-gray-300 hover:bg-gray-100 focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              <X className="mr-2 h-4 w-4" />
              {isProcessing ? 'Declining...' : 'Decline'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyInvitationBanner; 