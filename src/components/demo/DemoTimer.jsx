import React, { useState, useEffect } from 'react';
import { ClockIcon } from '@heroicons/react/24/outline';

const DemoTimer = ({ startTime, isRunning }) => {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let interval = null;

    if (isRunning && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - startTime);
      }, 100); // Update every 100ms for smooth display
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, startTime]);

  const formatTime = (milliseconds) => {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((milliseconds % 1000) / 10); // Show centiseconds

    return {
      minutes: minutes.toString().padStart(2, '0'),
      seconds: seconds.toString().padStart(2, '0'),
      ms: ms.toString().padStart(2, '0')
    };
  };

  const time = formatTime(elapsedTime);

  return (
    <div className="flex items-center space-x-2 bg-gray-900 dark:bg-gray-700 rounded-lg px-4 py-2 shadow-lg">
      <ClockIcon className="h-5 w-5 text-teal-400" />
      <div className="flex items-baseline space-x-1 font-mono">
        <span className="text-2xl font-bold text-white">{time.minutes}</span>
        <span className="text-xl text-gray-400">:</span>
        <span className="text-2xl font-bold text-white">{time.seconds}</span>
        <span className="text-sm text-gray-400">.{time.ms}</span>
      </div>
      {!isRunning && elapsedTime > 0 && (
        <span className="text-xs text-gray-400 ml-2">(Paused)</span>
      )}
    </div>
  );
};

export default DemoTimer; 