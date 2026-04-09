import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { motion } from 'framer-motion';
import { ArrowLeft, Bell, Check } from 'lucide-react';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';

interface NotificationPreferences {
  enabled: boolean;
  studyReminders: boolean;
  streakAlerts: boolean;
  achievementUnlocks: boolean;
  quizResults: boolean;
  examReminders: boolean;
  marketing: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: true,
  studyReminders: true,
  streakAlerts: true,
  achievementUnlocks: true,
  quizResults: true,
  examReminders: true,
  marketing: false,
};

const NOTIFICATION_TYPES = [
  {
    key: 'studyReminders' as const,
    labelKey: 'notificationSettingsPage.studyReminders',
    descKey: 'notificationSettingsPage.studyRemindersDesc',
  },
  {
    key: 'streakAlerts' as const,
    labelKey: 'notificationSettingsPage.streakAlerts',
    descKey: 'notificationSettingsPage.streakAlertsDesc',
  },
  {
    key: 'achievementUnlocks' as const,
    labelKey: 'notificationSettingsPage.achievements',
    descKey: 'notificationSettingsPage.achievementsDesc',
  },
  {
    key: 'quizResults' as const,
    labelKey: 'notificationSettingsPage.quizResults',
    descKey: 'notificationSettingsPage.quizResultsDesc',
  },
  {
    key: 'examReminders' as const,
    labelKey: 'notificationSettingsPage.examReminders',
    descKey: 'notificationSettingsPage.examRemindersDesc',
  },
  {
    key: 'marketing' as const,
    labelKey: 'notificationSettingsPage.productUpdates',
    descKey: 'notificationSettingsPage.productUpdatesDesc',
  },
];

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
        checked ? 'bg-green-500' : 'bg-muted'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition-transform ${
          checked ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );
}

export function NotificationSettingsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const res = await api.get(ENDPOINTS.notifications.preferences);
        setPrefs({ ...DEFAULT_PREFS, ...res.data });
      } catch {
        // Silently ignore fetch errors
      }
      setLoading(false);
    };
    loadPrefs();
  }, []);

  const updatePref = (key: keyof NotificationPreferences, value: boolean) => {
    setPrefs((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.post(ENDPOINTS.notifications.preferences, prefs);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      // Silently ignore save errors
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Spinner size="lg" />
        </div>
      </DashboardLayout>
    );
  }

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
            {t('notificationSettingsPage.back')}
          </Button>
          <h1 className="text-2xl font-bold">{t('notificationSettingsPage.title')}</h1>
        </motion.div>

        {/* Master Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-5 mb-6"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm font-semibold">{t('notificationSettingsPage.allNotifications')}</p>
                <p className="text-xs text-muted-foreground">{t('notificationSettingsPage.masterToggle')}</p>
              </div>
            </div>
            <Toggle checked={prefs.enabled} onChange={(val) => updatePref('enabled', val)} />
          </div>
        </motion.div>

        {/* Individual Toggles */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border divide-y divide-border"
        >
          {NOTIFICATION_TYPES.map((type) => (
            <div key={type.key} className="flex items-center justify-between p-5">
              <div className="flex-1 min-w-0 mr-4">
                <p className="text-sm font-medium">{t(type.labelKey)}</p>
                <p className="text-xs text-muted-foreground">{t(type.descKey)}</p>
              </div>
              <Toggle
                checked={prefs[type.key]}
                onChange={(val) => updatePref(type.key, val)}
                disabled={!prefs.enabled}
              />
            </div>
          ))}
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mt-6"
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-500 hover:bg-green-600 h-12"
          >
            {saving ? (
              <Spinner size="sm" className="mr-2" />
            ) : saved ? (
              <Check className="w-5 h-5 mr-2" />
            ) : null}
            {saving ? t('notificationSettingsPage.saving') : saved ? t('notificationSettingsPage.saved') : t('notificationSettingsPage.savePreferences')}
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}

export default NotificationSettingsPage;
