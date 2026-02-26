import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { t } from '@/lib/i18n';
import { searchLocations, GeoResult } from '@/lib/weather';

interface SearchBarProps {
  onSelect: (location: GeoResult) => void;
  large?: boolean;
}

export function SearchBar({ onSelect, large = false }: SearchBarProps) {
  const { language } = useApp();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<GeoResult[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (value: string) => {
    setQuery(value);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (value.length < 2) {
      setResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    timeoutRef.current = setTimeout(async () => {
      try {
        const locations = await searchLocations(value);
        setResults(locations);
        setShowDropdown(locations.length > 0);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (location: GeoResult) => {
    setQuery(location.name);
    setShowDropdown(false);
    onSelect(location);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <div className={`glass-card-elevated flex items-center gap-3 ${large ? 'px-6 py-4' : 'px-4 py-3'}`}>
        <Search className={`text-muted-foreground ${large ? 'w-6 h-6' : 'w-5 h-5'}`} />
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={t('searchPlaceholder', language)}
          className={`flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground ${large ? 'text-lg' : 'text-base'}`}
        />
        {loading && (
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        )}
      </div>

      <AnimatePresence>
        {showDropdown && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute top-full mt-2 w-full glass-card-elevated z-50 overflow-hidden"
          >
            {results.map((r, i) => (
              <button
                key={`${r.latitude}-${r.longitude}-${i}`}
                onClick={() => handleSelect(r)}
                className="w-full px-4 py-3 text-left hover:bg-muted/50 transition-colors flex items-center gap-2 text-foreground"
              >
                <span className="text-lg">📍</span>
                <div>
                  <div className="font-medium">{r.name}</div>
                  <div className="text-sm text-muted-foreground">{r.admin1 ? `${r.admin1}, ` : ''}{r.country}</div>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
