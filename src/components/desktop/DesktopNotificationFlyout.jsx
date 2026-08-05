// ══════════════════════════════════════════════════════════════════════════════
// DesktopNotificationFlyout.jsx — HUI Desktop Notifications (Phase 3)
// ══════════════════════════════════════════════════════════════════════════════
//
// PHASE 3:
//   ✓ Jeder Notification-Typ erhält eigenes Icon + Farbe
//   ✓ action_url → direkte Navigation bei Klick
//   ✓ Keine generischen Listen mehr
//
// Business-Logik: useNotifications() (unverändert)
// ══════════════════════════════════════════════════════════════════════════════

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../lib/useNotifications.jsx';
import { useEscapeKey } from './hooks/useEscapeKey.js';

// ── Type-based icons ─────────────────────────────────────────────────────────
const NOTIF_ICONS = {
  like:         { icon: <path d="M10 17l-5.5-5.5a3.5 3.5 0 0 1 5-5l.5.5.5-.5a3.5 3.5 0 0 1 5 5L10 17z" />, color: '#F47355' },
  comment:      { icon: <path d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-3 3v-3H5a2 2 0 0 1-2-2V5z" />, color: '#0EC4B8' },
  follow:       { icon: <><circle cx="10" cy="7" r="3" /><path d="M4 17c0-3 3-5 6-5s6 2 6 5" /></>, color: '#5CA87A' },
  booking:      { icon: <><rect x="3" y="5" width="14" height="12" rx="2" /><path d="M3 9h14M7 5v3" /></>, color: '#0EC4B8' },
  message:      { icon: <path d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-3 3v-3H5a2 2 0 0 1-2-2V5z" />, color: '#0EC4B8' },
  reaction:     { icon: <path d="M10 3l2.5 5.5L18 9l-4 4 1 5.5L10 15l-5 3.5 1-5.5-4-4 5.5-.5z" />, color: '#F4A635' },
  system:       { icon: <><circle cx="10" cy="10" r="7" /><path d="M10 7v4M10 13h.01" /></>, color: '#8A8A9E' },
  mention:      { icon: <><circle cx="10" cy="10" r="3" /><path d="M13 7v3a4 4 0 0 1-8 0V6M16 10v1a6 6 0 0 1-12 0" /></>, color: '#0EC4B8' },
  default:      { icon: <><circle cx="10" cy="10" r="7" /><path d="M10 7v4M10 13h.01" /></>, color: '#8A8A9E' },
};

function NotifIcon({ type }) {
  const config = NOTIF_ICONS[type] || NOTIF_ICONS.default;
  return (
    <span className="dnf-item-icon" style={{ color: config.color }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        {config.icon}
      </svg>
    </span>
  );
}

// ── Notification Item ──────────────────────────────────────────────────────────
function NotificationItem({ item, onRead, onDelete, onNavigate }) {
  const isUnread = !item.is_read;

  const handleClick = () => {
    onRead(item.id);
    if (item.action_url) onNavigate(item.action_url);
  };

  return (
    <div
      className={`dnf-item ${isUnread ? 'unread' : ''}`}
      onClick={handleClick}
      style={{ cursor: item.action_url ? 'pointer' : 'default' }}
    >
      <NotifIcon type={item.type} />
      <div className="dnf-item-body">
        <span className="dnf-item-title">{item.title || 'Benachrichtigung'}</span>
        {item.body && <span className="dnf-item-text">{item.body}</span>}
        <span className="dnf-item-time">{item.time_ago || item.created_at_relative || ''}</span>
      </div>
      {onDelete && (
        <button
          className="dnf-item-delete"
          onClick={(e) => { e.stopPropagation(); onDelete(item.id); }}
          aria-label="Löschen"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M5 5l10 10M15 5L5 15" />
          </svg>
        </button>
      )}
    </div>
  );
}

// ── Hauptkomponente ─═══════════════════════════════════════════════════════════
export default function DesktopNotificationFlyout({ onClose }) {
  const navigate = useNavigate();
  const { items, unread, loading, markRead, markAllRead, deleteNotif } = useNotifications();

  useEscapeKey(onClose);

  const handleNavigate = useCallback((url) => {
    onClose();
    navigate(url);
  }, [navigate, onClose]);

  return (
    <>
      <div className="dnf-backdrop" onClick={onClose} />
      <div className="dnf-panel">
        <div className="dnf-header">
          <h3>Benachrichtigungen</h3>
          {unread > 0 && (
            <button className="dnf-mark-all" onClick={markAllRead}>
              Alle als gelesen
            </button>
          )}
          <button className="dnf-close-btn" onClick={onClose} aria-label="Schließen">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M5 5l10 10M15 5L5 15" />
            </svg>
          </button>
        </div>
        <div className="dnf-list">
          {loading ? (
            <div className="dnf-loading">
              <div className="dnf-shimmer" style={{ width: '70%' }} />
              <div className="dnf-shimmer" style={{ width: '50%' }} />
              <div className="dnf-shimmer" style={{ width: '60%' }} />
            </div>
          ) : items.length === 0 ? (
            <div className="dnf-empty">
              <div className="dnf-empty-icon">
                <svg width="28" height="28" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
                  <path d="M6 8a4 4 0 0 1 8 0v3l1.5 2H4.5L6 11V8z" /><path d="M8 15a2 2 0 0 0 4 0" />
                </svg>
              </div>
              <p>Alles gelesen — keine offenen Benachrichtigungen.</p>
            </div>
          ) : (
            items.slice(0, 30).map(item => (
              <NotificationItem
                key={item.id}
                item={item}
                onRead={markRead}
                onDelete={deleteNotif}
                onNavigate={handleNavigate}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}

// ── useCallback import ─────────────────────────────────────────────────────────
import { useCallback } from 'react';
