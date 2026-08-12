// ══════════════════════════════════════════════════════════════════════════════
// DesktopNotificationFlyout.jsx — HUI Desktop V3 — Benachrichtigungen
// ══════════════════════════════════════════════════════════════════════════════
//
// Flyout, 420px, von der Glocke. Typ-basierte Icons + Farben. action_url
// navigiert direkt. Kein Fullscreen, keine neue Seite.
//
// DATEN: useNotifications() (unverändert)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../lib/useNotifications.jsx';
import { useEscapeKey } from './hooks/useEscapeKey.js';

const NOTIF_STYLE = {
  like:     { color: '#F47355', icon: <path d="M10 17l-5.2-5.2a3.4 3.4 0 0 1 4.8-4.8l.4.4.4-.4a3.4 3.4 0 0 1 4.8 4.8L10 17z" /> },
  comment:  { color: '#0DC4B5', icon: <path d="M3 5.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3 3v-3H5a2 2 0 0 1-2-2v-7z" /> },
  follow:   { color: '#5CA87A', icon: <><circle cx="10" cy="7" r="3" /><path d="M4 17c0-3 3-5 6-5s6 2 6 5" /></> },
  booking:  { color: '#0DC4B5', icon: <><rect x="3" y="5" width="14" height="12" rx="2" /><path d="M3 9h14M7 5v3" /></> },
  message:  { color: '#0DC4B5', icon: <path d="M3 5.5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H8l-3 3v-3H5a2 2 0 0 1-2-2v-7z" /> },
  reaction: { color: '#F4A635', icon: <path d="M10 3l2.5 5.5L18 9l-4 4 1 5.5L10 15l-5 3.5 1-5.5-4-4 5.5-.5z" /> },
  system:   { color: '#8A8A9E', icon: <><circle cx="10" cy="10" r="7" /><path d="M10 7v4M10 13h.01" /></> },
};

function NotifIcon({ type }) {
  const cfg = NOTIF_STYLE[type] || NOTIF_STYLE.system;
  return (
    <span className="notif-icon" style={{ color: cfg.color }}>
      <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">{cfg.icon}</svg>
    </span>
  );
}

export default function DesktopNotificationFlyout({ onClose }) {
  const navigate = useNavigate();
  const { items, unread, loading, markRead, markAllRead, deleteNotif } = useNotifications();

  useEscapeKey(onClose);

  const handleClick = useCallback((item) => {
    markRead(item.id);
    if (item.action_url) { onClose(); navigate(item.action_url); }
  }, [markRead, navigate, onClose]);

  return (
    <>
      <div className="fly-backdrop" onClick={onClose} />
      <div className="notif-panel">
        <div className="fly-header">
          <h3>Benachrichtigungen</h3>
          {unread > 0 && <button className="notif-mark-all" onClick={markAllRead}>Alle als gelesen</button>}
          <button className="fly-close" onClick={onClose} aria-label="Schließen">
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 5l10 10M15 5L5 15" /></svg>
          </button>
        </div>
        <div className="fly-list">
          {loading ? (
            <div className="notif-loading"><div className="v3-shimmer" style={{ width: '70%' }} /><div className="v3-shimmer" style={{ width: '50%' }} /></div>
          ) : items.length === 0 ? (
            <div className="v3-empty"><p>Alles gelesen — keine offenen Benachrichtigungen.</p></div>
          ) : (
            items.slice(0, 30).map(item => (
              <div key={item.id} className={`notif-item ${!item.is_read ? 'unread' : ''}`} onClick={() => handleClick(item)} role="button" tabIndex={0}>
                <NotifIcon type={item.type} />
                <div className="notif-body">
                  <span className="notif-title">{item.title || 'Benachrichtigung'}</span>
                  {item.body && <span className="notif-text">{item.body}</span>}
                  <span className="notif-time">{item.time_ago || ''}</span>
                </div>
                <button className="notif-delete" onClick={(e) => { e.stopPropagation(); deleteNotif(item.id); }} aria-label="Löschen">
                  <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 5l10 10M15 5L5 15" /></svg>
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
