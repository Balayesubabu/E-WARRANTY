import { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchNotifications } from '../services/notificationService';
import { getReadNotificationIds, getDismissedNotificationIds } from '../utils/notificationStorage';

/**
 * Returns the unread notification count for the current user.
 * Excludes notifications marked as read in NotificationCenter (stored in localStorage).
 * Read state persists across login sessions. Refreshes on navigation and tab visibility.
 */
export function useNotificationCount() {
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();

  const load = useCallback(async () => {
    try {
      const notifications = await fetchNotifications();
      const list = Array.isArray(notifications) ? notifications : [];
      const readIds = new Set(getReadNotificationIds());
      const dismissedIds = new Set(getDismissedNotificationIds());
      const count = list.filter(
        (n) => !dismissedIds.has(n.id) && !n.read && !readIds.has(n.id)
      ).length;
      return count;
    } catch {
      return 0;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    load().then((count) => {
      if (!cancelled) setUnreadCount(count);
    });
    return () => { cancelled = true; };
  }, [location.pathname, load]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        load().then(setUnreadCount);
      }
    };
    const handleUpdated = () => load().then(setUnreadCount);
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('ewarrantify-notifications-read-updated', handleUpdated);
    window.addEventListener('ewarrantify-notifications-dismissed-updated', handleUpdated);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('ewarrantify-notifications-read-updated', handleUpdated);
      window.removeEventListener('ewarrantify-notifications-dismissed-updated', handleUpdated);
    };
  }, [load]);

  return unreadCount;
}
