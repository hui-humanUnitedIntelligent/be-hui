// ══════════════════════════════════════════════════════════════════════════════
// DesktopChatPanel.jsx — HUI Desktop V3 — Nachrichten (Slide-In, Master-Detail)
// ══════════════════════════════════════════════════════════════════════════════
//
// Slide-In von rechts, über dem Wirkungsraum. Feed bleibt sichtbar.
// Konversationsliste links, Unterhaltung rechts. Nutzt other_profile.
//
// DATEN: useChatThread (unverändert). Chat-Liste kommt als Props von DesktopShell (P0: zentrale useChatList).
// ══════════════════════════════════════════════════════════════════════════════

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../lib/AuthContext.jsx';
import { useChatThread, formatChatTime } from '../../lib/chatContext.js';
import { useEscapeKey } from './hooks/useEscapeKey.js';

function ChatList({ chats, activeChatId, onSelect, loading }) {
  if (loading) {
    return (
      <div className="chat-list-loading">
        <div className="v3-shimmer" style={{ width: '80%' }} />
        <div className="v3-shimmer" style={{ width: '60%' }} />
      </div>
    );
  }
  if (!chats?.length) return <div className="v3-empty"><p>Keine Konversationen.</p></div>;

  return (
    <div className="chat-list">
      {chats.map(chat => {
        const other = chat.other_profile;
        const name = other?.display_name || chat.booking_title || 'Konversation';
        return (
          <button key={chat.id} className={`chat-list-item ${activeChatId === chat.id ? 'active' : ''}`} onClick={() => onSelect(chat)}>
            <div className="chat-avatar">
              {other?.avatar_url ? <img src={other.avatar_url} alt="" /> : name.charAt(0).toUpperCase()}
            </div>
            <div className="chat-list-content">
              <div className="chat-list-row">
                <span className="chat-list-name">{name}</span>
                {chat.last_message_at && <span className="chat-list-time">{formatChatTime(chat.last_message_at)}</span>}
              </div>
              {chat.last_message && <span className="chat-list-preview">{chat.last_message}</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function ChatThread({ chatId, chat }) {
  const { user } = useAuth();
  const { messages, loading, sending, sendMessage } = useChatThread(chatId);
  const [input, setInput] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, [messages]);

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
  const name = other?.display_name || chat?.booking_title || 'Unterhaltung';

  if (!chatId) {
    return <div className="v3-empty"><p>Wähle eine Konversation.</p></div>;
  }

  return (
    <div className="chat-thread">
      <div className="chat-thread-header">
        {other?.avatar_url ? <img src={other.avatar_url} alt="" className="chat-thread-avatar" /> : (
          <div className="chat-thread-avatar chat-avatar-fallback">{name.charAt(0).toUpperCase()}</div>
        )}
        <div>
          <span className="chat-thread-name">{name}</span>
          {chat?.booking_title && other?.display_name && <span className="chat-thread-context">{chat.booking_title}</span>}
        </div>
      </div>
      <div className="chat-messages" ref={scrollRef}>
        {loading ? <div className="v3-shimmer" style={{ width: '50%', margin: '20px' }} /> : (
          messages.filter(m => !m.is_deleted).length === 0 ? (
            <p className="v3-empty">Noch keine Nachrichten. Starte das Gespräch.</p>
          ) : (
            messages.filter(m => !m.is_deleted).map(msg => {
              const isMine = msg.sender_id === user?.id;
              return (
                <div key={msg.id} className={`chat-msg ${isMine ? 'mine' : ''}`}>
                  <div className="chat-bubble">
                    {msg.text && <span>{msg.text}</span>}
                    <span className="chat-msg-time">{new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              );
            })
          )
        )}
      </div>
      <div className="chat-input-row">
        <input
          type="text"
          placeholder="Nachricht schreiben…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <button className="chat-send" onClick={handleSend} disabled={!input.trim() || sending} aria-label="Senden">
          <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M3 10l14-7-5 14-2-6-7-1z" /></svg>
        </button>
      </div>
    </div>
  );
}

export default function DesktopChatPanel({ onClose, chats = [], chatLoading = false, chatUnread = 0 }) {
  const [activeChat, setActiveChat] = useState(null);

  useEscapeKey(onClose);

  return (
    <>
      <div className="fly-backdrop" onClick={onClose} />
      <div className="chat-panel">
        <div className="chat-master">
          <div className="chat-master-header">
            <h3>Nachrichten</h3>
            {chatUnread > 0 && <span className="chat-unread">{chatUnread}</span>}
            <button className="fly-close" onClick={onClose} aria-label="Schließen">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M5 5l10 10M15 5L5 15" /></svg>
            </button>
          </div>
          <ChatList chats={chats} activeChatId={activeChat?.id} onSelect={setActiveChat} loading={chatLoading} />
        </div>
        <div className="chat-detail">
          <ChatThread chatId={activeChat?.id} chat={activeChat} />
        </div>
      </div>
    </>
  );
}
