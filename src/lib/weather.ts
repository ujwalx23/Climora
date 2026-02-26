export interface GeoResult {
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}

export interface CurrentWeather {
  temperature: number;
  windspeed: number;
  weathercode: number;
  humidity: number;
  apparent_temperature: number;
  pressure: number;
  visibility: number;
  is_day: number;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  weathercode: number;
}

export interface DailyForecast {
  date: string;
  maxTemp: number;
  minTemp: number;
  weathercode: number;
  sunrise: string;
  sunset: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  location: GeoResult;
}

export async function searchLocations(query: string): Promise<GeoResult[]> {
  const res = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=5&language=en`
  );
  const data = await res.json();
  return (data.results || []).map((r: any) => ({
    name: r.name,
    latitude: r.latitude,
    longitude: r.longitude,
    country: r.country,
    admin1: r.admin1,
  }));
}

export async function getWeather(lat: number, lon: number): Promise<Omit<WeatherData, 'location'>> {
  const res = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode,relativehumidity_2m,apparent_temperature,surface_pressure,visibility&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset&timezone=auto&forecast_days=7`
  );
  const data = await res.json();

  const currentHourIndex = new Date().getHours();

  const current: CurrentWeather = {
    temperature: data.current_weather.temperature,
    windspeed: data.current_weather.windspeed,
    weathercode: data.current_weather.weathercode,
    humidity: data.hourly.relativehumidity_2m?.[currentHourIndex] ?? 0,
    apparent_temperature: data.hourly.apparent_temperature?.[currentHourIndex] ?? data.current_weather.temperature,
    pressure: data.hourly.surface_pressure?.[currentHourIndex] ?? 0,
    visibility: (data.hourly.visibility?.[currentHourIndex] ?? 0) / 1000,
    is_day: data.current_weather.is_day,
  };

  const hourly: HourlyForecast[] = data.hourly.time.slice(currentHourIndex, currentHourIndex + 24).map((time: string, i: number) => ({
    time,
    temperature: data.hourly.temperature_2m[currentHourIndex + i],
    weathercode: data.hourly.weathercode[currentHourIndex + i],
  }));

  const daily: DailyForecast[] = data.daily.time.map((date: string, i: number) => ({
    date,
    maxTemp: data.daily.temperature_2m_max[i],
    minTemp: data.daily.temperature_2m_min[i],
    weathercode: data.daily.weathercode[i],
    sunrise: data.daily.sunrise[i],
    sunset: data.daily.sunset[i],
  }));

  return { current, hourly, daily };
}

export function getWeatherIcon(code: number, isDay: boolean = true): string {
  if (code === 0) return isDay ? '☀️' : '🌙';
  if (code <= 3) return isDay ? '⛅' : '☁️';
  if (code <= 49) return '🌫️';
  if (code <= 59) return '🌦️';
  if (code <= 69) return '🌧️';
  if (code <= 79) return '🌨️';
  if (code <= 82) return '🌧️';
  if (code <= 86) return '🌨️';
  if (code >= 95) return '⛈️';
  return '🌤️';
}

export function getWeatherCondition(code: number): 'clear' | 'cloudy' | 'rain' | 'snow' | 'thunderstorm' | 'fog' | 'drizzle' | 'partlyCloudy' {
  if (code === 0) return 'clear';
  if (code <= 3) return 'partlyCloudy';
  if (code <= 49) return 'fog';
  if (code <= 59) return 'drizzle';
  if (code <= 69) return 'rain';
  if (code <= 79) return 'snow';
  if (code <= 82) return 'rain';
  if (code <= 86) return 'snow';
  if (code >= 95) return 'thunderstorm';
  return 'cloudy';
}

export function getTravelAdviceKey(code: number): string {
  const condition = getWeatherCondition(code);
  switch (condition) {
    case 'clear': return 'travelAdviceSunny';
    case 'partlyCloudy':
    case 'cloudy': return 'travelAdviceCloudy';
    case 'rain':
    case 'drizzle': return 'travelAdviceRainy';
    case 'snow': return 'travelAdviceSnowy';
    case 'thunderstorm': return 'travelAdviceStormy';
    case 'fog': return 'travelAdviceFoggy';
    default: return 'travelAdviceCloudy';
  }
}

export function getActivityKey(code: number): string {
  const condition = getWeatherCondition(code);
  switch (condition) {
    case 'clear':
    case 'partlyCloudy': return 'activitySunny';
    case 'cloudy': return 'activityCloudy';
    case 'rain':
    case 'drizzle': return 'activityRainy';
    case 'snow': return 'activitySnowy';
    case 'thunderstorm': return 'activityRainy';
    case 'fog': return 'activityCloudy';
    default: return 'activityCloudy';
  }
}
