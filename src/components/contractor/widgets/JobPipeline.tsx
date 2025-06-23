import React, { useState } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  ArrowRightIcon,
  WrenchScrewdriverIcon,
  TruckIcon,
  ExclamationCircleIcon,
  MapPinIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { designSystem } from '../../../styles/designSystem';
import { layoutSystem } from '../../../styles/layoutSystem';

interface Ticket {
  id: string;
  title?: string;
  description?: string;
  status: string;
  priority?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
  dueDate?: Date;
  payment?: {
    amount: number;
    status: string;
  };
}

interface JobPipelineProps {
  tickets: Ticket[];
}

const JobPipeline: React.FC<JobPipelineProps> = ({ tickets }) => {
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [currentMobileStage, setCurrentMobileStage] = useState(0);
  
  // Group tickets by status
  const pendingJobs = tickets.filter(ticket => ticket.status === 'pending_acceptance');
  const acceptedJobs = tickets.filter(ticket => ticket.status === 'accepted');
  const inProgressJobs = tickets.filter(ticket => ticket.status === 'in_progress');
  const dispatchedJobs = tickets.filter(ticket => ticket.status === 'dispatched');
  const completedJobs = tickets.filter(ticket => ticket.status === 'completed').slice(0, 3); // Show only 3 most recent
  
  // Pipeline stages
  const stages = [
    {
      id: 'pending',
      title: 'Pending',
      shortTitle: 'New', // For mobile
      icon: ClockIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      jobs: pendingJobs
    },
    {
      id: 'accepted',
      title: 'Accepted',
      shortTitle: 'Accepted',
      icon: CheckCircleIcon,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200',
      jobs: acceptedJobs
    },
    {
      id: 'in_progress',
      title: 'In Progress',
      shortTitle: 'Working',
      icon: WrenchScrewdriverIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      jobs: inProgressJobs
    },
    {
      id: 'dispatched',
      title: 'On Site',
      shortTitle: 'On Site',
      icon: TruckIcon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200',
      jobs: dispatchedJobs
    },
    {
      id: 'completed',
      title: 'Completed',
      shortTitle: 'Done',
      icon: CheckCircleIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200',
      jobs: completedJobs
    }
  ];
  
  // Handle drag start
  const handleDragStart = (e: React.DragEvent, jobId: string) => {
    setDraggingId(jobId);
    e.dataTransfer.setData('text/plain', jobId);
    // Add a ghost image
    const ghostElement = document.createElement('div');
    ghostElement.classList.add('bg-white', 'p-2', 'rounded', 'shadow-lg', 'text-sm');
    ghostElement.textContent = 'Moving job...';
    document.body.appendChild(ghostElement);
    e.dataTransfer.setDragImage(ghostElement, 0, 0);
    setTimeout(() => {
      document.body.removeChild(ghostElement);
    }, 0);
  };
  
  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };
  
  // Handle drop
  const handleDrop = (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    const jobId = e.dataTransfer.getData('text/plain');
    console.log(`Move job ${jobId} to stage ${targetStage}`);
    // In a real app, this would update the job status in the database
    setDraggingId(null);
  };
  
  // Format date
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };
  
  // Get priority badge
  const getPriorityBadge = (priority?: string) => {
    if (!priority) return null;
    
    const badgeClasses = {
      high: 'bg-red-100 text-red-800',
      medium: 'bg-yellow-100 text-yellow-800',
      low: 'bg-green-100 text-green-800'
    };
    
    return (
      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${badgeClasses[priority as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800'}`}>
        {priority}
      </span>
    );
  };
  
  // Helper function for empty state messages
  const getEmptyStateMessage = (columnId: string) => {
    switch (columnId) {
      case 'pending':
        return {
          title: 'No Pending Jobs',
          description: 'Complete your verification to start receiving job assignments',
          actionText: 'Complete Verification'
        };
      case 'accepted':
        return {
          title: 'No Accepted Jobs',
          description: 'Accept a job from pending to get started',
          actionText: null
        };
      case 'in_progress':
        return {
          title: 'No Active Work',
          description: 'Start working on accepted jobs',
          actionText: null
        };
      case 'dispatched':
        return {
          title: 'No On-Site Jobs',
          description: 'Jobs will appear here when you\'re dispatched',
          actionText: null
        };
      case 'completed':
        return {
          title: 'No Completed Jobs',
          description: 'Complete your first job to build your reputation',
          actionText: null
        };
      default:
        return {
          title: 'No Jobs',
          description: 'Jobs will appear here when available',
          actionText: null
        };
    }
  };

  // Mobile navigation helpers
  const canNavigatePrev = currentMobileStage > 0;
  const canNavigateNext = currentMobileStage < stages.length - 1;

  const navigatePrev = () => {
    if (canNavigatePrev) {
      setCurrentMobileStage(currentMobileStage - 1);
    }
  };

  const navigateNext = () => {
    if (canNavigateNext) {
      setCurrentMobileStage(currentMobileStage + 1);
    }
  };

  return (
    <div>
      {/* Mobile Pipeline View (Single Column with Navigation) */}
      <div className="md:hidden">
        {/* Mobile Stage Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={navigatePrev}
            disabled={!canNavigatePrev}
            className={`p-2 rounded-lg ${canNavigatePrev ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronLeftIcon className="w-5 h-5" />
          </button>
          
          <div className="flex-1 text-center">
            <div className="flex items-center justify-center space-x-2">
              <div className={`${stages[currentMobileStage].bgColor} ${stages[currentMobileStage].borderColor} border rounded-lg px-3 py-1`}>
                <span className={`text-sm font-medium ${stages[currentMobileStage].color}`}>
                  {stages[currentMobileStage].shortTitle}
                </span>
                <span className="ml-2 text-xs text-gray-500">
                  ({stages[currentMobileStage].jobs.length})
                </span>
              </div>
            </div>
            
            {/* Stage Dots */}
            <div className="flex items-center justify-center space-x-1 mt-2">
              {stages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMobileStage(index)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentMobileStage ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <button
            onClick={navigateNext}
            disabled={!canNavigateNext}
            className={`p-2 rounded-lg ${canNavigateNext ? 'text-gray-700 hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'}`}
          >
            <ChevronRightIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Stage Content */}
        <div className="space-y-3">
          {stages[currentMobileStage].jobs.length === 0 ? (
            <div className="text-center py-8">
              <div className={`w-12 h-12 ${stages[currentMobileStage].bgColor} rounded-full flex items-center justify-center mb-4 mx-auto opacity-50 shadow-sm`}>
                {React.createElement(stages[currentMobileStage].icon, {
                  className: `w-6 h-6 ${stages[currentMobileStage].color}`
                })}
              </div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {getEmptyStateMessage(stages[currentMobileStage].id).title}
              </h4>
              <p className="text-xs text-gray-500 mb-4 max-w-[200px] mx-auto leading-relaxed">
                {getEmptyStateMessage(stages[currentMobileStage].id).description}
              </p>
              {getEmptyStateMessage(stages[currentMobileStage].id).actionText && (
                <button className={`${designSystem.components.button.outline} text-xs py-2 px-4`}>
                  {getEmptyStateMessage(stages[currentMobileStage].id).actionText}
                </button>
              )}
            </div>
          ) : (
            stages[currentMobileStage].jobs.map((job) => (
              <div
                key={job.id}
                className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 active:shadow-md transition-all duration-200"
              >
                {/* Job header */}
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-tight flex-1 mr-2">
                    {job.title || `Job #${job.id.substring(0, 6)}`}
                  </h4>
                  {getPriorityBadge(job.priority)}
                </div>
                
                {/* Job description */}
                {job.description && (
                  <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                )}
                
                {/* Job details */}
                <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                  <div className="flex items-center flex-1 min-w-0 mr-2">
                    <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                    <span className="truncate">
                      {job.address || 'Address not specified'}
                    </span>
                  </div>
                  
                  {job.payment?.amount && (
                    <span className="font-semibold text-green-600 flex-shrink-0">
                      ${job.payment.amount}
                    </span>
                  )}
                </div>
                
                {/* Action buttons for mobile */}
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <button className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200 px-2 py-1">
                    Details
                  </button>
                  
                  {stages[currentMobileStage].id === 'pending' && (
                    <div className="flex space-x-2">
                      <button className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors duration-200 px-3 py-1 rounded border border-red-200">
                        Decline
                      </button>
                      <button className="text-xs text-white bg-green-600 hover:bg-green-700 font-medium transition-colors duration-200 px-3 py-1 rounded">
                        Accept
                      </button>
                    </div>
                  )}
                  
                  {stages[currentMobileStage].id === 'accepted' && (
                    <button className="text-xs text-white bg-orange-600 hover:bg-orange-700 font-medium flex items-center transition-colors duration-200 px-3 py-1 rounded">
                      <span>Start Work</span>
                      <ArrowRightIcon className="w-3 h-3 ml-1" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      
      {/* Desktop Pipeline Grid */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 md:gap-6">
        {stages.map((stage) => {
          const StageIcon = stage.icon;
          
          return (
            <div 
              key={stage.id}
              className={`${stage.bgColor} ${stage.borderColor} border rounded-xl p-4`}
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, stage.id)}
            >
              {/* Stage header with consistent icon styling */}
              <div className="flex items-center mb-4">
                <div className={`${designSystem.components.iconContainer.sm} ${stage.color} bg-white mr-3 shadow-sm`}>
                  <StageIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-gray-700 flex-1">{stage.title}</h3>
                <span className="text-xs font-medium bg-white/90 px-2.5 py-1 rounded-full text-gray-600 shadow-sm">
                  {stage.jobs.length}
                </span>
              </div>
              
              {/* Jobs container with consistent spacing */}
              <div className="space-y-3">
                {stage.jobs.length === 0 ? (
                  <div className="text-center py-6 lg:py-8">
                    <div className={`w-10 h-10 ${stage.bgColor} rounded-full flex items-center justify-center mb-4 mx-auto opacity-50 shadow-sm`}>
                      <StageIcon className={`w-5 h-5 ${stage.color}`} />
                    </div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      {getEmptyStateMessage(stage.id).title}
                    </h4>
                    <p className="text-xs text-gray-500 mb-4 max-w-[140px] mx-auto leading-relaxed">
                      {getEmptyStateMessage(stage.id).description}
                    </p>
                    {getEmptyStateMessage(stage.id).actionText && (
                      <button className={`${designSystem.components.button.outline} text-xs py-1.5 px-3`}>
                        {getEmptyStateMessage(stage.id).actionText}
                      </button>
                    )}
                  </div>
                ) : (
                  stage.jobs.map((job) => (
                    <div
                      key={job.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, job.id)}
                      className={`bg-white rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-grab border border-gray-100 ${
                        draggingId === job.id ? 'opacity-50' : ''
                      }`}
                    >
                      {/* Job header */}
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-900 line-clamp-1 leading-tight">
                          {job.title || `Job #${job.id.substring(0, 6)}`}
                        </h4>
                        {getPriorityBadge(job.priority)}
                      </div>
                      
                      {/* Job description */}
                      {job.description && (
                        <p className="text-xs text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {job.description}
                        </p>
                      )}
                      
                      {/* Job details */}
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <div className="flex items-center">
                          <MapPinIcon className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {job.address || 'Address not specified'}
                          </span>
                        </div>
                        
                        {job.payment?.amount && (
                          <span className="font-semibold text-green-600">
                            ${job.payment.amount}
                          </span>
                        )}
                      </div>
                      
                      {/* Action buttons with consistent styling */}
                      <div className="pt-3 border-t border-gray-100 flex justify-between items-center">
                        <button className="text-xs text-gray-600 hover:text-gray-900 font-medium transition-colors duration-200">
                          Details
                        </button>
                        
                        {stage.id === 'pending' && (
                          <div className="flex space-x-3">
                            <button className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors duration-200">
                              Decline
                            </button>
                            <button className="text-xs text-green-600 hover:text-green-700 font-medium transition-colors duration-200">
                              Accept
                            </button>
                          </div>
                        )}
                        
                        {stage.id === 'accepted' && (
                          <button className="text-xs text-orange-600 hover:text-orange-700 font-medium flex items-center transition-colors duration-200">
                            <span>Start</span>
                            <ArrowRightIcon className="w-3 h-3 ml-1" />
                          </button>
                        )}
                        
                        {stage.id === 'in_progress' && (
                          <button className="text-xs text-purple-600 hover:text-purple-700 font-medium flex items-center transition-colors duration-200">
                            <span>On Site</span>
                            <ArrowRightIcon className="w-3 h-3 ml-1" />
                          </button>
                        )}
                        
                        {stage.id === 'dispatched' && (
                          <button className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center transition-colors duration-200">
                            <span>Complete</span>
                            <ArrowRightIcon className="w-3 h-3 ml-1" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Mobile hint with consistent typography */}
      <div className="md:hidden mt-4">
        <p className="text-xs text-gray-500 text-center">Swipe horizontally to see all stages</p>
      </div>
    </div>
  );
};

export default JobPipeline; 