const STORAGE_KEY_PREFIX = 'ewarrantify_read_notifications_';
const DISMISSED_KEY_PREFIX = 'ewarrantify_dismissed_notifications_';
const MAX_DISMISSED_IDS = 500;

function getStorageSuffix() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    return user?.id || user?.email || user?.phone_number || 'default';
  } catch {
    return 'default';
  }
}

function getStorageKey() {
  return `${STORAGE_KEY_PREFIX}${getStorageSuffix()}`;
}

function getDismissedStorageKey() {
  return `${DISMISSED_KEY_PREFIX}${getStorageSuffix()}`;
}

export function getReadNotificationIds() {
  try {
    const key = getStorageKey();
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const NOTIFICATIONS_READ_UPDATED = 'ewarrantify-notifications-read-updated';

export function addReadNotificationIds(ids) {
  if (!ids || ids.length === 0) return;
  try {
    const key = getStorageKey();
    const existing = getReadNotificationIds();
    const merged = [...new Set([...existing, ...ids])];
    localStorage.setItem(key, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_READ_UPDATED));
  } catch {
    // ignore
  }
}

// Dismissed IDs: "Clear all" / single dismiss — these notifications are hidden until new data creates new IDs
export function getDismissedNotificationIds() {
  try {
    const key = getDismissedStorageKey();
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

const NOTIFICATIONS_DISMISSED_UPDATED = 'ewarrantify-notifications-dismissed-updated';

export function addDismissedNotificationIds(ids) {
  if (!ids || ids.length === 0) return;
  try {
    const key = getDismissedStorageKey();
    const existing = getDismissedNotificationIds();
    const merged = [...new Set([...existing, ...ids])];
    const capped = merged.length > MAX_DISMISSED_IDS ? merged.slice(-MAX_DISMISSED_IDS) : merged;
    localStorage.setItem(key, JSON.stringify(capped));
    window.dispatchEvent(new CustomEvent(NOTIFICATIONS_DISMISSED_UPDATED));
  } catch {
    // ignore
  }
}
