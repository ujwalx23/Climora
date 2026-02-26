import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { GeoResult, WeatherData, getWeather } from '@/lib/weather';
import { CloudSun, MapPin } from 'lucide-react';

const popularCities: { name: string; lat: number; lon: number; country: string; emoji: string }[] = [
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503, country: 'Japan', emoji: '🗼' },
  { name: 'Paris', lat: 48.8566, lon: 2.3522, country: 'France', emoji: '🗼' },
  { name: 'New York', lat: 40.7128, lon: -74.006, country: 'USA', emoji: '🗽' },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777, country: 'India', emoji: '🏙️' },
  { name: 'London', lat: 51.5074, lon: -0.1278, country: 'UK', emoji: '🎡' },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708, country: 'UAE', emoji: '🏜️' },
];

const Index = () => {
  const { language } = useApp();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchWeather = async (location: GeoResult) => {
    setLoading(true);
    setError('');
    try {
      const data = await getWeather(location.latitude, location.longitude);
      setWeatherData({ ...data, location });
    } catch {
      setError(t('errorFetching', language));
    } finally {
      setLoading(false);
    }
  };

  const handleCityClick = (city: typeof popularCities[0]) => {
    fetchWeather({
      name: city.name,
      latitude: city.lat,
      longitude: city.lon,
      country: city.country,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {!weatherData && !loading ? (
          /* Hero Section */
          <div className="pt-16 pb-12">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center mb-12"
            >
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-3xl gradient-sky mb-6"
              >
                <CloudSun className="w-10 h-10 text-primary-foreground" />
              </motion.div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 leading-tight">
                {t('heroTitle', language)}
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('heroSubtitle', language)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl mx-auto mb-16"
            >
              <SearchBar onSelect={fetchWeather} large />
            </motion.div>

            {/* Popular Cities */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider text-center mb-6">
                {t('popularCities', language)}
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {popularCities.map((city, i) => (
                  <motion.button
                    key={city.name}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    onClick={() => handleCityClick(city)}
                    className="glass-card p-4 text-center hover:scale-105 transition-transform cursor-pointer group"
                  >
                    <span className="text-3xl mb-2 block">{city.emoji}</span>
                    <div className="font-medium text-foreground text-sm">{city.name}</div>
                    <div className="text-xs text-muted-foreground">{city.country}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          /* Weather View */
          <div className="pt-6">
            <div className="max-w-xl mx-auto mb-6">
              <SearchBar onSelect={fetchWeather} />
            </div>

            {loading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20"
              >
                <div className="w-12 h-12 border-3 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">{t('loading', language)}</p>
              </motion.div>
            )}

            {error && (
              <div className="text-center py-20">
                <p className="text-destructive">{error}</p>
              </div>
            )}

            {weatherData && !loading && <WeatherDisplay data={weatherData} />}
          </div>
        )}
      </main>
    </div>
  );
};

export default Index;
