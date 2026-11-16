import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '../utils/api';

const READ_KEY = 'kisaan_read_notifications';

const loadReadIds = () => {
  try {
    const raw = localStorage.getItem(READ_KEY);
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const saveReadIds = (ids) => {
  try {
    localStorage.setItem(READ_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
};

export const useFarmerNotifications = ({ enabled = true } = {}) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState(loadReadIds);

  const loadNotifications = useCallback(async () => {
    if (!enabled) {
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.get('/farmer/dashboard');
      setNotifications(data.notifications || []);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const enrichedNotifications = useMemo(
    () =>
      notifications.map((notification) => ({
        ...notification,
        read: notification.read || readIds.includes(notification.id),
      })),
    [notifications, readIds]
  );

  const unreadCount = useMemo(
    () => enrichedNotifications.filter((notification) => !notification.read).length,
    [enrichedNotifications]
  );

  const markAsRead = useCallback((notificationId) => {
    setReadIds((prev) => {
      if (prev.includes(notificationId)) {
        return prev;
      }
      const next = [...prev, notificationId];
      saveReadIds(next);
      return next;
    });
  }, []);

  const markAllAsRead = useCallback(() => {
    const allIds = notifications.map((notification) => notification.id);
    setReadIds((prev) => {
      const next = [...new Set([...prev, ...allIds])];
      saveReadIds(next);
      return next;
    });
  }, [notifications]);

  return {
    notifications: enrichedNotifications,
    unreadCount,
    loading,
    reload: loadNotifications,
    markAsRead,
    markAllAsRead,
  };
};
