import React, { useState, useEffect } from 'react';
import {
  SunIcon,
  CloudIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const WeatherWidget = ({ location = 'San Francisco, CA' }) => {
  const [weather, setWeather] = useState({
    current: {
      temperature: 72,
      condition: 'sunny',
      humidity: 45,
      windSpeed: 8,
      visibility: 10
    },
    forecast: [
      { day: 'Today', high: 75, low: 62, condition: 'sunny', precipitation: 0 },
      { day: 'Tomorrow', high: 73, low: 58, condition: 'cloudy', precipitation: 20 },
      { day: 'Wed', high: 68, low: 55, condition: 'rainy', precipitation: 80 },
      { day: 'Thu', high: 71, low: 59, condition: 'partly-cloudy', precipitation: 10 }
    ],
    alerts: [
      {
        type: 'warning',
        message: 'High winds expected this afternoon (25-35 mph)',
        severity: 'moderate'
      }
    ]
  });
  const [loading, setLoading] = useState(false);

  // In a real implementation, you would fetch weather data from an API
  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
    }, 1000);
  }, [location]);

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny':
        return <SunIcon className="w-8 h-8 text-yellow-500" />;
      case 'cloudy':
        return <CloudIcon className="w-8 h-8 text-gray-500" />;
      case 'partly-cloudy':
        return <CloudIcon className="w-8 h-8 text-gray-400" />;
      case 'rainy':
        return <CloudArrowDownIcon className="w-8 h-8 text-blue-500" />;
      default:
        return <SunIcon className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getConditionText = (condition) => {
    switch (condition) {
      case 'sunny': return 'Sunny';
      case 'cloudy': return 'Cloudy';
      case 'partly-cloudy': return 'Partly Cloudy';
      case 'rainy': return 'Rainy';
      default: return 'Clear';
    }
  };

  const getWorkConditionAdvice = (condition, windSpeed, precipitation) => {
    if (precipitation > 70) {
      return { text: 'Indoor work recommended', color: 'text-red-600 dark:text-red-400' };
    } else if (windSpeed > 20) {
      return { text: 'Caution: High winds', color: 'text-orange-600 dark:text-orange-400' };
    } else if (precipitation > 30) {
      return { text: 'Possible delays', color: 'text-yellow-600 dark:text-yellow-400' };
    } else {
      return { text: 'Good working conditions', color: 'text-emerald-600 dark:text-emerald-400' };
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-20"></div>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const workAdvice = getWorkConditionAdvice(
    weather.current.condition,
    weather.current.windSpeed,
    weather.forecast[0].precipitation
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
            {getWeatherIcon(weather.current.condition)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Weather
            </h3>
            <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
              <MapPinIcon className="w-3 h-3" />
              <span>{location}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Current Weather */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <div className="text-4xl font-bold text-gray-900 dark:text-white">
              {weather.current.temperature}°F
            </div>
            <div>
              <div className="text-lg font-medium text-gray-900 dark:text-white">
                {getConditionText(weather.current.condition)}
              </div>
              <div className={`text-sm font-medium ${workAdvice.color}`}>
                {workAdvice.text}
              </div>
            </div>
          </div>
        </div>

        {/* Weather Details */}
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {weather.current.windSpeed}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              mph wind
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {weather.current.humidity}%
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              humidity
            </div>
          </div>
          <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <div className="text-lg font-semibold text-gray-900 dark:text-white">
              {weather.current.visibility}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              mi visibility
            </div>
          </div>
        </div>
      </div>

      {/* Weather Alerts */}
      {weather.alerts.length > 0 && (
        <div className="mb-6">
          {weather.alerts.map((alert, index) => (
            <div
              key={index}
              className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3"
            >
              <div className="flex items-start space-x-2">
                <ExclamationTriangleIcon className="w-4 h-4 text-orange-600 dark:text-orange-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-orange-800 dark:text-orange-200">
                    Weather Alert
                  </div>
                  <div className="text-sm text-orange-700 dark:text-orange-300">
                    {alert.message}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4-Day Forecast */}
      <div>
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          4-Day Forecast
        </h4>
        <div className="grid grid-cols-4 gap-2">
          {weather.forecast.map((day, index) => (
            <div key={index} className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
              <div className="text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">
                {day.day}
              </div>
              <div className="flex justify-center mb-2">
                <div className="w-6 h-6">
                  {getWeatherIcon(day.condition)}
                </div>
              </div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">
                {day.high}°
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {day.low}°
              </div>
              {day.precipitation > 0 && (
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  {day.precipitation}%
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget; 