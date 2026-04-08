import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useGamificationStore } from '@/stores/useGamificationStore';
import { getLevelInfo } from '@/types';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Bell,
  Palette,
  ChevronRight,
  LogOut,
  CreditCard,
  Star,
} from 'lucide-react';
import { useEffect } from 'react';

const settingsSections = [
  {
    labelKey: 'settings.profile',
    descKey: 'settings.profileDesc',
    icon: User,
    href: '/dashboard/settings/profile',
    color: 'green',
  },
  {
    labelKey: 'settings.account',
    descKey: 'settings.accountDesc',
    icon: Shield,
    href: '/dashboard/settings/account',
    color: 'blue',
  },
  {
    labelKey: 'settings.notifications',
    descKey: 'settings.notificationsDesc',
    icon: Bell,
    href: '/dashboard/settings/notifications',
    color: 'amber',
  },
  {
    labelKey: 'settings.appearance',
    descKey: 'settings.appearanceDesc',
    icon: Palette,
    href: '/dashboard/settings/appearance',
    color: 'purple',
  },
  {
    labelKey: 'settings.subscription',
    descKey: 'settings.subscriptionDesc',
    icon: CreditCard,
    href: '/dashboard/subscription/manage',
    color: 'emerald',
  },
];

export function SettingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { stats, fetchGamification } = useGamificationStore();

  useEffect(() => {
    fetchGamification();
  }, [fetchGamification]);

  const levelInfo = stats ? getLevelInfo(stats.level) : null;

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold">{t('settings.title')}</h1>
          <p className="text-muted-foreground mt-1">{t('settings.subtitle')}</p>
        </motion.div>

        {/* User Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card rounded-2xl border border-border p-5 mb-6 flex items-center gap-4"
        >
          <div className="relative w-14 h-14 shrink-0">
            <div className={`w-14 h-14 rounded-full ${levelInfo ? `bg-gradient-to-br ${levelInfo.gradient}` : 'bg-green-500/10'} flex items-center justify-center overflow-hidden ring-2 ring-background`}>
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-14 h-14 rounded-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </span>
              )}
            </div>
            {levelInfo && (
              <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gradient-to-br ${levelInfo.gradient} flex items-center justify-center ring-2 ring-background`}>
                <Star className="w-3 h-3 text-white fill-white" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold">{user?.name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="flex items-center gap-2 mt-1">
              <button
                onClick={(e) => { e.stopPropagation(); navigate('/dashboard/subscription'); }}
                className="inline-block px-2 py-0.5 bg-green-500/10 text-green-500 rounded-full text-xs font-medium capitalize hover:bg-green-500/20 transition-colors"
              >
                {user?.plan} Plan{user?.plan === 'free' ? ' — Upgrade' : ''}
              </button>
              {levelInfo && stats && (
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-gradient-to-r ${levelInfo.gradient} text-white`}>
                  <Star className="w-3 h-3 fill-white" />
                  {t(`gamification.levelNames.${stats.level}`, { defaultValue: levelInfo.name })}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/settings/profile')}
            className="p-2 hover:bg-muted rounded-lg text-muted-foreground"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </motion.div>

        {/* Settings Sections */}
        <div className="space-y-2">
          {settingsSections.map((section, idx) => (
            <motion.button
              key={section.href}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.04 }}
              onClick={() => navigate(section.href)}
              className="w-full bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:border-muted-foreground/30 transition-colors text-left"
            >
              <div className={`w-10 h-10 rounded-xl bg-${section.color}-500/10 flex items-center justify-center shrink-0`}>
                <section.icon className={`w-5 h-5 text-${section.color}-500`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{t(section.labelKey)}</p>
                <p className="text-xs text-muted-foreground">{t(section.descKey)}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        {/* Logout */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-8"
        >
          <button
            onClick={handleLogout}
            className="w-full bg-card rounded-xl border border-red-500/20 p-4 flex items-center gap-4 hover:bg-red-500/5 transition-colors text-left"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-500" />
            </div>
            <p className="text-sm font-medium text-red-500">{t('common.logout')}</p>
          </button>
        </motion.div>

        {/* App Info */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center text-xs text-muted-foreground mt-6"
        >
          Studyield v1.0.0
        </motion.p>
      </div>
    </DashboardLayout>
  );
}

export default SettingsPage;
