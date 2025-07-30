import { create } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number; // in milliseconds, 0 means persistent
  action?: {
    label: string;
    onClick: () => void;
  };
  createdAt: number;
}

export interface NotificationState {
  notifications: Notification[];

  // Actions
  addNotification: (
    notification: Omit<Notification, 'id' | 'createdAt'>
  ) => string;
  removeNotification: (id: string) => void;
  clearAllNotifications: () => void;

  // Convenience methods
  success: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  error: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  warning: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
  info: (
    title: string,
    message?: string,
    options?: Partial<Notification>
  ) => string;
}

const generateId = () =>
  `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const DEFAULT_DURATION = 5000; // 5 seconds

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],

  addNotification: notification => {
    const id = generateId();
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: Date.now(),
      duration: notification.duration ?? DEFAULT_DURATION,
    };

    set(state => ({
      notifications: [...state.notifications, newNotification],
    }));

    // Auto-remove notification after duration (if not persistent)
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  },

  removeNotification: id => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id),
    }));
  },

  clearAllNotifications: () => {
    set({ notifications: [] });
  },

  // Convenience methods
  success: (title, message, options = {}) => {
    return get().addNotification({
      type: 'success',
      title,
      message,
      ...options,
    });
  },

  error: (title, message, options = {}) => {
    return get().addNotification({
      type: 'error',
      title,
      message,
      duration: 0, // Errors are persistent by default
      ...options,
    });
  },

  warning: (title, message, options = {}) => {
    return get().addNotification({
      type: 'warning',
      title,
      message,
      duration: 8000, // Warnings last longer
      ...options,
    });
  },

  info: (title, message, options = {}) => {
    return get().addNotification({
      type: 'info',
      title,
      message,
      ...options,
    });
  },
}));
