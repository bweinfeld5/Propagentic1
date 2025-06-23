interface WeatherData {
  current: {
    temperature: number;
    condition: string;
    humidity: number;
    windSpeed: number;
    visibility: number;
    description: string;
    icon: string;
  };
  forecast: Array<{
    day: string;
    high: number;
    low: number;
    condition: string;
    precipitation: number;
    description: string;
    icon: string;
  }>;
  alerts: Array<{
    type: 'warning' | 'watch' | 'advisory';
    message: string;
    severity: 'minor' | 'moderate' | 'severe' | 'extreme';
  }>;
  location: {
    name: string;
    country: string;
    region: string;
    coords: {
      lat: number;
      lon: number;
    };
  };
}

interface WeatherApiResponse {
  location: {
    name: string;
    region: string;
    country: string;
    lat: number;
    lon: number;
  };
  current: {
    temp_f: number;
    condition: {
      text: string;
      icon: string;
      code: number;
    };
    humidity: number;
    wind_mph: number;
    vis_miles: number;
  };
  forecast: {
    forecastday: Array<{
      date: string;
      day: {
        maxtemp_f: number;
        mintemp_f: number;
        condition: {
          text: string;
          icon: string;
          code: number;
        };
        daily_chance_of_rain: number;
      };
    }>;
  };
  alerts?: {
    alert: Array<{
      headline: string;
      msgtype: string;
      severity: string;
      urgency: string;
      areas: string;
      category: string;
      certainty: string;
      event: string;
      note: string;
      effective: string;
      expires: string;
      desc: string;
      instruction: string;
    }>;
  };
}

class WeatherService {
  private readonly API_KEY = process.env.REACT_APP_WEATHER_API_KEY;
  private readonly BASE_URL = 'https://api.weatherapi.com/v1';

  private getConditionFromCode(code: number): string {
    // Map WeatherAPI condition codes to our simplified conditions
    if (code === 1000) return 'sunny';
    if ([1003, 1006, 1009].includes(code)) return 'partly-cloudy';
    if ([1030, 1135, 1147].includes(code)) return 'cloudy';
    if ([1063, 1180, 1183, 1186, 1189, 1192, 1195, 1240, 1243, 1246].includes(code)) return 'rainy';
    if ([1066, 1069, 1072, 1114, 1117, 1210, 1213, 1216, 1219, 1222, 1225, 1237, 1249, 1252, 1255, 1258, 1261, 1264].includes(code)) return 'snowy';
    if ([1087, 1273, 1276, 1279, 1282].includes(code)) return 'stormy';
    return 'cloudy';
  }

  private getDayName(dateStr: string, index: number): string {
    const date = new Date(dateStr);
    const today = new Date();
    
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  }

  async getWeatherData(location: string): Promise<WeatherData> {
    try {
      // If no API key, return mock data for development
      if (!this.API_KEY || this.API_KEY === 'demo-api-key') {
        return this.getMockWeatherData(location);
      }

      const response = await fetch(
        `${this.BASE_URL}/forecast.json?key=${this.API_KEY}&q=${encodeURIComponent(location)}&days=4&aqi=no&alerts=yes`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data: WeatherApiResponse = await response.json();

      return {
        current: {
          temperature: Math.round(data.current.temp_f),
          condition: this.getConditionFromCode(data.current.condition.code),
          humidity: data.current.humidity,
          windSpeed: Math.round(data.current.wind_mph),
          visibility: Math.round(data.current.vis_miles),
          description: data.current.condition.text,
          icon: data.current.condition.icon
        },
        forecast: data.forecast.forecastday.map((day, index) => ({
          day: this.getDayName(day.date, index),
          high: Math.round(day.day.maxtemp_f),
          low: Math.round(day.day.mintemp_f),
          condition: this.getConditionFromCode(day.day.condition.code),
          precipitation: day.day.daily_chance_of_rain,
          description: day.day.condition.text,
          icon: day.day.condition.icon
        })),
        alerts: data.alerts?.alert.map(alert => ({
          type: this.mapAlertType(alert.msgtype),
          message: alert.headline || alert.event,
          severity: this.mapSeverity(alert.severity)
        })) || [],
        location: {
          name: data.location.name,
          country: data.location.country,
          region: data.location.region,
          coords: {
            lat: data.location.lat,
            lon: data.location.lon
          }
        }
      };
    } catch (error) {
      console.error('Error fetching weather data:', error);
      // Return mock data as fallback
      return this.getMockWeatherData(location);
    }
  }

  private mapAlertType(msgtype: string): 'warning' | 'watch' | 'advisory' {
    if (msgtype.toLowerCase().includes('warning')) return 'warning';
    if (msgtype.toLowerCase().includes('watch')) return 'watch';
    return 'advisory';
  }

  private mapSeverity(severity: string): 'minor' | 'moderate' | 'severe' | 'extreme' {
    switch (severity.toLowerCase()) {
      case 'minor': return 'minor';
      case 'moderate': return 'moderate';
      case 'severe': return 'severe';
      case 'extreme': return 'extreme';
      default: return 'moderate';
    }
  }

  private getMockWeatherData(location: string): WeatherData {
    return {
      current: {
        temperature: 72,
        condition: 'sunny',
        humidity: 45,
        windSpeed: 8,
        visibility: 10,
        description: 'Sunny',
        icon: 'https://cdn.weatherapi.com/weather/64x64/day/113.png'
      },
      forecast: [
        { 
          day: 'Today', 
          high: 75, 
          low: 62, 
          condition: 'sunny', 
          precipitation: 0,
          description: 'Sunny',
          icon: 'https://cdn.weatherapi.com/weather/64x64/day/113.png'
        },
        { 
          day: 'Tomorrow', 
          high: 73, 
          low: 58, 
          condition: 'cloudy', 
          precipitation: 20,
          description: 'Partly cloudy',
          icon: 'https://cdn.weatherapi.com/weather/64x64/day/116.png'
        },
        { 
          day: 'Wed', 
          high: 68, 
          low: 55, 
          condition: 'rainy', 
          precipitation: 80,
          description: 'Light rain',
          icon: 'https://cdn.weatherapi.com/weather/64x64/day/296.png'
        },
        { 
          day: 'Thu', 
          high: 71, 
          low: 59, 
          condition: 'partly-cloudy', 
          precipitation: 10,
          description: 'Partly cloudy',
          icon: 'https://cdn.weatherapi.com/weather/64x64/day/116.png'
        }
      ],
      alerts: [
        {
          type: 'warning',
          message: 'High winds expected this afternoon (25-35 mph)',
          severity: 'moderate'
        }
      ],
      location: {
        name: location.split(',')[0] || 'San Francisco',
        country: 'United States',
        region: location.split(',')[1]?.trim() || 'CA',
        coords: {
          lat: 37.7749,
          lon: -122.4194
        }
      }
    };
  }

  async getLocationSuggestions(query: string): Promise<Array<{name: string, region: string, country: string}>> {
    try {
      if (!this.API_KEY || this.API_KEY === 'demo-api-key') {
        return [
          { name: 'San Francisco', region: 'California', country: 'United States' },
          { name: 'New York', region: 'New York', country: 'United States' },
          { name: 'Los Angeles', region: 'California', country: 'United States' }
        ];
      }

      const response = await fetch(
        `${this.BASE_URL}/search.json?key=${this.API_KEY}&q=${encodeURIComponent(query)}`
      );

      if (!response.ok) {
        throw new Error(`Weather API error: ${response.status}`);
      }

      const data = await response.json();
      return data.map((item: any) => ({
        name: item.name,
        region: item.region,
        country: item.country
      }));
    } catch (error) {
      console.error('Error fetching location suggestions:', error);
      return [];
    }
  }
}

export const weatherService = new WeatherService();
export default weatherService; 