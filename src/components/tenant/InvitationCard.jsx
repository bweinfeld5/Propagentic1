import React from 'react';
import Button from '../ui/Button'; // Assuming Button component exists
import { CheckIcon, XMarkIcon, BuildingOffice2Icon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns'; // For user-friendly dates

// Note: The invite object should match the Invite interface from invite.ts
const InvitationCard = ({ invite, onAccept, onDecline, isProcessing }) => {
  // Format the date
  const createdAt = invite.createdAt?.toDate ? invite.createdAt.toDate() : new Date();
  const timeAgo = formatDistanceToNow(createdAt, { addSuffix: true });

  // Handle ID correctly - the Invite interface uses 'id' but some components might use 'inviteId'
  const inviteId = invite.id || invite.inviteId;

  return (
    <div className="bg-background dark:bg-background-darkSubtle p-4 rounded-lg shadow border border-border dark:border-border-dark mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
      <div className="flex items-center space-x-3">
        <div className="bg-primary-subtle dark:bg-primary-darkSubtle p-2 rounded-full">
          <BuildingOffice2Icon className="w-6 h-6 text-primary dark:text-primary-light" />
        </div>
        <div>
          <p className="text-sm font-medium text-content dark:text-content-dark">
            Invitation to join property:
            <span className="font-semibold ml-1">{invite.propertyName || 'Unnamed Property'}</span>
          </p>
          <p className="text-xs text-content-subtle dark:text-content-darkSubtle">
            Invited by {invite.landlordName || invite.managerName || 'Landlord'} • {timeAgo}
          </p>
        </div>
      </div>
      <div className="flex space-x-2 flex-shrink-0 w-full sm:w-auto justify-end">
        <Button 
          variant="outline"
          size="sm"
          onClick={() => onDecline(inviteId)}
          disabled={isProcessing} // Disable if any action is processing
          icon={<XMarkIcon className="w-4 h-4"/>}
        >
          Decline
        </Button>
        <Button 
          variant="success" // Assuming a success variant exists
          size="sm"
          onClick={() => onAccept(inviteId)}
          isLoading={isProcessing} // Show loading state
          disabled={isProcessing}
          icon={<CheckIcon className="w-4 h-4"/>}
        >
          Accept
        </Button>
      </div>
    </div>
  );
};

export default InvitationCard; 