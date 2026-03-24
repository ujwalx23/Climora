import { useState } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { Header } from '@/components/Header';
import { SearchBar } from '@/components/SearchBar';
import { WeatherDisplay } from '@/components/WeatherDisplay';
import { GeoResult, WeatherData, getWeather } from '@/lib/weather';
import { CloudSun, MapPin } from 'lucide-react';

const popularCities = [
  { nameKey: 'cityTokyo' as const, countryKey: 'countryJapan' as const, lat: 35.6762, lon: 139.6503, emoji: '🗼' },
  { nameKey: 'cityParis' as const, countryKey: 'countryFrance' as const, lat: 48.8566, lon: 2.3522, emoji: '🗼' },
  { nameKey: 'cityNewYork' as const, countryKey: 'countryUSA' as const, lat: 40.7128, lon: -74.006, emoji: '🗽' },
  { nameKey: 'cityMumbai' as const, countryKey: 'countryIndia' as const, lat: 19.076, lon: 72.8777, emoji: '🏙️' },
  { nameKey: 'cityLondon' as const, countryKey: 'countryUK' as const, lat: 51.5074, lon: -0.1278, emoji: '🎡' },
  { nameKey: 'cityDubai' as const, countryKey: 'countryUAE' as const, lat: 25.2048, lon: 55.2708, emoji: '🏜️' },
];

const cityEnglishNames: Record<string, string> = {
  cityTokyo: 'Tokyo', cityParis: 'Paris', cityNewYork: 'New York',
  cityMumbai: 'Mumbai', cityLondon: 'London', cityDubai: 'Dubai',
};
const countryEnglishNames: Record<string, string> = {
  countryJapan: 'Japan', countryFrance: 'France', countryUSA: 'USA',
  countryIndia: 'India', countryUK: 'UK', countryUAE: 'UAE',
};

const Index = () => {
  const { language } = useApp();
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);

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
      name: cityEnglishNames[city.nameKey],
      latitude: city.lat,
      longitude: city.lon,
      country: countryEnglishNames[city.countryKey],
    });
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setError(t('locationError', language));
      return;
    }
    setDetectingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${pos.coords.latitude}&longitude=${pos.coords.longitude}&count=1`);
          // Use reverse geocoding via nominatim
          const revRes = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`);
          const revData = await revRes.json();
          const locationName = revData.address?.city || revData.address?.town || revData.address?.village || 'Your Location';
          const country = revData.address?.country || '';
          await fetchWeather({
            name: locationName,
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            country,
          });
        } catch {
          setError(t('errorFetching', language));
        } finally {
          setDetectingLocation(false);
        }
      },
      () => {
        setError(t('locationError', language));
        setDetectingLocation(false);
      }
    );
  };

  const goHome = () => {
    setWeatherData(null);
    setError('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onHomeClick={goHome} showHome={!!weatherData || !!loading} />

      <main className="max-w-6xl mx-auto px-4 pb-16">
        {!weatherData && !loading ? (
          <div className="pt-10 sm:pt-16 pb-12">
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

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-foreground mb-4 leading-tight">
                {t('heroTitle', language)}
              </h1>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                {t('heroSubtitle', language)}
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="max-w-xl mx-auto mb-6"
            >
              <SearchBar onSelect={fetchWeather} large />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 }}
              className="text-center mb-16"
            >
              <button
                onClick={handleDetectLocation}
                disabled={detectingLocation}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl glass-card hover:scale-105 transition-transform text-primary font-medium text-sm"
              >
                <MapPin className="w-4 h-4" />
                {detectingLocation ? t('detectingLocation', language) : t('detectLocation', language)}
              </button>
            </motion.div>

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
                    key={city.nameKey}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.05 }}
                    onClick={() => handleCityClick(city)}
                    className="glass-card p-4 text-center hover:scale-105 transition-transform cursor-pointer group"
                  >
                    <span className="text-3xl mb-2 block">{city.emoji}</span>
                    <div className="font-medium text-foreground text-sm">{t(city.nameKey, language)}</div>
                    <div className="text-xs text-muted-foreground">{t(city.countryKey, language)}</div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="pt-6">
            <div className="max-w-xl mx-auto mb-6">
              <SearchBar onSelect={fetchWeather} />
            </div>

            {loading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20">
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
