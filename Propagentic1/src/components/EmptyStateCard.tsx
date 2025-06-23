import React from 'react';
import { Wrench } from 'lucide-react';
import Button from './ui/Button'; // Changed from named import to default import

interface EmptyStateCardProps {
  title: string;
  message: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyStateCard: React.FC<EmptyStateCardProps> = ({
  title,
  message,
  actionLabel,
  onAction,
  icon = <Wrench className="h-12 w-12 stroke-[--pa-blue-600]" />
}) => {
  return (
    <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 bg-white">
      <div className="flex flex-col items-center text-center space-y-4">
        <div className="rounded-full bg-pa-blue-50 p-4">
          {icon}
        </div>
        
        <h3 className="text-xl font-semibold font-display text-gray-900">{title}</h3>
        
        <p className="text-gray-600 max-w-md">{message}</p>
        
        {actionLabel && onAction && (
          <Button 
            onClick={onAction}
            className="mt-4 bg-pa-orange-500 hover:bg-pa-orange-600 focus:ring-2 focus:ring-pa-orange-500 focus:ring-offset-2"
          >
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyStateCard; 