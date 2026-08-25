/**
 * SoundMint — Notification Context
 *
 * Provides a global notification store with localStorage persistence.
 * Wrap the app with <NotificationProvider> and consume via useNotifications().
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────
// notification.type: 'success' | 'error' | 'info' | 'marketplace' | 'pipeline'

const STORAGE_KEY = 'soundmint_notifications';
const MAX_NOTIFICATIONS = 50; // cap to avoid unbounded localStorage growth

// ── Context ──────────────────────────────────────────────────────────────────
const NotificationContext = createContext(null);

// ── Helpers ──────────────────────────────────────────────────────────────────
function loadFromStorage() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

function saveToStorage(notifications) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
    } catch {
        // localStorage might be full or unavailable — fail silently
    }
}

function generateId() {
    return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ── Provider ─────────────────────────────────────────────────────────────────
export function NotificationProvider({ children }) {
    const [notifications, setNotifications] = useState(() => loadFromStorage());

    // Persist every time notifications change
    useEffect(() => {
        saveToStorage(notifications);
    }, [notifications]);

    // Add a new notification (newest first, max 50 total)
    const addNotification = useCallback((type, title, message, options = {}) => {
        const notification = {
            id: generateId(),
            type,           // 'success' | 'error' | 'info' | 'marketplace' | 'pipeline'
            title,
            message,
            link: options.link || null,           // internal React Router path
            externalLink: options.externalLink || null,  // external URL (Etherscan, etc.)
            timestamp: Date.now(),
            read: false,
        };

        setNotifications((prev) => {
            const updated = [notification, ...prev];
            return updated.slice(0, MAX_NOTIFICATIONS);
        });

        return notification.id;
    }, []);

    const markRead = useCallback((id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
    }, []);

    const markAllRead = useCallback(() => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    }, []);

    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const unreadCount = notifications.filter((n) => !n.read).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markRead,
                markAllRead,
                clearAll,
                removeNotification,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

// ── Hook ─────────────────────────────────────────────────────────────────────
export function useNotifications() {
    const ctx = useContext(NotificationContext);
    if (!ctx) {
        throw new Error('useNotifications must be used inside <NotificationProvider>');
    }
    return ctx;
}
