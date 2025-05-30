import React, { useState } from 'react';
import {
  ClipboardDocumentListIcon,
  DocumentCheckIcon,
  BellIcon,
  CalendarDaysIcon,
  PhoneIcon,
  ChatBubbleLeftRightIcon,
  PlusIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { designSystem } from '../../../styles/designSystem';
import { layoutSystem } from '../../../styles/layoutSystem';
import CollapsibleWidget from './CollapsibleWidget';

interface QuickActionsHubProps {
  onActionClick: (action: string) => void;
}

const QuickActionsHub: React.FC<QuickActionsHubProps> = ({ onActionClick }) => {
  const [pressedAction, setPressedAction] = useState<string | null>(null);

  const quickActions = [
    {
      id: 'jobs',
      title: 'View Jobs',
      description: 'Browse available assignments',
      icon: ClipboardDocumentListIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      action: () => onActionClick('jobs'),
      priority: 'high', // Show first on mobile
      badge: 3 // Number of new jobs
    },
    {
      id: 'verification',
      title: 'Complete Profile',
      description: 'Finish document verification',
      icon: DocumentCheckIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      action: () => onActionClick('verification'),
      priority: 'high'
    },
    {
      id: 'schedule',
      title: 'Check Schedule',
      description: 'View upcoming appointments',
      icon: CalendarDaysIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      action: () => onActionClick('schedule'),
      priority: 'medium'
    },
    {
      id: 'support',
      title: 'Contact Support',
      description: 'Get help when needed',
      icon: PhoneIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      action: () => onActionClick('support'),
      priority: 'low'
    },
    {
      id: 'messages',
      title: 'Messages',
      description: 'Chat with property managers',
      icon: ChatBubbleLeftRightIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      action: () => onActionClick('messages'),
      priority: 'medium',
      badge: 2 // Number of unread messages
    },
    {
      id: 'notifications',
      title: 'Notifications',
      description: 'View alerts and updates',
      icon: BellIcon,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200',
      action: () => onActionClick('notifications'),
      priority: 'medium',
      badge: 5 // Number of notifications
    }
  ];

  // Sort actions by priority for mobile display
  const sortedActions = [...quickActions].sort((a, b) => {
    const priorityOrder = { high: 1, medium: 2, low: 3 };
    return (priorityOrder[a.priority as keyof typeof priorityOrder] || 3) - 
           (priorityOrder[b.priority as keyof typeof priorityOrder] || 3);
  });

  // Calculate total badges for the widget header
  const totalBadges = quickActions.reduce((sum, action) => sum + (action.badge || 0), 0);

  const handleActionPress = (actionId: string, action: () => void) => {
    setPressedAction(actionId);
    setTimeout(() => {
      setPressedAction(null);
      action();
    }, 150);
  };

  return (
    <CollapsibleWidget
      title="Quick Actions"
      icon={PlusIcon}
      priority="high"
      badge={totalBadges > 0 ? totalBadges : undefined}
      defaultExpanded={true} // Keep expanded since these are important actions
    >
      {/* Mobile Grid (2 columns, priority-based) */}
      <div className="grid grid-cols-2 gap-3 md:hidden">
        {sortedActions.slice(0, 4).map((action) => {
          const IconComponent = action.icon;
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionPress(action.id, action.action)}
              className={`${action.bgColor} ${action.borderColor} border rounded-xl p-4 text-left transition-all duration-200 active:scale-95 ${
                pressedAction === action.id ? 'scale-95 shadow-inner' : 'hover:shadow-md active:shadow-inner'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`${designSystem.components.iconContainer.sm} ${action.color} bg-white shadow-sm`}>
                  <IconComponent className="w-4 h-4" />
                </div>
                {action.badge && (
                  <span className="bg-red-500 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {action.badge}
                  </span>
                )}
              </div>
              
              <h3 className="text-sm font-semibold text-gray-900 mb-1 leading-tight">
                {action.title}
              </h3>
              <p className="text-xs text-gray-600 leading-relaxed line-clamp-2">
                {action.description}
              </p>
            </button>
          );
        })}
      </div>

      {/* Tablet/Desktop List View */}
      <div className="hidden md:block space-y-3">
        {sortedActions.map((action) => {
          const IconComponent = action.icon;
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionPress(action.id, action.action)}
              className={`w-full ${action.bgColor} ${action.borderColor} border rounded-xl p-4 text-left transition-all duration-200 hover:shadow-md group ${
                pressedAction === action.id ? 'scale-98 shadow-inner' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`${designSystem.components.iconContainer.md} ${action.color} bg-white shadow-sm`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm md:text-base font-semibold text-gray-900 mb-1 leading-tight">
                      {action.title}
                    </h3>
                    <p className="text-xs md:text-sm text-gray-600 leading-relaxed">
                      {action.description}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3">
                  {action.badge && (
                    <span className="bg-red-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                      {action.badge}
                    </span>
                  )}
                  <ChevronRightIcon className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors duration-200" />
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Mobile "Show More" Action */}
      <div className="md:hidden mt-4">
        <button 
          onClick={() => onActionClick('more')}
          className="w-full bg-orange-50 border border-orange-200 rounded-xl p-3 text-center transition-all duration-200 hover:bg-orange-100 active:scale-95"
        >
          <span className="text-sm font-medium text-orange-700">View All Actions</span>
        </button>
      </div>
    </CollapsibleWidget>
  );
};

export default QuickActionsHub; 