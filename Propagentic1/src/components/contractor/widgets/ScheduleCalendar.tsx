import React, { useState } from 'react';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';

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

interface ScheduleCalendarProps {
  tickets: Ticket[];
}

const ScheduleCalendar: React.FC<ScheduleCalendarProps> = ({ tickets }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  
  // Get month name
  const getMonthName = (date: Date) => {
    return date.toLocaleString('default', { month: 'long' });
  };
  
  // Get year
  const getYear = (date: Date) => {
    return date.getFullYear();
  };
  
  // Get days in month
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };
  
  // Get first day of month
  const getFirstDayOfMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };
  
  // Previous month
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  // Next month
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Check if date is today
  const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear();
  };
  
  // Check if date is selected
  const isSelected = (date: Date) => {
    return date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear();
  };
  
  // Check if date has jobs
  const getJobsForDate = (date: Date) => {
    return tickets.filter(ticket => {
      const dueDate = ticket.dueDate || ticket.createdAt;
      return dueDate.getDate() === date.getDate() &&
        dueDate.getMonth() === date.getMonth() &&
        dueDate.getFullYear() === date.getFullYear();
    });
  };
  
  // Render calendar
  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDayOfMonth = getFirstDayOfMonth(currentMonth);
    const days = [];
    
    // Add empty cells for days before first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(
        <div key={`empty-${i}`} className="h-8 w-8"></div>
      );
    }
    
    // Add days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      const jobsForDate = getJobsForDate(date);
      const hasJobs = jobsForDate.length > 0;
      
      days.push(
        <div 
          key={`day-${day}`}
          className="relative"
        >
          <button
            onClick={() => setSelectedDate(date)}
            className={`h-8 w-8 rounded-full flex items-center justify-center text-sm transition-colors duration-200 relative ${
              isSelected(date)
                ? 'bg-orange-600 text-white'
                : isToday(date)
                  ? 'bg-orange-100 text-orange-800'
                  : 'hover:bg-orange-50 text-gray-700'
            }`}
          >
            {day}
          </button>
          {hasJobs && (
            <span className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full ${
              isSelected(date) ? 'bg-white' : 'bg-orange-500'
            }`}></span>
          )}
        </div>
      );
    }
    
    return days;
  };
  
  // Get jobs for selected date
  const selectedDateJobs = getJobsForDate(selectedDate);
  
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-xl border border-orange-200 p-6 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-orange-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">Schedule</h2>
        </div>
      </div>
      
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-medium text-gray-900">
          {getMonthName(currentMonth)} {getYear(currentMonth)}
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-orange-100 text-gray-600"
            aria-label="Previous month"
          >
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-orange-100 text-gray-600"
            aria-label="Next month"
          >
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="mb-4">
        {/* Day labels */}
        <div className="grid grid-cols-7 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
            <div key={index} className="h-8 flex items-center justify-center">
              <span className="text-xs font-medium text-gray-500">{day}</span>
            </div>
          ))}
        </div>
        
        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-1">
          {renderCalendar()}
        </div>
      </div>
      
      {/* Selected Date Jobs */}
      <div className="mt-4 pt-4 border-t border-orange-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900">
            {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'short', 
              month: 'short', 
              day: 'numeric' 
            })}
          </h3>
          <span className="text-xs text-gray-500">
            {selectedDateJobs.length} {selectedDateJobs.length === 1 ? 'job' : 'jobs'}
          </span>
        </div>
        
        {selectedDateJobs.length === 0 ? (
          <p className="text-sm text-gray-500 py-2">No jobs scheduled</p>
        ) : (
          <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
            {selectedDateJobs.map((job) => (
              <div 
                key={job.id}
                className="bg-orange-50 rounded-lg p-2 border border-orange-100"
              >
                <h4 className="text-sm font-medium text-gray-800 truncate">
                  {job.title || `Job #${job.id.substring(0, 6)}`}
                </h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-gray-500">
                    {job.status.replace('_', ' ')}
                  </span>
                  {job.priority && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                      job.priority === 'high' 
                        ? 'bg-red-100 text-red-800' 
                        : job.priority === 'medium'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {job.priority}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div className="mt-4 pt-4 border-t border-orange-200">
        <button className="w-full text-sm text-orange-600 hover:text-orange-700 font-medium py-2 border border-orange-200 rounded-lg hover:bg-orange-50 transition-colors duration-200">
          View Full Calendar
        </button>
      </div>
    </div>
  );
};

export default ScheduleCalendar; 