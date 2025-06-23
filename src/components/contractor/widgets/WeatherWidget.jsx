import React, { useState, useEffect } from 'react';
import {
  SunIcon,
  CloudIcon,
  CloudArrowDownIcon,
  ExclamationTriangleIcon,
  MapPinIcon
} from '@heroicons/react/24/outline';

const WeatherWidget = ({ location = 'San Francisco, CA', coordinates = null }) => {
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch real weather data from OpenWeatherMap API
  useEffect(() => {
    const fetchWeatherData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Try WeatherAPI.com first (if API key available), otherwise use Open-Meteo (free, no key needed)
        const weatherApiKey = process.env.REACT_APP_WEATHER_API_KEY;
        
        if (weatherApiKey) {
          // Use WeatherAPI.com (requires free API key)
          let query;
          if (coordinates && coordinates.lat && coordinates.lon) {
            query = `${coordinates.lat},${coordinates.lon}`;
          } else {
            query = encodeURIComponent(location);
          }

          const weatherUrl = `https://api.weatherapi.com/v1/forecast.json?key=${weatherApiKey}&q=${query}&days=5&aqi=no&alerts=no`;
          const response = await fetch(weatherUrl);

          if (!response.ok) {
            throw new Error('Failed to fetch weather data');
          }

          const data = await response.json();

          const transformedWeather = {
            current: {
              temperature: Math.round(data.current.temp_f),
              condition: mapWeatherCondition(data.current.condition.text.toLowerCase()),
              humidity: data.current.humidity,
              windSpeed: Math.round(data.current.wind_mph),
              visibility: Math.round(data.current.vis_miles)
            },
            forecast: processWeatherAPIForecast(data.forecast.forecastday),
            alerts: []
          };

          setWeather(transformedWeather);
        } else {
          // Use Open-Meteo (completely free, no API key needed)
          if (!coordinates || !coordinates.lat || !coordinates.lon) {
            throw new Error('Coordinates required for Open-Meteo API');
          }

          const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${coordinates.lat}&longitude=${coordinates.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=auto&forecast_days=5`;
          
          const response = await fetch(weatherUrl);

          if (!response.ok) {
            throw new Error('Failed to fetch weather data');
          }

          const data = await response.json();

          const transformedWeather = {
            current: {
              temperature: Math.round(data.current.temperature_2m),
              condition: mapWeatherCodeToCondition(data.current.weather_code),
              humidity: data.current.relative_humidity_2m,
              windSpeed: Math.round(data.current.wind_speed_10m),
              visibility: 10 // Open-Meteo doesn't provide visibility
            },
            forecast: processOpenMeteoForecast(data.daily),
            alerts: []
          };

          setWeather(transformedWeather);
        }
      } catch (err) {
        console.error('Weather fetch error:', err);
        setError(err.message);
        
        // Fallback to mock data if API fails
        setWeather({
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
          alerts: []
        });
      } finally {
        setLoading(false);
      }
    };

    fetchWeatherData();
  }, [location, coordinates]);

  // Helper function to map weather conditions to our conditions
  const mapWeatherCondition = (condition) => {
    const lowerCondition = condition.toLowerCase();
    
    if (lowerCondition.includes('sunny') || lowerCondition.includes('clear')) {
      return 'sunny';
    } else if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle') || lowerCondition.includes('shower')) {
      return 'rainy';
    } else if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
      return 'cloudy';
    } else if (lowerCondition.includes('partly')) {
      return 'partly-cloudy';
    } else if (lowerCondition.includes('snow') || lowerCondition.includes('mist') || lowerCondition.includes('fog')) {
      return 'cloudy';
    }
    
    return 'sunny'; // default
  };

  // Helper function to process WeatherAPI forecast data
  const processWeatherAPIForecast = (forecastDays) => {
    return forecastDays.slice(0, 4).map((day, index) => {
      const dayName = index === 0 ? 'Today' : 
                    index === 1 ? 'Tomorrow' : 
                    new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' });
      
      return {
        day: dayName,
        high: Math.round(day.day.maxtemp_f),
        low: Math.round(day.day.mintemp_f),
        condition: mapWeatherCondition(day.day.condition.text),
        precipitation: day.day.chance_of_rain || 0
      };
    });
  };

  // Helper function to process Open-Meteo forecast data
  const processOpenMeteoForecast = (daily) => {
    return daily.time.slice(0, 4).map((date, index) => {
      const dayName = index === 0 ? 'Today' : 
                    index === 1 ? 'Tomorrow' : 
                    new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
      
      return {
        day: dayName,
        high: Math.round(daily.temperature_2m_max[index]),
        low: Math.round(daily.temperature_2m_min[index]),
        condition: mapWeatherCodeToCondition(daily.weather_code[index]),
        precipitation: daily.precipitation_probability_max[index] || 0
      };
    });
  };

  // Helper function to map Open-Meteo weather codes to conditions
  const mapWeatherCodeToCondition = (code) => {
    if (code === 0) return 'sunny'; // Clear sky
    if (code >= 1 && code <= 3) return 'partly-cloudy'; // Mainly clear, partly cloudy, overcast
    if (code >= 45 && code <= 48) return 'cloudy'; // Fog
    if (code >= 51 && code <= 67) return 'rainy'; // Drizzle and rain
    if (code >= 71 && code <= 77) return 'cloudy'; // Snow
    if (code >= 80 && code <= 99) return 'rainy'; // Rain showers and thunderstorms
    return 'sunny'; // default
  };

  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny':
        return <SunIcon className="w-8 h-8 text-orange-600" />;
      case 'cloudy':
        return <CloudIcon className="w-8 h-8 text-gray-500" />;
      case 'partly-cloudy':
        return <CloudIcon className="w-8 h-8 text-gray-400" />;
      case 'rainy':
        return <CloudArrowDownIcon className="w-8 h-8 text-blue-500" />;
      default:
        return <SunIcon className="w-8 h-8 text-orange-600" />;
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
      return { text: 'Possible delays', color: 'text-orange-600' };
    } else {
      return { text: 'Good working conditions', color: 'text-emerald-600 dark:text-emerald-400' };
    }
  };

  if (loading || !weather) {
    return (
      <div className="bg-gradient-to-br from-gray-100 via-orange-50 to-gray-200 rounded-2xl border border-orange-200 p-6">
        <div className="animate-pulse">
          <div className="h-5 bg-gray-300 rounded w-32 mb-6"></div>
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
            <div className="space-y-2">
              <div className="h-8 bg-gray-300 rounded w-20"></div>
              <div className="h-4 bg-gray-300 rounded w-24"></div>
            </div>
          </div>
          {error && (
            <div className="text-xs text-orange-600 mt-2">
              {error === 'Weather API key not configured' ? 'Weather data unavailable' : 'Loading weather...'}
            </div>
          )}
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
    <div className="bg-gradient-to-br from-gray-100 via-orange-50 to-gray-200 rounded-2xl border border-orange-200 p-6 hover:shadow-lg transition-shadow duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-md">
            {getWeatherIcon(weather.current.condition)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
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