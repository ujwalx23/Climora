import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { WeatherData, getWeatherIcon, getWeatherCondition, getTravelAdviceKey, getActivityKey } from '@/lib/weather';
import { Droplets, Wind, Eye, Gauge, Sunrise, Sunset, Thermometer, MapPin, Compass, Shirt, Heart, Camera, Brain, UtensilsCrossed } from 'lucide-react';

function getWearKey(code: number): string {
  const c = getWeatherCondition(code);
  switch (c) {
    case 'clear': return 'wearSunny';
    case 'partlyCloudy': case 'cloudy': return 'wearCloudy';
    case 'rain': case 'drizzle': return 'wearRainy';
    case 'snow': return 'wearSnowy';
    case 'thunderstorm': return 'wearStormy';
    case 'fog': return 'wearFoggy';
    default: return 'wearCloudy';
  }
}
function getHealthKey(code: number): string {
  const c = getWeatherCondition(code);
  switch (c) {
    case 'clear': return 'healthSunny';
    case 'partlyCloudy': case 'cloudy': return 'healthCloudy';
    case 'rain': case 'drizzle': return 'healthRainy';
    case 'snow': return 'healthSnowy';
    case 'thunderstorm': return 'healthStormy';
    case 'fog': return 'healthFoggy';
    default: return 'healthCloudy';
  }
}
function getPhotoKey(code: number): string {
  const c = getWeatherCondition(code);
  switch (c) {
    case 'clear': case 'partlyCloudy': return 'photoSunny';
    case 'cloudy': return 'photoCloudy';
    case 'rain': case 'drizzle': return 'photoRainy';
    case 'snow': return 'photoSnowy';
    default: return 'photoCloudy';
  }
}
function getMoodKey(code: number): string {
  const c = getWeatherCondition(code);
  switch (c) {
    case 'clear': case 'partlyCloudy': return 'moodSunny';
    case 'cloudy': return 'moodCloudy';
    case 'rain': case 'drizzle': return 'moodRainy';
    case 'snow': return 'moodSnowy';
    case 'thunderstorm': return 'moodStormy';
    default: return 'moodCloudy';
  }
}
function getFoodKey(code: number): string {
  const c = getWeatherCondition(code);
  switch (c) {
    case 'clear': case 'partlyCloudy': return 'foodSunny';
    case 'cloudy': return 'foodCloudy';
    case 'rain': case 'drizzle': case 'thunderstorm': case 'fog': return 'foodRainy';
    case 'snow': return 'foodSnowy';
    default: return 'foodCloudy';
  }
}

interface WeatherDisplayProps {
  data: WeatherData;
}

export function WeatherDisplay({ data }: WeatherDisplayProps) {
  const { language } = useApp();
  const { current, hourly, daily, location } = data;
  const condition = getWeatherCondition(current.weathercode);
  const travelKey = getTravelAdviceKey(current.weathercode) as any;
  const activityKey = getActivityKey(current.weathercode) as any;

  const statCards = [
    { icon: Thermometer, label: t('feelsLike', language), value: `${Math.round(current.apparent_temperature)}°` },
    { icon: Droplets, label: t('humidity', language), value: `${current.humidity}${t('percent', language)}` },
    { icon: Wind, label: t('wind', language), value: `${current.windspeed} ${t('km_h', language)}` },
    { icon: Eye, label: t('visibility', language), value: `${Math.round(current.visibility)} ${t('km', language)}` },
    { icon: Gauge, label: t('pressure', language), value: `${Math.round(current.pressure)} ${t('hPa', language)}` },
  ];

  const insightCards = [
    { icon: Shirt, title: t('whatToWear', language), content: t(getWearKey(current.weathercode) as any, language), color: 'text-primary' },
    { icon: Heart, title: t('healthAlert', language), content: t(getHealthKey(current.weathercode) as any, language), color: 'text-destructive' },
    { icon: Camera, title: t('photoConditions', language), content: t(getPhotoKey(current.weathercode) as any, language), color: 'text-secondary' },
    { icon: Brain, title: t('moodWeather', language), content: t(getMoodKey(current.weathercode) as any, language), color: 'text-accent' },
    { icon: UtensilsCrossed, title: t('localFood', language), content: t(getFoodKey(current.weathercode) as any, language), color: 'text-primary' },
  ];

  return (
    <div className="space-y-6">
      {/* Main weather card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card-elevated p-6 sm:p-8 relative overflow-hidden"
      >
        <div className="weather-glow w-64 h-64 -top-20 -end-20" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <MapPin className="w-4 h-4" />
            <span className="text-sm font-medium">{location.name}, {location.country}</span>
          </div>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="text-6xl sm:text-7xl font-extralight text-foreground">
                {Math.round(current.temperature)}°
              </div>
              <div className="text-lg text-muted-foreground mt-1">{t(condition, language)}</div>
            </div>
            <div className="text-7xl sm:text-8xl">{getWeatherIcon(current.weathercode, !!current.is_day)}</div>
          </div>
          {daily[0] && (
            <div className="flex gap-4 mt-4 text-sm text-muted-foreground">
              <span>{t('maxTemp', language)}: {Math.round(daily[0].maxTemp)}°</span>
              <span>{t('minTemp', language)}: {Math.round(daily[0].minTemp)}°</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {statCards.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-4 text-center"
          >
            <stat.icon className="w-5 h-5 mx-auto mb-2 text-primary" />
            <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
            <div className="text-lg font-semibold text-foreground">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Sunrise/Sunset */}
      {daily[0] && (
        <div className="grid grid-cols-2 gap-3">
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4 flex items-center gap-3">
            <Sunrise className="w-6 h-6 text-secondary" />
            <div>
              <div className="text-xs text-muted-foreground">{t('sunrise', language)}</div>
              <div className="font-semibold text-foreground">{new Date(daily[0].sunrise).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} className="glass-card p-4 flex items-center gap-3">
            <Sunset className="w-6 h-6 text-secondary" />
            <div>
              <div className="text-xs text-muted-foreground">{t('sunset', language)}</div>
              <div className="font-semibold text-foreground">{new Date(daily[0].sunset).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Hourly */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">{t('hourly', language)}</h3>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
          {hourly.slice(0, 12).map((h, i) => (
            <div key={i} className="flex flex-col items-center gap-1 min-w-[60px]">
              <span className="text-xs text-muted-foreground">
                {new Date(h.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
              <span className="text-2xl">{getWeatherIcon(h.weathercode)}</span>
              <span className="text-sm font-medium text-foreground">{Math.round(h.temperature)}°</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Daily */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
        <h3 className="font-semibold text-foreground mb-4">{t('daily', language)}</h3>
        <div className="space-y-3">
          {daily.map((d, i) => (
            <div key={i} className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground w-24">
                {i === 0 ? t('today', language) : new Date(d.date).toLocaleDateString(language, { weekday: 'short', day: 'numeric' })}
              </span>
              <span className="text-2xl">{getWeatherIcon(d.weathercode)}</span>
              <div className="flex gap-3 text-sm">
                <span className="font-medium text-foreground">{Math.round(d.maxTemp)}°</span>
                <span className="text-muted-foreground">{Math.round(d.minTemp)}°</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Travel Tips */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center gap-2 mb-3">
          <Compass className="w-5 h-5 text-accent" />
          <h3 className="font-semibold text-foreground">{t('travelTips', language)}</h3>
        </div>
        <p className="text-muted-foreground mb-4 leading-relaxed">{t(travelKey, language)}</p>
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-2">{t('bestActivities', language)}</h4>
          <p className="text-muted-foreground leading-relaxed">{t(activityKey, language)}</p>
        </div>
      </motion.div>

      {/* Unique Feature Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {insightCards.map((card, i) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <card.icon className={`w-5 h-5 ${card.color}`} />
              <h4 className="font-semibold text-foreground text-sm">{card.title}</h4>
            </div>
            <p className="text-muted-foreground text-sm leading-relaxed">{card.content}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
