/**
 * SoundMint — Notification Bell
 *
 * A bell icon for nav bars that opens a slide-down notification panel.
 * Shows an animated badge with the unread count.
 */
import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '../context/NotificationContext';

// ── Icon config per notification type ────────────────────────────────────────
const TYPE_CONFIG = {
    success:     { icon: '✅', color: 'text-success',    bg: 'bg-success/10',     border: 'border-success/20' },
    error:       { icon: '❌', color: 'text-error',      bg: 'bg-error/10',       border: 'border-error/20' },
    info:        { icon: 'ℹ️',  color: 'text-primary',   bg: 'bg-primary/10',     border: 'border-primary/20' },
    marketplace: { icon: '🏷️', color: 'text-secondary', bg: 'bg-secondary/10',   border: 'border-secondary/20' },
    pipeline:    { icon: '⚙️', color: 'text-[#F7971E]', bg: 'bg-[#F7971E]/10',  border: 'border-[#F7971E]/20' },
};

function formatRelativeTime(timestamp) {
    const diff = Date.now() - timestamp;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (diff < 60000) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// ── Single notification row ───────────────────────────────────────────────────
function NotificationRow({ notification, onMarkRead, onRemove }) {
    const cfg = TYPE_CONFIG[notification.type] || TYPE_CONFIG.info;
    const isUnread = !notification.read;

    const handleClick = () => {
        if (isUnread) onMarkRead(notification.id);
    };

    const content = (
        <div
            className={`
                relative flex gap-3 p-3 rounded-xl border transition-all duration-200 cursor-pointer
                hover:bg-white/5 group
                ${cfg.bg} ${cfg.border}
                ${isUnread ? 'border-opacity-60' : 'border-opacity-20 opacity-70'}
            `}
            onClick={handleClick}
        >
            {/* Unread dot */}
            {isUnread && (
                <span className="absolute top-3 right-3 w-1.5 h-1.5 rounded-full bg-primary" />
            )}

            {/* Icon */}
            <span className="text-lg flex-shrink-0 mt-0.5">{cfg.icon}</span>

            {/* Body */}
            <div className="flex-1 min-w-0 pr-4">
                <p className={`text-sm font-semibold truncate ${isUnread ? 'text-white' : 'text-muted'}`}>
                    {notification.title}
                </p>
                <p className="text-xs text-muted mt-0.5 leading-relaxed line-clamp-2">
                    {notification.message}
                </p>
                <div className="flex items-center gap-3 mt-1.5">
                    <span className="text-[10px] text-muted/60 font-mono">
                        {formatRelativeTime(notification.timestamp)}
                    </span>
                    {notification.externalLink && (
                        <a
                            href={notification.externalLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className={`text-[10px] font-semibold hover:underline ${cfg.color}`}
                        >
                            View ↗
                        </a>
                    )}
                </div>
            </div>

            {/* Remove button */}
            <button
                onClick={(e) => { e.stopPropagation(); onRemove(notification.id); }}
                className="absolute top-2 right-2 w-5 h-5 rounded-full text-muted/40 hover:text-muted hover:bg-white/10 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-all"
                aria-label="Dismiss"
            >
                ×
            </button>
        </div>
    );

    // Wrap with internal Link if applicable
    if (notification.link && !notification.externalLink) {
        return (
            <Link to={notification.link} onClick={handleClick}>
                {content}
            </Link>
        );
    }

    return content;
}

// ── Main bell component ───────────────────────────────────────────────────────
export default function NotificationBell() {
    const { notifications, unreadCount, markRead, markAllRead, clearAll, removeNotification } =
        useNotifications();

    const [open, setOpen] = useState(false);
    const panelRef = useRef(null);

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(e) {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleOpen = () => {
        setOpen((o) => !o);
    };

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                id="notification-bell-btn"
                onClick={handleOpen}
                aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
                className="relative flex items-center justify-center w-9 h-9 rounded-full border border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all duration-200"
            >
                {/* Bell icon */}
                <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={unreadCount > 0 ? 'text-primary' : 'text-muted'}
                >
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    {unreadCount > 0 && (
                        <circle cx="18" cy="5" r="3" fill="#A044FF" stroke="none" className="animate-pulse" />
                    )}
                </svg>

                {/* Unread badge */}
                <AnimatePresence>
                    {unreadCount > 0 && (
                        <motion.span
                            key="badge"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-white text-[10px] font-bold flex items-center justify-center leading-none shadow-glow-primary"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>

            {/* Notification panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        key="panel"
                        initial={{ opacity: 0, y: -8, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.97 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-80 z-50 rounded-2xl border border-white/10 overflow-hidden"
                        style={{
                            background: 'rgba(18, 18, 36, 0.95)',
                            backdropFilter: 'blur(24px)',
                            boxShadow: '0 8px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(160,68,255,0.1)',
                        }}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-bold text-white">Notifications</span>
                                {unreadCount > 0 && (
                                    <span className="text-[10px] font-bold bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                                        {unreadCount} new
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="text-[11px] text-muted hover:text-white transition-colors"
                                    >
                                        Mark all read
                                    </button>
                                )}
                                {notifications.length > 0 && (
                                    <button
                                        onClick={clearAll}
                                        className="text-[11px] text-muted hover:text-error transition-colors"
                                    >
                                        Clear all
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Notification list */}
                        <div className="max-h-[420px] overflow-y-auto overflow-x-hidden">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                                    <span className="text-3xl mb-3">🔔</span>
                                    <p className="text-sm font-medium text-white">No notifications yet</p>
                                    <p className="text-xs text-muted mt-1">
                                        Events like mints, listings, and offers will appear here.
                                    </p>
                                </div>
                            ) : (
                                <div className="p-2 space-y-1.5">
                                    {notifications.map((n) => (
                                        <NotificationRow
                                            key={n.id}
                                            notification={n}
                                            onMarkRead={markRead}
                                            onRemove={removeNotification}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="border-t border-white/8 px-4 py-2 text-center">
                                <p className="text-[11px] text-muted">
                                    {notifications.length} notification{notifications.length !== 1 ? 's' : ''} · Persisted locally
                                </p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
