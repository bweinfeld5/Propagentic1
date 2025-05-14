import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SafeMotion, AnimatePresence } from '../shared/SafeMotion';

/**
 * SortableTaskList Component
 * 
 * A reusable component that provides a visually appealing sortable task list 
 * with drag-and-drop functionality and animations for task cards.
 */
const SortableTaskItem = ({ task, onTaskSelected, getStatusStyles, PriorityIndicator }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 'auto', // Ensure dragging item is on top
  };

  return (
    <SafeMotion.li
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.2 }}
      className={`relative bg-white dark:bg-propagentic-slate-dark rounded-lg border ${
        isDragging
          ? 'border-propagentic-teal shadow-lg'
          : 'border-gray-200 dark:border-gray-700'
      }`}
      onClick={() => onTaskSelected && onTaskSelected(task)}
    >
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div
            {...attributes}
            {...listeners}
            className="cursor-grab active:cursor-grabbing p-1 -ml-1"
          >
            <svg className="w-6 h-6 text-gray-400 hover:text-gray-600 dark:text-gray-600 dark:hover:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
            </svg>
          </div>
          <PriorityIndicator priority={task.priority} />
        </div>
        
        <div className="mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">
            {task.title}
          </h3>
          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {task.description.length > 150 
                ? `${task.description.substring(0, 150)}...` 
                : task.description}
            </p>
          )}
        </div>
        
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <span className={getStatusStyles(task.status)}>
            {task.status}
          </span>
          
          {task.dueDate && (
            <span className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {new Date(task.dueDate).toLocaleDateString()}
            </span>
          )}
        </div>
        
        {task.assignee && (
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center">
            <div className="w-6 h-6 rounded-full bg-gray-300 dark:bg-gray-700 flex items-center justify-center mr-2 overflow-hidden">
              {task.assignee.avatar ? (
                <img 
                  src={task.assignee.avatar} 
                  alt={task.assignee.name} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-xs text-gray-600 dark:text-gray-300 uppercase">
                  {task.assignee.name.charAt(0)}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-600 dark:text-gray-300">
              {task.assignee.name}
            </span>
          </div>
        )}
      </div>
    </SafeMotion.li>
  );
};

const SortableTaskList = ({
  tasks,
  onTasksReordered,
  onTaskStatusChanged,
  onTaskSelected,
  className = '',
  showEmptyState = true
}) => {
  const [localTasks, setLocalTasks] = useState(tasks || []);
  
  useEffect(() => {
    setLocalTasks(tasks || []);
  }, [tasks]);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );
  
  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setLocalTasks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const reorderedTasks = arrayMove(items, oldIndex, newIndex);

        if (onTasksReordered) {
          onTasksReordered(reorderedTasks);
        }

        return reorderedTasks;
      });
    }
  };
  
  const handleStatusChange = (taskId, newStatus) => {
    const updatedTasks = localTasks.map(task => 
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    
    setLocalTasks(updatedTasks);
    
    if (onTaskStatusChanged) {
      const updatedTask = updatedTasks.find(task => task.id === taskId);
      onTaskStatusChanged(updatedTask, newStatus);
    }
  };
  
  const getStatusStyles = (status) => {
    const baseStyles = "px-2 py-1 text-xs rounded-full font-medium";
    
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
      case 'resolved':
        return `${baseStyles} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300`;
      case 'in progress':
      case 'active':
      case 'working':
        return `${baseStyles} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300`;
      case 'pending':
      case 'waiting':
      case 'on hold':
        return `${baseStyles} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300`;
      case 'urgent':
      case 'high':
      case 'critical':
        return `${baseStyles} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300`;
      case 'low':
        return `${baseStyles} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300`;
      default:
        return `${baseStyles} bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300`;
    }
  };
  
  const PriorityIndicator = ({ priority }) => {
    if (!priority) return null;
    
    const priorityLevel = typeof priority === 'number' 
      ? priority 
      : priority?.toLowerCase() === 'high' ? 3 
      : priority?.toLowerCase() === 'medium' ? 2 
      : priority?.toLowerCase() === 'low' ? 1 
      : 0;
    
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3].map(level => (
          <div 
            key={level}
            className={`h-2 w-2 rounded-full ${
              level <= priorityLevel 
                ? 'bg-propagentic-error' 
                : 'bg-gray-200 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>
    );
  };
  
  const EmptyState = () => (
    <SafeMotion.div 
      className="flex flex-col items-center justify-center p-8 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <svg 
        className="w-12 h-12 text-gray-400 dark:text-gray-600 mb-4" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={1.5} 
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" 
        />
      </svg>
      <p className="text-gray-600 dark:text-gray-400 text-center">
        No tasks yet. Add your first task to get started.
      </p>
    </SafeMotion.div>
  );
  
  return (
    <div className={className}>
      <AnimatePresence>
        {localTasks.length === 0 && showEmptyState ? (
          <EmptyState />
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={localTasks.map(task => task.id)}
              strategy={verticalListSortingStrategy}
            >
              <ul className="space-y-3">
                <AnimatePresence>
                  {localTasks.map(task => (
                    <SortableTaskItem
                      key={task.id}
                      task={task}
                      id={task.id}
                      onTaskSelected={onTaskSelected}
                      getStatusStyles={getStatusStyles}
                      PriorityIndicator={PriorityIndicator}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </SortableContext>
          </DndContext>
        )}
      </AnimatePresence>
    </div>
  );
};

SortableTaskList.propTypes = {
  tasks: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      title: PropTypes.string.isRequired,
      description: PropTypes.string,
      status: PropTypes.string,
      priority: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      dueDate: PropTypes.string,
      assignee: PropTypes.shape({
        id: PropTypes.string,
        name: PropTypes.string,
        avatar: PropTypes.string
      })
    })
  ),
  onTasksReordered: PropTypes.func,
  onTaskStatusChanged: PropTypes.func,
  onTaskSelected: PropTypes.func,
  className: PropTypes.string,
  showEmptyState: PropTypes.bool
};

export default SortableTaskList; 