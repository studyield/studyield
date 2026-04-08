import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '@/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';
import { useNotificationsStore } from '@/stores/useNotificationsStore';
import { cn } from '@/lib/utils';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Info,
  Trophy,
  AlertTriangle,
  Clock,
  Settings,
  ArrowLeft,
  Mail,
  Smartphone,
  Monitor,
  CalendarClock,
  Newspaper,
  Award,
} from 'lucide-react';
import type { NotificationType, NotificationPreferences } from '@/types';

const typeConfig: Record<NotificationType, { icon: typeof Info; color: string; bg: string; labelKey: string }> = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', labelKey: 'notifications.types.info' },
  success: { icon: Trophy, color: 'text-green-500', bg: 'bg-green-500/10', labelKey: 'notifications.types.success' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10', labelKey: 'notifications.types.warning' },
  reminder: { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10', labelKey: 'notifications.types.reminder' },
};

function useFormatTimeAgo() {
  const { t } = useTranslation();
  return (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return t('notifications.justNow');
    if (seconds < 3600) return t('notifications.minutesAgo', { count: Math.floor(seconds / 60) });
    if (seconds < 86400) return t('notifications.hoursAgo', { count: Math.floor(seconds / 3600) });
    if (seconds < 604800) return t('notifications.daysAgo', { count: Math.floor(seconds / 86400) });
    return date.toLocaleDateString();
  };
}

interface PreferenceToggleProps {
  icon: typeof Mail;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

function PreferenceToggle({ icon: Icon, label, description, checked, onChange }: PreferenceToggleProps) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="w-full flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center', checked ? 'bg-green-500/10' : 'bg-muted')}>
          <Icon className={cn('w-5 h-5', checked ? 'text-green-500' : 'text-muted-foreground')} />
        </div>
        <div className="text-left">
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <div
        className={cn(
          'w-11 h-6 rounded-full transition-colors flex items-center px-0.5',
          checked ? 'bg-green-500 justify-end' : 'bg-muted justify-start'
        )}
      >
        <motion.div
          layout
          className="w-5 h-5 rounded-full bg-white shadow-sm"
        />
      </div>
    </button>
  );
}

export function NotificationsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formatTimeAgo = useFormatTimeAgo();
  const [tab, setTab] = useState<'all' | 'unread' | 'settings'>('all');
  const {
    notifications,
    unreadCount,
    total,
    preferences,
    isLoading,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    deleteAll,
    fetchPreferences,
    updatePreferences,
  } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
    fetchPreferences();
  }, [fetchNotifications, fetchPreferences]);

  const filteredNotifications = tab === 'unread'
    ? notifications.filter((n) => !n.isRead)
    : notifications;

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
    }
  };

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: boolean) => {
    updatePreferences({ [key]: value });
  };

  return (
    <DashboardLayout>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{t('notifications.title')}</h1>
            <p className="text-sm text-muted-foreground">
              {unreadCount > 0 ? t('notifications.unreadCount', { count: unreadCount }) : t('notifications.allCaughtUp')}
            </p>
          </div>
          {notifications.length > 0 && tab !== 'settings' && (
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" size="sm" onClick={markAllAsRead}>
                  <CheckCheck className="w-4 h-4 mr-2" />
                  {t('notifications.markAllAsRead')}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={deleteAll} className="text-red-500 hover:text-red-600">
                <Trash2 className="w-4 h-4 mr-2" />
                {t('notifications.clearAll')}
              </Button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6">
          <button
            onClick={() => setTab('all')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md transition-colors',
              tab === 'all' ? 'bg-card shadow-sm' : 'hover:bg-card/50'
            )}
          >
            {t('notifications.tabs.all')}
            {total > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                tab === 'all' ? 'bg-green-500/10 text-green-600' : 'bg-muted-foreground/10'
              )}>
                {total}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('unread')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md transition-colors',
              tab === 'unread' ? 'bg-card shadow-sm' : 'hover:bg-card/50'
            )}
          >
            {t('notifications.tabs.unread')}
            {unreadCount > 0 && (
              <span className={cn(
                'px-1.5 py-0.5 text-xs rounded-full',
                tab === 'unread' ? 'bg-green-500/10 text-green-600' : 'bg-muted-foreground/10'
              )}>
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setTab('settings')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md transition-colors',
              tab === 'settings' ? 'bg-card shadow-sm' : 'hover:bg-card/50'
            )}
          >
            <Settings className="w-4 h-4" />
            {t('notifications.tabs.settings')}
          </button>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          {tab === 'settings' ? (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Notification Channels */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-4">{t('notifications.channels.title')}</h3>
                <div className="space-y-3">
                  <PreferenceToggle
                    icon={Monitor}
                    label={t('notifications.channels.inApp')}
                    description={t('notifications.channels.inAppDesc')}
                    checked={preferences?.inApp ?? true}
                    onChange={(v) => handlePreferenceChange('inApp', v)}
                  />
                  <PreferenceToggle
                    icon={Mail}
                    label={t('notifications.channels.email')}
                    description={t('notifications.channels.emailDesc')}
                    checked={preferences?.email ?? true}
                    onChange={(v) => handlePreferenceChange('email', v)}
                  />
                  <PreferenceToggle
                    icon={Smartphone}
                    label={t('notifications.channels.push')}
                    description={t('notifications.channels.pushDesc')}
                    checked={preferences?.push ?? true}
                    onChange={(v) => handlePreferenceChange('push', v)}
                  />
                </div>
              </div>

              {/* Notification Types */}
              <div className="bg-card border border-border rounded-xl p-5">
                <h3 className="font-semibold mb-4">{t('notifications.notificationTypes.title')}</h3>
                <div className="space-y-3">
                  <PreferenceToggle
                    icon={CalendarClock}
                    label={t('notifications.notificationTypes.studyReminders')}
                    description={t('notifications.notificationTypes.studyRemindersDesc')}
                    checked={preferences?.studyReminders ?? true}
                    onChange={(v) => handlePreferenceChange('studyReminders', v)}
                  />
                  <PreferenceToggle
                    icon={Award}
                    label={t('notifications.notificationTypes.achievements')}
                    description={t('notifications.notificationTypes.achievementsDesc')}
                    checked={preferences?.achievementAlerts ?? true}
                    onChange={(v) => handlePreferenceChange('achievementAlerts', v)}
                  />
                  <PreferenceToggle
                    icon={Newspaper}
                    label={t('notifications.notificationTypes.weeklyDigest')}
                    description={t('notifications.notificationTypes.weeklyDigestDesc')}
                    checked={preferences?.weeklyDigest ?? true}
                    onChange={(v) => handlePreferenceChange('weeklyDigest', v)}
                  />
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {isLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <div className="w-8 h-8 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredNotifications.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border rounded-xl">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Bell className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {tab === 'unread' ? t('notifications.noUnread') : t('notifications.noNotifications')}
                  </h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    {t('notifications.wellNotify')}
                  </p>
                </div>
              ) : (
                <div className="bg-card border border-border rounded-xl overflow-hidden divide-y divide-border">
                  {filteredNotifications.map((notification, index) => {
                    const config = typeConfig[notification.type] || typeConfig.info;
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={cn(
                          'relative group',
                          !notification.isRead && 'bg-green-500/5'
                        )}
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left p-4 hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex gap-4">
                            {/* Icon */}
                            <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0', config.bg)}>
                              <Icon className={cn('w-5 h-5', config.color)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <p className={cn(
                                      'text-sm',
                                      !notification.isRead ? 'font-semibold' : 'font-medium'
                                    )}>
                                      {notification.title}
                                    </p>
                                    {!notification.isRead && (
                                      <span className="w-2 h-2 rounded-full bg-green-500" />
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground mt-0.5">
                                    {notification.message}
                                  </p>
                                </div>
                                <span className="text-xs text-muted-foreground/70 whitespace-nowrap">
                                  {formatTimeAgo(notification.createdAt)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <span className={cn('text-[10px] px-2 py-0.5 rounded-full', config.bg, config.color)}>
                                  {t(config.labelKey)}
                                </span>
                                {notification.link && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {t('notifications.clickToView')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </button>

                        {/* Action buttons */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-card px-2 py-1 rounded-lg border border-border shadow-sm">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                              title={t('notifications.markAllAsRead')}
                            >
                              <Check className="w-4 h-4 text-green-500" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1.5 rounded-lg hover:bg-muted transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
