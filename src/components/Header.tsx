import { Moon, Sun, Globe } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { t, languages } from '@/lib/i18n';
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const { language, setLanguage, isDark, toggleTheme } = useApp();
  const [showLangMenu, setShowLangMenu] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl border-b border-border/50 bg-background/80">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-sky flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">R</span>
          </div>
          <span className="text-xl font-bold text-foreground">{t('appName', language)}</span>
        </div>

        <div className="flex items-center gap-2">
          <div ref={langRef} className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-muted transition-colors text-foreground"
            >
              <Globe className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">
                {languages.find(l => l.code === language)?.nativeName}
              </span>
            </button>

            <AnimatePresence>
              {showLangMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -4 }}
                  className="absolute end-0 top-full mt-2 glass-card-elevated overflow-hidden min-w-[160px] z-50"
                >
                  {languages.map(lang => (
                    <button
                      key={lang.code}
                      onClick={() => { setLanguage(lang.code); setShowLangMenu(false); }}
                      className={`w-full px-4 py-2.5 text-start hover:bg-muted/50 transition-colors text-sm ${
                        language === lang.code ? 'text-primary font-semibold' : 'text-foreground'
                      }`}
                    >
                      {lang.nativeName}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-muted transition-colors text-foreground"
            title={isDark ? t('lightMode', language) : t('darkMode', language)}
          >
            {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      </div>
    </header>
  );
}
