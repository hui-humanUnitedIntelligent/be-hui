// ChatPage.jsx — HUI Phase 8
// Echte Supabase Realtime-Chats. Nur für aktive Buchungen.
import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../lib/supabaseClient";
import { useAuth } from "../lib/AuthContext";

const C = {
  teal:"#16D7C5", teal2:"#11C5B7", tealPale:"#E6FAF8",
  coral:"#FF8A6B", coralPale:"#FFF2EE",
  cream:"#F9F6F2", card:"#FFFFFF",
  ink:"#1A1A1A", ink2:"#3A3A3A", muted:"#888", muted2:"#CCC",
  border:"rgba(0,0,0,0.07)",
};

const CSS = `
  @keyframes cpFade{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
  @keyframes cpPulse{0%,100%{opacity:1}50%{opacity:.4}}
  .cp-scroll::-webkit-scrollbar{display:none}
  .cp-scroll{-ms-overflow-style:none;scrollbar-width:none}
  .cp-tap{-webkit-tap-highlight-color:transparent;transition:opacity .15s}
  .cp-tap:active{opacity:.65}
`;

function Avatar({ url, name, size=38 }) {
  if (url) return <img src={url} alt={name}
    style={{ width:size, height:size, borderRadius:"50%", objectFit:"cover", flexShrink:0 }} />;
  return (
    <div style={{ width:size, height:size, borderRadius:"50%", flexShrink:0,
      background:`linear-gradient(135deg,${C.teal}44,${C.coral}44)`,
      display:"flex", alignItems:"center", justifyContent:"center",
      fontWeight:800, fontSize:size*.38, color:C.teal }}>
      {(name||"?")[0].toUpperCase()}
    </div>
  );
}

// ── Chat Thread ───────────────────────────────────────────────────────
function ChatThread({ chat, onBack }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState("");
  const [loading,  setLoading]  = useState(true);
  const [sending,  setSending]  = useState(false);
  const bottomRef = useRef(null);

  const other = chat.other_profile;

  useEffect(() => {
    if (!chat.id) return;
    let mounted = true;

    async function load() {
      const { data } = await supabase
        .from("messages")
        .select("id, text, sender_id, created_at, read")
        .eq("chat_id", chat.id)
        .order("created_at", { ascending: true })
        .limit(100);
      if (mounted) { setMessages(data || []); setLoading(false); }

      // Mark as read
      await supabase.from("messages")
        .update({ read: true })
        .eq("chat_id", chat.id)
        .neq("sender_id", user.id);
    }
    load();

    // Realtime
    const channel = supabase.channel("chat:" + chat.id)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `chat_id=eq.${chat.id}`
      }, (payload) => {
        if (mounted) setMessages(m => [...m, payload.new]);
      })
      .subscribe();

    return () => { mounted = false; supabase.removeChannel(channel); };
  }, [chat.id, user.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    const txt = input.trim();
    if (!txt || sending) return;
    setSending(true);
    setInput("");
    const { error } = await supabase.from("messages").insert({
      chat_id: chat.id, sender_id: user.id, text: txt, read: false
    });
    if (error) console.error("[Chat] send:", error.message);
    // Update chat last_message
    await supabase.from("chats")
      .update({ last_message: txt, last_message_at: new Date().toISOString() })
      .eq("id", chat.id);
    setSending(false);
  }

  return (
    <div style={{ position:"fixed", inset:0, zIndex:500,
      background:C.cream, display:"flex", flexDirection:"column" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 16px 12px",
        background:C.card, borderBottom:`1px solid ${C.border}`,
        display:"flex", alignItems:"center", gap:12 }}>
        <button className="cp-tap" onClick={onBack}
          style={{ background:"rgba(0,0,0,0.06)", border:"none", borderRadius:"50%",
            width:38, height:38, fontSize:17, cursor:"pointer",
            display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
        <Avatar url={other?.avatar_url} name={other?.display_name} size={38} />
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:15, color:C.ink }}>
            {other?.display_name || "Unbekannt"}
          </div>
          <div style={{ fontSize:11, color:C.teal, fontWeight:600 }}>
            {chat.booking_title || "Aktive Buchung"}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="cp-scroll" style={{ flex:1, overflowY:"auto",
        padding:"16px 16px 8px" }}>
        {loading ? (
          <div style={{ textAlign:"center", padding:40, color:C.muted, fontSize:13 }}>
            Lädt…
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign:"center", padding:40 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>💬</div>
            <div style={{ fontSize:14, color:C.muted }}>
              Noch keine Nachrichten.<br/>Schreib das Erste.
            </div>
          </div>
        ) : messages.map((m, i) => {
          const isMe = m.sender_id === user.id;
          const showDate = i === 0 || new Date(m.created_at).toDateString()
            !== new Date(messages[i-1].created_at).toDateString();
          return (
            <div key={m.id} style={{ animation:"cpFade .2s ease both" }}>
              {showDate && (
                <div style={{ textAlign:"center", fontSize:11, color:C.muted2,
                  fontWeight:600, margin:"12px 0 8px" }}>
                  {new Date(m.created_at).toLocaleDateString("de-DE",
                    { weekday:"short", day:"numeric", month:"short" })}
                </div>
              )}
              <div style={{ display:"flex", justifyContent: isMe ? "flex-end" : "flex-start",
                marginBottom:6 }}>
                <div style={{
                  maxWidth:"78%", padding:"10px 14px",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMe
                    ? `linear-gradient(135deg,${C.teal},${C.teal2})`
                    : C.card,
                  border: isMe ? "none" : `1px solid ${C.border}`,
                  boxShadow: isMe
                    ? `0 2px 12px rgba(22,215,197,0.25)`
                    : "0 1px 6px rgba(0,0,0,0.05)",
                }}>
                  <div style={{ fontSize:14, color: isMe ? "white" : C.ink,
                    lineHeight:1.5 }}>{m.text}</div>
                  <div style={{ fontSize:10, marginTop:4, textAlign:"right",
                    color: isMe ? "rgba(255,255,255,0.65)" : C.muted2 }}>
                    {new Date(m.created_at).toLocaleTimeString("de-DE",
                      { hour:"2-digit", minute:"2-digit" })}
                    {isMe && <span style={{ marginLeft:4 }}>{m.read ? " ✓✓" : " ✓"}</span>}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding:"8px 12px max(20px,env(safe-area-inset-bottom,20px))",
        background:C.card, borderTop:`1px solid ${C.border}`,
        display:"flex", gap:8, alignItems:"flex-end" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), send())}
          placeholder="Nachricht…"
          style={{ flex:1, border:`1px solid ${C.border}`, borderRadius:22,
            padding:"11px 16px", fontSize:14, color:C.ink,
            fontFamily:"inherit", outline:"none", background:C.cream,
            resize:"none", maxHeight:100 }}
        />
        <button className="cp-tap" onClick={send}
          disabled={!input.trim() || sending}
          style={{ width:44, height:44, flexShrink:0,
            background: input.trim()
              ? `linear-gradient(135deg,${C.teal},${C.teal2})`
              : "rgba(0,0,0,0.08)",
            border:"none", borderRadius:"50%", cursor:"pointer",
            fontSize:18, display:"flex", alignItems:"center",
            justifyContent:"center", transition:"all .2s",
            color: input.trim() ? "white" : C.muted }}>
          ↑
        </button>
      </div>
    </div>
  );
}

// ── Chat List ─────────────────────────────────────────────────────────
export default function ChatPage({ onClose }) {
  const { user } = useAuth();
  const [chats,   setChats]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [active,  setActive]  = useState(null); // open thread

  const load = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data } = await supabase
        .from("chats")
        .select(`
          id, last_message, last_message_at, booking_title,
          participant_a, participant_b,
          profile_a:profiles!chats_participant_a_fkey(id, display_name, avatar_url, username),
          profile_b:profiles!chats_participant_b_fkey(id, display_name, avatar_url, username)
        `)
        .or(`participant_a.eq.${user.id},participant_b.eq.${user.id}`)
        .order("last_message_at", { ascending: false });

      // Unread count per chat
      const chatIds = (data || []).map(c => c.id);
      let unreadMap = {};
      if (chatIds.length > 0) {
        const { data: unread } = await supabase
          .from("messages")
          .select("chat_id")
          .in("chat_id", chatIds)
          .eq("read", false)
          .neq("sender_id", user.id);
        (unread || []).forEach(m => {
          unreadMap[m.chat_id] = (unreadMap[m.chat_id] || 0) + 1;
        });
      }

      setChats((data || []).map(c => ({
        ...c,
        other_profile: c.participant_a === user.id ? c.profile_b : c.profile_a,
        unread: unreadMap[c.id] || 0,
      })));
    } catch(e) {
      console.error("[ChatPage] load:", e.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { load(); }, [load]);

  // Realtime: new message badge
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel("chats_list")
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "chats"
      }, () => load())
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [user?.id, load]);

  if (active) return (
    <ChatThread chat={active} onBack={() => { setActive(null); load(); }} />
  );

  return (
    <div style={{ position:"fixed", inset:0, zIndex:400,
      background:C.cream, display:"flex", flexDirection:"column" }}>
      <style>{CSS}</style>

      {/* Header */}
      <div style={{ padding:"max(52px,env(safe-area-inset-top,52px)) 20px 16px",
        background:C.card, borderBottom:`1px solid ${C.border}` }}>
        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
          {onClose && (
            <button className="cp-tap" onClick={onClose}
              style={{ background:"rgba(0,0,0,0.06)", border:"none", borderRadius:"50%",
                width:38, height:38, fontSize:17, cursor:"pointer",
                display:"flex", alignItems:"center", justifyContent:"center" }}>←</button>
          )}
          <div>
            <div style={{ fontSize:20, fontWeight:900, color:C.ink }}>Nachrichten</div>
            <div style={{ fontSize:12, color:C.muted }}>
              {chats.filter(c=>c.unread>0).length > 0
                ? `${chats.filter(c=>c.unread>0).length} ungelesen`
                : "Alle gelesen"}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="cp-scroll" style={{ flex:1, overflowY:"auto" }}>
        {loading ? (
          [0,1,2].map(i => (
            <div key={i} style={{ display:"flex", gap:12, padding:"14px 20px",
              borderBottom:`1px solid ${C.border}` }}>
              <div style={{ width:48, height:48, borderRadius:"50%",
                background:"rgba(0,0,0,0.07)", animation:"cpPulse 1.4s infinite" }} />
              <div style={{ flex:1 }}>
                <div style={{ height:14, width:"55%", borderRadius:6, marginBottom:8,
                  background:"rgba(0,0,0,0.07)", animation:"cpPulse 1.4s infinite" }} />
                <div style={{ height:11, width:"80%", borderRadius:5,
                  background:"rgba(0,0,0,0.05)", animation:"cpPulse 1.4s infinite" }} />
              </div>
            </div>
          ))
        ) : chats.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 32px" }}>
            <div style={{ fontSize:40, marginBottom:14 }}>💬</div>
            <div style={{ fontSize:16, fontWeight:700, color:C.ink, marginBottom:8 }}>
              Noch keine Chats
            </div>
            <div style={{ fontSize:13, color:C.muted, lineHeight:1.6 }}>
              Chats entstehen automatisch wenn du eine Buchung startest.
            </div>
          </div>
        ) : chats.map(c => (
          <div key={c.id} className="cp-tap"
            onClick={() => setActive(c)}
            style={{ display:"flex", gap:12, padding:"14px 20px",
              borderBottom:`1px solid ${C.border}`,
              background: c.unread > 0 ? `${C.teal}06` : "transparent",
              cursor:"pointer" }}>
            <div style={{ position:"relative" }}>
              <Avatar url={c.other_profile?.avatar_url}
                name={c.other_profile?.display_name} size={48} />
              {c.unread > 0 && (
                <div style={{ position:"absolute", top:-2, right:-2,
                  width:18, height:18, borderRadius:"50%",
                  background:C.coral, border:"2px solid white",
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:10, fontWeight:800, color:"white" }}>
                  {c.unread > 9 ? "9+" : c.unread}
                </div>
              )}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:"flex", justifyContent:"space-between",
                alignItems:"baseline", marginBottom:3 }}>
                <div style={{ fontWeight: c.unread > 0 ? 800 : 600,
                  fontSize:14, color:C.ink }}>
                  {c.other_profile?.display_name || "Unbekannt"}
                </div>
                <div style={{ fontSize:11, color:C.muted2, flexShrink:0 }}>
                  {c.last_message_at
                    ? new Date(c.last_message_at).toLocaleTimeString("de-DE",
                        { hour:"2-digit", minute:"2-digit" })
                    : ""}
                </div>
              </div>
              {c.booking_title && (
                <div style={{ fontSize:10, color:C.teal, fontWeight:600, marginBottom:2 }}>
                  {c.booking_title}
                </div>
              )}
              <div style={{ fontSize:13, color: c.unread > 0 ? C.ink2 : C.muted,
                overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap",
                fontWeight: c.unread > 0 ? 600 : 400 }}>
                {c.last_message || "Noch keine Nachricht"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
