import { create } from 'zustand';
import api from '@/services/api';
import { ENDPOINTS } from '@/config/api';
import type { Notification, NotificationPreferences, NotificationsResponse } from '@/types';

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  total: number;
  preferences: NotificationPreferences | null;
  isLoading: boolean;
  isOpen: boolean;

  // Actions
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  deleteAll: () => Promise<void>;
  fetchPreferences: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  addNotification: (notification: Notification) => void;
  setOpen: (open: boolean) => void;
  toggle: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  total: 0,
  preferences: null,
  isLoading: false,
  isOpen: false,

  fetchNotifications: async (page = 1, limit = 20) => {
    set({ isLoading: true });
    try {
      const response = await api.get<NotificationsResponse>(ENDPOINTS.notifications.list, {
        params: { page, limit },
      });
      set({
        notifications: response.data.data,
        total: response.data.total,
        unreadCount: response.data.unreadCount,
        isLoading: false,
      });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const response = await api.get<NotificationsResponse>(ENDPOINTS.notifications.list, {
        params: { page: 1, limit: 1 },
      });
      set({ unreadCount: response.data.unreadCount });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await api.post(ENDPOINTS.notifications.markAsRead(id));
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.post(ENDPOINTS.notifications.markAllAsRead);
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  },

  deleteNotification: async (id: string) => {
    try {
      await api.delete(ENDPOINTS.notifications.delete(id));
      const notification = get().notifications.find((n) => n.id === id);
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
        total: state.total - 1,
        unreadCount: notification && !notification.isRead ? state.unreadCount - 1 : state.unreadCount,
      }));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  },

  deleteAll: async () => {
    try {
      await api.delete(ENDPOINTS.notifications.deleteAll);
      set({ notifications: [], total: 0, unreadCount: 0 });
    } catch (error) {
      console.error('Failed to delete all notifications:', error);
    }
  },

  fetchPreferences: async () => {
    try {
      const response = await api.get<NotificationPreferences>(ENDPOINTS.notifications.preferences);
      set({ preferences: response.data });
    } catch (error) {
      console.error('Failed to fetch notification preferences:', error);
    }
  },

  updatePreferences: async (prefs: Partial<NotificationPreferences>) => {
    try {
      const response = await api.post<NotificationPreferences>(ENDPOINTS.notifications.preferences, prefs);
      set({ preferences: response.data });
    } catch (error) {
      console.error('Failed to update notification preferences:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      total: state.total + 1,
      unreadCount: notification.isRead ? state.unreadCount : state.unreadCount + 1,
    }));
  },

  setOpen: (open: boolean) => set({ isOpen: open }),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}));
