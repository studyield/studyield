import { useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
} from 'lucide-react';
import type { NotificationType } from '@/types';

const typeConfig: Record<NotificationType, { icon: typeof Info; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10' },
  success: { icon: Trophy, color: 'text-green-500', bg: 'bg-green-500/10' },
  warning: { icon: AlertTriangle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
  reminder: { icon: Clock, color: 'text-purple-500', bg: 'bg-purple-500/10' },
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

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const formatTimeAgo = useFormatTimeAgo();
  const panelRef = useRef<HTMLDivElement>(null);
  const {
    notifications,
    unreadCount,
    isLoading,
    isOpen,
    setOpen,
    toggle,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotificationsStore();

  // Fetch unread count on mount
  useEffect(() => {
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch full list when panel opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  // Close panel when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setOpen]);

  const handleNotificationClick = (notification: typeof notifications[0]) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    if (notification.link) {
      navigate(notification.link);
      setOpen(false);
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={toggle}
        className={cn(
          'relative p-2 rounded-lg transition-colors',
          isOpen ? 'bg-muted' : 'hover:bg-muted'
        )}
        aria-label="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Dropdown panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <h3 className="font-semibold">{t('notifications.title')}</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    title={t('notifications.markAllAsRead')}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground hover:text-foreground sm:hidden"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Notifications list */}
            <div className="max-h-[400px] overflow-y-auto">
              {isLoading && notifications.length === 0 ? (
                <div className="flex items-center justify-center py-8">
                  <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                    <Bell className="w-6 h-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">{t('notifications.noNotifications')}</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    {t('notifications.wellNotify')}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {notifications.map((notification) => {
                    const config = typeConfig[notification.type] || typeConfig.info;
                    const Icon = config.icon;

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={cn(
                          'relative group',
                          !notification.isRead && 'bg-green-500/5'
                        )}
                      >
                        <button
                          onClick={() => handleNotificationClick(notification)}
                          className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex gap-3">
                            {/* Icon */}
                            <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', config.bg)}>
                              <Icon className={cn('w-4 h-4', config.color)} />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2">
                                <p className={cn(
                                  'text-sm leading-tight',
                                  !notification.isRead ? 'font-semibold' : 'font-medium'
                                )}>
                                  {notification.title}
                                </p>
                                {!notification.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-green-500 shrink-0 mt-1.5" />
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-[10px] text-muted-foreground/70 mt-1">
                                {formatTimeAgo(notification.createdAt)}
                              </p>
                            </div>
                          </div>
                        </button>

                        {/* Action buttons (visible on hover) */}
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-card/90 backdrop-blur-sm px-1 py-0.5 rounded-lg border border-border shadow-sm">
                          {!notification.isRead && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                              className="p-1 rounded hover:bg-muted transition-colors"
                              title={t('notifications.markAllAsRead')}
                            >
                              <Check className="w-3.5 h-3.5 text-green-500" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteNotification(notification.id);
                            }}
                            className="p-1 rounded hover:bg-muted transition-colors"
                            title={t('common.delete')}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="px-4 py-2.5 border-t border-border bg-muted/30">
                <Link
                  to="/dashboard/notifications"
                  onClick={() => setOpen(false)}
                  className="text-xs font-medium text-green-600 hover:text-green-500 transition-colors"
                >
                  {t('notifications.viewAll')}
                </Link>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
