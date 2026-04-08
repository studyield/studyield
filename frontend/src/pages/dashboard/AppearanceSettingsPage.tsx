import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { ArrowLeft, Sun, Moon, Monitor, Check } from 'lucide-react';

type Theme = 'light' | 'dark' | 'system';

function getStoredTheme(): Theme {
  return (localStorage.getItem('theme') as Theme) || 'system';
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;

  if (theme === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    root.classList.toggle('dark', prefersDark);
  } else {
    root.classList.toggle('dark', theme === 'dark');
  }

  localStorage.setItem('theme', theme);
}

const THEME_OPTIONS = [
  {
    value: 'light' as const,
    labelKey: 'appearanceSettingsPage.light',
    descKey: 'appearanceSettingsPage.lightDesc',
    icon: Sun,
    preview: 'bg-white border-gray-200',
  },
  {
    value: 'dark' as const,
    labelKey: 'appearanceSettingsPage.dark',
    descKey: 'appearanceSettingsPage.darkDesc',
    icon: Moon,
    preview: 'bg-gray-900 border-gray-700',
  },
  {
    value: 'system' as const,
    labelKey: 'appearanceSettingsPage.system',
    descKey: 'appearanceSettingsPage.systemDesc',
    icon: Monitor,
    preview: 'bg-gradient-to-r from-white to-gray-900 border-gray-400',
  },
];

export function AppearanceSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>(getStoredTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // Listen for system theme changes when in system mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, [theme]);

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-8"
        >
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard/settings')}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            {t('appearanceSettingsPage.back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('appearanceSettingsPage.title')}</h1>
        </motion.div>

        {/* Theme Selection */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-6"
        >
          <label className="block text-sm font-semibold mb-4">{t('appearanceSettingsPage.theme')}</label>
          <div className="grid grid-cols-3 gap-4">
            {THEME_OPTIONS.map((opt) => {
              const active = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`relative flex flex-col items-center gap-3 p-5 rounded-2xl border-2 transition-all ${
                    active
                      ? 'border-green-500 bg-green-500/5'
                      : 'border-border hover:border-muted-foreground/30'
                  }`}
                >
                  {active && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}

                  {/* Preview box */}
                  <div className={`w-16 h-10 rounded-lg border-2 ${opt.preview}`} />

                  <opt.icon className={`w-5 h-5 ${active ? 'text-green-500' : 'text-muted-foreground'}`} />
                  <div className="text-center">
                    <p className={`text-sm font-medium ${active ? 'text-green-600' : ''}`}>{t(opt.labelKey)}</p>
                    <p className="text-[10px] text-muted-foreground">{t(opt.descKey)}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-xs text-muted-foreground text-center mt-6"
        >
          {t('appearanceSettingsPage.themeInfo')}
        </motion.p>
      </div>
    </DashboardLayout>
  );
}

export default AppearanceSettingsPage;
