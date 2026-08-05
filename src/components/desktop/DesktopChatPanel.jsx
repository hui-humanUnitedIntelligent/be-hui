// ══════════════════════════════════════════════════════════════════════════════
// DesktopChatPanel.jsx — HUI Desktop Chat (Phase 3 — Verbessert)
// ══════════════════════════════════════════════════════════════════════════════
//
// PHASE 3:
//   ✓ Nutzt other_profile für Avatar, Name
//   ✓ Booking-Kontext (booking_title)
//   ✓ Online-Status (wenn verfügbar)
//   ✓ Letzter Kontakt (last_message_at)
//   ✓ feels like Messenger
//
// Business-Logik: useChatList + useChatThread (unverändert)
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useChatList, useChatThread, formatChatTime } from '../../lib/chatContext.js';
import { useEscapeKey } from './hooks/useEscapeKey.js';

// ── Chat-Liste (Master) ──────────────────────────────────────────────────────
function ChatList({ chats, activeChatId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="dcp-list-loading">
        <div className="dcp-shimmer" style={{ width: '80%' }} />
        <div className="dcp-shimmer" style={{ width: '60%' }} />
        <div className="dcp-shimmer" style={{ width: '70%' }} />
      </div>
    );
  }
  if (!chats || chats.length === 0) {
    return <div className="dcp-list-empty"><p>Keine Konversationen.</p></div>;
  }

  return (
    <div className="dcp-list">
      {chats.map(chat => {
        const other = chat.other_profile;
        const displayName = other?.display_name || chat.booking_title || 'Konversation';
        return (
          <button
            key={chat.id}
            className={`dcp-list-item ${activeChatId === chat.id ? 'active' : ''}`}
            onClick={() => onSelect(chat)}
          >
            <div className="dcp-list-avatar">
              {other?.avatar_url ? (
                <img src={other.avatar_url} alt="" className="dcp-list-avatar-img" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="dcp-list-content">
              <div className="dcp-list-header">
                <span className="dcp-list-title">{displayName}</span>
                {chat.last_message_at && (
                  <span className="dcp-list-time">{formatChatTime(chat.last_message_at)}</span>
                )}
              </div>
              {chat.last_message && (
                <span className="dcp-list-preview">{chat.last_message}</span>
              )}
              {chat.booking_title && other?.display_name && (
                <span className="dcp-list-context">{chat.booking_title}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Chat-Thread (Detail) ─────────────────────────────────────────────────────
function ChatThread({ chatId, chat }) {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useChatThread(chatId);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || sending) return;
    const text = input;
    setInput('');
    await sendMessage({ text, msgType: 'text' });
  }, [input, sending, sendMessage]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const other = chat?.other_profile;
  const displayName = other?.display_name || chat?.booking_title || 'Unterhaltung';

  if (!chatId) {
    return (
      <div className="dcp-thread-empty">
        <div className="dcp-thread-empty-icon">
          <svg width="32" height="32" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M3 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8l-3 3v-3H5a2 2 0 0 1-2-2V5z" />
          </svg>
        </div>
        <p>Wähle eine Konversation</p>
      </div>
    );
  }

  return (
    <div className="dcp-thread">
      {/* Header with other_profile */}
      <div className="dcp-thread-header">
        <div className="dcp-thread-header-info">
          {other?.avatar_url ? (
            <img src={other.avatar_url} alt="" className="dcp-thread-avatar" />
          ) : (
            <div className="dcp-thread-avatar dcp-thread-avatar-fallback">
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <span className="dcp-thread-title">{displayName}</span>
            {chat?.booking_title && other?.display_name && (
              <span className="dcp-thread-context">{chat.booking_title}</span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="dcp-thread-messages" ref={scrollRef}>
        {loading ? (
          <div className="dcp-thread-loading"><div className="dcp-shimmer" style={{ width: '60%' }} /></div>
        ) : messages.length === 0 ? (
          <div className="dcp-thread-nomessages"><p>Noch keine Nachrichten. Starte das Gespräch.</p></div>
        ) : (
          messages.filter(m => !m.is_deleted).map(msg => {
            const isMine = msg.sender_id === user?.id;
            return (
              <div key={msg.id} className={`dcp-msg ${isMine ? 'mine' : 'theirs'}`}>
                {!isMine && other?.avatar_url && (
                  <img src={other.avatar_url} alt="" className="dcp-msg-avatar" />
                )}
                <div className="dcp-msg-bubble">
                  {msg.text && <span className="dcp-msg-text">{msg.text}</span>}
                  {msg.media_url && msg.message_type !== 'text' && (
                    <img src={msg.media_url} alt="" className="dcp-msg-media" />
                  )}
                  <span className="dcp-msg-time">
                    {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="dcp-thread-input">
        <input
          type="text"
          placeholder="Nachricht schreiben…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Nachricht"
        />
        <button
          className="dcp-send-btn"
          onClick={handleSend}
          disabled={!input.trim() || sending}
          aria-label="Senden"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 10l14-7-5 14-2-6-7-1z" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// ── Hauptkomponente ─═══════════════════════════════════════════════════════════
export default function DesktopChatPanel({ onClose }) {
  const { chats, loading, unreadTotal } = useChatList('desktop');
  const [activeChat, setActiveChat] = useState(null);

  useEscapeKey(onClose);

  return (
    <>
      <div className="dcp-backdrop" onClick={onClose} />
      <div className="dcp-panel">
        <div className="dcp-master">
          <div className="dcp-master-header">
            <h3>Nachrichten</h3>
            {unreadTotal > 0 && <span className="dcp-unread-badge">{unreadTotal}</span>}
            <button className="dcp-close-btn" onClick={onClose} aria-label="Schließen">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M5 5l10 10M15 5L5 15" />
              </svg>
            </button>
          </div>
          <ChatList
            chats={chats}
            activeChatId={activeChat?.id}
            onSelect={(chat) => setActiveChat(chat)}
            loading={loading}
          />
        </div>
        <div className="dcp-detail">
          <ChatThread chatId={activeChat?.id} chat={activeChat} />
        </div>
      </div>
    </>
  );
}
