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
  uv_index: number;
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
  uv_index_max: number;
}

export interface AirQuality {
  aqi: number;
  pm2_5: number;
  pm10: number;
  no2: number;
  o3: number;
}

export interface WeatherAlert {
  type: 'extreme_heat' | 'extreme_cold' | 'storm' | 'poor_air' | 'low_visibility' | 'high_uv' | 'high_wind';
  severity: 'warning' | 'danger';
  messageKey: string;
}

export interface WeatherData {
  current: CurrentWeather;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  location: GeoResult;
  airQuality?: AirQuality;
  alerts: WeatherAlert[];
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
  const [weatherRes, aqRes] = await Promise.all([
    fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode,relativehumidity_2m,apparent_temperature,surface_pressure,visibility,uv_index&daily=weathercode,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`
    ),
    fetch(
      `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=${lat}&longitude=${lon}&current=european_aqi,pm2_5,pm10,nitrogen_dioxide,ozone`
    ).catch(() => null),
  ]);

  const data = await weatherRes.json();
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
    uv_index: data.hourly.uv_index?.[currentHourIndex] ?? 0,
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
    uv_index_max: data.daily.uv_index_max?.[i] ?? 0,
  }));

  // Air quality
  let airQuality: AirQuality | undefined;
  if (aqRes) {
    try {
      const aqData = await aqRes.json();
      if (aqData.current) {
        airQuality = {
          aqi: aqData.current.european_aqi ?? 0,
          pm2_5: aqData.current.pm2_5 ?? 0,
          pm10: aqData.current.pm10 ?? 0,
          no2: aqData.current.nitrogen_dioxide ?? 0,
          o3: aqData.current.ozone ?? 0,
        };
      }
    } catch {}
  }

  // Generate alerts
  const alerts = generateAlerts(current, airQuality);

  return { current, hourly, daily, airQuality, alerts };
}

function generateAlerts(current: CurrentWeather, aq?: AirQuality): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];

  if (current.temperature >= 40) {
    alerts.push({ type: 'extreme_heat', severity: 'danger', messageKey: 'alertExtremeHeat' });
  } else if (current.temperature >= 35) {
    alerts.push({ type: 'extreme_heat', severity: 'warning', messageKey: 'alertHeat' });
  }

  if (current.temperature <= -15) {
    alerts.push({ type: 'extreme_cold', severity: 'danger', messageKey: 'alertExtremeCold' });
  } else if (current.temperature <= -5) {
    alerts.push({ type: 'extreme_cold', severity: 'warning', messageKey: 'alertCold' });
  }

  if (current.weathercode >= 95) {
    alerts.push({ type: 'storm', severity: 'danger', messageKey: 'alertStorm' });
  }

  if (current.visibility < 1) {
    alerts.push({ type: 'low_visibility', severity: 'warning', messageKey: 'alertLowVisibility' });
  }

  if (current.uv_index >= 11) {
    alerts.push({ type: 'high_uv', severity: 'danger', messageKey: 'alertExtremeUV' });
  } else if (current.uv_index >= 8) {
    alerts.push({ type: 'high_uv', severity: 'warning', messageKey: 'alertHighUV' });
  }

  if (current.windspeed >= 80) {
    alerts.push({ type: 'high_wind', severity: 'danger', messageKey: 'alertHighWind' });
  } else if (current.windspeed >= 50) {
    alerts.push({ type: 'high_wind', severity: 'warning', messageKey: 'alertWind' });
  }

  if (aq && aq.aqi >= 100) {
    alerts.push({ type: 'poor_air', severity: aq.aqi >= 150 ? 'danger' : 'warning', messageKey: aq.aqi >= 150 ? 'alertDangerousAir' : 'alertPoorAir' });
  }

  return alerts;
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

export function getUVLevel(uv: number): { level: string; color: string } {
  if (uv <= 2) return { level: 'low', color: 'text-green-500' };
  if (uv <= 5) return { level: 'moderate', color: 'text-yellow-500' };
  if (uv <= 7) return { level: 'high', color: 'text-orange-500' };
  if (uv <= 10) return { level: 'veryHigh', color: 'text-red-500' };
  return { level: 'extreme', color: 'text-purple-500' };
}

export function getAQILevel(aqi: number): { level: string; color: string } {
  if (aqi <= 20) return { level: 'good', color: 'text-green-500' };
  if (aqi <= 40) return { level: 'fair', color: 'text-yellow-500' };
  if (aqi <= 60) return { level: 'moderate', color: 'text-orange-500' };
  if (aqi <= 80) return { level: 'poor', color: 'text-red-500' };
  if (aqi <= 100) return { level: 'veryPoor', color: 'text-purple-500' };
  return { level: 'hazardous', color: 'text-red-700' };
}

export function getGoldenHour(sunrise: string, sunset: string): { morningStart: Date; morningEnd: Date; eveningStart: Date; eveningEnd: Date } {
  const sr = new Date(sunrise);
  const ss = new Date(sunset);
  return {
    morningStart: new Date(sr.getTime() - 30 * 60000),
    morningEnd: new Date(sr.getTime() + 60 * 60000),
    eveningStart: new Date(ss.getTime() - 60 * 60000),
    eveningEnd: new Date(ss.getTime() + 30 * 60000),
  };
}
