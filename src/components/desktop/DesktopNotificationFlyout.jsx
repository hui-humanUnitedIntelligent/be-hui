// ══════════════════════════════════════════════════════════════════════════════
// DesktopNotificationFlyout.jsx — HUI Desktop Notifications (Phase 2)
// ══════════════════════════════════════════════════════════════════════════════
//
// 420px Flyout von der Glocke. Nicht Fullscreen. Nicht neue Seite.
// ESC schließt. Outside Click schließt. Unread Counter bleibt erhalten.
//
// Business-Logik: useNotifications() (unverändert)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useEffect } from 'react';
import { useNotifications } from '../../lib/useNotifications.jsx';
import { useEscapeKey } from './hooks/useEscapeKey.js';

// ── Notification Item ────────────────────────────────────────────────────────
function NotificationItem({ item, onRead, onDelete }) {
  const isUnread = !item.is_read;

  return (
    <div
      className={`dnf-item ${isUnread ? 'unread' : ''}`}
      onClick={() => onRead(item.id)}
    >
      <div className="dnf-item-dot" />
      <div className="dnf-item-body">
        <span className="dnf-item-title">{item.title || item.label || 'Benachrichtigung'}</span>
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

// ── Hauptkomponente ──────────────────────────────────────────────────────────
export default function DesktopNotificationFlyout({ onClose }) {
  const { items, unread, loading, markRead, markAllRead, deleteNotif } = useNotifications();

  useEscapeKey(onClose);

  // Close on outside click is handled by parent backdrop

  return (
    <>
      <div className="dnf-backdrop" onClick={onClose} />
      <div className="dnf-panel">
        <div className="dnf-header">
          <h3>Benachrichtigungen</h3>
          {unread > 0 && (
            <button className="dnf-mark-all" onClick={markAllRead}>
              Alle als gelesen markieren
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
                  <path d="M6 8a4 4 0 0 1 8 0v3l1.5 2H4.5L6 11V8z" />
                  <path d="M8 15a2 2 0 0 0 4 0" />
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
              />
            ))
          )}
        </div>
      </div>
    </>
  );
}
